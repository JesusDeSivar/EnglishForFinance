// Bips server (zero dependencies): serves the app and a small JSON API.
//   GET    /api/health
//   GET    /api/transcript/:videoId[?refresh]   YouTube captions, cached in storage/transcripts/
//   GET    /api/corrections                     the bitácora
//   POST   /api/corrections                     new entry
//   PATCH  /api/corrections/:id                 { status, note }
//   POST   /api/corrections/:id/comments        { text, by }
//   DELETE /api/corrections/:id
// Run: `npm start` → http://localhost:5173  (HOST=0.0.0.0 to open it from your phone on the same Wi-Fi)

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchTranscript, HttpError } from './server/youtube.mjs';
import { correctionsStore } from './server/corrections.mjs';

const root = fileURLToPath(new URL('.', import.meta.url)).replace(/[\\/]+$/, '');
const storage = join(root, 'storage');
const port = Number(process.env.PORT) || 5173;
// Loopback only by default (the API writes files). Both stacks, since "localhost" may resolve to ::1.
const hosts = process.env.HOST ? [process.env.HOST] : ['127.0.0.1', '::1'];
const corrections = correctionsStore(join(storage, 'corrections.json'));

const PUBLIC = new Set(['index.html', 'css', 'js', 'data']);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

// ---------- API ----------

const inflight = new Map();

async function transcript(videoId, refresh) {
  if (!/^[\w-]{11}$/.test(videoId)) throw new HttpError(400, 'Id de video inválido.');
  const file = join(storage, 'transcripts', `${videoId}.json`);
  if (!refresh) {
    try { return JSON.parse(await readFile(file, 'utf8')); } catch { /* not cached yet */ }
  }
  if (!inflight.has(videoId)) {
    inflight.set(videoId, (async () => {
      const data = { ...(await fetchTranscript(videoId)), fetchedAt: new Date().toISOString() };
      await mkdir(join(storage, 'transcripts'), { recursive: true });
      await writeFile(file, JSON.stringify(data));
      return data;
    })().finally(() => inflight.delete(videoId)));
  }
  return inflight.get(videoId);
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 200_000) throw new HttpError(413, 'Demasiado grande.');
  }
  try { return raw ? JSON.parse(raw) : {}; } catch { throw new HttpError(400, 'JSON inválido.'); }
}

async function api(req, res, url) {
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(body === undefined ? '' : JSON.stringify(body));
  };
  try {
    const [, name, id, sub] = url.pathname.split('/').filter(Boolean);
    const m = req.method;
    if (name === 'health' && m === 'GET') return send(200, { ok: true });
    if (name === 'transcript' && m === 'GET') return send(200, await transcript(id, url.searchParams.has('refresh')));
    if (name === 'corrections') {
      if (!id && m === 'GET') return send(200, { items: await corrections.list() });
      if (!id && m === 'POST') return send(201, await corrections.add(await readBody(req)));
      if (id && !sub && m === 'PATCH') return send(200, await corrections.update(id, await readBody(req)));
      if (id && !sub && m === 'DELETE') { await corrections.remove(id); return send(204); }
      if (id && sub === 'comments' && m === 'POST') return send(201, await corrections.comment(id, await readBody(req)));
    }
    send(404, { error: 'Ruta no encontrada.' });
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    send(e.status || 500, { error: e.message || 'Error interno.' });
  }
}

// ---------- static files ----------

async function serveStatic(res, url) {
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '') || 'index.html';
  if (!PUBLIC.has(rel.split(/[/\\]/)[0])) { res.writeHead(404).end('Not found'); return; }
  const file = join(root, rel);
  if (!file.startsWith(root + sep) && file !== root) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}

function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) api(req, res, url);
  else serveStatic(res, url);
}

hosts.forEach((host, i) => {
  const server = createServer(handler);
  server.on('error', e => {
    if (i > 0 && e.code === 'EADDRNOTAVAIL') return; // no IPv6 on this machine: IPv4 is enough
    console.error(e.message);
    process.exit(1);
  });
  server.listen(port, host, () => { if (i === 0) console.log(`Bips running at http://localhost:${port}`); });
});
