/**
 * Shared placement constants for the menu-board prop group.
 *
 * Room shell reference (see `src/cafe/CafeScene.ts`): 12 m wide (x −6…6),
 * 10 m deep (z −5…5), 3.6 m tall. South wall (z = −5) carries the street
 * windows; the brewing-equipment group owns the back-bar worktop line at
 * z = +1.05 and expects the customer counter around z ≈ −0.6.
 *
 * The menu hangs ABOVE / just BEHIND the counter run, suspended from the
 * ceiling so it reads clearly from the customer side (−z) without colliding
 * with the back-bar splashback (~y 1.38) or tall machine tops (~y 1.7).
 */

export const MENU_MOUNT = {
  /** Centre of the board run (slightly west of the bar centre-line). */
  centerX: -0.35,
  /** Bottom edge of every hanging board — clears heads and machine tops. */
  bottomY: 2.02,
  /** Depth position: above the staff aisle, behind the counter lip. */
  centerZ: 0.72,
  /** Ceiling anchor for chains / rods / poles. */
  ceilingY: 3.56,
  /** Boards face the customers (south, −z). */
  yaw: Math.PI,
} as const;

/**
 * Micro-offset applied per era variant (variant index × this value) so the
 * five coincident hanging boards never sit exactly coplanar while two of
 * them blend during a crossfade. Far below visual perception.
 */
export const ERA_LAYER_EPSILON = 0.0007;

/** Where the 2005 A-frame sandwich board stands on the shop floor. */
export const AFRAME_PLACEMENT = {
  x: 2.45,
  z: -0.35,
  /** Angled a touch off-axis so it reads naturally from the door. */
  yaw: Math.PI + 0.22,
} as const;

/** Table-top surface height used by the furniture pieces (~0.74 m tops). */
export const TABLE_TOP_Y = 0.755;

/** Which shared dining-table anchors receive 2025 QR ordering cards. */
export const QR_TABLE_INDICES = [0, 2, 3, 4] as const;
