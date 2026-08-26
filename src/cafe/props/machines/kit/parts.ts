import * as THREE from 'three';
import {
  box,
  cone,
  cylinder,
  disc,
  markGlowSurface,
  markNoCastShadow,
  orient,
  sphere,
  torus,
} from './geometries';
import type { SurfaceMaterial } from './materials';

/**
 * Composite prop parts shared by the five era composers.
 *
 * Everything here is procedural and parameterised; era files pick materials
 * and dimensions to hit their period look. All groups are built in a local
 * space whose origin is the supporting surface (worktop or floor) with fronts
 * facing −z.
 */

/* ------------------------------------------------------------------ *
 * Back bar + splashback                                               *
 * ------------------------------------------------------------------ */

export interface BackBarOptions {
  length: number;
  depth: number;
  /** Worktop slab material. */
  top: SurfaceMaterial;
  /** Body / apron panel material. */
  body: SurfaceMaterial;
  /** Recessed kick plinth material. */
  kick: SurfaceMaterial;
}

/**
 * The worktop every machine stands on. Local origin = top surface centre;
 * the carcass drops to exactly −0.92 so it meets the floor at world y≈0.
 */
export function makeBackBar(options: BackBarOptions): THREE.Group {
  const { length, depth, top, body, kick } = options;
  const group = new THREE.Group();

  group.add(box(top, length, 0.05, depth, 0, -0.025, 0));
  // Front edge lipping reads as the counter's shadow line.
  group.add(box(top, length, 0.065, 0.03, 0, -0.058, -depth / 2 + 0.015));
  group.add(box(body, length - 0.04, 0.56, depth - 0.07, 0, -0.33, 0));
  group.add(box(kick, length - 0.36, 0.31, depth - 0.24, 0, -0.765, 0.01));

  const endCapZ = 0;
  for (const sign of [-1, 1]) {
    group.add(
      box(body, 0.045, 0.56, depth - 0.05, sign * (length / 2 - 0.022), -0.33, endCapZ),
    );
  }
  return group;
}

export interface BacksplashOptions {
  length: number;
  height?: number;
  depth: number;
  panel: SurfaceMaterial;
  trim: SurfaceMaterial;
  /** Vertical slat count (2025 oak fluting); 0 = plain panel. */
  slats?: number;
  slatMaterial?: SurfaceMaterial;
}

/** Splashback rising from the rear edge of the back bar (+z side). */
export function makeBacksplash(options: BacksplashOptions): THREE.Group {
  const { length, depth, panel, trim } = options;
  const height = options.height ?? 0.46;
  const group = new THREE.Group();
  const rearZ = depth / 2 - 0.016;

  group.add(box(panel, length, height, 0.032, 0, height / 2, rearZ));
  group.add(box(trim, length, 0.028, 0.05, 0, height + 0.014, rearZ - 0.004));
  group.add(box(trim, length, 0.02, 0.045, 0, 0.01, rearZ - 0.004));

  if (options.slats && options.slats > 0 && options.slatMaterial) {
    const spacing = length / options.slats;
    for (let i = 0; i < options.slats; i += 1) {
      const x = -length / 2 + spacing * (i + 0.5);
      group.add(box(options.slatMaterial, spacing * 0.55, height - 0.05, 0.018, x, height / 2, rearZ - 0.026));
    }
  }
  return group;
}

/* ------------------------------------------------------------------ *
 * Cups, mugs & crockery                                               *
 * ------------------------------------------------------------------ */

export interface CupStackOptions {
  cup: SurfaceMaterial;
  count?: number;
  radius?: number;
  height?: number;
  saucers?: number;
  saucer?: SurfaceMaterial;
  rim?: SurfaceMaterial;
}

/** Nested cup stack with optional saucer pile underneath. Deterministic jitter. */
export function makeCupStack(options: CupStackOptions): THREE.Group {
  const {
    cup,
    count = 5,
    radius = 0.042,
    height = 0.085,
    saucers = 0,
    rim,
  } = options;
  const saucerMaterial = options.saucer ?? cup;
  const group = new THREE.Group();
  let y = 0;

  for (let i = 0; i < saucers; i += 1) {
    group.add(cylinder(saucerMaterial, radius + 0.03, radius + 0.026, 0.012, 0, y + 0.006, 0, true));
    y += 0.014;
  }

  const step = height * 0.42;
  for (let i = 0; i < count; i += 1) {
    const wobbleX = Math.sin(i * 12.9898 + 4.1) * 0.004;
    const wobbleZ = Math.cos(i * 7.233 + 1.7) * 0.004;
    const cupY = y + Math.max(height / 2 - 0.012, 0.02);
    const cupMesh = cylinder(cup, radius * 1.08, radius * 0.8, height, wobbleX, cupY, wobbleZ);
    if (rim) {
      cupMesh.add(cylinder(rim, radius * 1.081, radius * 1.081, 0.012, 0, height / 2 - 0.002, 0, true));
    }
    group.add(cupMesh);
    y += step;
  }
  return group;
}

/** Single mug with a D-handle on its +x side. */
export function makeMug(material: SurfaceMaterial, handle?: SurfaceMaterial): THREE.Group {
  const group = new THREE.Group();
  group.add(cylinder(material, 0.043, 0.036, 0.096, 0, 0.048, 0));
  group.add(torus(handle ?? material, 0.026, 0.007, 0.052, 0.05, 0, { arc: Math.PI, rotationZ: -Math.PI / 2 }));
  return group;
}

/** Mug tree with four hanging mugs — 1980s kitchen staple. */
export function makeMugTree(post: SurfaceMaterial, base: SurfaceMaterial, mug: SurfaceMaterial): THREE.Group {
  const group = new THREE.Group();
  group.add(cylinder(base, 0.085, 0.095, 0.02, 0, 0.01, 0, true));
  group.add(cylinder(post, 0.011, 0.013, 0.34, 0, 0.19, 0));
  group.add(sphere(post, 0.018, 0, 0.365, 0));

  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2;
    const arm = cylinder(post, 0.007, 0.007, 0.085);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = angle;
    arm.position.set(Math.cos(angle) * 0.048, 0.27, Math.sin(angle) * 0.048);
    group.add(arm);

    const mugGroup = makeMug(mug);
    mugGroup.rotation.order = 'YXZ';
    mugGroup.rotation.y = -angle;
    mugGroup.rotation.z = 1.25;
    mugGroup.position.set(Math.cos(angle) * 0.115, 0.235, Math.sin(angle) * 0.115);
    group.add(mugGroup);
  }
  return group;
}

/* ------------------------------------------------------------------ *
 * Jugs, canisters, serving ware                                       *
 * ------------------------------------------------------------------ */

export interface PitcherOptions {
  material: SurfaceMaterial;
  height?: number;
  rBottom?: number;
  rTop?: number;
  handleMaterial?: SurfaceMaterial;
}

/** Bellied milk pitcher / cappuccino frothing jug with rolled handle. */
export function makePitcher(options: PitcherOptions): THREE.Group {
  const {
    material,
    height = 0.155,
    rBottom = 0.045,
    rTop = 0.056,
    handleMaterial,
  } = options;
  const group = new THREE.Group();
  group.add(cylinder(material, rTop, rBottom * 0.82, height * 0.16, 0, height * 0.08, 0));
  group.add(cylinder(material, rTop * 1.12, rBottom, height * 0.84, 0, height * 0.58, 0));
  group.add(torus(handleMaterial ?? material, height * 0.3, 0.0075, rTop + 0.014, height * 0.55, 0, {
    arc: Math.PI,
    rotationZ: -Math.PI / 2,
  }));
  return group;
}

export interface CanisterRowOptions {
  materials: SurfaceMaterial[];
  lid: SurfaceMaterial;
  heights?: number[];
  radius?: number;
}

/** Row of storage canisters (coffee / tea / sugar), tallest first at −x. */
export function makeCanisterRow(options: CanisterRowOptions): THREE.Group {
  const { materials, lid } = options;
  const heights = options.heights ?? materials.map((_, i) => 0.17 - i * 0.02);
  const radius = options.radius ?? 0.055;
  const group = new THREE.Group();
  let x = 0;
  for (let i = 0; i < materials.length; i += 1) {
    const h = heights[i] ?? 0.16;
    group.add(cylinder(materials[i], radius, radius, h, x, h / 2, 0));
    group.add(cylinder(lid, radius * 0.92, radius * 1.04, 0.024, x, h + 0.012, 0, true));
    group.add(sphere(lid, radius * 0.32, x, h + 0.042, 0));
    x -= radius * 2.35;
  }
  return group;
}

/** Round serving tray with raised lip. */
export function makeTray(material: SurfaceMaterial, radius = 0.17): THREE.Group {
  const group = new THREE.Group();
  group.add(cylinder(material, radius, radius, 0.014, 0, 0.007, 0));
  group.add(torus(material, radius - 0.008, 0.009, 0, 0.016, 0, { rotationX: Math.PI / 2 }));
  return group;
}

/* ------------------------------------------------------------------ *
 * Machine hardware                                                    *
 * ------------------------------------------------------------------ */

export interface HotplateOptions {
  plate: SurfaceMaterial;
  coil: SurfaceMaterial;
  /** Optional glowing ring for "switched on" plates. */
  glowRing?: SurfaceMaterial;
  radius?: number;
}

/** Warming / boiling plate with exposed coil ring. */
export function makeHotplate(options: HotplateOptions): THREE.Group {
  const { plate, coil, radius = 0.1 } = options;
  const group = new THREE.Group();
  group.add(cylinder(plate, radius + 0.012, radius + 0.018, 0.022, 0, 0.011, 0, true));
  group.add(torus(coil, radius - 0.018, 0.007, 0, 0.026, 0, { rotationX: Math.PI / 2 }));
  if (options.glowRing) {
    group.add(markGlowSurface(torus(options.glowRing, radius - 0.028, 0.004, 0, 0.027, 0, { rotationX: Math.PI / 2 })));
  }
  return group;
}

/** Gas burner grate with an emissive flame disc underneath. */
export function makeGasBurner(
  steel: SurfaceMaterial,
  flame: SurfaceMaterial,
  radius = 0.075,
): THREE.Group {
  const group = new THREE.Group();
  group.add(markGlowSurface(disc(flame, radius * 0.62, 0, 0.008, 0)));
  group.add(cylinder(steel, radius * 0.32, radius * 0.4, 0.028, 0, 0.014, 0, true));
  group.add(torus(steel, radius, 0.008, 0, 0.03, 0, { rotationX: Math.PI / 2 }));
  for (let i = 0; i < 4; i += 1) {
    const spoke = box(steel, radius * 2, 0.008, 0.011, 0, 0.036, 0);
    spoke.rotation.y = (i / 4) * Math.PI;
    group.add(spoke);
  }
  return group;
}

export interface TapOptions {
  material: SurfaceMaterial;
  columnHeight?: number;
  reach?: number;
}

/**
 * Gooseneck dispense tap. Rises from its base, arcs forward over `reach`
 * and ends in a short down-facing nozzle at local z = −reach.
 */
export function makeGooseneckTap(options: TapOptions): THREE.Group {
  const { material } = options;
  const columnHeight = options.columnHeight ?? 0.15;
  const reach = options.reach ?? 0.085;
  const group = new THREE.Group();

  group.add(cylinder(material, 0.03, 0.036, 0.014, 0, 0.007, 0, true));
  group.add(cylinder(material, 0.0105, 0.0105, columnHeight, 0, columnHeight / 2, 0));

  // Quarter arc: centre sits forward of the column top, sweeping +z → +y.
  group.add(
    torus(material, reach, 0.0105, 0, columnHeight, -reach, {
      arc: Math.PI / 2,
      rotationY: -Math.PI / 2,
    }),
  );
  const nozzleY = columnHeight + reach - 0.028;
  group.add(cylinder(material, 0.008, 0.008, 0.056, 0, nozzleY, -reach));
  const tip = cone(material, 0.009, 0.02, 0, nozzleY - 0.036, -reach);
  tip.rotation.x = Math.PI;
  group.add(tip);
  return group;
}

export interface GaugeOptions {
  rim: SurfaceMaterial;
  face: SurfaceMaterial;
  needle: SurfaceMaterial;
  radius?: number;
}

/** Pressure gauge dial facing −z (toward the barista). */
export function makePressureGauge(options: GaugeOptions): THREE.Group {
  const { rim, face, needle } = options;
  const radius = options.radius ?? 0.034;
  const group = new THREE.Group();

  group.add(orient(cylinder(rim, radius, radius, 0.014, 0, 0, 0), Math.PI / 2, 0, 0));
  group.add(orient(cylinder(face, radius - 0.004, radius - 0.004, 0.016, 0, 0, 0), Math.PI / 2, 0, 0));
  group.add(torus(rim, radius - 0.001, 0.004, 0, 0, -0.008));
  const hand = box(needle, 0.0035, radius - 0.009, 0.003, 0, (radius - 0.009) / 2 - 0.002, -0.012);
  hand.rotation.z = -0.85;
  group.add(hand);
  group.add(sphere(needle, 0.005, 0, 0, -0.013));
  return group;
}

export interface ScreenOptions {
  frame: SurfaceMaterial;
  screen: SurfaceMaterial;
  width: number;
  height: number;
  /** Bezel thickness around the glowing area. */
  bezel?: number;
}

/**
 * Emissive display panel whose lit face points −z. Callers tilt/rotate the
 * returned group into place (negative rotation.x leans the top away).
 */
export function makeGlowScreen(options: ScreenOptions): THREE.Group {
  const { frame, screen, width, height } = options;
  const bezel = options.bezel ?? 0.014;
  const group = new THREE.Group();

  group.add(box(frame, width, height, 0.018, 0, 0, 0.009));
  const panel = markGlowSurface(box(screen, width - bezel * 2, height - bezel * 2, 0.006, 0, 0, -0.003));
  group.add(panel);
  return group;
}

/** Indicator LED / pilot lamp dot (emissive). */
export function makePilotDot(material: SurfaceMaterial, radius = 0.011): THREE.Mesh {
  return markGlowSurface(cylinder(material, radius, radius, 0.012, 0, 0, 0, true));
}

export interface DripTrayOptions {
  body: SurfaceMaterial;
  slots: SurfaceMaterial;
  width?: number;
  depth?: number;
}

/** Counter drip tray with drain slots. */
export function makeDripTray(options: DripTrayOptions): THREE.Group {
  const { body, slots } = options;
  const width = options.width ?? 0.3;
  const depth = options.depth ?? 0.14;
  const group = new THREE.Group();
  group.add(box(body, width, 0.018, depth, 0, 0.009, 0));
  const slotCount = 5;
  for (let i = 0; i < slotCount; i += 1) {
    const x = -width / 2 + (width / slotCount) * (i + 0.5);
    group.add(box(slots, width * 0.055, 0.004, depth * 0.62, x, 0.019, 0));
  }
  return group;
}

/** Portafilter: chromed head, twin spouts, black bow handle pointing −z/down. */
export function makePortafilter(head: SurfaceMaterial, handle: SurfaceMaterial): THREE.Group {
  const group = new THREE.Group();
  group.add(cylinder(head, 0.044, 0.04, 0.026, 0, 0.013, 0));
  group.add(cylinder(head, 0.02, 0.024, 0.02, 0, -0.008, 0));
  for (const sign of [-1, 1]) {
    const spout = cone(head, 0.009, 0.026, sign * 0.012, -0.03, 0.004);
    spout.rotation.x = Math.PI;
    group.add(spout);
  }
  const grip = cylinder(handle, 0.014, 0.011, 0.13, 0, -0.012, -0.085);
  grip.rotation.x = 1.25;
  group.add(grip);
  group.add(sphere(handle, 0.017, 0, -0.052, -0.138));
  return group;
}

/** Steam wand pivoting down-forward from its ball joint. */
export function makeSteamWand(pipe: SurfaceMaterial, tip: SurfaceMaterial, length = 0.17): THREE.Group {
  const group = new THREE.Group();
  group.add(sphere(pipe, 0.016, 0, 0, 0));
  const tube = cylinder(pipe, 0.007, 0.006, length, 0, -length / 2 + 0.01, -length * 0.36);
  tube.rotation.x = -0.72;
  group.add(tube);
  group.add(cone(tip, 0.008, 0.03, 0, -length + 0.02, -length * 0.72));
  return group;
}

export interface HopperOptions {
  glass: SurfaceMaterial;
  lid: SurfaceMaterial;
  content: SurfaceMaterial;
  rTop?: number;
  rBottom?: number;
  height?: number;
  fill?: number;
}

/** Transparent bean hopper with visible contents and lid cap. */
export function makeHopper(options: HopperOptions): THREE.Group {
  const { glass: glassMat, lid, content } = options;
  const rTop = options.rTop ?? 0.07;
  const rBottom = options.rBottom ?? 0.048;
  const height = options.height ?? 0.15;
  const fill = options.fill ?? 0.62;
  const group = new THREE.Group();

  group.add(markNoCastShadow(cylinder(glassMat, rTop, rBottom, height, 0, height / 2, 0)));
  group.add(cylinder(content, rBottom + (rTop - rBottom) * fill * 0.94, rBottom * 0.96, height * fill, 0, (height * fill) / 2 + 0.004, 0));
  group.add(cone(lid, rTop * 1.06, 0.032, 0, height + 0.016, 0));
  return group;
}

export interface KnockBoxOptions {
  body: SurfaceMaterial;
  rim: SurfaceMaterial;
  bar: SurfaceMaterial;
}

/** Counter knock box for spent espresso pucks. */
export function makeKnockBox(options: KnockBoxOptions): THREE.Group {
  const { body, rim, bar } = options;
  const group = new THREE.Group();
  group.add(cylinder(body, 0.088, 0.08, 0.125, 0, 0.0625, 0, true));
  group.add(torus(rim, 0.088, 0.011, 0, 0.126, 0, { rotationX: Math.PI / 2 }));
  const rubberBar = cylinder(bar, 0.009, 0.009, 0.19, 0, 0.132, 0);
  rubberBar.rotation.z = Math.PI / 2;
  group.add(rubberBar);
  return group;
}

export interface DispenserOptions {
  glass: SurfaceMaterial;
  liquid: SurfaceMaterial;
  lid: SurfaceMaterial;
  size?: number;
  fill?: number;
}

/** Glass cold-brew dispenser cube with tap stub at front-bottom. */
export function makeColdBrewDispenser(options: DispenserOptions): THREE.Group {
  const { glass: glassMat, liquid: liquidMat, lid } = options;
  const size = options.size ?? 0.165;
  const fill = options.fill ?? 0.78;
  const group = new THREE.Group();

  group.add(markNoCastShadow(box(glassMat, size, size, size, 0, size / 2, 0)));
  group.add(box(liquidMat, size - 0.018, (size - 0.02) * fill, size - 0.018, 0, ((size - 0.02) * fill) / 2 + 0.006, 0));
  group.add(box(lid, size + 0.012, 0.022, size + 0.012, 0, size + 0.011, 0));
  group.add(cylinder(lid, 0.006, 0.006, 0.02, 0, size + 0.032, 0));
  return group;
}

/** Milk carton with gable roof (fridge interiors, 2025). */
export function makeMilkCarton(material: SurfaceMaterial, height = 0.15): THREE.Group {
  const group = new THREE.Group();
  group.add(box(material, 0.062, height, 0.062, 0, height / 2, 0));
  const roof = box(material, 0.048, 0.048, 0.07, 0, height + 0.014, 0);
  roof.rotation.z = Math.PI / 4;
  group.add(roof);
  return group;
}

export interface CarafeOptions {
  glass: SurfaceMaterial;
  liquid: SurfaceMaterial;
  lid: SurfaceMaterial;
  handle?: SurfaceMaterial;
  rTop?: number;
  rBottom?: number;
  height?: number;
  /** 0…1 fraction of brewed coffee visible inside. */
  fill?: number;
}

/** Glass coffee carafe with liquid fill, lid and side handle loop. */
export function makeCoffeeCarafe(options: CarafeOptions): THREE.Group {
  const rTop = options.rTop ?? 0.05;
  const rBottom = options.rBottom ?? 0.086;
  const height = options.height ?? 0.165;
  const fill = options.fill ?? 0.55;
  const group = new THREE.Group();

  group.add(markNoCastShadow(cylinder(options.glass, rTop, rBottom, height, 0, height / 2, 0)));
  const taper = (rBottom - rTop) * fill;
  group.add(
    cylinder(
      options.liquid,
      rBottom * 0.84 - taper * 0.9,
      rBottom * 0.84,
      height * fill,
      0,
      (height * fill) / 2 + 0.008,
      0,
    ),
  );
  group.add(cylinder(options.lid, rTop * 1.06, rTop * 1.06, 0.02, 0, height + 0.008, 0, true));
  group.add(sphere(options.lid, 0.016, 0, height + 0.032, 0));
  group.add(
    torus(options.handle ?? options.lid, height * 0.34, 0.007, (rTop + rBottom) / 2 + 0.024, height * 0.52, 0, {
      arc: Math.PI,
      rotationZ: -Math.PI / 2,
    }),
  );
  return group;
}

