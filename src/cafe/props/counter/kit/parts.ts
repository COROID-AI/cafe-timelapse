import * as THREE from 'three';
import { box, cone, cylinder, markGlowSurface, orient, sphere, torus } from './geometries';
import { glow, paper } from './materials';

/**
 * Shared composite parts for the counter-technology era variants.
 *
 * Each factory builds a small self-contained assembly positioned around its
 * own local origin so call sites only choose a spot on the counter. Materials
 * are passed in (fresh per variant) to keep the crossfade contract intact.
 */

/**
 * Curled receipt paper strip rising from a slot and flopping forward (−z).
 * The curl bakes a bespoke open cylinder arc; it is NOT tagged shared, so rig
 * disposal cleans it up automatically.
 */
export function makeReceiptCurl(
  material: THREE.Material,
  width: number,
  x: number,
  y: number,
  z: number,
): THREE.Group {
  const strip = new THREE.Group();
  strip.name = 'receipt-strip';

  // Straight rise out of the slot.
  const riseHeight = width * 0.55;
  const rise = box(material, width, riseHeight, 0.004, 0, riseHeight / 2, 0);
  strip.add(rise);

  // Forward curl: quarter-ish open shell bending toward the customer side.
  const curlRadius = riseHeight * 0.9;
  const curl = new THREE.Mesh(
    new THREE.CylinderGeometry(curlRadius, curlRadius, width, 12, 1, true, 0, Math.PI * 0.8),
    material,
  );
  // Open cylinder axis along +y by default → rotate flat, face −z.
  orient(curl, Math.PI / 2, 0, 0);
  curl.position.set(0, riseHeight + curlRadius * 0.35, -curlRadius * 0.72);
  curl.rotation.z = Math.PI * 0.62;
  strip.add(curl);

  strip.position.set(x, y, z);
  return strip;
}

/** Paper roll mounted along +x behind a till/register lid. */
export function makePaperRoll(
  material: THREE.Material,
  radius: number,
  length: number,
  x: number,
  y: number,
  z: number,
): THREE.Mesh {
  const roll = cylinder(material, radius, radius, length, x, y, z);
  roll.rotation.z = Math.PI / 2;
  roll.name = 'paper-roll';
  return roll;
}

/** Small stack of slightly rotated paper sheets (pads, carbon slips). */
export function makeSheetStack(
  materials: THREE.Material[],
  w: number,
  d: number,
  sheetThickness = 0.0025,
): THREE.Group {
  const stack = new THREE.Group();
  stack.name = 'sheet-stack';
  let yOffset = 0;
  materials.forEach((material, index) => {
    const sheet = box(material, w, sheetThickness, d, 0, yOffset + sheetThickness / 2, 0);
    sheet.rotation.y = (index % 2 === 0 ? 1 : -1) * 0.02 * ((index % 3) + 1);
    stack.add(sheet);
    yOffset += sheetThickness;
  });
  return stack;
}

/** Short stack of stacked coins (two-tone option per coin). */
export function makeCoinStack(
  materials: [THREE.Material, THREE.Material],
  count: number,
  radius: number,
  x: number,
  z: number,
): THREE.Group {
  const stack = new THREE.Group();
  stack.name = 'coin-stack';
  const thickness = radius * 0.22;
  for (let i = 0; i < count; i += 1) {
    const coin = cylinder(
      materials[i % 2],
      radius * (i === count - 1 ? 0.94 : 1),
      radius,
      thickness,
      0,
      thickness / 2 + i * thickness,
      0,
      true,
    );
    coin.rotation.y = i * 0.7;
    stack.add(coin);
  }
  stack.position.set(x, 0, z);
  return stack;
}

/** Service bell: dome on a base plate with a tiny plunger button. */
export function makeServiceBell(
  bellMaterial: THREE.Material,
  baseMaterial: THREE.Material,
  radius: number,
): THREE.Group {
  const bellGroup = new THREE.Group();
  bellGroup.name = 'service-bell';
  const baseTopY = radius * 0.18;
  bellGroup.add(cylinder(baseMaterial, radius * 1.05, radius * 1.15, radius * 0.18, 0, radius * 0.09, 0));
  // Dome squashed along y: centre it so its flattened underside rests ON the
  // base plate instead of sinking below the counter surface.
  const domeSemiAxis = radius * 0.62;
  const dome = sphere(bellMaterial, radius, 0, baseTopY + domeSemiAxis * 0.72, 0, 0.62);
  dome.name = 'bell-dome';
  bellGroup.add(dome);
  bellGroup.add(cylinder(baseMaterial, radius * 0.14, radius * 0.14, radius * 0.16, 0, baseTopY + domeSemiAxis * 1.44 + radius * 0.06, 0));
  return bellGroup;
}

/**
 * QR code plaque: deterministic pseudo-random dark modules over a white
 * plate, with solid finder squares in three corners so it reads instantly.
 */
export function makeQrPlaque(
  plateMaterial: THREE.Material,
  moduleMaterial: THREE.Material,
  size: number,
  seed = 2025,
): THREE.Group {
  const plaque = new THREE.Group();
  plaque.name = 'qr-plaque';
  plaque.add(box(plateMaterial, size, size * 1.04, 0.008));

  const modules = 9;
  const cell = size / (modules + 1);
  let state = seed >>> 0;
  const random = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const finderCenters: Array<[number, number]> = [
    [-1, -1],
    [1, -1],
    [-1, 1],
  ];
  for (let row = 0; row < modules; row += 1) {
    for (let col = 0; col < modules; col += 1) {
      const gx = (col / (modules - 1) - 0.5) * (size - cell * 1.4);
      const gy = (row / (modules - 1) - 0.5) * (size - cell * 1.4);
      const inFinder = finderCenters.some(
        ([cx, cy]) => Math.abs(gx - cx * (size / 2 - cell)) <= cell * 1.15 && Math.abs(gy - cy * (size / 2 - cell)) <= cell * 1.15,
      );
      if (!inFinder && random() > 0.48) continue;
      plaque.add(box(moduleMaterial, cell * 0.82, cell * 0.82, 0.003, gx, gy, -0.0055));
    }
  }
  // Solid finder marks.
  for (const [cx, cy] of finderCenters) {
    const fx = cx * (size / 2 - cell);
    const fy = cy * (size / 2 - cell);
    plaque.add(box(moduleMaterial, cell * 2.4, cell * 2.4, 0.003, fx, fy, -0.0055));
    plaque.add(box(plateMaterial, cell * 1.3, cell * 1.3, 0.004, fx, fy, -0.0065));
  }

  return plaque;
}

/**
 * Contactless wave symbol: three concentric arcs fanning up-right, used on
 * tap readers. Marked as a glow surface so registration never forces shadow
 * casting onto it.
 */
export function makeContactlessWaves(
  material: THREE.Material,
  baseRadius: number,
  cx: number,
  cy: number,
  cz: number,
): THREE.Group {
  const waves = new THREE.Group();
  waves.name = 'contactless-waves';
  for (let i = 0; i < 3; i += 1) {
    const arc = torus(material, baseRadius + i * baseRadius * 0.85, baseRadius * 0.16, cx, cy, cz, {
      arc: Math.PI * 0.65,
      rotationZ: Math.PI * -0.32,
    });
    markGlowSurface(arc);
    waves.add(arc);
  }
  return waves;
}

/** Tiny status LED dot (emissive), safe against forced shadow casting. */
export function makeLedDot(colorHex: number, x: number, y: number, z: number): THREE.Mesh {
  const led = sphere(glow(colorHex, 1.9), 0.008, x, y, z, 0.7);
  led.name = 'status-led';
  markGlowSurface(led);
  return led;
}

/** Paper sheet lying flat on the counter (receipt pads, slips). */
export function makeFlatSheet(
  material: THREE.Material,
  w: number,
  d: number,
  x: number,
  z: number,
  rotationY = 0,
): THREE.Mesh {
  const sheet = box(material, w, 0.0016, d, x, 0.0008, z);
  sheet.rotation.y = rotationY;
  return sheet;
}

/** Pencil lying beside a receipt pad (hex body approximated by a prism). */
export function makePencil(
  bodyMaterial: THREE.Material,
  tipMaterial: THREE.Material,
  length: number,
  x: number,
  z: number,
): THREE.Group {
  const pencil = new THREE.Group();
  pencil.name = 'pencil';
  const hexRadius = length * 0.028;
  const body = cylinder(bodyMaterial, hexRadius, hexRadius, length * 0.86, 0, hexRadius, 0, true);
  body.rotation.z = Math.PI / 2;
  pencil.add(body);
  const tip = cone(tipMaterial, hexRadius, length * 0.14, -length * 0.5, hexRadius, 0);
  tip.rotation.z = Math.PI / 2;
  pencil.add(tip);
  const eraser = cylinder(paper(0xd88a8a), hexRadius, hexRadius, length * 0.08, 0, hexRadius, 0, true);
  eraser.rotation.z = Math.PI / 2;
  eraser.position.x = length * 0.47;
  pencil.add(eraser);
  pencil.position.set(x, 0, z);
  return pencil;
}
