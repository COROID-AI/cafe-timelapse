/**
 * PatronConfig.ts — declarative appearance + placement contract for a café patron.
 *
 * A {@link PatronConfig} is a pure-data description of one patron's outfit,
 * hat, hairstyle, held gadget, and the architecture anchor they sit at. It
 * contains **zero geometry** — the {@link CharacterAvatar} builder consumes a
 * config and composes Three.js primitives into a seated figure. This keeps the
 * "describe what" (config) cleanly separated from the "build how" (avatar), so
 * era population tasks only ever write data, never rebuild character geometry.
 *
 * Every era-population task (Phase 6) creates 3–4 of these per era and hands
 * them to the {@link CharacterRoster}, which both stores them and registers a
 * scene-fragment factory with the {@link AssetRegistry} so the patrons mount /
 * unmount automatically with the era switch.
 */
import type { EraYear } from '../data/EraData.js';
import type { AnchorKey } from '../world/layout.js';

// -----------------------------------------------------------------------
// Outfit
// -----------------------------------------------------------------------

/** The two 1945-era garment families a patron can wear. */
export type OutfitType = 'suit' | 'dayDress';

/** Describes the patron's torso garment. */
export interface OutfitConfig {
  /** Garment family — drives the avatar silhouette. */
  readonly type: OutfitType;
  /** Primary garment colour (jacket / dress bodice), as a hex number. */
  readonly color: number;
  /** Accent colour (shirt collar, blouse, lapel trim), as a hex number. */
  readonly accent: number;
}

// -----------------------------------------------------------------------
// Hat
// -----------------------------------------------------------------------

/** Headwear families supported by the avatar builder. */
export type HatType = 'fedora' | 'wideBrim' | 'cloche' | 'none';

/** Describes the patron's hat. Use `{ type: 'none' }` for hat-less patrons. */
export interface HatConfig {
  readonly type: HatType;
  /** Hat colour, as a hex number. */
  readonly color: number;
}

// -----------------------------------------------------------------------
// Hair
// -----------------------------------------------------------------------

/**
 * Period hairstyle families. Each maps to a distinct procedural hair sculpt on
 * the avatar head.
 */
export type HairStyle =
  | 'victoryRolls' // 1940s voluminous rolled-updos (feminine)
  | 'fingerWaves' // 1930s–40s sculpted S-waves (feminine)
  | 'slickedBack' // classic short-back-and-sides (masculine)
  | 'pompadour'; // volume-forward roll (masculine)

/** Describes the patron's hairstyle. */
export interface HairConfig {
  readonly style: HairStyle;
  /** Hair colour, as a hex number. */
  readonly color: number;
}

// -----------------------------------------------------------------------
// Held gadget
// -----------------------------------------------------------------------

/**
 * Held-prop families. The avatar builder places the gadget in the patron's
 * hands at table height.
 */
export type GadgetType = 'newspaper' | 'pocketWatch' | 'none';

/** Describes the patron's held gadget. */
export interface GadgetConfig {
  readonly type: GadgetType;
  /** Optional gadget colour override (defaults to a period-appropriate tone). */
  readonly color?: number;
}

// -----------------------------------------------------------------------
// PatronConfig
// -----------------------------------------------------------------------

/**
 * The complete, declarative description of one café patron. Pure data — no
 * geometry, no materials, no Three.js imports. Era-population tasks create
 * these and hand them to the {@link CharacterRoster}.
 */
export interface PatronConfig {
  /** Stable unique identifier for this patron within its era. */
  readonly id: string;
  /** The era this patron belongs to. */
  readonly era: EraYear;
  /** Torso garment. */
  readonly outfit: OutfitConfig;
  /** Headwear. */
  readonly hat: HatConfig;
  /** Hairstyle. */
  readonly hair: HairConfig;
  /** Held prop. */
  readonly gadget: GadgetConfig;
  /**
   * The architecture anchor (from {@link RoomAnchors}) the patron is seated at.
   * Must be a seating-table anchor for seated patrons.
   */
  readonly seat: AnchorKey;
  /**
   * Optional local-space offset from the anchor (x, y, z in metres) to
   * disambiguate two patrons sharing one table. Defaults to `[0, 0, 0]`.
   */
  readonly seatOffset?: readonly [number, number, number];
  /**
   * Y-axis rotation in degrees. `0` faces +Z (toward the camera / storefront).
   * Defaults to `0`.
   */
  readonly facing?: number;
  /** Optional skin-tone colour (hex). Defaults to a mid warm tone. */
  readonly skinTone?: number;
}

/** The architecture-anchor keys that are valid seats for a seated patron. */
export const SEATING_ANCHORS: readonly AnchorKey[] = [
  'seatingTableA',
  'seatingTableB',
  'seatingTableC',
] as const;

/** Default skin tone (warm mid-tone) used when `skinTone` is omitted. */
export const DEFAULT_SKIN_TONE = 0xc8956b;

/** Default local-space seat offset (directly at the anchor). */
export const DEFAULT_SEAT_OFFSET: readonly [number, number, number] = [0, 0, 0];
