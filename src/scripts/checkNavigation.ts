/**
 * QA gate: `npm run check:navigation`
 *
 * Headless (no WebGL) verification of the Navigation rig:
 *   - the camera never leaves the interior bounds (walls/floor/ceiling) under
 *     aggressive orbit rotation, zoom, pan, pinch-free pointer drags and keys;
 *   - walk mode keeps the camera at eye height above the floor;
 *   - mode toggling, bounds replacement and reset keep the rig valid;
 *   - listeners are wired to the canvas element and cleaned up by dispose().
 *
 * Exits non-zero on any assertion failure.
 */
import * as THREE from 'three';
import { Navigation, type CaféBounds } from '../systems/Navigation';

const BOUNDS: CaféBounds = { minX: -7, maxX: 7, minY: 0, maxY: 4, minZ: -5.5, maxZ: 5.5 };
const MARGIN = 0.25;
const EPS = 1e-6;

/** Minimal DOM stub that records listeners so the rig can be driven headless. */
type AnyListener = (event: any) => void;

class FakeDom {
  tabIndex = -1;
  focused = false;
  style: Record<string, string> = {};
  private listeners = new Map<string, AnyListener[]>();
  private attributes: Record<string, string> = {};

  addEventListener(type: string, listener: AnyListener): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  removeEventListener(type: string, listener: AnyListener): void {
    const list = (this.listeners.get(type) ?? []).filter((l) => l !== listener);
    this.listeners.set(type, list);
  }

  dispatch(type: string, event: unknown): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }

  listenerCount(type: string): number {
    return (this.listeners.get(type) ?? []).length;
  }

  setAttribute(_name: string, _value: string): void {
    this.attributes[_name] = _value;
  }

  focus(): void {
    this.focused = true;
  }

  setPointerCapture(): void {
    // No-op for headless simulation.
  }

  releasePointerCapture(): void {
    // No-op for headless simulation.
  }
}

function makeCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
  camera.position.set(8, 6, 12);
  return camera;
}

function makeDom(): FakeDom {
  return new FakeDom();
}

function checkInside(message: string, position: THREE.Vector3, bounds: CaféBounds = BOUNDS): void {
  const fail = (axis: string, value: number, min: number, max: number): never => {
    throw new Error(`${message}: ${axis}=${value.toFixed(4)} outside [${min.toFixed(4)}, ${max.toFixed(4)}]`);
  };
  if (position.x < bounds.minX + MARGIN - EPS || position.x > bounds.maxX - MARGIN + EPS) {
    fail('x', position.x, bounds.minX + MARGIN, bounds.maxX - MARGIN);
  }
  if (position.y < bounds.minY + MARGIN - EPS || position.y > bounds.maxY - MARGIN + EPS) {
    fail('y', position.y, bounds.minY + MARGIN, bounds.maxY - MARGIN);
  }
  if (position.z < bounds.minZ + MARGIN - EPS || position.z > bounds.maxZ - MARGIN + EPS) {
    fail('z', position.z, bounds.minZ + MARGIN, bounds.maxZ - MARGIN);
  }
}

function tick(navigation: Navigation, ticks: number, dt = 1 / 60): void {
  for (let i = 0; i < ticks; i += 1) navigation.update(dt);
}

function simulateDrag(
  dom: FakeDom,
  button: number,
  startX: number,
  startY: number,
  steps: Array<[number, number]>,
): void {
  dom.dispatch('pointerdown', { pointerId: 1, pointerType: 'mouse', button, clientX: startX, clientY: startY });
  for (const [x, y] of steps) {
    dom.dispatch('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: x, clientY: y });
  }
  dom.dispatch('pointerup', { pointerId: 1, pointerType: 'mouse' });
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

  // 1. Construction places the camera inside the interior bounds.
  {
    const camera = makeCamera();
    const dom = makeDom();
    const nav = new Navigation(camera, dom as unknown as HTMLElement, { bounds: BOUNDS });
    checkInside('constructor camera', camera.position);
    assert(dom.tabIndex === 0, 'canvas is focusable (tabIndex=0)');
    assert(dom.listenerCount('pointerdown') === 1, 'pointerdown listener wired');
    assert(dom.listenerCount('wheel') === 1, 'wheel listener wired');
    assert(dom.listenerCount('keydown') === 1, 'keydown listener wired');
    nav.dispose();
    assert(dom.listenerCount('pointerdown') === 0, 'dispose removes pointer listeners');
    assert(dom.listenerCount('wheel') === 0, 'dispose removes wheel listener');
    assert(dom.listenerCount('keydown') === 0, 'dispose removes key listeners');
  }

  // 2. Aggressive orbit rotate + zoom + pan never leaves the interior.
  {
    const camera = makeCamera();
    const dom = makeDom();
    const nav = new Navigation(camera, dom as unknown as HTMLElement, { bounds: BOUNDS });
    for (let round = 0; round < 3; round += 1) {
      simulateDrag(dom, 0, 200, 200, [
        [700, 80],
        [40, 640],
        [780, 20],
        [10, 700],
      ]);
      simulateDrag(dom, 2, 300, 300, [
        [520, 260],
        [120, 380],
        [640, 160],
      ]);
      dom.dispatch('wheel', { preventDefault: () => {}, deltaMode: 0, deltaY: -1200 });
      tick(nav, 240);
      checkInside(`orbit round ${round}`, camera.position);
    }
    assert(true, `orbit stays inside bounds (rounds=${3})`);
    nav.dispose();
  }

  // 3. Extreme zoom-in clamps at the minimum radius without clipping.
  {
    const camera = makeCamera();
    const dom = makeDom();
    const nav = new Navigation(camera, dom as unknown as HTMLElement, { bounds: BOUNDS });
    for (let i = 0; i < 60; i += 1) {
      dom.dispatch('wheel', { preventDefault: () => {}, deltaMode: 0, deltaY: -400 });
      tick(nav, 1);
    }
    checkInside('extreme zoom-in', camera.position);
    assert(true, 'zoom-in stays inside bounds');
    nav.dispose();
  }

  // 3b. Target pinned near a corner + zoomed fully in must not push the camera
  // through the walls when the min-radius expansion would exceed the safe box.
  {
    const camera = makeCamera();
    const dom = makeDom();
    const nav = new Navigation(camera, dom as unknown as HTMLElement, {
      bounds: BOUNDS,
      minRadius: 1.5,
    });
    // Walk against the far corner, then switch to orbit: the orbit target
    // anchors near the corner and the radius shrinks to the configured min.
    nav.setMode('walk');
    dom.dispatch('keydown', { code: 'ArrowUp', repeat: false });
    dom.dispatch('keydown', { code: 'ArrowLeft', repeat: false });
    tick(nav, 600);
    dom.dispatch('keyup', { code: 'ArrowUp' });
    dom.dispatch('keyup', { code: 'ArrowLeft' });
    nav.setMode('orbit');
    for (let i = 0; i < 40; i += 1) {
      dom.dispatch('wheel', { preventDefault: () => {}, deltaMode: 0, deltaY: -400 });
      tick(nav, 1);
    }
    checkInside('corner-clamped zoom-in', camera.position);
    assert(true, 'min-radius re-expansion never pushes the camera through a wall');
    nav.dispose();
  }

  // 4. Arrow keys move the camera (orbit pans, walk moves) and stay clamped.
  {
    const camera = makeCamera();
    const dom = makeDom();
    const nav = new Navigation(camera, dom as unknown as HTMLElement, { bounds: BOUNDS });
    dom.dispatch('keydown', { code: 'ArrowUp', repeat: false });
    tick(nav, 90);
    dom.dispatch('keydown', { code: 'ArrowRight', repeat: false });
    tick(nav, 90);
    dom.dispatch('keyup', { code: 'ArrowUp' });
    dom.dispatch('keyup', { code: 'ArrowRight' });
    checkInside('orbit keyboard pan', camera.position);
    assert(true, 'orbit keyboard movement stays inside bounds');

    nav.setMode('walk');
    assert(nav.mode === 'walk', 'setMode switches to walk');
    dom.dispatch('keydown', { code: 'ArrowUp', repeat: false });
    tick(nav, 240);
    dom.dispatch('keyup', { code: 'ArrowUp' });
    checkInside('walk keyboard move', camera.position);
    assert(
      camera.position.y >= BOUNDS.minY + MARGIN + 1.0,
      `walk keeps eye height above floor (y=${camera.position.y.toFixed(2)})`,
    );
    nav.setMode('orbit');
    assert(nav.mode === 'orbit', 'setMode switches back to orbit');
    nav.dispose();
  }

  // 5. Blur clears held keys (no drift after focus loss).
  {
    const camera = makeCamera();
    const dom = makeDom();
    const nav = new Navigation(camera, dom as unknown as HTMLElement, { bounds: BOUNDS });
    const before = camera.position.clone();
    dom.dispatch('keydown', { code: 'ArrowUp', repeat: false });
    dom.dispatch('blur', {});
    tick(nav, 120);
    assert(
      camera.position.distanceTo(before) < 0.01,
      'blur clears held keys (camera does not drift)',
    );
    nav.dispose();
  }

  // 6. Bounds replacement re-clamps immediately.
  {
    const camera = makeCamera();
    const dom = makeDom();
    const nav = new Navigation(camera, dom as unknown as HTMLElement, { bounds: BOUNDS });
    const small: CaféBounds = { minX: -3, maxX: 3, minY: 0, maxY: 3, minZ: -2, maxZ: 2 };
    nav.setBounds(small);
    checkInside('setBounds re-clamp', camera.position, small);
    assert(true, 'setBounds keeps the camera inside the new interior');
    nav.dispose();
  }

  // 7. Reset restores a valid interior pose.
  {
    const camera = makeCamera();
    const dom = makeDom();
    const nav = new Navigation(camera, dom as unknown as HTMLElement, { bounds: BOUNDS });
    simulateDrag(dom, 0, 100, 100, [[900, 600]]);
    tick(nav, 120);
    nav.reset();
    checkInside('reset pose', camera.position);
    assert(true, 'reset places the camera inside the interior');
    nav.dispose();
  }

  // 8. Non-positive dt is ignored (no NaN drift).
  {
    const camera = makeCamera();
    const dom = makeDom();
    const nav = new Navigation(camera, dom as unknown as HTMLElement, { bounds: BOUNDS });
    const before = camera.position.clone();
    nav.update(0);
    nav.update(-1);
    nav.update(Number.NaN);
    assert(camera.position.distanceTo(before) < 1e-9, 'update ignores invalid dt');
    nav.dispose();
  }

  if (failures > 0) {
    console.error(`\nNavigation check FAILED: ${failures} assertion(s)`);
    process.exitCode = 1;
  } else {
    console.log('\nAll navigation assertions passed.');
  }
}

void run();
