import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Dual navigation modes for the café:
 *
 * 1. **Orbit** — damped {@link OrbitControls} around the room centre with
 *    zoom and polar-angle limits, softly clamped so the camera can never
 *    leave (or sink into) the permanent shell.
 * 2. **Free-fly / inspect** — WASD movement relative to the view direction,
 *    Q/E world-vertical movement, pointer-lock mouse look, scroll-wheel speed
 *    control, and a raycast "focus target" helper that eases the camera into
 *    a close-up framing of a clicked prop behind a subtle depth-of-field
 *    style vignette overlay.
 *
 * Every camera motion is eased: mode hops and focus travels run on eased
 * tweens, fly velocity/look use exponential smoothing, and orbit relies on
 * OrbitControls damping plus a soft boundary relax. `Tab` toggles modes and
 * an on-screen hint chip mirrors the active mode + controls.
 *
 * Pointer handling is canvas-only (plus pointer-lock-gated document
 * mousemove), so future timeline UI clicks never reach this controller.
 */

export type NavigationMode = 'orbit' | 'fly';

/** Camera framing for a close-up inspection of a world-space point. */
export interface FocusFrame {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

export interface NavigationControllerOptions {
  /** Camera owned by the app shell; driven exclusively by this controller. */
  camera: THREE.PerspectiveCamera;
  /** Canvas receiving pointer input (kept canvas-only by contract). */
  domElement: HTMLElement;
  /** Scene graph raycasted for clickable props in fly mode. */
  scene: THREE.Scene;
  /**
   * Returns the current room bounding box. Called once per frame with a
   * reusable target box to write into (a zero-arg closure returning a shared
   * box also satisfies this signature). Used for soft boundary clamping.
   */
  getBounds?: (target: THREE.Box3) => THREE.Box3;
  /**
   * Builds the close-up framing for a focused world point. Defaults to a
   * simple stand-off along the current view ray.
   */
  resolveFocusFrame?: (point: THREE.Vector3) => FocusFrame;
  /** Notified whenever the active mode changes (after the eased hop begins). */
  onModeChange?: (mode: NavigationMode) => void;
  /** Where the hint chip / vignette overlays mount. Defaults to document.body. */
  hintContainer?: HTMLElement;
}

/* ------------------------------------------------------------------------- */
/* Tunable constants                                                          */
/* ------------------------------------------------------------------------- */

// --- Orbit mode ---
const ORBIT_DAMPING_FACTOR = 0.08;
const ORBIT_MIN_DISTANCE = 0.55;
const ORBIT_MAX_DISTANCE = 24;
const ORBIT_MIN_POLAR_ANGLE = 0.12;
const ORBIT_MAX_POLAR_ANGLE = Math.PI / 2 - 0.06;
/** Keeps the orbit pivot away from the walls while panning. */
const ORBIT_TARGET_INSET = 0.95;
/** How far ahead of the view the orbit pivot lands when leaving fly mode. */
const ORBIT_EXIT_DISTANCE = 4.4;
/** Chase rate (1/s) of the soft boundary clamp in orbit mode. */
const ORBIT_BOUND_RELAX = 10;

// --- Free-fly mode ---
/** First-person eye height preset, in metres. */
const EYE_HEIGHT = 1.62;
/** Walk speed at speed-multiplier ×1, in m/s. */
const FLY_BASE_SPEED = 2.8;
/** Multiplicative step per scroll notch. */
const FLY_SPEED_STEP = 1.18;
const FLY_MIN_SPEED = 0.35;
const FLY_MAX_SPEED = 9;
/** Velocity smoothing rate — higher snaps faster, lower floats longer. */
const FLY_ACCEL = 10;
const MOUSE_SENSITIVITY = 0.0021;
/** Exponential smoothing applied to yaw/pitch (imperceptible but eased). */
const LOOK_SMOOTHING = 26;
const PITCH_LIMIT = THREE.MathUtils.degToRad(86);

// --- Shared -----------------------------------------------------------------
/** Gap kept between the camera and the shell walls/floor/ceiling. */
const BOUNDS_INSET = 0.42;
const EYE_MIN_ABOVE_FLOOR = 0.5;
const EYE_MAX_BELOW_CEILING = 0.3;
const MODE_TWEEN_DURATION = 0.7;
const FOCUS_MIN_DURATION = 0.55;
const FOCUS_MAX_DURATION = 1.5;
/** Seconds of focus tween per metre travelled (scaled, then clamped). */
const FOCUS_TRAVEL_RATE = 0.11;
/** Stand-off used when no custom focus-framing resolver is provided. */
const FOCUS_FALLBACK_DISTANCE = 1.15;
/** Raw pointer pixels of deliberate mouse-look that break out of a focus. */
const FOCUS_BREAK_PIXELS = 3;
/** Peak opacity of the depth-of-field-style vignette overlay. */
const VIGNETTE_OPACITY = 0.55;
const VIGNETTE_EASE_RATE = 3.2;
const CLICK_MAX_MS = 350;
const CLICK_MAX_DRIFT_PX = 6;

/* ------------------------------------------------------------------------- */
/* Internals                                                                  */
/* ------------------------------------------------------------------------- */

const WORLD_UP = new THREE.Vector3(0, 1, 0);

const MOVE_KEYS: ReadonlySet<string> = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE']);

/** Arrow-key aliases so fly mode also works without WASD muscle memory. */
const KEY_ALIASES: Readonly<Record<string, string>> = {
  ArrowUp: 'KeyW',
  ArrowDown: 'KeyS',
  ArrowLeft: 'KeyA',
  ArrowRight: 'KeyD',
};

interface CameraTween {
  kind: 'mode' | 'focus';
  t: number;
  duration: number;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromQuat: THREE.Quaternion;
  toQuat: THREE.Quaternion;
}

interface PendingPress {
  x: number;
  y: number;
  time: number;
}

// Scratch objects — reused per frame, never handed out.
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q1 = new THREE.Quaternion();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _ndc = new THREE.Vector2();
const _matrix = new THREE.Matrix4();

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Moves `current` toward `target` along the shortest arc by fraction `k`. */
function approachAngle(current: number, target: number, k: number): number {
  let delta = (target - current) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  else if (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * k;
}

function createHintElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.id = 'navigation-hint';
  el.className = 'nav-hint';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  return el;
}

function createVignetteElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.id = 'focus-vignette';
  el.className = 'focus-vignette';
  el.setAttribute('aria-hidden', 'true');
  el.style.opacity = '0';
  return el;
}

/* ------------------------------------------------------------------------- */
/* NavigationController                                                       */
/* ------------------------------------------------------------------------- */

export class NavigationController {
  get mode(): NavigationMode {
    return this._mode;
  }

  /** True while the pointer is locked for mouse-look in fly mode. */
  get pointerLocked(): boolean {
    return document.pointerLockElement === this.domElement;
  }

  private readonly camera: THREE.PerspectiveCamera;
  private readonly domElement: HTMLElement;
  private readonly scene: THREE.Scene;
  private readonly getBoundsFn: ((target: THREE.Box3) => THREE.Box3) | null;
  private readonly resolveFrameFn: ((point: THREE.Vector3) => FocusFrame) | null;
  private readonly onModeChangeFn: ((mode: NavigationMode) => void) | null;

  private readonly controls: OrbitControls;
  private readonly raycaster = new THREE.Raycaster();
  private readonly bounds = new THREE.Box3();
  private readonly listenerSignal = new AbortController();

  private _mode: NavigationMode = 'orbit';
  private tween: CameraTween | null = null;
  private focusActive = false;
  private vignetteLevel = 0;

  private readonly keys = new Set<string>();
  private readonly flyVelocity = new THREE.Vector3();
  private speedMultiplier = 1;

  private lookYaw = 0;
  private lookPitch = 0;
  private lookYawTarget = 0;
  private lookPitchTarget = 0;

  private pendingPress: PendingPress | null = null;
  private hasBounds = false;

  private readonly hintEl: HTMLDivElement;
  private readonly vignetteEl: HTMLDivElement;

  constructor(options: NavigationControllerOptions) {
    this.camera = options.camera;
    this.domElement = options.domElement;
    this.scene = options.scene;
    this.getBoundsFn = options.getBounds ?? null;
    this.resolveFrameFn = options.resolveFocusFrame ?? null;
    this.onModeChangeFn = options.onModeChange ?? null;

    const container = options.hintContainer ?? document.body;

    this.controls = new OrbitControls(this.camera, this.domElement);
    this.controls.target.set(0, 1.2, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = ORBIT_DAMPING_FACTOR;
    this.controls.minDistance = ORBIT_MIN_DISTANCE;
    this.controls.maxDistance = ORBIT_MAX_DISTANCE;
    this.controls.minPolarAngle = ORBIT_MIN_POLAR_ANGLE;
    this.controls.maxPolarAngle = ORBIT_MAX_POLAR_ANGLE;
    this.controls.update();

    this.syncLookFromCamera();

    this.vignetteEl = createVignetteElement();
    this.hintEl = createHintElement();
    container.appendChild(this.vignetteEl);
    container.appendChild(this.hintEl);

    this.bindEvents();
    this.renderHint();
  }

  /* ----- Public API ------------------------------------------------------- */

  /** Eases the camera into the requested mode (no instant jumps). */
  setMode(mode: NavigationMode): void {
    if (mode === this._mode) return;
    // Let an in-flight mode hop finish before accepting another one.
    if (this.tween?.kind === 'mode') return;
    if (mode === 'fly') this.enterFly();
    else this.enterOrbit();
    this.renderHint();
    this.onModeChangeFn?.(this._mode);
  }

  toggleMode(): void {
    this.setMode(this._mode === 'fly' ? 'orbit' : 'fly');
  }

  /**
   * First-person eye-height preset: switches to fly mode if needed, then
   * eases the camera to standing height at its current spot.
   */
  applyFirstPersonPreset(): void {
    if (this._mode !== 'fly' || this.tween) {
      this.setMode('fly');
      return;
    }
    this.syncLookFromCamera();
    _euler.set(this.lookPitchTarget, this.lookYawTarget, 0, 'YXZ');
    _q1.setFromEuler(_euler);
    _v1.copy(this.camera.position);
    _v1.y = EYE_HEIGHT;
    this.clampCameraPoint(_v1);
    this.beginTween('mode', _v1.clone(), _q1.clone(), MODE_TWEEN_DURATION);
  }

  /**
   * Eases the camera into a close-up framing of `point` (world space) with
   * the depth-of-field-style vignette. Any movement input breaks out.
   */
  focusOn(point: THREE.Vector3): void {
    if (this._mode !== 'fly' || this.tween?.kind === 'mode') return;

    const frame = this.resolveFrameFn
      ? this.resolveFrameFn(point)
      : this.buildFallbackFrame(point);
    this.clampCameraPoint(frame.position);

    _matrix.lookAt(frame.position, frame.lookAt, WORLD_UP);
    _q1.setFromRotationMatrix(_matrix);

    const travel = this.camera.position.distanceTo(frame.position);
    const duration = THREE.MathUtils.clamp(
      0.5 + travel * FOCUS_TRAVEL_RATE,
      FOCUS_MIN_DURATION,
      FOCUS_MAX_DURATION,
    );
    this.beginTween('focus', frame.position.clone(), _q1.clone(), duration);
    this.focusActive = true;
  }

  /** Per-frame tick; call once before rendering with the frame delta. */
  update(dtRaw: number): void {
    const dt = THREE.MathUtils.clamp(dtRaw, 0, 0.05);
    this.refreshBounds();

    if (this.tween) this.stepTween(dt);
    else if (this._mode === 'fly') this.stepFly(dt);
    else this.stepOrbit(dt);

    this.stepVignette(dt);
  }

  dispose(): void {
    this.listenerSignal.abort();
    this.controls.dispose();
    this.exitPointerLock();
    this.hintEl.remove();
    this.vignetteEl.remove();
    this.keys.clear();
    this.tween = null;
    this.focusActive = false;
  }

  /* ----- Mode transitions --------------------------------------------------- */

  private enterFly(): void {
    this._mode = 'fly';
    this.controls.enabled = false;
    this.flyVelocity.set(0, 0, 0);
    this.clearFocus();
    this.syncLookFromCamera();
    this.lookPitchTarget = THREE.MathUtils.clamp(this.lookPitchTarget, -PITCH_LIMIT, PITCH_LIMIT);

    // First-person preset: same viewpoint, eased down to standing eye height.
    _euler.set(this.lookPitchTarget, this.lookYawTarget, 0, 'YXZ');
    _q1.setFromEuler(_euler);
    _v1.copy(this.camera.position);
    _v1.y = EYE_HEIGHT;
    this.clampCameraPoint(_v1);
    this.beginTween('mode', _v1.clone(), _q1.clone(), MODE_TWEEN_DURATION);
  }

  private enterOrbit(): void {
    this.clearFocus();
    this.exitPointerLock();
    this._mode = 'orbit';

    // Park the orbit pivot ahead of the current view so re-entering orbit
    // keeps looking at roughly the same thing, then satisfy the polar-angle
    // and distance limits analytically so OrbitControls never snaps.
    const camPos = this.camera.position.clone();
    const forward = this.camera.getWorldDirection(_v1).clone();
    if (forward.lengthSq() < 1e-8) forward.set(0, -0.35, -1).normalize();

    const target = camPos.clone().addScaledVector(forward, ORBIT_EXIT_DISTANCE);
    this.clampPointWithInset(target, ORBIT_TARGET_INSET);

    let dist = THREE.MathUtils.clamp(
      camPos.distanceTo(target),
      ORBIT_MIN_DISTANCE + 0.05,
      ORBIT_MAX_DISTANCE - 0.05,
    );
    target.sub(camPos).normalize().multiplyScalar(dist).add(camPos);

    const cosMax = Math.cos(ORBIT_MAX_POLAR_ANGLE);
    const cosMin = Math.cos(ORBIT_MIN_POLAR_ANGLE);
    target.y = Math.min(target.y, camPos.y - dist * cosMax - 1e-3);
    target.y = Math.max(target.y, camPos.y - dist * cosMin + 1e-3);

    this.controls.target.copy(target);
    this.controls.enabled = true;
    this.controls.update();
  }

  /* ----- Per-step integrators ------------------------------------------------ */

  private stepOrbit(dt: number): void {
    this.controls.update();
    if (!this.hasBounds) return;

    // Soft boundary clamp: relax the camera and pivot back into the shell.
    const relax = 1 - Math.exp(-ORBIT_BOUND_RELAX * dt);

    _v1.copy(this.camera.position);
    this.clampCameraPoint(_v1);
    this.camera.position.lerp(_v1, relax);

    _v1.copy(this.controls.target);
    this.clampPointWithInset(_v1, ORBIT_TARGET_INSET);
    this.controls.target.lerp(_v1, relax);
  }

  private stepFly(dt: number): void {
    // --- Look: exponential smoothing toward the pointer-lock targets. -------
    const lookK = 1 - Math.exp(-LOOK_SMOOTHING * dt);
    this.lookYaw = approachAngle(this.lookYaw, this.lookYawTarget, lookK);
    this.lookPitch = THREE.MathUtils.lerp(this.lookPitch, this.lookPitchTarget, lookK);
    _euler.set(this.lookPitch, this.lookYaw, 0, 'YXZ');
    _q1.setFromEuler(_euler);
    this.camera.quaternion.slerp(_q1, lookK);

    // --- Move: WASD relative to view direction, Q/E world vertical. ---------
    const forward = this.camera.getWorldDirection(_v1);
    if (forward.lengthSq() < 1e-8) forward.set(0, 0, -1);
    forward.normalize();
    const right = _v2.crossVectors(forward, WORLD_UP).normalize();

    const f = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0);
    const s = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);
    const u = (this.keys.has('KeyE') ? 1 : 0) - (this.keys.has('KeyQ') ? 1 : 0);

    const wish = _v1.set(0, 0, 0);
    wish.addScaledVector(forward, f).addScaledVector(right, s);
    wish.y += u;
    if (wish.lengthSq() > 1) wish.normalize();
    wish.multiplyScalar(FLY_BASE_SPEED * this.speedMultiplier);

    this.flyVelocity.lerp(wish, 1 - Math.exp(-FLY_ACCEL * dt));
    if (this.flyVelocity.lengthSq() < 1e-8) this.flyVelocity.set(0, 0, 0);

    this.camera.position.addScaledVector(this.flyVelocity, dt);
    // Hard clamp guarantees the shell is never escaped, even at speed.
    if (this.hasBounds) this.clampCameraPoint(this.camera.position);
  }

  private stepTween(dt: number): void {
    const tw = this.tween;
    if (!tw) return;
    tw.t += dt / tw.duration;
    const k = easeInOutCubic(Math.min(tw.t, 1));

    this.camera.position.lerpVectors(tw.fromPos, tw.toPos, k);
    this.camera.quaternion.slerpQuaternions(tw.fromQuat, tw.toQuat, k);

    if (tw.t >= 1) {
      this.tween = null;
      if (this._mode === 'fly') this.syncLookFromCamera();
      if (tw.kind === 'focus' && this._mode !== 'fly') this.focusActive = false;
    }
  }

  private stepVignette(dt: number): void {
    const target = this.focusActive ? VIGNETTE_OPACITY : 0;
    this.vignetteLevel = THREE.MathUtils.damp(this.vignetteLevel, target, VIGNETTE_EASE_RATE, dt);
    if (Math.abs(this.vignetteLevel - target) < 0.001) this.vignetteLevel = target;
    this.vignetteEl.style.opacity = this.vignetteLevel.toFixed(3);
  }

  /* ----- Focus plumbing ------------------------------------------------------ */

  private clearFocus(): void {
    if (this.tween?.kind === 'focus') {
      // Hand control back exactly where the interrupted ease stopped.
      this.syncLookFromCamera();
      this.tween = null;
    }
    this.focusActive = false;
  }

  private buildFallbackFrame(point: THREE.Vector3): FocusFrame {
    _v1.copy(this.camera.position).sub(point);
    if (_v1.lengthSq() < 1e-6) _v1.set(0.45, 0.5, 1);
    _v1.normalize();
    return {
      position: point.clone().addScaledVector(_v1, FOCUS_FALLBACK_DISTANCE),
      lookAt: point.clone(),
    };
  }

  private pickFocusAt(clientX: number, clientY: number): void {
    const rect = this.domElement.getBoundingClientRect();
    _ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(_ndc, this.camera);
    const hits = this.raycaster.intersectObject(this.scene, true);
    for (const hit of hits) {
      if (!this.isVisibleChain(hit.object)) continue;
      this.focusOn(hit.point);
      return;
    }
  }

  private isVisibleChain(object: THREE.Object3D): boolean {
    let node: THREE.Object3D | null = object;
    while (node) {
      if (!node.visible) return false;
      node = node.parent;
    }
    return true;
  }

  /* ----- Bounds --------------------------------------------------------------- */

  private refreshBounds(): void {
    if (!this.getBoundsFn) {
      this.hasBounds = false;
      return;
    }
    this.getBoundsFn(this.bounds);
    this.hasBounds = !this.bounds.isEmpty();
  }

  /** Clamps a camera/eye point into the interior volume (mutates + returns). */
  private clampCameraPoint(point: THREE.Vector3): THREE.Vector3 {
    if (!this.hasBounds) return point;
    return this.clampPointWithInset(point, BOUNDS_INSET);
  }

  private clampPointWithInset(point: THREE.Vector3, inset: number): THREE.Vector3 {
    const minX = this.bounds.min.x + inset;
    const maxX = this.bounds.max.x - inset;
    const minZ = this.bounds.min.z + inset;
    const maxZ = this.bounds.max.z - inset;
    const minY = this.bounds.min.y + (inset === BOUNDS_INSET ? EYE_MIN_ABOVE_FLOOR : inset);
    const maxY =
      this.bounds.max.y - (inset === BOUNDS_INSET ? EYE_MAX_BELOW_CEILING : inset);

    if (maxX > minX) point.x = THREE.MathUtils.clamp(point.x, minX, maxX);
    if (maxZ > minZ) point.z = THREE.MathUtils.clamp(point.z, minZ, maxZ);
    if (maxY > minY) point.y = THREE.MathUtils.clamp(point.y, minY, maxY);
    return point;
  }

  /* ----- Input wiring (canvas-only pointers) ---------------------------------- */

  private bindEvents(): void {
    const signal = this.listenerSignal.signal;

    this.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e), { signal });
    this.domElement.addEventListener('pointerup', (e) => this.onPointerUp(e), { signal });
    this.domElement.addEventListener('wheel', (e) => this.onWheel(e), { signal, passive: false });

    document.addEventListener('mousemove', (e) => this.onMouseMove(e), { signal });
    document.addEventListener('pointerlockchange', () => this.onLockChange(), { signal });
    window.addEventListener('keydown', (e) => this.onKeyDown(e), { signal });
    window.addEventListener('keyup', (e) => this.onKeyUp(e), { signal });
    window.addEventListener('blur', () => this.keys.clear(), { signal });
  }

  private onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT')
    ) {
      return; // Never steal keys from form controls (e.g. the timeline slider).
    }

    const code = KEY_ALIASES[event.code] ?? event.code;

    if (code === 'Tab') {
      event.preventDefault();
      this.toggleMode();
      return;
    }

    if (MOVE_KEYS.has(code)) {
      if (this.focusActive) this.clearFocus();
      this.keys.add(code);
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(KEY_ALIASES[event.code] ?? event.code);
  }

  private onMouseMove(event: MouseEvent): void {
    if (this._mode !== 'fly' || !this.pointerLocked) return;
    const dx = event.movementX || 0;
    const dy = event.movementY || 0;
    if (dx === 0 && dy === 0) return;

    if (this.focusActive && Math.abs(dx) + Math.abs(dy) >= FOCUS_BREAK_PIXELS) {
      this.clearFocus();
    }
    this.lookYawTarget -= dx * MOUSE_SENSITIVITY;
    this.lookPitchTarget = THREE.MathUtils.clamp(
      this.lookPitchTarget - dy * MOUSE_SENSITIVITY,
      -PITCH_LIMIT,
      PITCH_LIMIT,
    );
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.pendingPress = { x: event.clientX, y: event.clientY, time: performance.now() };
  }

  private onPointerUp(event: PointerEvent): void {
    const press = this.pendingPress;
    this.pendingPress = null;
    if (!press || event.button !== 0) return;
    if (performance.now() - press.time > CLICK_MAX_MS) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > CLICK_MAX_DRIFT_PX) return;
    if (this._mode !== 'fly' || this.tween?.kind === 'mode') return;

    // First click captures the mouse; captured clicks inspect props.
    if (!this.pointerLocked) {
      this.requestPointerLock();
      return;
    }
    this.pickFocusAt(event.clientX, event.clientY);
  }

  private onWheel(event: WheelEvent): void {
    if (this._mode !== 'fly') return; // Orbit mode keeps native zoom.
    event.preventDefault();
    const dir = Math.sign(event.deltaY);
    if (dir === 0) return;
    this.speedMultiplier = THREE.MathUtils.clamp(
      this.speedMultiplier * (dir > 0 ? 1 / FLY_SPEED_STEP : FLY_SPEED_STEP),
      FLY_MIN_SPEED,
      FLY_MAX_SPEED,
    );
    this.renderHint();
  }

  private onLockChange(): void {
    this.renderHint();
  }

  private requestPointerLock(): void {
    try {
      const result = (
        this.domElement as HTMLElement & { requestPointerLock(): unknown }
      ).requestPointerLock();
      if (result instanceof Promise) result.catch(() => {});
    } catch {
      // Pointer lock unavailable (iframe policy etc.) — fly keys still work.
    }
  }

  private exitPointerLock(): void {
    if (this.pointerLocked) document.exitPointerLock();
  }

  /* ----- Presentation ---------------------------------------------------------- */

  private beginTween(
    kind: CameraTween['kind'],
    toPos: THREE.Vector3,
    toQuat: THREE.Quaternion,
    duration: number,
  ): void {
    this.tween = {
      kind,
      t: 0,
      duration,
      fromPos: this.camera.position.clone(),
      toPos,
      fromQuat: this.camera.quaternion.clone(),
      toQuat,
    };
  }

  private syncLookFromCamera(): void {
    _euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.lookYaw = _euler.y;
    this.lookPitch = THREE.MathUtils.clamp(_euler.x, -PITCH_LIMIT, PITCH_LIMIT);
    this.lookYawTarget = this.lookYaw;
    this.lookPitchTarget = this.lookPitch;
  }

  private renderHint(): void {
    const el = this.hintEl;
    const modeLabel =
      this._mode === 'fly'
        ? 'FREE-FLY'
        : 'ORBIT';

    let controlsHtml: string;
    if (this._mode === 'orbit') {
      controlsHtml =
        '<kbd>drag</kbd><span>rotate</span>' +
        '<kbd>scroll</kbd><span>zoom</span>' +
        '<kbd>right-drag</kbd><span>pan</span>' +
        '<kbd>Tab</kbd><span>free-fly</span>';
    } else {
      const speedHtml = `<kbd>scroll</kbd><span>speed ×${this.speedMultiplier.toFixed(1)}</span>`;
      controlsHtml = this.pointerLocked
        ? '<kbd>W A S D</kbd><span>move</span>' +
          '<kbd>Q</kbd><span>down</span><kbd>E</kbd><span>up</span>' +
          `${speedHtml}` +
          '<kbd>click</kbd><span>inspect prop</span>' +
          '<kbd>Tab</kbd><span>orbit</span>'
        : '<kbd>click</kbd><span>capture mouse</span>' +
          '<kbd>W A S D</kbd><span>move</span>' +
          '<kbd>Q / E</kbd><span>down / up</span>' +
          `${speedHtml}` +
          '<kbd>Tab</kbd><span>orbit</span>';
    }

    el.className = `nav-hint nav-hint--${this._mode}`;
    el.innerHTML = `<span class="nav-hint__mode">${modeLabel}</span>` +
      `<span class="nav-hint__controls">${controlsHtml}</span>`;
  }
}
