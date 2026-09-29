// Official, embeddable sources. Episodes are YouTube video ids from Bloomberg's own channels;
// playlists keep the list fresh without code changes.

export const SHOWS = [
  {
    id: 'realyield', name: 'Real Yield', by: 'Bloomberg TV · Katie Greifeld', kind: 'tv',
    blurb: 'El programa semanal de renta fija: Treasuries, crédito, Fed. El mejor punto de partida.',
    playlist: 'PL5uIwoWea5fAMCJKpsTofcNwnq3Ebhg_U',
    episodes: [
      { v: 'DiFv6xN4q8o', title: 'US Yields Surge, Calling Bessent\'s Bluff', date: '2026-09-10' },
      { v: 'Kr1hDwepRnU', title: 'Yields Surge, Rate Hike Bets Rise', date: '2026-07-23' },
      { v: 'iDKx7fuyFA4', title: 'Real Yield 7/16/2026', date: '2026-07-16' },
      { v: 'd5x6_EEflmo', title: 'Real Yield 7/2/2026', date: '2026-07-02' },
    ],
  },
  {
    id: 'theclose', name: 'The Close', by: 'Bloomberg TV · Romaine Bostick & Scarlet Fu', kind: 'tv',
    blurb: 'El cierre diario de Wall Street. Más rápido, más acciones, mucha jerga de mercado.',
    playlist: 'PLGaYlBJIOoa9ubOo6nAEyu4wmkc6nzIVi',
    episodes: [
      { v: '4sn6pQGVJjE', title: 'Markets Rebound as Oil, Yields & AI Remain in Focus', date: '2026-09-02' },
      { v: 'x9V_uJSI5jY', title: 'Stocks Slide as Oil Surges & Treasury Yields Rise', date: '2026-09-01' },
    ],
  },
  {
    id: 'moneystuff', name: 'Money Stuff: The Podcast', by: 'Bloomberg · Matt Levine & Katie Greifeld', kind: 'podcast',
    blurb: 'La versión en audio del newsletter. Conversación rápida, mucha ironía: ideal después de leer.',
    playlist: 'PLe4PRejZgr0Mxz914cYuVpTiUuqiF3U0x',
    spotify: '11yAA5VXm0IJeZoKL4Fqah',
    apple: 'https://podcasts.apple.com/us/podcast/money-stuff-the-podcast/id1739582836',
    episodes: [
      { v: '1YUebhfObfs', title: 'Perhaps a Ballroom', date: '' },
      { v: 'FidSM0HFilc', title: 'Mouth Noises: 50y, ISS, HF', date: '' },
      { v: 'UgiwHQWFT7I', title: 'American Dream: EDR, BIS, PILOT', date: '' },
    ],
  },
];

export const NEWSLETTER_URL = 'https://www.bloomberg.com/account/newsletters/money-stuff';
