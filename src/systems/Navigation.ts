/**
 * Navigation — camera rig with orbit/pan/zoom and a first-person "walk up
 * close" mode, clamped to interior collision bounds.
 *
 * The camera is treated as a sphere of `collisionMargin` radius inside an
 * interior AABB (the café's walls/floor/ceiling), so it can never clip through
 * the shell. All motion is exponentially damped for smooth starts and stops.
 *
 * Controls (listeners are wired to the renderer canvas):
 *   Orbit mode: left-drag rotate · right/middle-drag pan · wheel/pinch zoom ·
 *               arrow keys / WASD pan the view.
 *   Walk mode:  drag to look · arrow keys / WASD to move · wheel to step ·
 *               F toggles between modes.
 *
 * The canvas is focusable (`tabIndex = 0`) so keyboard access works: click the
 * scene once, then arrow keys navigate.
 */
import * as THREE from 'three';

/** Interior bounding volume of the café shell (walls / floor / ceiling). */
export interface CaféBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export type NavigationMode = 'orbit' | 'walk';

export interface NavigationOptions {
  /** Interior AABB the camera is clamped inside. */
  bounds: CaféBounds;
  /** Camera "body" radius kept clear of walls/floor/ceiling. */
  collisionMargin?: number;
  /** Minimum orbit distance from the target (prevents clipping the subject). */
  minRadius?: number;
  /** Maximum orbit distance from the target. */
  maxRadius?: number;
  /** Rotation sensitivity (radians per pixel factor). */
  rotateSpeed?: number;
  /** Pan sensitivity (world units per pixel factor). */
  panSpeed?: number;
  /** Wheel zoom sensitivity. */
  zoomSpeed?: number;
  /** Walk / keyboard pan speed in world units per second. */
  walkSpeed?: number;
  /** Exponential damping rate (1/s). Higher is snappier, lower is floatier. */
  dampingRate?: number;
  /** Walk-mode eye height above the floor. */
  eyeHeight?: number;
  /** Orbit target used on construction / reset. Defaults to bounds centre. */
  initialTarget?: THREE.Vector3;
  /** Orbit radius used on construction / reset. */
  initialRadius?: number;
  /** Called whenever the mode changes (useful for UI hints). */
  onModeChange?: (mode: NavigationMode) => void;
}

const UP = new THREE.Vector3(0, 1, 0);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class Navigation {
  readonly camera: THREE.PerspectiveCamera;
  readonly domElement: HTMLElement;
  mode: NavigationMode = 'orbit';

  private bounds: CaféBounds;
  private collisionMargin: number;
  private minRadius: number;
  private maxRadius: number;
  private rotateSpeed: number;
  private panSpeed: number;
  private zoomSpeed: number;
  private walkSpeed: number;
  private dampingRate: number;
  private eyeHeight: number;
  private readonly onModeChange?: (mode: NavigationMode) => void;

  private readonly initialTarget: THREE.Vector3;
  private readonly initialRadius: number;

  /** Interior limits inset by the collision margin (safe for the camera). */
  private safeMinX = 0;
  private safeMaxX = 0;
  private safeMinY = 0;
  private safeMaxY = 0;
  private safeMinZ = 0;
  private safeMaxZ = 0;

  /** Orbit rig state. */
  private readonly target = new THREE.Vector3();
  private readonly spherical = new THREE.Spherical();
  /** Walk rig state. */
  private readonly euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private yaw = 0;
  private pitch = 0;
  private walkMinY = 0;

  /** Damped motion accumulators. */
  private readonly moveVelocity = new THREE.Vector3();
  private readonly rotateVelocity = new THREE.Vector2();
  private readonly lookVelocity = new THREE.Vector2();
  private dollyVelocity = 0;

  private readonly keys = new Set<string>();
  private readonly activePointers = new Map<number, { x: number; y: number }>();
  private pointerAction: 'none' | 'pan' | 'orbit' | 'look' = 'none';
  private lastPinchDist: number | null = null;
  private lastPinchMid: { x: number; y: number } | null = null;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    options: NavigationOptions,
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.bounds = { ...options.bounds };
    this.collisionMargin = options.collisionMargin ?? 0.25;
    this.minRadius = options.minRadius ?? 0.6;
    this.maxRadius = options.maxRadius ?? 30;
    this.rotateSpeed = options.rotateSpeed ?? 1;
    this.panSpeed = options.panSpeed ?? 1;
    this.zoomSpeed = options.zoomSpeed ?? 1;
    this.walkSpeed = options.walkSpeed ?? 2.6;
    this.dampingRate = options.dampingRate ?? 9;
    this.eyeHeight = options.eyeHeight ?? 1.6;
    this.onModeChange = options.onModeChange;

    const midX = (this.bounds.minX + this.bounds.maxX) / 2;
    const midY = (this.bounds.minY + this.bounds.maxY) / 2;
    const midZ = (this.bounds.minZ + this.bounds.maxZ) / 2;
    this.initialTarget = options.initialTarget?.clone() ?? new THREE.Vector3(midX, midY, midZ);
    this.initialRadius = options.initialRadius ?? Math.min(3.2, this.maxRadius);

    this.recomputeSafeLimits();
    this.walkMinY = clamp(this.bounds.minY + this.eyeHeight, this.safeMinY, this.safeMaxY);
    this.reset();

    // Keyboard accessibility: make the canvas focusable and announce it.
    domElement.tabIndex = 0;
    domElement.setAttribute?.(
      'aria-label',
      'Café navigation viewport — drag to orbit, right-drag to pan, scroll to zoom; press F to toggle walk mode; arrow keys to move.',
    );
    if (domElement.style) domElement.style.touchAction = 'none';

    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('pointermove', this.onPointerMove);
    domElement.addEventListener('pointerup', this.onPointerUp);
    domElement.addEventListener('pointercancel', this.onPointerUp);
    domElement.addEventListener('wheel', this.onWheel, { passive: false });
    domElement.addEventListener('contextmenu', this.onContextMenu);
    domElement.addEventListener('keydown', this.onKeyDown);
    domElement.addEventListener('keyup', this.onKeyUp);
    domElement.addEventListener('blur', this.onBlur);
  }

  /** Advance the rig by `dt` seconds (call once per frame). */
  update(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const t = Math.min(dt, 0.1);
    const decay = Math.exp(-this.dampingRate * t);
    if (this.mode === 'orbit') {
      this.updateOrbit(t, decay);
    } else {
      this.updateWalk(t, decay);
    }
  }

  /** Switch between 'orbit' and 'walk' modes. */
  setMode(mode: NavigationMode): void {
    if (mode === this.mode) return;
    if (mode === 'walk') {
      // Preserve the current view direction, then clamp to the walk volume.
      this.deriveYawPitchFromCamera();
      this.clampPosition(this.camera.position, this.walkMinY);
    } else {
      // Anchor the orbit target on the point currently being looked at.
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      this.target.copy(this.camera.position).addScaledVector(dir, this.spherical.radius);
      this.clampTarget();
      this.spherical.setFromVector3(this.camera.position.clone().sub(this.target));
      this.placeOrbitCamera();
    }
    this.mode = mode;
    this.moveVelocity.set(0, 0, 0);
    this.rotateVelocity.set(0, 0);
    this.lookVelocity.set(0, 0);
    this.dollyVelocity = 0;
    this.keys.clear();
    this.onModeChange?.(mode);
  }

  /** Toggle between 'orbit' and 'walk' modes (also bound to the F key). */
  toggleMode(): void {
    this.setMode(this.mode === 'orbit' ? 'walk' : 'orbit');
  }

  /** Restore the initial orbit rig (target, radius, view). */
  reset(): void {
    this.target.copy(this.initialTarget);
    this.clampTarget();
    this.spherical.set(clamp(this.initialRadius, this.minRadius, this.maxRadius), 1.15, 0.5);
    this.placeOrbitCamera();
    this.moveVelocity.set(0, 0, 0);
    this.rotateVelocity.set(0, 0);
    this.lookVelocity.set(0, 0);
    this.dollyVelocity = 0;
    this.keys.clear();
  }

  /** Current interior bounds (copy). */
  getBounds(): CaféBounds {
    return { ...this.bounds };
  }

  /** Replace the interior bounds and immediately re-clamp the camera. */
  setBounds(bounds: CaféBounds): void {
    this.bounds = { ...bounds };
    this.recomputeSafeLimits();
    this.walkMinY = clamp(this.bounds.minY + this.eyeHeight, this.safeMinY, this.safeMaxY);
    this.clampTarget();
    this.clampPosition(this.camera.position, this.mode === 'walk' ? this.walkMinY : undefined);
    if (this.mode === 'orbit') this.camera.lookAt(this.target);
  }

  /** Focus the canvas so keyboard navigation works. */
  focus(): void {
    this.domElement.focus?.({ preventScroll: true });
  }

  /** Remove every listener this rig attached. */
  dispose(): void {
    this.keys.clear();
    this.activePointers.clear();
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('pointercancel', this.onPointerUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.domElement.removeEventListener('keydown', this.onKeyDown);
    this.domElement.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('blur', this.onBlur);
  }

  // --- Orbit mode ----------------------------------------------------------

  private updateOrbit(t: number, decay: number): void {
    const s = this.spherical;

    // Rotation (drag).
    s.theta += this.rotateVelocity.x * t;
    s.phi += this.rotateVelocity.y * t;
    s.phi = clamp(s.phi, 0.1, Math.PI - 0.1);

    // Pan (right-drag, two-finger drag, arrow keys).
    const keyTarget = this.computeKeyVelocity();
    this.moveVelocity.multiplyScalar(decay);
    this.moveVelocity.addScaledVector(keyTarget, 1 - decay);
    this.target.addScaledVector(this.moveVelocity, t);
    this.clampTarget();

    // Zoom (wheel / pinch).
    s.radius = clamp(s.radius * Math.exp(this.dollyVelocity * t), this.minRadius, this.maxRadius);

    // Place the camera, clamp it into the interior shell, and re-derive the
    // spherical rig so the clamped position stays authoritative. Collision
    // safety wins over the configured min/max radius: a camera pressed against
    // a wall is never re-expanded out through it.
    this.placeOrbitCamera();
    this.rotateVelocity.multiplyScalar(decay);
    this.dollyVelocity *= decay;
  }

  /** Position the camera from the orbit rig, clamp it, then re-derive the rig. */
  private placeOrbitCamera(): void {
    this.camera.position.copy(this.target).add(new THREE.Vector3().setFromSpherical(this.spherical));
    this.clampPosition(this.camera.position);
    this.spherical.setFromVector3(this.camera.position.clone().sub(this.target));
    this.camera.lookAt(this.target);
  }

  // --- Walk mode -----------------------------------------------------------

  private updateWalk(t: number, decay: number): void {
    const keyTarget = this.computeKeyVelocity();
    this.moveVelocity.multiplyScalar(decay);
    this.moveVelocity.addScaledVector(keyTarget, 1 - decay);
    this.camera.position.addScaledVector(this.moveVelocity, t);
    this.clampPosition(this.camera.position, this.walkMinY);

    this.yaw += this.lookVelocity.x * t;
    this.pitch += this.lookVelocity.y * t;
    this.pitch = clamp(this.pitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    this.camera.quaternion.setFromEuler(this.euler.set(this.pitch, this.yaw, 0, 'YXZ'));

    this.lookVelocity.multiplyScalar(decay);
  }

  // --- Shared helpers ------------------------------------------------------

  /** Velocity from held movement keys (arrow keys + WASD), in units/s. */
  private computeKeyVelocity(): THREE.Vector3 {
    const forward = this.keys.has('ArrowUp') || this.keys.has('KeyW') ? 1 : 0;
    const back = this.keys.has('ArrowDown') || this.keys.has('KeyS') ? 1 : 0;
    const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0;
    const right = this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0;
    const dir = new THREE.Vector3();
    dir.addScaledVector(this.horizontalForward(), forward - back);
    dir.addScaledVector(this.rightVector(), right - left);
    if (dir.lengthSq() > 0) dir.normalize();
    return dir.multiplyScalar(this.walkSpeed);
  }

  /** Camera forward direction projected onto the horizontal plane. */
  private horizontalForward(): THREE.Vector3 {
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    fwd.y = 0;
    if (fwd.lengthSq() < 1e-8) fwd.set(0, 0, -1);
    return fwd.normalize();
  }

  /** Camera right direction (horizontal). */
  private rightVector(): THREE.Vector3 {
    return new THREE.Vector3().crossVectors(this.horizontalForward(), UP).normalize();
  }

  private clampTarget(): void {
    this.target.x = clamp(this.target.x, this.safeMinX, this.safeMaxX);
    this.target.y = clamp(this.target.y, this.safeMinY, this.safeMaxY);
    this.target.z = clamp(this.target.z, this.safeMinZ, this.safeMaxZ);
  }

  private clampPosition(position: THREE.Vector3, minYOverride?: number): void {
    position.x = clamp(position.x, this.safeMinX, this.safeMaxX);
    position.y = clamp(position.y, minYOverride ?? this.safeMinY, this.safeMaxY);
    position.z = clamp(position.z, this.safeMinZ, this.safeMaxZ);
  }

  private recomputeSafeLimits(): void {
    const m = this.collisionMargin;
    const b = this.bounds;
    this.safeMinX = Math.min(b.minX + m, (b.minX + b.maxX) / 2);
    this.safeMaxX = Math.max(b.maxX - m, (b.minX + b.maxX) / 2);
    this.safeMinY = Math.min(b.minY + m, (b.minY + b.maxY) / 2);
    this.safeMaxY = Math.max(b.maxY - m, (b.minY + b.maxY) / 2);
    this.safeMinZ = Math.min(b.minZ + m, (b.minZ + b.maxZ) / 2);
    this.safeMaxZ = Math.max(b.maxZ - m, (b.minZ + b.maxZ) / 2);
  }

  private deriveYawPitchFromCamera(): void {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.yaw = Math.atan2(-dir.x, -dir.z);
    this.pitch = Math.asin(clamp(dir.y, -1, 1));
  }

  // --- Pointer / wheel / keyboard listeners --------------------------------

  private onPointerDown = (event: PointerEvent): void => {
    this.domElement.focus?.({ preventScroll: true });
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (event.pointerType === 'mouse' && (event.button === 1 || event.button === 2)) {
      this.pointerAction = 'pan';
    } else {
      this.pointerAction = this.mode === 'orbit' ? 'orbit' : 'look';
    }
    if (this.activePointers.size >= 2) {
      this.lastPinchDist = null;
      this.lastPinchMid = null;
    }
    event.preventDefault?.();
    try {
      this.domElement.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is best-effort; dragging still works without it.
    }
  };

  private onPointerMove = (event: PointerEvent): void => {
    const current = this.activePointers.get(event.pointerId);
    if (!current) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    current.x = event.clientX;
    current.y = event.clientY;

    if (this.activePointers.size >= 2) {
      this.handleMultiTouch();
      return;
    }
    this.lastPinchDist = null;
    this.lastPinchMid = null;

    if (this.pointerAction === 'pan') {
      this.applyPanImpulse(dx, dy);
    } else if (this.pointerAction === 'orbit') {
      this.rotateVelocity.x -= dx * this.rotateSpeed * 0.004;
      this.rotateVelocity.y -= dy * this.rotateSpeed * 0.004;
    } else if (this.pointerAction === 'look') {
      this.lookVelocity.x -= dx * this.rotateSpeed * 0.004;
      this.lookVelocity.y -= dy * this.rotateSpeed * 0.004;
    }
  };

  private onPointerUp = (event: PointerEvent): void => {
    this.activePointers.delete(event.pointerId);
    if (this.activePointers.size === 0) {
      this.pointerAction = 'none';
      this.lastPinchDist = null;
      this.lastPinchMid = null;
    }
    event.preventDefault?.();
    try {
      this.domElement.releasePointerCapture?.(event.pointerId);
    } catch {
      // Best-effort.
    }
  };

  /** Two-finger touch: pinch zooms / steps, midpoint drag pans / moves. */
  private handleMultiTouch(): void {
    const points = [...this.activePointers.values()];
    if (points.length < 2) return;
    const [a, b] = points;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if (this.lastPinchDist !== null && this.lastPinchMid !== null) {
      const ratio = dist / this.lastPinchDist;
      const midDx = mid.x - this.lastPinchMid.x;
      const midDy = mid.y - this.lastPinchMid.y;
      if (this.mode === 'orbit') {
        this.dollyVelocity += Math.log(ratio) * 4;
        this.applyPanImpulse(midDx, midDy);
      } else {
        const fwd = this.horizontalForward();
        const right = this.rightVector();
        this.moveVelocity.addScaledVector(fwd, -midDy * 0.02 * this.walkSpeed);
        this.moveVelocity.addScaledVector(right, -midDx * 0.02 * this.walkSpeed);
      }
    }
    this.lastPinchDist = dist;
    this.lastPinchMid = mid;
  }

  /** Screen-space pan impulse applied to the orbit target (grab-the-world). */
  private applyPanImpulse(dx: number, dy: number): void {
    const scale = this.panSpeed * 0.01 * Math.max(this.spherical.radius, 1);
    const right = this.rightVector();
    const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
    this.moveVelocity.addScaledVector(right, dx * scale);
    this.moveVelocity.addScaledVector(up, -dy * scale);
  }

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault?.();
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    if (this.mode === 'orbit') {
      this.dollyVelocity += delta * this.zoomSpeed * 0.002;
    } else {
      const fwd = this.horizontalForward();
      this.moveVelocity.addScaledVector(fwd, -delta * this.walkSpeed * 0.006);
    }
  };

  private onContextMenu = (event: Event): void => {
    event.preventDefault?.();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'KeyF' && !event.repeat) {
      this.toggleMode();
      return;
    }
    if (event.code.startsWith('Arrow')) event.preventDefault?.();
    this.keys.add(event.code);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private onBlur = (): void => {
    this.keys.clear();
  };
}
