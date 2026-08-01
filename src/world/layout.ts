/**
 * src/world/layout.ts — canonical spatial contract for the café interior.
 *
 * Single source of truth for the persistent café room's dimensions, interior
 * bounding box, named anchor points and surface zones.
 *
 *  - Navigation clamps the camera to {@link ROOM_BOUNDS}.
 *  - Era tasks place every prop (counter tech, coffee machines, menu boards,
 *    posters, tables, patrons, lighting) at the {@link ANCHORS} below, and
 *    dress the room's material slots (src/world/ArchitectureShell.ts).
 *
 * Coordinates (metres):
 *   x — width,  -ROOM_WIDTH/2 (west/left wall) .. +ROOM_WIDTH/2 (east/right wall)
 *   y — height, 0 (floor) .. ROOM_HEIGHT (ceiling)
 *   z — depth,  -ROOM_DEPTH/2 (back wall) .. +ROOM_DEPTH/2 (storefront wall)
 *
 * The contract is deliberately era-neutral: no era-specific colour, material
 * or prop lives here.
 */
import * as THREE from 'three';
import type { CaféBounds } from '../systems/Navigation';

/** Interior width of the café (x extent). */
export const ROOM_WIDTH = 14;

/** Interior depth of the café (z extent). */
export const ROOM_DEPTH = 11;

/** Interior height of the café (y extent, floor → ceiling). */
export const ROOM_HEIGHT = 4;

/** Construction thickness of the shell walls (affects wall-face anchors). */
export const WALL_THICKNESS = 0.2;

/** Width of the storefront door opening. */
export const DOOR_WIDTH = 1.5;

/** Height of the storefront door opening. */
export const DOOR_HEIGHT = 2.6;

/**
 * Interior bounding box of the café, consumed by Navigation for collision
 * clamping (the camera can never leave this volume).
 */
export const ROOM_BOUNDS: CaféBounds = {
  minX: -ROOM_WIDTH / 2,
  maxX: ROOM_WIDTH / 2,
  minY: 0,
  maxY: ROOM_HEIGHT,
  minZ: -ROOM_DEPTH / 2,
  maxZ: ROOM_DEPTH / 2,
};

/** Centre of the interior volume (default orbit target). */
export const ROOM_CENTER = new THREE.Vector3(0, ROOM_HEIGHT / 2, 0);

/**
 * Wall regions of the café. The storefront wall is the window wall with the
 * door; the back wall carries the menu board; the side walls carry posters.
 */
export type WallId = 'back' | 'left' | 'right' | 'storefront';

export interface WallSurface {
  id: WallId;
  /**
   * Direction the wall's interior face points (into the room) — the direction
   * a surface mounted on this wall faces.
   */
  normal: THREE.Vector3;
  /** Centre of the wall's interior face (on the ROOM_BOUNDS plane). */
  center: THREE.Vector3;
  /** Wall span along its length. */
  width: number;
  /** Wall span vertically. */
  height: number;
}

/**
 * Interior-face geometry for each wall. `center` lies exactly on the room's
 * bounding plane (e.g. the back wall's interior face is at z = ROOM_BOUNDS.minZ);
 * mounted surfaces offset slightly into the room to avoid z-fighting.
 */
export const WALLS: Record<WallId, WallSurface> = {
  back: {
    id: 'back',
    normal: new THREE.Vector3(0, 0, 1),
    center: new THREE.Vector3(0, ROOM_HEIGHT / 2, ROOM_BOUNDS.minZ),
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
  },
  left: {
    id: 'left',
    normal: new THREE.Vector3(1, 0, 0),
    center: new THREE.Vector3(ROOM_BOUNDS.minX, ROOM_HEIGHT / 2, 0),
    width: ROOM_DEPTH,
    height: ROOM_HEIGHT,
  },
  right: {
    id: 'right',
    normal: new THREE.Vector3(-1, 0, 0),
    center: new THREE.Vector3(ROOM_BOUNDS.maxX, ROOM_HEIGHT / 2, 0),
    width: ROOM_DEPTH,
    height: ROOM_HEIGHT,
  },
  storefront: {
    id: 'storefront',
    normal: new THREE.Vector3(0, 0, -1),
    center: new THREE.Vector3(0, ROOM_HEIGHT / 2, ROOM_BOUNDS.maxZ),
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
  },
};

/** The counter bar anchor along the east (right) wall. */
export interface CounterAnchor {
  /** Centre of the counter body. */
  position: THREE.Vector3;
  /** Direction the barista faces (into the room). */
  facing: THREE.Vector3;
  /** Counter run length along the wall. */
  length: number;
  /** Counter depth (wall → room). */
  depth: number;
  /** Counter work-surface height. */
  height: number;
}

/** An anchor on a wall's interior face (menu board, posters). */
export interface WallAnchor {
  wall: WallId;
  /** Mounting point on the wall's interior face. */
  position: THREE.Vector3;
  /** Direction the mounted surface faces (into the room). */
  normal: THREE.Vector3;
}

/** The storefront doorway anchor. */
export interface EntranceAnchor {
  /** Door opening centre at floor level (on the storefront face). */
  position: THREE.Vector3;
  width: number;
  height: number;
}

/** Every named anchor point era tasks use to place props. */
export interface AnchorPoints {
  /** Counter bar along the east wall. */
  counter: CounterAnchor;
  /** Spot on the counter top where the era's espresso machine sits. */
  machineSlot: THREE.Vector3;
  /** Wall anchor for the era's menu board. */
  menuBoardWall: WallAnchor;
  /** Wall anchors where eras hang posters. */
  posterWalls: WallAnchor[];
  /** Floor positions of the seating-zone tables. */
  seatingTables: THREE.Vector3[];
  /** Storefront doorway. */
  entrance: EntranceAnchor;
  /** Ceiling points where era light fixtures mount (ceiling/light slot). */
  lighting: THREE.Vector3[];
}

/**
 * Named anchor points. Treat the shared vectors as immutable — clone before
 * mutating so the contract stays intact for every era task.
 */
export const ANCHORS: AnchorPoints = {
  counter: {
    position: new THREE.Vector3(
      ROOM_BOUNDS.maxX - WALL_THICKNESS / 2 - 0.45,
      0.5,
      -1.2,
    ),
    facing: new THREE.Vector3(-1, 0, 0),
    length: 6.0,
    depth: 0.9,
    height: 1.0,
  },
  machineSlot: new THREE.Vector3(
    ROOM_BOUNDS.maxX - WALL_THICKNESS / 2 - 0.45,
    1.08,
    0.6,
  ),
  menuBoardWall: {
    wall: 'back',
    position: new THREE.Vector3(0, 2.3, ROOM_BOUNDS.minZ),
    normal: new THREE.Vector3(0, 0, 1),
  },
  posterWalls: [
    {
      wall: 'left',
      position: new THREE.Vector3(ROOM_BOUNDS.minX, 1.9, 1.5),
      normal: new THREE.Vector3(1, 0, 0),
    },
    {
      wall: 'left',
      position: new THREE.Vector3(ROOM_BOUNDS.minX, 1.9, -1.5),
      normal: new THREE.Vector3(1, 0, 0),
    },
    {
      wall: 'right',
      position: new THREE.Vector3(ROOM_BOUNDS.maxX, 2.2, -3.2),
      normal: new THREE.Vector3(-1, 0, 0),
    },
    {
      wall: 'back',
      position: new THREE.Vector3(-2.8, 1.9, ROOM_BOUNDS.minZ),
      normal: new THREE.Vector3(0, 0, 1),
    },
    {
      wall: 'back',
      position: new THREE.Vector3(2.8, 1.9, ROOM_BOUNDS.minZ),
      normal: new THREE.Vector3(0, 0, 1),
    },
  ],
  seatingTables: [
    new THREE.Vector3(-3.5, 0, 2.2),
    new THREE.Vector3(0, 0, 2.5),
    new THREE.Vector3(3.2, 0, 1.8),
    new THREE.Vector3(-2.0, 0, -1.2),
    new THREE.Vector3(2.0, 0, -1.5),
  ],
  entrance: {
    position: new THREE.Vector3(-4.0, 0, ROOM_BOUNDS.maxZ),
    width: DOOR_WIDTH,
    height: DOOR_HEIGHT,
  },
  lighting: [
    new THREE.Vector3(-3.5, ROOM_HEIGHT, 2.2),
    new THREE.Vector3(0, ROOM_HEIGHT, 2.5),
    new THREE.Vector3(3.2, ROOM_HEIGHT, 1.8),
    new THREE.Vector3(6.0, ROOM_HEIGHT, 0.6),
  ],
};

/** One named interior zone of the café. */
export interface RoomZone {
  id: 'counter' | 'seating' | 'entrance';
  /** Axis-aligned interior volume the zone occupies. */
  bounds: CaféBounds;
}

/**
 * Named interior zones. The counter zone is the bar strip along the east
 * wall; the seating zone is the open floor for tables and patrons; the
 * entrance zone is the doorway band of the storefront wall.
 */
export const ZONES: Record<RoomZone['id'], RoomZone> = {
  counter: {
    id: 'counter',
    bounds: {
      minX: ROOM_BOUNDS.maxX - WALL_THICKNESS / 2 - 1.0,
      maxX: ROOM_BOUNDS.maxX - WALL_THICKNESS / 2,
      minY: 0,
      maxY: 1.2,
      minZ: ANCHORS.counter.position.z - ANCHORS.counter.length / 2,
      maxZ: ANCHORS.counter.position.z + ANCHORS.counter.length / 2,
    },
  },
  seating: {
    id: 'seating',
    bounds: {
      minX: ROOM_BOUNDS.minX + 0.4,
      maxX: ROOM_BOUNDS.maxX - WALL_THICKNESS / 2 - 1.1,
      minY: 0,
      maxY: ROOM_HEIGHT,
      minZ: ROOM_BOUNDS.minZ + 0.3,
      maxZ: ROOM_BOUNDS.maxZ - 0.3,
    },
  },
  entrance: {
    id: 'entrance',
    bounds: {
      minX: ANCHORS.entrance.position.x - DOOR_WIDTH / 2,
      maxX: ANCHORS.entrance.position.x + DOOR_WIDTH / 2,
      minY: 0,
      maxY: DOOR_HEIGHT,
      minZ: ROOM_BOUNDS.maxZ - WALL_THICKNESS - 0.05,
      maxZ: ROOM_BOUNDS.maxZ + 0.05,
    },
  },
};
