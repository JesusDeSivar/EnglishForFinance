// Refresh data/episodes.json (run by the GitHub Action, or by hand: `npm run episodes`).
// With --probe, also checks whether captions can be fetched from this machine's network
// and records only ok/error in the file. No caption text is saved.

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SHOWS } from '../data/media.js';
import { latestEpisodes } from '../server/episodes.mjs';
import { fetchTranscript } from '../server/youtube.mjs';

const file = fileURLToPath(new URL('../data/episodes.json', import.meta.url));
const data = await latestEpisodes(SHOWS);

const total = Object.values(data.shows).reduce((n, list) => n + list.length, 0);
if (!total) {
  console.error('No episodes found; keeping the previous file.', data.errors || '');
  process.exit(1);
}

// Keep the previous list for a show whose fetch came back empty.
let prev = null;
try {
  prev = JSON.parse(await readFile(file, 'utf8'));
  for (const [id, list] of Object.entries(data.shows)) {
    const old = prev.shows?.[id] || [];
    if (!list.length) { data.shows[id] = old; continue; } // fetch failed: keep what we had
    // "2 weeks ago" drifts day by day: keep the first date estimate for known episodes.
    const known = new Map(old.map(e => [e.v, e]));
    for (const e of list) if (!e.exact && known.get(e.v)?.date) e.date = known.get(e.v).date;
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }
  if (!process.argv.includes('--probe') && prev.captionsProbe) data.captionsProbe = prev.captionsProbe;
} catch { /* first run */ }

if (process.argv.includes('--probe')) {
  const v = data.shows.realyield?.[0]?.v || SHOWS[0].episodes[0].v;
  try {
    const t = await fetchTranscript(v);
    data.captionsProbe = { ok: true, via: t.via, segments: t.segments.length, at: data.generatedAt };
  } catch (e) {
    data.captionsProbe = { ok: false, error: e.message, at: data.generatedAt };
  }
}

// Nothing new: leave the file alone so the scheduled job doesn't commit a timestamp bump.
// Only the top 5 count; search results wobble a little further down from run to run.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const head = shows => Object.entries(shows || {}).map(([k, l]) => [k, l.slice(0, 5).map(e => `${e.v}@${e.date}`)]);
if (prev && same(head(prev.shows), head(data.shows)) && same(prev.captionsProbe?.ok, data.captionsProbe?.ok)) {
  console.log('Episode list unchanged.');
  process.exit(0);
}

await writeFile(file, JSON.stringify(data, null, 2) + '\n');
for (const [id, list] of Object.entries(data.shows)) console.log(`${id}: ${list.length} episodes, newest ${list[0]?.date || '—'}`);
if (data.captionsProbe) console.log('captions probe:', JSON.stringify(data.captionsProbe));
