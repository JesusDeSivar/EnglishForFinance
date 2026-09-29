// The "bitácora": wrong corrections and content errors, stored as readable JSON so they
// can be reviewed (and fixed) straight from the repo: storage/corrections.json.

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { HttpError } from './youtube.mjs';

const STATUSES = ['open', 'fixed', 'wontfix'];
const FIELDS = ['source', 'reason', 'note', 'where', 'lessonId', 'lessonTitle', 'exerciseIndex', 'termId', 'term'];
const EX_FIELDS = ['type', 'prompt', 'quote', 'say', 'options', 'expected', 'given', 'ok', 'explain'];

const str = (v, max = 4000) => (v == null ? undefined : String(v).slice(0, max));

function sanitize(entry) {
  const out = {};
  for (const k of FIELDS) if (entry[k] != null && entry[k] !== '') out[k] = k === 'exerciseIndex' ? Number(entry[k]) : str(entry[k]);
  if (entry.exercise && typeof entry.exercise === 'object') {
    out.exercise = {};
    for (const k of EX_FIELDS) {
      const v = entry.exercise[k];
      if (v == null) continue;
      out.exercise[k] = k === 'options' ? [].concat(v).slice(0, 12).map(o => str(o, 300)) : k === 'ok' ? !!v : str(v);
    }
  }
  return out;
}

export function correctionsStore(file) {
  let queue = Promise.resolve();

  async function read() {
    try { return JSON.parse(await readFile(file, 'utf8')); }
    catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  }

  async function write(items) {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file + '.tmp', JSON.stringify(items, null, 2) + '\n');
    await rename(file + '.tmp', file);
  }

  // Mutations run one at a time so two quick requests can't overwrite each other.
  function mutate(fn) {
    const run = queue.then(async () => {
      const items = await read();
      const result = fn(items);
      await write(items);
      return result;
    });
    queue = run.catch(() => {});
    return run;
  }

  const find = (items, id) => {
    const it = items.find(x => x.id === id);
    if (!it) throw new HttpError(404, 'Entrada no encontrada.');
    return it;
  };

  return {
    list: read,

    add: entry => mutate(items => {
      const item = { id: randomUUID().slice(0, 8), createdAt: new Date().toISOString(), status: 'open', ...sanitize(entry), comments: [] };
      if (!item.reason) throw new HttpError(400, 'Falta el motivo.');
      items.unshift(item);
      return item;
    }),

    update: (id, patch) => mutate(items => {
      const it = find(items, id);
      if (patch.status != null) {
        if (!STATUSES.includes(patch.status)) throw new HttpError(400, 'Estado inválido.');
        it.status = patch.status;
      }
      if (patch.note != null) it.note = str(patch.note);
      it.updatedAt = new Date().toISOString();
      return it;
    }),

    comment: (id, { text, by }) => mutate(items => {
      const it = find(items, id);
      if (!text?.trim()) throw new HttpError(400, 'Comentario vacío.');
      const c = { by: by === 'claude' ? 'claude' : 'you', text: str(text.trim()), at: new Date().toISOString() };
      (it.comments ||= []).push(c);
      it.updatedAt = c.at;
      return it;
    }),

    remove: id => mutate(items => {
      const i = items.findIndex(x => x.id === id);
      if (i < 0) throw new HttpError(404, 'Entrada no encontrada.');
      items.splice(i, 1);
    }),
  };
}
