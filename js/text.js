// Text engine: finds glossary terms in any English text, renders it as clickable HTML,
// shows the term/word popover, and turns a text into practice exercises.

import { GLOSSARY, CATS } from '../data/glossary.js';
import { S, hasCard, addCards, saveWord } from './store.js';
import { esc, pick, shuffle, ICON } from './util.js';
import { openReport } from './report.js';

export const byId = Object.fromEntries(GLOSSARY.map(g => [g.id, g]));
export const kindOf = g => g.cat === 'marker' ? 'marker' : g.cat === 'idiom' ? 'idiom' : 'fin';

// ---- matcher: one big regex, longest alias first ----

const exact = new Map();
const lower = new Map();
const pats = [];
for (const g of GLOSSARY) {
  for (let a of g.alias) {
    const cs = a.startsWith('=');
    if (cs) a = a.slice(1);
    if (cs) exact.set(a, g.id); else lower.set(norm(a), g.id);
    pats.push({ a, cs });
  }
}
pats.sort((x, y) => y.a.length - x.a.length);

function norm(s) { return s.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' '); }
function pattern({ a, cs }) {
  let p = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!cs) p = p.replace(/[a-z]/gi, c => `[${c.toLowerCase()}${c.toUpperCase()}]`);
  return p.replace(/'/g, "['’]").replace(/ /g, '\\s+');
}
const RE = new RegExp(`(?<![\\w'’-])(?:${pats.map(pattern).join('|')})(?![\\w-])`, 'g');

const idOf = m => exact.get(m) ?? lower.get(norm(m));

export function findTerms(text) {
  const seen = new Map();
  for (const m of text.matchAll(RE)) {
    const id = idOf(m[0]);
    if (id && !seen.has(id)) seen.set(id, { id, surface: m[0], index: m.index, count: 0 });
    if (id) seen.get(id).count++;
  }
  return [...seen.values()];
}

// Render text as HTML with highlighted terms. With words:true every other word is clickable too.
export function annotate(text, { words = false } = {}) {
  let out = '', last = 0;
  for (const m of text.matchAll(RE)) {
    const id = idOf(m[0]);
    if (!id) continue;
    out += plain(text.slice(last, m.index), words);
    out += `<span class="term k-${kindOf(byId[id])}" data-term="${id}" tabindex="0">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + plain(text.slice(last), words);
}

function plain(s, words) {
  if (!words) return esc(s);
  const saved = S().words;
  return s.replace(/[A-Za-z][A-Za-z'’-]*[A-Za-z]|[A-Za-z]|[^A-Za-z]+/g, t =>
    /^[A-Za-z]/.test(t) ? `<span class="w${saved[t.toLowerCase()] ? ' saved' : ''}">${t}</span>` : esc(t));
}

// Split only where punctuation is followed by whitespace, so "8.875%" stays in one piece.
export function sentences(text) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?]["”’)]?)\s+/).map(s => s.trim()).filter(Boolean);
}

// ---- popover ----

let pop = null, popAnchor = null;

export function closePopover() {
  pop?.remove(); pop = null;
  popAnchor?.classList.remove('active'); popAnchor = null;
}

function openPopover(anchor, html) {
  closePopover();
  popAnchor = anchor; anchor.classList.add('active');
  pop = document.createElement('div');
  pop.className = 'popover';
  pop.innerHTML = html;
  document.body.appendChild(pop);
  if (innerWidth < 640) { pop.classList.add('sheet'); return pop; }
  const r = anchor.getBoundingClientRect();
  const w = pop.offsetWidth, hgt = pop.offsetHeight;
  let top = r.bottom + 8, left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
  if (top + hgt > innerHeight - 8 && r.top - hgt - 8 > 0) top = r.top - hgt - 8;
  pop.style.top = `${top}px`;
  pop.style.left = `${left}px`;
  return pop;
}

const speakBtn = (text, cls = '') => `<button class="speak ${cls}" data-say="${esc(text)}" title="Escuchar" aria-label="Escuchar">${ICON.speaker}</button>`;

export function termCardHTML(id) {
  const g = byId[id];
  const inDeck = hasCard(id);
  return `
    <div class="pop-head">
      <span class="chip k-${kindOf(g)}">${CATS[g.cat].label}</span>
      <button class="icon-btn pop-close" aria-label="Cerrar">${ICON.close}</button>
    </div>
    <div class="pop-term">${esc(g.term)} ${speakBtn(g.term)}</div>
    <div class="pop-es">${esc(g.es)}</div>
    <p class="pop-def">${esc(g.def)}</p>
    ${g.ex ? `<p class="pop-ex">${speakBtn(g.ex, 'sm')}<em>${esc(g.ex)}</em></p>` : ''}
    <div class="pop-actions">
      <button class="flag-btn" data-report-term="${id}" title="¿La definición está mal o resaltó algo que no es?">🚩 Reportar</button>
      <button class="btn small ${inDeck ? 'ghost' : 'primary'}" data-add-card="${id}" ${inDeck ? 'disabled' : ''}>${inDeck ? '✓ En tu repaso' : '＋ Añadir a repaso'}</button>
    </div>`;
}

function wordCardHTML(word, ctx) {
  const w = S().words[word.toLowerCase()];
  const q = encodeURIComponent(word.toLowerCase());
  return `
    <div class="pop-head">
      <span class="chip">Palabra</span>
      <button class="icon-btn pop-close" aria-label="Cerrar">${ICON.close}</button>
    </div>
    <div class="pop-term">${esc(word)} ${speakBtn(word)}</div>
    <div class="pop-links">
      <a href="https://www.linguee.com/english-spanish/search?source=english&query=${q}" target="_blank" rel="noopener">Linguee ${ICON.ext}</a>
      <a href="https://www.wordreference.com/es/translation.asp?tranword=${q}" target="_blank" rel="noopener">WordReference ${ICON.ext}</a>
      <a href="https://dictionary.cambridge.org/dictionary/english-spanish/${q}" target="_blank" rel="noopener">Cambridge ${ICON.ext}</a>
    </div>
    <label class="pop-label">Tu traducción / nota</label>
    <input class="pop-input" data-word-note value="${esc(w?.note || '')}" placeholder="p. ej.: apalancado" />
    <div class="pop-actions">
      <button class="btn small primary" data-save-word="${esc(word)}" data-ctx="${esc(ctx || '')}">${w ? '✓ Guardar cambios' : '＋ Guardar en repaso'}</button>
    </div>`;
}

// Delegated handlers, installed once by app.js.
export function installPopovers() {
  document.addEventListener('click', e => {
    const t = e.target;
    const term = t.closest('.term');
    if (term) { e.preventDefault(); openPopover(term, termCardHTML(term.dataset.term)); return; }
    const word = t.closest('.w');
    if (word) {
      const ctxEl = word.closest('[data-ctx-root]');
      const ctx = ctxEl ? sentenceAround(ctxEl.textContent, word.textContent) : '';
      openPopover(word, wordCardHTML(word.textContent, ctx));
      pop.querySelector('input')?.focus();
      return;
    }
    const rep = t.closest('[data-report-term]');
    if (rep) {
      const g = byId[rep.dataset.reportTerm];
      const root = popAnchor?.closest('[data-ctx-root], blockquote');
      const where = root ? sentenceAround(root.textContent, popAnchor.textContent) : '';
      closePopover();
      openReport({ source: 'glossary', termId: g.id, term: `${g.term} — ${g.es}`, where: where || undefined,
        exercise: where ? { quote: where } : undefined });
      return;
    }
    const add = t.closest('[data-add-card]');
    if (add) {
      addCards([add.dataset.addCard]);
      add.textContent = '✓ En tu repaso'; add.disabled = true; add.classList.replace('primary', 'ghost');
      return;
    }
    const sw = t.closest('[data-save-word]');
    if (sw) {
      const note = pop.querySelector('[data-word-note]').value.trim();
      saveWord(sw.dataset.saveWord, note, sw.dataset.ctx);
      popAnchor?.classList.add('saved');
      document.querySelectorAll('.w').forEach(el => { if (el.textContent.toLowerCase() === sw.dataset.saveWord.toLowerCase()) el.classList.add('saved'); });
      closePopover();
      return;
    }
    if (t.closest('.pop-close') || (pop && !t.closest('.popover'))) closePopover();
  });
  // The popover is position:fixed, so it would drift if its anchor scrolled away.
  document.addEventListener('scroll', e => {
    if (pop && !pop.classList.contains('sheet') && !pop.contains(e.target)) closePopover();
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePopover();
    if (e.key === 'Enter' && e.target.matches('.term')) e.target.click();
    if (e.key === 'Enter' && e.target.matches('[data-word-note]')) pop.querySelector('[data-save-word]')?.click();
  });
}

function sentenceAround(text, word) {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  return sentences(text).find(s => re.test(s)) || '';
}

// ---- exercises generated from any text ----

function distractors(g, field, n) {
  const pool = GLOSSARY.filter(x => x.id !== g.id && x[field] !== g[field]);
  const same = pool.filter(x => x.cat === g.cat);
  const chosen = pick(same, n);
  if (chosen.length < n) chosen.push(...pick(pool.filter(x => !chosen.includes(x)), n - chosen.length));
  return chosen.map(x => x[field]);
}

export function exercisesFromText(text, max = 12) {
  const sents = sentences(text).filter(s => s.length > 25 && s.length < 320);
  const found = findTerms(text).map(f => ({ ...f, g: byId[f.id], sent: sents.find(s => s.includes(f.surface)) }))
    .filter(f => f.sent);
  const fin = shuffle(found.filter(f => f.g.cat !== 'marker'));
  const markers = shuffle(found.filter(f => f.g.cat === 'marker'));
  const out = [];

  // 1) meaning in context
  for (const f of fin.slice(0, 4)) {
    out.push({
      type: 'mc', prompt: `En este texto, ¿qué significa «${f.surface}»?`, quote: f.sent,
      options: [f.g.es, ...distractors(f.g, 'es', 3)], answer: 0, explain: f.g.def, terms: [f.id],
    });
  }
  // 2) cloze: put the right term back into the sentence
  for (const f of fin.slice(4, 8)) {
    out.push({
      type: 'mc', prompt: 'Completa la frase del texto:', quote: f.sent.replace(f.surface, '_____'),
      options: [f.surface, ...distractors(f.g, 'term', 3)], answer: 0, explain: `«${f.surface}»: ${f.g.def}`, terms: [f.id],
    });
  }
  // 3) tone markers
  for (const f of markers.slice(0, 2)) {
    out.push({
      type: 'mc', prompt: `¿Qué función tiene «${f.surface}» aquí?`, quote: f.sent,
      options: [f.g.es, ...distractors(f.g, 'es', 3)], answer: 0, explain: f.g.def, terms: [f.id],
    });
  }
  // 4) matching pairs
  const pairs = fin.slice(0, 5).filter((f, i, a) => a.findIndex(x => x.g.es === f.g.es) === i);
  if (pairs.length >= 3) out.splice(2, 0, { type: 'match', pairs: pairs.map(f => [f.surface.toLowerCase(), f.g.es]), terms: pairs.map(f => f.id) });
  // 5) dictation of a short sentence
  const short = sents.map(s => s.replace(/["“”]/g, '')).find(s => { const n = s.split(/\s+/).length; return n >= 5 && n <= 11 && found.some(f => s.includes(f.surface)); });
  if (short) {
    const toks = short.replace(/[.,;:!?]+/g, '').split(/\s+/).filter(Boolean);
    out.push({ type: 'build', prompt: 'Escucha esta frase del texto y ordénala.', say: short, answer: toks, extra: distractors({ id: '', cat: 'rates' }, 'term', 2).map(t => t.split(' ')[0]), terms: [] });
  }
  return out.slice(0, max);
}
