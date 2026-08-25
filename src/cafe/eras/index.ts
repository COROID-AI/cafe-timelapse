/**
 * Era registry for the Café Time Period Timelapse.
 *
 * Each year's configuration lives in its own stub module (`era-<year>.ts`) so
 * the parallel era-content tasks fill in disjoint files and never collide on
 * this index — they only need to edit the module for their own year.
 */

import type { EraConfig, EraYear } from './types';
import { era1945 } from './era-1945';
import { era1965 } from './era-1965';
import { era1985 } from './era-1985';
import { era2005 } from './era-2005';
import { era2025 } from './era-2025';

export * from './types';

/** Timeline stops in chronological order — safe to iterate for the slider UI. */
export const ERA_YEARS = [1945, 1965, 1985, 2005, 2025] as const;

/**
 * Placeholder registry: every selectable year resolves to a typed stub config
 * that the era-content tasks replace with real period data, one file at a time.
 */
export const ERAS: Record<EraYear, EraConfig> = {
  1945: era1945,
  1965: era1965,
  1985: era1985,
  2005: era2005,
  2025: era2025,
};

/**
 * Type-safe era lookup: passing any year outside {@link EraYear} is a compile
 * error, and an out-of-range runtime value (e.g. untyped caller input) throws.
 */
export function getEra<T extends EraYear>(year: T): EraConfig {
  const config: EraConfig | undefined = ERAS[year];
  if (!config) {
    throw new Error(
      `No café era configured for ${String(year)}. Expected one of ${ERA_YEARS.join(', ')}.`,
    );
  }
  return config;
}

/** Runtime guard for untyped inputs (URL params, storage, remote data). */
export function isEraYear(value: unknown): value is EraYear {
  return typeof value === 'number' && ERA_YEARS.some((era) => era === value);
}
