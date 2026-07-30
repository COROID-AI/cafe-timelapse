/**
 * TransitionController.test.ts — verifies the cross-fade transition behaviour.
 *
 * Drives the animation manually via `update(now)` (autoUpdate: false) for
 * deterministic, frame-independent assertions. Material references are captured
 * from the `onTransitionStart` info so they always match the exact groups the
 * controller animates.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { Group, type Mesh, type Material } from 'three';
import {
  SceneManager,
  resetSceneManager,
  type EraTransitionInfo,
} from './SceneManager.js';
import {
  TransitionController,
  easeInOutCubic,
} from './TransitionController.js';
import { registerEraFragments } from '../registry/eraFragments.js';
import type { EraYear } from '../data/EraData.js';

/** Register stub fragments once so the AssetRegistry is populated for all eras. */
beforeAll(() => {
  registerEraFragments();
});

/** Collect every distinct material in an Object3D tree. */
function materialsOf(group: Group | Mesh | null | undefined): Material[] {
  if (!group) return [];
  const seen = new Set<Material>();
  const out: Material[] = [];
  group.traverse((child) => {
    const node = child as unknown as { material?: Material | Material[] };
    const material = node.material;
    if (Array.isArray(material)) {
      for (const m of material) {
        if (!seen.has(m)) {
          seen.add(m);
          out.push(m);
        }
      }
    } else if (material && !seen.has(material)) {
      seen.add(material);
      out.push(material);
    }
  });
  return out;
}

/**
 * Build an isolated SceneManager + TransitionController pair for a test.
 * The controller exposes its in-flight `transitionInfo` so tests can read the
 * exact groups/materials it animates.
 */
function setup(
  startEra: EraYear = 1945,
  controllerOptions: ConstructorParameters<typeof TransitionController>[1] = {},
): { manager: SceneManager; controller: TransitionController } {
  resetSceneManager();
  const manager = new SceneManager();
  const controller = new TransitionController(manager, {
    autoUpdate: false,
    duration: 1000,
    ...controllerOptions,
  });
  // Mount the starting era (first-mount fade: outgoing is null).
  manager.setActiveEra(startEra);
  // Settle the first-mount fade so we start from a clean, opaque baseline.
  controller.update(performance.now() + 10_000);
  return { manager, controller };
}

describe('TransitionController', () => {
  // -------------------------------------------------------------------------
  // AC: Era change triggers an animated cross-fade of configurable duration
  // -------------------------------------------------------------------------

  it('cross-fades incoming opacity 0 → base and outgoing base → 0 over the duration', () => {
    const { manager, controller } = setup(1945, { scaleAmount: 0, cameraDolly: 0 });

    manager.setActiveEra(1965);
    const info = controller.transitionInfo!;

    // Read materials from the exact groups the controller captured.
    const incomingMats = materialsOf(info.toGroup as unknown as Group);
    const outgoingMats = materialsOf(info.fromGroup as unknown as Group);
    const incomingMat = incomingMats[0];
    const outgoingMat = outgoingMats[0];
    const t0 = performance.now();

    // At start: incoming is pre-zeroed, outgoing still at base.
    expect(incomingMat.opacity).toBeCloseTo(0, 6);
    expect(outgoingMat.opacity).toBeCloseTo(1, 6);

    // Midway: both partially faded.
    controller.update(t0 + 500);
    expect(incomingMat.opacity).toBeGreaterThan(0);
    expect(incomingMat.opacity).toBeLessThan(1);
    expect(outgoingMat.opacity).toBeGreaterThan(0);
    expect(outgoingMat.opacity).toBeLessThan(1);

    // End: incoming restored to base, outgoing faded to 0.
    controller.update(t0 + 1001);
    expect(incomingMat.opacity).toBeCloseTo(1, 6);
    expect(outgoingMat.opacity).toBeCloseTo(0, 6);
  });

  it('respects a configurable duration', () => {
    const { manager, controller } = setup(1945, {
      duration: 2000,
      scaleAmount: 0,
      cameraDolly: 0,
    });

    manager.setActiveEra(1965);
    const mat = materialsOf(controller.transitionInfo!.toGroup as unknown as Group)[0];
    const t0 = performance.now();

    // At 1000ms with a 2000ms duration we should be at the eased midpoint,
    // NOT complete. easeInOutCubic(0.5) = 0.5 exactly.
    controller.update(t0 + 1000);
    expect(mat.opacity).toBeCloseTo(0.5, 1);
    expect(controller.isActive).toBe(true);

    // Completes only at the full 2000ms.
    controller.update(t0 + 2001);
    expect(controller.isActive).toBe(false);
  });

  it('applies the easing curve (non-linear midpoint)', () => {
    const { manager, controller } = setup(1945, {
      duration: 1000,
      scaleAmount: 0,
      cameraDolly: 0,
    });

    manager.setActiveEra(1965);
    const mat = materialsOf(controller.transitionInfo!.toGroup as unknown as Group)[0];
    const t0 = performance.now();

    // easeInOutCubic(0.25) = 4 * 0.25^3 = 0.0625 — well below linear 0.25.
    controller.update(t0 + 250);
    expect(mat.opacity).toBeCloseTo(easeInOutCubic(0.25), 2);
  });

  // -------------------------------------------------------------------------
  // AC: Both old and new era groups coexist during transition, then old disposed
  // -------------------------------------------------------------------------

  it('keeps both groups mounted during the transition', () => {
    const { manager, controller } = setup(1945);

    manager.setActiveEra(1965);
    controller.update(performance.now() + 500);

    // Both the outgoing (1945) and incoming (1965) groups are in the scene.
    expect(manager.isEraMounted(1945)).toBe(true);
    expect(manager.isEraMounted(1965)).toBe(true);
  });

  it('disposes the outgoing group after the transition completes', () => {
    const { manager, controller } = setup(1945);

    manager.setActiveEra(1965);
    const outgoingGroup = controller.transitionInfo!.fromGroup!;
    const outgoingMat = materialsOf(outgoingGroup as unknown as Group)[0];
    const disposeSpy = vi.spyOn(outgoingMat, 'dispose');

    controller.update(performance.now() + 10_000); // finish

    // The outgoing group is removed from the scene graph.
    expect(outgoingGroup.parent).toBeNull();
    // Its material was disposed.
    expect(disposeSpy).toHaveBeenCalled();
    // Only the incoming era remains mounted.
    expect(manager.isEraMounted(1945)).toBe(false);
    expect(manager.isEraMounted(1965)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // AC: Selecting a new era mid-transition resolves without artifacts/leaks
  // -------------------------------------------------------------------------

  it('resolves cleanly when interrupted mid-transition (no leaked groups)', () => {
    const { manager, controller } = setup(1945);

    manager.setActiveEra(1965); // 1945 → 1965 starts
    controller.update(performance.now() + 400); // interrupted 40% in

    // The 1945 group is still mounted mid-transition.
    expect(manager.isEraMounted(1945)).toBe(true);

    // Interrupt: switch to 1985 while 1945→1965 is still animating.
    manager.setActiveEra(1985);
    const settleTime = performance.now() + 10_000;

    // After interruption the original outgoing (1945) is disposed by the
    // manager's finalizePendingTransition; only 1965 and 1985 coexist.
    expect(manager.isEraMounted(1945)).toBe(false);
    expect(manager.isEraMounted(1965)).toBe(true);
    expect(manager.isEraMounted(1985)).toBe(true);
    expect(manager.currentEra).toBe(1985);

    // Finish the new transition.
    controller.update(settleTime);

    // Only 1985 survives — no leaked groups.
    expect(manager.isEraMounted(1945)).toBe(false);
    expect(manager.isEraMounted(1965)).toBe(false);
    expect(manager.isEraMounted(1985)).toBe(true);
  });

  it('does not leak a controller reference or throw when interrupted twice rapidly', () => {
    const { manager, controller } = setup(1945);

    manager.setActiveEra(1965);
    manager.setActiveEra(1985); // immediate interruption
    manager.setActiveEra(2005); // double interruption

    controller.update(performance.now() + 10_000);

    expect(manager.currentEra).toBe(2005);
    expect(manager.isEraMounted(1945)).toBe(false);
    expect(manager.isEraMounted(1965)).toBe(false);
    expect(manager.isEraMounted(1985)).toBe(false);
    expect(manager.isEraMounted(2005)).toBe(true);
    expect(controller.isActive).toBe(false);
  });

  // -------------------------------------------------------------------------
  // AC: Transitions feel polished (fade + slight scale + camera move)
  // -------------------------------------------------------------------------

  it('applies a scale morph to the groups', () => {
    const { manager, controller } = setup(1945, { scaleAmount: 0.1 });

    manager.setActiveEra(1965);
    const info = controller.transitionInfo!;
    const incomingGroup = info.toGroup;
    const outgoingGroup = info.fromGroup!;
    const t0 = performance.now();

    // Incoming starts smaller; outgoing starts at base then grows.
    controller.update(t0 + 1);
    expect(incomingGroup.scale.x).toBeLessThan(1);
    expect(outgoingGroup.scale.x).toBeCloseTo(1, 4);

    // Midway both have shifted.
    controller.update(t0 + 500);
    expect(incomingGroup.scale.x).toBeGreaterThan(0.9 * (1 - 0.1));

    // After finish the incoming settles to scale 1.
    controller.update(t0 + 1001);
    expect(incomingGroup.scale.x).toBeCloseTo(1, 4);
  });

  it('performs a camera dolly that peaks mid-transition and returns', () => {
    const { manager, controller } = setup(1945, { cameraDolly: 2 });
    const camera = manager.mainCamera;
    const restZ = camera.position.z;

    manager.setActiveEra(1965);
    const t0 = performance.now();

    // At start the camera is at its framing position.
    expect(camera.position.z).toBeCloseTo(restZ, 4);

    // Mid-transition the camera has dollied (z decreased — moved forward).
    controller.update(t0 + 500);
    expect(camera.position.z).toBeLessThan(restZ);

    // At completion the camera returns to its original framing.
    controller.update(t0 + 1001);
    expect(camera.position.z).toBeCloseTo(restZ, 4);
  });

  // -------------------------------------------------------------------------
  // AC: Integrates with SceneManager onTransitionStart/End hooks
  // -------------------------------------------------------------------------

  it('fires onComplete after each animated transition finishes', () => {
    const completed: EraTransitionInfo[] = [];
    const { manager, controller } = setup(1945, {
      onComplete: (info) => completed.push(info),
    });

    const setupCount = completed.length; // first-mount fade already settled
    manager.setActiveEra(1965);
    controller.update(performance.now() + 10_000);

    // Exactly one new completion for the 1945 → 1965 fade.
    expect(completed.length).toBe(setupCount + 1);
    expect(completed[completed.length - 1].fromYear).toBe(1945);
    expect(completed[completed.length - 1].toYear).toBe(1965);
  });

  it('first-mount fade animates the incoming group without an outgoing group', () => {
    resetSceneManager();
    const manager = new SceneManager();
    const controller = new TransitionController(manager, {
      autoUpdate: false,
      duration: 1000,
      scaleAmount: 0,
      cameraDolly: 0,
    });
    const firstMat = materialsOf(manager.getEraGroup(1945) as unknown as Group)[0];

    manager.setActiveEra(1945); // first mount: fromGroup is null
    expect(controller.isActive).toBe(true);
    expect(firstMat.opacity).toBeCloseTo(0, 6); // pre-zeroed

    const t0 = performance.now();
    controller.update(t0 + 500);
    expect(firstMat.opacity).toBeGreaterThan(0);

    controller.update(t0 + 1001);
    expect(firstMat.opacity).toBeCloseTo(1, 6); // restored
    expect(controller.isActive).toBe(false);
  });
});
