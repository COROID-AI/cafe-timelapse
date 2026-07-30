/**
 * layout.ts — canonical spatial contract for the Café Time Period Timelapse.
 *
 * This is the SINGLE source of truth for the café's unchanging room geometry.
 * Every era task (props, signage, coffee machine, menu board, audio
 * spatialization, navigation clamping) MUST consume these dimensions and named
 * anchors rather than redefining its own coordinates. Anchor names are stable
 * for the lifetime of the project so downstream era tasks can hard-reference
 * them without fear of drift.
 *
 * Coordinate system (Three.js metres):
 *   • +X  → east   (room width,  spans −6…+6)
 *   • +Z  → south  (room depth,  spans −5…+5; storefront/entrance on +Z)
 *   • +Y  → up     (room height, floor at 0, ceiling at 4)
 *
 * Orientation map:
 *
 *        back wall (z = −5)  ← counter + menu board live here
 *        ┌─────────────────────────────┐
 *   left │                             │ right
 *   wall │      seating zone           │ wall   ← posters on side walls
 *  x=−6  │                             │ x=+6
 *        └───── door + window ─────────┘
 *        storefront wall (z = +5)  ← entrance here
 *
 * The camera default (SceneManager) sits on +Z looking toward −Z, i.e. facing
 * the storefront, so visitors look "through" the entrance window into the room.
 */
import { Box3, Vector3 } from 'three';

// ---------------------------------------------------------------------------
// Room dimensions
// ---------------------------------------------------------------------------

/** The room's exterior-spanning dimensions in metres (X width, Y height, Z depth). */
export interface RoomDimensions {
  /** Interior width along X (east–west). */
  readonly width: number;
  /** Interior height along Y (floor to ceiling). */
  readonly height: number;
  /** Interior depth along Z (north–south, back wall to storefront). */
  readonly depth: number;
}

/**
 * Canonical café room dimensions. Era-neutral and immutable: the shell
 * (ArchitectureShell) and the interior bounds (INTERIOR_BOUNDS) are derived
 * from these, and all era props are placed relative to them.
 */
export const ROOM_DIMENSIONS: RoomDimensions = {
  width: 12,
  height: 4,
  depth: 10,
};

// ---------------------------------------------------------------------------
// Interior bounding box (consumed by Navigation for camera clamping)
// ---------------------------------------------------------------------------

/**
 * The walkable interior volume as a Three.js {@link Box3}. This is the exact
 * box the camera eye is clamped inside by Navigation so it can never clip
 * through the floor, ceiling, or walls. Floor at y = 0, ceiling at y = 4.
 *
 * Derived directly from {@link ROOM_DIMENSIONS} so the two can never drift.
 */
export const INTERIOR_BOUNDS: Box3 = new Box3(
  new Vector3(-ROOM_DIMENSIONS.width / 2, 0, -ROOM_DIMENSIONS.depth / 2),
  new Vector3(ROOM_DIMENSIONS.width / 2, ROOM_DIMENSIONS.height, ROOM_DIMENSIONS.depth / 2),
);

// ---------------------------------------------------------------------------
// Named anchor points (the stable spatial contract for era tasks)
// ---------------------------------------------------------------------------

/**
 * Stable, named anchor points that era tasks place props against. Every key
 * here is part of the public contract — do NOT rename a key (add a new one
 * instead) because downstream era tasks hard-reference these names.
 *
 * Coordinates are in scene metres (see file header for the axis map).
 */
export interface RoomAnchors {
  // --- Counter zone (service bar along the back / −Z wall) -----------------
  /** Centre of the service counter, at counter-top height. */
  readonly counterCenter: Vector3;
  /** Slot where the espresso machine sits on the counter. */
  readonly machineSlot: Vector3;
  /** Slot where the counter technology (till / POS) sits on the counter. */
  readonly counterTechSlot: Vector3;
  /** Anchor on the back wall where the menu board mounts (above counter). */
  readonly menuBoardWall: Vector3;

  // --- Poster walls (side walls) ------------------------------------------
  /** Anchor on the left (−X) wall for posters / advertisements. */
  readonly leftPosterWall: Vector3;
  /** Anchor on the right (+X) wall for posters / advertisements. */
  readonly rightPosterWall: Vector3;

  // --- Seating zone (customer tables in the front / +Z half) --------------
  /** Customer table A (front-left). */
  readonly seatingTableA: Vector3;
  /** Customer table B (front-right). */
  readonly seatingTableB: Vector3;
  /** Customer table C (centred, near the storefront window). */
  readonly seatingTableC: Vector3;

  // --- Entrance (storefront / +Z wall) ------------------------------------
  /** Door threshold at the storefront wall. */
  readonly entrance: Vector3;
}

/**
 * Union of every anchor key. Exported so downstream code can type-check anchor
 * lookups and tooling can assert the contract stays complete.
 */
export type AnchorKey = keyof RoomAnchors;

/**
 * The canonical named anchors. The machine slot deliberately matches the
 * EraData audio spatialization `coffeeMachine` position `(-3, 1.3, -4)` so the
 * panned audio source lines up with the visible espresso machine, and the
 * menu-board anchor sits on the back wall directly above the counter centre.
 *
 * NOTE: these are mutable Three.js Vector3 instances for direct scene use.
 * Consumers that need to mutate should `.clone()` first.
 */
export const ANCHORS: RoomAnchors = {
  // Counter bar runs along the back wall (z = −5); counter top ≈ 1.1 m.
  counterCenter: new Vector3(0, 1.1, -4.4),
  machineSlot: new Vector3(-3, 1.3, -4),
  counterTechSlot: new Vector3(3, 1.2, -4.4),
  menuBoardWall: new Vector3(0, 2.6, -5),

  // Posters centred on the side walls at standing eye level.
  leftPosterWall: new Vector3(-6, 2, 0),
  rightPosterWall: new Vector3(6, 2, 0),

  // Three customer tables across the seating (front) half of the room.
  seatingTableA: new Vector3(-3, 0, 1.5),
  seatingTableB: new Vector3(3, 0, 1.5),
  seatingTableC: new Vector3(0, 0, 3),

  // Door threshold, centred on the storefront wall.
  entrance: new Vector3(0, 0, 5),
};

/**
 * Ordered list of every anchor key. Era/tooling tests iterate this to assert
 * the contract is complete and stable.
 */
export const ANCHOR_KEYS = [
  'counterCenter',
  'machineSlot',
  'counterTechSlot',
  'menuBoardWall',
  'leftPosterWall',
  'rightPosterWall',
  'seatingTableA',
  'seatingTableB',
  'seatingTableC',
  'entrance',
] as const satisfies readonly AnchorKey[];

/** Look up an anchor by stable key (returns the live Vector3). */
export function getAnchor(key: AnchorKey): Vector3 {
  return ANCHORS[key];
}

// ---------------------------------------------------------------------------
// Functional zones (geometrically defined regions, not single points)
// ---------------------------------------------------------------------------

/**
 * The counter zone: the service-bar footprint along the back wall. Spans the
 * central width of the room, ~1.2 m deep, up to counter-top height. Era tasks
 * place the counter body, machine, and till inside this box.
 */
export const COUNTER_ZONE: Box3 = new Box3(
  new Vector3(-4.5, 0, -5),
  new Vector3(4.5, 1.2, -3.8),
);

/**
 * The seating zone: the customer-occupied front half of the room. Spans nearly
 * the full width from just in front of the counter to just inside the
 * storefront, up to standing head height. Era tasks place tables, chairs, and
 * patrons inside this box.
 */
export const SEATING_ZONE: Box3 = new Box3(
  new Vector3(-5, 0, -1),
  new Vector3(5, 2.5, 4.5),
);
