/**
 * patrons2025.ts — 2025 Contemporary Specialty Café patron population.
 *
 * Configures four period-appropriate patrons via {@link PatronConfig} and
 * registers them with the {@link CharacterRoster} for era 2025. The configs
 * are pure data; the {@link CharacterAvatar} builder composes the procedural
 * seated figures from Three.js primitives.
 *
 * Period detail (from EraData 2025):
 *   • outfits — athleisure-and-techwear (hoodies/joggers + oversized fits)
 *   • hairstyles — natural-and-gender-fluid (top-knots, loose)
 *   • gadgets — smartphones, open laptops, earbuds, reusable cups
 *
 * The four patrons are seated across the three seating-table anchors:
 *   seatingTableA, seatingTableB, seatingTableC (see layout.ts).
 *
 * This module is side-effectful: importing it populates the roster for 2025
 * and registers the `patrons` scene-fragment factory for era 2025.
 */
import { characterRoster } from './CharacterRoster.js';
import type { PatronConfig } from './PatronConfig.js';

// ---------------------------------------------------------------------------
// Period palette (2025 contemporary — athleisure neutrals, muted earth tones,
// sustainable cupware). Drawn from the 2025 EraData palette: soft-white walls,
// warm-stone floor, bronze trim, reusable cups.
// ---------------------------------------------------------------------------

const HOODIE_CHARCOAL = 0x36383e; // charcoal athleisure hoodie/joggers
const JOGGER_GREY = 0x6a6c72; // light grey athleisure jogger set
const HOODIE_SAGE = 0x8a9a78; // sage-green athleisure set
const TEE_CREAM = 0xe8e2d4; // cream tee under an open overshirt
const OVERSIZED_RUST = 0x9a5a32; // rust oversized sweatshirt + co-ord pants
const BEANIE_CHARCOAL = 0x2d2f34; // charcoal knit beanie
const BEANIE_OAT = 0xcabfa4; // oatmeal knit beanie
const HAIR_DARK = 0x2a1a10; // dark brown hair
const HAIR_HONEY = 0x7a5a30; // honey-blonde hair
const CUP_STONE = 0xeae3d6; // reusable stone keep-cup body
const PHONE_SCREEN = 0x2b3a55; // smartphone screen glow
const LAPTOP_SCREEN = 0x223044; // open laptop screen
const EARBUD_CASE = 0xf2f2f2; // white earbud charging case

// ---------------------------------------------------------------------------
// The four 2025 patrons
// ---------------------------------------------------------------------------

/**
 * Patron 1 — a person in a charcoal athleisure set (hoodie + joggers), oatmeal
 * beanie, top-knot, scrolling a smartphone. Seated at table A.
 */
const PATRON_1: PatronConfig = {
  id: 'athlete-charcoal-hoodie',
  era: 2025,
  outfit: { type: 'athleisure', color: HOODIE_CHARCOAL, accent: TEE_CREAM },
  hat: { type: 'beanie', color: BEANIE_OAT },
  hair: { style: 'topKnot', color: HAIR_DARK },
  gadget: { type: 'smartphone', color: PHONE_SCREEN },
  seat: 'seatingTableA',
  seatOffset: [-0.28, 0, 0],
  facing: 140,
};

/**
 * Patron 2 — a person in a sage athleisure set, no hat (loose hair), wearing
 * earbuds with the case on the table. Seated at table B.
 */
const PATRON_2: PatronConfig = {
  id: 'athlete-sage-earbuds',
  era: 2025,
  outfit: { type: 'athleisure', color: HOODIE_SAGE, accent: TEE_CREAM },
  hat: { type: 'none', color: 0x000000 },
  hair: { style: 'topKnot', color: HAIR_HONEY },
  gadget: { type: 'earbuds', color: EARBUD_CASE },
  seat: 'seatingTableB',
  seatOffset: [0.28, 0, 0],
  facing: 220,
};

/**
 * Patron 3 — a person in a rust oversized co-ord fit, charcoal beanie,
 * working on an open laptop. Seated at table C.
 */
const PATRON_3: PatronConfig = {
  id: 'oversized-rust-laptop',
  era: 2025,
  outfit: { type: 'oversized', color: OVERSIZED_RUST, accent: TEE_CREAM },
  hat: { type: 'beanie', color: BEANIE_CHARCOAL },
  hair: { style: 'slickedBack', color: HAIR_DARK },
  gadget: { type: 'openLaptop', color: LAPTOP_SCREEN },
  seat: 'seatingTableC',
  seatOffset: [-0.26, 0, 0.2],
  facing: 160,
};

/**
 * Patron 4 — a person in a grey athleisure jogger set, no hat, holding a
 * reusable keep-cup. Seated at table A across from patron 1.
 */
const PATRON_4: PatronConfig = {
  id: 'athlete-grey-cup',
  era: 2025,
  outfit: { type: 'athleisure', color: JOGGER_GREY, accent: TEE_CREAM },
  hat: { type: 'none', color: 0x000000 },
  hair: { style: 'topKnot', color: HAIR_DARK },
  gadget: { type: 'reusableCup', color: CUP_STONE },
  seat: 'seatingTableA',
  seatOffset: [0.28, 0, 0],
  facing: 220,
};

/** All four 2025 patrons, in a stable order. */
export const PATRONS_2025: readonly PatronConfig[] = [
  PATRON_1,
  PATRON_2,
  PATRON_3,
  PATRON_4,
];

/**
 * Register the four 2025 patrons with the {@link CharacterRoster}. Safe to call
 * once at import time. Idempotent guard: if already registered, no-ops.
 */
export function registerPatrons2025(): void {
  if (characterRoster.has(2025)) return;
  characterRoster.register(PATRONS_2025);
}

// Side-effectful module init: populate the roster on import.
registerPatrons2025();
