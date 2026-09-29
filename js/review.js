// Spaced-repetition review and the searchable glossary.

import { GLOSSARY, CATS } from '../data/glossary.js';
import { S, dueCards, grade, nextBox, intervalLabel, hasCard, addCards, removeCard, addXP, save } from './store.js';
import { byId, kindOf, annotate } from './text.js';
import { speak } from './speech.js';
import { esc, shuffle, ICON, $, $$ } from './util.js';

function cardData(id) {
  if (id.startsWith('w:')) {
    const w = S().words[id.slice(2)];
    return w && { term: w.term, es: w.note || 'Sin traducción todavía: agrégala desde el texto o el glosario.', def: '', ex: w.ctx, cat: 'Tus palabras', kind: 'saved' };
  }
  const g = byId[id];
  return g && { term: g.term, es: g.es, def: g.def, ex: g.ex, cat: CATS[g.cat].label, kind: kindOf(g) };
}

export function renderReview(view) {
  const due = dueCards().filter(cardData);
  const all = Object.keys(S().cards).filter(cardData);
  if (due.length) return session(view, shuffle(due).slice(0, 20));

  const nextDue = Math.min(...Object.values(S().cards).map(c => c.due));
  view.innerHTML = `
    <div class="page review">
      <header class="page-head"><h1>Repaso</h1></header>
      <div class="card empty-state">
        <div class="big-emoji">${all.length ? '🎯' : '🌱'}</div>
        <h2>${all.length ? '¡Estás al día!' : 'Tu mazo está vacío'}</h2>
        <p class="muted">${all.length
          ? `Tienes <b>${all.length}</b> tarjetas. La próxima te toca ${new Date(nextDue).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}.`
          : 'Las tarjetas aparecen solas cuando terminas lecciones, o cuando tocas «Añadir a repaso» en cualquier término.'}</p>
        <div class="row center">
          ${all.length ? '<button class="btn primary anyway">Repasar 10 al azar</button>' : '<a class="btn primary" href="#/learn">Empezar una lección</a>'}
          <a class="btn ghost" href="#/glossary">Explorar el glosario</a>
        </div>
      </div>
    </div>`;
  $('.anyway', view)?.addEventListener('click', () => session(view, shuffle(all).slice(0, 10), true));
}

function session(view, ids, practice = false) {
  const queue = [...ids];
  const seen = new Set();
  let flipped = false, id = null;

  view.innerHTML = `
    <div class="page review">
      <div class="review-top">
        <a class="icon-btn" href="#/learn" aria-label="Salir">${ICON.close}</a>
        <div class="progress"><div class="progress-bar"></div></div>
        <span class="muted small count"></span>
      </div>
      <div class="flashcard-wrap"></div>
    </div>`;
  const wrap = $('.flashcard-wrap', view);

  function show() {
    if (!queue.length) return done();
    id = queue[0];
    flipped = false;
    const c = cardData(id);
    $('.progress-bar', view).style.width = `${100 * seen.size / ids.length}%`;
    $('.count', view).textContent = `${queue.length} restantes`;
    wrap.innerHTML = `
      <div class="card flashcard">
        <span class="chip k-${c.kind}">${esc(c.cat)}</span>
        <div class="fc-term">${esc(c.term)} <button class="speak" data-say="${esc(c.term)}" aria-label="Escuchar">${ICON.speaker}</button></div>
        ${c.ex ? `<p class="fc-ex"><button class="speak sm" data-say="${esc(c.ex)}" aria-label="Escuchar">${ICON.speaker}</button><em>${annotate(c.ex)}</em></p>` : ''}
        <div class="fc-back" hidden>
          <div class="fc-es">${esc(c.es)}</div>
          ${c.def ? `<p class="fc-def">${esc(c.def)}</p>` : ''}
        </div>
        <div class="fc-actions">
          <button class="btn primary big reveal">Mostrar respuesta</button>
        </div>
      </div>`;
    $('.reveal', wrap).onclick = flip;
    speak(c.term);
  }

  function flip() {
    flipped = true;
    $('.fc-back', wrap).hidden = false;
    const label = g => g === 'again' ? '< 1 min' : intervalLabel(nextBox(id, g));
    $('.fc-actions', wrap).innerHTML = `
      <button class="btn grade again" data-g="again"><kbd>1</kbd>Otra vez<small>${label('again')}</small></button>
      <button class="btn grade good" data-g="good"><kbd>2</kbd>Bien<small>${label('good')}</small></button>
      <button class="btn grade easy" data-g="easy"><kbd>3</kbd>Fácil<small>${label('easy')}</small></button>`;
    $$('[data-g]', wrap).forEach(b => { b.onclick = () => rate(b.dataset.g); });
  }

  function rate(g) {
    grade(id, g);
    queue.shift();
    seen.add(id);
    if (g === 'again') queue.push(id);
    show();
  }

  function done() {
    document.removeEventListener('keydown', onKey);
    const xp = Math.max(2, Math.round(ids.length / 2));
    addXP(xp);
    view.innerHTML = `
      <div class="page review">
        <div class="card empty-state">
          <div class="big-emoji">✅</div>
          <h2>Repaso terminado</h2>
          <p class="muted">${ids.length} tarjetas · +${xp} XP${practice ? '' : '. Las que marcaste «Otra vez» volverán pronto.'}</p>
          <div class="row center"><a class="btn primary" href="#/learn">Seguir aprendiendo</a></div>
        </div>
      </div>`;
  }

  function onKey(e) {
    if (!view.isConnected) return document.removeEventListener('keydown', onKey);
    if (e.target.matches('input, textarea')) return;
    if (!flipped && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); flip(); }
    else if (flipped && ['1', '2', '3'].includes(e.key)) rate(['again', 'good', 'easy'][+e.key - 1]);
  }
  document.addEventListener('keydown', onKey);
  show();
}

// ---------- glossary ----------

let filter = { q: '', cat: 'all' };

export function renderGlossary(view) {
  const cats = Object.entries(CATS);
  view.innerHTML = `
    <div class="page glossary">
      <header class="page-head">
        <h1>Glosario</h1>
        <p class="muted">${GLOSSARY.length} términos del mercado de bonos, la Fed, mercados emergentes y Money Stuff, explicados en español.</p>
      </header>
      <div class="gl-controls">
        <input class="gl-search" type="search" placeholder="Buscar: steepener, haircut, spread…" value="${esc(filter.q)}" aria-label="Buscar">
        <div class="chips gl-cats">
          <button class="pill ${filter.cat === 'all' ? 'on' : ''}" data-cat="all">Todas</button>
          ${cats.map(([k, c]) => `<button class="pill ${filter.cat === k ? 'on' : ''}" data-cat="${k}">${c.label}</button>`).join('')}
          <button class="pill ${filter.cat === 'mine' ? 'on' : ''}" data-cat="mine">Tus palabras</button>
        </div>
      </div>
      <div class="gl-list"></div>
    </div>`;
  const list = $('.gl-list', view);

  function draw() {
    const q = filter.q.trim().toLowerCase();
    if (filter.cat === 'mine') {
      const words = Object.entries(S().words).filter(([k, w]) => !q || k.includes(q) || w.note.toLowerCase().includes(q));
      list.innerHTML = words.length ? words.map(([k, w]) => `
        <div class="card gl-row">
          <div class="gl-main">
            <div class="gl-term">${esc(w.term)} <button class="speak sm" data-say="${esc(w.term)}" aria-label="Escuchar">${ICON.speaker}</button></div>
            <input class="gl-note" data-note="${esc(k)}" value="${esc(w.note)}" placeholder="Agrega tu traducción…">
            ${w.ctx ? `<p class="gl-ex"><em>${esc(w.ctx)}</em></p>` : ''}
          </div>
          <button class="icon-btn" data-forget="${esc(k)}" title="Borrar" aria-label="Borrar">${ICON.close}</button>
        </div>`).join('')
        : '<p class="muted">Todavía no guardas palabras. En «Tu texto» o en una transcripción, toca cualquier palabra y pulsa «Guardar en repaso».</p>';
      return;
    }
    const rows = GLOSSARY.filter(g => (filter.cat === 'all' || g.cat === filter.cat)
      && (!q || [g.term, g.es, ...g.alias].some(s => s.toLowerCase().replace(/^=/, '').includes(q))));
    list.innerHTML = rows.length ? rows.map(g => `
      <div class="card gl-row">
        <div class="gl-main">
          <div class="gl-term"><span class="dot k-${kindOf(g)}"></span>${esc(g.term)}
            <button class="speak sm" data-say="${esc(g.term)}" aria-label="Escuchar">${ICON.speaker}</button>
            <span class="gl-es">${esc(g.es)}</span></div>
          <p class="gl-def">${esc(g.def)}</p>
          ${g.ex ? `<p class="gl-ex"><button class="speak sm" data-say="${esc(g.ex)}" aria-label="Escuchar ejemplo">${ICON.speaker}</button><em>${esc(g.ex)}</em></p>` : ''}
        </div>
        <button class="btn small ${hasCard(g.id) ? 'ghost' : 'primary'}" data-toggle="${g.id}">${hasCard(g.id) ? '✓ En repaso' : '＋ Repaso'}</button>
      </div>`).join('') : '<p class="muted">Sin resultados.</p>';
  }

  $('.gl-search', view).oninput = e => { filter.q = e.target.value; draw(); };
  view.onclick = e => {
    const c = e.target.closest('[data-cat]');
    if (c) { filter.cat = c.dataset.cat; $$('[data-cat]', view).forEach(b => b.classList.toggle('on', b === c)); draw(); }
    const t = e.target.closest('[data-toggle]');
    if (t) {
      const id = t.dataset.toggle;
      if (hasCard(id)) removeCard(id); else addCards([id]);
      t.classList.toggle('primary', !hasCard(id)); t.classList.toggle('ghost', hasCard(id));
      t.textContent = hasCard(id) ? '✓ En repaso' : '＋ Repaso';
    }
    const f = e.target.closest('[data-forget]');
    if (f) { delete S().words[f.dataset.forget]; removeCard('w:' + f.dataset.forget); draw(); }
  };
  view.oninput = e => {
    const n = e.target.closest('[data-note]');
    if (n) { S().words[n.dataset.note].note = n.value; save(); }
  };
  draw();
}
