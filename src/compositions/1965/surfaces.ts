/**
 * 1965 surface-slot provider — dresses the persistent café shell.
 *
 * The shell (src/world/ArchitectureShell.ts) exposes neutral surface slots:
 * `wallSlots` (back / left / right / storefront), `floorSlot`, `ceilingSlot`
 * and the `lighting` ceiling mounts. This module supplies the 1965
 * mid-century / beatnik café finishes:
 *   - walls: wood panelling below a chrome dado rail with geometric wallpaper
 *     above (per era1965.architecture.walls),
 *   - floor: black-and-white checkerboard tile,
 *   - ceiling: smooth warm plaster (the era's fluorescent tubes are added as
 *     light fixtures by the composition, not as a ceiling texture),
 *   - lighting: the shell's four ceiling mounts stay available for the
 *     composition's fixtures.
 *
 * Materials are produced by the shared MaterialFactory so the 1965 palette
 * drives every surface. `populate1965Surfaces` returns the surface materials
 * it created so the composition can reuse them on matching prop surfaces
 * (e.g. the same chrome trim token on booth trim).
 */
import type { EraYear } from '../../data/eras';
import { materialFactory } from '../../assets';
import type { SurfaceSlots } from '../../world/ArchitectureShell';

export interface EraSurfaceMaterials {
  /** Dado-rail chrome (trim token). */
  chrome: ReturnType<typeof materialFactory.forEra>;
  /** Wood panelling finish. */
  woodPanel: ReturnType<typeof materialFactory.forEra>;
  /** Geometric wallpaper finish. */
  geometricWallpaper: ReturnType<typeof materialFactory.forEra>;
  /** Checkerboard tile finish. */
  checkerboard: ReturnType<typeof materialFactory.forEra>;
  /** Smooth plaster ceiling. */
  ceiling: ReturnType<typeof materialFactory.forEra>;
}

/**
 * Apply the 1965 finishes to the persistent shell's surface slots.
 *
 * Pure object-graph work (no WebGL): safe to call headlessly and from the era
 * fragment build.
 */
export function populate1965Surfaces(slots: SurfaceSlots): EraSurfaceMaterials {
  const materials: EraSurfaceMaterials = {
    chrome: materialFactory.forEra(1965, 'chrome'),
    woodPanel: materialFactory.forEra(1965, 'woodPanel'),
    geometricWallpaper: materialFactory.forEra(1965, 'geometric'),
    checkerboard: materialFactory.forEra(1965, 'floor'),
    ceiling: materialFactory.forEra(1965, 'ceiling'),
  };

  slots.wallSlots.back.setMaterial(materials.geometricWallpaper);
  slots.wallSlots.left.setMaterial(materials.geometricWallpaper);
  slots.wallSlots.right.setMaterial(materials.geometricWallpaper);
  slots.wallSlots.storefront.setMaterial(materials.geometricWallpaper);
  slots.floorSlot.setMaterial(materials.checkerboard);
  slots.ceilingSlot.setMaterial(materials.ceiling);

  return materials;
}

/** The era this provider dresses (kept for tooling that maps era → provider). */
export const SURFACE_ERA: EraYear = 1965;
