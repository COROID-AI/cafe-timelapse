import * as THREE from 'three';
import { box, cone, cylinder, disc, markNoCastShadow, sphere, torus } from './geometries';
import type { SurfaceMaterial } from './materials';

/**
 * Low-poly tabletop item builders.
 *
 * Every item is a fresh `THREE.Group` whose origin sits at its CONTACT POINT
 * with the tabletop (local y = 0), sized for a standard Ø0.10–0.11 m café
 * setting. Polycounts stay deliberately low — six tables × several items ×
 * five coincident era builds — so the whole group leans on shared unit
 * geometries and 8–18 segment primitives.
 *
 * Materials are passed in (never created here) to preserve the fresh-material
 * rule required by the era rig.
 */

/* ------------------------------------------------------------------ *
 * Cups, mugs & saucers                                                *
 * ------------------------------------------------------------------ */

export interface MugOptions {
  body: SurfaceMaterial;
  handle: SurfaceMaterial;
  /** Small dark spall on the rim — chipped wartime reuse. */
  chip?: SurfaceMaterial;
  radius?: number;
  height?: number;
}

/** Café mug: slightly tapered body, rim lip, D-handle on +x. */
export function makeMug(options: MugOptions): THREE.Group {
  const g = new THREE.Group();
  const radius = options.radius ?? 0.037;
  const height = options.height ?? 0.088;
  g.add(cylinder(options.body, radius, radius * 0.92, height, 0, height / 2, 0, true));
  g.add(torus(options.body, radius * 0.985, 0.004, 0, height, 0, { rotationX: Math.PI / 2 }));
  if (options.chip) {
    const angle = 0.6;
    g.add(
      sphere(
        options.chip,
        0.006,
        Math.cos(angle) * radius * 0.98,
        height - 0.002,
        Math.sin(angle) * radius * 0.98,
      ),
    );
  }
  const handle = torus(options.handle, height * 0.34, 0.0065, radius + height * 0.18, height * 0.52, 0);
  g.add(handle);
  return g;
}

export interface SaucerOptions {
  glaze: SurfaceMaterial;
  /** Decorative colour band — diner-style saucers. */
  accent?: SurfaceMaterial;
  radius?: number;
}

/** Shallow saucer with a rolled rim; radius varies for the mismatched look. */
export function makeSaucer(options: SaucerOptions): THREE.Group {
  const g = new THREE.Group();
  const radius = options.radius ?? 0.068;
  g.add(cylinder(options.glaze, radius, radius * 0.94, 0.007, 0, 0.0035, 0, true));
  g.add(torus(options.glaze, radius * 0.97, 0.0045, 0, 0.007, 0, { rotationX: Math.PI / 2 }));
  if (options.accent) {
    g.add(torus(options.accent, radius * 0.6, 0.0028, 0, 0.0074, 0, { rotationX: Math.PI / 2 }));
  }
  return g;
}

export interface PlateOptions {
  glaze: SurfaceMaterial;
  /** Colour ring — bright melamine diner plates. */
  band?: SurfaceMaterial;
  radius?: number;
}

/** Side plate with a raised centre and optional colour band. */
export function makePlate(options: PlateOptions): THREE.Group {
  const g = new THREE.Group();
  const radius = options.radius ?? 0.095;
  g.add(cylinder(options.glaze, radius, radius * 0.93, 0.011, 0, 0.0055, 0, true));
  g.add(torus(options.glaze, radius * 0.96, 0.005, 0, 0.011, 0, { rotationX: Math.PI / 2 }));
  if (options.band) {
    g.add(torus(options.band, radius * 0.78, 0.003, 0, 0.0122, 0, { rotationX: Math.PI / 2 }));
  }
  return g;
}

/* ------------------------------------------------------------------ *
 * Sugar service                                                       *
 * ------------------------------------------------------------------ */

export interface OpenSugarBowlOptions {
  glaze: SurfaceMaterial;
  /** Darkened interior floor. */
  inner: SurfaceMaterial;
  /** White granulated mound. */
  sugar: SurfaceMaterial;
}

/** Lidless sugar bowl — sugar exposed to wartime air and wasps alike. */
export function makeOpenSugarBowl(options: OpenSugarBowlOptions): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(options.glaze, 0.055, 0.036, 0.05, 0, 0.025, 0, true));
  g.add(disc(options.inner, 0.047, 0, 0.0502, 0));
  g.add(sphere(options.sugar, 0.045, 0, 0.045, 0, 0.42));
  return g;
}

export interface GlassPourerOptions {
  glassBody: SurfaceMaterial;
  steel: SurfaceMaterial;
}

/** 1980s glass sugar pourer with a pointed stainless dosing cap. */
export function makeGlassSugarPourer(options: GlassPourerOptions): THREE.Group {
  const g = new THREE.Group();
  g.add(markNoCastShadow(cylinder(options.glassBody, 0.033, 0.026, 0.085, 0, 0.0425, 0, true)));
  g.add(cylinder(options.steel, 0.035, 0.033, 0.018, 0, 0.094, 0, true));
  g.add(cone(options.steel, 0.035, 0.022, 0, 0.114, 0));
  g.add(sphere(options.steel, 0.008, 0, 0.128, 0));
  return g;
}

export interface DinerShakerOptions {
  glassBody: SurfaceMaterial;
  chromeTop: SurfaceMaterial;
  holes: SurfaceMaterial;
}

/** Chrome-topped diner sugar shaker with punched holes. */
export function makeDinerSugarShaker(options: DinerShakerOptions): THREE.Group {
  const g = new THREE.Group();
  g.add(markNoCastShadow(cylinder(options.glassBody, 0.024, 0.028, 0.068, 0, 0.034, 0, true)));
  g.add(cylinder(options.chromeTop, 0.0255, 0.0255, 0.02, 0, 0.078, 0, true));
  g.add(sphere(options.chromeTop, 0.0255, 0, 0.088, 0, 0.55));
  for (const [hx, hy, hz] of [
    [0.008, 0.102, 0],
    [-0.007, 0.101, 0.006],
    [0, 0.103, -0.008],
  ]) {
    g.add(sphere(options.holes, 0.0022, hx, hy, hz));
  }
  return g;
}

/* ------------------------------------------------------------------ *
 * Condiments & table clutter                                          *
 * ------------------------------------------------------------------ */

export interface KetchupBottleOptions {
  red: SurfaceMaterial;
  cap: SurfaceMaterial;
}

/** Classic diner squeeze bottle: red body, white conical tip. */
export function makeKetchupBottle(options: KetchupBottleOptions): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(options.red, 0.021, 0.03, 0.15, 0, 0.075, 0, true));
  g.add(cylinder(options.red, 0.014, 0.021, 0.012, 0, 0.156, 0, true));
  g.add(cone(options.cap, 0.016, 0.032, 0, 0.178, 0));
  g.add(sphere(options.cap, 0.005, 0, 0.196, 0));
  return g;
}

export interface AshtrayOptions {
  glaze: SurfaceMaterial;
  inner: SurfaceMaterial;
  stub: SurfaceMaterial;
  ash: SurfaceMaterial;
  radius?: number;
}

/** Glass/ceramic ashtray with two resting cigarette stubs (period-accurate). */
export function makeAshtray(options: AshtrayOptions): THREE.Group {
  const g = new THREE.Group();
  const radius = options.radius ?? 0.05;
  g.add(cylinder(options.glaze, radius, radius * 0.82, 0.017, 0, 0.0085, 0, true));
  g.add(disc(options.inner, radius * 0.74, 0, 0.0172, 0));
  const stubA = cylinder(options.stub, 0.004, 0.004, 0.03, 0.018, 0.021, 0.012, true);
  stubA.rotation.z = Math.PI / 2 - 0.15;
  g.add(stubA);
  g.add(sphere(options.ash, 0.0042, 0.034, 0.0225, 0.014));
  const stubB = cylinder(options.stub, 0.004, 0.004, 0.03, -0.016, 0.021, -0.01, true);
  stubB.rotation.z = Math.PI / 2 + 0.12;
  g.add(stubB);
  g.add(sphere(options.ash, 0.0042, -0.032, 0.0225, -0.012));
  return g;
}

export interface RationBookOptions {
  cover: SurfaceMaterial;
  pages: SurfaceMaterial;
  stripe: SurfaceMaterial;
}

/** Wartime ration book lying on a table — thin card cover, page block, stamp. */
export function makeRationBook(options: RationBookOptions): THREE.Group {
  const g = new THREE.Group();
  g.add(box(options.cover, 0.155, 0.011, 0.105, 0, 0.0055, 0));
  g.add(box(options.pages, 0.13, 0.007, 0.095, 0.012, 0.0145, -0.002));
  g.add(box(options.stripe, 0.024, 0.0016, 0.104, -0.062, 0.0118, 0));
  g.add(box(options.stripe, 0.02, 0.0014, 0.02, -0.02, 0.0118, -0.036));
  return g;
}

/* ------------------------------------------------------------------ *
 * Takeaway & self-serve (2005 / 2025)                                 *
 * ------------------------------------------------------------------ */

export interface TakeawayCupOptions {
  cup: SurfaceMaterial;
  sleeve: SurfaceMaterial;
  lid: SurfaceMaterial;
  /** Printed branding band between sleeve and lid. */
  band?: SurfaceMaterial;
  height?: number;
}

/** Branded paper takeaway cup: corrugated sleeve, domed lid, logo stripe. */
export function makeTakeawayCup(options: TakeawayCupOptions): THREE.Group {
  const g = new THREE.Group();
  const height = options.height ?? 0.112;
  const rBottom = 0.031;
  const rTop = 0.041;
  const rAt = (fraction: number): number => rBottom + (rTop - rBottom) * fraction;
  g.add(cylinder(options.cup, rTop, rBottom, height, 0, height / 2, 0, true));
  g.add(
    cylinder(
      options.sleeve,
      rAt(0.64) + 0.0045,
      rAt(0.2) + 0.0045,
      height * 0.44,
      0,
      height * 0.42,
      0,
      true,
    ),
  );
  if (options.band) {
    g.add(
      cylinder(
        options.band,
        rAt(0.8) + 0.0008,
        rAt(0.71) + 0.0008,
        height * 0.09,
        0,
        height * 0.755,
        0,
        true,
      ),
    );
  }
  g.add(cylinder(options.lid, rTop + 0.004, rTop + 0.004, 0.009, 0, height + 0.0025, 0, true));
  g.add(sphere(options.lid, rTop + 0.001, 0, height + 0.008, 0, 0.36));
  return g;
}

export interface NapkinDispenserOptions {
  steel: SurfaceMaterial;
  slotDark: SurfaceMaterial;
  napkin: SurfaceMaterial;
}

/** Brushed-steel counter napkin dispenser with a white napkin peeking out. */
export function makeNapkinDispenser(options: NapkinDispenserOptions): THREE.Group {
  const g = new THREE.Group();
  g.add(box(options.steel, 0.185, 0.07, 0.11, 0, 0.035, 0));
  g.add(box(options.slotDark, 0.135, 0.005, 0.016, 0, 0.0725, 0.032));
  g.add(box(options.napkin, 0.122, 0.006, 0.02, 0, 0.0755, 0.044));
  return g;
}

export interface SyrupBottleOptions {
  bottle: SurfaceMaterial;
  fill: SurfaceMaterial;
  cap: SurfaceMaterial;
  label: SurfaceMaterial;
}

/** Plastic syrup bottle (vanilla / caramel / chocolate) with flip cap. */
export function makeSyrupBottle(options: SyrupBottleOptions): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(options.fill, 0.02, 0.02, 0.1, 0, 0.055, 0, true));
  g.add(markNoCastShadow(cylinder(options.bottle, 0.026, 0.024, 0.126, 0, 0.0675, 0, true)));
  g.add(cylinder(options.cap, 0.014, 0.017, 0.026, 0, 0.142, 0, true));
  g.add(cylinder(options.cap, 0.019, 0.019, 0.011, 0, 0.1585, 0, true));
  g.add(cylinder(options.label, 0.027, 0.0245, 0.036, 0, 0.068, 0, true));
  return g;
}

export interface EcoCupOptions {
  cup: SurfaceMaterial;
  lid: SurfaceMaterial;
  band: SurfaceMaterial;
}

/** Reusable eco cup: matte body, grippy band, squat spill-proof lid. */
export function makeEcoCup(options: EcoCupOptions): THREE.Group {
  const g = new THREE.Group();
  const height = 0.1;
  const rBottom = 0.032;
  const rTop = 0.041;
  const rAt = (fraction: number): number => rBottom + (rTop - rBottom) * fraction;
  g.add(cylinder(options.cup, rTop, rBottom, height, 0, height / 2, 0, true));
  g.add(cylinder(options.band, rAt(0.58) + 0.002, rAt(0.4) + 0.002, 0.026, 0, height * 0.49, 0, true));
  g.add(cylinder(options.lid, rTop + 0.003, rTop + 0.003, 0.01, 0, height + 0.003, 0, true));
  g.add(sphere(options.lid, rTop, 0, height + 0.0095, 0, 0.34));
  return g;
}

export interface PourOverSetOptions {
  dripper: SurfaceMaterial;
  carafe: SurfaceMaterial;
  coffee: SurfaceMaterial;
}

/**
 * Ceramic pour-over set: glass carafe with handle, ceramic dripper seated on
 * the mouth. The showpiece item of the 2025 tabletop.
 */
export function makePourOverSet(options: PourOverSetOptions): THREE.Group {
  const g = new THREE.Group();
  g.add(markNoCastShadow(cylinder(options.carafe, 0.049, 0.041, 0.1, 0, 0.05, 0, true)));
  g.add(cylinder(options.coffee, 0.043, 0.038, 0.045, 0, 0.0285, 0, true));
  g.add(cylinder(options.carafe, 0.024, 0.032, 0.028, 0, 0.113, 0, true));
  g.add(cylinder(options.carafe, 0.026, 0.024, 0.012, 0, 0.133, 0, true));
  g.add(torus(options.carafe, 0.03, 0.0055, 0.058, 0.078, 0));
  g.add(cylinder(options.dripper, 0.054, 0.027, 0.06, 0, 0.168, 0, true));
  g.add(torus(options.dripper, 0.056, 0.005, 0, 0.198, 0, { rotationX: Math.PI / 2 }));
  return g;
}

export interface FlatWhiteGlassOptions {
  glassWall: SurfaceMaterial;
  coffee: SurfaceMaterial;
  crema: SurfaceMaterial;
}

/** Minimal Duralex-style flat-white glass with visible crema. */
export function makeFlatWhiteGlass(options: FlatWhiteGlassOptions): THREE.Group {
  const g = new THREE.Group();
  g.add(markNoCastShadow(cylinder(options.glassWall, 0.033, 0.03, 0.062, 0, 0.031, 0, true)));
  g.add(cylinder(options.coffee, 0.029, 0.0265, 0.048, 0, 0.026, 0, true));
  g.add(disc(options.crema, 0.0292, 0, 0.0503, 0));
  return g;
}

export interface TipJarOptions {
  jar: SurfaceMaterial;
  base: SurfaceMaterial;
  cards: SurfaceMaterial[];
  sign: SurfaceMaterial;
  accent: SurfaceMaterial;
}

/**
 * Card-reader tip jar: glass jar stuffed with card stubs, small sign leaning
 * against the front ("tap here — every penny counts").
 */
export function makeTipJar(options: TipJarOptions): THREE.Group {
  const g = new THREE.Group();
  g.add(cylinder(options.base, 0.05, 0.05, 0.008, 0, 0.004, 0, true));
  g.add(markNoCastShadow(cylinder(options.jar, 0.047, 0.047, 0.115, 0, 0.0655, 0, true)));
  const stubPlacements: Array<[number, number, number, number]> = [
    [0, 0.028, 0.004, 0.4],
    [0.006, 0.045, -0.002, -0.5],
    [-0.005, 0.06, 0.003, 0.9],
  ];
  stubPlacements.forEach(([sx, sy, sz, ry], index) => {
    const material = options.cards[index % options.cards.length];
    const stub = box(material, 0.066, 0.0018, 0.04, sx, sy, sz);
    stub.rotation.y = ry;
    g.add(stub);
  });
  const tilt = -0.3;
  const signPlate = box(options.sign, 0.08, 0.048, 0.005, 0, 0.132, 0.05);
  signPlate.rotation.x = tilt;
  g.add(signPlate);
  const accentStripe = box(options.accent, 0.08, 0.009, 0.005, 0, 0.159, 0.0584);
  accentStripe.rotation.x = tilt;
  g.add(accentStripe);
  return g;
}
