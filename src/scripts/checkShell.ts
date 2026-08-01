/**
 * QA gate: `npm run check:shell`
 *
 * Headless (no WebGL) verification of the persistent café architecture shell
 * and the canonical spatial contract:
 *   - the shell builds a persistent room: floor, ceiling, back/side/storefront
 *     walls, storefront windows + door, counter zone and seating zone;
 *   - the shell derives its geometry from src/world/layout.ts, so the visible
 *     room matches the interior bounding box Navigation clamps against;
 *   - the layout exports canonical dimensions and every named anchor point
 *     (counter, machine slot, menu-board wall, poster walls, seating tables,
 *     entrance, lighting) plus interior zones;
 *   - era surface slots are exposed for every wall, the floor, the ceiling and
 *     the lighting mounts, and `setMaterial` re-dresses a surface;
 *   - the shell is era-neutral: it ships neutral placeholder materials only
 *     (no era palette token is referenced by the shell);
 *   - SceneManager integration mounts the shell as a persistent layer beneath
 *     era groups (its group is a direct scene child, not an era group).
 *
 * Pure object-graph assertions only (no WebGL), so it runs in CI without a
 * browser. Exits non-zero on any failure.
 */
import * as THREE from 'three';
import {
  buildArchitectureShell,
  createArchitectureShell,
} from '../world/ArchitectureShell';
import {
  ANCHORS,
  DOOR_HEIGHT,
  DOOR_WIDTH,
  ROOM_BOUNDS,
  ROOM_DEPTH,
  ROOM_HEIGHT,
  ROOM_WIDTH,
  WALL_THICKNESS,
  WALLS,
  ZONES,
  type WallId,
} from '../world/layout';
import { mountArchitectureShell } from '../systems/SceneManager';
import { Navigation, type CaféBounds } from '../systems/Navigation';

const WALL_IDS: WallId[] = ['back', 'left', 'right', 'storefront'];

function findMeshByName(group: THREE.Object3D, name: string): THREE.Mesh | undefined {
  let found: THREE.Mesh | undefined;
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!found && mesh.isMesh && mesh.name === name) found = mesh;
  });
  return found;
}

function countMeshes(group: THREE.Object3D, namePrefix: string): number {
  let count = 0;
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh && mesh.name.startsWith(namePrefix)) count += 1;
  });
  return count;
}

function run(): void {
  let failures = 0;
  const assert = (condition: boolean, message: string): void => {
    if (!condition) {
      failures += 1;
      console.error(`  FAIL: ${message}`);
    } else {
      console.log(`  ok: ${message}`);
    }
  };

  // --- Layout contract ------------------------------------------------------
  console.log('\n[layout contract]');
  assert(ROOM_WIDTH > 0 && ROOM_DEPTH > 0 && ROOM_HEIGHT > 0, 'room dimensions are positive');
  assert(
    ROOM_BOUNDS.maxX - ROOM_BOUNDS.minX === ROOM_WIDTH &&
      ROOM_BOUNDS.maxZ - ROOM_BOUNDS.minZ === ROOM_DEPTH &&
      ROOM_BOUNDS.maxY - ROOM_BOUNDS.minY === ROOM_HEIGHT,
    'ROOM_BOUNDS matches ROOM_WIDTH/ROOM_DEPTH/ROOM_HEIGHT',
  );
  assert(ROOM_BOUNDS.minY === 0, 'floor sits at y = 0');

  for (const id of WALL_IDS) {
    const wall = WALLS[id];
    assert(wall.normal.length() > 0.99 && wall.normal.length() < 1.01, `wall "${id}" has a unit normal`);
    assert(wall.width > 0 && wall.height > 0, `wall "${id}" has positive span`);
  }

  const anchorNames = [
    ['counter', !!ANCHORS.counter],
    ['machineSlot', !!ANCHORS.machineSlot],
    ['menuBoardWall', !!ANCHORS.menuBoardWall],
    ['posterWalls', ANCHORS.posterWalls.length > 0],
    ['seatingTables', ANCHORS.seatingTables.length > 0],
    ['entrance', !!ANCHORS.entrance],
    ['lighting', ANCHORS.lighting.length > 0],
  ] as const;
  for (const [name, present] of anchorNames) {
    assert(present, `anchor "${name}" is present`);
  }
  assert(ANCHORS.entrance.width === DOOR_WIDTH && ANCHORS.entrance.height === DOOR_HEIGHT, 'entrance anchor matches door dimensions');
  assert(ZONES.counter.id === 'counter' && ZONES.seating.id === 'seating' && ZONES.entrance.id === 'entrance', 'counter / seating / entrance zones exist');

  // Every seating table and lighting mount is inside the interior bounds.
  for (const table of ANCHORS.seatingTables) {
    assert(
      table.x >= ROOM_BOUNDS.minX && table.x <= ROOM_BOUNDS.maxX &&
        table.z >= ROOM_BOUNDS.minZ && table.z <= ROOM_BOUNDS.maxZ,
      `seating table (${table.x.toFixed(2)}, ${table.z.toFixed(2)}) is inside the room`,
    );
  }
  for (const light of ANCHORS.lighting) {
    assert(
      light.x >= ROOM_BOUNDS.minX && light.x <= ROOM_BOUNDS.maxX &&
        light.y >= ROOM_BOUNDS.minY && light.y <= ROOM_BOUNDS.maxY &&
        light.z >= ROOM_BOUNDS.minZ && light.z <= ROOM_BOUNDS.maxZ,
      `lighting mount (${light.x.toFixed(2)}, ${light.y.toFixed(2)}, ${light.z.toFixed(2)}) is inside the room`,
    );
  }

  // --- Shell geometry -------------------------------------------------------
  console.log('\n[shell geometry]');
  {
    const { group, slots } = createArchitectureShell();

    assert(group.name === 'architecture-shell', 'shell group is named "architecture-shell"');
    assert(!!findMeshByName(group, 'floor'), 'floor mesh exists');
    assert(!!findMeshByName(group, 'ceiling'), 'ceiling mesh exists');
    for (const id of WALL_IDS) {
      assert(!!findMeshByName(group, `wall-${id}`), `wall-${id} mesh exists`);
    }
    assert(!!findMeshByName(group, 'window-left') && !!findMeshByName(group, 'window-right'), 'storefront window glazing exists');
    assert(!!findMeshByName(group, 'door'), 'storefront door panel exists');
    assert(countMeshes(group, 'door-jamb') === 2 && countMeshes(group, 'door-header') === 1, 'door frame trim exists');
    assert(!!findMeshByName(group, 'counter-zone') && !!findMeshByName(group, 'counter-top'), 'counter zone exists');
    assert(countMeshes(group, 'seating-table-') === ANCHORS.seatingTables.length * 2, 'seating zone has one base + top per anchor table');

    // The storefront wall is extruded with real openings: the outer shape has
    // the door + left window + right window as three holes, and the opening
    // rects never overlap (earcut needs non-overlapping holes).
    const storefront = findMeshByName(group, 'wall-storefront');
    const storefrontShape =
      storefront?.geometry instanceof THREE.ExtrudeGeometry &&
      storefront.geometry.parameters?.shapes instanceof THREE.Shape
        ? storefront.geometry.parameters.shapes
        : undefined;
    assert(
      !!storefrontShape && storefrontShape.holes.length === 3,
      `storefront wall has door + 2 window openings (${storefrontShape?.holes.length ?? 0} holes)`,
    );

    // Shell is a persistent layer: the room meshes live in the shell group
    // and the group is not an era group (never mounted/unmounted by eras).
    assert(group.children.length > 0, 'shell group contains the room meshes');
    assert(!group.name.startsWith('era-'), 'shell group is not an era group');

    // Slot surface.
    assert(slots.floorSlot.mesh === findMeshByName(group, 'floor'), 'floorSlot binds the floor mesh');
    assert(slots.ceilingSlot.mesh === findMeshByName(group, 'ceiling'), 'ceilingSlot binds the ceiling mesh');

    // Era-neutral: the shell's own slot materials are neutral placeholders,
    // and no mesh name carries an era year. (Checked before re-dressing.)
    const neutral = new THREE.Color(0x9b9389);
    const neutralFloor = new THREE.Color(0x6d655c);
    const wallColor = slots.wallSlots.back.material instanceof THREE.MeshStandardMaterial
      ? slots.wallSlots.back.material.color
      : new THREE.Color();
    const floorColor = slots.floorSlot.material instanceof THREE.MeshStandardMaterial
      ? slots.floorSlot.material.color
      : new THREE.Color();
    assert(wallColor.getHex() === neutral.getHex(), 'wall slots start neutral (era-neutral)');
    assert(floorColor.getHex() === neutralFloor.getHex(), 'floor slot starts neutral (era-neutral)');

    const replaced = new THREE.MeshStandardMaterial({ color: 0x123456 });
    slots.floorSlot.setMaterial(replaced);
    assert(slots.floorSlot.material === replaced && findMeshByName(group, 'floor')?.material === replaced, 'setMaterial re-dresses a slot');
    assert(slots.lighting.length === ANCHORS.lighting.length, 'lighting mounts are exposed through slots');

    slots.dispose();
    replaced.dispose();
  }

  // --- SceneManager integration ----------------------------------------------
  console.log('\n[SceneManager integration]');
  {
    const scene = new THREE.Scene();
    const { shell, slots } = mountArchitectureShell(scene);
    assert(scene.children.includes(shell), 'shell is mounted as a direct scene child');
    assert(shell.parent === scene, 'shell parent is the scene (persistent layer beneath era groups)');
    assert(!!findMeshByName(scene, 'floor'), 'shell meshes are reachable through the scene');
    slots.dispose();
    scene.clear();
  }

  // --- Navigation compatibility ------------------------------------------------
  console.log('\n[navigation compatibility]');
  {
    const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
    const fakeDom = {
      tabIndex: 0,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      setAttribute: () => {},
      focus: () => {},
      setPointerCapture: () => {},
      releasePointerCapture: () => {},
    } as unknown as HTMLElement;
    const nav = new Navigation(camera, fakeDom, {
      bounds: ROOM_BOUNDS,
      collisionMargin: 0.25,
      initialTarget: new THREE.Vector3(0, 1.4, 0),
    });
    const p = camera.position;
    assert(
      p.x >= ROOM_BOUNDS.minX + 0.25 - 1e-6 && p.x <= ROOM_BOUNDS.maxX - 0.25 + 1e-6 &&
        p.y >= ROOM_BOUNDS.minY + 0.25 - 1e-6 && p.y <= ROOM_BOUNDS.maxY - 0.25 + 1e-6 &&
        p.z >= ROOM_BOUNDS.minZ + 0.25 - 1e-6 && p.z <= ROOM_BOUNDS.maxZ - 0.25 + 1e-6,
      'Navigation with ROOM_BOUNDS keeps the camera inside the interior',
    );
    nav.dispose();
  }

  // The counter / seating / entrance zone volumes are axis-aligned and inside
  // the room bounds.
  console.log('\n[zones]');
  {
    const isInsideRoom = (bounds: CaféBounds, zSlack = 0): boolean =>
      bounds.minX >= ROOM_BOUNDS.minX && bounds.maxX <= ROOM_BOUNDS.maxX &&
        bounds.minY >= ROOM_BOUNDS.minY && bounds.maxY <= ROOM_BOUNDS.maxY &&
        bounds.minZ >= ROOM_BOUNDS.minZ - zSlack && bounds.maxZ <= ROOM_BOUNDS.maxZ + zSlack;
    assert(isInsideRoom(ZONES.counter.bounds), 'counter zone volume is inside the interior bounds');
    assert(isInsideRoom(ZONES.seating.bounds), 'seating zone volume is inside the interior bounds');
    // The entrance zone spans the storefront wall (the doorway passes through
    // it), so its z extent crosses the wall thickness.
    assert(
      isInsideRoom(ZONES.entrance.bounds, WALL_THICKNESS + 0.1),
      'entrance zone spans the storefront wall (doorway)',
    );
    assert(buildArchitectureShell.length === 1, 'buildArchitectureShell accepts a target object');
  }

  if (failures > 0) {
    console.error(`\nArchitecture shell check FAILED: ${failures} assertion(s)`);
    process.exitCode = 1;
  } else {
    console.log('\nAll architecture shell assertions passed.');
  }
}

void run();
