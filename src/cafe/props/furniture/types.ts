/**
 * Typed contracts for the `furniture` prop group.
 *
 * Geometry/layout baselines are keyed by era year, but the *look* (accent
 * palette, flooring description, décor labels) is driven by the `furniture`
 * section of the shell {@link EraConfig} whenever that slice carries data.
 */

/** Years for which the furniture builder can dress the room. */
export type FurnitureEraYear = 1945 | 1965 | 1985 | 2005 | 2025;

/** Runtime list of {@link FurnitureEraYear} values. */
export const FURNITURE_ERA_YEARS: readonly FurnitureEraYear[] = [
  1945,
  1965,
  1985,
  2005,
  2025,
];

/** Table silhouette families, one per era look. */
export type TableKind =
  | 'roundWood'
  | 'clothRound'
  | 'formicaDiner'
  | 'pastelLaminate'
  | 'comboDark'
  | 'lightOak';

/** Chair silhouette families, one per era look. */
export type ChairStyle =
  | 'mismatchedWood'
  | 'chromeVinyl'
  | 'tubularPastel'
  | 'woodSteelCombo'
  | 'ergoShell';

/**
 * Décor pieces the assembler knows how to build. Each id maps to exactly one
 * builder in `decor.ts` / `assemble.ts`.
 */
export type DecorPieceId =
  | 'doilies'
  | 'blackoutCurtains'
  | 'ragRug'
  | 'doorMat'
  | 'jukeboxCorner'
  | 'recordCrates'
  | 'checkerLino'
  | 'ferns'
  | 'neonAccents'
  | 'pastelRug'
  | 'ceramicVases'
  | 'loungeSofa'
  | 'wallFrames'
  | 'graphiteRug'
  | 'hangingPlants'
  | 'chargingSpots'
  | 'weaveRug'
  | 'succulentPots';

/**
 * Per-era furniture baseline: silhouettes, layout rhythm and the default
 * accent palette used when the era config slice carries no palette.
 */
export interface FurnitureEraSpec {
  year: FurnitureEraYear;
  /** Debug/display name. */
  name: string;
  /** Accent colours cycled across upholstery, laminates, rugs and neon. */
  palette: string[];
  /** Table kind per {@link TABLE_ANCHORS} index (see `specs.ts`). */
  tables: TableKind[];
  /** Chair family plus per-table seat angles in degrees (0° = +z side). */
  chairs: { style: ChairStyle; anglesByTable: number[][] };
  /** Décor pieces spawned for this era. */
  decor: DecorPieceId[];
  /** Default flooring description (overridable via the era slice). */
  flooring: string;
}
