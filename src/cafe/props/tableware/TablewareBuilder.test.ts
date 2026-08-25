import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CafeScene } from '../../CafeScene';
import { getEra } from '../../eras/getEra';
import type { EraConfig } from '../../types';
import {
  CLOTH_PAD_HEIGHT,
  SURFACE_LIFT,
  SUPPORTED_ERA_YEARS,
  TABLE_MAX_REACH,
  TABLE_TOP_Y,
  TablewareBuilder,
  collectPopItems,
  configuredPieceCount,
  disposeTableware,
  extractTableware,
  registerTablewarePropGroup,
  resolveSupportedTablewareYear,
  tableSurfaceY,
} from './index';
import type { SupportedTablewareYear, TablewareRig } from './index';

/* ----- helpers ------------------------------------------------------------ */

function makeScene(resolveEra?: (year: Parameters<typeof getEra>[0]) => EraConfig): CafeScene {
  return new CafeScene({ scene: new THREE.Scene(), resolveEra });
}

function eraVariant(scene: CafeScene, year: SupportedTablewareYear): THREE.Group {
  const group = scene.getPropGroup('tableware');
  if (!group) throw new Error('tableware prop group missing');
  const set = group.getObjectByName(`tableware-era-${year}`);
  if (!(set instanceof THREE.Group)) throw new Error(`era variant ${year} missing`);
  return set;
}

function settle(builder: Pick<TablewareRig, 'update'>): void {
  for (let step = 0; step < 80; step += 1) {
    if (!builder.update(0.05)) break;
  }
}

function visibleVariants(scene: CafeScene): SupportedTablewareYear[] {
  return SUPPORTED_ERA_YEARS.filter((year) => eraVariant(scene, year).visible);
}

function collectNames(root: THREE.Object3D): Set<string> {
  const names = new Set<string>();
  root.traverse((obj) => {
    if (obj.name) names.add(obj.name);
  });
  return names;
}

/** Signature props exclusive to their era (instant visual dating). */
const SIGNATURES: Record<SupportedTablewareYear, string[]> = {
  1945: ['tw-enamel-mug', 'tw-mismatched-saucer', 'tw-open-sugar-bowl', 'tw-ration-book'],
  1965: ['tw-diner-cup', 'tw-melamine-plate', 'tw-ketchup-bottle'],
  1985: ['tw-pastel-stoneware-mug', 'tw-glass-sugar-pourer', 'tw-ashtray'],
  2005: ['tw-takeaway-cup', 'tw-paper-napkin-dispenser', 'tw-syrup-bottle'],
  2025: ['tw-reusable-eco-cup', 'tw-flat-white-glass', 'tw-pour-over-set', 'tw-card-tip-jar'],
};

/* ----- tests --------------------------------------------------------------- */

describe('tableware prop group', () => {
  it('registers under the "tableware" key with five prebuilt era variants', () => {
    const scene = makeScene();
    const builder = registerTablewarePropGroup(scene);

    expect(scene.hasPropGroup('tableware')).toBe(true);
    expect(scene.getPropGroup('tableware')?.name).toBe('prop-group:tableware');
    expect(builder.activeYear).toBe(1945);

    const root = scene.getPropGroup('tableware');
    expect(root?.userData.propGroup).toBe('tableware');
    expect(root?.userData.strategy).toBe('instantSwap');
    expect(root?.userData.supportedYears).toEqual([1945, 1965, 1985, 2005, 2025]);

    for (const year of SUPPORTED_ERA_YEARS) {
      const variant = eraVariant(scene, year);
      expect(variant.children.length).toBeGreaterThan(0);
      expect(variant.children.length).toBe(6); // one cluster per dining-table anchor
      expect(variant.userData.eraYear).toBe(year);
      expect(Array.isArray(variant.userData.presetPieces)).toBe(true);
      expect((variant.userData.presetPieces as string[]).length).toBeGreaterThan(0);
    }
  });

  it('produces distinct era-flavoured tabletops with exclusive signatures', () => {
    const scene = makeScene();
    registerTablewarePropGroup(scene);

    // Distinct catalogues: every era stamps its own preset piece list.
    const dims = new Set<string>();
    for (const year of SUPPORTED_ERA_YEARS) {
      const presetPieces = eraVariant(scene, year).userData.presetPieces as string[];
      dims.add(presetPieces.join('|'));
    }
    expect(dims.size).toBe(SUPPORTED_ERA_YEARS.length);

    for (const year of SUPPORTED_ERA_YEARS) {
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

  it('sits every prop on the furniture surfaces without clipping or floating', () => {
    const scene = makeScene();
    registerTablewarePropGroup(scene);

    // Cloth-pad evidence straight from the furniture specs.
    expect(tableSurfaceY(1945, 0)).toBeCloseTo(TABLE_TOP_Y + CLOTH_PAD_HEIGHT, 10);
    expect(tableSurfaceY(1945, 1)).toBe(TABLE_TOP_Y);
    expect(tableSurfaceY(1965, 0)).toBe(TABLE_TOP_Y);
    expect(tableSurfaceY(2025, 3)).toBe(TABLE_TOP_Y);

    const worldPosition = new THREE.Vector3();
    for (const year of SUPPORTED_ERA_YEARS) {
      const variant = eraVariant(scene, year);
      for (const cluster of variant.children) {
        if (!(cluster instanceof THREE.Group)) continue;
        const tableIndex = cluster.userData.tableIndex as number;
        const expectedSurface = tableSurfaceY(year, tableIndex) + SURFACE_LIFT;

        const box = new THREE.Box3().setFromObject(cluster);
        // Resting ON the surface: never sunk into the tabletop/cloth…
        expect(box.min.y).toBeGreaterThanOrEqual(expectedSurface - 0.004);
        // …and not floating away either.
        expect(box.min.y).toBeLessThanOrEqual(expectedSurface + 0.02);
        expect(box.max.y).toBeLessThan(TABLE_TOP_Y + 0.45);

        // Horizontal footprint stays inside the smallest tabletop, even with
        // the furniture group's ±4 cm placement jitter.
        cluster.traverse((node) => {
          const mesh = node as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.getWorldPosition(worldPosition);
          const dx = worldPosition.x - cluster.position.x;
          const dz = worldPosition.z - cluster.position.z;
          expect(Math.hypot(dx, dz)).toBeLessThanOrEqual(TABLE_MAX_REACH + 1e-6);
        });
      }
    }
  });

  it('swaps instantly between eras with a subtle staggered pop-in', () => {
    const scene = makeScene();
    const builder = registerTablewarePropGroup(scene);

    scene.applyEra(1945); // cold start: snap
    settle(builder);
    expect(visibleVariants(scene)).toEqual([1945]);

    scene.applyEra(1985);
    // Instant swap: old tabletops hidden, new ones shown in the SAME frame.
    expect(eraVariant(scene, 1945).visible).toBe(false);
    expect(eraVariant(scene, 1985).visible).toBe(true);
    expect(builder.activeYear).toBe(1985);
    expect(builder.isPopping()).toBe(true);

    const items = collectPopItems(eraVariant(scene, 1985));
    expect(items.length).toBeGreaterThan(0);
    // Staggered pop-in: the first item is still hidden/shrunken right after
    // the swap, before any animation frame has run.
    expect(items[0].visible === false || items[0].scale.x < 0.999).toBe(true);

    settle(builder);
    expect(builder.isPopping()).toBe(false);
    expect(visibleVariants(scene)).toEqual([1985]);
    for (const item of items) {
      expect(item.visible).toBe(true);
      expect(item.scale.x).toBeCloseTo(1, 6);
      expect(item.scale.y).toBeCloseTo(1, 6);
      expect(item.scale.z).toBeCloseTo(1, 6);
    }
  });

  it('lands cleanly across every ordered pair of eras', () => {
    const scene = makeScene();
    const builder = registerTablewarePropGroup(scene);

    for (const from of SUPPORTED_ERA_YEARS) {
      for (const to of SUPPORTED_ERA_YEARS) {
        scene.applyEra(from);
        settle(builder);
        scene.applyEra(to);
        expect(builder.activeYear, `${from} -> ${to}`).toBe(to);
        expect(visibleVariants(scene), `${from} -> ${to}`).toEqual([to]);
        settle(builder);
        expect(visibleVariants(scene), `${from} -> ${to} settled`).toEqual([to]);
        expect(builder.isPopping()).toBe(false);
      }
    }
  });

  it('snaps undressed timeline years onto the nearest dressed era', () => {
    const scene = makeScene();
    const builder = registerTablewarePropGroup(scene);
    scene.applyEra(2055);
    settle(builder);
    expect(visibleVariants(scene)).toEqual([2025]);
    expect(resolveSupportedTablewareYear(2055)).toBe(2025);
  });

  it('is driven by the era config slice: routed pieces overlay the preset metadata', () => {
    const routedConfig = (year: EraConfig['year']): EraConfig => ({
      ...getEra(year),
      tableware: {
        tableware: {
          pieces: [{ id: 'p1', label: 'Enamel mug', material: 'enamel', condition: 'chipped' }],
          servingStyle: 'waitress table service',
          napkinNote: 'paper squares',
        },
      },
    });

    const scene = makeScene((year) => routedConfig(year));
    const builder = registerTablewarePropGroup(scene);
    scene.applyEra(1945);
    settle(builder);

    const data = eraVariant(scene, 1945).userData;
    expect(data.tablewareSectionPresent).toBe(true);
    expect(data.servingStyle).toBe('waitress table service');
    expect(data.napkinNote).toBe('paper squares');
    expect(data.configuredPieces).toContainEqual(
      expect.objectContaining({ label: 'Enamel mug', material: 'enamel' }),
    );
    expect(Array.isArray(data.presetPieces)).toBe(true);
  });

  it('extracts the payload from carrier, direct and absent section shapes', () => {
    const carrier = extractTableware({
      tableware: { servingStyle: 'counter pickup' },
    });
    expect(carrier).toMatchObject({ servingStyle: 'counter pickup' });

    const direct = extractTableware({
      pieces: [{ label: 'Melamine plate' }],
      napkinNote: 'dispenser on every table',
    });
    expect(direct).toMatchObject({ napkinNote: 'dispenser on every table' });
    expect(direct?.pieces?.[0]).toMatchObject({ label: 'Melamine plate' });

    expect(extractTableware(undefined)).toBeUndefined();
    expect(extractTableware({ unrelated: true })).toBeUndefined();
    expect(extractTableware('nope')).toBeUndefined();
  });

  it('derives duplicate counts from configured pieces with sane clamping', () => {
    expect(configuredPieceCount(undefined, ['mug'], 2, 3)).toBe(2);
    expect(
      configuredPieceCount({ pieces: [{ label: 'Ketchup bottle' }] }, ['mug'], 2, 3),
    ).toBe(2);
    expect(
      configuredPieceCount(
        {
          pieces: [
            { label: 'Mug' },
            { label: 'Coffee mug' },
            { description: 'a mug for two' },
            { material: 'glass' },
          ],
        },
        ['mug'],
        2,
        3,
      ),
    ).toBe(3);
    expect(
      configuredPieceCount({ pieces: [{ label: 'Mug A' }, { label: 'Mug B' }] }, ['mug'], 2, 1),
    ).toBe(1);
  });

  it('exposes the plain builder entry point for registry-style integrations', () => {
    const scene = makeScene();
    scene.registerPropGroup(
      'tableware',
      TablewareBuilder,
      (_config, _context) => {
        /* no-op updater for this wiring-shape probe */
      },
    );
    const group = scene.getPropGroup('tableware');
    expect(group?.name).toBe('prop-group:tableware');
    expect(group?.getObjectByName('tableware-era-1945')).toBeDefined();
    scene.unregisterPropGroup('tableware');
  });

  it('dispose removes the group and releases GPU resources without throwing', () => {
    const scene = makeScene();
    const builder = registerTablewarePropGroup(scene);
    scene.applyEra(2005);
    settle(builder);

    const root = scene.getPropGroup('tableware');
    expect(root).toBeDefined();
    const parent = root!.parent;

    expect(disposeTableware(scene)).toBe(true);
    expect(parent?.children.includes(root!)).toBe(false);
    expect(disposeTableware(scene)).toBe(false); // idempotent
    expect(scene.hasPropGroup('tableware')).toBe(false);
  });
});
