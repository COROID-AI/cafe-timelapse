/**
 * Navigation.ts — interior camera rig for the Café Time Period Timelapse.
 *
 * Provides orbit (drag-rotate), pan (right-drag / shift-drag / two-finger), and
 * zoom (scroll-wheel / pinch) around a target point, plus a first-person-style
 * *inspection* ("walk up close") mode that reduces the camera's collision margin
 * so users can press right up against objects and walls to examine detail.
 *
 * The camera (eye) is hard-clamped inside a configurable interior bounding box
 * representing the café shell (walls / floor / ceiling) so it can never clip out
 * of the room. All motion is frame-rate-independent damped for smoothness, and
 * arrow-key controls provide keyboard accessibility.
 *
 * Bounds note: the shell dimensions are owned by the Phase 3 architecture task.
 * Until that lands, bounds are fully configurable via {@link NavigationOptions}
 * and default to {@link DEFAULT_CAFE_INTERIOR}. When the architecture task
 * publishes canonical dimensions, call {@link Navigation.setBounds}.
 */
import {
  Box3,
  MathUtils,
  PerspectiveCamera,
  Vector3,
} from 'three';

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing — no camera / DOM required)
// ---------------------------------------------------------------------------

/**
 * Frame-rate-independent exponential damping (the same formulation Three.js's
 * `MathUtils.damp` uses). Moves `current` toward `target` by a fraction that
 * depends on `lambda` (higher = snappier) and the elapsed `dt`.
 *
 * A `lambda` of `0` (or non-positive) disables damping and snaps immediately,
 * which keeps callers from freezing the rig when damping is turned off.
 */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number {
  if (lambda <= 0) return target;
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Convert spherical coordinates (Three.js convention) into a Cartesian offset
 * relative to the orbit target.
 *
 * @param radius - Distance from the target (>= 0).
 * @param theta  - Azimuthal angle around the Y axis (radians).
 * @param phi    - Polar angle from the positive Y axis (radians).
 * @returns A new offset vector to add to the target to obtain camera position.
 */
export function sphericalOffset(
  radius: number,
  theta: number,
  phi: number,
): Vector3 {
  const sinPhiRadius = Math.sin(phi) * radius;
  return new Vector3(
    sinPhiRadius * Math.sin(theta),
    Math.cos(phi) * radius,
    sinPhiRadius * Math.cos(theta),
  );
}

/**
 * Clamp a position to lie inside `bounds` inset by `margin` on every axis.
 *
 * This is the collision guard that keeps the camera inside the café shell.
 * When an axis is narrower than twice the margin (so `min + margin > max - margin`)
 * the position is centered on that axis instead of clamped to an inverted range.
 * The input vector is mutated in place and also returned for convenience.
 */
export function clampToBounds(
  position: Vector3,
  bounds: Box3,
  margin: number,
): Vector3 {
  const clampAxis = (value: number, min: number, max: number): number => {
    const lo = min + margin;
    const hi = max - margin;
    if (lo >= hi) return (min + max) / 2;
    return MathUtils.clamp(value, lo, hi);
  };
  position.x = clampAxis(position.x, bounds.min.x, bounds.max.x);
  position.y = clampAxis(position.y, bounds.min.y, bounds.max.y);
  position.z = clampAxis(position.z, bounds.min.z, bounds.max.z);
  return position;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Interior bounding box type — a Three.js Box3 (min/max corners). */
export type NavigationBounds = Box3;

/**
 * Default café interior volume used until the Phase 3 architecture task
 * publishes canonical shell dimensions. A modest single-room café:
 * 12 m wide × 4 m tall × 10 m deep, floor at y = 0.
 */
export const DEFAULT_CAFE_INTERIOR: NavigationBounds = new Box3(
  new Vector3(-6, 0, -5),
  new Vector3(6, 4, 5),
);

/** Internal spherical state (radius, azimuth, polar). */
interface SphericalState {
  radius: number;
  theta: number;
  phi: number;
}

/** Mouse button that triggers a pan (middle + right). */
const PAN_BUTTONS = new Set([1, 2]);

/**
 * Options for constructing a {@link Navigation} rig. Everything except the
 * camera and DOM element has a sensible default.
 */
export interface NavigationOptions {
  /** The perspective camera to drive. */
  camera: PerspectiveCamera;
  /** Element receiving pointer/wheel events (typically the renderer canvas). */
  domElement: HTMLElement;
  /** Interior shell bounds. Defaults to {@link DEFAULT_CAFE_INTERIOR}. */
  bounds?: NavigationBounds;
  /** Collision margin (metres) between the camera and walls in normal mode. */
  collisionRadius?: number;
  /**
   * Collision margin (metres) in close-up inspection mode. Smaller so users can
   * press near objects/walls to examine detail.
   */
  inspectionCollisionRadius?: number;
  /** Initial orbit target (look-at point). Defaults to room centre. */
  target?: Vector3;
  /** Minimum orbit radius. */
  minDistance?: number;
  /**
   * Minimum orbit radius while in inspection mode (lets the camera approach
   * objects closely).
   */
  inspectionMinDistance?: number;
  /** Maximum orbit radius. */
  maxDistance?: number;
  /** Pointer-rotation sensitivity (multiplicative). */
  rotateSpeed?: number;
  /** Scroll / pinch zoom sensitivity (multiplicative). */
  zoomSpeed?: number;
  /** Pan sensitivity (multiplicative). */
  panSpeed?: number;
  /** Damping coefficient (higher = snappier). `0` disables damping. */
  damping?: number;
  /** Arrow-key orbit rate (radians per second). */
  keyRotateSpeed?: number;
  /** Arrow-key zoom rate (units per second). */
  keyZoomSpeed?: number;
  /** Keyboard key that toggles inspection mode. `null` disables. */
  inspectionToggleKey?: string | null;
}

// ---------------------------------------------------------------------------
// Navigation rig
// ---------------------------------------------------------------------------

/**
 * Orbit / pan / zoom camera rig with interior collision bounds and an
 * inspection ("walk up close") mode.
 *
 * Typical usage:
 * ```ts
 * const nav = new Navigation({ camera, domElement: renderer.domElement });
 * function animate() {
 *   requestAnimationFrame(animate);
 *   nav.update(clock.getDelta());
 *   renderer.render(scene, camera);
 * }
 * ```
 */
export class Navigation {
  /** Driven camera. */
  readonly camera: PerspectiveCamera;
  /** Element bound to pointer/wheel listeners. */
  readonly domElement: HTMLElement;

  /** Interior shell bounds (mutable — update via {@link setBounds}). */
  bounds: NavigationBounds;
  /** Normal-mode collision margin. */
  collisionRadius: number;
  /** Inspection-mode collision margin. */
  inspectionCollisionRadius: number;

  /** Orbit target (look-at point). */
  readonly target = new Vector3();

  private readonly minDistance: number;
  private readonly inspectionMinDistance: number;
  private readonly maxDistance: number;
  /** Polar angle clamps to avoid gimbal flip at the poles. */
  private readonly minPolarAngle = 0.05;
  private readonly maxPolarAngle = Math.PI - 0.05;

  private readonly rotateSpeed: number;
  private readonly zoomSpeed: number;
  private readonly panSpeed: number;
  private readonly damping: number;
  private readonly keyRotateSpeed: number;
  private readonly keyZoomSpeed: number;
  private readonly inspectionToggleKey: string | null;

  /** User-intended spherical position (input drives this). */
  private readonly targetSpherical: SphericalState = {
    radius: 0,
    theta: 0,
    phi: 0,
  };
  /** Damped spherical position (what the camera actually approaches). */
  private readonly spherical: SphericalState = { radius: 0, theta: 0, phi: 0 };

  /** Whether close-up inspection mode is active. */
  private inspection = false;
  /** Master enable flag. When false, input is ignored and the rig idles. */
  enabled = true;

  // --- Pointer / gesture tracking -----------------------------------------
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private state: 'none' | 'rotate' | 'pan' | 'touch-dolly-pan' = 'none';
  private rotateStart = { x: 0, y: 0 };
  private panStart = { x: 0, y: 0 };
  private dollyStart = 0;

  /** Currently depressed movement keys (event.key values). */
  private readonly keys = new Set<string>();

  // Bound listener refs so they can be removed in dispose().
  private readonly onPointerDown = (e: PointerEvent): void =>
    this.handlePointerDown(e);
  private readonly onPointerMove = (e: PointerEvent): void =>
    this.handlePointerMove(e);
  private readonly onPointerUp = (e: PointerEvent): void =>
    this.handlePointerUp(e);
  private readonly onWheel = (e: WheelEvent): void => this.handleWheel(e);
  private readonly onContextMenu = (e: Event): void => e.preventDefault();
  private readonly onKeyDown = (e: KeyboardEvent): void =>
    this.handleKeyDown(e);
  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key);
  };
  private readonly onBlur = (): void => this.keys.clear();

  constructor(options: NavigationOptions) {
    this.camera = options.camera;
    this.domElement = options.domElement;
    this.bounds = options.bounds ?? DEFAULT_CAFE_INTERIOR;
    this.collisionRadius = options.collisionRadius ?? 0.4;
    this.inspectionCollisionRadius = options.inspectionCollisionRadius ?? 0.05;
    this.minDistance = options.minDistance ?? 0.5;
    this.inspectionMinDistance = options.inspectionMinDistance ?? 0.2;
    this.maxDistance = options.maxDistance ?? 14;
    this.rotateSpeed = options.rotateSpeed ?? 1;
    this.zoomSpeed = options.zoomSpeed ?? 1;
    this.panSpeed = options.panSpeed ?? 1;
    this.damping = options.damping ?? 4;
    this.keyRotateSpeed = options.keyRotateSpeed ?? 1.2;
    this.keyZoomSpeed = options.keyZoomSpeed ?? 4;
    this.inspectionToggleKey = options.inspectionToggleKey ?? 'i';

    this.target.copy(options.target ?? this.bounds.getCenter(new Vector3()));

    // Derive initial spherical state from the camera's current placement so
    // the rig picks up seamlessly wherever the camera starts.
    this.synchronizeFromCamera();
    this.targetSpherical.radius = this.spherical.radius;
    this.targetSpherical.theta = this.spherical.theta;
    this.targetSpherical.phi = this.spherical.phi;

    this.addListeners();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Effective minimum orbit radius for the current mode. */
  private get effectiveMinDistance(): number {
    return this.inspection ? this.inspectionMinDistance : this.minDistance;
  }

  /** Current collision margin for the active mode. */
  private get effectiveCollisionRadius(): number {
    return this.inspection
      ? this.inspectionCollisionRadius
      : this.collisionRadius;
  }

  /** Whether close-up inspection mode is active. */
  get inspectionMode(): boolean {
    return this.inspection;
  }

  /** Enable or disable the close-up inspection ("walk up close") mode. */
  setInspectionMode(enabled: boolean): void {
    this.inspection = enabled;
    // Re-clamp the orbit radius so the new (smaller) minimum can take effect
    // without overshooting, and the larger minimum re-engages on exit.
    this.targetSpherical.radius = MathUtils.clamp(
      this.targetSpherical.radius,
      this.effectiveMinDistance,
      this.maxDistance,
    );
  }

  /** Toggle inspection mode and return the new state. */
  toggleInspectionMode(): boolean {
    this.setInspectionMode(!this.inspection);
    return this.inspection;
  }

  /** Replace the interior bounds (used once architecture dimensions land). */
  setBounds(bounds: NavigationBounds): void {
    this.bounds = bounds;
    // Re-clamp the orbit centre into the new shell.
    clampToBounds(this.target, this.bounds, this.collisionRadius);
  }

  /** Move the orbit target (clamped to the interior). */
  setTarget(target: Vector3): void {
    this.target.copy(target);
    clampToBounds(this.target, this.bounds, this.effectiveCollisionRadius);
    this.synchronizeFromCamera();
  }

  /**
   * Aim the rig at a point of interest and move close to it — the programmatic
   * entry point for "look at things up close" (e.g. clicking an object). Keeps
   * the current view direction; only the target and orbit radius change.
   */
  focusOn(point: Vector3, distance = 1.5): void {
    this.target.copy(point);
    clampToBounds(this.target, this.bounds, this.effectiveCollisionRadius);
    this.targetSpherical.radius = MathUtils.clamp(
      distance,
      this.effectiveMinDistance,
      this.maxDistance,
    );
  }

  /**
   * Advance the rig by `dt` seconds. Apply keyboard input, damp the spherical
   * state toward the user-intended state, derive and clamp the camera position,
   * and orient the camera at the target. Call once per animation frame.
   */
  update(dt: number): void {
    if (!this.enabled) return;
    const step = Math.min(Math.max(dt, 0), 0.1); // clamp huge frame gaps

    this.applyKeyboardInput(step);

    if (this.damping <= 0) {
      this.spherical.radius = this.targetSpherical.radius;
      this.spherical.theta = this.targetSpherical.theta;
      this.spherical.phi = this.targetSpherical.phi;
    } else {
      const lambda = this.damping;
      this.spherical.radius = damp(
        this.spherical.radius,
        this.targetSpherical.radius,
        lambda,
        step,
      );
      this.spherical.theta = damp(
        this.spherical.theta,
        this.targetSpherical.theta,
        lambda,
        step,
      );
      this.spherical.phi = damp(
        this.spherical.phi,
        this.targetSpherical.phi,
        lambda,
        step,
      );
    }

    const offset = sphericalOffset(
      this.spherical.radius,
      this.spherical.theta,
      this.spherical.phi,
    );
    const position = this.target.clone().add(offset);
    // The core collision guard: keep the eye strictly inside the café shell,
    // respecting the (mode-dependent) collision margin.
    clampToBounds(position, this.bounds, this.effectiveCollisionRadius);

    this.camera.position.copy(position);
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
  }

  /** Remove all listeners and release references. Safe to call once. */
  dispose(): void {
    this.removeListeners();
    this.pointers.clear();
    this.keys.clear();
  }

  // -------------------------------------------------------------------------
  // Spherical bookkeeping
  // -------------------------------------------------------------------------

  /** Recompute {@link spherical} from the camera's position relative to target. */
  private synchronizeFromCamera(): void {
    const offset = this.camera.position.clone().sub(this.target);
    const radius = offset.length();
    this.spherical.radius = radius;
    this.spherical.theta = Math.atan2(offset.x, offset.z);
    this.spherical.phi = Math.acos(
      MathUtils.clamp(offset.y / (radius || 1), -1, 1),
    );
  }

  private rotateLeft(angle: number): void {
    this.targetSpherical.theta -= angle;
  }

  private rotateUp(angle: number): void {
    this.targetSpherical.phi = MathUtils.clamp(
      this.targetSpherical.phi - angle,
      this.minPolarAngle,
      this.maxPolarAngle,
    );
  }

  /** Scale the orbit radius by `ratio` (pinch). Clamped to allowed range. */
  private applyDollyRatio(ratio: number): void {
    this.targetSpherical.radius = MathUtils.clamp(
      this.targetSpherical.radius * ratio,
      this.effectiveMinDistance,
      this.maxDistance,
    );
  }

  /** Move the orbit target along the camera's local right/up axes. */
  private pan(deltaX: number, deltaY: number): void {
    const height = this.domElement.clientHeight || 1;
    // World-space distance per screen pixel at the current orbit radius/fov.
    const fovRad = (this.camera.fov * Math.PI) / 180;
    const panScale =
      ((2 * this.spherical.radius * Math.tan(fovRad / 2)) / height) *
      this.panSpeed;

    const right = new Vector3().setFromMatrixColumn(this.camera.matrix, 0);
    const up = new Vector3().setFromMatrixColumn(this.camera.matrix, 1);

    // Grab-to-pan: the world follows the cursor, so the target moves in the
    // same screen direction as the pointer.
    this.target.addScaledVector(right, deltaX * panScale);
    this.target.addScaledVector(up, -deltaY * panScale);
    clampToBounds(this.target, this.bounds, this.effectiveCollisionRadius);
  }

  // -------------------------------------------------------------------------
  // Pointer handling
  // -------------------------------------------------------------------------

  private handlePointerDown(event: PointerEvent): void {
    if (!this.enabled) return;
    this.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (this.pointers.size === 1) {
      if (event.shiftKey || PAN_BUTTONS.has(event.button)) {
        this.state = 'pan';
        this.panStart = { x: event.clientX, y: event.clientY };
      } else {
        this.state = 'rotate';
        this.rotateStart = { x: event.clientX, y: event.clientY };
      }
    } else if (this.pointers.size === 2) {
      // Two-finger gesture: simultaneous pinch-zoom + pan.
      this.state = 'touch-dolly-pan';
      const [a, b] = [...this.pointers.values()];
      this.dollyStart = distance2D(a, b);
      this.panStart = midpoint2D(a, b);
    }

    try {
      this.domElement.setPointerCapture(event.pointerId);
    } catch {
      /* setPointerCapture can throw if the pointer is already gone — ignore. */
    }
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const height = this.domElement.clientHeight || 1;
    const width = this.domElement.clientWidth || 1;

    if (this.pointers.size >= 2 && this.state === 'touch-dolly-pan') {
      const [a, b] = [...this.pointers.values()];
      const dist = distance2D(a, b);
      if (this.dollyStart > 0 && dist > 0) {
        this.applyDollyRatio(this.dollyStart / dist);
      }
      this.dollyStart = dist;

      const mid = midpoint2D(a, b);
      this.pan(mid.x - this.panStart.x, mid.y - this.panStart.y);
      this.panStart = mid;
      return;
    }

    if (this.state === 'rotate') {
      const deltaX = event.clientX - this.rotateStart.x;
      const deltaY = event.clientY - this.rotateStart.y;
      // Convert pixels to radians, scaled by element size and sensitivity.
      this.rotateLeft(
        ((2 * Math.PI * deltaX) / height) * this.rotateSpeed,
      );
      this.rotateUp(
        ((2 * Math.PI * deltaY) / height) * this.rotateSpeed,
      );
      this.rotateStart = { x: event.clientX, y: event.clientY };
    } else if (this.state === 'pan') {
      const deltaX = event.clientX - this.panStart.x;
      const deltaY = event.clientY - this.panStart.y;
      this.pan(
        (deltaX * 2 * this.spherical.radius * this.rotateSpeed) / width,
        (deltaY * 2 * this.spherical.radius * this.rotateSpeed) / width,
      );
      this.panStart = { x: event.clientX, y: event.clientY };
    }
  }

  private handlePointerUp(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
    try {
      this.domElement.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }

    if (this.pointers.size === 0) {
      this.state = 'none';
    } else if (this.pointers.size === 1) {
      // Dropped back to a single pointer: resume rotate from the survivor.
      this.state = 'rotate';
      const last = [...this.pointers.values()][0];
      this.rotateStart = { x: last.x, y: last.y };
    }
  }

  private handleWheel(event: WheelEvent): void {
    if (!this.enabled) return;
    event.preventDefault();
    // Normalise the wheel delta so trackpads and mice behave consistently.
    const magnitude = Math.min(Math.abs(event.deltaY) / 100, 1);
    const dir = event.deltaY > 0 ? 1 : -1; // scroll down => zoom out
    const factor = 1 + dir * (0.1 + 0.15 * magnitude) * this.zoomSpeed;
    this.targetSpherical.radius = MathUtils.clamp(
      this.targetSpherical.radius * factor,
      this.effectiveMinDistance,
      this.maxDistance,
    );
  }

  // -------------------------------------------------------------------------
  // Keyboard handling
  // -------------------------------------------------------------------------

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    // Inspection toggle (guard against auto-repeat firing repeatedly).
    if (
      !event.repeat &&
      this.inspectionToggleKey &&
      event.key.toLowerCase() === this.inspectionToggleKey
    ) {
      this.toggleInspectionMode();
      return;
    }

    // Don't hijack arrow keys from focused form controls (e.g. the timeline
    // slider) — they need their own arrow-key navigation.
    const active = document.activeElement as HTMLElement | null;
    if (
      active &&
      (active.tagName === 'INPUT' ||
        active.tagName === 'SELECT' ||
        active.tagName === 'TEXTAREA' ||
        active.isContentEditable)
    ) {
      return;
    }

    this.keys.add(event.key);
  }

  /** Apply continuous arrow-key orbit/zoom for this frame. */
  private applyKeyboardInput(dt: number): void {
    if (this.keys.size === 0) return;
    if (this.keys.has('ArrowLeft')) {
      this.rotateLeft(this.keyRotateSpeed * dt);
    }
    if (this.keys.has('ArrowRight')) {
      this.rotateLeft(-this.keyRotateSpeed * dt);
    }
    if (this.keys.has('ArrowUp')) {
      this.targetSpherical.radius = MathUtils.clamp(
        this.targetSpherical.radius - this.keyZoomSpeed * dt,
        this.effectiveMinDistance,
        this.maxDistance,
      );
    }
    if (this.keys.has('ArrowDown')) {
      this.targetSpherical.radius = MathUtils.clamp(
        this.targetSpherical.radius + this.keyZoomSpeed * dt,
        this.effectiveMinDistance,
        this.maxDistance,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Listener wiring
  // -------------------------------------------------------------------------

  private addListeners(): void {
    const el = this.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointercancel', this.onPointerUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    el.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  private removeListeners(): void {
    const el = this.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('pointercancel', this.onPointerUp);
    el.removeEventListener('wheel', this.onWheel);
    el.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}

// ---------------------------------------------------------------------------
// Small geometry helpers (module-private)
// ---------------------------------------------------------------------------

function distance2D(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint2D(a: { x: number; y: number }, b: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
