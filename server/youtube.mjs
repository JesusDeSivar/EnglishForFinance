// Fetch a YouTube video's English captions, trying several routes because YouTube
// changes which ones work. Returns [{ t: seconds, text }].

import { GLOSSARY } from '../data/glossary.js';

const WEB_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const ANDROID = { clientName: 'ANDROID', clientVersion: '20.10.38', androidSdkVersion: 30, hl: 'en', gl: 'US' };
const ANDROID_UA = `com.google.android.youtube/${ANDROID.clientVersion} (Linux; U; Android 11) gzip`;

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function fetchTranscript(videoId) {
  if (!/^[\w-]{11}$/.test(videoId)) throw new HttpError(400, 'Id de video inválido.');
  const errors = [];
  for (const [name, route] of [['android', viaAndroidPlayer], ['watch-page', viaWatchPage], ['get_transcript', viaTranscriptPanel]]) {
    try {
      const segments = await route(videoId);
      if (segments?.length) return { videoId, via: name, segments: fixCaps(segments) };
      errors.push(`${name}: vacío`);
    } catch (e) {
      if (e instanceof HttpError && e.status === 404) throw e;
      errors.push(`${name}: ${e.message}`);
    }
  }
  throw new HttpError(502, `No se pudo obtener la transcripción (${errors.join('; ')}).`);
}

// ---- route 1: InnerTube player API as the Android app (caption URLs work without a PO token) ----

async function viaAndroidPlayer(videoId) {
  const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': ANDROID_UA },
    body: JSON.stringify({ context: { client: ANDROID }, videoId }),
  });
  if (!res.ok) throw new Error(`player ${res.status}`);
  const player = await res.json();
  return fromTracks(player, { 'User-Agent': ANDROID_UA });
}

// ---- route 2: the public watch page ----

async function watchPage(videoId) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: { 'User-Agent': WEB_UA, 'Accept-Language': 'en-US,en;q=0.9', Cookie: 'CONSENT=YES+cb; SOCS=CAI' },
  });
  if (!res.ok) throw new Error(`watch ${res.status}`);
  return res.text();
}

function extractJSON(html, marker) {
  const start = html.indexOf(marker);
  if (start < 0) return null;
  let i = html.indexOf('{', start), depth = 0, inStr = false;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (inStr) { if (c === '\\') j++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(html.slice(i, j + 1));
  }
  return null;
}

async function viaWatchPage(videoId) {
  const player = extractJSON(await watchPage(videoId), 'ytInitialPlayerResponse');
  if (!player) throw new Error('sin playerResponse');
  return fromTracks(player, { 'User-Agent': WEB_UA });
}

// ---- route 3: the "Show transcript" panel endpoint ----

async function viaTranscriptPanel(videoId) {
  const html = await watchPage(videoId);
  const data = extractJSON(html, 'ytInitialData');
  const params = JSON.stringify(data || {}).match(/"getTranscriptEndpoint":\{"params":"([^"]+)"/)?.[1];
  if (!params) throw new Error('sin panel de transcripción');
  const clientVersion = html.match(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/)?.[1] || '2.20260901.00.00';
  const res = await fetch('https://www.youtube.com/youtubei/v1/get_transcript?prettyPrint=false', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': WEB_UA },
    body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion, hl: 'en', gl: 'US' } }, params }),
  });
  if (!res.ok) throw new Error(`get_transcript ${res.status}`);
  const out = [];
  (function walk(node) {
    if (!node || typeof node !== 'object') return;
    const seg = node.transcriptSegmentRenderer;
    if (seg) {
      const text = (seg.snippet?.runs || []).map(r => r.text).join('').trim();
      if (text) out.push({ t: +seg.startMs / 1000, text });
      return;
    }
    for (const v of Object.values(node)) walk(v);
  })(await res.json());
  return out;
}

// ---- shared helpers ----

async function fromTracks(player, headers) {
  const status = player?.playabilityStatus?.status;
  if (status && status !== 'OK') throw new Error(`playability ${status}`);
  const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  if (!tracks.length) throw new HttpError(404, 'Este video no tiene subtítulos.');
  const en = tracks.filter(t => /^en/.test(t.languageCode));
  const track = en.find(t => t.kind !== 'asr') || en[0] || tracks.find(t => t.isTranslatable);
  if (!track) throw new HttpError(404, 'Este video no tiene subtítulos en inglés.');
  const url = new URL(track.baseUrl);
  url.searchParams.delete('fmt');
  if (!/^en/.test(track.languageCode)) url.searchParams.set('tlang', 'en');
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`timedtext ${res.status}`);
  return parseTimedText(await res.text());
}

// ---- TV captions arrive in ALL CAPS: convert to sentence case, keeping acronyms and names ----

// Only words that are never ordinary lowercase English ("may", "us", "new" stay lowercase).
const KEEP = new Map([
  ...['I', "I'm", "I've", "I'd", "I'll", 'Fed', 'Treasury', 'Treasuries', 'Bloomberg', 'America', 'American', 'Americans',
    'China', 'Chinese', 'Japan', 'Japanese', 'Europe', 'European', 'Germany', 'German', 'UK', 'EU', 'ECB', 'BOJ', 'BOE', 'Mexico',
    'Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'India', 'Canada', 'Congress', 'Senate', 'Washington',
    'Nasdaq', 'S&P', 'Dow', 'Nvidia', 'Microsoft', 'Tesla', 'Amazon', 'Google', 'Goldman', 'Sachs', 'JPMorgan',
    'BlackRock', 'Pimco', 'Powell', 'Warsh', 'Bessent', 'Trump', 'Katie', 'Greifeld', 'Romaine', 'Bostick', 'Scarlet',
    'Levine', 'January', 'February', 'April', 'June', 'July', 'August', 'September', 'October', 'November',
    'December', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'AI', 'GDP', 'CEO', 'CFO', 'ETF', 'ETFs', 'OK',
  ].map(w => [w.toLowerCase(), w]),
  // Acronyms from the glossary's case-sensitive aliases (CPI, FOMC, EMBI, CACs…), minus real words.
  ...GLOSSARY.flatMap(g => g.alias)
    .filter(a => /^=[A-Z][A-Za-z0-9&]*$/.test(a) && (a.match(/[A-Z]/g) || []).length >= 2 && !['=MOVE'].includes(a))
    .map(a => [a.slice(1).toLowerCase(), a.slice(1)]),
]);
const PHRASES = ['Wall Street', 'New York', 'White House', 'Morgan Stanley', 'Wells Fargo', 'Real Yield', 'Money Stuff', 'Matt Levine', 'Scarlet Fu'];

function fixCaps(segments) {
  const letters = segments.map(s => s.text).join('').replace(/[^A-Za-z]/g, '');
  if (!letters || (letters.match(/[A-Z]/g) || []).length / letters.length < 0.8) return segments;
  let sentenceStart = true;
  return segments.map(({ t, text }) => {
    let s = text.replace(/^>>\s*/, () => { sentenceStart = true; return ''; }).toLowerCase();
    s = s.replace(/\bu\.s\.(?=\W|$)/g, 'U.S.').replace(/[a-z][a-z0-9&'’-]*/g, w => KEEP.get(w.replace('’', "'")) ?? w);
    for (const p of PHRASES) s = s.replace(new RegExp(`\\b${p}\\b`, 'gi'), p);
    s = s.replace(/(^|[.!?]\s+)([a-z])/g, (m, pre, c, at) => (at === 0 && !sentenceStart ? m : pre + c.toUpperCase()));
    sentenceStart = /[.!?]["”’)]?$/.test(s);
    return { t, text: s };
  });
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = s => s
  .replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => e[0] === '#'
    ? String.fromCodePoint(parseInt(e.slice(e[1] === 'x' || e[1] === 'X' ? 2 : 1), e[1] === 'x' || e[1] === 'X' ? 16 : 10))
    : ENTITIES[e] ?? m);

// Handles both formats YouTube serves: srv1 (<text start dur>) and srv3 (<p t d> with <s> words).
export function parseTimedText(xml) {
  const out = [];
  const clean = s => decode(decode(s.replace(/<[^>]+>/g, ''))).replace(/\s+/g, ' ').trim();
  for (const m of xml.matchAll(/<text start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)) {
    const text = clean(m[2]);
    if (text) out.push({ t: +m[1], text });
  }
  if (!out.length) {
    for (const m of xml.matchAll(/<p t="(\d+)"[^>]*>([\s\S]*?)<\/p>/g)) {
      const text = clean(m[2]);
      if (text) out.push({ t: +m[1] / 1000, text });
    }
  }
  return out;
}
