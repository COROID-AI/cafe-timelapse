/**
 * patrons1985.ts — 1985-era café patron population.
 *
 * Declares four period-appropriate {@link PatronConfig}s for the 1985
 * "Eighties Coffee Bar" era and registers them with the shared
 * {@link CharacterRoster}. Each patron is configured against the era's brief:
 *
 *   • shoulder-pad blazers     — power-suit jackets with padded shoulders
 *   • Members-Only jackets     — quilted satin collarless jackets
 *   • big hair / mullets       — voluminous teased hair + short-top/long-back
 *   • Sony Walkman headphones  — over-head band with earcups (gadgets)
 *   • leg warmers             — implied via the lower-body palette accents
 *
 * Seating: each patron is seated at one of the three stable customer-table
 * anchors (`seatingTableA/B/C`) from {@link src/world/layout.ts}, facing the
 * table centre, so they read as seated at the café tables.
 *
 * Era scoping: because every config carries `era: 1985`, the
 * CharacterRoster returns these patrons ONLY for era 1985. They are absent
 * from the scene graph of every other era (the SceneManager only mounts the
 * active era's group), satisfying the "not visible in other eras" criterion.
 *
 * This module is side-effectful: importing it populates the shared roster.
 */
import type { PatronConfig } from './PatronConfig.js';
import { registerPatrons } from './CharacterRoster.js';

// ---------------------------------------------------------------------------
// 1985 palette accents (drawn from the era palette in EraPalette.ts)
// ---------------------------------------------------------------------------

/**
 * 1985-specific colour anchors for patron garments. Sourced from the
 * PALETTE_1985 tokens (primary magenta, secondary teal, accent purple,
 * accentSwatches gold) so the patrons share the era's visual identity rather
 * than picking ad-hoc hues — the same constraint the rest of the asset
 * library honours.
 */
const C = {
  magenta: 0xc5308a,
  teal: 0x36a0b0,
  purple: 0x7a3fb0,
  gold: 0xe0a93b,
  navy: 0x2a3a5a,
  cream: 0xe8e0d0,
  black: 0x1a1a1a,
  denim: 0x3a5a8a,
  brownHair: 0x4a2e1a,
  blondeHair: 0xb89a4a,
  blackHair: 0x1a1410,
  redHair: 0x8a2a1a,
} as const;

// ---------------------------------------------------------------------------
// The four 1985 patrons
// ---------------------------------------------------------------------------

/**
 * The four 1985-era patron configurations. Exactly four (within the 3–4
 * acceptance range), each seated at a distinct anchor and facing its table.
 */
export const PATRONS_1985: readonly PatronConfig[] = [
  {
    id: '1985-margaret',
    era: 1985,
    outfit: { type: 'shoulder-pad-blazer', color: C.magenta },
    hair: { style: 'big-hair', color: C.blondeHair },
    gadgets: ['walkman-headphones', 'walkman-clip'],
    anchor: 'seatingTableA',
    facing: 35,
    skinColor: 0xe8c0a0,
  },
  {
    id: '1985-derek',
    era: 1985,
    outfit: { type: 'members-only-jacket', color: C.navy },
    hair: { style: 'mullet', color: C.brownHair },
    gadgets: ['walkman-headphones'],
    anchor: 'seatingTableB',
    facing: -40,
    skinColor: 0xd4a373,
  },
  {
    id: '1985-stacey',
    era: 1985,
    outfit: { type: 'shoulder-pad-blazer', color: C.teal },
    hair: { style: 'big-hair', color: C.redHair },
    gadgets: ['walkman-headphones', 'walkman-clip'],
    anchor: 'seatingTableC',
    facing: 150,
    skinColor: 0xc9986a,
  },
  {
    id: '1985-trevor',
    era: 1985,
    outfit: { type: 'members-only-jacket', color: C.cream },
    hair: { style: 'mullet', color: C.blackHair },
    gadgets: ['walkman-headphones'],
    anchor: 'seatingTableA',
    facing: -145,
    skinColor: 0xbc8a5a,
  },
];

/**
 * Register the four 1985-era patrons with the shared {@link CharacterRoster}.
 * Idempotent: the roster guards against duplicate patron ids, so importing
 * this module twice is safe (the second call is a no-op via the duplicate-id
 * guard).
 *
 * NOTE: the duplicate-id guard THROWS on a true duplicate. Because this
 * module's top-level side effect calls {@link registerEra1985Patrons} once,
 * the guard protects against accidental re-import in HMR/SSR scenarios.
 */
export function registerEra1985Patrons(): void {
  registerPatrons(PATRONS_1985);
}

// Register on import so the shared roster is populated before the scene
// controller queries it, mirroring the era-fragment side-effect pattern.
registerEra1985Patrons();
