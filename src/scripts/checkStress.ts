/**
 * QA gate: `npm run check:stress`
 *
 * Headless (no WebGL) stress + resource-leak verification of the era-switch
 * pipeline (Phase 8 final QA):
 *   - performs 24+ era switches through the real TransitionController +
 *     EraGroupHost path — the exact mount / cross-fade / unmount pipeline the
 *     app drives from the timeline slider — including mid-transition
 *     retargets to simulate aggressive slider use;
 *   - asserts mount discipline: at most two era groups coexist mid-fade,
 *     exactly one era group remains after each transition completes, and zero
 *     groups remain after `controller.dispose()`;
 *   - instruments `THREE.BufferGeometry.prototype.dispose` and
 *     `THREE.Material.prototype.dispose` so every disposal is recorded, then
 *     asserts that every geometry and material observed across all mounted
 *     era groups was disposed by the end (no resource leaks across 20+ era
 *     switches);
 *   - asserts live-footprint stability: remounting the same era produces the
 *     same live mesh count every cycle.
 *
 * Pure object-graph work (no WebGL), so it runs in CI without a browser.
 * Exits non-zero on any assertion failure.
 */
import * as THREE from 'three';
import { ERAS, type EraYear } from '../data/eras';
import { registerAllEras } from '../registry';
import { EraGroupHost } from '../systems/SceneHost';
import { TransitionController } from '../systems/TransitionController';

function countMeshes(group: THREE.Object3D): number {
  let n = 0;
  group.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) n += 1;
  });
  return n;
}

/** Record every geometry/material reachable from a mounted era group. */
function observeGroup(
  group: THREE.Object3D,
  seenGeometries: Set<THREE.BufferGeometry>,
  seenMaterials: Set<THREE.Material>,
): void {
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.geometry) seenGeometries.add(mesh.geometry);
    const material = mesh.material;
    if (Array.isArray(material)) {
      for (const m of material) seenMaterials.add(m);
    } else if (material) {
      seenMaterials.add(material);
    }
  });
}

function observeRoot(
  root: THREE.Group,
  seenGeometries: Set<THREE.BufferGeometry>,
  seenMaterials: Set<THREE.Material>,
): void {
  for (const child of root.children) {
    observeGroup(child, seenGeometries, seenMaterials);
  }
}

async function run(): Promise<void> {
  let failures = 0;
  const assert = (condition: boolean, message: string): void => {
    if (!condition) {
      failures += 1;
      console.error(`  FAIL: ${message}`);
    } else {
      console.log(`  ok: ${message}`);
    }
  };

  // --- Dispose instrumentation ------------------------------------------------
  // three's dispose() only dispatches an event; wrap the prototypes so every
  // disposal is recorded and we can prove nothing was left undisposed.
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  const disposedMaterials = new Set<THREE.Material>();
  const originalGeometryDispose = THREE.BufferGeometry.prototype.dispose;
  const originalMaterialDispose = THREE.Material.prototype.dispose;
  THREE.BufferGeometry.prototype.dispose = function (this: THREE.BufferGeometry): void {
    disposedGeometries.add(this);
    originalGeometryDispose.call(this);
  };
  THREE.Material.prototype.dispose = function (this: THREE.Material): void {
    disposedMaterials.add(this);
    originalMaterialDispose.call(this);
  };

  await registerAllEras();

  const root = new THREE.Group();
  const host = new EraGroupHost(root, { cloneMaterials: true });
  const controller = new TransitionController({
    host,
    duration: 0.05,
    easing: 'linear',
  });

  const seenGeometries = new Set<THREE.BufferGeometry>();
  const seenMaterials = new Set<THREE.Material>();

  // --- 1. 24+ era switches through the real controller/host path --------------
  console.log('\n[era-switch stress]');
  const CYCLES = 4; // 6 eras × 4 cycles = 24 switches (≥ 20 required)
  const sequence: EraYear[] = [];
  for (let cycle = 0; cycle < CYCLES; cycle += 1) {
    for (const era of ERAS) sequence.push(era);
  }

  let transitionCount = 0;
  const meshCounts = new Map<number, number>();

  for (const era of sequence) {
    controller.goTo(era);
    assert(
      root.children.length <= 2,
      `switch to ${era}: at most two era groups coexist mid-fade (got ${root.children.length})`,
    );
    observeRoot(root, seenGeometries, seenMaterials);
    controller.update(0.1);
    assert(!controller.isTransitioning, `switch to ${era} completes`);
    assert(root.children.length === 1, `switch to ${era}: exactly one era group remains (got ${root.children.length})`);
    assert(
      (root.children[0] as THREE.Group).name === `era-${era}`,
      `switch to ${era}: the mounted group is era-${era}`,
    );
    const meshes = countMeshes(root);
    const previous = meshCounts.get(era);
    if (previous === undefined) {
      meshCounts.set(era, meshes);
    } else {
      assert(
        meshes === previous,
        `era ${era} live footprint stable across cycles (${meshes} == ${previous} meshes)`,
      );
    }
    transitionCount += 1;
  }
  assert(
    transitionCount >= 20,
    `performed ${transitionCount} era switches (≥ 20 required)`,
  );

  // --- 2. Mid-transition retarget (aggressive slider use) ----------------------
  console.log('\n[mid-transition retarget]');
  controller.goTo(1945);
  assert(controller.isTransitioning, 'retarget: transition underway');
  controller.update(0.03);
  assert(
    root.children.length <= 2,
    'retarget: at most two groups coexist mid-fade',
  );
  controller.goTo(2055);
  assert(
    root.children.length <= 2,
    'retarget: dropping the old outgoing keeps at most two groups',
  );
  observeRoot(root, seenGeometries, seenMaterials);
  controller.update(0.1);
  assert(!controller.isTransitioning, 'retarget completes');
  assert(root.children.length === 1, 'retarget: exactly one era group remains');
  assert(
    (root.children[0] as THREE.Group).name === 'era-2055',
    'retarget: the newly selected era is mounted',
  );
  transitionCount += 1;

  // --- 3. Dispose unmounts every owned group -----------------------------------
  controller.dispose();
  assert(root.children.length === 0, 'controller.dispose unmounts every era group');

  // --- 4. No resource leaks -----------------------------------------------------
  console.log('\n[resource leaks]');
  let leakedGeometries = 0;
  for (const geometry of seenGeometries) {
    if (!disposedGeometries.has(geometry)) leakedGeometries += 1;
  }
  assert(
    leakedGeometries === 0,
    `every observed geometry disposed (${seenGeometries.size} created, ${leakedGeometries} leaked)`,
  );
  let leakedMaterials = 0;
  for (const material of seenMaterials) {
    if (!disposedMaterials.has(material)) leakedMaterials += 1;
  }
  assert(
    leakedMaterials === 0,
    `every observed material disposed (${seenMaterials.size} created, ${leakedMaterials} leaked)`,
  );

  if (failures > 0) {
    console.error(`\nStress check FAILED: ${failures} assertion(s)`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll stress assertions passed (${transitionCount} era switches, no resource leaks).`);
  }
}

void run();
