// Shows and where to find their latest episodes. The live list comes from the server
// (/api/episodes) or, on static hosting, from data/episodes.json, which a GitHub Action
// refreshes every 6 hours. `episodes` below is only the last-resort fallback.

const BLOOMBERG_TV = 'UCIALMKvObZNtJ6AmdCLP7Lg';

export const SHOWS = [
  {
    id: 'realyield', name: 'Real Yield', by: 'Bloomberg TV · Katie Greifeld', kind: 'tv',
    blurb: 'El programa semanal de renta fija: Treasuries, crédito, Fed. El mejor punto de partida.',
    sources: [{ channel: BLOOMBERG_TV, query: 'Real Yield' }, { search: 'Bloomberg Real Yield' }],
    match: 'Real Yield', fullShowsOnly: true,
    more: `https://www.youtube.com/channel/${BLOOMBERG_TV}/search?query=Real%20Yield`,
    episodes: [
      { v: 'a0veIlccyps', title: "Fed Hikes, Warsh's Credibility, Credit Concerns | Real Yield 9/17/2026", date: '2026-09-17' },
      { v: 'DiFv6xN4q8o', title: "US Yields Surge, Calling Bessent's Bluff | Real Yield 9/10/2026", date: '2026-09-10' },
    ],
  },
  {
    id: 'theclose', name: 'The Close', by: 'Bloomberg TV · Romaine Bostick & Scarlet Fu', kind: 'tv',
    blurb: 'El cierre diario de Wall Street. Más rápido, más acciones, mucha jerga de mercado.',
    sources: [{ channel: BLOOMBERG_TV, query: 'The Close' }, { search: 'Bloomberg "The Close"' }],
    match: '\\bThe Close\\b', fullShowsOnly: true,
    more: `https://www.youtube.com/channel/${BLOOMBERG_TV}/search?query=The%20Close`,
    episodes: [
      { v: 'KuFKfbFZbZc', title: 'OpenAI’s Altman Unveils Astra as a New Step Toward AGI | The Close 9/3/2026', date: '2026-09-03' },
      { v: '4sn6pQGVJjE', title: 'Markets Rebound as Oil, Yields & AI Remain in Focus | The Close 9/2/2026', date: '2026-09-02' },
    ],
  },
  {
    id: 'moneystuff', name: 'Money Stuff: The Podcast', by: 'Bloomberg · Matt Levine & Katie Greifeld', kind: 'podcast',
    blurb: 'La versión en audio del newsletter. Conversación rápida, mucha ironía: ideal después de leer.',
    sources: [{ playlist: 'PLe4PRejZgr0Mxz914cYuVpTiUuqiF3U0x' }],
    match: 'Money Stuff',
    more: 'https://www.youtube.com/playlist?list=PLe4PRejZgr0Mxz914cYuVpTiUuqiF3U0x',
    spotify: '11yAA5VXm0IJeZoKL4Fqah',
    apple: 'https://podcasts.apple.com/us/podcast/money-stuff-the-podcast/id1739582836',
    episodes: [
      { v: 'ESYfsww0r9Y', title: 'Trying to Save the World Is No Excuse | Money Stuff: The Podcast', date: '2026-09-18' },
      { v: 'U5O5HjzH9dg', title: "What's the Concern? | Money Stuff: The Podcast", date: '2026-09-11' },
    ],
  },
];

export const NEWSLETTER_URL = 'https://www.bloomberg.com/account/newsletters/money-stuff';

// Where a static copy of the app (GitHub Pages) reads the refreshed list: the raw file on
// main is always current, even before Pages redeploys.
export const EPISODES_JSON_URL = 'https://raw.githubusercontent.com/JesusDeSivar/EnglishForFinance/main/data/episodes.json';
