/**
 * Parametric furniture pieces: tables, chairs, lounge seating.
 *
 * Every builder returns a fresh `THREE.Group` rooted at the origin; callers
 * position/rotate the group. Table builders store their walking surface
 * height in `group.userData.topY` so décor can sit on top without guessing.
 */

import * as THREE from 'three';
import type { MaterialKit } from './materials';
import type { PieceDeps } from './geometry';
import { boxMesh, cylMesh } from './geometry';
import type { ChairStyle, TableKind } from './types';

/** Deterministic PRNG so era layouts are stable across reloads. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t ^ (t >>> 14)) >>> 0;
    return t / 4294967296;
  };
}

/** Marks a mesh as palette-driven so the builder can recolor it per config. */
export function markAccent(mesh: THREE.Mesh, slot: number): void {
  mesh.userData.accentSlot = slot;
}

export interface EraTones {
  woodDark: string;
  woodMid: string;
  woodLight: string;
  steel: string;
  chrome: string;
  fabric: string;
  cream: string;
}

/** Structural tones per era family (accent hues come from the era palette). */
export const ERA_TONES: Record<number, EraTones> = {
  1945: {
    woodDark: '#4c3a28',
    woodMid: '#6b4a2f',
    woodLight: '#8a6a45',
    steel: '#5c5650',
    chrome: '#8d8a84',
    fabric: '#b9b09a',
    cream: '#ddd6c4',
  },
  1965: {
    woodDark: '#3c2f26',
    woodMid: '#5a4634',
    woodLight: '#7d5f42',
    steel: '#9aa0a6',
    chrome: '#d7dbde',
    fabric: '#b3392f',
    cream: '#e8e2d2',
  },
  1985: {
    woodDark: '#4a3b30',
    woodMid: '#6a5644',
    woodLight: '#93806b',
    steel: '#aeb6bd',
    chrome: '#d3d8dc',
    fabric: '#bfe3cf',
    cream: '#efe9dc',
  },
  2005: {
    woodDark: '#2f2118',
    woodMid: '#3a2a20',
    woodLight: '#59422f',
    steel: '#b8bcbe',
    chrome: '#dfe2e4',
    fabric: '#454039',
    cream: '#d8d2c6',
  },
  2025: {
    woodDark: '#8a6b47',
    woodMid: '#b08c5e',
    woodLight: '#d8b98a',
    steel: '#3a3d42',
    chrome: '#c9ccd1',
    fabric: '#9db08b',
    cream: '#efeae2',
  },
};

/* ------------------------------------------------------------------------- */
/* Tables                                                                     */
/* ------------------------------------------------------------------------- */

function roundWoodBase(
  deps: PieceDeps,
  kit: MaterialKit,
  tones: EraTones,
  rnd: () => number,
  topRadius: number,
): { group: THREE.Group; topY: number; topR: number } {
  const group = new THREE.Group();
  const r = topRadius * (0.92 + rnd() * 0.16);
  const woodTop = kit.std({ color: tones.woodMid, roughness: 0.55, metalness: 0.04 });
  const woodLeg = kit.std({ color: tones.woodDark, roughness: 0.62, metalness: 0.03 });

  group.add(cylMesh(deps, woodTop, r, r, 0.04, 20, 0, 0.72, 0, 'table-top'));
  // Apron ring under the top.
  group.add(cylMesh(deps, woodLeg, r - 0.06, r - 0.06, 0.07, 16, 0, 0.665, 0));
  // Turned pedestal + three splayed feet.
  group.add(cylMesh(deps, woodLeg, 0.05, 0.062, 0.62, 12, 0, 0.35, 0));
  group.add(cylMesh(deps, woodLeg, 0.075, 0.075, 0.05, 12, 0, 0.075, 0));
  for (let i = 0; i < 3; i += 1) {
    const foot = boxMesh(deps, woodLeg, 0.36, 0.04, 0.09, 0, 0.02, 0.17);
    foot.rotation.y = (i * Math.PI * 2) / 3;
    foot.position.set(Math.sin((i * Math.PI * 2) / 3) * 0.17, 0.02, Math.cos((i * Math.PI * 2) / 3) * 0.17);
    group.add(foot);
  }

  const topY = 0.74;
  group.userData.topY = topY;

  // Wartime tables wobble: tiny deterministic tilt on some of them.
  if (rnd() < 0.45) {
    // Kept shallow so even the worst tilt keeps the feet on the boards.
    group.rotation.z = (rnd() - 0.5) * 0.028;
    group.rotation.x = (rnd() - 0.5) * 0.028;
  }
  return { group, topY, topR: r };
}

export interface BuiltTable {
  group: THREE.Group;
  topY: number;
}

export function buildTable(
  deps: PieceDeps,
  kit: MaterialKit,
  tones: EraTones,
  kind: TableKind,
  accentColors: string[],
  accentSlotBase: number,
  rnd: () => number,
): BuiltTable {
  const group = new THREE.Group();

  if (kind === 'roundWood' || kind === 'clothRound') {
    const base = roundWoodBase(deps, kit, tones, rnd, 0.55);
    group.add(base.group);
    let topY = base.topY;

    if (kind === 'clothRound') {
      // Herringbone cloth draped over the top with a hanging skirt.
      const cloth = kit.std({ color: tones.cream, roughness: 0.92 });
      group.add(cylMesh(deps, cloth, base.topR + 0.03, base.topR + 0.03, 0.018, 20, 0, base.topY + 0.008, 0, 'table-cloth'));
      const skirt = new THREE.Mesh(
        deps.geo.cylinder(base.topR + 0.03, base.topR + 0.015, 0.34, 20),
        cloth,
      );
      skirt.position.set(0, base.topY - 0.17, 0);
      skirt.castShadow = true;
      skirt.receiveShadow = true;
      skirt.name = 'table-cloth-skirt';
      group.add(skirt);
      topY += 0.018;
    }
    group.userData.topY = topY;
    return { group, topY };
  }

  if (kind === 'formicaDiner') {
    const formica = kit.std({ color: tones.cream, roughness: 0.32, metalness: 0.02 });
    const chrome = kit.std({ color: tones.chrome, roughness: 0.22, metalness: 0.9 });
    group.add(boxMesh(deps, formica, 0.78, 0.032, 0.78, 0, 0.724, 0, 'table-top'));
    group.add(boxMesh(deps, chrome, 0.79, 0.024, 0.79, 0, 0.698, 0, 'table-chrome-band'));
    group.add(cylMesh(deps, chrome, 0.042, 0.05, 0.6, 12, 0, 0.37, 0, 'table-pedestal'));
    group.add(cylMesh(deps, chrome, 0.26, 0.27, 0.03, 18, 0, 0.045, 0, 'table-base'));
    const footRing = new THREE.Mesh(deps.geo.torus(0.26, 0.012, 6, 20), chrome);
    footRing.rotation.x = Math.PI / 2;
    footRing.position.set(0, 0.07, 0);
    footRing.castShadow = true;
    group.add(footRing);
    group.userData.topY = 0.74;
    return { group, topY: 0.74 };
  }

  if (kind === 'pastelLaminate') {
    const laminate = kit.std({ color: accentColors[accentSlotBase % accentColors.length], roughness: 0.38 });
    const steel = kit.std({ color: tones.steel, roughness: 0.35, metalness: 0.75 });
    const top = boxMesh(deps, laminate, 0.8, 0.032, 0.78, 0, 0.724, 0, 'table-top');
    markAccent(top, accentSlotBase);
    group.add(top);
    const legOffsets: Array<[number, number]> = [
      [-0.33, -0.31],
      [0.33, -0.31],
      [-0.33, 0.31],
      [0.33, 0.31],
    ];
    for (const [lx, lz] of legOffsets) {
      group.add(cylMesh(deps, steel, 0.02, 0.02, 0.7, 10, lx, 0.35, lz));
    }
    group.add(boxMesh(deps, steel, 0.66, 0.028, 0.028, 0, 0.58, -0.31));
    group.add(boxMesh(deps, steel, 0.66, 0.028, 0.028, 0, 0.58, 0.31));
    group.userData.topY = 0.74;
    return { group, topY: 0.74 };
  }

  if (kind === 'comboDark') {
    const woodTop = kit.std({ color: tones.woodMid, roughness: 0.42, metalness: 0.05 });
    const steel = kit.std({ color: tones.steel, roughness: 0.3, metalness: 0.85 });
    group.add(boxMesh(deps, woodTop, 1.15, 0.036, 0.8, 0, 0.722, 0, 'table-top'));
    group.add(boxMesh(deps, steel, 1.1, 0.05, 0.04, 0, 0.685, -0.36));
    group.add(boxMesh(deps, steel, 1.1, 0.05, 0.04, 0, 0.685, 0.36));
    for (const [lx, lz] of [
      [-0.51, -0.34],
      [0.51, -0.34],
      [-0.51, 0.34],
      [0.51, 0.34],
    ] as Array<[number, number]>) {
      group.add(boxMesh(deps, steel, 0.045, 0.7, 0.045, lx, 0.35, lz));
    }
    group.userData.topY = 0.74;
    return { group, topY: 0.74 };
  }

  // lightOak — minimalist round top on splayed legs.
  const oakTop = kit.std({ color: tones.woodLight, roughness: 0.48, metalness: 0.02 });
  const oakLeg = kit.std({ color: tones.woodMid, roughness: 0.52, metalness: 0.02 });
  group.add(cylMesh(deps, oakTop, 0.5, 0.5, 0.036, 22, 0, 0.722, 0, 'table-top'));
  for (let i = 0; i < 4; i += 1) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const px = Math.sin(angle) * 0.3;
    const pz = Math.cos(angle) * 0.3;
    // Raised centre compensates the splay so tips stay on the boards.
    const leg = cylMesh(deps, oakLeg, 0.021, 0.017, 0.72, 10, px, 0.362, pz);
    leg.rotation.z = -px * 0.28;
    leg.rotation.x = pz * 0.28;
    group.add(leg);
  }
  const stretcher = new THREE.Mesh(deps.geo.torus(0.3, 0.011, 6, 18), oakLeg);
  stretcher.rotation.x = Math.PI / 2;
  stretcher.position.set(0, 0.22, 0);
  stretcher.castShadow = true;
  group.add(stretcher);
  group.userData.topY = 0.74;
  return { group, topY: 0.74 };
}

/* ------------------------------------------------------------------------- */
/* Chairs                                                                     */
/* ------------------------------------------------------------------------- */

/** Builds one chair facing +z, seat at ~0.45 m. */
export function buildChair(
  deps: PieceDeps,
  kit: MaterialKit,
  tones: EraTones,
  style: ChairStyle,
  accentColors: string[],
  variantSeed: number,
  rnd: () => number,
): THREE.Group {
  const group = new THREE.Group();
  const slot = variantSeed;

  if (style === 'mismatchedWood') {
    // Mismatched survivors: wood tone and back style vary chair-to-chair.
    const woods = [tones.woodDark, tones.woodMid, tones.woodLight];
    const woodColor = woods[Math.floor(rnd() * woods.length)];
    const wood = kit.std({ color: woodColor, roughness: 0.68, metalness: 0.02 });
    group.add(boxMesh(deps, wood, 0.42, 0.035, 0.4, 0, 0.452, 0, 'chair-seat'));
    for (const [lx, lz] of [
      [-0.17, -0.16],
      [0.17, -0.16],
      [-0.17, 0.16],
      [0.17, 0.16],
    ] as Array<[number, number]>) {
      group.add(cylMesh(deps, wood, 0.017, 0.012, 0.45, 8, lx, 0.225, lz));
    }
    const backKind = Math.floor(rnd() * 3);
    if (backKind === 0) {
      // Slat back.
      for (const sx of [-0.16, 0.16]) {
        group.add(cylMesh(deps, wood, 0.016, 0.014, 0.46, 8, sx, 0.69, -0.185));
      }
      group.add(boxMesh(deps, wood, 0.37, 0.055, 0.02, 0, 0.86, -0.185));
      group.add(boxMesh(deps, wood, 0.37, 0.04, 0.02, 0, 0.75, -0.185));
    } else if (backKind === 1) {
      // Bentwood hoop.
      const hoop = new THREE.Mesh(deps.geo.torus(0.2, 0.016, 6, 18, Math.PI), wood);
      hoop.position.set(0, 0.67, -0.19);
      hoop.castShadow = true;
      group.add(hoop);
      group.add(boxMesh(deps, wood, 0.3, 0.07, 0.018, 0, 0.7, -0.19));
    } else {
      // Spindle back.
      group.add(boxMesh(deps, wood, 0.38, 0.06, 0.02, 0, 0.88, -0.185));
      for (let i = 0; i < 4; i += 1) {
        group.add(cylMesh(deps, wood, 0.008, 0.008, 0.36, 6, -0.135 + i * 0.09, 0.68, -0.185));
      }
    }
    // Scavenged repaint on some chairs.
    if (rnd() < 0.3) {
      (group.children[0] as THREE.Mesh).material = kit.std({ color: '#5f6b5a', roughness: 0.85 });
    }
    return group;
  }

  if (style === 'chromeVinyl') {
    const chrome = kit.std({ color: tones.chrome, roughness: 0.18, metalness: 0.92 });
    const vinyl = kit.std({ color: accentColors[slot % accentColors.length], roughness: 0.42 });
    group.add(boxMesh(deps, chrome, 0.4, 0.06, 0.38, 0, 0.47, 0, 'chair-seat'));
    markAccent(group.children[0] as THREE.Mesh, slot);
    for (const [lx, lz] of [
      [-0.18, -0.16],
      [0.18, -0.16],
      [-0.18, 0.16],
      [0.18, 0.16],
    ] as Array<[number, number]>) {
      group.add(cylMesh(deps, chrome, 0.013, 0.013, 0.44, 8, lx, 0.22, lz));
    }
    const footring = new THREE.Mesh(deps.geo.torus(0.155, 0.01, 6, 16), chrome);
    footring.rotation.x = Math.PI / 2;
    footring.position.set(0, 0.17, 0);
    footring.castShadow = true;
    group.add(footring);
    for (const ux of [-0.16, 0.16]) {
      const upright = cylMesh(deps, chrome, 0.012, 0.012, 0.34, 8, ux, 0.64, -0.175);
      upright.rotation.x = -0.16;
      group.add(upright);
    }
    const pad = boxMesh(deps, vinyl, 0.37, 0.23, 0.045, 0, 0.76, -0.205);
    pad.rotation.x = -0.16;
    markAccent(pad, slot);
    group.add(pad);
    const topRail = cylMesh(deps, chrome, 0.011, 0.011, 0.36, 8, 0, 0.83, -0.245);
    topRail.rotation.x = Math.PI / 2;
    group.add(topRail);
    return group;
  }

  if (style === 'tubularPastel') {
    const steel = kit.std({ color: tones.steel, roughness: 0.32, metalness: 0.8 });
    const shellMat = kit.std({
      color: accentColors[slot % accentColors.length],
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    group.add(boxMesh(deps, shellMat, 0.43, 0.04, 0.41, 0, 0.45, 0, 'chair-seat'));
    markAccent(group.children[0] as THREE.Mesh, slot);
    // Curved wrap-around back shell.
    const back = new THREE.Mesh(deps.geo.cylinderOpen(0.26, 0.26, 0.4, 14, Math.PI * 0.55, Math.PI * 0.9), shellMat);
    back.position.set(0, 0.68, 0.02);
    back.rotation.x = 0.12;
    back.castShadow = true;
    back.receiveShadow = true;
    back.name = 'chair-back';
    group.add(back);
    for (const [lx, lz] of [
      [-0.18, -0.17],
      [0.18, -0.17],
      [-0.18, 0.17],
      [0.18, 0.17],
    ] as Array<[number, number]>) {
      group.add(cylMesh(deps, steel, 0.017, 0.017, 0.43, 8, lx, 0.215, lz));
    }
    group.add(boxMesh(deps, steel, 0.36, 0.025, 0.025, 0, 0.2, 0));
    return group;
  }

  if (style === 'woodSteelCombo') {
    const wood = kit.std({ color: tones.woodMid, roughness: 0.45, metalness: 0.05 });
    const steel = kit.std({ color: tones.steel, roughness: 0.3, metalness: 0.85 });
    group.add(boxMesh(deps, wood, 0.43, 0.032, 0.42, 0, 0.455, 0, 'chair-seat'));
    for (const [lx, lz] of [
      [-0.18, -0.17],
      [0.18, -0.17],
      [-0.18, 0.17],
      [0.18, 0.17],
    ] as Array<[number, number]>) {
      group.add(boxMesh(deps, steel, 0.026, 0.44, 0.026, lx, 0.22, lz));
    }
    for (const ux of [-0.18, 0.18]) {
      const upright = boxMesh(deps, steel, 0.024, 0.44, 0.024, ux, 0.68, -0.19);
      upright.rotation.x = -0.18;
      group.add(upright);
    }
    const backSlab = boxMesh(deps, wood, 0.4, 0.27, 0.03, 0, 0.73, -0.225);
    backSlab.rotation.x = -0.18;
    group.add(backSlab);
    return group;
  }

  // ergoShell — molded shell on slim legs.
  const shellMat = kit.std({
    color: accentColors[slot % accentColors.length],
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const legMat = kit.std({ color: tones.steel, roughness: 0.5, metalness: 0.4 });
  group.add(boxMesh(deps, shellMat, 0.44, 0.035, 0.42, 0, 0.445, 0, 'chair-seat'));
  markAccent(group.children[0] as THREE.Mesh, slot);
  const back = new THREE.Mesh(deps.geo.cylinderOpen(0.27, 0.27, 0.46, 16, Math.PI * 0.6, Math.PI * 0.8), shellMat);
  back.position.set(0, 0.66, 0.03);
  back.rotation.x = 0.14;
  back.castShadow = true;
  back.receiveShadow = true;
  back.name = 'chair-back';
  group.add(back);
  for (let i = 0; i < 4; i += 1) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const leg = cylMesh(deps, legMat, 0.014, 0.011, 0.44, 8, Math.sin(angle) * 0.17, 0.22, Math.cos(angle) * 0.16);
    leg.rotation.z = -Math.sin(angle) * 0.12;
    leg.rotation.x = Math.cos(angle) * 0.12;
    group.add(leg);
  }
  return group;
}

/* ------------------------------------------------------------------------- */
/* Lounge seating (2005)                                                      */
/* ------------------------------------------------------------------------- */

export function buildSofa(deps: PieceDeps, kit: MaterialKit, tones: EraTones, accentColors: string[]): THREE.Group {
  const group = new THREE.Group();
  const fabric = kit.std({ color: tones.fabric, roughness: 0.95 });
  const cushion = kit.std({ color: tones.fabric, roughness: 0.98 });
  const steel = kit.std({ color: tones.steel, roughness: 0.3, metalness: 0.85 });

  group.add(boxMesh(deps, fabric, 1.9, 0.3, 0.85, 0, 0.31, 0, 'sofa-base'));
  group.add(boxMesh(deps, cushion, 0.88, 0.17, 0.74, -0.45, 0.54, 0.02, 'sofa-seat'));
  group.add(boxMesh(deps, cushion, 0.88, 0.17, 0.74, 0.45, 0.54, 0.02, 'sofa-seat'));
  for (const bx of [-0.45, 0.45]) {
    const backCushion = boxMesh(deps, cushion, 0.88, 0.44, 0.18, bx, 0.82, -0.32);
    backCushion.rotation.x = -0.1;
    group.add(backCushion);
  }
  for (const ax of [-0.95, 0.95]) {
    group.add(boxMesh(deps, fabric, 0.18, 0.56, 0.85, ax, 0.44, 0, 'sofa-arm'));
  }
  for (const [lx, lz] of [
    [-0.85, -0.34],
    [0.85, -0.34],
    [-0.85, 0.34],
    [0.85, 0.34],
  ] as Array<[number, number]>) {
    group.add(cylMesh(deps, steel, 0.016, 0.016, 0.13, 8, lx, 0.065, lz));
  }
  // Throw pillows pick up the era accent palette.
  const pillowColors = [accentColors[1 % accentColors.length], accentColors[2 % accentColors.length]];
  pillowColors.forEach((color, i) => {
    const mat = kit.std({ color, roughness: 0.9 });
    const pillow = boxMesh(deps, mat, 0.36, 0.32, 0.12, -0.4 + i * 0.8, 0.72, -0.2, 'sofa-pillow');
    pillow.rotation.x = -0.24;
    pillow.rotation.z = i === 0 ? 0.12 : -0.1;
    markAccent(pillow, i + 1);
    group.add(pillow);
  });
  return group;
}

export function buildCoffeeTable(deps: PieceDeps, kit: MaterialKit, tones: EraTones): THREE.Group {
  const group = new THREE.Group();
  const wood = kit.std({ color: tones.woodMid, roughness: 0.4, metalness: 0.05 });
  const steel = kit.std({ color: tones.steel, roughness: 0.3, metalness: 0.85 });
  group.add(boxMesh(deps, wood, 0.95, 0.032, 0.55, 0, 0.41, 0, 'coffee-table-top'));
  group.add(boxMesh(deps, steel, 0.9, 0.03, 0.5, 0, 0.385, 0));
  for (const [lx, lz] of [
    [-0.42, -0.22],
    [0.42, -0.22],
    [-0.42, 0.22],
    [0.42, 0.22],
  ] as Array<[number, number]>) {
    group.add(boxMesh(deps, steel, 0.03, 0.38, 0.03, lx, 0.19, lz));
  }
  return group;
}
