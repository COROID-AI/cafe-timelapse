/**
 * 2055 surface-slot provider — dresses the persistent café shell.
 *
 * The shell (src/world/ArchitectureShell.ts) exposes neutral surface slots:
 * `wallSlots` (back / left / right / storefront), `floorSlot`, `ceilingSlot`
 * and the `lighting` ceiling mounts. This module supplies the 2055
 * near-future finishes (per era2055.architecture):
 *   - walls: reactive smart-glass panels with ambient colour shifts,
 *   - floor: self-healing photopolymer resin with embedded light veins,
 *   - ceiling: living mycelium canopy with integrated glow nodes,
 *   - lighting: the shell's four ceiling mounts stay available for the
 *     composition's programmable LED strips and bioluminescent nodes.
 *
 * Materials are produced with the shared MaterialFactory (parameterised by
 * the 2055 palette) so the era palette drives every surface.
 * `populate2055Surfaces` returns the surface materials it created so the
 * composition can reuse them on matching prop surfaces (e.g. the same
 * smart-glass finish on the counter fascia).
 */
import type { EraYear } from '../../data/eras';
import { materialFactory, materialFromSpec } from '../../assets';
import type { SurfaceSlots } from '../../world/ArchitectureShell';

export interface EraSurfaceMaterials {
  /** Reactive smart-glass wall finish (subtle teal reactive glow). */
  smartGlass: ReturnType<typeof materialFactory.forEra>;
  /** Self-healing photopolymer resin floor with faint panel seams. */
  resinFloor: ReturnType<typeof materialFactory.forEra>;
  /** Living mycelium canopy finish. */
  myceliumCeiling: ReturnType<typeof materialFactory.forEra>;
}

/**
 * Apply the 2055 finishes to the persistent shell's surface slots.
 *
 * Pure object-graph work (no WebGL): safe to call headlessly and from the era
 * fragment build. Each returned material carries a `userData.surface` marker
 * so the QA gate can assert the exact finish on each slot.
 */
export function populate2055Surfaces(slots: SurfaceSlots): EraSurfaceMaterials {
  const smartGlass = materialFromSpec({
    kind: 'wall',
    color: '#3D4F5C',
    roughness: 0.18,
    metalness: 0.35,
    clearcoat: 0.9,
    emissive: '#0E3A46',
    emissiveIntensity: 0.12,
    texture: { kind: 'wallpaper', color: '#3D4F5C', color2: '#2A3A44', size: 256, repeats: 4 },
    mapStrength: 0.45,
  });
  smartGlass.userData.surface = 'smart-glass';

  const resinFloor = materialFromSpec({
    kind: 'floor',
    color: '#2A3338',
    roughness: 0.12,
    metalness: 0.25,
    clearcoat: 1,
    emissive: '#123B3A',
    emissiveIntensity: 0.06,
    texture: { kind: 'tile', color: '#2A3338', color2: '#36434A', size: 256, repeats: 6 },
    mapStrength: 0.55,
  });
  resinFloor.userData.surface = 'resin-floor';

  const myceliumCeiling = materialFromSpec({
    kind: 'ceiling',
    color: '#8FA38E',
    roughness: 0.9,
    texture: { kind: 'wallpaper', color: '#8FA38E', color2: '#6F8671', size: 256, repeats: 6 },
    mapStrength: 0.5,
  });
  myceliumCeiling.userData.surface = 'mycelium-ceiling';

  slots.wallSlots.back.setMaterial(smartGlass);
  slots.wallSlots.left.setMaterial(smartGlass);
  slots.wallSlots.right.setMaterial(smartGlass);
  slots.wallSlots.storefront.setMaterial(smartGlass);
  slots.floorSlot.setMaterial(resinFloor);
  slots.ceilingSlot.setMaterial(myceliumCeiling);

  return { smartGlass, resinFloor, myceliumCeiling };
}

/** The era this provider dresses (kept for tooling that maps era → provider). */
export const SURFACE_ERA: EraYear = 2055;
