/**
 * Per-era patron casts, 1945 → 2025.
 *
 * Each variant file is pure data; `cast.ts` turns a spec into geometry. Seat
 * references index into the furniture task's shared layout
 * (`TABLE_ANCHORS` + per-era `chairs.anglesByTable`), so patrons always sit
 * exactly where their era's chairs stand.
 */

import type { PatronCastSpec, PatronEraYear } from '../types';
import { PATRON_CAST_1945 } from './era1945';
import { PATRON_CAST_1965 } from './era1965';
import { PATRON_CAST_1985 } from './era1985';
import { PATRON_CAST_2005 } from './era2005';
import { PATRON_CAST_2025 } from './era2025';

export { PATRON_CAST_1945 } from './era1945';
export { PATRON_CAST_1965 } from './era1965';
export { PATRON_CAST_1985 } from './era1985';
export { PATRON_CAST_2005 } from './era2005';
export { PATRON_CAST_2025 } from './era2025';

/** Full cast per era — 4–6 figures each per the task brief. */
export const PATRON_CASTS: Record<PatronEraYear, PatronCastSpec> = {
  1945: PATRON_CAST_1945,
  1965: PATRON_CAST_1965,
  1985: PATRON_CAST_1985,
  2005: PATRON_CAST_2005,
  2025: PATRON_CAST_2025,
};
