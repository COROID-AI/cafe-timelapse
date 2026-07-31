/**
 * The canonical timeline of eras for the Café Time Period Timelapse.
 * The scene transforms between these years as the user drags the timeline.
 */
export const ERAS = [1945, 1965, 1985, 2005, 2025, 2055] as const;

export type EraYear = (typeof ERAS)[number];

/** True when the given year is one of the timeline eras. */
export function isEraYear(year: number): year is EraYear {
  return (ERAS as readonly number[]).includes(year);
}
