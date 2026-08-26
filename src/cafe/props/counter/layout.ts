/**
 * Shared placement constants for the counter technology prop group.
 *
 * Room shell reference (see `src/cafe/CafeScene.ts`): 12 m wide (x −6…6),
 * 10 m deep (z −5…5), 3.6 m tall. South wall (z = −5) carries the street
 * windows; the west wall carries the entrance doorway.
 *
 * The service counter run itself is owned by the furniture task. The
 * brewing-equipment group documents the expected customer counter line at
 * ~z −0.6 (see `src/cafe/props/machines/layout.ts`: the back bar at z 1.05
 * stands "NORTH of the expected counter run (~z −0.6)"). The checkout tech
 * mounts to that same documented line so the till faces the customer queue
 * and leaves a believable staff aisle towards the back bar.
 *
 * Orientation: customer-facing surfaces (screens, PIN pads, contactless
 * targets, QR codes) face −z; operator decks and keyboards face +z, the way
 * the barista faces while working.
 */
export const SERVICE_COUNTER = {
  /** Centre of the counter run on the shop floor. */
  centerX: 0,
  centerZ: -0.6,
  /** Usable device run along the counter top (metres). */
  length: 2.4,
  depth: 0.62,
  /**
   * World-space height of the customer-facing counter top. Standard café
   * service counters sit ~50 mm above a 900 mm workbench (the back bar tops
   * out at 0.92 m); no furniture geometry contradicts this yet.
   */
  topY: 1.0,
} as const;

/**
 * Sanity ceiling for device height above the counter top. Nothing in any era
 * line-up should come near this; the unit tests assert every variant stays
 * below it so a runaway primitive cannot poke into the wall shelving.
 */
export const MAX_DEVICE_HEIGHT_ABOVE_TOP = 0.72;

/**
 * Micro-offset applied per era variant (variant index × this value) so the
 * five coincident counter builds never sit on exactly coplanar surfaces.
 * Without it the crossfade would z-fight between outgoing and incoming
 * devices; the offset is far below visual perception. Same trick as the
 * brewing-equipment group's `ERA_LAYER_EPSILON`.
 */
export const ERA_LAYER_EPSILON = 0.0007;
