/**
 * PatronConfig.ts — declarative configuration for a single café patron.
 *
 * A {@link PatronConfig} is a pure-data description of a patron's period
 * appearance: their outfit, hairstyle, gadgets, and the layout anchor where
 * they are seated. It contains NO Three.js geometry — that is the job of
 * {@link CharacterAvatar}, which turns a config into an `Object3D`. This
 * separation lets era-population tasks (e.g. {@link patrons1985}) describe
 * patrons declaratively while the avatar builder owns the procedural mesh.
 *
 * Era scoping: every config carries the {@link EraYear} it belongs to. The
 * {@link CharacterRoster} keys patrons by era, so a 1985 patron is returned
 * ONLY for era 1985 and is invisible (absent) in every other era. This is the
 * mechanism that satisfies the "not visible in other eras" acceptance
 * criterion.
 *
 * Anchor seating: patrons reference a stable {@link AnchorKey} from
 * {@link src/world/layout.ts} (e.g. `seatingTableA`). The avatar builder
 * resolves the anchor to a world position and seats the figure there, so
 * patrons are placed against the canonical café geometry rather than ad-hoc
 * coordinates.
 */
import type { EraYear } from '../data/EraData.js';
import type { AnchorKey } from '../world/layout.js';

// ---------------------------------------------------------------------------
// Outfit catalog
// ---------------------------------------------------------------------------

/**
 * Upper-body garment types the avatar builder can render. Each maps to a
 * distinct procedural mesh silhouette + material role. Era-population tasks
 * pick from this union so the builder stays the single owner of geometry.
 */
export type OutfitType =
  | 'shoulder-pad-blazer' // 1985 — padded-shoulder power-suit jacket
  | 'members-only-jacket' // 1985 — quilted satin collarless jacket
  | 'denim-jacket' // utility denim jacket
  | 'sweater' // plain knit sweater
  | 'dress' // one-piece dress
  | 'shirt'; // collared shirt

/**
 * Hairstyle types the avatar builder can render. Each maps to a distinct
 * procedural head/hair mesh. `big-hair` inflates the hair volume; `mullet`
 * extends hair down the back of the neck.
 */
export type Hairstyle =
  | 'big-hair' // 1985 — voluminous teased hair
  | 'mullet' // 1985 — short top, long back
  | 'perm' // curly perm
  | 'buzz' // short crop
  | 'bob' // chin-length bob
  | 'ponytail'
  | 'slicked'
  | 'bald';

/**
 * Gadgets the avatar builder can attach to a patron. Each maps to a small
 * procedural mesh clipped onto the body (e.g. Walkman headphones arc over the
 * head with earcups at the temples).
 */
export type Gadget =
  | 'walkman-headphones' // 1985 — over-head band with two earcups
  | 'walkman-clip' // 1985 — cassette player clipped to belt
  | 'pager'
  | 'pocket-watch'
  | 'transistor-radio'
  | 'none';

/** A period outfit: garment type + colour override (hex). */
export interface Outfit {
  readonly type: OutfitType;
  /** Garment colour as a hex number (e.g. 0x2a3a5a). */
  readonly color: number;
}

/** A period hairstyle: style + colour override (hex). */
export interface Hair {
  readonly style: Hairstyle;
  /** Hair colour as a hex number. */
  readonly color: number;
}

/**
 * A complete, declarative patron configuration.
 *
 * All fields are readonly so configs are immutable once authored. The
 * {@link CharacterRoster} stores these by reference; avatar builders read them
 * without mutation.
 */
export interface PatronConfig {
  /** Stable, unique patron identifier (e.g. "1985-margaret"). */
  readonly id: string;
  /** The era this patron belongs to — gates era-scoped visibility. */
  readonly era: EraYear;
  /** The patron's upper-body outfit. */
  readonly outfit: Outfit;
  /** The patron's hairstyle. */
  readonly hair: Hair;
  /** Gadgets worn by the patron (may be empty). */
  readonly gadgets: readonly Gadget[];
  /** The stable layout anchor where this patron is seated. */
  readonly anchor: AnchorKey;
  /**
   * Yaw rotation in degrees (0 = facing −Z / back wall, 90 = facing +X).
   * Defaults to 0. Used to seat patrons facing the table or counter.
   */
  readonly facing?: number;
  /** Optional skin-tone colour override (hex). */
  readonly skinColor?: number;
}
