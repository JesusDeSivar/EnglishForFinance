// Bitácora: a blog-style log of wrong corrections and content errors, with a comment
// thread per entry. Entries live in storage/corrections.json (via the server), which is
// what Claude reads to fix lessons and then replies to in the comments.

import { corrections, hasServer } from './api.js';
import { REASONS, contextHTML, toast } from './report.js';
import { lessonById } from '../data/lessons.js';
import { esc, $, $$ } from './util.js';

const STATUS = { open: 'Abierto', fixed: 'Corregido', wontfix: 'Descartado' };
let filter = 'open';

const when = iso => new Date(iso).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function titleOf(it) {
  if (it.lessonTitle) return `${it.lessonTitle}${it.exerciseIndex != null && !Number.isNaN(it.exerciseIndex) ? ` · ejercicio ${it.exerciseIndex + 1}` : ''}`;
  if (it.term) return `Glosario: ${it.term}`;
  return it.where || 'Entrada manual';
}

function postHTML(it) {
  const lessonLink = it.lessonId && lessonById(it.lessonId) ? `<a class="small" href="#/lesson/${it.lessonId}">Abrir la lección →</a>` : '';
  const ctx = contextHTML(it);
  return `
    <article class="card post s-${it.status}" data-id="${it.id}">
      <header class="post-head">
        <span class="status-pill ${it.status}">${STATUS[it.status] || it.status}</span>
        <span class="chip">${esc(REASONS[it.reason] || it.reason)}</span>
        <span class="grow"></span>
        <time class="muted small">${when(it.createdAt)}</time>
      </header>
      <h3 class="post-title">${esc(titleOf(it))}</h3>
      ${ctx ? `<div class="ctx-box">${ctx}</div>` : ''}
      ${it.note ? `<p class="post-note">${esc(it.note)}</p>` : ''}
      ${lessonLink}
      <div class="comments">
        ${(it.comments || []).map(c => `
          <div class="comment ${c.by}">
            <div class="comment-head"><b>${c.by === 'claude' ? '🤖 Claude' : 'Tú'}</b><time class="muted small">${when(c.at)}</time></div>
            <p>${esc(c.text)}</p>
          </div>`).join('')}
        <form class="comment-form">
          <input name="text" placeholder="Añadir un comentario…" aria-label="Comentario" autocomplete="off">
          <button class="btn small ghost">Comentar</button>
        </form>
      </div>
      <footer class="post-actions">
        ${it.status === 'open'
          ? '<button class="btn small primary" data-status="fixed">✓ Marcar corregido</button><button class="btn small ghost" data-status="wontfix">Descartar</button>'
          : '<button class="btn small ghost" data-status="open">Reabrir</button>'}
        <span class="grow"></span>
        <button class="linklike muted small" data-del>Borrar</button>
      </footer>
    </article>`;
}

export function renderLog(view) {
  let items = [];

  view.innerHTML = `
    <div class="page log">
      <header class="page-head">
        <h1>Bitácora</h1>
        <p class="muted">¿La app te corrigió mal, o una explicación está equivocada? Repórtalo con <b>🚩</b> desde cualquier
          ejercicio o término, o escribe una entrada aquí. Claude lee esta bitácora (<code>storage/corrections.json</code>),
          arregla las lecciones y te responde en los comentarios.</p>
      </header>
      <div class="log-top">
        <div class="chips filters"></div>
        <span class="grow"></span>
        <button class="btn small primary new-entry">＋ Nueva entrada</button>
      </div>
      <form class="card new-form" hidden>
        <h3>Nueva entrada</h3>
        <label class="field-label" for="nf-reason">¿Qué pasó?</label>
        <select id="nf-reason" name="reason">
          ${Object.entries(REASONS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join('')}
        </select>
        <label class="field-label" for="nf-where">¿Dónde? <span class="muted">(lección, término, texto…)</span></label>
        <input id="nf-where" name="where" placeholder="p. ej.: Números al estilo Bloomberg, ejercicio 6">
        <label class="field-label" for="nf-note">Descripción</label>
        <textarea id="nf-note" name="note" rows="4" required placeholder="Qué esperabas, qué pasó y por qué crees que está mal."></textarea>
        <div class="row">
          <button class="btn primary">Guardar</button>
          <button type="button" class="btn ghost cancel">Cancelar</button>
        </div>
      </form>
      <div class="posts"><p class="muted">Cargando…</p></div>
      <p class="muted small store-note"></p>
    </div>`;

  const page = view.firstElementChild;
  const posts = $('.posts', view), form = $('.new-form', view);

  function draw() {
    if (!page.isConnected) return; // navigated away while loading
    const counts = { all: items.length, open: 0, fixed: 0, wontfix: 0 };
    items.forEach(it => { counts[it.status] = (counts[it.status] || 0) + 1; });
    $('.filters', view).innerHTML = [['open', 'Abiertos'], ['fixed', 'Corregidos'], ['wontfix', 'Descartados'], ['all', 'Todos']]
      .map(([k, label]) => `<button class="pill ${filter === k ? 'on' : ''}" data-filter="${k}">${label} <b>${counts[k] || 0}</b></button>`).join('');
    const shown = items.filter(it => filter === 'all' || it.status === filter);
    posts.innerHTML = shown.length ? shown.map(postHTML).join('') : `
      <div class="card empty-state">
        <div class="big-emoji">${items.length ? '✨' : '📝'}</div>
        <h2>${items.length ? 'Nada por aquí' : 'La bitácora está vacía'}</h2>
        <p class="muted">${items.length ? 'No hay entradas con este estado.' : 'Cuando algo te parezca mal corregido, toca 🚩 en el ejercicio. Aparecerá aquí con todo el contexto.'}</p>
      </div>`;
  }

  async function load() {
    try { items = await corrections.list(); }
    catch (e) { if (page.isConnected) posts.innerHTML = `<p class="muted">No se pudo cargar la bitácora: ${esc(e.message)}</p>`; return; }
    draw();
  }

  const replace = it => { items = items.map(x => (x.id === it.id ? it : x)); draw(); };

  view.onclick = async e => {
    const f = e.target.closest('[data-filter]');
    if (f) { filter = f.dataset.filter; draw(); return; }
    if (e.target.closest('.new-entry')) { form.hidden = false; $('#nf-note', form).focus(); return; }
    if (e.target.closest('.new-form .cancel')) { form.hidden = true; form.reset(); return; }
    const post = e.target.closest('.post');
    if (!post) return;
    const id = post.dataset.id;
    try {
      const st = e.target.closest('[data-status]');
      if (st) { replace(await corrections.update(id, { status: st.dataset.status })); toast(st.dataset.status === 'fixed' ? 'Marcado como corregido ✓' : 'Actualizado'); }
      if (e.target.closest('[data-del]') && confirm('¿Borrar esta entrada de la bitácora?')) {
        await corrections.remove(id);
        items = items.filter(x => x.id !== id);
        draw();
      }
    } catch (err) { toast(err.message, 'bad'); }
  };

  view.onsubmit = async e => {
    e.preventDefault();
    try {
      if (e.target === form) {
        const data = Object.fromEntries(new FormData(form));
        items.unshift(await corrections.add({ source: 'manual', ...data }));
        form.reset(); form.hidden = true;
        filter = 'open';
        draw();
        toast('Entrada guardada 📝');
      } else if (e.target.matches('.comment-form')) {
        const input = $('input', e.target);
        if (!input.value.trim()) return;
        replace(await corrections.comment(e.target.closest('.post').dataset.id, input.value.trim()));
      }
    } catch (err) { toast(err.message, 'bad'); }
  };

  hasServer().then(ok => {
    if (!page.isConnected) return;
    $('.store-note', page).textContent = ok
      ? 'Guardado en storage/corrections.json del proyecto.'
      : 'Sin servidor: la bitácora se guarda solo en este navegador. Inicia la app con «npm start» para guardarla en el proyecto.';
  });
  load();
}
