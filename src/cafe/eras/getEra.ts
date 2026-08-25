import type { EraConfig, EraSection, EraYear, PropGroupKey } from '../types';

/**
 * Neutral era lookup seam.
 *
 * `CafeScene` routes the era config produced here into every registered prop
 * group. Until the per-era content tasks land, every year resolves to the
 * same deliberately empty, era-independent configuration: the permanent room
 * shell, lighting rig and registry plumbing work unchanged, and no
 * era-specific content leaks into the shell. The era-content tasks replace
 * this file's body with the real period database (same signature).
 */
const PROP_GROUP_KEYS_EMPTY: Record<PropGroupKey, EraSection> = {
  furniture: {},
  machines: {},
  menu: {},
  posters: {},
  tableware: {},
  signage: {},
  counterTech: {},
  patrons: {},
};

export function getEra(year: EraYear): EraConfig {
  return {
    year,
    label: String(year),
    ...PROP_GROUP_KEYS_EMPTY,
    lighting: {},
  };
}
