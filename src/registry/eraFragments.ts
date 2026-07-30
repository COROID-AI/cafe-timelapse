/**
 * eraFragments.ts — registers a placeholder scene-fragment factory for every
 * (category, era) pair so the AssetRegistry is complete from day one.
 *
 * Downstream tasks replace individual stubs with detailed procedural geometry
 * via `assetRegistry` as they are built. For now each factory emits a simple,
 * visually distinguishable placeholder so `npm run dev` shows a non-black
 * scene and the registry passes the `check:eras` completeness gate.
 *
 * This module is side-effectful: importing it populates the registry.
 */
import { Color, Mesh, MeshStandardMaterial, BoxGeometry } from 'three';
import { assetRegistry } from './AssetRegistry.js';
import {
  CATEGORY_KEYS,
  ERA_YEARS,
  type CategoryKey,
  type EraYear,
} from '../data/EraData.js';

/** Deterministic hue per category so placeholder fragments are visually distinct. */
const CATEGORY_HUES: Record<CategoryKey, number> = {
  architecture: 30,
  furnitureDecor: 0,
  coffeeMachines: 60,
  menuBoard: 120,
  musicSource: 280,
  posters: 320,
  tableware: 200,
  signage: 50,
  lighting: 55,
  counterTechnology: 190,
  patrons: 340,
};

function stubFactory(category: CategoryKey, era: EraYear) {
  // Encode the era into lightness so older/newer eras differ visually.
  const eraIndex = ERA_YEARS.indexOf(era);
  const lightness = 0.4 + (eraIndex / (ERA_YEARS.length - 1)) * 0.35;
  const hue = CATEGORY_HUES[category] ?? 0;
  const color = new Color().setHSL(hue / 360, 0.6, lightness);
  const x = (ERA_YEARS.length / 2 - eraIndex) * 1.6;
  const categoryIndex = CATEGORY_KEYS.indexOf(category);

  return () => {
    const mesh = new Mesh(
      new BoxGeometry(0.8, 0.8, 0.8),
      new MeshStandardMaterial({ color }),
    );
    mesh.position.set(x, categoryIndex * 0.9 - 4, 0);
    mesh.name = `stub:${category}:${era}`;
    return mesh;
  };
}

/** Register all 6 eras × 11 categories. Safe to call once at import time. */
export function registerEraFragments(): void {
  for (const era of ERA_YEARS) {
    for (const category of CATEGORY_KEYS) {
      // Skip already-registered pairs (allows downstream modules to override
      // a specific stub before this module loads).
      if (assetRegistry.has(category, era)) continue;
      assetRegistry.register(category, era, stubFactory(category, era));
    }
  }
}
