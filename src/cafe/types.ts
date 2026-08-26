import type { CafeScene } from './CafeScene';
import type { ColorRepresentation, Group } from 'three';

/**
 * Years offered by the timeline slider.
 */
export type EraYear = 1945 | 1965 | 1985 | 2005 | 2025 | 2055;

/** Runtime list of {@link EraYear} values (used by the timeline UI task). */
export const ERA_YEARS: readonly EraYear[] = [1945, 1965, 1985, 2005, 2025, 2055];

/**
 * Keys of the swappable detail categories of the café.
 *
 * These keys are 1:1 with the section names of {@link EraConfig}, so a prop
 * group registered under a given key reads its payload from the matching
 * section of the era config.
 */
export type PropGroupKey =
  | 'furniture'
  | 'machines'
  | 'menu'
  | 'posters'
  | 'tableware'
  | 'signage'
  | 'counterTech'
  | 'patrons';

/** Runtime list of {@link PropGroupKey} values. */
export const PROP_GROUP_KEYS: readonly PropGroupKey[] = [
  'furniture',
  'machines',
  'menu',
  'posters',
  'tableware',
  'signage',
  'counterTech',
  'patrons',
];

/**
 * Free-form per-era payload handed to one detail category.
 *
 * The shell task only defines the transport shape; each era-content task
 * narrows the section it owns into its concrete payload type.
 */
export type EraSection = Record<string, unknown>;

/**
 * Optional per-era overrides for the scene-wide mood rig (ambient fill,
 * sun through the windows, tintable accent points, fog and exposure).
 * Every field is optional: absent fields simply leave the current state.
 */
export interface EraLightingMood {
  ambientColor?: ColorRepresentation;
  ambientIntensity?: number;
  hemisphereSkyColor?: ColorRepresentation;
  hemisphereGroundColor?: ColorRepresentation;
  hemisphereIntensity?: number;
  sunColor?: ColorRepresentation;
  sunIntensity?: number;
  accentColor?: ColorRepresentation;
  accentIntensity?: number;
  fogColor?: ColorRepresentation;
  fogDensity?: number;
  exposure?: number;
}

/**
 * Full configuration routed into every registered prop group by
 * `CafeScene.applyEra`. Section names mirror {@link PropGroupKey} 1:1.
 */
export interface EraConfig {
  year: EraYear;
  label: string;
  furniture: EraSection;
  machines: EraSection;
  menu: EraSection;
  posters: EraSection;
  tableware: EraSection;
  signage: EraSection;
  counterTech: EraSection;
  patrons: EraSection;
  lighting?: EraLightingMood;
}

/** Context given to a prop-group builder when its group is constructed. */
export interface PropBuildContext {
  /** The orchestrator that owns the group being built. */
  host: CafeScene;
}

/** Builds the persistent object graph of one detail category. */
export type PropGroupBuilder = (context: PropBuildContext) => Group;

/** Context given to a prop-group updater on every era change. */
export interface PropUpdateContext {
  /** The orchestrator requesting the update. */
  host: CafeScene;
  /** Previously applied year, or `null` before the first application. */
  previousYear: EraYear | null;
}

/** Applies one {@link EraConfig} to a previously built prop group. */
export type PropGroupUpdater = (config: EraConfig, context: PropUpdateContext) => void;
