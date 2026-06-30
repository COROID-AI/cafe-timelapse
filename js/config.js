/**
 * Global configuration constants shared across the café application.
 */

/** The five selectable years on the timeline, in chronological order. */
export const YEARS = [1945, 1965, 1985, 2005, 2025];

/** Default year index (0 = 1945). */
export const DEFAULT_YEAR_INDEX = 0;

/** Café interior dimensions in Three.js world units (meters). */
export const CAFE_DIMENSIONS = {
  width: 12, // X axis — left/right
  depth: 16, // Z axis — front/back
  height: 4, // Y axis — floor to ceiling
};

/** OrbitControls constraints for indoor navigation. */
export const CAMERA_CONFIG = {
  fieldOfView: 55,
  nearPlane: 0.1,
  farPlane: 100,
  initialPosition: { x: 0, y: 2.4, z: 8 },
  initialTarget: { x: 0, y: 1.6, z: 0 },
  // Zoom limits (distance from target) in meters.
  minDistance: 1,
  maxDistance: 15,
  // Polar angle constraints — keep camera above the floor.
  minPolarAngle: 0.1, // just below straight overhead
  maxPolarAngle: Math.PI / 2 - 0.05, // just above horizontal (never below floor)
  enableDamping: true,
  dampingFactor: 0.08,
  enablePan: true,
};

/**
 * Transition timing for period fade/swap (milliseconds).
 * Total crossfade = fadeOut + fadeIn ≈ 1.5s per the acceptance criteria.
 */
export const TRANSITION_CONFIG = {
  fadeOutDuration: 750,
  fadeInDuration: 750,
};

/**
 * Audio crossfade timing (milliseconds). Kept in sync with the visual
 * transition so the audio and opacity fades resolve together.
 */
export const AUDIO_CONFIG = {
  crossfadeDuration: 1500,
  defaultVolume: 0.5,
};
