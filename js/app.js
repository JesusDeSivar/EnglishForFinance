import { UNITS, ALL_LESSONS, lessonById } from '../data/lessons.js';
import { SHOWS } from '../data/media.js';
import { S, streak, xpToday, lastWeek, dueCards, resetAll } from './store.js';
import { installPopovers, closePopover, exercisesFromText } from './text.js';
import { speak, stopSpeaking, canSpeak } from './speech.js';
import { playLesson } from './lesson.js';
import { renderWatch, shortTitle } from './watch.js';
import { getEpisodes } from './api.js';
import { renderRead } from './read.js';
import { renderReview, renderGlossary } from './review.js';
import { renderLog } from './log.js';
import { esc, $, $$ } from './util.js';

const view = $('#view');
const overlay = $('#overlay');
let cleanup = null;
let custom = null;
let returnTo = '#/learn';

// ---------- learn (home) ----------

const ZIGZAG = [0, 44, 70, 44, 0, -44, -70, -44];

function renderLearn(el) {
  const done = S().lessons;
  const next = ALL_LESSONS.find(l => !done[l.id]);
  const goal = S().goal, today = xpToday();
  const week = lastWeek();
  const maxWeek = Math.max(goal, ...week.map(d => d.xp));
  const due = dueCards().length;
  const latest = SHOWS[0].episodes[0];

  el.innerHTML = `
    <div class="page learn">
      <div class="learn-grid">
        <section class="path">
          ${UNITS.map((u, ui) => `
            <div class="unit c-${u.color}">
              <div class="unit-banner">
                <div>
                  <span class="unit-kicker">Unidad ${ui + 1}</span>
                  <h2>${esc(u.title)}</h2>
                  <p>${esc(u.subtitle)}</p>
                </div>
                <span class="unit-count">${u.lessons.filter(l => done[l.id]).length}/${u.lessons.length}</span>
              </div>
              <div class="nodes">
                ${u.lessons.map((l, i) => {
                  const state = done[l.id] ? 'done' : l.id === next?.id ? 'next' : 'open';
                  return `
                    <div class="node-wrap" style="--dx:${ZIGZAG[i % ZIGZAG.length]}px">
                      ${state === 'next' ? '<span class="node-tip">EMPEZAR</span>' : ''}
                      <a class="node ${state}" href="#/lesson/${l.id}" aria-label="${esc(l.title)}">
                        <span class="node-icon">${state === 'done' ? '✓' : l.icon}</span>
                      </a>
                      <span class="node-title">${esc(l.title)}${done[l.id] ? ` <span class="muted">· ${done[l.id].best}%</span>` : ''}</span>
                    </div>`;
                }).join('')}
              </div>
            </div>`).join('')}
        </section>
        <aside class="side">
          <div class="stat-row">
            <div class="stat" title="Racha de días"><span>🔥</span><b>${streak()}</b></div>
            <div class="stat" title="XP total"><span>⚡</span><b>${S().xp}</b></div>
            <a class="stat" href="#/review" title="Tarjetas pendientes"><span>🔁</span><b>${due}</b></a>
          </div>
          <div class="card goal-card">
            <div class="goal-head"><h3>Meta diaria</h3><span class="muted small">${Math.min(today, goal)} / ${goal} XP</span></div>
            <div class="progress thick"><div class="progress-bar gold" style="width:${Math.min(100, 100 * today / goal)}%"></div></div>
            <div class="week">
              ${week.map(d => `<div class="day ${d.today ? 'today' : ''}"><div class="day-bar"><i style="height:${Math.round(100 * d.xp / maxWeek)}%"></i></div><span>${d.label}</span></div>`).join('')}
            </div>
          </div>
          <div class="card today-card">
            <h3>Para hoy</h3>
            ${due ? `<a class="todo" href="#/review"><span class="todo-icon">🔁</span><span><b>Repasa ${due} tarjeta${due > 1 ? 's' : ''}</b><small>Unos minutos para no olvidar la jerga.</small></span></a>` : ''}
            ${next ? `<a class="todo" href="#/lesson/${next.id}"><span class="todo-icon">${next.icon}</span><span><b>${esc(next.title)}</b><small>Siguiente lección · ${esc(next.unit.title)}</small></span></a>` : ''}
            <a class="todo" href="#/watch"><span class="todo-icon">📺</span><span><b>Mira Real Yield</b><small data-latest>${esc(shortTitle(latest.title))}</small></span></a>
            <a class="todo" href="#/read"><span class="todo-icon">📰</span><span><b>Pega el Money Stuff de hoy</b><small>Convierte el newsletter en una lección.</small></span></a>
          </div>
          ${canSpeak ? '' : '<p class="muted small">Tu navegador no tiene voz sintética: los ejercicios de audio no sonarán.</p>'}
          <button class="linklike muted small reset">Reiniciar progreso</button>
        </aside>
      </div>
    </div>`;

  getEpisodes().then(d => {
    const newest = d?.shows?.[SHOWS[0].id]?.[0];
    const slot = $('[data-latest]', el);
    if (newest && slot?.isConnected) slot.textContent = shortTitle(newest.title);
  });

  $('.reset', el).onclick = () => { if (confirm('¿Borrar todo tu progreso, tarjetas y textos guardados?')) { resetAll(); renderLearn(el); } };
  requestAnimationFrame(() => $('.node.next', el)?.scrollIntoView({ block: 'center' }));
}

// ---------- router ----------

const ROUTES = {
  learn: el => renderLearn(el),
  watch: el => renderWatch(el, { startPractice }),
  read: el => renderRead(el, { startPractice }),
  review: el => renderReview(el),
  glossary: el => renderGlossary(el),
  log: el => renderLog(el),
};

function startPractice(title, text) {
  const exercises = exercisesFromText(text);
  if (!exercises.length) return alert('No encontramos suficientes términos en este texto para armar ejercicios.');
  custom = { title, exercises, lessonId: null };
  location.hash = '#/lesson/custom';
}

function openLesson(id) {
  const l = id === 'custom' ? custom : lessonById(id);
  const lesson = l && (id === 'custom' ? l : { title: l.title, exercises: l.ex, lessonId: l.id });
  if (!lesson) { location.hash = '#/learn'; return; }
  cleanup?.(); cleanup = null;
  view.innerHTML = '';
  overlay.hidden = false;
  document.body.classList.add('in-lesson');
  playLesson(overlay, { ...lesson, onExit: () => { location.hash = returnTo; } });
}

function route() {
  const [, name = 'learn', arg] = location.hash.match(/^#\/(\w+)(?:\/(.+))?/) || [];
  closePopover();
  stopSpeaking();
  if (name === 'lesson') return openLesson(arg);
  overlay.hidden = true;
  overlay.innerHTML = '';
  document.body.classList.remove('in-lesson');
  cleanup?.(); cleanup = null;
  const render = ROUTES[name] || ROUTES.learn;
  returnTo = `#/${ROUTES[name] ? name : 'learn'}`;
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === (ROUTES[name] ? name : 'learn')));
  cleanup = render(view) || null;
  if (name !== 'learn') window.scrollTo(0, 0);
  updateBadge();
}

function updateBadge() {
  const n = dueCards().length;
  $$('.due-badge').forEach(b => { b.textContent = n > 99 ? '99+' : n; b.hidden = !n; });
}

// ---------- global handlers ----------

document.addEventListener('click', e => {
  const s = e.target.closest('[data-say]');
  if (s) { e.preventDefault(); speak(s.dataset.say, { rate: +s.dataset.rate || 1 }); }
});
document.addEventListener('store', updateBadge);
window.addEventListener('hashchange', route);
installPopovers();
route();
