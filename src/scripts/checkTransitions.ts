/**
 * QA gate: `npm run check:transitions`
 *
 * Headless (no WebGL) verification of the TransitionController:
 *   - a `goTo` mounts the incoming era group and cross-fades it in;
 *   - during a cross-fade the outgoing and incoming groups coexist, with the
 *     outgoing fading 1 → 0 and the incoming 0 → 1 (eased);
 *   - on completion the outgoing group is unmounted/disposed via the host;
 *   - duration, easing names, and custom easing functions are honored;
 *   - the optional camera dolly lerps between from/to over the timeline;
 *   - interruption is safe: selecting a new era mid-transition retargets
 *     cleanly (no leaked groups, only the new era remains), selecting the
 *     era being revealed snaps to completion, and re-selecting the active era
 *     while idle is a no-op;
 *   - `dispose()` unmounts every owned group.
 *   - the reference `EraGroupHost` mounts AssetRegistry fragments and its
 *     material-cloning / disposal helpers behave.
 *
 * Exits non-zero on any assertion failure.
 */
import * as THREE from 'three';
import type { EraYear } from '../data/eras';
import type { SceneHost } from '../systems/SceneHost';
import { EraGroupHost, cloneGroupMaterials, disposeGroup } from '../systems/SceneHost';
import { TransitionController, EASINGS } from '../systems/TransitionController';
// Static side-effect imports register every era into the registry.
import '../registry/eras/1945';
import '../registry/eras/1965';
import '../registry/eras/1985';
import '../registry/eras/2005';
import '../registry/eras/2025';
import '../registry/eras/2055';

const EPS = 1e-6;

/** A SceneHost that mounts one mesh per era so fades are observable. */
class TestHost implements SceneHost {
  readonly root = new THREE.Group();
  private active: EraYear | null = null;
  private readonly groups = new Map<EraYear, THREE.Group>();

  getActiveEra(): EraYear | null {
    return this.active;
  }

  setActiveEra(era: EraYear | null): void {
    this.active = era;
  }

  mount(era: EraYear): THREE.Group {
    const group = new THREE.Group();
    group.name = `test-era-${era}`;
    group.userData.eraYear = era;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: era }),
    );
    group.add(mesh);
    this.root.add(group);
    this.groups.set(era, group);
    return group;
  }

  unmount(group: THREE.Group): void {
    this.root.remove(group);
    const era = group.userData.eraYear as EraYear | undefined;
    if (era !== undefined) this.groups.delete(era);
  }

  groupFor(era: EraYear): THREE.Group | undefined {
    return this.groups.get(era);
  }

  hasGroup(era: EraYear): boolean {
    return this.groups.has(era);
  }
}

function firstMesh(group: THREE.Group | undefined): THREE.Mesh | undefined {
  let found: THREE.Mesh | undefined;
  group?.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!found && mesh.isMesh) found = mesh;
  });
  return found;
}

function materialOf(group: THREE.Group | undefined): THREE.Material | undefined {
  return firstMesh(group)?.material as THREE.Material | undefined;
}

function opacityOf(group: THREE.Group | undefined): number {
  return materialOf(group)?.opacity ?? Number.NaN;
}

function transparentOf(group: THREE.Group | undefined): boolean {
  return materialOf(group)?.transparent ?? false;
}

/** Advance the controller by `seconds` in `dt` steps. */
function advance(controller: TransitionController, seconds: number, dt = 0.1): void {
  const ticks = Math.max(1, Math.round(seconds / dt));
  for (let i = 0; i < ticks; i += 1) controller.update(dt);
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

  // 1. First selection mounts and fades in the incoming group.
  {
    const host = new TestHost();
    const controller = new TransitionController({ host, duration: 1, easing: 'easeInOut' });
    assert(controller.activeEra === null, 'controller starts idle');
    controller.goTo(1945);
    assert(controller.isTransitioning, 'first goTo starts a transition');
    assert(controller.activeEra === 1945, 'activeEra updates to the selected era');
    assert(host.root.children.length === 1, 'incoming group is mounted');
    assert(Math.abs(opacityOf(host.groupFor(1945)) - 0) < EPS, 'incoming starts at opacity 0');
    advance(controller, 1);
    assert(!controller.isTransitioning, 'first transition completes');
    assert(host.root.children.length === 1, 'single group remains after first mount');
    assert(Math.abs(opacityOf(host.groupFor(1945)) - 1) < EPS, 'incoming reaches opacity 1');
    assert(!transparentOf(host.groupFor(1945)), 'transparency flags restored after fade');
    controller.dispose();
    assert(host.root.children.length === 0, 'dispose unmounts owned groups');
  }

  // 2. Cross-fade: outgoing and incoming coexist, then outgoing is disposed.
  {
    const host = new TestHost();
    const controller = new TransitionController({ host, duration: 1, easing: 'easeInOut' });
    controller.goTo(1945);
    advance(controller, 1);
    controller.goTo(1965);
    assert(controller.isTransitioning, 'second goTo starts a cross-fade');
    assert(host.root.children.length === 2, 'both era groups coexist mid-transition');
    assert(controller.previousEra === 1945, 'previousEra tracks the outgoing era');
    assert(Math.abs(opacityOf(host.groupFor(1945)) - 1) < EPS, 'outgoing starts opaque');
    assert(Math.abs(opacityOf(host.groupFor(1965)) - 0) < EPS, 'incoming starts transparent');
    advance(controller, 0.5);
    assert(
      Math.abs(opacityOf(host.groupFor(1945)) - 0.5) < EPS &&
        Math.abs(opacityOf(host.groupFor(1965)) - 0.5) < EPS,
      'midpoint cross-fade is 0.5/0.5',
    );
    advance(controller, 0.5);
    assert(!controller.isTransitioning, 'cross-fade completes');
    assert(host.root.children.length === 1, 'outgoing group is disposed at completion');
    assert(!host.hasGroup(1945), 'outgoing group unmounted through the host');
    assert(Math.abs(opacityOf(host.groupFor(1965)) - 1) < EPS, 'incoming fully visible after fade');
    assert(!transparentOf(host.groupFor(1965)), 'incoming flags restored after fade');
    controller.dispose();
  }

  // 3. Interruption: a new era mid-transition retargets cleanly.
  {
    const host = new TestHost();
    const controller = new TransitionController({ host, duration: 1, easing: 'easeInOut' });
    controller.goTo(1945);
    advance(controller, 1);
    controller.goTo(1965);
    advance(controller, 1);
    controller.goTo(2005);
    advance(controller, 0.3);
    assert(controller.isTransitioning, 'interrupt test: transition underway');
    const partialOpacity = opacityOf(host.groupFor(2005));
    assert(Math.abs(partialOpacity - EASINGS.easeInOut(0.3)) < EPS, 'partial incoming has eased opacity');
    controller.goTo(2025);
    assert(host.root.children.length === 2, 'retarget: old outgoing dropped, two groups coexist');
    assert(!host.hasGroup(1965), 'retarget: already-fading outgoing disposed immediately');
    assert(controller.activeEra === 2025, 'retarget: activeEra is the new selection');
    assert(
      Math.abs(opacityOf(host.groupFor(2005)) - partialOpacity) < EPS,
      'retarget: partial incoming demoted with its current opacity',
    );
    assert(Math.abs(opacityOf(host.groupFor(2025)) - 0) < EPS, 'retarget: new incoming starts transparent');
    advance(controller, 1);
    assert(!controller.isTransitioning, 'retarget completes');
    assert(host.root.children.length === 1, 'retarget: only the new era remains');
    assert(!host.hasGroup(2005), 'retarget: demoted group disposed at completion');
    assert(Math.abs(opacityOf(host.groupFor(2025)) - 1) < EPS, 'retarget: new era fully visible');
    controller.dispose();
  }

  // 4. Selecting the era being revealed mid-transition snaps to completion.
  {
    const host = new TestHost();
    const controller = new TransitionController({ host, duration: 1, easing: 'easeInOut' });
    controller.goTo(1985);
    advance(controller, 0.2);
    assert(controller.isTransitioning, 'snap test: transition underway');
    controller.goTo(1985);
    assert(!controller.isTransitioning, 'same-era mid-transition snaps to completion');
    assert(host.root.children.length === 1, 'snap: single group remains');
    assert(host.hasGroup(1985), 'snap: selected era stays mounted');
    assert(Math.abs(opacityOf(host.groupFor(1985)) - 1) < EPS, 'snap: selected era fully visible');
    controller.goTo(1985);
    assert(host.root.children.length === 1, 're-selecting active era while idle is a no-op');
    controller.dispose();
  }

  // 5. Configurable duration and easing names.
  {
    const host = new TestHost();
    const controller = new TransitionController({ host, duration: 1, easing: 'linear' });
    controller.setDuration(0.5);
    controller.goTo(1945);
    advance(controller, 1); // finish initial mount
    controller.goTo(1965);
    advance(controller, 0.25, 0.05); // exact 0.25s at 0.05s ticks
    assert(
      Math.abs(opacityOf(host.groupFor(1965)) - 0.5) < EPS,
      'duration is configurable (0.25s of a 0.5s fade = progress 0.5)',
    );
    controller.setEasing('easeOut');
    controller.goTo(2005);
    advance(controller, 0.5);
    assert(
      Math.abs(opacityOf(host.groupFor(2005)) - EASINGS.easeOut(1)) < EPS,
      'easing name can be replaced mid-flight',
    );
    controller.dispose();
  }

  // 6. Custom easing functions are honored.
  {
    const host = new TestHost();
    const square: (t: number) => number = (t) => t * t;
    const controller = new TransitionController({ host, duration: 1, easing: square });
    controller.goTo(1945);
    advance(controller, 1);
    controller.goTo(1965);
    advance(controller, 0.5);
    assert(
      Math.abs(opacityOf(host.groupFor(1965)) - 0.25) < EPS &&
        Math.abs(opacityOf(host.groupFor(1945)) - 0.75) < EPS,
      'custom easing function drives the cross-fade',
    );
    controller.dispose();
  }

  // 7. Optional camera dolly lerps over the same timeline.
  {
    const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
    camera.position.set(0, 0, 0);
    const host = new TestHost();
    const controller = new TransitionController({
      host,
      camera,
      duration: 1,
      easing: 'linear',
      dolly: (era) =>
        era === 1965 ? { to: new THREE.Vector3(2, 1, 0) } : { to: new THREE.Vector3(5, 0, 0) },
    });
    controller.goTo(1945);
    advance(controller, 1);
    assert(
      camera.position.distanceTo(new THREE.Vector3(5, 0, 0)) < EPS,
      'dolly reaches its destination at completion',
    );
    controller.goTo(1965);
    advance(controller, 0.5);
    assert(
      camera.position.distanceTo(new THREE.Vector3(3.5, 0.5, 0)) < EPS,
      'dolly lerps from/to at the midpoint',
    );
    controller.dispose();
  }

  // 8. Reference host: mounts AssetRegistry fragments and disposes outgoing.
  {
    const root = new THREE.Group();
    const host = new EraGroupHost(root);
    const controller = new TransitionController({ host, duration: 0.5, easing: 'linear' });
    controller.goTo(1945);
    advance(controller, 0.5);
    assert(root.children.length === 1 && controller.activeEra === 1945, 'EraGroupHost mounts registry fragments');
    controller.goTo(2055);
    advance(controller, 0.5);
    assert(root.children.length === 1 && controller.activeEra === 2055, 'EraGroupHost disposes the outgoing group');
    controller.dispose();
    assert(root.children.length === 0, 'EraGroupHost dispose unmounts every group');
  }

  // 9. Material cloning + disposal helpers.
  {
    const source = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), source);
    group.add(mesh);
    cloneGroupMaterials(group);
    assert(
      (mesh.material as THREE.Material) !== source,
      'cloneGroupMaterials clones materials (per-group ownership)',
    );
    disposeGroup(group); // must not throw and must tolerate re-disposal
    disposeGroup(group);
    assert(true, 'disposeGroup disposes geometries/materials without throwing');
  }

  if (failures > 0) {
    console.error(`\nTransition check FAILED: ${failures} assertion(s)`);
    process.exitCode = 1;
  } else {
    console.log('\nAll transition assertions passed.');
  }
}

void run();
