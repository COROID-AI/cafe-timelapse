/**
 * QA gate: `npm run check:characters`
 *
 * Headless (no WebGL) verification of the Phase 5 shared character/patron
 * system:
 *   - CharacterAvatar builds a low-poly stylized figure (head, torso, arms,
 *     legs) from primitive geometry, parameterized by a PatronConfig;
 *   - merged geometry keeps the figure performant (fewer meshes than the
 *     number of primitives it is assembled from);
 *   - the shared idle/subtle-motion loop animates breathing, head turn and an
 *     occasional sip, driven from the main render loop;
 *   - placement helpers seat avatars at the architecture seating anchors
 *     (tables / counter stools);
 *   - CharacterRoster mounts the right set of avatars per era and removes
 *     others (mount → replace → dispose);
 *   - the per-era PatronConfig contract (src/data/EraData.ts) is the input
 *     consumed by the era patron tasks.
 *
 * Pure object-graph assertions only, so it runs in CI without a browser.
 * Exits non-zero on any failure.
 */
import * as THREE from 'three';
import type { PatronConfig } from '../data/EraData';
import {
  ANCHORS,
  ROOM_BOUNDS,
  ROOM_DEPTH,
  ROOM_WIDTH,
} from '../world/layout';
import {
  CharacterAvatar,
  CharacterRoster,
  AvatarMaterialCache,
  seatAtTable,
  seatAtCounter,
  counterStoolAnchors,
  updateCharacterAnimations,
} from '../world/characters';

function countMeshes(group: THREE.Object3D): number {
  let n = 0;
  group.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) n += 1;
  });
  return n;
}

function countAnimatedAvatars(root: THREE.Object3D): number {
  let n = 0;
  root.traverse((object) => {
    if ((object as THREE.Group).userData?.characterAvatar) n += 1;
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

  const config: PatronConfig = {
    name: 'beatnik',
    skin: '#C88B5A',
    hair: { kind: 'short', color: '#2A1E14' },
    shirt: '#1A1A1A',
    pants: '#3A322A',
    shoes: '#101010',
    style: 'shirt-pants',
    accessory: 'book',
  };

  // --- 1. CharacterAvatar builds a stylized figure from a PatronConfig ------
  console.log('\n[CharacterAvatar build]');
  const avatar = new CharacterAvatar({ config, posture: 'standing' });
  const avatarMeshes = countMeshes(avatar.root);
  assert(
    avatarMeshes >= 2 && avatarMeshes <= 5,
    `avatar stays low-poly: ${avatarMeshes} mesh(es) for a multi-primitive figure`,
  );
  assert(
    !!avatar.root.getObjectByName('avatar-head-mesh'),
    'head mesh exists (head + hair)',
  );
  assert(
    !!avatar.root.getObjectByName('avatar-arm-mesh'),
    'right arm mesh exists (arm + held gadget)',
  );
  assert(
    !!avatar.root.getObjectByName('avatar-static'),
    'merged static body mesh exists (legs/torso/left arm/shoes)',
  );

  // 1b. New 1965 accessory/hair shapes render headlessly.
  console.log('\n[1965 period accessory shapes]');
  const tieConfig: PatronConfig = {
    name: 'slim-suit-man',
    skin: '#C88B5A',
    hair: { kind: 'short', color: '#1A1A1A' },
    shirt: '#EFE3B6',
    pants: '#3A322A',
    shoes: '#101010',
    accent: '#8A1F2D',
    accessory: 'tie',
  };
  const tieAvatar = new CharacterAvatar({ config: tieConfig, posture: 'seated' });
  assert(
    countMeshes(tieAvatar.root) >= 2,
    'slim-tie patron builds its figure meshes',
  );
  const cigaretteConfig: PatronConfig = {
    name: 'smoker',
    skin: '#C88B5A',
    hair: { kind: 'bouffant', color: '#2A1E14' },
    shirt: '#2F6B4F',
    pants: '#EFE3B6',
    shoes: '#101010',
    accessory: 'cigarette',
  };
  const cigaretteAvatar = new CharacterAvatar({ config: cigaretteConfig, posture: 'seated' });
  assert(
    countMeshes(cigaretteAvatar.root) >= 2,
    'bouffant + cigarette patron builds its figure meshes',
  );

  // 2. Parameterization: changing config changes materials/shape.
  console.log('\n[PatronConfig parameterization]');
  const dressConfig: PatronConfig = {
    name: 'mod-woman',
    skin: '#C88B5A',
    hair: { kind: 'beehive', color: '#EFE3B6' },
    shirt: '#D94F8F',
    pants: '#EFE3B6',
    shoes: '#101010',
    style: 'dress',
    accessory: 'mirror',
  };
  const cache = new AvatarMaterialCache();
  const first = cache.get(config);
  const second = cache.get(dressConfig);
  assert(first.shirt !== second.shirt, 'material cache distinguishes shirt colours');
  assert(
    first.skin === second.skin,
    'material cache reuses shared surfaces (skin)',
  );
  assert(
    cache.size >= 3 && cache.size < 12,
    `material cache stays bounded with sharing (${cache.size} of 12 possible materials)`,
  );

  // 3. Idle/subtle-motion animation loop.
  console.log('\n[idle animation loop]');
  const headTurnBefore = avatar.headTurn;
  const breathBefore = avatar.breathScale;
  avatar.update(0.016, 1.0);
  avatar.update(0.016, 1.6);
  assert(
    avatar.headTurn !== headTurnBefore,
    'head turn animates over time',
  );
  assert(
    Math.abs(avatar.breathScale - breathBefore) > 0.0001,
    'breathing scale animates over time',
  );

  const sipper: PatronConfig = {
    name: 'sipper',
    skin: '#C88B5A',
    hair: { kind: 'short', color: '#2A1E14' },
    shirt: '#EFE3B6',
    pants: '#3A322A',
    shoes: '#101010',
    accessory: 'cup',
  };
  const sipperAvatar = new CharacterAvatar({ config: sipper, posture: 'seated', sipDelay: 0 });
  assert(sipperAvatar.armRaise >= -3, 'sip arm starts relaxed');
  // Advance well past the sip window, tracking the peak arm raise so the
  // completed cycle (which resets the arm) does not hide the motion.
  let peakRaise = 0;
  for (let i = 0; i < 200; i += 1) {
    sipperAvatar.update(0.016, i * 0.016);
    peakRaise = Math.max(peakRaise, Math.abs(sipperAvatar.armRaise));
  }
  assert(
    peakRaise > 0.05,
    'occasional sip raises the right arm',
  );
  assert(
    sipperAvatar.posture === 'seated',
    'seated posture is honored',
  );

  // 4. Placement helpers seat avatars at the seating anchors.
  console.log('\n[placement helpers]');
  const placed = new CharacterAvatar({ config, posture: 'seated' });
  const tableAnchor = ANCHORS.seatingTables[0];
  seatAtTable(placed, tableAnchor, { side: 'south', index: 0 });
  assert(
    Math.abs(placed.root.position.x - tableAnchor.x) < 1.5 &&
      Math.abs(placed.root.position.z - (tableAnchor.z + 0.72)) < 0.02,
    'seatAtTable places the avatar beside the table anchor',
  );

  const stoolAnchor = counterStoolAnchors([-3.0])[0];
  seatAtCounter(placed, stoolAnchor);
  assert(
    Math.abs(placed.root.position.x - (stoolAnchor.x - 0.1)) < 0.02 &&
      Math.abs(placed.root.position.z - stoolAnchor.z) < 0.02,
    'seatAtCounter places the avatar at the counter stool anchor',
  );

  // 5. CharacterRoster mounts per-era avatars and removes others.
  console.log('\n[CharacterRoster]');
  const parent = new THREE.Group();
  const roster = new CharacterRoster({
    parent,
    tables: ANCHORS.seatingTables,
    stools: counterStoolAnchors([-3.0, -1.8]),
  });
  roster.mount(1965, [config, dressConfig, sipper]);
  assert(roster.size === 3, 'roster mounts 3 avatars');
  assert(
    countAnimatedAvatars(parent) === 3,
    'mounted avatars are discoverable by the shared animation driver',
  );
  // Table seats use the table posture; extra patrons fall to stools.
  assert(
    parent.children.length === 1 && parent.children[0].children.length === 3,
    'roster roots avatars under a single group',
  );
  const secondEra: PatronConfig[] = [
    {
      name: 'laptop-nomad',
      skin: '#C88B5A',
      hair: { kind: 'curls', color: '#3A2418' },
      shirt: '#C9B9A6',
      pants: '#2E2A26',
      shoes: '#1C1410',
      accessory: 'laptop',
    },
  ];
  roster.mount(2025, secondEra);
  assert(roster.size === 1, 'roster removes previous era avatars on remount');
  assert(
    countAnimatedAvatars(parent) === 1,
    'only the mounted era avatars remain animated',
  );
  roster.clear();
  assert(roster.size === 0, 'roster clear removes every avatar');

  // 6. Shared animation driver walks the scene once per frame.
  console.log('\n[shared animation driver]');
  const scene = new THREE.Group();
  scene.add(parent);
  const driverRoster = new CharacterRoster({
    parent,
    tables: ANCHORS.seatingTables,
    stools: [],
  });
  driverRoster.mount(1965, [config, dressConfig]);
  const firstAvatar = driverRoster.root.children[0] as THREE.Group;
  const h1 = firstAvatar.userData?.characterAvatar as CharacterAvatar;
  const before = h1.headTurn;
  updateCharacterAnimations(scene, 0.016, 2.0);
  const after = h1.headTurn;
  assert(
    Math.abs(after - before) > 1e-6,
    'updateCharacterAnimations drives mounted avatars from the scene root',
  );

  // 7. Anchor mounting: the roster seats figures inside the room bounds.
  console.log('\n[anchor mounting]');
  assert(
    ANCHORS.seatingTables.length >= 4,
    'seating tables provide four+ positions',
  );
  assert(
    ROOM_WIDTH > 0 && ROOM_DEPTH > 0,
    'room dimensions are sane',
  );
  const bounds = ROOM_BOUNDS;
  for (const child of driverRoster.root.children) {
    const pos = (child as THREE.Group).position;
    assert(
      pos.x >= bounds.minX && pos.x <= bounds.maxX &&
        pos.z >= bounds.minZ && pos.z <= bounds.maxZ,
      `avatar (${pos.x.toFixed(2)}, ${pos.z.toFixed(2)}) is inside the room`,
    );
  }

  if (failures > 0) {
    console.error(`\nCharacter system check FAILED with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('\nAll character system assertions passed.');
  }
}

void run();
