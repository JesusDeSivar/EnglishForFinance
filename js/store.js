// Progress lives in this browser's localStorage. Everything degrades gracefully if storage is blocked.

const KEY = 'bips.v1';
const DAY = 86400000;
const INTERVALS = [0, 1, 2, 4, 8, 16, 32, 64]; // days until next review, by Leitner box

const blank = () => ({
  xp: 0,
  goal: 30,        // daily XP goal
  days: {},        // 'YYYY-MM-DD' -> XP earned that day
  lessons: {},     // lessonId -> { done, best }
  cards: {},       // cardId -> { box, due }
  words: {},       // saved word (lowercase) -> { term, note, ctx }
  texts: [],       // pasted texts: { id, title, text, at }
  transcripts: {}, // videoId -> raw transcript
});

let state = load();

function load() {
  try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return blank(); }
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep in memory */ }
  document.dispatchEvent(new CustomEvent('store'));
}

export const S = () => state;

const fmt = d => d.toLocaleDateString('en-CA');
export const today = () => fmt(new Date());

export function addXP(n) {
  state.xp += n;
  state.days[today()] = (state.days[today()] || 0) + n;
  save();
}

export const xpToday = () => state.days[today()] || 0;

export function streak() {
  const d = new Date();
  if (!state.days[fmt(d)]) d.setDate(d.getDate() - 1); // today not done yet: streak still alive
  let n = 0;
  while (state.days[fmt(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function lastWeek() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push({ label: d.toLocaleDateString('es', { weekday: 'narrow' }), xp: state.days[fmt(d)] || 0, today: i === 0 });
  }
  return out;
}

export function finishLesson(id, accuracy) {
  const l = state.lessons[id] || { done: 0, best: 0 };
  state.lessons[id] = { done: l.done + 1, best: Math.max(l.best, accuracy) };
  save();
}

// ---- spaced repetition (Leitner boxes) ----

export const hasCard = id => !!state.cards[id];

export function addCards(ids) {
  let added = 0;
  for (const id of ids) if (!state.cards[id]) { state.cards[id] = { box: 0, due: Date.now() }; added++; }
  if (added) save();
  return added;
}

export function removeCard(id) { delete state.cards[id]; save(); }

export const dueCards = () => Object.entries(state.cards).filter(([, c]) => c.due <= Date.now()).map(([id]) => id);

export function nextBox(id, grade) {
  const box = state.cards[id]?.box ?? 0;
  if (grade === 'again') return 0;
  return Math.min(box + (grade === 'easy' ? 2 : 1), INTERVALS.length - 1);
}

export const intervalLabel = box => {
  const d = INTERVALS[box];
  return d === 0 ? 'hoy' : d === 1 ? '1 día' : d < 30 ? `${d} días` : `${Math.round(d / 30)} mes${d >= 60 ? 'es' : ''}`;
};

export function grade(id, g) {
  const box = nextBox(id, g);
  state.cards[id] = { box, due: Date.now() + INTERVALS[box] * DAY };
  save();
}

// ---- saved words & texts ----

export function saveWord(word, note, ctx) {
  const key = word.toLowerCase();
  state.words[key] = { term: word, note: note || state.words[key]?.note || '', ctx: ctx || state.words[key]?.ctx || '' };
  addCards(['w:' + key]);
  save();
}

export function saveText(title, text) {
  const existing = state.texts.find(t => t.text === text);
  if (existing) return existing.id;
  const id = Date.now().toString(36);
  state.texts.unshift({ id, title, text, at: Date.now() });
  state.texts = state.texts.slice(0, 30);
  save();
  return id;
}

export function deleteText(id) { state.texts = state.texts.filter(t => t.id !== id); save(); }

export function saveTranscript(videoId, raw) {
  if (raw) state.transcripts[videoId] = raw; else delete state.transcripts[videoId];
  save();
}

export function resetAll() { state = blank(); save(); }
