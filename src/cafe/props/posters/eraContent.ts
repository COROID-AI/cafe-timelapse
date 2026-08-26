/**
 * Built-in wall-art catalogue for all five eras.
 *
 * Every title, brand and venue is invented or generic — no real copyrighted
 * artwork is reproduced; each piece is painted procedurally onto a canvas by
 * `posterTextures.ts` using the palettes below.
 *
 * These catalogues seed the pre-built era sets. When the era configs populate
 * their `posters` sections (`WallPoster[]`), those entries take precedence via
 * `resolvePosters.ts`.
 */

import type { PosterEraContent } from './types';

/* ------------------------------------------------------------------------- */
/* 1945 — wartime propaganda & rationing notices (faded paper)               */
/* ------------------------------------------------------------------------- */

const ERA_1945: PosterEraContent = {
  year: 1945,
  name: 'Austerity notices',
  papers: [
    {
      id: 'dig-for-victory',
      style: 'propagandaNotice',
      title: 'DIG FOR VICTORY',
      subtitle: 'EVERY PLOT MUST FEED THE STREET',
      lines: ['ALLOTMENT COMMITTEE', 'SEEDS FROM THE HALL — SATURDAYS'],
      palette: ['#e9dfc6', '#33291d', '#7a2f22', '#3f5a3a'],
      size: [0.95, 1.25],
      wall: 'north',
      tiltDeg: -0.8,
    },
    {
      id: 'tea-rationing',
      style: 'rationingNotice',
      title: 'TEA RATIONING',
      subtitle: 'TWO OUNCES PER PERSON EACH WEEK',
      lines: ['BRING YOUR COUPON BOOK TO THE COUNTER'],
      palette: ['#eadfc4', '#2f2a20', '#8a4a26', '#54432d'],
      size: [0.72, 0.95],
      wall: 'south',
      tiltDeg: 0.6,
    },
    {
      id: 'make-do-mend',
      style: 'propagandaNotice',
      title: 'MAKE DO — MEND',
      subtitle: 'PATCH IT · PASS IT ON',
      lines: ['MENDING CIRCLE — THURSDAY EVENINGS'],
      palette: ['#e6dbc0', '#38301f', '#5c5648', '#8a4a26'],
      size: [0.8, 1.05],
      wall: 'east',
      tiltDeg: 0.9,
    },
    {
      id: 'blackout-by-dusk',
      style: 'propagandaNotice',
      title: 'BLACKOUT BY DUSK',
      subtitle: 'NO CRACK OF LIGHT',
      lines: ['WARDEN ON DUTY TILL SIX'],
      palette: ['#ded3b6', '#26221a', '#3f4d68', '#7a2f22'],
      size: [0.68, 0.9],
      wall: 'east',
      tiltDeg: -1.1,
    },
    {
      id: 'home-rebuild-fund',
      style: 'propagandaNotice',
      title: 'HOME REBUILD FUND',
      subtitle: 'LEND WHERE YOU LIVE',
      lines: ['SAVE PENNIES — RAISE THE ROOF BEAM'],
      palette: ['#e8ddc2', '#33291d', '#8a4a26', '#3f5a3a'],
      size: [0.78, 1.0],
      wall: 'west',
      tiltDeg: 1.2,
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* 1965 — bright pop-art concert/movie posters + travel posters              */
/* ------------------------------------------------------------------------- */

const ERA_1965: PosterEraContent = {
  year: 1965,
  name: 'Pop explosion',
  papers: [
    {
      id: 'voltage-four-live',
      style: 'popArtConcert',
      title: 'THE VOLTAGE FOUR',
      subtitle: 'LIVE AT THE BLUE COMET',
      lines: ['FRIDAY & SATURDAY — TWO SHOWS NIGHTLY'],
      palette: ['#ffd23f', '#e73f6b', '#20b8c9', '#2b2140'],
      size: [1.0, 1.35],
      wall: 'north',
    },
    {
      id: 'atomic-ants-movie',
      style: 'bMoviePoster',
      title: 'INVASION OF THE ATOMIC ANTS',
      subtitle: 'IN GLORIOUS MONOCOLOR',
      lines: ['PLUS SHORT — "THE SINGING SANDWICH"', 'ADMISSION 2/6'],
      palette: ['#f2e9d8', '#c23a2b', '#20356b', '#161310'],
      size: [0.95, 1.3],
      wall: 'north',
      tiltDeg: 0.5,
    },
    {
      id: 'sunny-cove-travel',
      style: 'travelPoster',
      title: 'SUNNY COVE ISLES',
      subtitle: 'FLY MERIDIAN AIR',
      lines: ['THREE FLIGHTS DAILY FROM THE CITY FIELD'],
      palette: ['#f7ead0', '#e88b4a', '#2a9d8f', '#264653'],
      size: [0.9, 1.25],
      wall: 'east',
    },
    {
      id: 'twist-nights',
      style: 'popArtConcert',
      title: 'TWIST NIGHTS',
      subtitle: 'EVERY FRIDAY — THE CELLAR CLUB',
      palette: ['#ffe066', '#ff5964', '#6a4c93', '#141216'],
      size: [0.72, 1.0],
      wall: 'south',
      tiltDeg: -0.7,
    },
    {
      id: 'spin-city-lp',
      style: 'shopAdvert',
      title: 'SPIN CITY RECORD BAR',
      subtitle: 'LP OF THE WEEK — "PAPER MOON"',
      lines: ['ALL SINGLES 6/8 · ASK FOR THE PARLOUR BOOTHS'],
      palette: ['#fdf3d8', '#d1495b', '#33658a', '#1c1a17'],
      size: [0.75, 1.0],
      wall: 'south',
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* 1985 — neon band posters, arcade/film ads, polaroid photos                */
/* ------------------------------------------------------------------------- */

const ERA_1985: PosterEraContent = {
  year: 1985,
  name: 'Neon & static',
  papers: [
    {
      id: 'midnight-circuit-tour',
      style: 'neonBandPoster',
      title: 'MIDNIGHT CIRCUIT',
      subtitle: 'NEON HORIZON TOUR ’85',
      lines: ['WITH STATIC GARDEN + FAX MACHINE DREAMS'],
      palette: ['#0d0221', '#ff2ec4', '#00f0ff', '#faff00'],
      size: [1.05, 1.4],
      wall: 'north',
    },
    {
      id: 'star-vipers-arcade',
      style: 'arcadeAd',
      title: 'STAR VIPERS',
      subtitle: 'NOW PLAYING — INSERT COIN',
      lines: ['HIGH SCORE BOARD BY THE COUNTER'],
      palette: ['#050510', '#39ff14', '#ff2079', '#00e0ff'],
      size: [0.85, 1.15],
      wall: 'north',
    },
    {
      id: 'laser-commando-film',
      style: 'filmAd',
      title: 'LASER COMMANDO III',
      subtitle: 'ONE MAN. TOO MANY LASERS.',
      lines: ['RATED PG — WIDE-SCREEN SOUND'],
      palette: ['#101018', '#ff4655', '#ffb800', '#e8e8e8'],
      size: [0.9, 1.25],
      wall: 'north',
    },
    {
      id: 'polaroid-summer',
      style: 'polaroidPhoto',
      title: 'summer ’85',
      palette: ['#fdfdfd', '#ffb26b', '#ff5964', '#2b2b3a'],
      size: [0.38, 0.44],
      wall: 'west',
      tiltDeg: -3,
    },
    {
      id: 'polaroid-the-gig',
      style: 'polaroidPhoto',
      title: 'the gig!!',
      palette: ['#fdfdfd', '#8ecae6', '#ff2ec4', '#20203a'],
      size: [0.38, 0.44],
      wall: 'west',
      tiltDeg: 2.2,
    },
    {
      id: 'polaroid-new-wheels',
      style: 'polaroidPhoto',
      title: 'new wheels',
      palette: ['#fdfdfd', '#90be6d', '#f9c74f', '#33334d'],
      size: [0.38, 0.44],
      wall: 'west',
      tiltDeg: -1.6,
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* 2005 — glossy film one-sheets, wifi sticker, loyalty cards                */
/* ------------------------------------------------------------------------- */

const ERA_2005: PosterEraContent = {
  year: 2005,
  name: 'Glossy franchise',
  papers: [
    {
      id: 'chronicle-wars-one-sheet',
      style: 'glossyOneSheet',
      title: 'CHRONICLE WARS',
      subtitle: 'PART ONE — THE AMBER THRONE',
      lines: ['THIS CHRISTMAS', 'SEE IT IN DIGITAL PROJECTION'],
      palette: ['#0b0d16', '#e5c76b', '#3d5a80', '#f5f5f5'],
      size: [1.0, 1.45],
      wall: 'north',
    },
    {
      id: 'amber-code-one-sheet',
      style: 'glossyOneSheet',
      title: 'THE AMBER CODE',
      subtitle: 'EVERY CLUE HAS A PRICE',
      lines: ['FROM THE STUDIO THAT BROUGHT YOU NOTHING ELSE'],
      palette: ['#141021', '#d69a3d', '#7b2d43', '#efe6da'],
      size: [0.95, 1.35],
      wall: 'north',
    },
    {
      id: 'live-music-fridays-2005',
      style: 'shopAdvert',
      title: 'LIVE MUSIC FRIDAYS',
      subtitle: 'OPEN DECKS — NO COVER BEFORE 8',
      palette: ['#ffffff', '#e63946', '#1d3557', '#f1faee'],
      size: [0.7, 0.95],
      wall: 'east',
    },
    {
      id: 'wifi-zone-sticker',
      style: 'wifiSticker',
      title: 'FREE Wi-Fi ZONE',
      subtitle: 'ASK AT THE TILL FOR THE PASSWORD',
      palette: ['#0a84ff', '#ffffff', '#10131a'],
      size: [0.42, 0.42],
      wall: 'west-till',
    },
    {
      id: 'bean-barrel-loyalty-card',
      style: 'loyaltyCard',
      title: 'BEAN & BARREL',
      subtitle: 'BUY 9 GET 1 FREE',
      lines: ['STAFF: STAMP, DON’T SIGN'],
      palette: ['#fdf6ec', '#6b4226', '#c98a3d', '#2f2f2f'],
      size: [0.42, 0.56],
      wall: 'west-till',
      tiltDeg: 1.5,
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* 2025 — minimalist art prints, QR event posters, sustainability certificate */
/* ------------------------------------------------------------------------- */

const ERA_2025: PosterEraContent = {
  year: 2025,
  name: 'Quiet minimal',
  papers: [
    {
      id: 'form-stillness-no4',
      style: 'minimalPrint',
      title: 'FORM & STILLNESS',
      subtitle: 'NO. 4 — TERRACOTTA ARCH',
      palette: ['#f4f1ea', '#c96f4a', '#7d8c6f', '#2f2b26'],
      size: [0.9, 1.2],
      wall: 'north',
    },
    {
      id: 'arch-study-two',
      style: 'minimalPrint',
      title: 'ARCH STUDY II',
      subtitle: 'GICLEE ON COTTON RAG — 12/50',
      palette: ['#ece7dd', '#43506b', '#cbb9a0', '#33302a'],
      size: [0.85, 1.1],
      wall: 'north',
      tiltDeg: 0.4,
    },
    {
      id: 'open-mic-qr',
      style: 'qrEventPoster',
      title: 'OPEN MIC THURSDAYS',
      subtitle: 'SCAN FOR SEATS',
      lines: ['DOORS 19:00 · FIVE-MINUTE SETS'],
      palette: ['#fffdf7', '#1f1d1a', '#e4572e', '#17bebb'],
      size: [0.85, 1.15],
      wall: 'east',
    },
    {
      id: 'green-leaf-certificate',
      style: 'sustainabilityCert',
      title: 'GREEN LEAF CERTIFIED',
      subtitle: 'CARBON NEUTRAL ROASTERY — AUDITED 2025',
      lines: ['CERT No. GL-2025-0417 · VALID THROUGH MARCH'],
      palette: ['#fbfaf5', '#2e5d43', '#c9a227', '#4a4a44'],
      size: [0.8, 1.0],
      wall: 'north',
    },
    {
      id: 'planter-workshop-qr',
      style: 'qrEventPoster',
      title: 'PLANTER WORKSHOP',
      subtitle: 'SCAN TO BOOK — SUNDAYS',
      lines: ['SOIL PROVIDED · TAKE HOME WHAT YOU MAKE'],
      palette: ['#f6f3ec', '#233d2e', '#dd8a3c', '#5f6c5a'],
      size: [0.72, 0.98],
      wall: 'south',
    },
  ],
};

/** Ordered catalogue keyed by era year. */
export const POSTER_ERA_CONTENT: Readonly<
  Record<1945 | 1965 | 1985 | 2005 | 2025, PosterEraContent>
> = {
  1945: ERA_1945,
  1965: ERA_1965,
  1985: ERA_1985,
  2005: ERA_2005,
  2025: ERA_2025,
};
