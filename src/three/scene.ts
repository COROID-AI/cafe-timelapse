import * as THREE from 'three';
import { buildCounter, buildTableSet, buildBench, TABLE_POSITIONS } from './furniture';
import { buildRoomShell } from './room';
import { buildDecor } from './decor';
import { buildPatrons } from './patrons';
import { createLighting, createFog, applyLighting } from './lighting';
import { lerpPalettes } from './transition';
import { ERA_MAP } from '../data/eras';
import type { EraId } from '../types';
import type { InterpolatedColors } from './transition';

export interface CafeSceneObjects {
  group: THREE.Group;
  /** Era decor groups keyed by era id (discrete props). */
  decors: Map<EraId, THREE.Group>;
  /** Room shell (continuous colors, recolored per frame). */
  room: THREE.Group;
  /** Per-era fixed furniture (discrete swap). */
  furnitures: Map<EraId, THREE.Group>;
  /** Per-era patron groups (discrete swap). */
  patrons: Map<EraId, THREE.Group>;
  lighting: ReturnType<typeof createLighting>;
  fog: THREE.FogExp2;
  /** Update continuous colors for a blended palette. */
  updateColors: (colors: InterpolatedColors) => void;
  /** Show decor + furniture for one era. */
  showEra: (era: EraId) => void;
  /** Era whose discrete props are currently visible. */
  currentEra: EraId;
}

function applyRoleColors(root: THREE.Object3D, colors: InterpolatedColors): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial;
      const roomRole = std.userData?.roomRole as string | undefined;
      if (!roomRole) continue;
      switch (roomRole) {
        case 'floor':
          std.color.set(colors.floor);
          break;
        case 'ceiling':
          std.color.set(colors.ceiling);
          break;
        case 'wall':
          std.color.set(colors.wall);
          break;
        case 'trim':
          std.color.set(colors.trim);
          break;
        default:
          break;
      }
    }
  });
}

/**
 * Compose the whole café scene: room shell + per-era furniture + era decor +
 * lighting. Continuous colors (walls, floor, lights, fog) are interpolated
 * per frame; discrete props (furniture, posters, menu, devices) are swapped
 * by era at the cross-fade midpoint.
 */
export function buildCafeScene(eraId: EraId): CafeSceneObjects {
  const colors = lerpPalettes(ERA_MAP[eraId].palette, ERA_MAP[eraId].palette, 1);

  const group = new THREE.Group();
  group.name = 'CafeScene';

  const room = buildRoomShell(colors);
  group.add(room);

  // Per-era furniture groups (chair + table styles change with the era)
  const furnitures = new Map<EraId, THREE.Group>();
  for (const e of Object.values(ERA_MAP)) {
    const furniture = new THREE.Group();
    furniture.name = `Furniture:${e.id}`;
    const counter = buildCounter(e);
    furniture.add(counter.group);
    for (const pos of TABLE_POSITIONS) {
      furniture.add(buildTableSet(e, pos.x, pos.z, pos.ry));
    }
    furniture.add(buildBench(e));
    furniture.visible = e.id === eraId;
    group.add(furniture);
    furnitures.set(e.id, furniture);
  }

  // Era decor groups for every era; only one visible at a time
  const decors = new Map<EraId, THREE.Group>();
  for (const e of Object.values(ERA_MAP)) {
    const decor = buildDecor(e);
    decor.visible = e.id === eraId;
    group.add(decor);
    decors.set(e.id, decor);
  }

  // Era patron groups; patrons give the café its lived-in feel and dress
  // differently per decade. Only one era's patrons are visible at a time.
  const patrons = new Map<EraId, THREE.Group>();
  for (const e of Object.values(ERA_MAP)) {
    const patronGroup = buildPatrons(e);
    patronGroup.visible = e.id === eraId;
    group.add(patronGroup);
    patrons.set(e.id, patronGroup);
  }

  const lighting = createLighting(colors);
  group.add(lighting.ambient, lighting.key, lighting.point, lighting.rim);
  const fog = createFog(colors);

  let currentEra: EraId = eraId;

  const updateColors = (next: InterpolatedColors) => {
    applyRoleColors(room, next);
    applyLighting(lighting, next);
    fog.density = next.fogDensity;
  };

  const showEra = (eraIdNext: EraId) => {
    currentEra = eraIdNext;
    for (const [id, d] of decors) {
      d.visible = id === eraIdNext;
    }
    for (const [id, f] of furnitures) {
      f.visible = id === eraIdNext;
    }
    for (const [id, p] of patrons) {
      p.visible = id === eraIdNext;
    }
  };

  return {
    group,
    decors,
    room,
    furnitures,
    patrons,
    lighting,
    fog,
    updateColors,
    showEra,
    currentEra,
  };
}
