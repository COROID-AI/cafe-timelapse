/**
 * TransitionController — smooth animated cross-fade/morph between era groups.
 *
 * When `goTo(era)` is called the controller:
 *   1. mounts the incoming era group through the SceneHost hook;
 *   2. keeps the outgoing era group mounted and cross-fades it out while the
 *      incoming group fades in (both groups coexist for the whole transition);
 *   3. disposes the outgoing group (via `host.unmount`) once the fade ends.
 *
 * Interruptions resolve cleanly: selecting a new era mid-transition retargets
 * the controller — the partially-revealed group is demoted to "outgoing" and
 * fades back out from its current opacity while the newly selected group fades
 * in. Selecting the era that is already being revealed snaps the transition
 * to completion. At most two era groups coexist at any moment.
 *
 * The fade is driven by a configurable duration and easing (or a custom easing
 * function). An optional camera dolly lerps the camera position between a
 * start and destination over the same timeline (position only; the app owns
 * the camera, so it can choose to pause its own rig during the transition).
 *
 * Call `update(dt)` once per frame and `dispose()` on teardown.
 */
import * as THREE from 'three';
import type { EraYear } from '../data/eras';
import type { SceneHost } from './SceneHost';

export type EasingName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
export type EasingFunction = (t: number) => number;

/** Named easing curves used by the cross-fade (and optional dolly). */
export const EASINGS: Record<EasingName, EasingFunction> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};

function resolveEasing(easing: EasingName | EasingFunction): EasingFunction {
  return typeof easing === 'function' ? easing : EASINGS[easing];
}

/** Camera dolly destination for one transition. */
export interface DollyDestination {
  /** Camera position at the end of the transition. */
  to: THREE.Vector3;
  /** Camera position at the start (defaults to the current camera position). */
  from?: THREE.Vector3;
}

/**
 * Dolly configuration. Either a fixed destination, or a function returning the
 * destination for each target era (return null to skip the dolly for an era).
 */
export type DollySpec = DollyDestination | ((era: EraYear) => DollyDestination | null);

export interface TransitionControllerOptions {
  /** SceneManager hook the controller mounts/unmounts era groups through. */
  host: SceneHost;
  /** Cross-fade duration in seconds. Default: 1.0. */
  duration?: number;
  /** Easing applied to the cross-fade (and dolly). Default: 'easeInOut'. */
  easing?: EasingName | EasingFunction;
  /** Optional camera used for the dolly. When omitted the dolly is skipped. */
  camera?: THREE.PerspectiveCamera;
  /** Optional camera dolly flown in parallel with the cross-fade. */
  dolly?: DollySpec;
  /** Called whenever a transition starts (including retargets). */
  onTransitionStart?: (era: EraYear) => void;
  /** Called when a transition completes (the era is fully visible). */
  onTransitionEnd?: (era: EraYear) => void;
}

export class TransitionController {
  private readonly host: SceneHost;
  private readonly camera: THREE.PerspectiveCamera | null;
  private readonly dolly?: DollySpec;
  private readonly onTransitionStart?: (era: EraYear) => void;
  private readonly onTransitionEnd?: (era: EraYear) => void;

  private duration: number;
  private easing: EasingFunction;

  /** Target era: fully visible when idle, being revealed while transitioning. */
  private _activeEra: EraYear | null = null;
  private _previousEra: EraYear | null = null;

  /** The era group being revealed (kept mounted after completion). */
  private incomingGroup: THREE.Group | null = null;
  /** The era group being faded out (disposed at completion). */
  private outgoingGroup: THREE.Group | null = null;
  /** Opacity the outgoing group starts at (1, or its partial fade on retarget). */
  private outgoingStartOpacity = 1;

  private transitioning = false;
  private progress = 0;

  private dollyFrom: THREE.Vector3 | null = null;
  private dollyTo: THREE.Vector3 | null = null;

  constructor(options: TransitionControllerOptions) {
    this.host = options.host;
    this.camera = options.camera ?? null;
    this.duration = Math.max(0, options.duration ?? 1.0);
    this.easing = resolveEasing(options.easing ?? 'easeInOut');
    this.dolly = options.dolly;
    this.onTransitionStart = options.onTransitionStart;
    this.onTransitionEnd = options.onTransitionEnd;
    // The controller is the sole mounter of era groups: it learns every group
    // through its own `host.mount` calls so it can fade and dispose them.
    // A host that pre-mounts an era before the controller exists cannot hand
    // over its group reference, so the controller starts idle and the first
    // `goTo` mounts (and fully owns) the initial era.
  }

  /** The era currently selected (the incoming era while transitioning). */
  get activeEra(): EraYear | null {
    return this._activeEra;
  }

  /** True while a cross-fade is running. */
  get isTransitioning(): boolean {
    return this.transitioning;
  }

  /** The era being transitioned away from (null when idle). */
  get previousEra(): EraYear | null {
    return this._previousEra;
  }

  /** Replace the cross-fade duration (seconds). */
  setDuration(duration: number): void {
    this.duration = Math.max(0, duration);
  }

  /** Replace the easing used by the cross-fade. */
  setEasing(easing: EasingName | EasingFunction): void {
    this.easing = resolveEasing(easing);
  }

  /**
   * Select an era. Interruption-safe:
   *  - same era while idle → no-op;
   *  - same era mid-transition → snap to completion;
   *  - new era mid-transition → retarget: the partial incoming becomes the
   *    outgoing (fading from its current opacity) and the new era fades in.
   */
  goTo(era: EraYear): void {
    if (!this.transitioning && this._activeEra === era) return;

    if (!this.transitioning) {
      this.beginTransition(era);
      return;
    }

    // Mid-transition, but the user picked the era being revealed: resolve now.
    if (era === this._activeEra) {
      this.finishTransition();
      return;
    }

    // Mid-transition retarget: drop any already-fading outgoing group (it was
    // on its way out), demote the partial incoming to outgoing, and mount the
    // newly selected era as the incoming group.
    if (this.outgoingGroup) {
      this.host.unmount(this.outgoingGroup);
      this.outgoingGroup = null;
    }
    const newIncoming = this.host.mount(era);
    prepareForFade(newIncoming);
    newIncoming.renderOrder = 1;
    applyOpacity(newIncoming, 0);

    if (this.incomingGroup) {
      this.outgoingGroup = this.incomingGroup;
      this.outgoingGroup.renderOrder = 0;
      this.outgoingStartOpacity = this.easing(this.progress);
      this._previousEra = this._activeEra;
    }
    this.incomingGroup = newIncoming;
    this._activeEra = era;
    this.host.setActiveEra(era);
    this.progress = 0;
    this.captureDolly(era);
    this.onTransitionStart?.(era);
  }

  /** Advance the cross-fade by `dt` seconds. Call once per frame. */
  update(dt: number): void {
    if (!this.transitioning) return;
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.progress = Math.min(1, this.progress + dt / Math.max(this.duration, 1e-4));
    const k = this.easing(this.progress);
    applyOpacity(this.outgoingGroup, this.outgoingStartOpacity * (1 - k));
    applyOpacity(this.incomingGroup, k);
    this.updateDolly(k);
    // Epsilon tolerance: accumulated dt rarely sums to exactly 1.0.
    if (this.progress >= 1 - 1e-9) {
      this.finishTransition();
    }
  }

  /**
   * Teardown: dispose every era group still owned by the controller through
   * the host hook and reset all state.
   */
  dispose(): void {
    if (this.outgoingGroup) {
      this.host.unmount(this.outgoingGroup);
      this.outgoingGroup = null;
    }
    if (this.incomingGroup) {
      this.host.unmount(this.incomingGroup);
      this.incomingGroup = null;
    }
    this.transitioning = false;
    this.progress = 0;
    this._activeEra = null;
    this._previousEra = null;
    this.outgoingStartOpacity = 1;
    this.dollyFrom = null;
    this.dollyTo = null;
  }

  // --- Internals -----------------------------------------------------------

  private beginTransition(era: EraYear): void {
    this.transitioning = true;
    this.progress = 0;
    this._previousEra = this._activeEra;
    this._activeEra = era;
    this.host.setActiveEra(era);

    if (this.incomingGroup) {
      // The currently visible group is demoted to outgoing and fades out.
      this.outgoingGroup = this.incomingGroup;
      this.outgoingGroup.renderOrder = 0;
      this.outgoingStartOpacity = 1;
      prepareForFade(this.outgoingGroup);
    }

    const incoming = this.host.mount(era);
    prepareForFade(incoming);
    incoming.renderOrder = 1;
    applyOpacity(incoming, 0);
    this.incomingGroup = incoming;

    this.captureDolly(era);
    this.onTransitionStart?.(era);
  }

  private finishTransition(): void {
    const finishedEra = this._activeEra;
    if (this.outgoingGroup) {
      // SceneManager hook: remove from the scene and dispose its resources.
      this.host.unmount(this.outgoingGroup);
      this.outgoingGroup = null;
    }
    if (this.incomingGroup) {
      restoreFaded(this.incomingGroup);
      this.incomingGroup.renderOrder = 0;
    }
    this.transitioning = false;
    this.progress = 0;
    this._previousEra = null;
    this.outgoingStartOpacity = 1;
    this.dollyFrom = null;
    this.dollyTo = null;
    if (finishedEra !== null) this.onTransitionEnd?.(finishedEra);
  }

  private captureDolly(era: EraYear): void {
    this.dollyFrom = null;
    this.dollyTo = null;
    if (!this.dolly) return;
    const destination = typeof this.dolly === 'function' ? this.dolly(era) : this.dolly;
    if (!destination) return;
    this.dollyTo = destination.to.clone();
    this.dollyFrom = destination.from?.clone() ?? this.camera?.position.clone() ?? null;
  }

  private updateDolly(k: number): void {
    if (!this.camera || !this.dollyFrom || !this.dollyTo) return;
    this.camera.position.lerpVectors(this.dollyFrom, this.dollyTo, k);
  }
}

/** Mark every material in `group` for opacity animation, saving originals. */
function prepareForFade(group: THREE.Group): void {
  forEachMaterial(group, (material) => {
    if (material.userData.transitionFaded) return;
    material.userData.transitionOriginalTransparent = material.transparent;
    material.userData.transitionOriginalDepthWrite = material.depthWrite;
    material.transparent = true;
    material.depthWrite = false;
    material.userData.transitionFaded = true;
  });
}

/** Restore the original transparency flags and full opacity after a fade. */
function restoreFaded(group: THREE.Group): void {
  forEachMaterial(group, (material) => {
    if (!material.userData.transitionFaded) return;
    material.transparent = material.userData.transitionOriginalTransparent ?? false;
    material.depthWrite = material.userData.transitionOriginalDepthWrite ?? true;
    material.opacity = 1;
    material.userData.transitionFaded = false;
  });
}

function applyOpacity(group: THREE.Group | null, opacity: number): void {
  if (!group) return;
  forEachMaterial(group, (material) => {
    material.opacity = opacity;
  });
}

function forEachMaterial(group: THREE.Group, fn: (material: THREE.Material) => void): void {
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.material) return;
    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) fn(material);
    } else {
      fn(mesh.material);
    }
  });
}
