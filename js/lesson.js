// Lesson player: runs a list of exercises Duolingo-style (hearts, progress bar,
// check → feedback → continue, wrong answers come back at the end).

import { speak, stopSpeaking } from './speech.js';
import { annotate, byId, kindOf, closePopover } from './text.js';
import { esc, shuffle, pick, ICON, $, $$, fmtTime } from './util.js';
import { addXP, addCards, finishLesson } from './store.js';
import { openReport } from './report.js';

const PRAISE = ['¡Excelente!', '¡Correcto!', '¡Bien hecho!', '¡Así se habla!', '¡Perfecto!', '¡Eso es!'];
const HEARTS = 5;

export function playLesson(root, { title, exercises, lessonId, onExit }) {
  const total = exercises.length;
  const queue = exercises.map(e => ({ ...e, _orig: e }));
  const missed = new Set();
  const t0 = Date.now();
  let hearts = HEARTS, done = 0, current = null, handler = null, phase = 'answer';

  root.innerHTML = `
    <div class="lesson">
      <header class="lesson-top">
        <button class="icon-btn" data-exit aria-label="Salir">${ICON.close}</button>
        <div class="progress" aria-label="Progreso"><div class="progress-bar"></div></div>
        <div class="hearts" title="Vidas"><span class="heart">❤</span><b>${hearts}</b></div>
      </header>
      <main class="lesson-body"><div class="ex-wrap"></div></main>
      <footer class="lesson-foot">
        <div class="foot-inner">
          <div class="feedback" hidden></div>
          <div class="foot-actions">
            <button class="btn ghost skip" hidden title="No puedo escuchar ahora">Saltar audio</button>
            <button class="btn primary main" disabled>Comprobar</button>
          </div>
        </div>
      </footer>
    </div>`;

  const wrap = $('.ex-wrap', root), foot = $('.lesson-foot', root), fb = $('.feedback', root);
  const main = $('.main', root), skip = $('.skip', root), bar = $('.progress-bar', root), heartsEl = $('.hearts b', root);

  const exit = () => { cleanup(); onExit(); };
  root.onclick = e => { if (e.target.closest('[data-exit]')) exit(); };

  main.onclick = () => (phase === 'answer' ? check() : next());
  skip.onclick = () => { done++; progress(); next(); };

  function onKey(e) {
    if (e.key === 'Enter' && !main.disabled && !e.target.matches('.pop-input')) { e.preventDefault(); main.click(); }
    else if (/^[0-9]$/.test(e.key) && phase === 'answer' && !e.target.matches('input')) handler?.key?.(+e.key || 10);
  }
  document.addEventListener('keydown', onKey);
  function cleanup() { document.removeEventListener('keydown', onKey); stopSpeaking(); closePopover(); }

  const progress = () => { bar.style.width = `${(100 * done / total).toFixed(1)}%`; };

  function next() {
    if (hearts <= 0) return fail();
    if (!queue.length) return finish();
    current = queue.shift();
    phase = 'answer';
    foot.classList.remove('ok', 'bad');
    fb.hidden = true;
    main.textContent = 'Comprobar';
    main.disabled = true;
    skip.hidden = !current.say;
    wrap.innerHTML = '<div class="ex enter"></div>';
    handler = RENDER[current.type](current, wrap.firstChild, ready => { if (phase === 'answer') main.disabled = !ready; }, () => check());
  }

  function check() {
    if (phase !== 'answer') return;
    const res = handler.check();
    phase = 'feedback';
    skip.hidden = true;
    if (res.ok) done++;
    else {
      hearts--; heartsEl.textContent = hearts;
      $('.hearts', root).classList.add('lost');
      setTimeout(() => $('.hearts', root)?.classList.remove('lost'), 600);
      missed.add(current._orig);
      queue.push(current);
    }
    progress();
    foot.classList.add(res.ok ? 'ok' : 'bad');
    const chips = (current.terms || []).filter(id => byId[id])
      .map(id => `<span class="term chip-term k-${kindOf(byId[id])}" data-term="${id}" tabindex="0">${esc(byId[id].term)}</span>`).join('');
    fb.innerHTML = `
      <div class="fb-title">${res.ok ? pick(PRAISE, 1)[0] : 'Respuesta correcta:'}</div>
      ${!res.ok && res.answer ? `<div class="fb-answer">${esc(res.answer)}</div>` : ''}
      ${current.say ? `<div class="fb-said"><button class="speak sm" data-say="${esc(current.say)}" aria-label="Escuchar">${ICON.speaker}</button>«${esc(current.say)}»</div>` : ''}
      ${current.explain ? `<p class="fb-explain">${esc(current.explain)}</p>` : ''}
      ${chips ? `<div class="fb-terms">${chips}</div>` : ''}
      <button class="flag-btn" data-report>🚩 ¿Corrección equivocada?</button>`;
    fb.hidden = false;
    main.textContent = 'Continuar';
    main.disabled = false;
    main.focus({ preventScroll: true });

    const ex = current, orig = current._orig;
    $('[data-report]', fb).onclick = () => openReport({
      source: lessonId ? 'lesson' : 'practice',
      lessonId, lessonTitle: title, exerciseIndex: exercises.indexOf(orig),
      exercise: {
        type: ex.type, prompt: ex.prompt || (ex.type === 'match' ? 'Toca los pares' : ''), quote: ex.quote, say: ex.say,
        options: ex.options || ex.pairs?.map(p => p.join(' = ')), expected: res.answer || ex.pairs?.map(p => p.join(' = ')).join(' · '),
        given: res.given, ok: res.ok, explain: ex.explain,
      },
      // Benefit of the doubt: a reported "my answer was right" gets the heart back.
      onSaved: reason => {
        if (reason !== 'marked_wrong' || res.ok || phase !== 'feedback' || current !== ex) return;
        hearts++; heartsEl.textContent = hearts;
        missed.delete(orig);
        queue.splice(queue.lastIndexOf(ex), 1);
        done++; progress();
        foot.classList.replace('bad', 'ok');
        $('.fb-title', fb).textContent = 'Anotado. Te devolvimos la vida ❤';
        $('[data-report]', fb).remove();
      },
    });
  }

  function finish() {
    cleanup();
    const acc = Math.round(100 * (total - missed.size) / total);
    const xp = 10 + (missed.size === 0 ? 5 : 0);
    addXP(xp);
    if (lessonId) finishLesson(lessonId, acc);
    const added = addCards([...new Set(exercises.flatMap(e => e.terms || []))].filter(id => byId[id]));
    root.innerHTML = `
      <div class="lesson-end">
        <div class="end-badge">${missed.size === 0 ? '🏆' : '🎉'}</div>
        <h1>¡Lección completada!</h1>
        <p class="muted">${esc(title)}</p>
        <div class="end-stats">
          <div class="stat-box yellow"><span>XP total</span><b>+${xp}</b></div>
          <div class="stat-box green"><span>${acc === 100 ? 'Perfecto' : 'Precisión'}</span><b>${acc}%</b></div>
          <div class="stat-box blue"><span>Tiempo</span><b>${fmtTime((Date.now() - t0) / 1000)}</b></div>
        </div>
        ${added ? `<p class="end-note">🔁 ${added} término${added > 1 ? 's' : ''} nuevo${added > 1 ? 's' : ''} en tu repaso.</p>` : ''}
        <button class="btn primary big" data-exit>Continuar</button>
      </div>`;
    $('[data-exit]', root).focus();
  }

  function fail() {
    cleanup();
    root.innerHTML = `
      <div class="lesson-end">
        <div class="end-badge">💔</div>
        <h1>Te quedaste sin vidas</h1>
        <p class="muted">Los errores son parte del proceso. Repasa las explicaciones y vuelve a intentarlo.</p>
        <div class="end-actions">
          <button class="btn primary big" data-retry>Intentar de nuevo</button>
          <button class="btn ghost big" data-exit>Salir</button>
        </div>
      </div>`;
    $('[data-retry]', root).onclick = () => playLesson(root, { title, exercises, lessonId, onExit });
  }

  progress();
  next();
  return cleanup;
}

// ---------- exercise renderers ----------
// Each gets (exercise, container, ready(bool), autoCheck) and returns { check() -> {ok, answer}, key?(n) }.

const audioHTML = say => `
  <div class="audio-row">
    <button class="audio-btn" data-say="${esc(say)}" aria-label="Escuchar">${ICON.speaker}</button>
    <button class="audio-btn slow" data-say="${esc(say)}" data-rate="0.65" aria-label="Escuchar lento">${ICON.turtle}</button>
  </div>`;

// Quotes stay plain until answered, so the glossary popover can't give the answer away.
const quoteHTML = q => `
  <figure class="quote">
    <button class="speak" data-say="${esc(q.replace(/_+/g, 'blank'))}" aria-label="Escuchar">${ICON.speaker}</button>
    <blockquote>${esc(q)}</blockquote>
  </figure>`;
const revealQuote = (box, q) => { const b = $('.quote blockquote', box); if (b) b.innerHTML = annotate(q); };

const autoplay = ex => { if (ex.say) setTimeout(() => speak(ex.say), 300); };

function mc(ex, box, ready) {
  const order = ex.fixed ? ex.options.map((_, i) => i) : shuffle(ex.options.map((_, i) => i));
  box.innerHTML = `
    <h2 class="ex-title">${esc(ex.prompt)}</h2>
    ${ex.say ? audioHTML(ex.say) : ''}
    ${ex.quote ? quoteHTML(ex.quote) : ''}
    ${ex.type === 'curve' ? curveSVG(ex.before, ex.after) : ''}
    <div class="options ${ex.options.length === 4 && ex.options.every(o => o.length < 22) ? 'grid2' : ''}">
      ${order.map((o, k) => `<button class="option" data-i="${o}"><kbd>${k + 1}</kbd><span>${esc(ex.options[o])}</span></button>`).join('')}
    </div>`;
  const opts = $$('.option', box);
  let sel = null;
  const choose = el => { opts.forEach(o => o.classList.toggle('selected', o === el)); sel = +el.dataset.i; ready(true); };
  opts.forEach(o => { o.onclick = () => choose(o); });
  autoplay(ex);
  return {
    key: n => opts[n - 1] && choose(opts[n - 1]),
    check() {
      opts.forEach(o => {
        o.disabled = true;
        if (+o.dataset.i === ex.answer) o.classList.add('correct');
        else if (o.classList.contains('selected')) o.classList.add('wrong');
      });
      if (ex.quote) revealQuote(box, ex.quote);
      return { ok: sel === ex.answer, answer: ex.options[ex.answer], given: ex.options[sel] };
    },
  };
}

function curveSVG(before, after) {
  const W = 560, H = 250, L = 48, R = 24, T = 22, B = 40;
  const all = [...before, ...after];
  const lo = Math.floor((Math.min(...all) - 0.1) * 20) / 20, hi = Math.ceil((Math.max(...all) + 0.1) * 20) / 20;
  const anchor = i => (i === 0 ? 'start' : i === 3 ? 'end' : 'middle');
  const nudge = i => (i === 0 ? -6 : i === 3 ? 6 : 0);
  const x = i => L + i * (W - L - R) / 3;
  const y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const path = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const ticks = Array.from({ length: 5 }, (_, k) => lo + k * (hi - lo) / 4);
  const tenors = ['2 años', '5 años', '10 años', '30 años'];
  return `
    <figure class="curve">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva de rendimientos antes y después">
        ${ticks.map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v.toFixed(2)}%</text>`).join('')}
        ${tenors.map((t, i) => `<text class="axis" x="${x(i)}" y="${H - 12}" text-anchor="middle">${t}</text>`).join('')}
        <path class="before" d="${path(before)}"/>
        ${before.map((v, i) => `<circle class="before-dot" cx="${x(i)}" cy="${y(v)}" r="4"/>`).join('')}
        <path class="after" d="${path(after)}"/>
        ${after.map((v, i) => {
          const d = Math.round((v - before[i]) * 100);
          const up = v >= before[i];
          return `<circle class="after-dot" cx="${x(i)}" cy="${y(v)}" r="5"/>
            <text class="delta ${up ? 'up' : 'down'}" x="${x(i) + nudge(i)}" y="${y(v) + (up ? -12 : 20)}" text-anchor="${anchor(i)}">${d > 0 ? '+' : ''}${d} pb</text>`;
        }).join('')}
      </svg>
      <figcaption><span class="lg before-lg"></span>Antes <span class="lg after-lg"></span>Después · rendimientos por plazo</figcaption>
    </figure>`;
}

function match(ex, box, ready, autoCheck) {
  const left = shuffle(ex.pairs.map((p, i) => ({ i, t: p[0] })));
  const right = shuffle(ex.pairs.map((p, i) => ({ i, t: p[1] })));
  const col = (items, side) => items.map((x, k) => `<button class="option match-item" data-side="${side}" data-i="${x.i}"><kbd>${side === 'l' ? k + 1 : k + 1 + items.length}</kbd><span>${esc(x.t)}</span></button>`).join('');
  box.innerHTML = `
    <h2 class="ex-title">Toca los pares</h2>
    <div class="match"><div class="col">${col(left, 'l')}</div><div class="col">${col(right, 'r')}</div></div>`;
  const items = $$('.match-item', box);
  let sel = { l: null, r: null }, matched = 0;
  const pickItem = el => {
    if (el.disabled) return;
    const side = el.dataset.side;
    if (side === 'l') speak(el.textContent.replace(/^\d+/, ''));
    sel[side]?.classList.remove('selected');
    sel[side] = sel[side] === el ? null : el;
    sel[side]?.classList.add('selected');
    if (sel.l && sel.r) {
      const a = sel.l, b = sel.r;
      sel = { l: null, r: null };
      if (a.dataset.i === b.dataset.i) {
        [a, b].forEach(n => { n.classList.remove('selected'); n.classList.add('paired'); n.disabled = true; });
        if (++matched === ex.pairs.length) { ready(true); setTimeout(autoCheck, 350); }
      } else {
        [a, b].forEach(n => { n.classList.remove('selected'); n.classList.add('wrong'); });
        setTimeout(() => [a, b].forEach(n => n.classList.remove('wrong')), 500);
      }
    }
  };
  items.forEach(el => { el.onclick = () => pickItem(el); });
  return {
    key: n => { const el = items.find(i => i.querySelector('kbd').textContent === String(n)); el && pickItem(el); },
    check: () => ({ ok: true, answer: '' }),
  };
}

const normalize = s => s.toLowerCase().replace(/[’']/g, "'").replace(/[.,;:!?"“”]/g, '').replace(/\s+/g, ' ').trim();

function build(ex, box, ready) {
  const tiles = shuffle([...ex.answer, ...(ex.extra || [])].map((t, i) => ({ t, i })));
  box.innerHTML = `
    <h2 class="ex-title">${ex.say ? esc(ex.prompt) : 'Escribe esto en inglés'}</h2>
    ${ex.say ? audioHTML(ex.say) : `<div class="build-prompt"><span class="bubble">${esc(ex.prompt)}</span></div>`}
    <div class="build-answer"></div>
    <div class="build-bank">${tiles.map(x => `<button class="tile" data-i="${x.i}">${esc(x.t)}</button>`).join('')}</div>`;
  const ans = $('.build-answer', box);
  const bank = $$('.build-bank .tile', box);
  let locked = false;
  const sync = () => ready(ans.children.length > 0);
  bank.forEach(t => {
    t.onclick = () => {
      if (locked || t.classList.contains('used')) return;
      t.classList.add('used');
      const c = document.createElement('button');
      c.className = 'tile'; c.textContent = t.textContent; c.dataset.i = t.dataset.i;
      c.onclick = () => { if (locked) return; c.remove(); t.classList.remove('used'); sync(); };
      ans.appendChild(c);
      sync();
    };
  });
  autoplay(ex);
  return {
    check() {
      locked = true;
      const given = $$('.tile', ans).map(t => t.textContent).join(' ');
      const ok = [ex.answer, ...(ex.alts || [])].some(a => normalize(a.join(' ')) === normalize(given));
      ans.classList.add(ok ? 'correct' : 'wrong');
      return { ok, answer: ex.answer.join(' '), given };
    },
  };
}

function input(ex, box, ready) {
  box.innerHTML = `
    <h2 class="ex-title">${esc(ex.prompt)}</h2>
    ${ex.say ? audioHTML(ex.say) : ''}
    ${ex.quote ? quoteHTML(ex.quote) : ''}
    <input class="text-answer" ${ex.numeric ? 'inputmode="decimal"' : ''} autocomplete="off" autocapitalize="off" spellcheck="false"
      placeholder="${ex.numeric ? 'Escribe un número' : 'Escribe en inglés'}" aria-label="Tu respuesta">`;
  const inp = $('.text-answer', box);
  inp.oninput = () => ready(inp.value.trim().length > 0);
  setTimeout(() => inp.focus({ preventScroll: true }), ex.say ? 400 : 50);
  autoplay(ex);
  return {
    check() {
      inp.disabled = true;
      let ok;
      if (ex.numeric) {
        const v = parseFloat(inp.value.replace(',', '.').replace(/[^\d.-]/g, ''));
        ok = Math.abs(v - ex.answer) <= (ex.tol ?? 1e-9);
      } else {
        ok = ex.answer.some(a => normalize(a) === normalize(inp.value));
      }
      inp.classList.add(ok ? 'correct' : 'wrong');
      if (ex.quote) revealQuote(box, ex.quote);
      return { ok, answer: ex.numeric ? String(ex.answer) : ex.answer[0], given: inp.value.trim() };
    },
  };
}

const RENDER = { mc, curve: mc, match, build, input };
