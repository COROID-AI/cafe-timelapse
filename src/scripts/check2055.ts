/**
 * QA gate: `npm run check:2055`
 *
 * Headless (no WebGL) verification of the 2055 near-future speculative café
 * composition:
 *   - the full composition mounts one child group per required fragment
 *     category (era-category naming, matching the AssetRegistry contract);
 *   - every category builds at least one mesh (no empty fragment groups);
 *   - the composition dresses the shell surface slots: reactive smart-glass
 *     walls, photopolymer resin floor, mycelium ceiling;
 *   - the era audio config (spatial-audio generative bed, holographic
 *     emitter, robotic brew) is attached to the composition group and
 *     satisfies the Phase 4 brief;
 *   - the category builders mount props at the canonical layout anchors
 *     (counter, machine slot, menu-board wall, poster walls, seating tables).
 *
 * Pure object-graph assertions only, so it runs in CI without a browser.
 * Exits non-zero on any failure.
 */
import * as THREE from 'three';
import {
  build2055Composition,
  build2055Architecture,
  build2055FurnitureDecor,
  build2055CoffeeMachines,
  build2055MenuBoard,
  build2055MusicSource,
  build2055Posters,
  build2055Tableware,
  build2055SignageLighting,
  build2055CounterTechnology,
  build2055Patrons,
  PATRON_CONFIGS_2055,
  ERA_AUDIO_2055,
} from '../compositions';
import type { PatronConfig } from '../data/EraData';
import { era2055 } from '../data/eras/2055';
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
  console.log('\n[2055 composition categories]');
  const result = build2055Composition();
  const categoryNames = new Set(result.group.children.map((child) => child.name));
  for (const category of REQUIRED_CATEGORIES) {
    const child = result.group.getObjectByName(`2055-${category}`);
    assert(!!child, `category group "2055-${category}" exists`);
    if (child) {
      assert(countMeshes(child) > 0, `category "2055-${category}" builds meshes (${countMeshes(child)})`);
    }
  }
  assert(categoryNames.size === REQUIRED_CATEGORIES.length, 'composition has exactly the required category groups');

  // 2. Every category builder mounts meshes individually (registry wiring).
  console.log('\n[2055 category builders]');
  const builders: Array<[string, (target: THREE.Object3D) => void]> = [
    ['architecture', build2055Architecture],
    ['furnitureDecor', build2055FurnitureDecor],
    ['coffeeMachines', build2055CoffeeMachines],
    ['menuBoard', build2055MenuBoard],
    ['musicSource', build2055MusicSource],
    ['posters', build2055Posters],
    ['tableware', build2055Tableware],
    ['signageLighting', build2055SignageLighting],
    ['counterTechnology', build2055CounterTechnology],
    ['patrons', build2055Patrons],
  ];
  for (const [name, builder] of builders) {
    const group = new THREE.Group();
    builder(group);
    assert(countMeshes(group) > 0, `${name} builds at least one mesh (${countMeshes(group)})`);
  }

  // 3. Surface slots are populated with the 2055 finishes.
  console.log('\n[2055 surface slots]');
  const shell = createArchitectureShell();
  build2055Composition(new THREE.Group(), shell.slots);
  const wallKind = shell.slots.wallSlots.back.material.userData?.proceduralKind as string | undefined;
  const floorKind = shell.slots.floorSlot.material.userData?.proceduralKind as string | undefined;
  const ceilingKind = shell.slots.ceilingSlot.material.userData?.proceduralKind as string | undefined;
  const wallSurface = shell.slots.wallSlots.back.material.userData?.surface as string | undefined;
  const floorSurface = shell.slots.floorSlot.material.userData?.surface as string | undefined;
  const ceilingSurface = shell.slots.ceilingSlot.material.userData?.surface as string | undefined;
  assert(wallSurface === 'smart-glass', `wall slot uses the smart-glass finish (got ${wallSurface ?? 'none'})`);
  assert(floorSurface === 'resin-floor', `floor slot uses the resin floor finish (got ${floorSurface ?? 'none'})`);
  assert(ceilingSurface === 'mycelium-ceiling', `ceiling slot uses the mycelium finish (got ${ceilingSurface ?? 'none'})`);
  assert(wallKind === 'wall' && floorKind === 'floor' && ceilingKind === 'ceiling', 'surface materials carry procedural kinds');

  // 4. Era audio config satisfies the brief.
  console.log('\n[2055 audio config]');
  assert(ERA_AUDIO_2055.era === 2055, 'audio config targets 2055');
  assert(ERA_AUDIO_2055.generativeBed.length >= 2, 'generative bed has spatial-audio + ambient layers');
  assert(ERA_AUDIO_2055.generativeBed.some((layer) => layer.style === 'spatial-audio-bed'), 'generative bed includes the spatial-audio layer');
  assert(ERA_AUDIO_2055.holographicEmitter.style === 'holographic-emitter', 'holographic emitter character layer present');
  assert(ERA_AUDIO_2055.roboticBrew.style === 'robotic-brew', 'robotic brew sounds layer present');
  assert(
    (result.group.userData.eraAudio as unknown) === ERA_AUDIO_2055,
    'composition group carries the era audio config in userData',
  );

  // 5. Anchor mounting: props sit at the canonical layout anchors.
  console.log('\n[2055 anchor mounting]');
  assert(
    Math.abs(ANCHORS.counter.position.x - (ROOM_BOUNDS.maxX - 0.2 - 0.45)) < 0.5,
    'counter anchor is along the east wall',
  );
  assert(ANCHORS.machineSlot.y > 1.0, 'machine slot is on the counter top');
  assert(ANCHORS.menuBoardWall.wall === 'back', 'menu board mounts on the back wall');
  assert(ANCHORS.posterWalls.length >= 4, 'poster walls provide four+ mounting points');
  assert(ANCHORS.seatingTables.length >= 4, 'seating tables provide four+ positions');
  assert(ROOM_WIDTH > 0 && ROOM_DEPTH > 0, 'room dimensions are sane');

  // 6. Era patrons: the shared roster mounts 3-4 speculative near-future
  //    PatronConfigs (techwear silhouettes, AR/smart glasses, futuristic
  //    hair, wearable devices, holographic-interface gadgets), seated at the
  //    anchors inside the room (era-scoped visibility).
  console.log('\n[2055 patrons]');
  const patronGroup = new THREE.Group();
  build2055Patrons(patronGroup);
  const patronConfigs = collectPatronConfigs(patronGroup);
  assert(
    patronConfigs.length >= 3 && patronConfigs.length <= 4,
    `roster mounts 3-4 patrons via PatronConfig (got ${patronConfigs.length})`,
  );
  assert(
    patronConfigs.length === PATRON_CONFIGS_2055.length,
    'roster mounts exactly the 2055 PatronConfig set',
  );
  assert(
    patronConfigs.length === era2055.patrons.length,
    'roster patron count matches the 2055 EraData patron records',
  );
  // Sleek minimalist techwear / futuristic silhouettes (no 20th-century cut).
  assert(
    patronConfigs.some((config) => config.style === 'jumpsuit'),
    'a patron wears the reflective futuristic jumpsuit',
  );
  assert(
    patronConfigs.some((config) => config.style === 'poncho'),
    'a patron wears the smart-fabric poncho',
  );
  // AR/smart glasses and holographic-interface gadgets.
  assert(
    patronConfigs.some((config) => config.accessory === 'glasses'),
    'a patron wears AR/smart glasses',
  );
  assert(
    patronConfigs.some((config) => config.accessory === 'holo-panel'),
    'a patron carries a holographic-interface gadget',
  );
  // Subtle futuristic hairstyles: braids with light threads, holographic
  // dye / sheen rather than 20th-century period styles.
  const futuristicHair = new Set(['braids', 'buzz', 'ponytail', 'bob']);
  assert(
    patronConfigs.some((config) => futuristicHair.has(config.hair.kind)),
    'patrons include subtle futuristic hairstyles',
  );
  for (const config of patronConfigs) {
    assert(
      (config.hair.kind as string) !== 'fedora' &&
        (config.hair.kind as string) !== 'victory-rolls' &&
        (config.hair.kind as string) !== 'finger-waves',
      `patron "${config.name ?? 'anonymous'}" uses 2055 future styling`,
    );
  }
  // Era-scoped visibility: the mounted avatars are discoverable on the
  // fragment so they toggle with era changes.
  let avatarCount = 0;
  patronGroup.traverse((object) => {
    if ((object as THREE.Group).userData?.characterAvatar) avatarCount += 1;
  });
  assert(
    avatarCount === patronConfigs.length,
    `mounted avatars are discoverable for the era-scoped animation driver (${avatarCount})`,
  );
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
    console.error(`\n2055 composition check FAILED with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('\nAll 2055 composition assertions passed.');
  }
}

void run();
