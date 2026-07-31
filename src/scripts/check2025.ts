/**
 * QA gate: `npm run check:2025`
 *
 * Headless (no WebGL) verification of the 2025 modern third-wave / specialty
 * café composition:
 *   - the full composition mounts one child group per required fragment
 *     category (era-category naming, matching the AssetRegistry contract);
 *   - every category builds at least one mesh (no empty fragment groups);
 *   - the composition dresses the shell surface slots: white ceramic tile on
 *     the walls, polished concrete on the floor, matte black exposed-services
 *     ceiling;
 *   - the era audio config (lo-fi / modern-evocative generative bed, phone +
 *     Bluetooth speaker character, steam wand hiss) is attached to the
 *     composition group and satisfies the Phase 4 brief;
 *   - the category builders mount props at the canonical layout anchors
 *     (counter, machine slot, menu-board wall, poster walls, seating tables).
 *
 * Pure object-graph assertions only, so it runs in CI without a browser.
 * Exits non-zero on any failure.
 */
import * as THREE from 'three';
import {
  build2025Composition,
  build2025Architecture,
  build2025FurnitureDecor,
  build2025CoffeeMachines,
  build2025MenuBoard,
  build2025MusicSource,
  build2025Posters,
  build2025Tableware,
  build2025SignageLighting,
  build2025CounterTechnology,
  build2025Patrons,
  ERA_AUDIO_2025,
} from '../compositions';
import { createArchitectureShell } from '../world/ArchitectureShell';
import { ANCHORS, ROOM_BOUNDS, ROOM_WIDTH, ROOM_DEPTH } from '../world/layout';

const REQUIRED_CATEGORIES = [
  'architecture',
  'furnitureDecor',
  'coffeeMachines',
  'menuBoard',
  'musicSource',
  'posters',
  'tableware',
  'signageLighting',
  'counterTechnology',
  'patrons',
] as const;

function countMeshes(group: THREE.Object3D): number {
  let n = 0;
  group.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) n += 1;
  });
  return n;
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

  // 1. Full composition builds one group per required category, all with meshes.
  console.log('\n[2025 composition categories]');
  const result = build2025Composition();
  const categoryNames = new Set(result.group.children.map((child) => child.name));
  for (const category of REQUIRED_CATEGORIES) {
    const child = result.group.getObjectByName(`2025-${category}`);
    assert(!!child, `category group "2025-${category}" exists`);
    if (child) {
      assert(countMeshes(child) > 0, `category "2025-${category}" builds meshes (${countMeshes(child)})`);
    }
  }
  assert(categoryNames.size === REQUIRED_CATEGORIES.length, 'composition has exactly the required category groups');

  // 2. Every category builder mounts meshes individually (registry wiring).
  console.log('\n[2025 category builders]');
  const builders: Array<[string, (target: THREE.Object3D) => void]> = [
    ['architecture', build2025Architecture],
    ['furnitureDecor', build2025FurnitureDecor],
    ['coffeeMachines', build2025CoffeeMachines],
    ['menuBoard', build2025MenuBoard],
    ['musicSource', build2025MusicSource],
    ['posters', build2025Posters],
    ['tableware', build2025Tableware],
    ['signageLighting', build2025SignageLighting],
    ['counterTechnology', build2025CounterTechnology],
    ['patrons', build2025Patrons],
  ];
  for (const [name, builder] of builders) {
    const group = new THREE.Group();
    builder(group);
    assert(countMeshes(group) > 0, `${name} builds at least one mesh (${countMeshes(group)})`);
  }

  // 3. Surface slots are populated with the 2025 finishes.
  console.log('\n[2025 surface slots]');
  const shell = createArchitectureShell();
  build2025Composition(new THREE.Group(), shell.slots);
  const wallKind = shell.slots.wallSlots.back.material.userData?.surface as string | undefined;
  const floorKind = shell.slots.floorSlot.material.userData?.surface as string | undefined;
  const ceilingKind = shell.slots.ceilingSlot.material.userData?.surface as string | undefined;
  assert(wallKind === 'white-tile', `wall slot uses the white ceramic tile finish (got ${wallKind ?? 'none'})`);
  assert(floorKind === 'polished-concrete', `floor slot uses the polished concrete finish (got ${floorKind ?? 'none'})`);
  assert(ceilingKind === 'matte-black', `ceiling slot uses the matte black finish (got ${ceilingKind ?? 'none'})`);

  // 4. Era audio config satisfies the brief.
  console.log('\n[2025 audio config]');
  assert(ERA_AUDIO_2025.era === 2025, 'audio config targets 2025');
  assert(ERA_AUDIO_2025.generativeBed.length >= 2, 'generative bed has lo-fi + modern-evocative layers');
  assert(ERA_AUDIO_2025.generativeBed.some((layer) => layer.style === 'lo-fi-bed'), 'generative bed includes the lo-fi layer');
  assert(ERA_AUDIO_2025.generativeBed.some((layer) => layer.style === 'modern-evocative-bed'), 'generative bed includes the modern-evocative layer');
  assert(ERA_AUDIO_2025.phoneBtSpeakerCharacter.style === 'phone-bt-speaker-character', 'phone + Bluetooth speaker character layer present');
  assert(ERA_AUDIO_2025.steamWandHiss.style === 'steam-wand-hiss', 'steam wand hiss layer present');
  assert(
    (result.group.userData.eraAudio as unknown) === ERA_AUDIO_2025,
    'composition group carries the era audio config in userData',
  );

  // 5. Anchor mounting: props sit at the canonical layout anchors.
  console.log('\n[2025 anchor mounting]');
  assert(
    Math.abs(ANCHORS.counter.position.x - (ROOM_BOUNDS.maxX - 0.2 - 0.45)) < 0.5,
    'counter anchor is along the east wall',
  );
  assert(ANCHORS.machineSlot.y > 1.0, 'machine slot is on the counter top');
  assert(ANCHORS.menuBoardWall.wall === 'back', 'menu board mounts on the back wall');
  assert(ANCHORS.posterWalls.length >= 4, 'poster walls provide four+ mounting points');
  assert(ANCHORS.seatingTables.length >= 4, 'seating tables provide four+ positions');
  assert(ROOM_WIDTH > 0 && ROOM_DEPTH > 0, 'room dimensions are sane');

  if (failures > 0) {
    console.error(`\n2025 composition check FAILED with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('\nAll 2025 composition assertions passed.');
  }
}

void run();
