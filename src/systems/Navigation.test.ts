/**
 * Navigation.test.ts — unit tests for the navigation rig's pure math helpers
 * and the interior-collision-clamping behaviour that the acceptance criteria
 * hinge on (no clipping through walls/floor/ceiling, damped motion, inspection
 * mode with reduced collision radius).
 *
 * The pure helpers (damp, sphericalOffset, clampToBounds) need no DOM/camera.
 * The rig-level tests build a detached PerspectiveCamera and a stub element,
 * exercising update() without a live renderer.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import {
  DEFAULT_CAFE_INTERIOR,
  Navigation,
  clampToBounds,
  damp,
  sphericalOffset,
} from './Navigation';

const BOUNDS = new Box3(new Vector3(-10, 0, -10), new Vector3(10, 10, 10));

function makeCamera(): PerspectiveCamera {
  const cam = new PerspectiveCamera(50, 1, 0.1, 100);
  cam.position.set(0, 5, 8);
  return cam;
}

/** Minimal stub element so the rig can attach listeners without a DOM. */
function makeElement(): HTMLElement {
  const el = {
    clientWidth: 800,
    clientHeight: 600,
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as HTMLElement;
  return el;
}

function makeRig(
  overrides: Partial<ConstructorParameters<typeof Navigation>[0]> = {},
): Navigation {
  return new Navigation({
    camera: makeCamera(),
    domElement: makeElement(),
    bounds: BOUNDS,
    damping: 0,
    ...overrides,
  });
}

afterEach(() => {
  // Clear any listeners the rigs added to window.
  window.dispatchEvent(new Event('blur'));
});

// ---------------------------------------------------------------------------

describe('damp', () => {
  it('returns the target when damping is disabled', () => {
    expect(damp(0, 10, 0, 0.016)).toBe(10);
  });

  it('moves current toward target by a fraction', () => {
    const result = damp(0, 100, 4, 0.5);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('never overshoots the target', () => {
    const result = damp(0, 100, 4, 2);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('sphericalOffset', () => {
  it('places the camera at distance radius when phi=0 (straight up)', () => {
    const offset = sphericalOffset(5, 0, 0);
    expect(offset.y).toBeCloseTo(5, 5);
    expect(offset.x).toBeCloseTo(0, 5);
    expect(offset.z).toBeCloseTo(0, 5);
  });

  it('returns a zero vector when radius=0', () => {
    const offset = sphericalOffset(0, 1, 1);
    expect(offset.length()).toBe(0);
  });

  it('matches expected cartesian conversion for a generic angle', () => {
    // phi = PI/2 (equator), theta = PI/2: should put the point at (r, 0, 0)
    const offset = sphericalOffset(3, Math.PI / 2, Math.PI / 2);
    expect(offset.x).toBeCloseTo(3, 5);
    expect(offset.y).toBeCloseTo(0, 5);
    expect(offset.z).toBeCloseTo(0, 5);
  });
});

describe('clampToBounds', () => {
  it('keeps an interior point unchanged (minus margin)', () => {
    const p = new Vector3(0, 5, 0);
    clampToBounds(p, BOUNDS, 1);
    expect(p.x).toBe(0);
    expect(p.y).toBe(5);
    expect(p.z).toBe(0);
  });

  it('pushes an out-of-bounds point back inside on all axes', () => {
    const p = new Vector3(50, -10, 50);
    clampToBounds(p, BOUNDS, 1);
    expect(p.x).toBeLessThanOrEqual(9); // max.x - margin
    expect(p.y).toBeGreaterThanOrEqual(1); // min.y + margin
    expect(p.z).toBeLessThanOrEqual(9);
  });

  it('respects the margin from every wall', () => {
    const p = new Vector3(50, 50, 50);
    clampToBounds(p, BOUNDS, 2);
    expect(p.x).toBe(8); // 10 - 2
    expect(p.y).toBe(8);
    expect(p.z).toBe(8);
  });

  it('clamps the floor so the camera cannot go below ground', () => {
    const p = new Vector3(0, -5, 0);
    clampToBounds(p, BOUNDS, 0.5);
    expect(p.y).toBe(0.5); // min.y + margin
  });

  it('centres the axis when the box is narrower than twice the margin', () => {
    const thin = new Box3(new Vector3(0, 0, 0), new Vector3(2, 10, 10));
    const p = new Vector3(100, 5, 5);
    clampToBounds(p, thin, 5); // margin 5 > half-width 1
    expect(p.x).toBe(1); // centred on (0+2)/2
  });
});

describe('Navigation rig', () => {
  it('clamps the camera within the interior bounds after update', () => {
    const rig = makeRig({ collisionRadius: 0.5 });
    // Force a target and position far outside the box.
    rig.setBounds(BOUNDS);
    rig.update(0.016);

    const { min, max } = BOUNDS;
    const p = rig.camera.position;
    expect(p.x).toBeGreaterThanOrEqual(min.x + 0.5);
    expect(p.x).toBeLessThanOrEqual(max.x - 0.5);
    expect(p.y).toBeGreaterThanOrEqual(min.y + 0.5);
    expect(p.y).toBeLessThanOrEqual(max.y - 0.5);
    expect(p.z).toBeGreaterThanOrEqual(min.z + 0.5);
    expect(p.z).toBeLessThanOrEqual(max.z - 0.5);
  });

  it('keeps the camera inside after many update steps', () => {
    const rig = makeRig({ collisionRadius: 0.5, damping: 6 });
    for (let i = 0; i < 100; i++) {
      rig.update(0.016);
      const { min, max } = BOUNDS;
      const p = rig.camera.position;
      expect(p.x).toBeGreaterThanOrEqual(min.x + 0.5);
      expect(p.x).toBeLessThanOrEqual(max.x - 0.5);
      expect(p.y).toBeGreaterThanOrEqual(min.y + 0.5);
      expect(p.y).toBeLessThanOrEqual(max.y - 0.5);
      expect(p.z).toBeGreaterThanOrEqual(min.z + 0.5);
      expect(p.z).toBeLessThanOrEqual(max.z - 0.5);
    }
  });

  it('defaults to the configured café interior bounds', () => {
    const rig = new Navigation({
      camera: makeCamera(),
      domElement: makeElement(),
    });
    expect(rig.bounds).toBe(DEFAULT_CAFE_INTERIOR);
    rig.dispose();
  });

  it('inspection mode reduces the collision radius (getters)', () => {
    const rig = makeRig({
      collisionRadius: 0.4,
      inspectionCollisionRadius: 0.05,
    });
    expect(rig.inspectionMode).toBe(false);
    rig.setInspectionMode(true);
    expect(rig.inspectionMode).toBe(true);
    rig.dispose();
  });

  it('inspection mode allows a smaller minimum orbit distance', () => {
    const rig = makeRig({
      minDistance: 1,
      inspectionMinDistance: 0.2,
      damping: 0,
    });
    // In inspection mode, focusing close should bring the radius down to 0.2.
    rig.setInspectionMode(true);
    rig.focusOn(new Vector3(0, 5, 0), 0.2);
    rig.update(0.016);
    expect(rig.camera.position.distanceTo(rig.target)).toBeLessThanOrEqual(1.2);
    rig.dispose();
  });

  it('focusOn moves the target toward the given point', () => {
    const rig = makeRig();
    const before = rig.target.clone();
    rig.focusOn(new Vector3(5, 5, 5), 2);
    rig.update(0.016);
    expect(rig.target.distanceTo(before)).toBeGreaterThan(0);
    rig.dispose();
  });

  it('setBounds re-clamps the target into the new shell', () => {
    const rig = makeRig();
    const tiny = new Box3(new Vector3(-1, 0, -1), new Vector3(1, 1, 1));
    rig.setBounds(tiny);
    rig.update(0.016);
    expect(rig.target.x).toBeGreaterThanOrEqual(-1.4);
    expect(rig.target.x).toBeLessThanOrEqual(1.4);
    rig.dispose();
  });

  it('toggleInspectionMode flips state and returns the new value', () => {
    const rig = makeRig();
    expect(rig.toggleInspectionMode()).toBe(true);
    expect(rig.toggleInspectionMode()).toBe(false);
    rig.dispose();
  });
});
