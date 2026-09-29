// "🚩 ¿Corrección equivocada?" dialog: files an entry in the bitácora with full context.

import { corrections } from './api.js';
import { esc, ICON, $, $$ } from './util.js';

export const REASONS = {
  marked_wrong:    'Mi respuesta era correcta y la marcó mal',
  bad_answer:      'La respuesta «correcta» está mal',
  ambiguous:       'La pregunta es ambigua: hay más de una respuesta válida',
  bad_explanation: 'La explicación o la traducción está mal o confunde',
  bad_definition:  'La definición del glosario está mal',
  false_match:     'Resaltó algo que no es ese término',
  audio:           'Problema con el audio',
  other:           'Otra cosa',
};

const FOR_EXERCISE = ['marked_wrong', 'bad_answer', 'ambiguous', 'bad_explanation', 'audio', 'other'];
const FOR_TERM = ['bad_definition', 'false_match', 'bad_explanation', 'other'];

export function toast(msg, kind = 'ok') {
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3000);
}

export function contextHTML(e) {
  const ex = e.exercise;
  const parts = [];
  if (e.term) parts.push(`<div><b>Término:</b> ${esc(e.term)}</div>`);
  if (ex) {
    if (ex.prompt) parts.push(`<div class="ctx-prompt">${esc(ex.prompt)}</div>`);
    if (ex.quote) parts.push(`<blockquote>${esc(ex.quote)}</blockquote>`);
    if (ex.say) parts.push(`<div class="muted">Audio: «${esc(ex.say)}»</div>`);
    if (ex.expected != null) parts.push(`<div class="ctx-ans ok">✓ Esperada: <b>${esc(ex.expected)}</b></div>`);
    if (ex.given != null && ex.given !== ex.expected) parts.push(`<div class="ctx-ans ${ex.ok ? 'ok' : 'bad'}">${ex.ok ? '✓' : '✗'} Tu respuesta: <b>${esc(ex.given)}</b></div>`);
  }
  return parts.join('');
}

// ctx: { source, lessonId?, lessonTitle?, exerciseIndex?, exercise?, termId?, term? }
export function openReport(ctx) {
  const reasons = ctx.termId ? FOR_TERM : FOR_EXERCISE;
  const preset = ctx.exercise && ctx.exercise.ok === false ? 'marked_wrong' : reasons[0];
  const dlg = document.createElement('dialog');
  dlg.className = 'modal';
  dlg.innerHTML = `
    <form method="dialog" class="report-form">
      <div class="modal-head">
        <h2>🚩 Reportar a la bitácora</h2>
        <button type="button" class="icon-btn" data-close aria-label="Cerrar">${ICON.close}</button>
      </div>
      ${ctx.lessonTitle ? `<p class="muted small">${esc(ctx.lessonTitle)}${ctx.exerciseIndex != null ? ` · ejercicio ${ctx.exerciseIndex + 1}` : ''}</p>` : ''}
      <div class="ctx-box">${contextHTML(ctx)}</div>
      <fieldset class="reasons">
        <legend>¿Qué pasó?</legend>
        ${reasons.map(r => `
          <label class="reason"><input type="radio" name="reason" value="${r}" ${r === preset ? 'checked' : ''}><span>${esc(REASONS[r])}</span></label>`).join('')}
      </fieldset>
      <label class="field-label" for="report-note">Detalles <span class="muted">(opcional)</span></label>
      <textarea id="report-note" name="note" rows="3" placeholder="p. ej.: «rallied» también debería aceptarse aquí…"></textarea>
      <div class="modal-actions">
        <button type="button" class="btn ghost" data-close>Cancelar</button>
        <button type="submit" class="btn primary">Guardar en la bitácora</button>
      </div>
    </form>`;
  document.body.appendChild(dlg);
  // Remove explicitly: the 'close' event alone isn't reliable in every browser state.
  const dismiss = () => { if (dlg.open) dlg.close(); dlg.remove(); };
  dlg.addEventListener('close', () => dlg.remove());
  $$('[data-close]', dlg).forEach(b => { b.onclick = dismiss; });
  // Keys typed here must not drive the lesson underneath.
  dlg.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); dismiss(); } });
  $('form', dlg).onsubmit = async e => {
    e.preventDefault();
    const btn = $('[type=submit]', dlg);
    btn.disabled = true;
    try {
      const { onSaved, ...entry } = ctx;
      const reason = $('input[name=reason]:checked', dlg).value;
      await corrections.add({ ...entry, reason, note: $('#report-note', dlg).value.trim() });
      dismiss();
      toast('Guardado en la bitácora 📝');
      onSaved?.(reason);
    } catch (err) {
      btn.disabled = false;
      toast(`No se pudo guardar: ${err.message}`, 'bad');
    }
  };
  dlg.showModal();
  $('#report-note', dlg).focus();
}
