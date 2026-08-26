// @vitest-environment node
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';

import { CafeScene } from '../CafeScene';
import type { EraYear } from '../types';
import { ERA_YEARS } from '../types';
import { registerFurniturePropGroup } from '../props/furniture';
import { registerBrewingEquipment } from '../props/machines';
import { registerMenuPropGroup } from '../props/menu';
import { registerPostersPropGroup } from '../props/posters';
import { registerTablewarePropGroup } from '../props/tableware';
import { registerCounterTech } from '../props/counter';
import { registerPatronsPropGroup } from '../props/patrons';
import { registerSignageLighting } from '../props/signage';

/**
 * Render-budget regression guard (performance pass).
 *
 * The permanent room shell used to spend 139 draw calls (64 of them loose
 * floor planks). It now merges into ~14 per-material meshes, and the whole
 * default-view frame stays under the budgets asserted below. If a change
 * pushes counts past these budgets, merge or share before shipping.
 */

function buildFullScene(): CafeScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 120);
  const host = new CafeScene({ scene, camera });

  // Same registration set (and order) as the app shell in src/main.ts.
  registerFurniturePropGroup(host);
  registerBrewingEquipment(host);
  registerMenuPropGroup(host);
  registerPostersPropGroup(host);
  registerTablewarePropGroup(host);
  registerCounterTech(host, { autoDrive: false });
  registerPatronsPropGroup(host);
  registerSignageLighting(host);

  return host;
}

interface Tally {
  meshes: number;
  visibleMeshes: number;
  materials: Set<THREE.Material>;
  triangles: number;
}

/** True when the mesh's whole ancestor chain is visible (i.e. it draws). */
function isEffectivelyVisible(mesh: THREE.Mesh): boolean {
  let visible = mesh.visible;
  let parent: THREE.Object3D | null = mesh.parent;
  while (visible && parent) {
    visible = parent.visible;
    parent = parent.parent;
  }
  return visible;
}

function tally(root: THREE.Object3D): Tally {
  const result: Tally = {
    meshes: 0,
    visibleMeshes: 0,
    materials: new Set(),
    triangles: 0,
  };
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    result.meshes += 1;
    if (!isEffectivelyVisible(mesh)) return;
    result.visibleMeshes += 1;
    const geometry = mesh.geometry;
    const indexCount = geometry.index
      ? geometry.index.count
      : geometry.getAttribute('position')?.count ?? 0;
    result.triangles += Math.floor(indexCount / 3);
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => result.materials.add(material));
    } else if (mesh.material) {
      result.materials.add(mesh.material);
    }
  });
  return result;
}

describe('render budget', () => {
  it('keeps the merged static room shell at one mesh per material bucket', () => {
    const host = buildFullScene();
    const shell = tally(host.room);

    // Merged shell: underlay, 5 plank shades, walls+ceiling, joinery,
    // glazing, sills, trim, door-leaf wood, 2× brass hardware.
    expect(shell.meshes).toBeLessThanOrEqual(16);
    expect(shell.meshes).toBeLessThan(40); // Guard vs the pre-merge 139.
    expect(shell.visibleMeshes).toBe(shell.meshes);
  });

  it('registers all eight prop groups exactly once', () => {
    const host = buildFullScene();
    expect(host.propGroupKeys.sort()).toEqual(
      ['counterTech', 'furniture', 'machines', 'menu', 'patrons', 'posters', 'signage', 'tableware'].sort(),
    );
  });

  it('stays under the per-era draw-call and material budgets', () => {
    const host = buildFullScene();

    for (const year of ERA_YEARS) {
      host.applyEra(year as EraYear);
      const t = tally(host.scene);

      // Default-view frame budget at 1080p: visible meshes ≈ draw calls for
      // the main pass (shadow pass is cheaper — many props opt out).
      expect(t.visibleMeshes).toBeLessThanOrEqual(720);
      // Material swaps cost state changes even when meshes share programs.
      expect(t.materials.size).toBeLessThanOrEqual(200);
      // Whole graph (incl. dormant era sets kept for instant swapping).
      expect(t.meshes).toBeLessThanOrEqual(3400);
    }
  });

  it('reports the per-group ledger for maintainers', () => {
    const host = buildFullScene();
    host.applyEra(2025);

    const ledger: Record<string, Tally> = {};
    for (const key of host.propGroupKeys) {
      const group = host.getPropGroup(key);
      if (group) ledger[key] = tally(group);
    }

    // Furniture/machines/patrons keep dormant era sets in the graph (visible
    // ≪ meshes); everything present must be accounted for.
    expect(Object.keys(ledger)).toHaveLength(8);
    expect(ledger.furniture!.meshes).toBeGreaterThan(0);
    expect(ledger.tableware!.meshes).toBeGreaterThan(0);
  });
});
