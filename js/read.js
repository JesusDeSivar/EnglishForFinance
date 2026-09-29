// "Tu texto": paste Money Stuff (or any market text) and read it with jargon highlighted,
// tap-to-translate on every word, read-aloud, and exercises built from the text.

import { NEWSLETTER_URL } from '../data/media.js';
import { S, saveText, deleteText, addXP } from './store.js';
import { annotate, findTerms, exercisesFromText, byId, kindOf, sentences, closePopover } from './text.js';
import { CATS } from '../data/glossary.js';
import { speak, stopSpeaking } from './speech.js';
import { esc, ICON, $, $$ } from './util.js';

// Original sample written for this app in a Money Stuff-like register (it is not Levine's text).
const SAMPLE = `Here is a bond deal. A mid-sized emerging-market sovereign wanted to borrow $2 billion for ten years. Its bankers went out with initial price thoughts around 9.5%, which is a lot of interest, and investors put in orders for $9 billion, which is a lot of orders. So the bonds priced at 8.875%, well inside IPTs, and then traded up two points on the break.

Sure, you could say that the country left some money on the table. If $9 billion of investors wanted the bonds, maybe it could have paid 8.5%. But nobody gets fired for a deal that is four times covered, and the finance minister gets a nice headline. The investors, meanwhile, get a bond that went up on day one. Everyone is happy, which is sort of how new issues are supposed to work: the issuer pays a small concession, the buyers get a small gift, and the bankers get paid for arranging the gift.

Anyway, the fun part is what happens next. The country is still running a big deficit, it still has a maturity wall in 2028, and its IMF program still needs to be approved by the board. If any of that goes wrong, spreads will widen, the bonds will sell off, and the same investors who were so excited about 8.875% will be explaining to their risk committees why they bought so much. I mean, that is the job. You lend money to countries at high yields because sometimes they don't pay you back; if they always paid you back, the yield would be lower. That is not a bug in emerging-market debt. It is, in some sense, the whole point.`;

let draft = '';
let openId = null;

export function renderRead(view, { startPractice }) {
  if (openId) {
    const t = S().texts.find(x => x.id === openId);
    if (t) return renderReader(view, t, { startPractice });
    openId = null;
  }
  const texts = S().texts;
  view.innerHTML = `
    <div class="page read">
      <header class="page-head">
        <h1>Tu texto</h1>
        <p class="muted">Pega lo que estés leyendo y conviértelo en una lección.</p>
      </header>
      <section class="card hero-paste">
        <div class="hero-text">
          <span class="eyebrow">Recomendado</span>
          <h2>Pega el Money Stuff de hoy 📰</h2>
          <p>El newsletter de Matt Levine es <b>gratis</b> por email. Copia el texto del correo y pégalo aquí:
            resaltamos la jerga, te explicamos cada término en español, puedes escuchar cualquier frase
            y te armamos ejercicios con <i>ese</i> texto.</p>
          <div class="row wrap">
            <a class="btn small blue" href="${NEWSLETTER_URL}" target="_blank" rel="noopener">Suscribirme a Money Stuff ${ICON.ext}</a>
            <a class="btn small ghost" href="#/watch">Escuchar el podcast</a>
          </div>
          <p class="muted small">También funciona con notas de research (JPMorgan, Goldman…), transcripciones de Real Yield o noticias de Bloomberg.</p>
        </div>
        <div class="paste-box">
          <textarea class="paste" rows="12" placeholder="Pega aquí el texto en inglés…">${esc(draft)}</textarea>
          <div class="row">
            <button class="btn primary go" ${draft.trim() ? '' : 'disabled'}>Analizar texto</button>
            <button class="btn ghost sample">Probar con un ejemplo</button>
          </div>
        </div>
      </section>
      ${texts.length ? `
        <section>
          <h2 class="section-title">Tus textos</h2>
          <div class="text-list">
            ${texts.map(t => `
              <div class="card text-item">
                <button class="text-open" data-open="${t.id}">
                  <b>${esc(t.title)}</b>
                  <span class="muted small">${new Date(t.at).toLocaleDateString('es', { day: 'numeric', month: 'short' })} · ${t.text.split(/\s+/).length} palabras · ${findTerms(t.text).length} términos</span>
                </button>
                <button class="icon-btn" data-del="${t.id}" title="Borrar" aria-label="Borrar">${ICON.close}</button>
              </div>`).join('')}
          </div>
        </section>` : ''}
    </div>`;

  const ta = $('.paste', view), go = $('.go', view);
  ta.oninput = () => { draft = ta.value; go.disabled = !ta.value.trim(); };
  go.onclick = () => open(ta.value.trim());
  $('.sample', view).onclick = () => open(SAMPLE, 'Ejemplo: una emisión soberana (texto original estilo Money Stuff)');
  view.onclick = e => {
    const o = e.target.closest('[data-open]');
    if (o) { openId = o.dataset.open; renderRead(view, { startPractice }); }
    const d = e.target.closest('[data-del]');
    if (d) { deleteText(d.dataset.del); renderRead(view, { startPractice }); }
  };

  function open(text, title) {
    const first = sentences(text)[0] || text;
    openId = saveText(title || (first.length > 70 ? first.slice(0, 67) + '…' : first), text);
    draft = '';
    addXP(2);
    renderRead(view, { startPractice });
  }
}

function renderReader(view, t, { startPractice }) {
  const terms = findTerms(t.text);
  const fin = terms.filter(x => kindOf(byId[x.id]) === 'fin');
  const idioms = terms.filter(x => kindOf(byId[x.id]) === 'idiom');
  const markers = terms.filter(x => kindOf(byId[x.id]) === 'marker');
  const words = t.text.split(/\s+/).length;
  const nEx = exercisesFromText(t.text).length;
  const paras = t.text.split(/\n\s*\n|\n(?=\S)/).map(p => p.trim()).filter(Boolean);

  const group = (label, list, kind) => list.length ? `
    <div class="term-group">
      <h4><span class="dot k-${kind}"></span>${label} <span class="muted">${list.length}</span></h4>
      <div class="chips">${list.map(x => `<button class="chip-term k-${kind}" data-jump="${x.id}">${esc(byId[x.id].term)}${x.count > 1 ? ` <span class="muted">×${x.count}</span>` : ''}</button>`).join('')}</div>
    </div>` : '';

  view.innerHTML = `
    <div class="page reader">
      <div class="reader-top">
        <button class="btn small ghost back">← Tus textos</button>
        <span class="grow"></span>
        <button class="btn small ghost read-all">${ICON.speaker} Leer en voz alta</button>
        <button class="btn small primary practice" ${nEx ? '' : 'disabled'}>Practicar este texto (${nEx})</button>
      </div>
      <div class="reader-grid">
        <article class="card article">
          <h1 class="article-title">${esc(t.title)}</h1>
          <div class="stats-row">
            <span><b>${words}</b> palabras</span>
            <span><b>${Math.max(1, Math.round(words / 180))}</b> min</span>
            <span><b>${fin.length}</b> términos</span>
            <span><b>${markers.length + idioms.length}</b> tono y modismos</span>
          </div>
          <div class="legend small">
            <span><i class="dot k-fin"></i>jerga financiera</span>
            <span><i class="dot k-idiom"></i>modismo</span>
            <span><i class="dot k-marker"></i>tono / conector</span>
            <span><i class="dot k-saved"></i>tus palabras</span>
            <span class="muted">Toca cualquier palabra para traducirla. ▶ lee el párrafo.</span>
          </div>
          <div class="article-body">
            ${paras.map((p, i) => `
              <div class="para">
                <button class="para-play" data-para="${i}" title="Escuchar párrafo" aria-label="Escuchar párrafo">${ICON.play}</button>
                <p data-ctx-root>${annotate(p, { words: true })}</p>
              </div>`).join('')}
          </div>
        </article>
        <aside class="reader-side">
          <div class="card side-card">
            <h3>En este texto</h3>
            ${group('Jerga financiera', fin, 'fin')}
            ${group('Modismos', idioms, 'idiom')}
            ${group('Tono y conectores', markers, 'marker')}
            ${terms.length ? '' : '<p class="muted small">No encontramos términos del glosario. Aun así puedes tocar cualquier palabra para buscarla y guardarla.</p>'}
          </div>
          <div class="card side-card tip">
            <h3>Cómo leer a Levine</h3>
            <p class="small">Fíjate en los <b>conectores morados</b>: «Sure… but», «anyway», «I mean», «sort of». Ahí está la ironía. Si una frase suena demasiado seria, probablemente es un chiste.</p>
          </div>
        </aside>
      </div>
    </div>`;

  $('.back', view).onclick = () => { openId = null; stopSpeaking(); closePopover(); renderRead(view, { startPractice }); };
  $('.practice', view).onclick = () => startPractice(`Práctica: ${t.title}`, t.text);
  $('.read-all', view).onclick = () => speak(t.text);
  view.onclick = e => {
    const pp = e.target.closest('[data-para]');
    if (pp) {
      $$('.para.playing', view).forEach(n => n.classList.remove('playing'));
      const para = pp.closest('.para');
      para.classList.add('playing');
      speak(paras[+pp.dataset.para], { onend: () => para.classList.remove('playing') });
    }
    const jump = e.target.closest('[data-jump]');
    if (jump) {
      const first = $(`.article-body .term[data-term="${jump.dataset.jump}"]`, view);
      if (first) {
        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        first.classList.add('flash');
        setTimeout(() => { first.classList.remove('flash'); first.click(); }, 700);
      }
    }
  };
}
