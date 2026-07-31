/**
 * QA gate: `npm run check:1965`
 *
 * Headless (no WebGL) verification of the 1965 mid-century / beatnik café
 * composition:
 *   - the full composition mounts one child group per required fragment
 *     category (era-category naming, matching the AssetRegistry contract);
 *   - every category builds at least one mesh (no empty fragment groups);
 *   - the composition dresses the shell surface slots: geometric wallpaper on
 *     the walls, checkerboard tile on the floor, plaster ceiling;
 *   - the era audio config (generative bed, jukebox character, urn hiss) is
 *     attached to the composition group and satisfies the Phase 4 brief;
 *   - the category builders mount props at the canonical layout anchors
 *     (counter, machine slot, menu-board wall, poster walls, seating tables);
 *   - the 1965 patrons are mounted via the shared CharacterRoster: 3-4
 *     period-styled PatronConfigs (beehive/bouffant hair, slim ties,
 *     cigarette case / transistor radio gadgets), seated at the seating
 *     anchors inside the room, discoverable as mounted avatars so they
 *     toggle correctly with era changes.
 *
 * Pure object-graph assertions only, so it runs in CI without a browser.
 * Exits non-zero on any failure.
 */
import * as THREE from 'three';
import {
  build1965Composition,
  build1965Architecture,
  build1965FurnitureDecor,
  build1965CoffeeMachines,
  build1965MenuBoard,
  build1965MusicSource,
  build1965Posters,
  build1965Tableware,
  build1965SignageLighting,
  build1965CounterTechnology,
  build1965Patrons,
  ERA_AUDIO_1965,
} from '../compositions';
import type { PatronConfig } from '../data/EraData';
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

function collectPatronConfigs(group: THREE.Object3D): PatronConfig[] {
  const configs: PatronConfig[] = [];
  group.traverse((object) => {
    const avatar = (object as THREE.Group).userData?.characterAvatar as
      | { config?: PatronConfig }
      | undefined;
    if (avatar?.config) configs.push(avatar.config);
  });
  return configs;
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
  console.log('\n[1965 composition categories]');
  const result = build1965Composition();
  const categoryNames = new Set(result.group.children.map((child) => child.name));
  for (const category of REQUIRED_CATEGORIES) {
    const child = result.group.getObjectByName(`1965-${category}`);
    assert(!!child, `category group "1965-${category}" exists`);
    if (child) {
      assert(countMeshes(child) > 0, `category "1965-${category}" builds meshes (${countMeshes(child)})`);
    }
  }
  assert(categoryNames.size === REQUIRED_CATEGORIES.length, 'composition has exactly the required category groups');

  // 2. Every category builder mounts meshes individually (registry wiring).
  console.log('\n[1965 category builders]');
  const builders: Array<[string, (target: THREE.Object3D) => void]> = [
    ['architecture', build1965Architecture],
    ['furnitureDecor', build1965FurnitureDecor],
    ['coffeeMachines', build1965CoffeeMachines],
    ['menuBoard', build1965MenuBoard],
    ['musicSource', build1965MusicSource],
    ['posters', build1965Posters],
    ['tableware', build1965Tableware],
    ['signageLighting', build1965SignageLighting],
    ['counterTechnology', build1965CounterTechnology],
    ['patrons', build1965Patrons],
  ];
  for (const [name, builder] of builders) {
    const group = new THREE.Group();
    builder(group);
    assert(countMeshes(group) > 0, `${name} builds at least one mesh (${countMeshes(group)})`);
  }

  // 3. Surface slots are populated with the 1965 finishes.
  console.log('\n[1965 surface slots]');
  const shell = createArchitectureShell();
  build1965Composition(new THREE.Group(), shell.slots);
  const wallKind = shell.slots.wallSlots.back.material.userData?.proceduralKind as string | undefined;
  const floorKind = shell.slots.floorSlot.material.userData?.proceduralKind as string | undefined;
  const ceilingKind = shell.slots.ceilingSlot.material.userData?.proceduralKind as string | undefined;
  assert(wallKind === 'geometric', `wall slot uses the geometric wallpaper finish (got ${wallKind ?? 'none'})`);
  assert(floorKind === 'floor', `floor slot uses the checkerboard tile finish (got ${floorKind ?? 'none'})`);
  assert(ceilingKind === 'ceiling', `ceiling slot uses the plaster ceiling finish (got ${ceilingKind ?? 'none'})`);

  // 4. Era audio config satisfies the brief.
  console.log('\n[1965 audio config]');
  assert(ERA_AUDIO_1965.era === 1965, 'audio config targets 1965');
  assert(ERA_AUDIO_1965.generativeBed.length >= 2, 'generative bed has motown/beat + folk layers');
  assert(ERA_AUDIO_1965.generativeBed.some((layer) => layer.style === 'motown-beat-bed'), 'generative bed includes the motown/beat layer');
  assert(ERA_AUDIO_1965.generativeBed.some((layer) => layer.style === 'folk-acoustic-bed'), 'generative bed includes the folk layer');
  assert(ERA_AUDIO_1965.jukeboxCharacter.style === 'jukebox-character', 'jukebox character layer present');
  assert(ERA_AUDIO_1965.urnHiss.style === 'urn-hiss', 'urn hiss layer present');
  assert(
    (result.group.userData.eraAudio as unknown) === ERA_AUDIO_1965,
    'composition group carries the era audio config in userData',
  );

  // 5. Anchor mounting: props sit at the canonical layout anchors.
  console.log('\n[1965 anchor mounting]');
  assert(
    Math.abs(ANCHORS.counter.position.x - (ROOM_BOUNDS.maxX - 0.2 - 0.45)) < 0.5,
    'counter anchor is along the east wall',
  );
  assert(ANCHORS.machineSlot.y > 1.0, 'machine slot is on the counter top');
  assert(ANCHORS.menuBoardWall.wall === 'back', 'menu board mounts on the back wall');
  assert(ANCHORS.posterWalls.length >= 4, 'poster walls provide four+ mounting points');
  assert(ANCHORS.seatingTables.length >= 4, 'seating tables provide four+ positions');
  assert(ROOM_WIDTH > 0 && ROOM_DEPTH > 0, 'room dimensions are sane');

  // 6. Era patrons: the shared roster mounts 3-4 period-styled patrons and
  // seats them at the anchors inside the room (era-scoped visibility).
  console.log('\n[1965 patrons]');
  const patronGroup = new THREE.Group();
  build1965Patrons(patronGroup);
  const patronConfigs = collectPatronConfigs(patronGroup);
  assert(
    patronConfigs.length >= 3 && patronConfigs.length <= 4,
    `roster mounts 3-4 patrons via PatronConfig (got ${patronConfigs.length})`,
  );
  assert(
    patronConfigs.some(
      (config) => config.hair.kind === 'beehive' || config.hair.kind === 'bouffant',
    ),
    'patrons include beehive/bouffant period hair',
  );
  assert(
    patronConfigs.some(
      (config) =>
        config.accessory === 'tie' ||
        config.accessory === 'case' ||
        config.accessory === 'cigarette' ||
        config.accessory === 'radio',
    ),
    'patrons include slim ties / cigarette case / transistor radio gadgets',
  );
  for (const config of patronConfigs) {
    assert(
      (config.hair.kind as string) !== 'bob' &&
        (config.style ?? 'shirt-pants') !== 'jumpsuit',
      `patron "${config.name ?? 'anonymous'}" uses 1965 period styling`,
    );
  }
  patronGroup.traverse((object) => {
    const avatar = (object as THREE.Group).userData?.characterAvatar as
      | { root?: THREE.Object3D }
      | undefined;
    if (!avatar?.root) return;
    const pos = avatar.root.position;
    assert(
      pos.x >= ROOM_BOUNDS.minX && pos.x <= ROOM_BOUNDS.maxX &&
        pos.z >= ROOM_BOUNDS.minZ && pos.z <= ROOM_BOUNDS.maxZ,
      `patron (${pos.x.toFixed(2)}, ${pos.z.toFixed(2)}) is seated inside the room`,
    );
  });

  if (failures > 0) {
    console.error(`\n1965 composition check FAILED with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('\nAll 1965 composition assertions passed.');
  }
}

void run();
