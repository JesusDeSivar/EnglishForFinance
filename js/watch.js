// Watch & listen: official Bloomberg YouTube embeds + an interactive transcript
// (click a line to jump, loop a sentence, blur the text to train your ear).

import { SHOWS } from '../data/media.js';
import { S, saveTranscript } from './store.js';
import { annotate, findTerms, exercisesFromText, sentences, closePopover } from './text.js';
import { getTranscript, getEpisodes } from './api.js';
import { esc, ICON, $, $$, fmtTime } from './util.js';

let ytReady = null;
let picked = false;          // the user chose a video this session: don't switch it for them
const fetched = new Map(); // videoId -> segments from the server (kept for this session)

const toRaw = segs => segs.map(s => (s.t != null ? `${fmtTime(s.t)}\n${s.text}` : s.text)).join('\n');

// Captions come in 2–4 second fragments; join them into sentence-sized lines.
function mergeLines(parsed) {
  const out = [];
  for (const l of parsed) {
    const prev = out[out.length - 1];
    const open = prev && prev.t != null && l.t != null && !/[.!?]["”’)]?$/.test(prev.text) && prev.text.length < 110;
    if (open) prev.text += ' ' + l.text;
    else out.push({ ...l });
  }
  return out;
}
let last = { v: SHOWS[0].episodes[0].v, title: SHOWS[0].episodes[0].title, show: SHOWS[0].name };

function loadYT() {
  if (!ytReady) {
    ytReady = new Promise(resolve => {
      if (window.YT?.Player) return resolve();
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    });
  }
  return ytReady;
}

const fmtDate = d => {
  if (!d) return '';
  const date = new Date(d + 'T12:00');
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short', ...(date.getFullYear() !== new Date().getFullYear() && { year: 'numeric' }) });
};

// "US Yields Surge… | Real Yield 9/10/2026" → "US Yields Surge…" (the date is shown separately).
export const shortTitle = t => t.replace(/\s*\|\s*(?:Bloomberg\s+)?(?:Real Yield|The Close|Money Stuff)\b[^|]*$/i, '').trim() || t;

function sourceHTML(show, list) {
  const saved = S().transcripts;
  return `
    <div class="card source">
      <div class="source-head">
        <span class="source-icon">${show.kind === 'podcast' ? '🎙️' : '📺'}</span>
        <div><h3>${esc(show.name)}</h3><p class="muted small">${esc(show.by)}</p></div>
      </div>
      <p class="small">${esc(show.blurb)}</p>
      <div class="episodes">
        ${list.map(e => `
          <button class="episode" data-v="${e.v}" data-title="${esc(shortTitle(e.title))}" data-show="${esc(show.name)}">
            <span class="ep-play">${ICON.play}</span>
            <span class="ep-title">${esc(shortTitle(e.title))}</span>
            ${saved[e.v] ? '<span class="ep-badge">📝</span>' : ''}
            <span class="ep-date">${fmtDate(e.date)}</span>
          </button>`).join('')}
        <a class="episode latest" href="${show.more}" target="_blank" rel="noopener">
          <span class="ep-play">${ICON.ext}</span><span class="ep-title">Ver todos en YouTube</span>
        </a>
      </div>
      ${show.spotify ? `
        <details class="spotify">
          <summary>Solo audio: Spotify / Apple Podcasts</summary>
          <iframe loading="lazy" title="Money Stuff en Spotify" src="https://open.spotify.com/embed/show/${show.spotify}?utm_source=generator&theme=0"
            height="232" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
          <a class="small" href="${show.apple}" target="_blank" rel="noopener">Abrir en Apple Podcasts ${ICON.ext}</a>
        </details>` : ''}
    </div>`;
}

export function parseTranscript(raw) {
  const lines = raw.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  const TS = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;
  const TS_INLINE = /^((?:\d{1,2}:)?\d{1,2}:\d{2})\s+(.+)$/;
  const CUE = /^(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}\s+-->/;
  const NOISE = /^(WEBVTT|NOTE\b|Kind:|Language:)|^\d+$|^\d+\s+(seconds?|minutes?|hours?)(,\s*\d+\s+(seconds?|minutes?))*$/i;
  const toSec = s => s.split(':').reduce((a, p) => a * 60 + parseFloat(p.replace(',', '.')), 0);

  if (!lines.some(l => TS.test(l) || TS_INLINE.test(l) || CUE.test(l))) {
    return sentences(raw).map(text => ({ t: null, text }));
  }
  const out = [];
  let t = null;
  for (const l of lines) {
    let m;
    if (NOISE.test(l)) continue;
    if (CUE.test(l)) { t = toSec(l.split('-->')[0].trim()); continue; }
    if (TS.test(l)) { t = toSec(l); continue; }
    if ((m = l.match(TS_INLINE))) { out.push({ t: toSec(m[1]), text: m[2] }); t = null; continue; }
    const text = l.replace(/<[^>]+>/g, '');
    if (t !== null) { out.push({ t, text }); t = null; }
    else if (out.length) out[out.length - 1].text += ' ' + text;
    else out.push({ t: null, text });
  }
  return out;
}

export function renderWatch(view, { startPractice }) {
  let player = null, timer = null, loopEnd = null, nowIdx = -1, lines = [];
  let cur = { ...last };

  view.innerHTML = `
    <div class="page watch">
      <header class="page-head">
        <h1>Ver y escuchar</h1>
        <p class="muted">Programas oficiales de Bloomberg con subtítulos, velocidad ajustable y una transcripción interactiva.</p>
      </header>
      <div class="watch-grid">
        <section class="player-col">
          <div class="card player-card">
            <div class="player-frame"><div id="yt"></div></div>
            <div class="player-bar">
              <div class="now"><b class="now-title"></b><span class="muted small now-show"></span></div>
              <div class="speeds" role="group" aria-label="Velocidad">
                ${[0.75, 1, 1.25].map(r => `<button class="pill ${r === 1 ? 'on' : ''}" data-speed="${r}">${r}×</button>`).join('')}
              </div>
              <a class="pill yt-link" target="_blank" rel="noopener">YouTube ${ICON.ext}</a>
            </div>
          </div>
          <div class="sources">
            <div class="show-cards"></div>
            <p class="muted small list-note"></p>
            <form class="card url-form">
              <h3>¿Otro video?</h3>
              <p class="muted small">Pega un link de YouTube: entrevistas de Bloomberg, conferencias de la Fed, Odd Lots…</p>
              <div class="row"><input placeholder="https://www.youtube.com/watch?v=…" aria-label="Link de YouTube"><button class="btn small primary">Cargar</button></div>
            </form>
          </div>
        </section>
        <aside class="card transcript-col">
          <div class="tr-head">
            <h2>Transcripción</h2>
            <div class="tr-tools">
              <label class="switch"><input type="checkbox" class="follow" checked><span></span>Seguir</label>
              <label class="switch" title="Oculta el texto: escucha primero, revela después"><input type="checkbox" class="blur"><span></span>Modo escucha</label>
            </div>
          </div>
          <div class="tr-body"></div>
        </aside>
      </div>
    </div>`;

  const body = $('.tr-body', view);

  // Built-in episodes first, then swap in the live list when it arrives.
  function drawSources(data) {
    $('.show-cards', view).innerHTML = SHOWS.map(s => sourceHTML(s, data?.shows?.[s.id]?.length ? data.shows[s.id] : s.episodes)).join('');
    $('.list-note', view).textContent = data?.generatedAt
      ? `Lista actualizada ${new Date(data.generatedAt).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`
      : '';
    $$('.episode', view).forEach(b => b.classList.toggle('on', b.dataset.v === cur.v));
  }

  function setNow() {
    $('.now-title', view).textContent = shortTitle(cur.title || '') || 'Video de YouTube';
    $('.now-show', view).textContent = cur.show || '';
    $('.yt-link', view).href = `https://www.youtube.com/watch?v=${cur.v}`;
    $$('.episode', view).forEach(b => b.classList.toggle('on', b.dataset.v === cur.v));
    last = { ...cur };
  }

  // A transcript you pasted or edited wins; otherwise ask the server to fetch YouTube's captions.
  function renderTranscript() {
    closePopover();
    nowIdx = -1; loopEnd = null; lines = [];
    const pasted = S().transcripts[cur.v];
    if (pasted) return showLines(parseTranscript(pasted), 'pasted');
    if (fetched.has(cur.v)) return showLines(fetched.get(cur.v), 'auto');
    body.innerHTML = `<div class="tr-loading"><span class="spinner"></span>Buscando la transcripción en YouTube…</div>`;
    const v = cur.v;
    getTranscript(v)
      .then(data => { fetched.set(v, data.segments); if (cur.v === v && view.isConnected) renderTranscript(); })
      .catch(err => { if (cur.v === v && view.isConnected) showPaste(err); });
  }

  function showPaste(err) {
    const lead = err.code === 'NO_SERVER'
      ? `<p class="tr-lead"><b>Esta versión web no puede traer transcripciones.</b> Las transcripciones automáticas necesitan el servidor de la app, que corre en tu PC.</p>
         <div class="tip-box small">
           <b>En el celular:</b> en tu PC ejecuta <code>npm run phone</code> y abre en el celular la dirección que aparece
           (misma red Wi-Fi). Todo funciona igual que en la PC, incluida la bitácora.
         </div>
         <p class="muted small">Mientras tanto, el video muestra subtítulos en inglés (CC). También puedes pegar la transcripción a mano:</p>`
      : `<p class="tr-lead"><b>No pudimos traer la transcripción automáticamente.</b> <span class="muted small">(${esc(err.message)})</span></p>
         <p class="muted small">El video igual muestra subtítulos en inglés (CC). Para la versión interactiva, pégala a mano:</p>`;
    body.innerHTML = `
      <div class="tr-empty">
        ${lead}
        <ol class="steps">
          <li>Abre el video en <a href="https://www.youtube.com/watch?v=${cur.v}" target="_blank" rel="noopener">YouTube ${ICON.ext}</a>.</li>
          <li>En la descripción, haz clic en <b>…más</b> y luego en <b>Mostrar transcripción</b>.</li>
          <li>Selecciona el texto del panel, de la primera a la última línea, y cópialo (Ctrl+C).</li>
          <li>Pégalo aquí. Se guarda para este video.</li>
        </ol>
        <textarea class="tr-input" rows="7" placeholder="0:00&#10;welcome to Bloomberg Real Yield…&#10;0:04&#10;…"></textarea>
        <div class="row">
          <button class="btn primary save-tr" disabled>Guardar transcripción</button>
          <button class="btn ghost retry">Reintentar</button>
        </div>
        <p class="muted small">También acepta subtítulos .vtt/.srt o texto sin marcas de tiempo.</p>
      </div>`;
    const ta = $('.tr-input', body), btn = $('.save-tr', body);
    ta.oninput = () => { btn.disabled = !ta.value.trim(); };
    btn.onclick = () => { saveTranscript(cur.v, ta.value); renderTranscript(); refreshBadges(); };
    $('.retry', body).onclick = renderTranscript;
  }

  function showLines(parsed, source) {
    lines = mergeLines(parsed);
    const raw = source === 'pasted' ? S().transcripts[cur.v] : toRaw(parsed);
    // Auto-captions often lack punctuation: treat each line as its own sentence.
    const all = lines.map(l => /[.!?]["”’)]?$/.test(l.text) ? l.text : l.text + '.').join(' ');
    const terms = findTerms(all);
    const nEx = exercisesFromText(all).length;
    body.innerHTML = `
      <div class="tr-toolbar">
        <span class="src-badge ${source}">${source === 'auto' ? 'Automática · YouTube' : 'Tu versión'}</span>
        <span class="muted small">${lines.length} líneas · <b>${terms.length}</b> términos</span>
        <span class="grow"></span>
        <button class="btn small primary practice" ${nEx ? '' : 'disabled'}>Practicar (${nEx})</button>
        <button class="btn small ghost edit" title="Corrige errores de los subtítulos">Editar</button>
      </div>
      <div class="tr-lines ${$('.blur', view).checked ? 'blurred' : ''}">
        ${lines.map((l, i) => `
          <div class="tline" data-i="${i}">
            ${l.t != null ? `<button class="ts" title="Ir a este momento">${fmtTime(l.t)}</button>` : '<span class="ts-none"></span>'}
            <span class="tx" data-ctx-root>${annotate(l.text, { words: true })}</span>
            ${l.t != null ? `<button class="loop icon-btn" title="Repetir esta frase" aria-label="Repetir">${ICON.repeat}</button>` : ''}
          </div>`).join('')}
      </div>`;
    $('.practice', body).onclick = () => startPractice(`Transcripción: ${cur.title || 'video'}`, all);
    $('.edit', body).onclick = () => {
      body.innerHTML = `
        <div class="tr-empty">
          <p class="muted small">${source === 'auto'
            ? 'Corrige lo que los subtítulos entendieron mal. Al guardar, tu versión reemplaza a la automática en este video.'
            : 'Esta es tu versión. Si la borras, volvemos a la transcripción automática de YouTube.'}</p>
          <textarea class="tr-input" rows="14">${esc(raw)}</textarea>
          <div class="row wrap">
            <button class="btn primary save-tr">Guardar</button>
            <button class="btn ghost cancel-tr">Cancelar</button>
            ${source === 'pasted' ? '<button class="btn ghost del-tr">Borrar mi versión</button>' : ''}
          </div>
        </div>`;
      $('.save-tr', body).onclick = () => { saveTranscript(cur.v, $('.tr-input', body).value.trim()); renderTranscript(); refreshBadges(); };
      $('.cancel-tr', body).onclick = renderTranscript;
      $('.del-tr', body)?.addEventListener('click', () => { saveTranscript(cur.v, null); renderTranscript(); refreshBadges(); });
    };
  }

  function refreshBadges() {
    $$('.episode[data-v]', view).forEach(b => {
      const has = !!S().transcripts[b.dataset.v];
      const badge = $('.ep-badge', b);
      if (has && !badge) $('.ep-title', b).insertAdjacentHTML('afterend', '<span class="ep-badge">📝</span>');
      if (!has && badge) badge.remove();
    });
  }

  // Transcript interactions
  body.addEventListener('click', e => {
    const line = e.target.closest('.tline');
    if (!line) return;
    const l = lines[+line.dataset.i];
    if (e.target.closest('.ts') && l.t != null) { loopEnd = null; seek(l.t); }
    else if (e.target.closest('.loop') && l.t != null) {
      const nextT = lines.slice(+line.dataset.i + 1).find(x => x.t != null)?.t;
      loopEnd = nextT ?? l.t + 6;
      seek(l.t);
    } else if ($('.tr-lines.blurred', body) && !e.target.closest('.term, .w')) line.classList.toggle('reveal');
  });
  $('.blur', view).onchange = e => $('.tr-lines', body)?.classList.toggle('blurred', e.target.checked);

  function seek(t) {
    if (!player?.seekTo) return;
    player.seekTo(Math.max(0, t - 0.2), true);
    player.playVideo();
  }

  function tick() {
    if (!player?.getCurrentTime || !lines.length) return;
    const t = player.getCurrentTime();
    if (loopEnd != null && t >= loopEnd) { player.pauseVideo(); loopEnd = null; }
    let idx = -1;
    for (let i = 0; i < lines.length; i++) { if (lines[i].t != null && lines[i].t <= t + 0.15) idx = i; else if (lines[i].t > t) break; }
    if (idx === nowIdx) return;
    $$('.tline.now', body).forEach(n => n.classList.remove('now'));
    nowIdx = idx;
    const el = $(`.tline[data-i="${idx}"]`, body);
    if (!el) return;
    el.classList.add('now');
    const box = $('.tr-lines', body);
    if ($('.follow', view).checked && box) box.scrollTo({ top: el.offsetTop - box.clientHeight / 3, behavior: 'smooth' });
  }

  function load({ v, list, title, show }, autoplay = true) {
    cur = { v: v || cur.v, title: title || '', show: show || '' };
    setNow();
    if (v) renderTranscript();
    if (!player?.loadVideoById) return;
    if (list) autoplay ? player.loadPlaylist({ list, listType: 'playlist' }) : player.cuePlaylist({ list, listType: 'playlist' });
    else autoplay ? player.loadVideoById(v) : player.cueVideoById(v);
  }

  // Playlists don't tell us which video is playing until it loads, so sync from the player.
  function syncFromPlayer() {
    const d = player?.getVideoData?.();
    if (!d?.video_id || d.video_id === cur.v) return;
    cur = { v: d.video_id, title: d.title, show: cur.show };
    setNow(); renderTranscript();
  }

  view.addEventListener('click', e => {
    const ep = e.target.closest('.episode[data-v]');
    if (ep) {
      picked = true;
      load({ v: ep.dataset.v, title: ep.dataset.title, show: ep.dataset.show });
      if (innerWidth < 1000) $('.player-card', view).scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const sp = e.target.closest('[data-speed]');
    if (sp && player?.setPlaybackRate) {
      player.setPlaybackRate(+sp.dataset.speed);
      $$('[data-speed]', view).forEach(b => b.classList.toggle('on', b === sp));
    }
  });

  $('.url-form', view).onsubmit = e => {
    e.preventDefault();
    const input = $('input', e.target);
    const m = input.value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/) || input.value.match(/^([\w-]{11})$/);
    const list = input.value.match(/[?&]list=([\w-]+)/);
    if (!m && !list) { input.classList.add('shake'); setTimeout(() => input.classList.remove('shake'), 500); return; }
    picked = true;
    if (m) load({ v: m[1], title: 'Video de YouTube', show: 'Tu link' });
    else load({ list: list[1], show: 'Tu lista' });
    input.value = '';
  };

  drawSources(null);
  setNow();
  renderTranscript();

  // Live list: redraw, and start on the newest Real Yield unless the user already chose something.
  getEpisodes().then(data => {
    if (!data || !view.isConnected) return;
    drawSources(data);
    const newest = data.shows?.[SHOWS[0].id]?.[0];
    const playing = player?.getPlayerState?.() === 1;
    if (!picked && newest && newest.v !== cur.v && !playing) {
      cur = { v: newest.v, title: shortTitle(newest.title), show: SHOWS[0].name };
      setNow();
      renderTranscript();
      player?.cueVideoById?.(newest.v);
    }
  });

  loadYT().then(() => {
    if (!view.isConnected) return;
    player = new YT.Player('yt', {
      width: '100%', height: '100%', videoId: cur.v,
      // No hl=es: YouTube would auto-translate titles into Spanish, and we want the English.
      playerVars: { playsinline: 1, rel: 0, cc_load_policy: 1, cc_lang_pref: 'en', hl: 'en', origin: location.origin },
      events: { onStateChange: syncFromPlayer },
    });
    timer = setInterval(tick, 250);
  });

  return () => { clearInterval(timer); try { player?.destroy(); } catch { /* already gone */ } };
}
