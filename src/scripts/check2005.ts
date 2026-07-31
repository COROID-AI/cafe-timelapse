/**
 * QA gate: `npm run check:2005`
 *
 * Headless (no WebGL) verification of the 2005 second-wave coffeehouse
 * composition and its period patrons:
 *   - the registry mounts one child group per required fragment category
 *     (era-category naming, matching the AssetRegistry contract);
 *   - every category builder builds at least one mesh (no empty fragment
 *     groups);
 *   - the era audio config (indie/acoustic-evocative generative bed, iPod
 *     dock character, superautomatic hiss) satisfies the Phase 4 brief;
 *   - the category builders mount props at the canonical layout anchors
 *     (counter, machine slot, menu-board wall, poster walls, seating tables);
 *   - the 2005 patrons are mounted via the shared CharacterRoster: 3-4
 *     period-styled PatronConfigs (bootcut jeans, layered tops, side-swept
 *     bangs / spiky hair, flip phones / early iPods / open laptops), seated
 *     at the seating anchors inside the room, discoverable as mounted
 *     avatars so they toggle correctly with era changes.
 *
 * Pure object-graph assertions only, so it runs in CI without a browser.
 * Exits non-zero on any failure.
 */
import * as THREE from 'three';
import type { EraYear } from '../data/eras';
import type { PatronConfig } from '../data/EraData';
import { era2005 } from '../data/eras/2005';
import { ERA_AUDIO_2005 } from '../audio/eraAudioConfigs';
import { buildEraFragmentGroup } from '../systems/SceneManager';
import { ANCHORS, ROOM_BOUNDS, ROOM_WIDTH, ROOM_DEPTH } from '../world/layout';
import {
  build2005Architecture,
  build2005FurnitureDecor,
  build2005CoffeeMachines,
  build2005MenuBoard,
  build2005MusicSource,
  build2005Posters,
  build2005Tableware,
  build2005SignageLighting,
  build2005CounterTechnology,
  build2005Patrons,
} from '../scenes/eras/2005';
// Side-effect import registers the 2005 era into the AssetRegistry so
// buildEraFragmentGroup(2005) mounts the era's category groups.
import '../registry/eras/2005';

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

  // 1. Registry mounts one group per required category, all with meshes.
  console.log('\n[2005 fragment categories]');
  const eraGroup = buildEraFragmentGroup(2005);
  const categoryNames = new Set(eraGroup.children.map((child) => child.name));
  for (const category of REQUIRED_CATEGORIES) {
    const child = eraGroup.getObjectByName(`2005-${category}`);
    assert(!!child, `category group "2005-${category}" exists`);
    if (child) {
      assert(
        countMeshes(child) > 0,
        `category "2005-${category}" builds meshes (${countMeshes(child)})`,
      );
    }
  }
  assert(
    categoryNames.size === REQUIRED_CATEGORIES.length,
    'registry mounts exactly the required category groups',
  );

  // 2. Every category builder mounts meshes individually (registry wiring).
  console.log('\n[2005 category builders]');
  const builders: Array<[string, (target: THREE.Group, era: EraYear) => void]> = [
    ['architecture', build2005Architecture],
    ['furnitureDecor', build2005FurnitureDecor],
    ['coffeeMachines', build2005CoffeeMachines],
    ['menuBoard', build2005MenuBoard],
    ['musicSource', build2005MusicSource],
    ['posters', build2005Posters],
    ['tableware', build2005Tableware],
    ['signageLighting', build2005SignageLighting],
    ['counterTechnology', build2005CounterTechnology],
    ['patrons', build2005Patrons],
  ];
  for (const [name, builder] of builders) {
    const group = new THREE.Group();
    builder(group, 2005);
    assert(
      countMeshes(group) > 0,
      `${name} builds at least one mesh (${countMeshes(group)})`,
    );
  }

  // 3. Era audio config satisfies the brief.
  console.log('\n[2005 audio config]');
  assert(ERA_AUDIO_2005.era === 2005, 'audio config targets 2005');
  assert(
    ERA_AUDIO_2005.layers.length >= 2,
    'audio config has indie/acoustic + machine layers',
  );
  assert(
    ERA_AUDIO_2005.layers.some((layer) => layer.id === 'indie-bed'),
    'audio config includes the indie/acoustic-evocative bed layer',
  );
  assert(
    ERA_AUDIO_2005.layers.some((layer) => layer.id === 'ipod-dock'),
    'audio config includes the iPod dock character layer',
  );
  assert(
    ERA_AUDIO_2005.layers.some((layer) => layer.id === 'superauto-hiss'),
    'audio config includes the superautomatic hiss layer',
  );

  // 4. Anchor mounting: props sit at the canonical layout anchors.
  console.log('\n[2005 anchor mounting]');
  assert(
    Math.abs(ANCHORS.counter.position.x - (ROOM_BOUNDS.maxX - 0.2 - 0.45)) < 0.5,
    'counter anchor is along the east wall',
  );
  assert(ANCHORS.machineSlot.y > 1.0, 'machine slot is on the counter top');
  assert(ANCHORS.menuBoardWall.wall === 'back', 'menu board mounts on the back wall');
  assert(ANCHORS.posterWalls.length >= 4, 'poster walls provide four+ mounting points');
  assert(ANCHORS.seatingTables.length >= 4, 'seating tables provide four+ positions');
  assert(ROOM_WIDTH > 0 && ROOM_DEPTH > 0, 'room dimensions are sane');

  // 5. Era patrons: the shared roster mounts 3-4 period-styled patrons and
  // seats them at the anchors inside the room (era-scoped visibility).
  console.log('\n[2005 patrons]');
  const patronGroup = new THREE.Group();
  build2005Patrons(patronGroup, 2005);
  const patronConfigs = collectPatronConfigs(patronGroup);
  assert(
    patronConfigs.length >= 3 && patronConfigs.length <= 4,
    `roster mounts 3-4 patrons via PatronConfig (got ${patronConfigs.length})`,
  );
  assert(
    patronConfigs.some((config) => config.legStyle === 'bootcut'),
    'patrons include bootcut jeans',
  );
  assert(
    patronConfigs.some(
      (config) =>
        config.hair.kind === 'side-swept' || config.hair.kind === 'spiky',
    ),
    'patrons include side-swept bangs / spiky hair',
  );
  assert(
    patronConfigs.some(
      (config) =>
        config.accessory === 'flip-phone' ||
        config.accessory === 'ipod' ||
        config.accessory === 'laptop',
    ),
    'patrons include flip phones / early iPods / open laptops',
  );
  for (const config of patronConfigs) {
    assert(
      (config.hair.kind as string) !== 'beehive' &&
        (config.style ?? 'shirt-pants') !== 'jumpsuit' &&
        config.accessory !== 'cigarette',
      `patron "${config.name ?? 'anonymous'}" uses 2005 period styling`,
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
  // Era-scoped visibility: patrons live under the era's patrons fragment and
  // are discovered by the shared animation driver from the era root.
  const eraPatronGroup = eraGroup.getObjectByName('2005-patrons');
  assert(
    eraPatronGroup !== undefined && collectPatronConfigs(eraPatronGroup).length === patronConfigs.length,
    'patrons mount into the era-scoped 2005-patrons fragment group',
  );

  // 6. Descriptive era data carries 3-4 period patrons for the registry label.
  console.log('\n[2005 era data patrons]');
  assert(
    era2005.patrons.length >= 3 && era2005.patrons.length <= 4,
    `era2005.patrons describes 3-4 patrons (got ${era2005.patrons.length})`,
  );
  assert(
    era2005.patrons.some((p) => /bootcut/i.test(p.outfit)),
    'era data mentions bootcut jeans',
  );
  assert(
    era2005.patrons.some((p) => /side-swept|spiky/i.test(p.hairstyle)),
    'era data mentions side-swept/spiky hair',
  );
  assert(
    era2005.patrons.some((p) => /flip phone|iPod|open laptop/i.test(p.gadget)),
    'era data mentions flip phones / iPods / open laptops',
  );

  if (failures > 0) {
    console.error(`\n2005 composition check FAILED with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('\nAll 2005 composition assertions passed.');
  }
}

void run();
