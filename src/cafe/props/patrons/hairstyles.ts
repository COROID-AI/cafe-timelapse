/**
 * Period hairstyles for the stylised patrons, 1945 → 2025.
 *
 * Every style is a tiny cluster of primitives parented to the head pivot so
 * it turns with idle head motion. Silhouette beats detail here: victory rolls
 * read as rolled sections on the crown, perms as bumpy clouds, frosted tips
 * as pale spikes, an emo fringe as a diagonal slab. No facial features are
 * modelled anywhere — heads stay smooth, which keeps the cast firmly on the
 * stylised side of the uncanny valley.
 */

import * as THREE from 'three';
import type { PatronKit } from './kit';
import type { HairStyleId } from './types';

/** Head sphere radius shared with the figure builder. */
export const HEAD_RADIUS = 0.115;
/** Head-centre height above the neck pivot. */
export const HEAD_CENTER_Y = 0.115;

export interface HairContext {
  kit: PatronKit;
  color: THREE.ColorRepresentation;
  /** Deterministic stream for bump placement (perms/curls). */
  rnd: () => number;
}

/** Builds one hairstyle group (parent me to the head pivot). */
export function buildHairstyle(style: HairStyleId, ctx: HairContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'hair';

  const hair = ctx.kit.std({ color: ctx.color, roughness: 0.88 });
  const hcY = HEAD_CENTER_Y;
  const R = HEAD_RADIUS;

  /** Non-uniform scalp cap (radii per axis, centred near the head centre). */
  const cap = (
    material: THREE.Material,
    rx: number,
    ry: number,
    rz: number,
    dx = 0,
    dy = 0.014,
    dz = -0.004,
  ): THREE.Mesh => {
    const mesh = ctx.kit.sphere(material, 1, dx, hcY + dy, dz);
    mesh.scale.set(rx * 2, ry * 2, rz * 2);
    mesh.name = `hair-${style}`;
    return mesh;
  };

  switch (style) {
    case 'victoryRolls': {
      group.add(cap(hair, R * 1.03, R * 0.95, R * 0.98, 0, 0.02, -0.018));
      // Two rolled sections pinned along the crown, axis across the head.
      for (const sx of [-1, 1]) {
        const roll = ctx.kit.cylinder(hair, 0.037, 0.037, 0.095, sx * 0.042, hcY + 0.085, 0.05);
        roll.rotation.z = Math.PI / 2;
        roll.name = 'hair-victoryRolls';
        group.add(roll);
      }
      const frontRoll = ctx.kit.cylinder(hair, 0.031, 0.031, 0.07, 0, hcY + 0.104, 0.006);
      frontRoll.rotation.z = Math.PI / 2;
      frontRoll.name = 'hair-victoryRolls';
      group.add(frontRoll);
      break;
    }

    case 'rafSidePart': {
      group.add(cap(hair, R * 0.97, R * 0.87, R * 0.94, 0, 0.02, 0));
      const part = ctx.kit.box(hair, 0.014, 0.012, 0.08, -R * 0.28, hcY + 0.098, 0.004);
      part.name = 'hair-rafSidePart';
      group.add(part);
      break;
    }

    case 'modBowl': {
      group.add(cap(hair, R * 1.06, R * 0.9, R * 1.0, 0, 0.022, 0.006));
      const fringe = ctx.kit.box(hair, 0.185, 0.042, 0.02, 0, hcY + 0.058, 0.1);
      fringe.name = 'hair-modBowl';
      group.add(fringe);
      for (const sx of [-1, 1]) {
        const curtain = ctx.kit.box(hair, 0.022, 0.078, 0.13, sx * 0.107, hcY - 0.012, -0.006);
        curtain.name = 'hair-modBowl';
        group.add(curtain);
      }
      break;
    }

    case 'modCrop': {
      group.add(cap(hair, R * 1.0, R * 0.82, R * 0.96, 0, 0.022, 0));
      const fringe = ctx.kit.box(hair, 0.158, 0.03, 0.018, 0, hcY + 0.072, 0.092);
      fringe.name = 'hair-modCrop';
      group.add(fringe);
      break;
    }

    case 'bigPerm': {
      group.add(cap(hair, R * 0.99, R * 0.9, R * 0.97, 0, 0.016, -0.006));
      addBumps(group, ctx, hair, 9, 0.042, 0.064, 0.86, hcY, `hair-${style}`);
      break;
    }

    case 'shortPerm': {
      group.add(cap(hair, R * 0.99, R * 0.88, R * 0.96, 0, 0.016, -0.004));
      addBumps(group, ctx, hair, 6, 0.034, 0.048, 0.92, hcY, `hair-${style}`);
      break;
    }

    case 'frostedTips': {
      const base = ctx.kit.std({ color: ctx.color, roughness: 0.8 });
      const tipColor = new THREE.Color(ctx.color).lerp(new THREE.Color(0xf2ead8), 0.62);
      const tips = ctx.kit.std({ color: tipColor, roughness: 0.7 });
      group.add(cap(base, R * 0.96, R * 0.8, R * 0.93, 0, 0.02, -0.002));
      // Pale spikes fanned across the top-front hairline.
      for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) {
        const dir = new THREE.Vector3(Math.sin(a) * 0.55, 1, 0.28 + Math.cos(a) * 0.12).normalize();
        const spike = ctx.kit.cone(tips, 0.02, 0.08);
        spike.position.set(dir.x * 0.03, hcY + 0.085 + dir.y * 0.012, 0.015 + dir.z * 0.03);
        spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        spike.name = 'hair-frostedTips';
        group.add(spike);
      }
      break;
    }

    case 'emoFringe': {
      const sleek = ctx.kit.std({ color: ctx.color, roughness: 0.52 });
      group.add(cap(sleek, R * 1.02, R * 0.88, R * 0.98, 0, 0.016, -0.008));
      // Long diagonal fringe swept across the forehead to one eye.
      const fringe = ctx.kit.box(sleek, 0.152, 0.118, 0.02, -0.03, hcY + 0.026, 0.096);
      fringe.rotation.z = 0.3;
      fringe.name = 'hair-emoFringe';
      group.add(fringe);
      for (const sx of [-1, 1]) {
        const side = ctx.kit.box(sleek, 0.026, 0.142, 0.056, sx * 0.106, hcY - 0.03, 0.012);
        side.name = 'hair-emoFringe';
        group.add(side);
      }
      break;
    }

    case 'topBun': {
      group.add(cap(hair, R * 0.94, R * 0.84, R * 0.92, 0, 0.02, 0));
      const bun = ctx.kit.sphere(hair, 0.052, 0, hcY + 0.124, -0.012);
      bun.name = 'hair-topBun';
      group.add(bun);
      const band = ctx.kit.custom(new THREE.TorusGeometry(0.046, 0.011, 6, 14));
      const bandMesh = new THREE.Mesh(band, hair);
      bandMesh.rotation.x = Math.PI / 2;
      bandMesh.position.set(0, hcY + 0.084, -0.008);
      bandMesh.name = 'hair-topBun';
      group.add(bandMesh);
      break;
    }

    case 'naturalCurls': {
      group.add(cap(hair, R * 0.98, R * 0.88, R * 0.96, 0, 0.014, -0.004));
      addBumps(group, ctx, hair, 10, 0.038, 0.058, 0.88, hcY, `hair-${style}`);
      break;
    }
  }

  return group;
}

/**
 * Scatters a seeded cluster of curl/perm bumps over the scalp, keeping the
 * face (front-low sector) clear. Deterministic via {@link HairContext.rnd}.
 */
function addBumps(
  group: THREE.Group,
  ctx: HairContext,
  material: THREE.Material,
  count: number,
  rMin: number,
  rMax: number,
  scalpFactor: number,
  hcY: number,
  name: string,
): void {
  for (let i = 0; i < count; i++) {
    let dir: THREE.Vector3;
    let guard = 0;
    do {
      const az = ctx.rnd() * Math.PI * 2;
      const elev = 0.2 + ctx.rnd() * 1.15;
      dir = new THREE.Vector3(
        Math.cos(elev) * Math.sin(az),
        Math.sin(elev),
        Math.cos(elev) * Math.cos(az),
      );
      guard += 1;
    } while (dir.z > 0.45 && dir.y < 0.5 && guard < 8);
    const r = rMin + ctx.rnd() * (rMax - rMin);
    const bump = ctx.kit.sphere(
      material,
      r,
      dir.x * HEAD_RADIUS * scalpFactor,
      hcY + 0.01 + dir.y * HEAD_RADIUS * scalpFactor,
      dir.z * HEAD_RADIUS * scalpFactor - 0.004,
    );
    bump.name = name;
    group.add(bump);
  }
}
