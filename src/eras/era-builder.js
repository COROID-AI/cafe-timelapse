/**
 * @file src/eras/era-builder.js
 * Shared procedural-geometry helpers used by every era module.
 *
 * Centralizes primitive furniture/equipment/tableware creation so era modules
 * *compose* scenes instead of duplicating geometry code. Each helper returns a
 * configured THREE.Group ready to be positioned by the caller.
 *
 * Materials use MeshStandardMaterial with era-appropriate roughness/metalness
 * for realistic PBR lighting. All geometry params have sensible defaults so
 * era modules can override only what matters.
 */
import * as THREE from 'three';
import { createTextTexture } from '../utils/canvas-text.js';

/* ------------------------------------------------------------------ *
 * Material helpers
 * ------------------------------------------------------------------ */

const matCache = new Map();

/**
 * Create (or fetch from cache) a standard material.
 * @param {Object} o
 * @returns {THREE.MeshStandardMaterial}
 */
export function mat(o = {}) {
  const key = JSON.stringify(o);
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color: o.color ?? 0xffffff,
    roughness: o.roughness ?? 0.7,
    metalness: o.metalness ?? 0.0,
    emissive: o.emissive ?? 0x000000,
    emissiveIntensity: o.emissiveIntensity ?? 1,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
    flatShading: o.flatShading ?? false,
    side: o.side ?? THREE.FrontSide
  });
  if (o.map) m.map = o.map;
  if (o.emissiveMap) m.emissiveMap = o.emissiveMap;
  matCache.set(key, m);
  return m;
}

/** Dispose all cached materials (called on era teardown). */
export function clearMatCache() {
  for (const m of matCache.values()) m.dispose();
  matCache.clear();
}

/** Build a mesh and mark it to receive + cast shadows. */
function mesh(geo, material, cast = true, receive = true) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

/** Group helper with optional position/rotation. */
function group(pos, rot) {
  const g = new THREE.Group();
  if (pos) g.position.set(pos[0], pos[1], pos[2]);
  if (rot) g.rotation.set(rot[0], rot[1], rot[2]);
  return g;
}

/* ------------------------------------------------------------------ *
 * Furniture: tables, chairs, booths, lamps, shelves, frames
 * ------------------------------------------------------------------ */

/**
 * Classic four-legged table with a top.
 * @param {{topColor?:number, legColor?:number, w?:number, d?:number, h?:number}} o
 */
export function makeTable(o = {}) {
  const topColor = o.topColor ?? 0x6b4a2b;
  const legColor = o.legColor ?? 0x3a2a1a;
  const w = o.w ?? 1.1;
  const d = o.d ?? 0.7;
  const h = o.h ?? 0.74;
  const g = group();

  const top = mesh(new THREE.BoxGeometry(w, 0.05, d), mat({ color: topColor, roughness: 0.6 }));
  top.position.y = h - 0.025;
  g.add(top);

  const legGeo = new THREE.BoxGeometry(0.07, h - 0.05, 0.07);
  const legMat = mat({ color: legColor, roughness: 0.5, metalness: 0.3 });
  const inset = 0.06;
  const pos = [
    [w / 2 - inset, (h - 0.05) / 2, d / 2 - inset],
    [-w / 2 + inset, (h - 0.05) / 2, d / 2 - inset],
    [w / 2 - inset, (h - 0.05) / 2, -d / 2 + inset],
    [-w / 2 + inset, (h - 0.05) / 2, -d / 2 + inset]
  ];
  for (const p of pos) {
    const leg = mesh(legGeo, legMat);
    leg.position.set(p[0], p[1], p[2]);
    g.add(leg);
  }
  return g;
}

/** Round pedestal "tulip" table (Saarinen style). */
export function makeTulipTable(o = {}) {
  const topColor = o.topColor ?? 0xf0f0f0;
  const stemColor = o.stemColor ?? 0xe8e8e8;
  const r = o.r ?? 0.45;
  const h = o.h ?? 0.74;
  const g = group();

  const top = mesh(new THREE.CylinderGeometry(r, r, 0.04, 32), mat({ color: topColor, roughness: 0.35 }));
  top.position.y = h - 0.02;
  g.add(top);

  const stem = mesh(new THREE.CylinderGeometry(0.05, 0.06, h - 0.04, 16), mat({ color: stemColor, roughness: 0.3, metalness: 0.6 }));
  stem.position.y = (h - 0.04) / 2;
  g.add(stem);

  const base = mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.03, 24), mat({ color: stemColor, roughness: 0.3, metalness: 0.6 }));
  base.position.y = 0.015;
  g.add(base);
  return g;
}

/** Communal reclaimed-wood table (long, thick top, chunky legs). */
export function makeCommunalTable(o = {}) {
  const topColor = o.topColor ?? 0x7a5230;
  const w = o.w ?? 2.4;
  const d = o.d ?? 0.9;
  const h = o.h ?? 0.76;
  const g = group();

  const top = mesh(new THREE.BoxGeometry(w, 0.09, d), mat({ color: topColor, roughness: 0.85 }));
  top.position.y = h - 0.045;
  g.add(top);

  const legGeo = new THREE.BoxGeometry(0.12, h - 0.09, 0.12);
  const legMat = mat({ color: 0x4a3220, roughness: 0.8 });
  for (const x of [w / 2 - 0.12, -w / 2 + 0.12]) {
    const leg = mesh(legGeo, legMat);
    leg.position.set(x, (h - 0.09) / 2, 0);
    g.add(leg);
  }
  // stretcher
  const stretcher = mesh(new THREE.BoxGeometry(w - 0.3, 0.06, 0.06), legMat);
  stretcher.position.set(0, 0.2, 0);
  g.add(stretcher);
  return g;
}

/** Glass-top table with metal base. */
export function makeGlassTable(o = {}) {
  const frameColor = o.frameColor ?? 0x9aa7b3;
  const r = o.r ?? 0.45;
  const h = o.h ?? 0.74;
  const g = group();

  const glass = mesh(new THREE.CylinderGeometry(r, r, 0.03, 32),
    mat({ color: 0xcfe8f0, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.4 }));
  glass.position.y = h - 0.015;
  g.add(glass);

  const stem = mesh(new THREE.CylinderGeometry(0.04, 0.05, h - 0.03, 12), mat({ color: frameColor, roughness: 0.3, metalness: 0.8 }));
  stem.position.y = (h - 0.03) / 2;
  g.add(stem);

  const base = mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.025, 20), mat({ color: frameColor, roughness: 0.3, metalness: 0.8 }));
  base.position.y = 0.012;
  g.add(base);
  return g;
}

/**
 * Chair with seat, back, and four legs.
 * @param {{seatColor?:number, frameColor?:number, metal?:boolean}} o
 */
export function makeChair(o = {}) {
  const seatColor = o.seatColor ?? 0x6b4a2b;
  const frameColor = o.frameColor ?? 0x3a2a1a;
  const seatH = o.seatH ?? 0.45;
  const metal = o.metal ?? false;
  const g = group();

  const seat = mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), mat({ color: seatColor, roughness: metal ? 0.4 : 0.7, metalness: metal ? 0.7 : 0.0 }));
  seat.position.y = seatH;
  g.add(seat);

  const back = mesh(new THREE.BoxGeometry(0.42, 0.5, 0.04), mat({ color: seatColor, roughness: metal ? 0.4 : 0.7, metalness: metal ? 0.7 : 0.0 }));
  back.position.set(0, seatH + 0.27, -0.19);
  g.add(back);

  const legGeo = new THREE.BoxGeometry(0.05, seatH, 0.05);
  const legMat = mat({ color: frameColor, roughness: 0.4, metalness: metal ? 0.8 : 0.3 });
  for (const x of [0.17, -0.17]) {
    for (const z of [0.17, -0.17]) {
      const leg = mesh(legGeo, legMat);
      leg.position.set(x, seatH / 2, z);
      g.add(leg);
    }
  }
  return g;
}

/** Tolix-style brushed-steel chair. */
export function makeTolixChair(o = {}) {
  return makeChair({ seatColor: o.color ?? 0x9aa7b3, frameColor: o.color ?? 0x6a727a, metal: true });
}

/** Egg / pod chair (1965). */
export function makeEggChair(o = {}) {
  const color = o.color ?? 0xb73a3a;
  const g = group();
  // shell body (half sphere, hollowed feel via scale)
  const shell = mesh(new THREE.SphereGeometry(0.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 1.6),
    mat({ color, roughness: 0.5 }));
  shell.position.y = 0.55;
  shell.scale.set(1, 1.2, 0.9);
  g.add(shell);
  // seat cushion
  const cushion = mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), mat({ color: 0xf0e8d8, roughness: 0.8 }));
  cushion.position.set(0, 0.5, 0.02);
  g.add(cushion);
  // pedestal base
  const pole = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 10), mat({ color: 0xcccccc, roughness: 0.3, metalness: 0.8 }));
  pole.position.y = 0.25;
  g.add(pole);
  const base = mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.03, 16), mat({ color: 0xcccccc, roughness: 0.3, metalness: 0.8 }));
  base.position.y = 0.015;
  g.add(base);
  return g;
}

/** Banquette booth (Naugahyde) for 1965+. */
export function makeBooth(o = {}) {
  const color = o.color ?? 0x8a3a3a;
  const g = group();
  // seat base
  const seat = mesh(new THREE.BoxGeometry(1.2, 0.12, 0.5), mat({ color, roughness: 0.6 }));
  seat.position.set(0, 0.45, 0);
  g.add(seat);
  // backrest
  const back = mesh(new THREE.BoxGeometry(1.2, 0.7, 0.14), mat({ color, roughness: 0.6 }));
  back.position.set(0, 0.85, -0.2);
  g.add(back);
  // tufted look — a few small spheres
  const tuftMat = mat({ color, roughness: 0.5 });
  for (let i = -1; i <= 1; i++) {
    const tuft = mesh(new THREE.SphereGeometry(0.04, 8, 8), tuftMat);
    tuft.position.set(i * 0.35, 0.85, -0.12);
    g.add(tuft);
  }
  return g;
}

/**
 * Pendant lamp.
 * @param {{shadeColor?:number, cordColor?:number, emissive?:number, r?:number, h?:number}} o
 */
export function makeLamp(o = {}) {
  const shadeColor = o.shadeColor ?? 0x222222;
  const cordColor = o.cordColor ?? 0x111111;
  const emissive = o.emissive ?? 0xffcc66;
  const r = o.r ?? 0.18;
  const h = o.h ?? 1.4; // cord length
  const g = group();

  const cord = mesh(new THREE.CylinderGeometry(0.008, 0.008, h, 6), mat({ color: cordColor, roughness: 0.8 }), false);
  cord.position.y = h / 2;
  g.add(cord);

  const shade = mesh(new THREE.ConeGeometry(r, 0.22, 24, 1, true), mat({ color: shadeColor, roughness: 0.5, side: THREE.DoubleSide }));
  shade.position.y = -0.05;
  shade.rotation.x = Math.PI;
  g.add(shade);

  const bulb = mesh(new THREE.SphereGeometry(0.06, 12, 12), mat({ color: emissive, emissive, emissiveIntensity: 1.4, roughness: 0.2 }));
  bulb.position.y = -0.04;
  g.add(bulb);
  return g;
}

/** Edison-bulb bare pendant (2005 third-wave). */
export function makeEdisonPendant(o = {}) {
  const h = o.h ?? 1.2;
  const g = group();
  const cord = mesh(new THREE.CylinderGeometry(0.006, 0.006, h, 6), mat({ color: 0x2a1a0a, roughness: 0.8 }), false);
  cord.position.y = h / 2;
  g.add(cord);
  const bulb = mesh(new THREE.SphereGeometry(0.07, 16, 16), mat({ color: 0xffb347, emissive: 0xff9a3c, emissiveIntensity: 1.6, roughness: 0.2 }));
  bulb.position.y = -0.02;
  g.add(bulb);
  // filament cage hint
  const cage = mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 12, 1, true), mat({ color: 0x664422, roughness: 0.5, transparent: true, opacity: 0.5, side: THREE.DoubleSide }), false);
  cage.position.y = -0.02;
  g.add(cage);
  return g;
}

/** Track light (small cylinder on a rail). */
export function makeTrackLight(o = {}) {
  const color = o.color ?? 0x333333;
  const g = group();
  const head = mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.12, 12), mat({ color, roughness: 0.4, metalness: 0.7 }));
  head.rotation.z = Math.PI / 4;
  head.position.set(0, -0.05, 0);
  g.add(head);
  const lens = mesh(new THREE.CircleGeometry(0.045, 12), mat({ color: 0xffe0a0, emissive: 0xffd080, emissiveIntensity: 1.2 }), false);
  lens.rotation.x = -Math.PI / 2 + Math.PI / 4;
  lens.position.set(0.042, -0.08, 0.042);
  g.add(lens);
  return g;
}

/** Wall shelf (floating). */
export function makeShelf(o = {}) {
  const color = o.color ?? 0x5a3a20;
  const w = o.w ?? 1.0;
  const d = o.d ?? 0.22;
  const g = group();
  const board = mesh(new THREE.BoxGeometry(w, 0.04, d), mat({ color, roughness: 0.7 }));
  board.position.y = 0;
  g.add(board);
  return g;
}

/** Simple picture frame on wall. */
export function makeFrame(o = {}) {
  const frameColor = o.frameColor ?? 0x3a2a1a;
  const artColor = o.artColor ?? 0xddccaa;
  const w = o.w ?? 0.6;
  const hgt = o.h ?? 0.8;
  const g = group();
  const art = mesh(new THREE.PlaneGeometry(w, hgt), mat({ color: artColor, roughness: 0.9 }));
  g.add(art);
  // frame border (4 thin boxes)
  const t = 0.05;
  const fm = mat({ color: frameColor, roughness: 0.5 });
  const top = mesh(new THREE.BoxGeometry(w + t * 2, t, 0.04), fm);
  top.position.set(0, hgt / 2 + t / 2, -0.01);
  g.add(top);
  const bot = mesh(new THREE.BoxGeometry(w + t * 2, t, 0.04), fm);
  bot.position.set(0, -hgt / 2 - t / 2, -0.01);
  g.add(bot);
  const left = mesh(new THREE.BoxGeometry(t, hgt, 0.04), fm);
  left.position.set(-w / 2 - t / 2, 0, -0.01);
  g.add(left);
  const right = mesh(new THREE.BoxGeometry(t, hgt, 0.04), fm);
  right.position.set(w / 2 + t / 2, 0, -0.01);
  g.add(right);
  return g;
}
/* ------------------------------------------------------------------ *
 * Tableware: cups, saucers, mugs, plates
 * ------------------------------------------------------------------ */

/** Latte-style ceramic cup with handle. */
export function makeCup(o = {}) {
  const color = o.color ?? 0xf5f0e8;
  const g = group();
  const body = mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.07, 16), mat({ color, roughness: 0.25 }));
  body.position.y = 0.035;
  g.add(body);
  // coffee surface
  const coffee = mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.004, 16), mat({ color: 0x3a1f0a, roughness: 0.3 }), false);
  coffee.position.y = 0.069;
  g.add(coffee);
  // handle
  const handle = mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 12, Math.PI), mat({ color, roughness: 0.25 }));
  handle.position.set(0.045, 0.045, 0);
  handle.rotation.y = Math.PI / 2;
  g.add(handle);
  return g;
}

/** Saucer under a cup. */
export function makeSaucer(o = {}) {
  const color = o.color ?? 0xf5f0e8;
  const g = group();
  const plate = mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.012, 24), mat({ color, roughness: 0.25 }));
  g.add(plate);
  return g;
}

/** Hefty ceramic mug. */
export function makeMug(o = {}) {
  const color = o.color ?? 0xe8e0d0;
  const g = group();
  const body = mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 16), mat({ color, roughness: 0.4 }));
  body.position.y = 0.05;
  g.add(body);
  const handle = mesh(new THREE.TorusGeometry(0.03, 0.007, 8, 12, Math.PI), mat({ color, roughness: 0.4 }));
  handle.position.set(0.05, 0.05, 0);
  handle.rotation.y = Math.PI / 2;
  g.add(handle);
  return g;
}

/** Espresso demitasse (small). */
export function makeEspressoCup(o = {}) {
  const color = o.color ?? 0xffffff;
  const g = group();
  const body = mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.05, 14), mat({ color, roughness: 0.25 }));
  body.position.y = 0.025;
  g.add(body);
  const handle = mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 10, Math.PI), mat({ color, roughness: 0.25 }));
  handle.position.set(0.03, 0.025, 0);
  handle.rotation.y = Math.PI / 2;
  g.add(handle);
  return g;
}

/** Plate. */
export function makePlate(o = {}) {
  const color = o.color ?? 0xf5f0e8;
  const g = group();
  const plate = mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.015, 24), mat({ color, roughness: 0.3 }));
  g.add(plate);
  return g;
}

/** Glass tumbler. */
export function makeGlass(o = {}) {
  const g = group();
  const body = mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.12, 16),
    mat({ color: 0xbfe0ea, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.5 }));
  body.position.y = 0.06;
  g.add(body);
  return g;
}

/* ------------------------------------------------------------------ *
 * Signs & menu boards
 * ------------------------------------------------------------------ */

/**
 * Menu board rendered with a canvas texture listing items + prices.
 * @param {{items?:Array<{name:string,price:string}>, title?:string, bgColor?:number, textColor?:string, frameColor?:number, w?:number, h?:number}} o
 */
export function makeMenuBoard(o = {}) {
  const items = o.items ?? [];
  const title = o.title ?? 'MENU';
  const bgColor = o.bgColor ?? 0x1a1410;
  const frameColor = o.frameColor ?? 0x3a2a1a;
  const w = o.w ?? 1.1;
  const hgt = o.h ?? 0.8;
  const g = group();

  const tex = createTextTexture({
    title,
    lines: items.map((it) => ({ left: it.name, right: it.price })),
    bg: '#' + bgColor.toString(16).padStart(6, '0'),
    textColor: o.textColor ?? '#f4ead5'
  });
  const boardMat = mat({ color: 0xffffff, roughness: 0.6, map: tex });
  const board = mesh(new THREE.PlaneGeometry(w, hgt), boardMat);
  g.add(board);

  // frame
  const t = 0.05;
  const fm = mat({ color: frameColor, roughness: 0.5 });
  const top = mesh(new THREE.BoxGeometry(w + t * 2, t, 0.05), fm);
  top.position.set(0, hgt / 2 + t / 2, -0.02);
  g.add(top);
  const bot = mesh(new THREE.BoxGeometry(w + t * 2, t, 0.05), fm);
  bot.position.set(0, -hgt / 2 - t / 2, -0.02);
  g.add(bot);
  const left = mesh(new THREE.BoxGeometry(t, hgt, 0.05), fm);
  left.position.set(-w / 2 - t / 2, 0, -0.02);
  g.add(left);
  const right = mesh(new THREE.BoxGeometry(t, hgt, 0.05), fm);
  right.position.set(w / 2 + t / 2, 0, -0.02);
  g.add(right);

  return g;
}

/**
 * Neon sign — emissive tube letters on a backing.
 * @param {{text?:string, color?:number, w?:number, h?:number}} o
 */
export function makeNeonSign(o = {}) {
  const text = o.text ?? 'OPEN';
  const color = o.color ?? 0xff4d9d;
  const w = o.w ?? 0.9;
  const hgt = o.h ?? 0.28;
  const g = group();

  const tex = createTextTexture({
    title: text,
    lines: [],
    bg: '#0a0a12',
    textColor: '#' + color.toString(16).padStart(6, '0'),
    neon: true
  });
  const sign = mesh(new THREE.PlaneGeometry(w, hgt),
    mat({ color, emissive: color, emissiveIntensity: 2.2, roughness: 0.4, map: tex, emissiveMap: tex }));
  g.add(sign);

  // backing box
  const back = mesh(new THREE.BoxGeometry(w + 0.06, hgt + 0.06, 0.04), mat({ color: 0x111118, roughness: 0.6 }), true, true);
  back.position.z = -0.04;
  g.add(back);
  return g;
}

/** Enamel / tin wall sign (1945). */
export function makeEnamelSign(o = {}) {
  const text = o.text ?? 'COFFEE';
  const color = o.color ?? 0xcc2222;
  const w = o.w ?? 0.7;
  const hgt = o.h ?? 0.5;
  const g = group();
  const tex = createTextTexture({
    title: text,
    lines: [],
    bg: '#' + color.toString(16).padStart(6, '0'),
    textColor: '#ffffff',
    subtitle: o.subtitle
  });
  const sign = mesh(new THREE.PlaneGeometry(w, hgt), mat({ color: 0xffffff, roughness: 0.3, metalness: 0.4, map: tex }));
  g.add(sign);
  // rim
  const rim = mesh(new THREE.BoxGeometry(w + 0.03, hgt + 0.03, 0.02), mat({ color: 0x888888, roughness: 0.3, metalness: 0.7 }));
  rim.position.z = -0.015;
  g.add(rim);
  return g;
}

/* ------------------------------------------------------------------ *
 * Counter
 * ------------------------------------------------------------------ */

/**
 * Service counter with a top and front panel.
 * @param {{topColor?:number, frontColor?:number, w?:number, h?:number, d?:number}} o
 */
export function makeCounter(o = {}) {
  const topColor = o.topColor ?? 0x4a3220;
  const frontColor = o.frontColor ?? 0x3a2818;
  const w = o.w ?? 2.2;
  const hgt = o.h ?? 1.05;
  const d = o.d ?? 0.7;
  const g = group();

  const top = mesh(new THREE.BoxGeometry(w, 0.06, d), mat({ color: topColor, roughness: 0.4, metalness: 0.1 }));
  top.position.y = hgt - 0.03;
  g.add(top);

  const front = mesh(new THREE.BoxGeometry(w, hgt - 0.06, 0.05), mat({ color: frontColor, roughness: 0.6 }));
  front.position.set(0, (hgt - 0.06) / 2, d / 2 - 0.025);
  g.add(front);

  const back = mesh(new THREE.BoxGeometry(w, hgt - 0.06, 0.05), mat({ color: frontColor, roughness: 0.6 }));
  back.position.set(0, (hgt - 0.06) / 2, -d / 2 + 0.025);
  g.add(back);

  // side panels
  const sideMat = mat({ color: frontColor, roughness: 0.6 });
  const left = mesh(new THREE.BoxGeometry(0.05, hgt - 0.06, d), sideMat);
  left.position.set(-w / 2 + 0.025, (hgt - 0.06) / 2, 0);
  g.add(left);
  const right = mesh(new THREE.BoxGeometry(0.05, hgt - 0.06, d), sideMat);
  right.position.set(w / 2 - 0.025, (hgt - 0.06) / 2, 0);
  g.add(right);
  return g;
}

/* ------------------------------------------------------------------ *
 * Patron figures (stylized low-poly humans)
 * ------------------------------------------------------------------ */

/**
 * Stylized patron figure. Each part is configurable for era outfits/hairstyles.
 * @param {{
 *   skin?:number, shirt?:number, pants?:number, hair?:number,
 *   hairStyle?:'short'|'long'|'bun'|'fedora'|'bouffant'|'buzz',
 *   accessory?:'none'|'glasses'|'phone'|'walkman'|'airpods',
 *   jacket?:number
 * }} o
 */
export function makePatron(o = {}) {
  const skin = o.skin ?? 0xc9956a;
  const shirt = o.shirt ?? 0x3a5f8a;
  const pants = o.pants ?? 0x2a2a3a;
  const hair = o.hair ?? 0x2a1a10;
  const hairStyle = o.hairStyle ?? 'short';
  const accessory = o.accessory ?? 'none';
  const g = group();

  const skinMat = mat({ color: skin, roughness: 0.7 });
  const shirtMat = mat({ color: shirt, roughness: 0.8 });
  const pantsMat = mat({ color: pants, roughness: 0.8 });
  const hairMat = mat({ color: hair, roughness: 0.8 });

  // legs
  const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.8, 10);
  const lLeg = mesh(legGeo, pantsMat);
  lLeg.position.set(-0.1, 0.4, 0);
  g.add(lLeg);
  const rLeg = mesh(legGeo, pantsMat);
  rLeg.position.set(0.1, 0.4, 0);
  g.add(rLeg);

  // torso
  const torso = mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.6, 12), shirtMat);
  torso.position.y = 1.1;
  g.add(torso);

  // jacket (optional overlay)
  if (o.jacket !== undefined) {
    const jacketMat = mat({ color: o.jacket, roughness: 0.7 });
    const jac = mesh(new THREE.CylinderGeometry(0.185, 0.165, 0.5, 12), jacketMat);
    jac.position.y = 1.12;
    g.add(jac);
  }

  // arms
  const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.55, 10);
  const lArm = mesh(armGeo, shirtMat);
  lArm.position.set(-0.22, 1.08, 0);
  g.add(lArm);
  const rArm = mesh(armGeo, shirtMat);
  rArm.position.set(0.22, 1.08, 0);
  g.add(rArm);

  // hands
  const handGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const lHand = mesh(handGeo, skinMat);
  lHand.position.set(-0.22, 0.8, 0);
  g.add(lHand);
  const rHand = mesh(handGeo, skinMat);
  rHand.position.set(0.22, 0.8, 0);
  g.add(rHand);

  // neck + head
  const neck = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 8), skinMat);
  neck.position.y = 1.46;
  g.add(neck);
  const head = mesh(new THREE.SphereGeometry(0.13, 16, 16), skinMat);
  head.position.y = 1.6;
  g.add(head);

  // hair by style
  switch (hairStyle) {
    case 'fedora': {
      const cap = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16), hairMat);
      cap.position.y = 1.7;
      g.add(cap);
      const brim = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.015, 20), hairMat);
      brim.position.y = 1.67;
      g.add(brim);
      break;
    }
    case 'bouffant': {
      const bouf = mesh(new THREE.SphereGeometry(0.16, 16, 16), hairMat);
      bouf.position.set(0, 1.68, -0.02);
      bouf.scale.set(1, 0.8, 1);
      g.add(bouf);
      break;
    }
    case 'bun': {
      const cap2 = mesh(new THREE.SphereGeometry(0.135, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
      cap2.position.y = 1.6;
      g.add(cap2);
      const bun = mesh(new THREE.SphereGeometry(0.06, 12, 12), hairMat);
      bun.position.set(0, 1.78, -0.08);
      g.add(bun);
      break;
    }
    case 'long': {
      const back = mesh(new THREE.BoxGeometry(0.24, 0.3, 0.06), hairMat);
      back.position.set(0, 1.5, -0.1);
      g.add(back);
      const cap3 = mesh(new THREE.SphereGeometry(0.135, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
      cap3.position.y = 1.6;
      g.add(cap3);
      break;
    }
    case 'buzz': {
      const cap4 = mesh(new THREE.SphereGeometry(0.132, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8), hairMat);
      cap4.position.y = 1.61;
      g.add(cap4);
      break;
    }
    default: { // short
      const cap5 = mesh(new THREE.SphereGeometry(0.135, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2), hairMat);
      cap5.position.y = 1.6;
      g.add(cap5);
      break;
    }
  }

  // accessories
  switch (accessory) {
    case 'glasses': {
      const lensMat = mat({ color: 0x111111, roughness: 0.2, metalness: 0.5 });
      const lLens = mesh(new THREE.TorusGeometry(0.035, 0.006, 6, 12), lensMat);
      lLens.position.set(-0.05, 1.6, 0.12);
      g.add(lLens);
      const rLens = mesh(new THREE.TorusGeometry(0.035, 0.006, 6, 12), lensMat);
      rLens.position.set(0.05, 1.6, 0.12);
      g.add(rLens);
      break;
    }
    case 'phone': {
      const phoneMat = mat({ color: 0x111111, roughness: 0.2, metalness: 0.6 });
      const phone = mesh(new THREE.BoxGeometry(0.07, 0.13, 0.01), phoneMat);
      phone.position.set(0.12, 1.2, 0.1);
      phone.rotation.x = -0.5;
      g.add(phone);
      break;
    }
    case 'walkman': {
      const wmMat = mat({ color: 0x444444, roughness: 0.4 });
      const wm = mesh(new THREE.BoxGeometry(0.1, 0.07, 0.03), wmMat);
      wm.position.set(-0.2, 1.25, 0.08);
      g.add(wm);
      // headphones band
      const band = mesh(new THREE.TorusGeometry(0.13, 0.008, 6, 16, Math.PI), mat({ color: 0x222222 }));
      band.position.set(0, 1.6, 0.02);
      band.rotation.x = Math.PI / 2;
      g.add(band);
      break;
    }
    case 'airpods': {
      const stem = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 6), mat({ color: 0xeeeeee }));
      stem.position.set(0.1, 1.55, 0.11);
      g.add(stem);
      break;
    }
    default:
      break;
  }

  return g;
}

/** Plant (for 2025 living wall / potted greenery). */
export function makePlant(o = {}) {
  const potColor = o.potColor ?? 0xb5a48a;
  const g = group();
  const pot = mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.18, 12), mat({ color: potColor, roughness: 0.7 }));
  pot.position.y = 0.09;
  g.add(pot);
  const leafMat = mat({ color: 0x4a7a3a, roughness: 0.8 });
  for (let i = 0; i < 5; i++) {
    const leaf = mesh(new THREE.SphereGeometry(0.1, 8, 8), leafMat);
    leaf.position.set(
      Math.cos(i * 1.3) * 0.08,
      0.24 + Math.sin(i) * 0.05,
      Math.sin(i * 1.3) * 0.08
    );
    leaf.scale.set(1, 1.4, 1);
    g.add(leaf);
  }
  return g;
}
/* ------------------------------------------------------------------ *
 * Era-specific equipment: coffee machines, grinders, music sources,
 * payment devices. Each returns a self-contained Group.
 * ------------------------------------------------------------------ */

/* ---- 1945: stove-top percolator + cathedral radio + crank register ---- */
export function makePercolator(o = {}) {
  const metal = o.metal ?? 0x999999;
  const g = group();
  const body = mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.18, 16), mat({ color: metal, roughness: 0.25, metalness: 0.8 }));
  body.position.y = 0.09;
  g.add(body);
  const spout = mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.08, 8), mat({ color: metal, roughness: 0.25, metalness: 0.8 }));
  spout.position.set(0.09, 0.13, 0);
  spout.rotation.z = -0.6;
  g.add(spout);
  const handle = mesh(new THREE.TorusGeometry(0.05, 0.01, 8, 12, Math.PI), mat({ color: 0x2a1a0a, roughness: 0.7 }));
  handle.position.set(-0.1, 0.12, 0);
  handle.rotation.y = Math.PI / 2;
  g.add(handle);
  const knob = mesh(new THREE.SphereGeometry(0.02, 8, 8), mat({ color: 0x2a1a0a, roughness: 0.7 }));
  knob.position.y = 0.19;
  g.add(knob);
  return g;
}

export function makeBurner(o = {}) {
  const g = group();
  const stand = mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.06, 12), mat({ color: 0x333333, roughness: 0.6, metalness: 0.5 }));
  stand.position.y = 0.03;
  g.add(stand);
  const ring = mesh(new THREE.TorusGeometry(0.07, 0.01, 8, 16), mat({ color: 0x222222, roughness: 0.5, metalness: 0.6 }));
  ring.position.y = 0.065;
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  return g;
}

/** Cathedral-style wooden radio cabinet (1945). */
export function makeCathedralRadio(o = {}) {
  const wood = o.wood ?? 0x5a3a1a;
  const g = group();
  // arched body
  const body = mesh(new THREE.BoxGeometry(0.5, 0.6, 0.28), mat({ color: wood, roughness: 0.5 }));
  body.position.y = 0.3;
  g.add(body);
  // arched top
  const arch = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.28, 16, 1, false, 0, Math.PI), mat({ color: wood, roughness: 0.5 }));
  arch.position.y = 0.6;
  arch.rotation.z = Math.PI / 2;
  arch.rotation.y = Math.PI / 2;
  g.add(arch);
  // speaker grille (cloth)
  const grille = mesh(new THREE.PlaneGeometry(0.32, 0.28), mat({ color: 0xc9b48a, roughness: 0.9 }));
  grille.position.set(0, 0.34, 0.141);
  g.add(grille);
  // dial strip
  const dial = mesh(new THREE.PlaneGeometry(0.22, 0.06), mat({ color: 0xf5e6a0, emissive: 0xc9a040, emissiveIntensity: 0.6, roughness: 0.4 }));
  dial.position.set(0, 0.16, 0.141);
  g.add(dial);
  // two knobs
  const knobMat = mat({ color: 0x2a1a0a, roughness: 0.5 });
  const k1 = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), knobMat);
  k1.position.set(-0.15, 0.12, 0.145);
  k1.rotation.x = Math.PI / 2;
  g.add(k1);
  const k2 = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), knobMat);
  k2.position.set(0.15, 0.12, 0.145);
  k2.rotation.x = Math.PI / 2;
  g.add(k2);
  return g;
}

/** Mechanical crank cash register with bell (1945). */
export function makeCrankRegister(o = {}) {
  const g = group();
  const body = mesh(new THREE.BoxGeometry(0.36, 0.3, 0.28), mat({ color: 0x6a4a2a, roughness: 0.4, metalness: 0.5 }));
  body.position.y = 0.15;
  g.add(body);
  const brassMat = mat({ color: 0xc8a464, roughness: 0.3, metalness: 0.8 });
  const top = mesh(new THREE.BoxGeometry(0.34, 0.06, 0.26), brassMat);
  top.position.y = 0.33;
  g.add(top);
  // bell
  const bell = mesh(new THREE.SphereGeometry(0.04, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), brassMat);
  bell.position.y = 0.39;
  g.add(bell);
  // crank
  const crank = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8), brassMat);
  crank.position.set(0.2, 0.2, 0.15);
  crank.rotation.z = Math.PI / 2;
  g.add(crank);
  const crankHandle = mesh(new THREE.BoxGeometry(0.03, 0.06, 0.02), brassMat);
  crankHandle.position.set(0.25, 0.22, 0.15);
  g.add(crankHandle);
  // key row
  for (let i = 0; i < 4; i++) {
    const key = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8), brassMat);
    key.position.set(-0.12 + i * 0.08, 0.305, 0.1);
    g.add(key);
  }
  return g;
}

/* ---- 1965: lever espresso machine + jukebox ---- */
export function makeLeverEspresso(o = {}) {
  const g = group();
  const body = mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.4, 20), mat({ color: 0xd8d8d8, roughness: 0.25, metalness: 0.8 }));
  body.position.y = 0.2;
  g.add(body);
  // groups (2)
  const groupMat = mat({ color: 0xb8b8b8, roughness: 0.3, metalness: 0.85 });
  for (const x of [-0.08, 0.08]) {
    const grp = mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.08, 12), groupMat);
    grp.position.set(x, 0.0, 0.1);
    g.add(grp);
    // portafilter
    const pf = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12), groupMat);
    pf.position.set(x, -0.05, 0.1);
    g.add(pf);
    // lever
    const lever = mesh(new THREE.BoxGeometry(0.02, 0.16, 0.02), groupMat);
    lever.position.set(x, 0.18, 0.14);
    g.add(lever);
  }
  // steam wand
  const wand = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 8), groupMat);
  wand.position.set(0.16, 0.18, 0.04);
  wand.rotation.z = 0.5;
  g.add(wand);
  // pressure gauge
  const gauge = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16), mat({ color: 0xf0f0e0, roughness: 0.3 }));
  gauge.position.set(0, 0.36, 0.13);
  gauge.rotation.x = Math.PI / 2;
  g.add(gauge);
  // drip tray
  const tray = mesh(new THREE.BoxGeometry(0.3, 0.02, 0.12), mat({ color: 0x888888, roughness: 0.3, metalness: 0.7 }));
  tray.position.set(0, -0.09, 0.08);
  g.add(tray);
  return g;
}

/** Wurlitzer-style jukebox (1965). */
export function makeJukebox(o = {}) {
  const g = group();
  // curved body
  const body = mesh(new THREE.CylinderGeometry(0.3, 0.28, 1.1, 16, 1, false, 0, Math.PI * 2), mat({ color: 0x8a1a1a, roughness: 0.3, metalness: 0.4 }));
  body.scale.x = 0.7;
  body.position.y = 0.55;
  g.add(body);
  // glowing top dome
  const dome = mesh(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat({ color: 0xff6a3a, emissive: 0xff4a2a, emissiveIntensity: 1.2, transparent: true, opacity: 0.85 }));
  dome.scale.x = 0.7;
  dome.position.y = 1.1;
  g.add(dome);
  // title strip glow
  const strip = mesh(new THREE.PlaneGeometry(0.32, 0.5), mat({ color: 0xffe0a0, emissive: 0xffd080, emissiveIntensity: 0.9, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  strip.position.set(0, 0.55, 0.2);
  g.add(strip);
  // selection buttons
  const btnMat = mat({ color: 0xffcc33, emissive: 0xcc8800, emissiveIntensity: 0.5, roughness: 0.3 });
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      const btn = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8), btnMat);
      btn.position.set(-0.08 + c * 0.16, 0.3 - r * 0.08, 0.2);
      btn.rotation.x = Math.PI / 2;
      g.add(btn);
    }
  }
  // base
  const base = mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.08, 16), mat({ color: 0x222222, roughness: 0.4, metalness: 0.6 }));
  base.scale.x = 0.7;
  base.position.y = 0.04;
  g.add(base);
  return g;
}

/* ---- 1985: two-group espresso + boombox ---- */
export function makeTwoGroupEspresso(o = {}) {
  const g = group();
  const body = mesh(new THREE.BoxGeometry(0.5, 0.4, 0.42), mat({ color: 0xcccccc, roughness: 0.25, metalness: 0.8 }));
  body.position.y = 0.2;
  g.add(body);
  // cup-warmer top
  const warmer = mesh(new THREE.BoxGeometry(0.48, 0.03, 0.4), mat({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.8 }));
  warmer.position.y = 0.415;
  g.add(warmer);
  // groups
  const groupMat = mat({ color: 0x999999, roughness: 0.3, metalness: 0.9 });
  for (const x of [-0.12, 0.12]) {
    const grp = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.09, 14), groupMat);
    grp.position.set(x, 0.0, 0.18);
    g.add(grp);
    const pf = mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.04, 14), groupMat);
    pf.position.set(x, -0.06, 0.18);
    g.add(pf);
  }
  // steam wand
  const wand = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8), groupMat);
  wand.position.set(0.22, 0.18, 0.06);
  wand.rotation.z = 0.6;
  g.add(wand);
  // E61 group badge (red dot)
  const badge = mesh(new THREE.CircleGeometry(0.012, 10), mat({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 1 }));
  badge.position.set(0, 0.28, 0.211);
  g.add(badge);
  // drip tray
  const tray = mesh(new THREE.BoxGeometry(0.46, 0.025, 0.16), groupMat);
  tray.position.set(0, -0.1, 0.12);
  g.add(tray);
  return g;
}

/** Boombox (1985). */
export function makeBoombox(o = {}) {
  const g = group();
  const body = mesh(new THREE.BoxGeometry(0.7, 0.42, 0.16), mat({ color: 0x2a2a2a, roughness: 0.4 }));
  body.position.y = 0.21;
  g.add(body);
  // two speakers
  const speakerMat = mat({ color: 0x111111, roughness: 0.7 });
  const grillMat = mat({ color: 0x555555, roughness: 0.6, metalness: 0.3 });
  for (const x of [-0.22, 0.22]) {
    const ring = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 20), speakerMat);
    ring.position.set(x, 0.21, 0.085);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const cone = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.01, 20), grillMat);
    cone.position.set(x, 0.21, 0.09);
    cone.rotation.x = Math.PI / 2;
    g.add(cone);
  }
  // cassette deck
  const deck = mesh(new THREE.BoxGeometry(0.2, 0.08, 0.02), mat({ color: 0x1a1a1a, roughness: 0.5 }));
  deck.position.set(0, 0.3, 0.085);
  g.add(deck);
  // handle
  const handle = mesh(new THREE.TorusGeometry(0.32, 0.012, 8, 24, Math.PI), mat({ color: 0x222222, roughness: 0.4 }));
  handle.position.set(0, 0.44, 0);
  handle.rotation.x = Math.PI / 2;
  g.add(handle);
  // LED
  const led = mesh(new THREE.BoxGeometry(0.12, 0.02, 0.005), mat({ color: 0xff3344, emissive: 0xff2233, emissiveIntensity: 1.2 }));
  led.position.set(0, 0.12, 0.085);
  g.add(led);
  return g;
}

/* ---- 2005: commercial espresso + Mazzer grinder + iPod dock ---- */
export function makeCommercialEspresso(o = {}) {
  const g = group();
  const body = mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), mat({ color: 0xeeeeee, roughness: 0.2, metalness: 0.7 }));
  body.position.y = 0.25;
  g.add(body);
  // cup warmer grate
  const warmer = mesh(new THREE.BoxGeometry(0.58, 0.02, 0.48), mat({ color: 0xcccccc, roughness: 0.3, metalness: 0.85 }));
  warmer.position.y = 0.51;
  g.add(warmer);
  // groups (2)
  const groupMat = mat({ color: 0x888888, roughness: 0.25, metalness: 0.95 });
  for (const x of [-0.14, 0.14]) {
    const grp = mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 16), groupMat);
    grp.position.set(x, 0.0, 0.2);
    g.add(grp);
    const pf = mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.05, 16), groupMat);
    pf.position.set(x, -0.07, 0.2);
    g.add(pf);
  }
  // PID display
  const pid = mesh(new THREE.PlaneGeometry(0.1, 0.05), mat({ color: 0x223344, emissive: 0x33aaff, emissiveIntensity: 0.8 }));
  pid.position.set(0, 0.38, 0.251);
  g.add(pid);
  // steam wand
  const wand = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.24, 8), groupMat);
  wand.position.set(0.26, 0.22, 0.06);
  wand.rotation.z = 0.5;
  g.add(wand);
  // drip tray
  const tray = mesh(new THREE.BoxGeometry(0.56, 0.03, 0.2), groupMat);
  tray.position.set(0, -0.11, 0.14);
  g.add(tray);
  return g;
}

export function makeGrinder(o = {}) {
  const g = group();
  const body = mesh(new THREE.BoxGeometry(0.18, 0.4, 0.2), mat({ color: 0xcccccc, roughness: 0.25, metalness: 0.85 }));
  body.position.y = 0.2;
  g.add(body);
  // hopper
  const hopper = mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.18, 16), mat({ color: 0x111111, roughness: 0.2, transparent: true, opacity: 0.6 }));
  hopper.position.y = 0.49;
  g.add(hopper);
  // chute
  const chute = mesh(new THREE.BoxGeometry(0.1, 0.05, 0.08), mat({ color: 0x888888, roughness: 0.3, metalness: 0.8 }));
  chute.position.set(0, 0.08, 0.1);
  g.add(chute);
  return g;
}

export function makePourOverTower(o = {}) {
  const g = group();
  // stand
  const stand = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), mat({ color: 0x888888, roughness: 0.3, metalness: 0.8 }));
  stand.position.y = 0.2;
  g.add(stand);
  const baseRing = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 16), mat({ color: 0x888888, roughness: 0.3, metalness: 0.8 }));
  baseRing.position.y = 0.005;
  g.add(baseRing);
  // arm
  const arm = mesh(new THREE.BoxGeometry(0.2, 0.02, 0.02), mat({ color: 0x888888, roughness: 0.3, metalness: 0.8 }));
  arm.position.set(0.08, 0.38, 0);
  g.add(arm);
  // dripper cone
  const cone = mesh(new THREE.ConeGeometry(0.07, 0.1, 16, 1, true), mat({ color: 0xf0f0f0, roughness: 0.3, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  cone.position.set(0.08, 0.3, 0);
  g.add(cone);
  // carafe
  const carafe = mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 12), mat({ color: 0xbfe0ea, roughness: 0.05, transparent: true, opacity: 0.4 }));
  carafe.position.set(0.08, 0.06, 0);
  g.add(carafe);
  return g;
}

/** iPod dock + small bookshelf speaker (2005). */
export function makeIpodDock(o = {}) {
  const g = group();
  const dock = mesh(new THREE.BoxGeometry(0.16, 0.04, 0.12), mat({ color: 0x222222, roughness: 0.3 }));
  dock.position.y = 0.02;
  g.add(dock);
  // iPod (white, click-wheel era)
  const ipod = mesh(new THREE.BoxGeometry(0.06, 0.1, 0.015), mat({ color: 0xf5f5f5, roughness: 0.25 }));
  ipod.position.set(0, 0.09, 0);
  ipod.rotation.x = -0.15;
  g.add(ipod);
  // screen
  const screen = mesh(new THREE.PlaneGeometry(0.04, 0.03), mat({ color: 0x99bbdd, emissive: 0x336699, emissiveIntensity: 0.6 }));
  screen.position.set(0, 0.115, 0.008);
  screen.rotation.x = -0.15;
  g.add(screen);
  // bookshelf speaker
  const speaker = mesh(new THREE.BoxGeometry(0.16, 0.26, 0.16), mat({ color: 0x3a3a3a, roughness: 0.5 }));
  speaker.position.set(0.22, 0.13, 0);
  g.add(speaker);
  const driver = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 16), mat({ color: 0x111111, roughness: 0.6 }));
  driver.position.set(0.22, 0.13, 0.085);
  driver.rotation.x = Math.PI / 2;
  g.add(driver);
  return g;
}

/* ---- 2025: under-counter Modbar + smart POS + bluetooth speaker ---- */
export function makeModbar(o = {}) {
  const g = group();
  // under-counter unit
  const unit = mesh(new THREE.BoxGeometry(0.5, 0.25, 0.4), mat({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.7 }));
  unit.position.y = 0.125;
  g.add(unit);
  // counter-top groups (2 sleek taps)
  const tapMat = mat({ color: 0xdddddd, roughness: 0.15, metalness: 0.95 });
  for (const x of [-0.12, 0.12]) {
    const base2 = mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.02, 16), tapMat);
    base2.position.set(x, 0.26, 0);
    g.add(base2);
    const spout = mesh(new THREE.BoxGeometry(0.03, 0.02, 0.1), tapMat);
    spout.position.set(x, 0.3, 0.04);
    g.add(spout);
  }
  // drip grate
  const grate = mesh(new THREE.BoxGeometry(0.4, 0.015, 0.16), tapMat);
  grate.position.set(0, 0.255, 0.04);
  g.add(grate);
  return g;
}

/** Smart contactless POS terminal (2025). */
export function makeSmartPOS(o = {}) {
  const g = group();
  const stand = mesh(new THREE.BoxGeometry(0.04, 0.18, 0.06), mat({ color: 0x222222, roughness: 0.4 }));
  stand.position.y = 0.09;
  g.add(stand);
  const base2 = mesh(new THREE.BoxGeometry(0.16, 0.02, 0.12), mat({ color: 0x333333, roughness: 0.4 }));
  base2.position.y = 0.01;
  g.add(base2);
  // tablet screen
  const screen = mesh(new THREE.BoxGeometry(0.26, 0.18, 0.012), mat({ color: 0x111111, roughness: 0.2 }));
  screen.position.set(0, 0.24, 0);
  screen.rotation.x = -0.3;
  g.add(screen);
  const display = mesh(new THREE.PlaneGeometry(0.24, 0.16), mat({ color: 0x223322, emissive: 0x66cc88, emissiveIntensity: 0.5 }));
  display.position.set(0, 0.24, 0.007);
  display.rotation.x = -0.3;
  g.add(display);
  // tap-to-pay pad
  const pad = mesh(new THREE.BoxGeometry(0.14, 0.01, 0.1), mat({ color: 0x1a1a1a, roughness: 0.3 }));
  pad.position.set(0.2, 0.005, 0.04);
  g.add(pad);
  const nfc = mesh(new THREE.TorusGeometry(0.03, 0.005, 8, 16), mat({ color: 0x7fd1b9, emissive: 0x7fd1b9, emissiveIntensity: 0.8 }));
  nfc.position.set(0.2, 0.012, 0.04);
  nfc.rotation.x = Math.PI / 2;
  g.add(nfc);
  return g;
}

/** Cylindrical bluetooth speaker + phone (2025). */
export function makeBluetoothSpeaker(o = {}) {
  const g = group();
  const body = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 24), mat({ color: 0x333333, roughness: 0.4, metalness: 0.3 }));
  body.position.y = 0.08;
  g.add(body);
  // mesh top
  const mesh_top = mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.005, 24), mat({ color: 0x222222, roughness: 0.7 }));
  mesh_top.position.y = 0.163;
  g.add(mesh_top);
  // LED ring
  const ring = mesh(new THREE.TorusGeometry(0.07, 0.005, 8, 24), mat({ color: 0x7fd1b9, emissive: 0x7fd1b9, emissiveIntensity: 0.8 }));
  ring.position.y = 0.04;
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  // phone leaning
  const phone = mesh(new THREE.BoxGeometry(0.07, 0.14, 0.006), mat({ color: 0x111111, roughness: 0.15, metalness: 0.5 }));
  phone.position.set(0.14, 0.075, 0);
  phone.rotation.z = 0.1;
  g.add(phone);
  const phoneScreen = mesh(new THREE.PlaneGeometry(0.06, 0.12), mat({ color: 0x113322, emissive: 0x33aa66, emissiveIntensity: 0.5 }));
  phoneScreen.position.set(0.14, 0.075, 0.004);
  phoneScreen.rotation.z = 0.1;
  g.add(phoneScreen);
  return g;
}

/* ---- 1965 adding-machine register ---- */
export function makeAddingRegister(o = {}) {
  const g = group();
  const body = mesh(new THREE.BoxGeometry(0.32, 0.24, 0.26), mat({ color: 0x2a4a6a, roughness: 0.4 }));
  body.position.y = 0.12;
  g.add(body);
  // paper roll
  const roll = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16), mat({ color: 0xf0f0e0, roughness: 0.9 }));
  roll.position.set(0, 0.28, 0);
  roll.rotation.z = Math.PI / 2;
  g.add(roll);
  // keys
  const keyMat = mat({ color: 0xeeeeee, roughness: 0.4 });
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const key = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8), keyMat);
      key.position.set(-0.08 + c * 0.08, 0.25, -0.06 + r * 0.06);
      g.add(key);
    }
  }
  return g;
}

/* ---- 1985 fluorescent-tube register (early electronic) ---- */
export function makeDigitalRegister(o = {}) {
  const g = group();
  const body = mesh(new THREE.BoxGeometry(0.34, 0.22, 0.28), mat({ color: 0x887788, roughness: 0.4 }));
  body.position.y = 0.11;
  g.add(body);
  // fluorescent display
  const disp = mesh(new THREE.PlaneGeometry(0.22, 0.06), mat({ color: 0x99ffaa, emissive: 0x33ff66, emissiveIntensity: 1.4 }));
  disp.position.set(0, 0.2, 0.141);
  g.add(disp);
  // drawer
  const drawer = mesh(new THREE.BoxGeometry(0.3, 0.06, 0.04), mat({ color: 0x666666, roughness: 0.4, metalness: 0.6 }));
  drawer.position.set(0, 0.04, 0.15);
  g.add(drawer);
  return g;
}

/* ---- 2005 early flat-screen POS ---- */
export function makeFlatPOS(o = {}) {
  const g = group();
  const arm = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 8), mat({ color: 0x333333, roughness: 0.4 }));
  arm.position.y = 0.1;
  g.add(arm);
  const base2 = mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 16), mat({ color: 0x333333, roughness: 0.4 }));
  base2.position.y = 0.01;
  g.add(base2);
  const screen = mesh(new THREE.BoxGeometry(0.28, 0.2, 0.02), mat({ color: 0x222222, roughness: 0.3 }));
  screen.position.set(0, 0.22, 0);
  screen.rotation.x = -0.2;
  g.add(screen);
  const display = mesh(new THREE.PlaneGeometry(0.25, 0.17), mat({ color: 0x224466, emissive: 0x4488bb, emissiveIntensity: 0.5 }));
  display.position.set(0, 0.22, 0.012);
  display.rotation.x = -0.2;
  g.add(display);
  return g;
}

/** Arcade cabinet (1985 corner detail). */
export function makeArcadeCabinet(o = {}) {
  const g = group();
  const body = mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), mat({ color: 0x1a1a3a, roughness: 0.4 }));
  body.position.y = 0.75;
  g.add(body);
  // marquee
  const marquee = mesh(new THREE.BoxGeometry(0.58, 0.16, 0.08), mat({ color: 0xff33aa, emissive: 0xff33aa, emissiveIntensity: 1.2 }));
  marquee.position.set(0, 1.36, 0.04);
  g.add(marquee);
  // screen
  const screen = mesh(new THREE.PlaneGeometry(0.4, 0.3), mat({ color: 0x2233aa, emissive: 0x3366ff, emissiveIntensity: 1.0 }));
  screen.position.set(0, 1.05, 0.301);
  g.add(screen);
  // control panel
  const panel = mesh(new THREE.BoxGeometry(0.56, 0.04, 0.2), mat({ color: 0x333344, roughness: 0.5 }));
  panel.position.set(0, 0.82, 0.2);
  panel.rotation.x = -0.3;
  g.add(panel);
  // joystick
  const stick = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8), mat({ color: 0xff2222, roughness: 0.4 }));
  stick.position.set(-0.1, 0.88, 0.18);
  stick.rotation.x = 0.3;
  g.add(stick);
  const ball = mesh(new THREE.SphereGeometry(0.025, 10, 10), mat({ color: 0xff2222, roughness: 0.3 }));
  ball.position.set(-0.1, 0.93, 0.15);
  g.add(ball);
  return g;
}

/** QR-code table tent (2025). */
export function makeQRTent(o = {}) {
  const g = group();
  const stand = mesh(new THREE.BoxGeometry(0.12, 0.16, 0.02), mat({ color: 0xfafafa, roughness: 0.4 }));
  stand.position.y = 0.08;
  g.add(stand);
  // QR pattern (checker)
  const tex = createTextTexture({
    title: '',
    lines: [{ left: 'SCAN', right: 'MENU' }],
    bg: '#ffffff',
    textColor: '#111111',
    qr: true
  });
  const card = mesh(new THREE.PlaneGeometry(0.1, 0.1), mat({ color: 0xffffff, map: tex, roughness: 0.5 }));
  card.position.set(0, 0.1, 0.011);
  g.add(card);
  return g;
}

/** VHS rental shelf (1985). */
export function makeVHSRack(o = {}) {
  const g = group();
  const frame = mesh(new THREE.BoxGeometry(0.8, 1.2, 0.3), mat({ color: 0x3a2a4a, roughness: 0.6 }));
  frame.position.y = 0.6;
  g.add(frame);
  const tapeColors = [0x882244, 0x224488, 0x448822, 0x886622, 0x6622aa];
  const tapeMat = mat({ color: 0x222222, roughness: 0.6 });
  for (let row = 0; row < 3; row++) {
    for (let c = 0; c < 5; c++) {
      const tape = mesh(new THREE.BoxGeometry(0.1, 0.16, 0.03), mat({ color: tapeColors[(row + c) % 5], roughness: 0.5 }));
      tape.position.set(-0.28 + c * 0.14, 0.35 + row * 0.35, 0.15);
      g.add(tape);
      const label = mesh(new THREE.PlaneGeometry(0.08, 0.06), mat({ color: 0xeeeeee, roughness: 0.6 }));
      label.position.set(-0.28 + c * 0.14, 0.43 + row * 0.35, 0.166);
      g.add(label);
    }
  }
  return g;
}

/** Recurring static detail: wall clock. */
export function makeWallClock(o = {}) {
  const color = o.color ?? 0xf0f0e0;
  const g = group();
  const face = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 24), mat({ color, roughness: 0.4 }));
  face.rotation.x = Math.PI / 2;
  g.add(face);
  const rim = mesh(new THREE.TorusGeometry(0.14, 0.012, 8, 24), mat({ color: 0x333333, roughness: 0.4, metalness: 0.5 }));
  g.add(rim);
  // hands
  const hour = mesh(new THREE.BoxGeometry(0.012, 0.06, 0.005), mat({ color: 0x222222 }));
  hour.position.set(0, 0.03, 0.012);
  g.add(hour);
  const minute = mesh(new THREE.BoxGeometry(0.008, 0.09, 0.005), mat({ color: 0x222222 }));
  minute.position.set(0.03, 0.03, 0.012);
  g.add(minute);
  return g;
}

/** A bookshelf of CDs (2005 detail). */
export function makeCDShelf(o = {}) {
  const g = group();
  const frame = mesh(new THREE.BoxGeometry(0.6, 0.5, 0.18), mat({ color: 0x3a2a20, roughness: 0.7 }));
  frame.position.y = 0.25;
  g.add(frame);
  const cdColors = [0xaa3333, 0x3333aa, 0x33aa33, 0xaaaa33, 0xaa33aa, 0x33aaaa];
  for (let row = 0; row < 2; row++) {
    for (let c = 0; c < 8; c++) {
      const cd = mesh(new THREE.BoxGeometry(0.05, 0.18, 0.02), mat({ color: cdColors[(row + c) % 6], roughness: 0.4, metalness: 0.3 }));
      cd.position.set(-0.24 + c * 0.07, 0.2 + row * 0.18, 0.05);
      g.add(cd);
    }
  }
  return g;
}

/** Plant wall panel (2025). */
export function makePlantWall(o = {}) {
  const g = group();
  const back = mesh(new THREE.BoxGeometry(1.4, 1.0, 0.05), mat({ color: 0x3a4a30, roughness: 0.9 }));
  back.position.y = 0.5;
  g.add(back);
  const leafMat = mat({ color: 0x4a7a3a, roughness: 0.8 });
  const leafMat2 = mat({ color: 0x6a9a5a, roughness: 0.8 });
  for (let i = 0; i < 24; i++) {
    const leaf = mesh(new THREE.SphereGeometry(0.07 + Math.random() * 0.04, 6, 6), i % 2 ? leafMat : leafMat2);
    leaf.position.set(
      -0.6 + Math.random() * 1.2,
      0.15 + Math.random() * 0.8,
      0.05 + Math.random() * 0.08
    );
    leaf.scale.set(1, 1.2, 0.8);
    g.add(leaf);
  }
  return g;
}
