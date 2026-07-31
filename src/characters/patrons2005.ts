/**
 * patrons2005.ts — 2005 Third-Wave Coffeehouse patron population.
 *
 * Configures four period-appropriate patrons via {@link PatronConfig} and
 * registers them with the {@link CharacterRoster} for era 2005. The configs
 * are pure data; the {@link CharacterAvatar} builder composes the procedural
 * seated figures from Three.js primitives.
 *
 * Period detail (from the 2005 brief):
 *   • outfits — bootcut jeans with layered tops (tees under open shirts /
 *     hoodies / flannels)
 *   • hairstyles — side-swept bangs (feminine) and spiky gelled hair (masculine)
 *   • gadgets — flip phones, early iPods, open laptops
 *
 * The four patrons are seated across the three seating-table anchors:
 *   seatingTableA, seatingTableB, seatingTableC (see layout.ts).
 *
 * This module is side-effectful: importing it populates the roster for 2005
 * and registers the `patrons` scene-fragment factory for era 2005.
 */
import { characterRoster } from './CharacterRoster.js';
import type { PatronConfig } from './PatronConfig.js';

// ---------------------------------------------------------------------------
// Period palette (2005 third-wave / mid-2000s — denim washes, muted flannels,
// warm knits). Drawn from the 2005 era's industrial-rustic / artisanal mood.
// ---------------------------------------------------------------------------

const DENIM_BLUE = 0x3a4a6a; // mid-blue bootcut denim wash
const DENIM_DARK = 0x2a3248; // dark indigo bootcut denim wash
const FLANNEL_GREEN = 0x4a5a3a; // olive-green open flannel shirt
const HOODIE_GREY = 0x5a5a64; // heather-grey hoodie
const HAIR_BROWN = 0x3a2818; // dark brown hair
const HAIR_BLONDE = 0x8a6a3a; // dirty-blonde hair
const HAIR_BLACK = 0x1a1a18; // black hair
const BEANIE_DARK = 0x2a2a2e; // dark knitted beanie
const BEANIE_RUST = 0x8a4a2a; // rust-orange knitted beanie
const IPOD_WHITE = 0xe8e8ec; // classic white iPod
const LAPTOP_SILVER = 0xc8c8cc; // silver notebook computer
const PHONE_DARK = 0x2a2a32; // dark flip phone

// ---------------------------------------------------------------------------
// The four 2005 patrons
// ---------------------------------------------------------------------------

/**
 * Patron 1 — a young man in dark bootcut jeans and an olive flannel layered
 * over a cream tee, spiky gelled hair, dark beanie, tapping on an open laptop.
 * Seated at table A.
 */
const PATRON_1: PatronConfig = {
  id: 'guy-flannel-laptop',
  era: 2005,
  outfit: { type: 'bootcutJeans', color: DENIM_DARK, accent: FLANNEL_GREEN },
  hat: { type: 'beanie', color: BEANIE_DARK },
  hair: { style: 'spiky', color: HAIR_BLACK },
  gadget: { type: 'laptop', color: LAPTOP_SILVER },
  seat: 'seatingTableA',
  seatOffset: [-0.28, 0, 0],
  facing: 140,
};

/**
 * Patron 2 — a young woman in mid-blue bootcut jeans and a grey hoodie layered
 * over a striped tee, side-swept bangs, no hat, texting on a flip phone.
 * Seated at table B.
 */
const PATRON_2: PatronConfig = {
  id: 'girl-hoodie-flipphone',
  era: 2005,
  outfit: { type: 'bootcutJeans', color: DENIM_BLUE, accent: HOODIE_GREY },
  hat: { type: 'none', color: 0x000000 },
  hair: { style: 'sideSweptBangs', color: HAIR_BROWN },
  gadget: { type: 'flipPhone', color: PHONE_DARK },
  seat: 'seatingTableB',
  seatOffset: [0.28, 0, 0],
  facing: 220,
};

/**
 * Patron 3 — a young man in dark bootcut jeans and a grey hoodie over a cream
 * tee, spiky hair, rust beanie, listening to an early iPod. Seated at table C.
 */
const PATRON_3: PatronConfig = {
  id: 'guy-hoodie-ipod',
  era: 2005,
  outfit: { type: 'bootcutJeans', color: DENIM_DARK, accent: HOODIE_GREY },
  hat: { type: 'beanie', color: BEANIE_RUST },
  hair: { style: 'spiky', color: HAIR_BROWN },
  gadget: { type: 'iPod', color: IPOD_WHITE },
  seat: 'seatingTableC',
  seatOffset: [-0.26, 0, 0.2],
  facing: 160,
};

/**
 * Patron 4 — a young woman in mid-blue bootcut jeans and an olive flannel over
 * a striped tee, side-swept bangs, no hat, working on an open laptop. Seated at
 * table A across from patron 1.
 */
const PATRON_4: PatronConfig = {
  id: 'girl-flannel-laptop',
  era: 2005,
  outfit: { type: 'bootcutJeans', color: DENIM_BLUE, accent: FLANNEL_GREEN },
  hat: { type: 'none', color: 0x000000 },
  hair: { style: 'sideSweptBangs', color: HAIR_BLONDE },
  gadget: { type: 'laptop', color: LAPTOP_SILVER },
  seat: 'seatingTableA',
  seatOffset: [0.28, 0, 0],
  facing: 220,
};

/** All four 2005 patrons, in a stable order. */
export const PATRONS_2005: readonly PatronConfig[] = [
  PATRON_1,
  PATRON_2,
  PATRON_3,
  PATRON_4,
];

/**
 * Register the four 2005 patrons with the {@link CharacterRoster}. Safe to call
 * once at import time. Idempotent guard: if already registered, no-ops.
 */
export function registerPatrons2005(): void {
  if (characterRoster.has(2005)) return;
  characterRoster.register(PATRONS_2005);
}

// Side-effectful module init: populate the roster on import.
registerPatrons2005();
