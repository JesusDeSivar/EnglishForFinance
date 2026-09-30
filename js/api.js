// Client for the local server. If the app is served without it (plain static hosting),
// the bitácora falls back to this browser's storage and transcripts go back to copy-paste.

import { EPISODES_JSON_URL } from '../data/media.js';

const LOCAL_KEY = 'bips.corrections';
let health = null;

export function hasServer() {
  health ??= fetch('/api/health').then(r => r.ok).catch(() => false);
  return health;
}

async function call(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export async function getTranscript(videoId, { refresh = false } = {}) {
  if (!(await hasServer())) {
    const err = new Error('Esta versión no tiene servidor.');
    err.code = 'NO_SERVER';
    throw err;
  }
  return call('GET', `/transcript/${videoId}${refresh ? '?refresh' : ''}`);
}

// Latest episodes: live from the server, else the list the GitHub Action refreshes
// (raw file on main, then this site's copy). Null means "use the built-in fallback".
let episodesPromise = null;
export function getEpisodes() {
  episodesPromise ??= (async () => {
    if (await hasServer()) {
      try { return await call('GET', '/episodes'); } catch { /* fall through to the static list */ }
    }
    for (const url of [EPISODES_JSON_URL, 'data/episodes.json']) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) return await res.json();
      } catch { /* try the next one */ }
    }
    return null;
  })();
  return episodesPromise;
}

// ---- bitácora ----

const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; } };
const writeLocal = items => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch { /* storage blocked */ } };
const now = () => new Date().toISOString();

function local(fn) {
  const items = readLocal();
  const out = fn(items);
  writeLocal(items);
  return out;
}

export const corrections = {
  async list() {
    if (await hasServer()) return (await call('GET', '/corrections')).items;
    return readLocal();
  },
  async add(entry) {
    if (await hasServer()) return call('POST', '/corrections', entry);
    return local(items => {
      const item = { id: Date.now().toString(36), createdAt: now(), status: 'open', ...entry, comments: [] };
      items.unshift(item);
      return item;
    });
  },
  async update(id, patch) {
    if (await hasServer()) return call('PATCH', `/corrections/${id}`, patch);
    return local(items => Object.assign(items.find(x => x.id === id), patch, { updatedAt: now() }));
  },
  async comment(id, text) {
    if (await hasServer()) return call('POST', `/corrections/${id}/comments`, { text, by: 'you' });
    return local(items => {
      const it = items.find(x => x.id === id);
      (it.comments ||= []).push({ by: 'you', text, at: now() });
      return it;
    });
  },
  async remove(id) {
    if (await hasServer()) return call('DELETE', `/corrections/${id}`);
    return local(items => { items.splice(items.findIndex(x => x.id === id), 1); });
  },
};
