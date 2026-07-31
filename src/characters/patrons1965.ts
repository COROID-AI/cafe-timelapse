/**
 * patrons1965.ts — the 1965-era café patron population.
 *
 * Defines 3-4 {@link PatronConfig}s for the Swinging Sixties Diner: mod-shift
 * dresses, slim suits, beehive/bouffant/bowl-cut hair, slim ties, and
 * transistor-radio / cigarette / cigarette-case gadgets. Each patron is
 * seated at a layout anchor (seatingTableA/B/C) with a small table-sharing
 * offset and a facing rotation toward the room centre.
 *
 * The configs are registered with the shared {@link characterRoster} for
 * era 1965 — and ONLY era 1965 — so the roster's era-scoped visibility
 * guarantees these patrons are never returned for another era.
 *
 * This module is side-effectful: importing it populates the roster.
 */
import { characterRoster } from './CharacterRoster.js';
import type { PatronConfig } from './PatronConfig.js';

/** The era this module registers patrons for. */
const ERA = 1965 as const;

/**
 * The 1965 patron population. Four figures spanning the brief:
 *   1. Mod girl in a shift dress + beehive, transistor radio.
 *   2. Slim-suited mod with a bowl cut + slim tie, cigarette.
 *   3. Bouffant patron in a miniskirt, cigarette case.
 *   4. Second slim-suited mod (bowl cut) sharing a table, sunglasses.
 *
 * Seated at the three seating anchors (A/B/C) with XZ offsets so two patrons
 * can share table C without overlapping.
 */
const PATRONS_1965: readonly PatronConfig[] = [
  {
    id: '1965-mod-girl-1',
    era: ERA,
    label: 'Mod girl with transistor radio',
    outfit: 'mod-shift-dress',
    hairstyle: 'beehive',
    gadget: 'transistor-radio',
    anchor: 'seatingTableA',
    offset: { x: -0.3, z: 0.4 },
    rotation: 0.4,
    clothingTint: 0xd33b2e,
    hairTint: 0x1a0e08,
  },
  {
    id: '1965-slim-suit-1',
    era: ERA,
    label: 'Slim-suited mod with cigarette',
    outfit: 'slim-suit',
    hairstyle: 'bowl-cut',
    gadget: 'cigarette',
    anchor: 'seatingTableB',
    offset: { x: 0.3, z: 0.4 },
    rotation: -0.6,
    clothingTint: 0x2a2a2a,
    hairTint: 0x2a1a0e,
  },
  {
    id: '1965-bouffant-1',
    era: ERA,
    label: 'Bouffant patron with cigarette case',
    outfit: 'miniskirt',
    hairstyle: 'bouffant',
    gadget: 'cigarette-case',
    anchor: 'seatingTableC',
    offset: { x: -0.3, z: 0.4 },
    rotation: 1.0,
    clothingTint: 0xff2d95,
    hairTint: 0x3a1a08,
  },
  {
    id: '1965-slim-suit-2',
    era: ERA,
    label: 'Slim-suited mod with sunglasses',
    outfit: 'slim-suit',
    hairstyle: 'bowl-cut',
    gadget: 'sunglasses',
    anchor: 'seatingTableC',
    offset: { x: 0.3, z: 0.4 },
    rotation: -0.3,
    clothingTint: 0x2f8f8f,
    hairTint: 0x1a0e08,
  },
] as const;

/**
 * Register the 1965 patron population with the shared roster. Idempotent:
 * safe to call multiple times (re-registration of an existing id is skipped).
 */
export function registerPatrons1965(): void {
  // Avoid duplicate-id throws on re-import / re-call by only registering
  // patrons whose id is not already on the roster.
  const existing = new Set(characterRoster.getPatrons(ERA).map((c) => c.id));
  const toRegister = PATRONS_1965.filter((c) => !existing.has(c.id));
  if (toRegister.length > 0) {
    characterRoster.register(ERA, ...toRegister);
  }
}

/** The 1965 patron configs (readonly, for inspection/tests). */
export function getPatrons1965(): readonly PatronConfig[] {
  return PATRONS_1965;
}

// Register on import so the roster is populated before any era-fragment
// builder or scene controller queries it.
registerPatrons1965();
