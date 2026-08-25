/**
 * Shared placement constants for the brewing-equipment prop group.
 *
 * Room shell reference (see `src/cafe/CafeScene.ts`): 12 m wide (x −6…6),
 * 10 m deep (z −5…5), 3.6 m tall. South wall (z = −5) carries the street
 * windows, the west wall carries the entrance doorway.
 *
 * The customer counter itself is owned by the furniture task; the machines
 * stand on their own back-bar worktop line NORTH of the expected counter run
 * (~z −0.6), leaving a believable staff aisle between them. Consequence for
 * orientation: machine fronts (spouts, gauges, taps, screens) face −z, the
 * way the barista faces while working, and the backsplash sits at +z.
 */
export const BACK_BAR = {
  /** Centre of the back-bar run on the shop floor. */
  centerX: 0,
  centerZ: 1.05,
  /** Worktop length used by most eras (2025 shortens it for the milk fridge). */
  defaultLength: 5.9,
  depth: 0.62,
  /** World-space height of the worktop surface — standard 900 mm bench. */
  topY: 0.92,
  /** Height of the splashback rising from the rear edge of the worktop. */
  backsplashHeight: 0.46,
} as const;

/**
 * Micro-offset applied per era variant (variant index × this value) so the
 * five coincident back-bar builds never sit on exactly coplanar surfaces.
 * Without it the crossfade would z-fight between outgoing and incoming
 * benches; the offset is far below visual perception.
 */
export const ERA_LAYER_EPSILON = 0.0007;
