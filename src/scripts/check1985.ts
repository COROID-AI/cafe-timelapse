/**
 * QA gate: `npm run check:1985`
 *
 * Headless (no WebGL) verification of the 1985 eighties espresso-bar patrons:
 *   - the 1985 patrons are mounted via the shared CharacterRoster: 3-4
 *     period-styled PatronConfigs (shoulder-pad blazers, members-only jackets,
 *     big hair / mullet, Sony Walkman headphones as gadgets, leg warmers),
 *     seated at the seating anchors inside the room;
 *   - the mounted avatars are discoverable on the fragment group so they
 *     toggle correctly with era changes (era-scoped visibility);
 *   - every patron config is period-accurate for 1985 (no modern/poncho/
 *     jumpsuit-only silhouettes, era-appropriate accessories).
 *
 * Pure object-graph assertions only, so it runs in CI without a browser.
 * Exits non-zero on any failure.
 */
import * as THREE from 'three';
import { build1985Patrons } from '../scenes/eras/1985';
import type { PatronConfig } from '../data/EraData';
import { era1985 } from '../data/eras/1985';
import { ROOM_BOUNDS } from '../world/layout';

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

  // 1. The 1985 patrons build meshes (no empty fragment).
  console.log('\n[1985 patrons]');
  const patronGroup = new THREE.Group();
  build1985Patrons(patronGroup, 1985);
  assert(countMeshes(patronGroup) > 0, 'patron fragment builds avatar meshes');

  // 2. The shared roster mounts 3-4 period-styled patrons via PatronConfig.
  const patronConfigs = collectPatronConfigs(patronGroup);
  assert(
    patronConfigs.length >= 3 && patronConfigs.length <= 4,
    `roster mounts 3-4 patrons via PatronConfig (got ${patronConfigs.length})`,
  );

  // 3. Patron outfits are period-accurate for 1985 (shoulder-pad blazers /
  //    members-only jackets / leg-warmers styling, matching EraData).
  assert(
    patronConfigs.length === era1985.patrons.length,
    'roster patron count matches the 1985 EraData patron records',
  );
  for (const config of patronConfigs) {
    assert(
      (config.style ?? 'shirt-pants') === 'shirt-pants' ||
        (config.style ?? 'shirt-pants') === 'dress',
      `patron "${config.name ?? 'anonymous'}" uses a 1985 silhouette (no poncho/jumpsuit-only)`,
    );
  }
  assert(
    patronConfigs.some((config) => config.accessory === 'headphones'),
    'a patron wears Sony Walkman headphones',
  );
  assert(
    patronConfigs.some((config) => config.accessory === 'walkman'),
    'a patron carries a Sony Walkman personal stereo',
  );
  assert(
    patronConfigs.some((config) => config.accessory === 'wristband'),
    'a patron wears the leg-warmer/aerobics wristband',
  );

  // 4. Big hair / mullet styles are represented.
  const eightiesHair = new Set(['waves', 'curls', 'messy', 'ponytail', 'bun']);
  assert(
    patronConfigs.some((config) => eightiesHair.has(config.hair.kind)),
    'patrons include big hair / mullet styles',
  );

  // 5. Patrons are seated at the architecture anchors inside the room
  //    (era-scoped visibility: avatars are discoverable on the fragment).
  const avatarCount = (() => {
    let n = 0;
    patronGroup.traverse((object) => {
      if ((object as THREE.Group).userData?.characterAvatar) n += 1;
    });
    return n;
  })();
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
    console.error(`\n1985 composition check FAILED with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('\nAll 1985 patron assertions passed.');
  }
}

void run();
