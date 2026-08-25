/** Era years the tableware group renders procedural tabletops for. */
export const SUPPORTED_ERA_YEARS = [1945, 1965, 1985, 2005, 2025] as const;

export type SupportedTablewareYear = (typeof SUPPORTED_ERA_YEARS)[number];
