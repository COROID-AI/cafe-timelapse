/**
 * 2025 surface-slot provider — dresses the persistent café shell.
 *
 * The shell (src/world/ArchitectureShell.ts) exposes neutral surface slots:
 * `wallSlots` (back / left / right / storefront), `floorSlot`, `ceilingSlot`
 * and the `lighting` ceiling mounts. This module supplies the 2025 modern
 * third-wave / specialty café finishes:
 *   - walls: white ceramic tile (large-format, warm white with a soft grout
 *     line), per the brief's "populate surface slots (polished concrete,
 *     white tile)",
 *   - floor: polished concrete slabs (light warm grey, large-format tile
 *     texture so the seams read as concrete joints),
 *   - ceiling: exposed services painted matte black,
 *   - lighting: the shell's four ceiling mounts stay available for the
 *     composition's Edison pendant clusters and LED strips.
 *
 * Materials are produced by the shared MaterialFactory so the 2025 palette
 * drives every surface. `populate2025Surfaces` returns the surface materials
 * it created so the composition can reuse them on matching prop surfaces
 * (e.g. the same concrete token on the planter, the same matte black on the
 * pendant sockets).
 */
import * as THREE from 'three';
import type { EraYear } from '../../data/eras';
import { materialFromSpec } from '../../assets';
import type { SurfaceSlots } from '../../world/ArchitectureShell';

export interface EraSurfaceMaterials {
  /** White ceramic tile wall finish. */
  whiteTile: THREE.MeshPhysicalMaterial;
  /** Polished concrete floor finish. */
  concrete: THREE.MeshPhysicalMaterial;
  /** Matte black exposed-services ceiling finish. */
  matteBlack: THREE.MeshPhysicalMaterial;
}

/**
 * Apply the 2025 finishes to the persistent shell's surface slots.
 *
 * Pure object-graph work (no WebGL): safe to call headlessly and from the era
 * fragment build.
 */
export function populate2025Surfaces(slots: SurfaceSlots): EraSurfaceMaterials {
  const whiteTile = materialFromSpec({
    kind: 'wall',
    color: '#F5F4F0',
    roughness: 0.72,
    clearcoat: 0.3,
    texture: {
      kind: 'tile',
      color: '#F7F6F2',
      color2: '#DDDAD3',
      size: 256,
      repeats: 5,
    },
  });
  whiteTile.userData.surface = 'white-tile';

  const concrete = materialFromSpec({
    kind: 'floor',
    color: '#9A958C',
    roughness: 0.82,
    texture: {
      kind: 'tile',
      color: '#A6A29A',
      color2: '#8F8B82',
      size: 256,
      repeats: 6,
    },
  });
  concrete.userData.surface = 'polished-concrete';

  const matteBlack = materialFromSpec({
    kind: 'ceiling',
    color: '#1C1C1E',
    roughness: 0.7,
    metalness: 0.2,
  });
  matteBlack.userData.surface = 'matte-black';

  slots.wallSlots.back.setMaterial(whiteTile);
  slots.wallSlots.left.setMaterial(whiteTile);
  slots.wallSlots.right.setMaterial(whiteTile);
  slots.wallSlots.storefront.setMaterial(whiteTile);
  slots.floorSlot.setMaterial(concrete);
  slots.ceilingSlot.setMaterial(matteBlack);

  return { whiteTile, concrete, matteBlack };
}

/** The era this provider dresses (kept for tooling that maps era → provider). */
export const SURFACE_ERA: EraYear = 2025;
