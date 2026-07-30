/**
 * TransitionController.ts — animated cross-fade between era groups.
 *
 * Wired to a {@link SceneManager} through its `onTransitionStart` transition
 * hook. On every era switch it dissolves the outgoing group into the incoming
 * one — an opacity cross-fade plus a subtle scale "morph" and a gentle camera
 * dolly — so the café transforms in front of your eyes rather than hard-cutting.
 * When the animation settles it asks the manager to retire (unmount + dispose)
 * the outgoing group via {@link SceneManager.completeTransition}.
 *
 * The controller is interruption-safe. Selecting a new era mid-transition
 * resolves cleanly: the manager has already disposed the previous outgoing
 * group by the time the new `onTransitionStart` fires, so the controller simply
 * drops that reference and starts a fresh dissolve from the current visual
 * state of the partially-faded-in group (which becomes the new outgoing group).
 * No half-faded groups are leaked and no visual artifacts remain.
 *
 * Lifecycle of a single transition:
 *   1. `onTransitionStart(info)` fires (incoming group already mounted).
 *   2. The controller snapshots both groups' materials + scales, pre-zeros the
 *      incoming group so it cannot flash at full opacity, then animates:
 *        - outgoing: opacity → 0, scale grows slightly as it recedes,
 *        - incoming: opacity → natural, scale grows into place,
 *        - camera:   eases toward its subject, peaking mid-transition, returns.
 *   3. On completion the controller settles the incoming group to its natural
 *      opaque state, returns the camera to its framing, and calls
 *      {@link SceneManager.completeTransition} (a no-op for first-mount fades,
 *      where the manager holds no pending transition) so the outgoing group is
 *      unmounted and its geometry/materials disposed.
 */
import { Vector3, type Material, type Object3D } from 'three';
import type { EraTransitionInfo, SceneManager } from './SceneManager.js';

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

/** An easing curve mapping normalized progress `[0, 1]` to eased progress. */
export type EasingFunction = (t: number) => number;

/** Linear easing (constant velocity). */
export const linear: EasingFunction = (t) => t;

/** Cubic ease-in (slow start, fast finish). */
export const easeInCubic: EasingFunction = (t) => t * t * t;

/** Cubic ease-out (fast start, settling finish). */
export const easeOutCubic: EasingFunction = (t) => 1 - Math.pow(1 - t, 3);

/** Cubic ease-in-out (slow start + end) — the controller default. */
export const easeInOutCubic: EasingFunction = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// ---------------------------------------------------------------------------
// Internal state shapes
// ---------------------------------------------------------------------------

/** A captured material with the opacity / transparent state to restore later. */
interface MaterialBinding {
  readonly material: Material;
  /** Opacity at the moment of capture (the group's natural resting opacity). */
  readonly baseOpacity: number;
  /** The `transparent` flag at capture, restored when the group settles. */
  readonly baseTransparent: boolean;
}

/** Per-group visual snapshot used to drive, then restore, the cross-fade. */
interface GroupState {
  readonly group: Object3D;
  /** The group's scale at capture; restored when the transition settles. */
  readonly baseScale: Vector3;
  /** Distinct materials within the group (shared materials are de-duplicated). */
  readonly bindings: MaterialBinding[];
}

/** The in-flight animation record. */
interface ActiveTransition {
  readonly info: EraTransitionInfo;
  /** The outgoing group snapshot, or `null` on the very first mount. */
  readonly outgoing: GroupState | null;
  /** The incoming group snapshot. */
  readonly incoming: GroupState;
  /** `performance.now()`-domain timestamp the animation started at. */
  readonly startTime: number;
  readonly duration: number;
  readonly easing: EasingFunction;
  readonly scaleAmount: number;
  /** Camera framing at capture; the dolly breathes around and returns to it. */
  readonly cameraStart: Vector3;
  /** Point the camera dollies toward at the transition peak. */
  readonly dollyTarget: Vector3;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** Options for constructing a {@link TransitionController}. */
export interface TransitionControllerOptions {
  /** Cross-fade duration in milliseconds. Defaults to `800`. */
  readonly duration?: number;
  /** Easing curve applied to normalized progress. Defaults to {@link easeInOutCubic}. */
  readonly easing?: EasingFunction;
  /**
   * Scale "morph" magnitude: the incoming group grows from `(1 - amount)` to
   * `1` while the outgoing group grows from `1` to `(1 + amount)` as it
   * recedes, giving the dissolve a sense of depth. `0` disables the scale
   * effect. Defaults to `0.06`.
   */
  readonly scaleAmount?: number;
  /**
   * Camera dolly distance in world units. The camera eases toward what it is
   * looking at, peaking at the transition midpoint, then returns to its
   * original framing — a subtle "push" that avoids a static hard-cut feel.
   * `0` disables the dolly. Defaults to `1.2`.
   */
  readonly cameraDolly?: number;
  /**
   * When `true` (default) the controller advances its own animation via
   * `requestAnimationFrame`. Set `false` to drive it manually with
   * {@link TransitionController.update} (useful in tests).
   */
  readonly autoUpdate?: boolean;
  /** Fired when a transition's animation completes (after `completeTransition`). */
  readonly onComplete?: (info: EraTransitionInfo) => void;
}

// ---------------------------------------------------------------------------
// TransitionController
// ---------------------------------------------------------------------------

/**
 * Drives the animated cross-fade between era groups for a
 * {@link SceneManager}. Constructing one registers it as the manager's
 * transition hook, so subsequent {@link SceneManager.setActiveEra} calls
 * cross-fade instead of hard-cutting.
 */
export class TransitionController {
  private readonly sceneManager: SceneManager;
  private readonly duration: number;
  private readonly defaultEasing: EasingFunction;
  private readonly scaleAmount: number;
  private readonly cameraDolly: number;
  private readonly autoUpdate: boolean;
  private readonly onComplete?: (info: EraTransitionInfo) => void;

  /** The currently animating transition, or `null` when at rest. */
  private active: ActiveTransition | null = null;

  /** The active `requestAnimationFrame` handle, or `null` when unscheduled. */
  private rafId: number | null = null;

  constructor(
    sceneManager: SceneManager,
    options: TransitionControllerOptions = {},
  ) {
    const {
      duration = 800,
      easing = easeInOutCubic,
      scaleAmount = 0.06,
      cameraDolly = 1.2,
      autoUpdate = true,
      onComplete,
    } = options;

    this.sceneManager = sceneManager;
    this.duration = duration;
    this.defaultEasing = easing;
    this.scaleAmount = scaleAmount;
    this.cameraDolly = cameraDolly;
    this.autoUpdate = autoUpdate;
    this.onComplete = onComplete;

    // Wire the controller into the manager's transition hook contract. The
    // manager treats era switches as controller-driven cross-fades as soon as
    // an `onTransitionStart` hook is present.
    sceneManager.setHooks({
      onTransitionStart: (info) => this.handleStart(info),
      onTransitionEnd: (info) => this.handleEnd(info),
    });
  }

  // -------------------------------------------------------------------------
  // Read-only accessors (consumed by UI / diagnostics)
  // -------------------------------------------------------------------------

  /** True while a cross-fade animation is in progress. */
  get isActive(): boolean {
    return this.active !== null;
  }

  /**
   * The {@link EraTransitionInfo} for the in-flight transition, or `null` when
   * at rest. Exposed so diagnostics (and tests) can inspect the exact groups
   * the controller is animating without reaching into private state.
   */
  get transitionInfo(): EraTransitionInfo | null {
    return this.active?.info ?? null;
  }

  // -------------------------------------------------------------------------
  // Public lifecycle
  // -------------------------------------------------------------------------

  /**
   * Advance the animation to an absolute `performance.now()`-domain timestamp.
   * Only used when {@link TransitionControllerOptions.autoUpdate} is `false`
   * (e.g. tests); otherwise the controller self-drives via RAF.
   */
  update(now: number = this.clock()): void {
    if (!this.active) return;
    if (this.advance(now)) this.finish();
  }

  /** Cancel any in-flight animation and release the controller's state. */
  dispose(): void {
    this.cancelFrame();
    this.active = null;
  }

  // -------------------------------------------------------------------------
  // SceneManager hook handlers
  // -------------------------------------------------------------------------

  /**
   * Entry point fired by the manager once the incoming group is mounted. Starts
   * (or, on interruption, cleanly restarts) the cross-fade.
   */
  private handleStart(info: EraTransitionInfo): void {
    // Interruption safety: stop any in-flight animation before starting fresh.
    // The manager has already disposed the previous outgoing group, so the
    // dropped reference is simply collected — nothing leaked.
    this.cancelFrame();
    this.begin(info);
  }

  /**
   * Fired by the manager when an era switch is finalized (outgoing group
   * retired). Used defensively: if the manager finalizes a transition
   * out-of-band while the controller still animates it (e.g. another switch
   * interrupting, or teardown), stop touching the now-disposed groups.
   * First-mount fades (no outgoing group) are left to complete normally.
   */
  private handleEnd(info: EraTransitionInfo): void {
    if (info.fromGroup && this.active && this.active.info === info) {
      this.cancelFrame();
      this.active = null;
    }
  }

  // -------------------------------------------------------------------------
  // Animation setup
  // -------------------------------------------------------------------------

  /** Snapshot both groups and kick off the dissolve. */
  private begin(info: EraTransitionInfo): void {
    const outgoing = info.fromGroup ? this.captureGroup(info.fromGroup) : null;
    const incoming = this.captureGroup(info.toGroup);

    // Pre-zero the incoming group synchronously so it cannot render at full
    // opacity for a frame before the first animation tick.
    this.setScale(incoming.group, incoming.baseScale, 1 - this.scaleAmount);
    for (const binding of incoming.bindings) {
      binding.material.transparent = true;
      binding.material.opacity = 0;
    }

    // Flag the outgoing group's materials transparent for the fade-out.
    if (outgoing) {
      for (const binding of outgoing.bindings) {
        binding.material.transparent = true;
      }
    }

    const camera = this.sceneManager.mainCamera;
    const cameraStart = camera.position.clone();
    let dollyTarget = cameraStart;
    if (this.cameraDolly > 0) {
      // `getWorldDirection` returns the direction the camera looks toward; a
      // positive step along it dollies the camera in toward its subject.
      const forward = new Vector3();
      camera.getWorldDirection(forward);
      dollyTarget = cameraStart.clone().addScaledVector(forward, this.cameraDolly);
    }

    this.active = {
      info,
      outgoing,
      incoming,
      startTime: this.clock(),
      duration: this.duration,
      easing: this.defaultEasing,
      scaleAmount: this.scaleAmount,
      cameraStart,
      dollyTarget,
    };

    if (this.autoUpdate) this.scheduleFrame();
  }

  /**
   * Traverse a group and snapshot every distinct material's opacity /
   * transparent flag plus the group's scale, so the cross-fade can be driven
   * and later restored. Shared materials are de-duplicated.
   */
  private captureGroup(group: Object3D): GroupState {
    const baseScale = group.scale.clone();
    const seen = new Set<Material>();
    const bindings: MaterialBinding[] = [];

    group.traverse((child) => {
      const node = child as unknown as {
        material?: Material | Material[];
      };
      const material = node.material;
      if (Array.isArray(material)) {
        for (const m of material) this.captureMaterial(m, seen, bindings);
      } else if (material) {
        this.captureMaterial(material, seen, bindings);
      }
    });

    return { group, baseScale, bindings };
  }

  /** De-duplicate and record a single material's resting state. */
  private captureMaterial(
    material: Material,
    seen: Set<Material>,
    bindings: MaterialBinding[],
  ): void {
    if (seen.has(material)) return;
    seen.add(material);
    bindings.push({
      material,
      baseOpacity: material.opacity,
      baseTransparent: material.transparent,
    });
  }

  // -------------------------------------------------------------------------
  // Animation loop
  // -------------------------------------------------------------------------

  /** Advance one step; returns `true` when the transition is complete. */
  private advance(now: number): boolean {
    const active = this.active;
    if (!active) return true;

    // Teardown safety: if the incoming group is no longer in the scene graph
    // (e.g. the SceneManager was disposed mid-fade), stop animating disposed
    // objects rather than touching freed resources.
    if (!active.incoming.group.parent) {
      this.active = null;
      this.cancelFrame();
      return true;
    }

    const raw = this.clamp((now - active.startTime) / active.duration, 0, 1);
    this.applyProgress(active, raw);
    return raw >= 1;
  }

  /** Apply the cross-fade / scale / camera state for a given raw progress. */
  private applyProgress(active: ActiveTransition, raw: number): void {
    const eased = active.easing(raw);
    const { outgoing, incoming, scaleAmount } = active;

    // --- Opacity cross-fade -----------------------------------------------
    for (const binding of incoming.bindings) {
      binding.material.opacity = binding.baseOpacity * eased;
    }
    if (outgoing) {
      const fade = 1 - eased;
      for (const binding of outgoing.bindings) {
        binding.material.opacity = binding.baseOpacity * fade;
      }
    }

    // --- Scale morph ------------------------------------------------------
    this.setScale(incoming.group, incoming.baseScale, 1 - scaleAmount + scaleAmount * eased);
    if (outgoing) {
      this.setScale(outgoing.group, outgoing.baseScale, 1 + scaleAmount * eased);
    }

    // --- Camera dolly "breath" (peaks at the midpoint, returns at the end) -
    if (this.cameraDolly > 0) {
      const breath = Math.sin(raw * Math.PI); // 0 -> 1 -> 0
      this.sceneManager.mainCamera.position.lerpVectors(
        active.cameraStart,
        active.dollyTarget,
        breath,
      );
    }
  }

  /** Settle the incoming group + camera, then ask the manager to retire the outgoing. */
  private finish(): void {
    const active = this.active;
    if (!active) return;
    const { outgoing, incoming } = active;

    // Settle the incoming group to its natural, opaque resting state.
    incoming.group.scale.copy(incoming.baseScale);
    for (const binding of incoming.bindings) {
      binding.material.opacity = binding.baseOpacity;
      binding.material.transparent = binding.baseTransparent;
    }

    // Leave the outgoing group fully faded out (opacity 0). The manager
    // disposes it immediately after, but if a group were ever to leak it
    // stays invisible rather than flashing back to full opacity.
    if (outgoing) {
      outgoing.group.scale.copy(outgoing.baseScale);
    }

    // Return the camera to its framing (the dolly breath already lands here at
    // raw == 1, but this is explicit and interruption-safe).
    this.sceneManager.mainCamera.position.copy(active.cameraStart);

    this.active = null;
    this.cancelFrame();

    // Retire the outgoing group. A no-op for first-mount fades, where the
    // manager holds no pending transition.
    if (this.sceneManager.isTransitioning) {
      this.sceneManager.completeTransition();
    }

    this.onComplete?.(active.info);
  }

  // -------------------------------------------------------------------------
  // RAF scheduling
  // -------------------------------------------------------------------------

  private scheduleFrame(): void {
    if (typeof requestAnimationFrame !== 'function') return;
    this.rafId = requestAnimationFrame(this.loop);
  }

  private cancelFrame(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
  }

  /** The RAF callback: advance, then reschedule or finalize. */
  private readonly loop = (now: number): void => {
    if (!this.active) return;
    if (this.advance(now)) {
      this.finish();
    } else {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  // -------------------------------------------------------------------------
  // Small utilities
  // -------------------------------------------------------------------------

  /** Scale a group uniformly relative to a captured base scale. */
  private setScale(group: Object3D, base: Vector3, factor: number): void {
    group.scale.set(base.x * factor, base.y * factor, base.z * factor);
  }

  /** Clamp a number into an inclusive range. */
  private clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
  }

  /** High-resolution timestamp, falling back to epoch millis off-DOM. */
  private clock(): number {
    return typeof performance !== 'undefined' &&
      typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }
}
