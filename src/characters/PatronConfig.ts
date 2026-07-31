/**
 * PatronConfig.ts — data contract for a single era-scoped café patron.
 *
 * A {@link PatronConfig} is a plain, serialisable description of one patron:
 * the era they belong to, their period outfit, hairstyle, handheld gadget,
 * the layout anchor they are seated at, and a small set of visual tuning
 * scalars (position offset, facing rotation, clothing/hair tint). It carries
 * NO Three.js objects — those are built on demand by {@link CharacterAvatar}.
 *
 * This split keeps the data (what a patron *is*) separate from the render
 * (how a patron *looks*), so the {@link CharacterRoster} can reason about
 * era-scoped visibility purely in data terms and the avatar builder can be
 * swapped or refined without touching patron definitions.
 *
 * Patron definitions live in per-era modules (e.g.
 * {@link src/characters/patrons1965.js patrons1965}) which construct
 * PatronConfig objects and register them with the roster.
 */
import type { EraYear } from '../data/EraData.js';
import type { AnchorKey } from '../world/layout.js';

// ---------------------------------------------------------------------------
// Period outfit / hairstyle / gadget vocabulary
// ---------------------------------------------------------------------------

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
 * Named handheld gadgets/accessories a patron might carry.
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

// ---------------------------------------------------------------------------
// PatronConfig
// ---------------------------------------------------------------------------

/**
 * A complete, plain-data description of one seated café patron.
 *
 * Fields are intentionally all `readonly` + primitive/enum so a config is
 * cheap to share, compare, and snapshot in tests.
 */
export interface PatronConfig {
  /** Stable unique id (era-prefixed, e.g. `"1965-mod-1"`). */
  readonly id: string;
  /** The era this patron belongs to — gates roster visibility. */
  readonly era: EraYear;
  /** Human-readable label for diagnostics / accessibility. */
  readonly label: string;
  /** Period outfit slug. */
  readonly outfit: PatronOutfit;
  /** Period hairstyle slug. */
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
  /** Clothing tint (hex) overriding the era-palette default, if provided. */
  readonly clothingTint?: number;
  /** Hair tint (hex) overriding the default, if provided. */
  readonly hairTint?: number;
}

/** Type guard: is the value a valid {@link PatronConfig}? */
export function isPatronConfig(v: unknown): v is PatronConfig {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.label === 'string' &&
    typeof c.outfit === 'string' &&
    typeof c.hairstyle === 'string' &&
    (c.gadget === null || typeof c.gadget === 'string') &&
    typeof c.anchor === 'string' &&
    typeof c.rotation === 'number'
  );
}
