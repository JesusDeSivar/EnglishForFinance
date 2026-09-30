// Latest episodes per show, from YouTube's InnerTube API (the RSS feeds were switched off).
// Each show lists sources in data/media.js:
//   { playlist: 'PL…' }                      – a playlist that is kept newest-first
//   { channel: 'UC…', query: 'Real Yield' }  – search inside one channel
//   { search: 'Bloomberg Real Yield' }       – global search sorted by upload date
// Results are merged, filtered by the show's title pattern, and sorted by date.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const CLIENT = { clientName: 'WEB', clientVersion: '2.20260915.00.00', hl: 'en', gl: 'US' };
const CHANNEL_SEARCH = 'EgZzZWFyY2jyBgQKAloA';
const BY_UPLOAD_DATE = 'CAISAhAB';
const DAY = 86400000;

async function innertube(path, body) {
  const res = await fetch(`https://www.youtube.com/youtubei/v1/${path}?prettyPrint=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
    body: JSON.stringify({ context: { client: CLIENT }, ...body }),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

// Video entries come either as classic renderers or as the newer lockup view models.
function collect(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  const r = node.videoRenderer || node.gridVideoRenderer || node.playlistVideoRenderer;
  if (r?.videoId) {
    out.push({
      v: r.videoId,
      title: r.title?.runs?.map(x => x.text).join('') || r.title?.simpleText || '',
      ago: r.publishedTimeText?.simpleText || (r.videoInfo?.runs || []).map(x => x.text).find(t => /ago/.test(t)) || '',
      length: r.lengthText?.simpleText || '',
    });
    return out;
  }
  const l = node.lockupViewModel;
  if (l?.contentId) {
    const m = l.metadata?.lockupMetadataViewModel;
    const parts = (m?.metadata?.contentMetadataViewModel?.metadataRows || [])
      .flatMap(row => (row.metadataParts || []).map(p => p.text?.content || ''));
    const badge = JSON.stringify(l.contentImage || {}).match(/"text":"(\d+:\d{2}(?::\d{2})?)"/)?.[1];
    out.push({ v: l.contentId, title: m?.title?.content || '', ago: parts.find(p => /ago/.test(p)) || '', length: badge || '' });
    return out;
  }
  for (const v of Object.values(node)) collect(v, out);
  return out;
}

// "9/17/2026" or "9/3" in the title is the air date; otherwise estimate from "2 weeks ago".
export function episodeDate(title, ago, now = new Date()) {
  const m = title.match(/(?:^|\D)(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?!\d)/);
  if (m) {
    let year = m[3] ? +m[3] : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(Date.UTC(year, +m[1] - 1, +m[2]));
    if (!m[3] && d > now) d.setUTCFullYear(year - 1);
    if (!Number.isNaN(+d)) return { date: d.toISOString().slice(0, 10), exact: true };
  }
  const r = ago.match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/i);
  if (r) {
    const unit = { minute: DAY / 1440, hour: DAY / 24, day: DAY, week: 7 * DAY, month: 30 * DAY, year: 365 * DAY }[r[2].toLowerCase()];
    return { date: new Date(now - r[1] * unit).toISOString().slice(0, 10), exact: false };
  }
  return { date: '', exact: false };
}

export async function showEpisodes(show, limit = 8) {
  const found = [];
  const errors = [];
  for (const src of show.sources) {
    try {
      if (src.playlist) found.push(...collect(await innertube('browse', { browseId: 'VL' + src.playlist })));
      else if (src.channel) found.push(...collect(await innertube('browse', { browseId: src.channel, params: CHANNEL_SEARCH, query: src.query })));
      else if (src.search) found.push(...collect(await innertube('search', { query: src.search, params: BY_UPLOAD_DATE })));
    } catch (e) {
      errors.push(e.message);
    }
  }
  const match = new RegExp(show.match, 'i');
  const seen = new Set();
  const episodes = found
    .filter(x => x.v && match.test(x.title) && !seen.has(x.v) && seen.add(x.v))
    .map(x => ({ v: x.v, title: x.title, length: x.length, ...episodeDate(x.title, x.ago) }))
    .filter(x => !show.fullShowsOnly || x.exact)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, limit);
  if (!episodes.length && errors.length) throw new Error(errors.join('; '));
  return episodes;
}

export async function latestEpisodes(shows) {
  const out = { generatedAt: new Date().toISOString(), shows: {} };
  const lists = await Promise.all(shows.map(s => showEpisodes(s).catch(e => {
    out.errors = { ...out.errors, [s.id]: e.message };
    return [];
  })));
  shows.forEach((s, i) => { out.shows[s.id] = lists[i]; }); // stable key order: no spurious diffs
  return out;
}
