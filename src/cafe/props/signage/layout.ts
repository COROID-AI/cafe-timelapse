/**
 * Shared placement constants for the signage & lighting prop group.
 *
 * Room shell reference (see `src/cafe/CafeScene.ts`): 12 m wide (x −6…6),
 * 10 m deep (z −5…5), 3.6 m tall. South wall (z = −5) carries the street
 * windows, the west wall carries the entrance doorway (centre z = 3.2) and
 * the north wall (z = +5) sits behind the back-bar counter run.
 */

/**
 * Micro-offset applied per era variant (variant index × value) so coincident
 * sign surfaces never sit exactly coplanar while two eras blend. Same trick
 * as the machines group — far below visual perception.
 */
export const ERA_LAYER_EPSILON = 0.0007;

/**
 * Interior wall faces (metres). Walls are 0.18 thick centred just outside
 * the interior volume, so the usable faces sit at ±5.0 / ±6.0.
 */
export const WALL = {
  southZ: -5.0,
  northZ: 5.0,
  westX: -6.0,
  eastX: 6.0,
} as const;

/** Street-window openings on the south wall (interior face z = −5). */
export const SOUTH_WINDOWS = {
  /** Opening centres along x. */
  centerX: [-4, 0, 4] as const,
  sillY: 0.85,
  topY: 2.6,
  halfWidth: 0.95,
} as const;

/** Window openings on the east wall (interior face x = +6). */
export const EAST_WINDOWS = {
  centerZ: [-2.25, 2.25] as const,
  sillY: 0.85,
  topY: 2.6,
  halfWidth: 0.8,
} as const;

/** Entrance doorway on the west wall (interior face x = −6). */
export const DOORWAY = {
  centerZ: 3.2,
  halfWidth: 0.525,
  topY: 2.15,
} as const;

/** Ceiling height of the permanent shell. */
export const CEILING_Y = 3.6;

/**
 * Anchor slot used by window-hung signage (neon CAFÉ, painted boards).
 * Centred on the middle street window, slightly inside the glass.
 */
export const WINDOW_SIGN = {
  x: 0,
  y: 1.95,
  z: -4.9,
} as const;

/**
 * Fascia slot on the north wall above the back-bar splashback, used by
 * lightbox signs and dimensional letter runs.
 */
export const FASCIA_SIGN = {
  x: 0,
  y: 2.45,
  z: 4.92,
} as const;

/**
 * Customer-side counter lip (front edge of the expected counter run between
 * the seating area and the staff aisle). Used by under-counter LED strips.
 */
export const COUNTER_LIP = {
  y: 0.87,
  z: 0.72,
} as const;
