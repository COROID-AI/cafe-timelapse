import type { EraConfig, EraLightingMood } from '../../types';
import type { SignageEraYear } from './types';

/**
 * Per-era scene-wide ambient mood values for the signage & lighting group.
 *
 * These are THE canonical lighting moods for the five eras — dim wartime
 * gloom through bright modern LED scenes — expressed in exactly the schema
 * `EraTransitionController` lerps (`EraLightingMood`: ambient/hemisphere/
 * directional-sun/accent colours + intensities, fog colour + density, and
 * tone-mapping exposure). Nothing outside this module hard-codes era
 * lighting: era-content tasks copy these values into `EraConfig.lighting`
 * (or route configs through {@link resolveSignageMood}), which makes them
 * the controller's lerp targets during crossfades.
 */
export const SIGNAGE_ERA_MOODS: Record<SignageEraYear, EraLightingMood> = {
  /** 1945 — blackout gloom; cold daylight, warm gas/filament pockets. */
  1945: {
    ambientColor: '#241b12',
    ambientIntensity: 0.16,
    hemisphereSkyColor: '#16202e',
    hemisphereGroundColor: '#120d08',
    hemisphereIntensity: 0.1,
    sunColor: '#aebfd8',
    sunIntensity: 0.3,
    accentColor: '#ff9c52',
    accentIntensity: 2.2,
    fogColor: '#0b0806',
    fogDensity: 0.032,
    exposure: 0.72,
  },
  /** 1965 — diner brightness: fluorescent fill, cherry-red neon accents. */
  1965: {
    ambientColor: '#fff1d8',
    ambientIntensity: 0.46,
    hemisphereSkyColor: '#dfeaf8',
    hemisphereGroundColor: '#6a583f',
    hemisphereIntensity: 0.3,
    sunColor: '#fff2cf',
    sunIntensity: 2.1,
    accentColor: '#ff6a48',
    accentIntensity: 9,
    fogColor: '#191310',
    fogDensity: 0.017,
    exposure: 1.0,
  },
  /** 1985 — vivid mall-era pop: magenta/cyan gels under halogen punch. */
  1985: {
    ambientColor: '#ffe9f4',
    ambientIntensity: 0.54,
    hemisphereSkyColor: '#efe6ff',
    hemisphereGroundColor: '#55414d',
    hemisphereIntensity: 0.34,
    sunColor: '#ffd7ec',
    sunIntensity: 2.3,
    accentColor: '#ff45c8',
    accentIntensity: 13,
    fogColor: '#140d1a',
    fogDensity: 0.02,
    exposure: 1.05,
  },
  /** 2005 — cool clean café-retail white, blue-white LED washes. */
  2005: {
    ambientColor: '#edf3fa',
    ambientIntensity: 0.56,
    hemisphereSkyColor: '#eef4ff',
    hemisphereGroundColor: '#4d5560',
    hemisphereIntensity: 0.36,
    sunColor: '#f0f5ff',
    sunIntensity: 2.5,
    accentColor: '#bcd8ff',
    accentIntensity: 11,
    fogColor: '#0f141b',
    fogDensity: 0.015,
    exposure: 1.08,
  },
  /** 2025 — layered warm/cool smart scenes, softest fog, brightest sensor. */
  2025: {
    ambientColor: '#f7efe6',
    ambientIntensity: 0.5,
    hemisphereSkyColor: '#e8f0f4',
    hemisphereGroundColor: '#57493c',
    hemisphereIntensity: 0.33,
    sunColor: '#fff0da',
    sunIntensity: 2.1,
    accentColor: '#ffc79e',
    accentIntensity: 10,
    fogColor: '#121011',
    fogDensity: 0.012,
    exposure: 1.12,
  },
};

/** Returns the canonical scene-wide mood for one era year. */
export function signageEraMood(year: SignageEraYear): EraLightingMood {
  return SIGNAGE_ERA_MOODS[year];
}

const MOOD_FIELDS = [
  'ambientColor',
  'ambientIntensity',
  'hemisphereSkyColor',
  'hemisphereGroundColor',
  'hemisphereIntensity',
  'sunColor',
  'sunIntensity',
  'accentColor',
  'accentIntensity',
  'fogColor',
  'fogDensity',
  'exposure',
] as const;

/** True when at least one mood field carries a value. */
export function hasDefinedMoodFields(mood: EraLightingMood | undefined): boolean {
  if (!mood) return false;
  return MOOD_FIELDS.some((key) => mood[key] !== undefined);
}

/**
 * Resolves the effective scene-wide mood for a routed era config.
 *
 * Shell-provided `config.lighting` fields always win field-by-field so a
 * future shell can override individual channels without editing this module;
 * everything left unset falls back to this group's period preset for the
 * given year. The result is directly consumable by `CafeScene.applyLightingMood`
 * and used by `EraTransitionController` as its lerp target.
 */
export function resolveSignageMood(config: EraConfig, fallbackYear: SignageEraYear): EraLightingMood {
  const preset = SIGNAGE_ERA_MOODS[fallbackYear];
  const override = config.lighting;
  if (!hasDefinedMoodFields(override)) return preset;
  const merged: EraLightingMood = { ...preset };
  for (const key of MOOD_FIELDS) {
    const value = override?.[key];
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}
