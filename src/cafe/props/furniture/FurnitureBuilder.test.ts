import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CafeScene } from '../../CafeScene';
import { getEra } from '../../eras/getEra';
import type { EraConfig } from '../../types';
import { FURNITURE_ERA_YEARS } from './types';
import type { FurnitureEraYear } from './types';
import { FurnitureBuilder } from './FurnitureBuilder';
import { registerFurniturePropGroup } from './index';

/* ----- helpers ------------------------------------------------------------ */

function makeScene(resolveEra?: (year: Parameters<typeof getEra>[0]) => EraConfig): CafeScene {
  return new CafeScene({ scene: new THREE.Scene(), resolveEra });
}

/** Signature décor mesh names per era (must be present only in that era). */
const SIGNATURES: Record<FurnitureEraYear, string[]> = {
  1945: ['doily-0', 'blackout-curtain'],
  1965: ['jukebox', 'lino'],
  1985: ['fern-0', 'neon-panel'],
  2005: ['lounge-sofa', 'wall-frame', 'coffee-table'],
  2025: ['hanging-plant-0', 'charging-spot-0'],
};

function collectNames(root: THREE.Object3D): Set<string> {
  const names = new Set<string>();
  root.traverse((obj) => {
    if (obj.name) names.add(obj.name);
  });
  return names;
}

function eraSet(scene: CafeScene, year: FurnitureEraYear): THREE.Group {
  const group = scene.getPropGroup('furniture');
  if (!group) throw new Error('furniture prop group missing');
  const set = group.getObjectByName(`furniture-era-${year}`);
  if (!(set instanceof THREE.Group)) throw new Error(`era set ${year} missing`);
  return set;
}

function settle(builder: FurnitureBuilder, seconds = 2): void {
  const step = 0.05;
  for (let t = 0; t < seconds; t += step) builder.update(step);
}

/** Visibility including every ancestor (three.js hides subtrees via parents). */
function chainVisible(obj: THREE.Object3D | null | undefined): boolean {
  for (let node = obj; node; node = node.parent) {
    if (!node.visible) return false;
  }
  return true;
}

/* ----- tests --------------------------------------------------------------- */

describe('furniture prop group', () => {
  it('registers under the "furniture" key with five prebuilt era sets', () => {
    const scene = makeScene();
    const builder = registerFurniturePropGroup(scene);

    expect(scene.hasPropGroup('furniture')).toBe(true);
    expect(scene.getPropGroup('furniture')?.name).toBe('prop-group:furniture');

    const root = builder.getGroup();
    for (const year of FURNITURE_ERA_YEARS) {
      const set = eraSet(scene, year);
      expect(set.children.length).toBeGreaterThan(0);
      expect(root.getObjectByName(`furniture-era-${year}`)).toBe(set);
    }
  });

  it('produces distinct table+chair+decor silhouettes and signature decor per era', () => {
    const scene = makeScene();
    const builder = registerFurniturePropGroup(scene);
    scene.applyEra(1945);
    settle(builder);

    const heights = new Map<FurnitureEraYear, number>();
    for (const year of FURNITURE_ERA_YEARS) {
      const set = eraSet(scene, year);
      const box = new THREE.Box3().setFromObject(set);
      heights.set(year, box.max.y);
      expect(box.min.y).toBeGreaterThanOrEqual(-0.01);
    }

    // Every era reaches a different top height → distinct silhouettes overall.
    const values = [...heights.values()];
    expect(new Set(values.map((v) => Math.round(v * 100))).size).toBe(FURNITURE_ERA_YEARS.length);

    // Signature décor is exclusive to its own era.
    for (const year of FURNITURE_ERA_YEARS) {
      const names = collectNames(eraSet(scene, year));
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

  it('snaps on first application and crossfades cleanly between any pair', () => {
    const scene = makeScene();
    const builder = registerFurniturePropGroup(scene);
    builder.setTransitionSeconds(0.5);

    scene.applyEra(1945); // cold start: snap
    expect(builder.isTransitioning()).toBe(false);
    expect(eraSet(scene, 1945).visible).toBe(true);
    expect(eraSet(scene, 2025).visible).toBe(false);

    scene.applyEra(1985);
    expect(builder.isTransitioning()).toBe(true);
    const set45 = eraSet(scene, 1945);
    const set85 = eraSet(scene, 1985);
    const mat45 = (set45.getObjectByName('table-top') as THREE.Mesh).material as THREE.MeshStandardMaterial;
    const chair85 = set85.getObjectByName('chair-t0-0') as THREE.Group;
    const mat85 = (chair85.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;

    builder.update(0.25); // half-way
    expect(mat45.opacity).toBeGreaterThan(0.4);
    expect(mat45.opacity).toBeLessThan(0.7);
    expect(mat85.opacity).toBeGreaterThan(0.4);
    expect(set45.visible).toBe(true);
    expect(set85.visible).toBe(true);

    settle(builder);
    expect(builder.isTransitioning()).toBe(false);
    expect(set45.visible).toBe(false);
    expect(set85.visible).toBe(true);
    expect(mat85.transparent).toBe(true);
    expect(Math.abs(mat85.opacity - 1)).toBeLessThan(1e-6);

    // Non-adjacent jump mid-flight still lands exactly on one active set.
    scene.applyEra(2025);
    builder.update(0.1); // interrupt early…
    scene.applyEra(1965); // …and retarget to a third era entirely
    settle(builder);
    const visibleYears = FURNITURE_ERA_YEARS.filter((y) => eraSet(scene, y).visible);
    expect(visibleYears).toEqual([1965]);
  });

  it('falls back to the nearest dressed era for undressed timeline years', () => {
    const scene = makeScene();
    const builder = registerFurniturePropGroup(scene);
    scene.applyEra(2055);
    settle(builder);
    const visible = FURNITURE_ERA_YEARS.filter((y) => eraSet(scene, y).visible);
    expect(visible).toEqual([2025]);
  });

  it('is driven by the era config slice: palette overrides accents', () => {
    const magentaConfig = (year: EraConfig['year']): EraConfig => ({
      ...getEra(year),
      furniture: { colorPalette: ['#ff00ff'] },
    });
    const scene = makeScene((year) => magentaConfig(year));
    const builder = registerFurniturePropGroup(scene);
    scene.applyEra(1965);
    settle(builder);

    let checked = 0;
    eraSet(scene, 1965).traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const slot = mesh.userData.accentSlot;
      if (typeof slot === 'number') {
        const material = mesh.material as THREE.MeshStandardMaterial;
        expect(material.color.getHexString()).toBe('ff00ff');
        checked += 1;
      }
    });
    expect(checked).toBeGreaterThan(10);

    // Default palettes differ from the override — sanity-check one default era.
    const plainScene = makeScene();
    const plainBuilder = registerFurniturePropGroup(plainScene);
    plainScene.applyEra(1965);
    settle(plainBuilder);
    let sawNonMagentaAccent = false;
    eraSet(plainScene, 1965).traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || typeof mesh.userData.accentSlot !== 'number') return;
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (material.color.getHexString() !== 'ff00ff') sawNonMagentaAccent = true;
    });
    expect(sawNonMagentaAccent).toBe(true);
  });

  it('honours bare-board flooring wording and "none" decor labels from the slice', () => {
    const bareFloorScene = makeScene((year) => ({
      ...getEra(year),
      furniture: { flooring: 'bare boards' },
    }));
    const bareBuilder = registerFurniturePropGroup(bareFloorScene);
    bareFloorScene.applyEra(1985);
    settle(bareBuilder);

    const bareSet = eraSet(bareFloorScene, 1985);
    expect(chainVisible(bareSet.getObjectByName('rug'))).toBe(false);
    const fernParent = bareSet.getObjectByName('fern-0')?.parent;
    expect(fernParent?.name).toBe('furniture-decor');
    expect(fernParent?.visible).toBe(true);

    const noDecorScene = makeScene((year) => ({
      ...getEra(year),
      furniture: { decor: [{ label: 'none' }] },
    }));
    const noDecorBuilder = registerFurniturePropGroup(noDecorScene);
    noDecorScene.applyEra(1985);
    settle(noDecorBuilder);

    const noDecorSet = eraSet(noDecorScene, 1985);
    expect(noDecorSet.getObjectByName('furniture-decor')?.visible).toBe(false);
    expect(chainVisible(noDecorSet.getObjectByName('fern-0'))).toBe(false);
    // Rugs are furniture-side dressing: unaffected by the decor "none" label,
    // and the default flooring keeps them shown.
    expect(chainVisible(noDecorSet.getObjectByName('rug'))).toBe(true);
  });

  it('dispose removes the group and releases GPU resources without throwing', () => {
    const scene = makeScene();
    const builder = registerFurniturePropGroup(scene);
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
