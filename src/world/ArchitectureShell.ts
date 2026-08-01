/**
 * src/world/ArchitectureShell.ts — the persistent (non-era) café interior room.
 *
 * The shell is the era-neutral architecture that every era shares: floor,
 * back wall, two side walls, ceiling, and a storefront window wall with a
 * door. Its geometry is derived entirely from the canonical spatial contract
 * (src/world/layout.ts), so navigation bounds, anchors and the visible room
 * can never disagree.
 *
 * Era-specific finishes are delegated through {@link SurfaceSlots}: era tasks
 * populate `wallSlots`, `floorSlot` and `ceilingSlot` with their own
 * materials/textures/light fixtures. Until an era populates a slot, the shell
 * shows a neutral placeholder finish. The shell itself never applies an
 * era-specific colour, texture or light.
 *
 * The shell mounts as one persistent group in the scene (added by the
 * SceneManager, main.ts, or any host) and sits *beneath* the per-era groups:
 * era fragments are added on top of it, never removed with them.
 */
import * as THREE from 'three';
import {
  ANCHORS,
  DOOR_HEIGHT,
  DOOR_WIDTH,
  ROOM_BOUNDS,
  ROOM_DEPTH,
  ROOM_HEIGHT,
  ROOM_WIDTH,
  WALL_THICKNESS,
  type WallId,
} from './layout';

/** Half-depth of the counter bar (anchored along the east wall). */
const COUNTER_DEPTH = 0.45;

/** The mountable surface slots era tasks populate with their finishes. */
export interface SurfaceSlots {
  /** Interior face of each wall (back / left / right / storefront). */
  wallSlots: Record<WallId, SurfaceSlot>;
  /** The floor surface. */
  floorSlot: SurfaceSlot;
  /** The ceiling surface (era light fixtures mount through `lighting`). */
  ceilingSlot: SurfaceSlot;
  /** Ceiling points where era light fixtures attach. */
  lighting: THREE.Vector3[];
  /** Dispose every material owned by the shell's placeholder slots. */
  dispose(): void;
}

/** One mountable surface: an era finish replaces `material`. */
export interface SurfaceSlot {
  /** The era-neutral placeholder material currently on the surface. */
  material: THREE.Material;
  /** Replace with the era's finish (era tasks call `setMaterial`). */
  setMaterial(material: THREE.Material): void;
  /** The underlying mesh (position/size are owned by the shell). */
  mesh: THREE.Mesh;
}

/** A surface slot bound to one mesh that the shell manages. */
class Slot implements SurfaceSlot {
  readonly mesh: THREE.Mesh;
  material: THREE.Material;

  constructor(mesh: THREE.Mesh, material: THREE.Material) {
    this.mesh = mesh;
    this.material = material;
  }

  setMaterial(material: THREE.Material): void {
    this.material = material;
    this.mesh.material = material;
  }
}

/** Neutral placeholder finishes used until an era populates a slot. */
function makePlaceholderMaterials(): {
  wall: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  door: THREE.MeshStandardMaterial;
} {
  // Era-neutral architectural greys (no era-specific colour).
  const wall = new THREE.MeshStandardMaterial({ color: 0x9b9389, roughness: 0.92 });
  const floor = new THREE.MeshStandardMaterial({ color: 0x6d655c, roughness: 0.88 });
  const ceiling = new THREE.MeshStandardMaterial({ color: 0x7f786f, roughness: 0.9 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0xbfd4e8,
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const frame = new THREE.MeshStandardMaterial({ color: 0x4c463f, roughness: 0.6 });
  const door = new THREE.MeshStandardMaterial({
    color: 0x4c463f,
    roughness: 0.75,
    side: THREE.DoubleSide,
  });
  return { wall, floor, ceiling, glass, frame, door };
}

/**
 * Build the persistent café room shell into `target`.
 *
 * Returns the shell group plus the mountable surface slots. The caller owns
 * the group lifecycle (add it to the scene once, keep it mounted for the app
 * lifetime, dispose it on teardown).
 */
export function buildArchitectureShell(target: THREE.Object3D): {
  group: THREE.Group;
  slots: SurfaceSlots;
} {
  const group = new THREE.Group();
  group.name = 'architecture-shell';
  const materials = makePlaceholderMaterials();
  const ownedMaterials: THREE.Material[] = [
    materials.wall,
    materials.floor,
    materials.ceiling,
    materials.glass,
    materials.frame,
    materials.door,
  ];

  const addMesh = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: THREE.Vector3,
    name: string,
    receiveShadow = false,
    castShadow = false,
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.copy(position);
    mesh.receiveShadow = receiveShadow;
    mesh.castShadow = castShadow;
    group.add(mesh);
    return mesh;
  };

  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;

  // --- Floor (top face at y = 0, slab extends below the interior) ----------
  const floor = addMesh(
    new THREE.BoxGeometry(ROOM_WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS, ROOM_DEPTH + WALL_THICKNESS * 2),
    materials.floor,
    new THREE.Vector3(0, -WALL_THICKNESS / 2, 0),
    'floor',
    true,
  );

  // --- Ceiling (bottom face at y = ROOM_HEIGHT, slab extends above) --------
  const ceiling = addMesh(
    new THREE.BoxGeometry(ROOM_WIDTH + WALL_THICKNESS * 2, WALL_THICKNESS, ROOM_DEPTH + WALL_THICKNESS * 2),
    materials.ceiling,
    new THREE.Vector3(0, ROOM_HEIGHT + WALL_THICKNESS / 2, 0),
    'ceiling',
    true,
  );

  // --- Interior wall faces --------------------------------------------------
  const wallDepth = ROOM_DEPTH + WALL_THICKNESS * 2;
  const wallWidth = ROOM_WIDTH + WALL_THICKNESS * 2;

  const back = addMesh(
    new THREE.BoxGeometry(wallWidth, ROOM_HEIGHT, WALL_THICKNESS),
    materials.wall,
    new THREE.Vector3(0, ROOM_HEIGHT / 2, -halfD - WALL_THICKNESS / 2),
    'wall-back',
    true,
  );
  const left = addMesh(
    new THREE.BoxGeometry(WALL_THICKNESS, ROOM_HEIGHT, wallDepth),
    materials.wall,
    new THREE.Vector3(-halfW - WALL_THICKNESS / 2, ROOM_HEIGHT / 2, 0),
    'wall-left',
    true,
  );
  const right = addMesh(
    new THREE.BoxGeometry(WALL_THICKNESS, ROOM_HEIGHT, wallDepth),
    materials.wall,
    new THREE.Vector3(halfW + WALL_THICKNESS / 2, ROOM_HEIGHT / 2, 0),
    'wall-right',
    true,
  );

  // --- Storefront window wall + door ----------------------------------------
  // The storefront is a single slab with real openings cut into it (door +
  // two windows), extruded to the wall thickness so the interior face sits at
  // z = ROOM_BOUNDS.maxZ and the openings match the layout anchors exactly.
  // The entrance is offset to x = -4 (ANCHORS.entrance); the left window is
  // narrower so the openings never overlap.
  const storefrontShape = new THREE.Shape();
  storefrontShape.moveTo(-halfW, 0);
  storefrontShape.lineTo(halfW, 0);
  storefrontShape.lineTo(halfW, ROOM_HEIGHT);
  storefrontShape.lineTo(-halfW, ROOM_HEIGHT);
  storefrontShape.closePath();

  const windowHeight = 2.2;
  const windowY = 1.8;

  const addRectangularHole = (
    shape: THREE.Shape,
    cx: number,
    cy: number,
    width: number,
    height: number,
  ): void => {
    const hole = new THREE.Path();
    // Clockwise winding (opposite to the CCW outer shape) so earcut treats it
    // as a hole.
    hole.moveTo(cx - width / 2, cy - height / 2);
    hole.lineTo(cx - width / 2, cy + height / 2);
    hole.lineTo(cx + width / 2, cy + height / 2);
    hole.lineTo(cx + width / 2, cy - height / 2);
    hole.closePath();
    shape.holes.push(hole);
  };

  const doorX = ANCHORS.entrance.position.x;
  addRectangularHole(storefrontShape, doorX, DOOR_HEIGHT / 2, DOOR_WIDTH, DOOR_HEIGHT);

  const leftWindowX = -5.8;
  const leftWindowWidth = 1.6;
  const rightWindowX = 2.6;
  const rightWindowWidth = 3.2;
  addRectangularHole(storefrontShape, leftWindowX, windowY, leftWindowWidth, windowHeight);
  addRectangularHole(storefrontShape, rightWindowX, windowY, rightWindowWidth, windowHeight);

  const storefront = addMesh(
    new THREE.ExtrudeGeometry(storefrontShape, {
      depth: WALL_THICKNESS,
      bevelEnabled: false,
    }),
    materials.wall,
    new THREE.Vector3(0, 0, ROOM_BOUNDS.maxZ),
    'wall-storefront',
    true,
  );

  // Glazing inset into each window opening (planes on the interior face,
  // facing -z into the room).
  const makeGlazing = (name: string, x: number, width: number): THREE.Mesh => {
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, windowHeight), materials.glass);
    glass.name = name;
    glass.rotation.y = Math.PI;
    glass.position.set(x, windowY, ROOM_BOUNDS.maxZ + 0.02);
    group.add(glass);
    return glass;
  };
  makeGlazing('window-left', leftWindowX, leftWindowWidth);
  makeGlazing('window-right', rightWindowX, rightWindowWidth);

  // Door panel (glazed, inset into the doorway opening, facing into the room).
  const door = addMesh(
    new THREE.PlaneGeometry(DOOR_WIDTH, DOOR_HEIGHT),
    materials.door,
    new THREE.Vector3(doorX, DOOR_HEIGHT / 2, ROOM_BOUNDS.maxZ + 0.02),
    'door',
  );
  door.rotation.y = Math.PI;

  // Door frame trim (two jambs + header) hugging the opening.
  const doorFrame = new THREE.Group();
  doorFrame.name = 'door-frame';
  const trimZ = ROOM_BOUNDS.maxZ - 0.02;
  const jambWidth = 0.09;
  const trimDepth = 0.08;
  const addTrim = (
    width: number,
    height: number,
    x: number,
    y: number,
    name: string,
  ): void => {
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, trimDepth),
      materials.frame,
    );
    trim.name = name;
    trim.position.set(x, y, trimZ);
    trim.castShadow = true;
    doorFrame.add(trim);
  };
  addTrim(jambWidth, DOOR_HEIGHT + 0.18, doorX - DOOR_WIDTH / 2 - jambWidth / 2, DOOR_HEIGHT / 2, 'door-jamb-left');
  addTrim(jambWidth, DOOR_HEIGHT + 0.18, doorX + DOOR_WIDTH / 2 + jambWidth / 2, DOOR_HEIGHT / 2, 'door-jamb-right');
  addTrim(DOOR_WIDTH + 0.18, 0.09, doorX, DOOR_HEIGHT + 0.09 / 2, 'door-header');
  group.add(doorFrame);

  // --- Counter zone -----------------------------------------------------------
  // A persistent, era-neutral counter bar along the east wall. The counter is
  // part of the shell's spatial contract (a defined zone); era tasks add
  // era-specific counter technology and the machine onto its top via
  // ANCHORS.counter / ANCHORS.machineSlot.
  addMesh(
    new THREE.BoxGeometry(ANCHORS.counter.depth, ANCHORS.counter.height, ANCHORS.counter.length),
    materials.wall,
    ANCHORS.counter.position,
    'counter-zone',
    true,
    true,
  );
  addMesh(
    new THREE.BoxGeometry(ANCHORS.counter.depth, 0.08, ANCHORS.counter.length),
    materials.frame,
    new THREE.Vector3(
      ANCHORS.counter.position.x,
      ANCHORS.counter.height + 0.04,
      ANCHORS.counter.position.z,
    ),
    'counter-top',
    true,
    true,
  );

  // --- Seating zone ------------------------------------------------------------
  // Persistent, era-neutral table bases mark the seating zone
  // (ANCHORS.seatingTables). Era tasks add chairs, tableware and patrons
  // around these bases.
  for (let i = 0; i < ANCHORS.seatingTables.length; i += 1) {
    const tablePos = ANCHORS.seatingTables[i];
    addMesh(
      new THREE.CylinderGeometry(0.28, 0.3, 0.74, 16),
      materials.frame,
      new THREE.Vector3(tablePos.x, 0.37, tablePos.z),
      `seating-table-${i + 1}`,
      true,
      true,
    );
    addMesh(
      new THREE.CylinderGeometry(0.62, 0.62, 0.06, 24),
      materials.frame,
      new THREE.Vector3(tablePos.x, 0.74, tablePos.z),
      `seating-table-top-${i + 1}`,
      true,
      true,
    );
  }

  target.add(group);

  // --- Surface slots -----------------------------------------------------------
  const slots: SurfaceSlots = {
    wallSlots: {
      back: new Slot(back, materials.wall),
      left: new Slot(left, materials.wall),
      right: new Slot(right, materials.wall),
      storefront: new Slot(storefront, materials.wall),
    },
    floorSlot: new Slot(floor, materials.floor),
    ceilingSlot: new Slot(ceiling, materials.ceiling),
    lighting: ANCHORS.lighting.map((point) => point.clone()),
    dispose(): void {
      for (const material of ownedMaterials) material.dispose();
    },
  };

  return { group, slots };
}

/**
 * Convenience: build the shell directly into a fresh group and return both
 * the group and the slots, ready to be added to a scene.
 */
export function createArchitectureShell(): {
  group: THREE.Group;
  slots: SurfaceSlots;
} {
  return buildArchitectureShell(new THREE.Group());
}

export { COUNTER_DEPTH };
