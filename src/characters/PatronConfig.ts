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
 *
 * This split keeps the data (what a patron *is*) separate from the render
 * (how a patron *looks*), so the {@link CharacterRoster} can reason about
 * era-scoped visibility purely in data terms and the avatar builder can be
 * swapped or refined without touching patron definitions.
 *
 * Patron definitions live in per-era modules (e.g.
 * {@link src/characters/patrons1945.js patrons1945} and
 * {@link src/characters/patrons1965.js patrons1965}) which construct
 * PatronConfig objects and register them with the roster.
 */
import type { EraYear } from '../data/EraData.js';
import type { AnchorKey } from '../world/layout.js';

// -----------------------------------------------------------------------
// Outfit
// -----------------------------------------------------------------------

/** Garment families a patron can wear (structured form). 1945: suit / dayDress. 2005: bootcutJeans. */
export type OutfitType = 'suit' | 'dayDress' | 'bootcutJeans';

/** Describes the patron's torso garment (1945 structured-outfit form). */
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
export type HatType = 'fedora' | 'wideBrim' | 'cloche' | 'beanie' | 'none';

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
  | 'pompadour' // volume-forward roll (masculine)
  | 'sideSweptBangs' // 2000s side-fringe sweep (feminine)
  | 'spiky'; // 2000s gelled spikes (masculine)

/** Describes the patron's hairstyle (1945 structured-hair form). */
export interface HairConfig {
  readonly style: HairStyle;
  /** Hair colour, as a hex number. */
  readonly color: number;
}

// -----------------------------------------------------------------------
// Held gadget
// -----------------------------------------------------------------------

/**
 * Held-prop families (1945 structured-gadget form). The avatar builder places
 * the gadget in the patron's hands at table height.
 */
export type GadgetType =
  | 'newspaper'
  | 'pocketWatch'
  | 'flipPhone' // 2000s clamshell mobile
  | 'iPod' // 2000s portable music player
  | 'laptop' // 2000s open notebook computer
  | 'none';

/** Describes the patron's held gadget (structured form). */
export interface GadgetConfig {
  readonly type: GadgetType;
  /** Optional gadget colour override (defaults to a period-appropriate tone). */
  readonly color?: number;
}

// -----------------------------------------------------------------------
// Period outfit / hairstyle / gadget vocabulary (flat-slug form)
// -----------------------------------------------------------------------

/**
 * Named period outfits. Each era's patron module picks from the vocabulary
 * appropriate to its decade; the values are descriptive slugs (not free-form
 * strings) so tests and tooling can assert era-appropriateness without parsing
 * prose.
 */
export type PatronOutfit =
  // 1945
  | 'utility-suit'
  | 'land-girl-uniform'
  | 'tea-dress'
  // 1965
  | 'mod-shift-dress'
  | 'slim-suit'
  | 'miniskirt'
  // 1985
  | 'power-suit'
  | 'punk-leather'
  | 'tracksuit'
  // 2005
  | 'low-rise-denim'
  | ' graphic-tee'
  | 'hoodie'
  // 2025
  | 'athleisure'
  | 'minimal-linen'
  // 2055
  | 'smart-fabric'
  | 'bio-textile';

/**
 * Named period hairstyles, decade-specific slugs.
 */
export type PatronHairstyle =
  // 1945
  | 'victory-rolls'
  | 'slicked-back'
  // 1965
  | 'beehive'
  | 'bouffant'
  | 'bowl-cut'
  | 'mod-bob'
  // 1985
  | 'mullet'
  | 'perms-and-teased'
  // 2005
  | 'flat-ironed'
  | 'spiky-gel'
  // 2025
  | 'natural-loose'
  | 'buzz-cut'
  // 2055
  | 'holographic-dye';

/**
 * Named handheld gadgets/accessories a patron might carry (flat-slug form).
 */
export type PatronGadget =
  // 1945
  | 'gas-mask-bag'
  | 'cigarette-case'
  // 1965
  | 'transistor-radio'
  | 'cigarette'
  | 'sunglasses'
  // 1985
  | 'walkman'
  | 'polaroid-camera'
  // 2005
  | 'flip-phone'
  | 'ipod'
  // 2025
  | 'smartphone'
  | 'wireless-earbuds'
  // 2055
  | 'ar-glasses'
  | 'neural-band';

// -----------------------------------------------------------------------
// PatronConfig — discriminated union of the two description forms
// -----------------------------------------------------------------------

/**
 * Fields shared by both patron-config forms. Every patron has a stable id and
 * an era it belongs to; the era gates roster visibility (a 1965 patron is
 * never visible in 1945, 1985, …).
 */
export interface PatronConfigBase {
  /** Stable unique identifier for this patron within its era. */
  readonly id: string;
  /** The era this patron belongs to. */
  readonly era: EraYear;
}

/**
 * Structured (1945) patron-config form. The outfit is an {@link OutfitConfig}
 * object, which discriminates this form from the flat-slug form. Drives the
 * detailed procedural seated-figure builder ({@link buildAvatar} /
 * {@link buildSeatedPatron}).
 */
export interface StructuredPatronConfig extends PatronConfigBase {
  /** Torso garment (structured form) — discriminates this config form. */
  readonly outfit: OutfitConfig;
  /** Headwear. */
  readonly hat: HatConfig;
  /** Hairstyle (structured form). */
  readonly hair: HairConfig;
  /** Held prop (structured form). */
  readonly gadget: GadgetConfig;
  /**
   * The architecture anchor (from {@link RoomAnchors}) the patron is seated
   * at.
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

/**
 * Flat-slug (1965+) patron-config form. The outfit is a {@link PatronOutfit}
 * string, which discriminates this form from the structured form. Drives the
 * era-palette-tinted capsule builder ({@link buildCharacterAvatar}).
 */
export interface FlatSlugPatronConfig extends PatronConfigBase {
  /** Period outfit slug (flat-slug form) — discriminates this config form. */
  readonly outfit: PatronOutfit;
  /** Period hairstyle slug (flat-slug form). */
  readonly hairstyle: PatronHairstyle;
  /** Handheld gadget / accessory slug, or `null` if none. */
  readonly gadget: PatronGadget | null;
  /** The layout anchor the patron is seated at. */
  readonly anchor: AnchorKey;
  /**
   * Small world-space offset from the anchor (metres). The anchor itself is a
   * table centre; the offset lets multiple patrons share a table without
   * overlapping. Applied in the XZ plane; y is typically 0 (seated on the
   * floor).
   */
  readonly offset: Readonly<{ x: number; z: number }>;
  /** Facing rotation around Y, in radians. 0 = facing −Z (toward counter). */
  readonly rotation: number;
  /** Human-readable label for diagnostics / accessibility. */
  readonly label: string;
  /** Clothing tint (hex) overriding the era-palette default, if provided. */
  readonly clothingTint?: number;
  /** Hair tint (hex) overriding the default, if provided. */
  readonly hairTint?: number;
}

/**
 * The complete, declarative description of one café patron. Pure data — no
 * geometry, no materials, no Three.js imports. Era-population tasks create
 * these and hand them to the {@link CharacterRoster}.
 *
 * The contract is a discriminated union of two complementary description forms:
 *
 *  • Structured (1945) — {@link StructuredPatronConfig}: `outfit` is an
 *    {@link OutfitConfig} object. Drives the detailed procedural seated-figure
 *    builder ({@link buildAvatar} / {@link buildSeatedPatron}).
 *  • Flat-slug (1965+) — {@link FlatSlugPatronConfig}: `outfit` is a
 *    {@link PatronOutfit} string. Drives the era-palette-tinted capsule
 *    builder ({@link buildCharacterAvatar}).
 *
 * The two forms are distinguished at build time: when `typeof config.outfit`
 * is a string the flat-slug path applies, otherwise the structured path.
 */
export type PatronConfig = StructuredPatronConfig | FlatSlugPatronConfig;

/** Type guard: is the value a valid {@link PatronConfig}? */
export function isPatronConfig(v: unknown): v is PatronConfig {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  if (typeof c.id !== 'string') return false;
  if (typeof c.outfit !== 'object' && typeof c.outfit !== 'string') return false;
  // Structured form: outfit is an object with a `type` string.
  if (typeof c.outfit === 'object') {
    const o = c.outfit as Record<string, unknown> | null;
    return (
      o !== null &&
      typeof o.type === 'string' &&
      typeof c.hat === 'object' &&
      typeof c.hair === 'object' &&
      typeof c.gadget === 'object' &&
      typeof c.seat === 'string'
    );
  }
  // Flat-slug form: outfit is a string, hairstyle is a string, anchor is a
  // string, rotation is a number.
  return (
    typeof c.hairstyle === 'string' &&
    (c.gadget === null || typeof c.gadget === 'string') &&
    typeof c.anchor === 'string' &&
    typeof c.rotation === 'number'
  );
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
