import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CafeScene } from '../../CafeScene';
import { getEra } from '../../eras/getEra';
import type { EraConfig } from '../../types';
import {
  MenuBoardBuilder,
  MENU_ERA_YEARS,
  extractMenuBoard,
  registerMenuPropGroup,
} from './index';
import type { MenuEraYear } from './presets';

/* ----- helpers ------------------------------------------------------------ */

function makeScene(resolveEra?: (year: Parameters<typeof getEra>[0]) => EraConfig): CafeScene {
  return new CafeScene({ scene: new THREE.Scene(), resolveEra });
}

function eraVariant(scene: CafeScene, year: MenuEraYear): THREE.Group {
  const group = scene.getPropGroup('menu');
  if (!group) throw new Error('menu prop group missing');
  const set = group.getObjectByName(`menu-board-era-${year}`);
  if (!(set instanceof THREE.Group)) throw new Error(`era variant ${year} missing`);
  return set;
}

function settle(builder: MenuBoardBuilder, seconds = 2): void {
  const step = 0.05;
  for (let t = 0; t < seconds; t += step) builder.update(step);
}

function visibleVariants(scene: CafeScene): MenuEraYear[] {
  return MENU_ERA_YEARS.filter((year) => eraVariant(scene, year).visible);
}

/** Signature meshes exclusive to their era (instant visual dating). */
const SIGNATURES: Record<MenuEraYear, string[]> = {
  1945: ['chalk-slate', 'chalk-ledge'],
  1965: ['diner-paint-panel'],
  1985: ['plastic-letter-panel', 'lightbox-housing'],
  2005: ['printed-wall-menu', 'aframe-panel'],
  2025: ['lcd-screen', 'qr-tent-card-0'],
};

/** The textured board-face MESH of each era (for the canvas-texture check). */
const FACE_MESHES: Record<MenuEraYear, string> = {
  1945: 'chalk-slate',
  1965: 'diner-paint-panel',
  1985: 'plastic-letter-panel',
  2005: 'menu-print-face',
  2025: 'lcd-screen',
};

function collectNames(root: THREE.Object3D): Set<string> {
  const names = new Set<string>();
  root.traverse((obj) => {
    if (obj.name) names.add(obj.name);
  });
  return names;
}

/* ----- tests --------------------------------------------------------------- */

describe('menu prop group', () => {
  it('registers under the "menu" key with five prebuilt era variants', () => {
    const scene = makeScene();
    const builder = registerMenuPropGroup(scene);

    expect(scene.hasPropGroup('menu')).toBe(true);
    expect(scene.getPropGroup('menu')?.name).toBe('prop-group:menu');
    expect(builder.activeYear).toBe(1945);

    for (const year of MENU_ERA_YEARS) {
      const variant = eraVariant(scene, year);
      expect(variant.children.length).toBeGreaterThan(0);
      // Every variant carries a textured canvas board face.
      const face = variant.getObjectByName(FACE_MESHES[year]) as THREE.Mesh;
      expect(face?.isMesh).toBe(true);
      const material = face.material as THREE.MeshStandardMaterial;
      expect(material.map?.image).toBeDefined();
    }
  });

  it('produces a distinct board per era with era-exclusive signature meshes', () => {
    const scene = makeScene();
    registerMenuPropGroup(scene);

    // Distinct silhouettes: all five bounding boxes differ.
    const dims = new Set<string>();
    for (const year of MENU_ERA_YEARS) {
      const box = new THREE.Box3().setFromObject(eraVariant(scene, year));
      const size = box.getSize(new THREE.Vector3());
      dims.add(`${Math.round(size.x * 100)}x${Math.round(size.y * 100)}x${Math.round(size.z * 100)}`);
      expect(box.min.y).toBeGreaterThanOrEqual(-0.02);
    }
    expect(dims.size).toBe(MENU_ERA_YEARS.length);

    for (const year of MENU_ERA_YEARS) {
      const names = collectNames(eraVariant(scene, year));
      for (const [otherYear, signatures] of Object.entries(SIGNATURES)) {
        for (const signature of signatures) {
          if (Number(otherYear) === year) {
            expect(names.has(signature), `${signature} in ${year}`).toBe(true);
          } else {
            expect(names.has(signature), `${signature} leaked into ${year}`).toBe(false);
          }
        }
      }
    }
  });

  it('mounts the hanging boards above the counter run facing the customers', () => {
    const scene = makeScene();
    registerMenuPropGroup(scene);

    for (const year of [1945, 1965, 1985] as const) {
      const variant = eraVariant(scene, year);
      // Bottom edge clears heads / back-bar splashback (~y 1.38).
      const box = new THREE.Box3().setFromObject(variant);
      expect(box.min.y).toBeGreaterThan(1.9);
      // Faces −z (south, towards the customers): local +z must map to world −z.
      const facing = new THREE.Vector3(0, 0, 1).applyQuaternion(variant.quaternion);
      expect(facing.z).toBeLessThan(-0.99);
    }
  });

  it('snaps on first application and crossfades cleanly between any pair', () => {
    const scene = makeScene();
    const builder = registerMenuPropGroup(scene);
    builder.setTransitionSeconds(0.5);

    scene.applyEra(1945); // cold start: snap
    expect(builder.isTransitioning()).toBe(false);
    expect(visibleVariants(scene)).toEqual([1945]);

    scene.applyEra(1985);
    expect(builder.isTransitioning()).toBe(true);
    const slate45 = eraVariant(scene, 1945).getObjectByName('chalk-slate') as THREE.Mesh;
    const panel85 = eraVariant(scene, 1985).getObjectByName('plastic-letter-panel') as THREE.Mesh;
    const mat45 = slate45.material as THREE.MeshStandardMaterial;
    const mat85 = panel85.material as THREE.MeshStandardMaterial;

    builder.update(0.25); // half-way
    expect(mat45.opacity).toBeGreaterThan(0.4);
    expect(mat45.opacity).toBeLessThan(0.7);
    expect(mat85.opacity).toBeGreaterThan(0.4);
    expect(eraVariant(scene, 1945).visible).toBe(true);
    expect(eraVariant(scene, 1985).visible).toBe(true);

    settle(builder);
    expect(builder.isTransitioning()).toBe(false);
    expect(visibleVariants(scene)).toEqual([1985]);
    expect(Math.abs(mat85.opacity - 1)).toBeLessThan(1e-6);

    // Non-adjacent jump mid-flight still lands exactly on one active board.
    scene.applyEra(2025);
    builder.update(0.1); // interrupt early…
    scene.applyEra(1965); // …and retarget to a third era entirely
    settle(builder);
    expect(visibleVariants(scene)).toEqual([1965]);
  });

  it('renders era-correct items AND prices from the built-in presets', () => {
    const scene = makeScene();
    const builder = registerMenuPropGroup(scene);

    scene.applyEra(1945);
    let rows = eraVariant(scene, 1945).userData.renderedRows as Array<{ label: string; price: string }>;
    expect(rows).toContainEqual({ label: 'Coffee', price: '2d' });
    expect(rows).toContainEqual({ label: 'Tea', price: '1½d' });
    expect(rows).toContainEqual({ label: 'Bun', price: '3d' });

    scene.applyEra(1965);
    rows = eraVariant(scene, 1965).userData.renderedRows;
    expect(rows).toContainEqual({ label: 'Espresso', price: '1/6' });
    expect(rows).toContainEqual({ label: 'Milkshake', price: '2/-' });

    scene.applyEra(1985);
    rows = eraVariant(scene, 1985).userData.renderedRows;
    expect(rows.some((row) => row.label === 'COFFEE' && row.price.endsWith('p'))).toBe(true);
    expect(rows.some((row) => row.price.startsWith('£'))).toBe(true);

    scene.applyEra(2025);
    rows = eraVariant(scene, 2025).userData.renderedRows;
    expect(rows.every((row) => row.price.startsWith('£'))).toBe(true);

    void builder;
  });

  it('is driven by the era config slice: routed items/prices overlay the preset', () => {
    const menuConfig = (year: EraConfig['year']): EraConfig => ({
      ...getEra(year),
      menu: {
        menuBoard: {
          boardStyle: 'routed test board',
          items: [
            { id: 'm1', label: 'Cocoa' },
            { id: 'm2', label: 'Toast' },
          ],
          prices: [
            { itemId: 'm1', display: '9d' },
            { itemId: 'm2', display: '1d' },
          ],
          specialsNote: 'Test note',
        },
      },
    });

    const scene = makeScene((year) => menuConfig(year));
    const builder = registerMenuPropGroup(scene);
    scene.applyEra(1945);
    settle(builder);

    const data = eraVariant(scene, 1945).userData;
    expect(data.sliceApplied).toBe(true);
    expect(data.boardStyle).toBe('routed test board');
    expect(data.specialsNote).toBe('Test note');
    const rows = data.renderedRows as Array<{ label: string; price: string }>;
    expect(rows[0]).toEqual({ label: 'Cocoa', price: '9d' });
    expect(rows[1]).toEqual({ label: 'Toast', price: '1d' });
    expect(rows.length).toBe(2);

    // The extraction helper also accepts direct section keys (no carrier).
    expect(
      extractMenuBoard({ boardStyle: 'x' }),
      ).toMatchObject({ boardStyle: 'x' });
    expect(extractMenuBoard(undefined)).toBeUndefined();

    void builder;
  });

  it('animates the 2025 LCD specials ticker and dims glow while fading', () => {
    const scene = makeScene();
    const builder = registerMenuPropGroup(scene);
    builder.setTransitionSeconds(0.5);
    scene.applyEra(2025);
    settle(builder);

    const strip = eraVariant(scene, 2025).getObjectByName('lcd-specials-strip') as THREE.Mesh;
    const material = strip.material as THREE.MeshStandardMaterial;
    const tickerTexture = material.map as THREE.Texture;

    const before = tickerTexture.offset.x;
    expect(builder.update(0.25)).toBe(true); // ambient animation keeps moving
    const after = tickerTexture.offset.x;
    expect(after).not.toBe(before);
    // Wraps within its two-copy period.
    expect(after).toBeGreaterThanOrEqual(0);
    expect(after).toBeLessThanOrEqual(0.5 + 1e-9);

    // Glow scales down while the board fades out.
    scene.applyEra(1945);
    builder.update(0.15);
    expect(material.emissiveIntensity).toBeLessThan(1.05 * 0.95);
    settle(builder);
    expect(material.emissiveIntensity).toBeCloseTo(0, 6);
    expect(visibleVariants(scene)).toEqual([1945]);
  });

  it('snaps to the nearest dressed era for undressed timeline years', () => {
    const scene = makeScene();
    const builder = registerMenuPropGroup(scene);
    scene.applyEra(2055);
    settle(builder);
    expect(visibleVariants(scene)).toEqual([2025]);
    void builder;
  });

  it('dispose removes the group and releases GPU resources without throwing', () => {
    const scene = makeScene();
    const builder = registerMenuPropGroup(scene);
    scene.applyEra(2005);
    settle(builder);

    const root = builder.getGroup();
    const parent = root.parent;
    builder.dispose();

    expect(parent?.children.includes(root)).toBe(false);
    expect(() => builder.dispose()).not.toThrow(); // idempotent
    expect(() => builder.update(0.016)).not.toThrow(); // dead loop stays dead
  });
});
