/**
 * patrons1945.ts — 1945 Postwar Café patron population.
 *
 * Configures four period-appropriate patrons via {@link PatronConfig} and
 * registers them with the {@link CharacterRoster} for era 1945. The configs
 * are pure data; the {@link CharacterAvatar} builder composes the procedural
 * seated figures from Three.js primitives.
 *
 * Period detail (from EraData 1945):
 *   • outfits — utility suits and floral day dresses
 *   • hairstyles — victory rolls and slicked-back
 *   • gadgets — newspapers (wartime headlines) + pocket watches
 *
 * The four patrons are seated across the three seating-table anchors:
 *   seatingTableA, seatingTableB, seatingTableC (see layout.ts).
 *
 * This module is side-effectful: importing it populates the roster for 1945
 * and registers the `patrons` scene-fragment factory for era 1945.
 */
import { characterRoster } from './CharacterRoster.js';
import type { StructuredPatronConfig } from './PatronConfig.js';

// ---------------------------------------------------------------------------
// Period palette (1945 utility-CC41 era — muted, rationed-fabric tones).
// Drawn from the 1945 EraPalette: forest-green, brass, wartime-red, cream.
// ---------------------------------------------------------------------------

const SUIT_CHARCOAL = 0x2f3138; // utility wool suit
const SUIT_BROWN = 0x4a3a28; // brown tweed suit
const SHIRT_CREAM = 0xe8dcc0; // cream shirt / blouse
const SHIRT_SAGE = 0x8a9a78; // sage blouse
const DRESS_FLORAL_RED = 0x9a3a30; // floral day dress (red ground)
const DRESS_NAVY = 0x2a3a52; // navy day dress
const FEDORA_BROWN = 0x3a2a18; // brown felt fedora
const FEDORA_CHARCOAL = 0x252628; // charcoal felt fedora
const HAIR_DARK = 0x2a1a10; // dark brown hair
const HAIR_AUBURN = 0x5a3018; // auburn hair
const PAPER_NEWS = 0xe8dcc0; // newsprint paper
const WATCH_BRASS = 0xb5883a; // brass pocket-watch case

// ---------------------------------------------------------------------------
// The four 1945 patrons
// ---------------------------------------------------------------------------

/**
 * Patron 1 — a gentleman in a charcoal utility suit, brown fedora, slicked-back
 * hair, reading the newspaper. Seated at table A.
 */
const PATRON_1: StructuredPatronConfig = {
  id: 'gent-charcoal-suit',
  era: 1945,
  outfit: { type: 'suit', color: SUIT_CHARCOAL, accent: SHIRT_CREAM },
  hat: { type: 'fedora', color: FEDORA_BROWN },
  hair: { style: 'slickedBack', color: HAIR_DARK },
  gadget: { type: 'newspaper', color: PAPER_NEWS },
  seat: 'seatingTableA',
  seatOffset: [-0.28, 0, 0],
  facing: 140,
};

/**
 * Patron 2 — a lady in a floral red day dress, victory rolls, no hat, reading
 * the newspaper. Seated at table B.
 */
const PATRON_2: StructuredPatronConfig = {
  id: 'lady-floral-dress',
  era: 1945,
  outfit: { type: 'dayDress', color: DRESS_FLORAL_RED, accent: SHIRT_CREAM },
  hat: { type: 'none', color: 0x000000 },
  hair: { style: 'victoryRolls', color: HAIR_AUBURN },
  gadget: { type: 'newspaper', color: PAPER_NEWS },
  seat: 'seatingTableB',
  seatOffset: [0.28, 0, 0],
  facing: 220,
};

/**
 * Patron 3 — a gentleman in a brown tweed suit, charcoal fedora, pompadour,
 * checking a brass pocket watch. Seated at table C.
 */
const PATRON_3: StructuredPatronConfig = {
  id: 'gent-tweed-suit',
  era: 1945,
  outfit: { type: 'suit', color: SUIT_BROWN, accent: SHIRT_SAGE },
  hat: { type: 'fedora', color: FEDORA_CHARCOAL },
  hair: { style: 'pompadour', color: HAIR_DARK },
  gadget: { type: 'pocketWatch', color: WATCH_BRASS },
  seat: 'seatingTableC',
  seatOffset: [-0.26, 0, 0.2],
  facing: 160,
};

/**
 * Patron 4 — a lady in a navy day dress, finger waves, no hat, reading the
 * newspaper. Seated at table A across from patron 1.
 */
const PATRON_4: StructuredPatronConfig = {
  id: 'lady-navy-dress',
  era: 1945,
  outfit: { type: 'dayDress', color: DRESS_NAVY, accent: SHIRT_CREAM },
  hat: { type: 'none', color: 0x000000 },
  hair: { style: 'fingerWaves', color: HAIR_DARK },
  gadget: { type: 'newspaper', color: PAPER_NEWS },
  seat: 'seatingTableA',
  seatOffset: [0.28, 0, 0],
  facing: 220,
};

/** All four 1945 patrons, in a stable order. */
export const PATRONS_1945: readonly StructuredPatronConfig[] = [
  PATRON_1,
  PATRON_2,
  PATRON_3,
  PATRON_4,
];

/**
 * Register the four 1945 patrons with the {@link CharacterRoster}. Safe to call
 * once at import time. Idempotent guard: if already registered, no-ops.
 */
export function registerPatrons1945(): void {
  if (characterRoster.has(1945)) return;
  characterRoster.register(PATRONS_1945);
}

// Side-effectful module init: populate the roster on import.
registerPatrons1945();
