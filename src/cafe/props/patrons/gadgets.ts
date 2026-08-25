/**
 * Table & carried gadgets that date each era, 1945 → 2025.
 *
 * Builders are keyed by {@link GadgetDeviceId} and return a `GadgetBuild`:
 * `root` parents to the figure/tablespace per the mount type, `headRoot`
 * (when present) parents to the head pivot for headphones/earbuds.
 *
 * Authoring frames per mount:
 * - rightHand/screen: grip at origin, item extends upward (+y).
 * - bothHands: centred upright, facing +z toward the user's face.
 * - table: resting on surface (origin at bottom centre), front +z faces patron.
 * - worn: root parents to torsoPivot, headRoot to headPivot.
 * - stool: boombox sits on a counter stool; origin at seat top.
 */

import * as THREE from 'three';
import type { PatronKit } from './kit';
import type { GadgetDeviceId } from './types';
import { HEAD_RADIUS, HEAD_CENTER_Y } from './hairstyles';

export interface GadgetBuild {
  root: THREE.Group;
  headRoot?: THREE.Group;
}

/** Shared white for earbud cords and phone screens. */
const WHITE = 0xf4f1ea;

export function buildGadget(id: GadgetDeviceId, kit: PatronKit): GadgetBuild {
  switch (id) {
    case 'teacup':
      return { root: buildTeacup(kit) };
    case 'newspaper':
      return { root: buildNewspaper(kit) };
    case 'pipe':
      return { root: buildPipe(kit) };
    case 'transistorRadio':
      return { root: buildTransistorRadio(kit) };
    case 'walkman':
      return buildWalkman(kit);
    case 'boombox':
      return { root: buildBoombox(kit) };
    case 'flipPhone':
      return { root: buildFlipPhone(kit) };
    case 'earbudCord':
      return { root: buildEarbudCord(kit) };
    case 'laptop':
      return { root: buildLaptop(kit) };
    case 'smartphone':
      return { root: buildSmartphone(kit) };
    case 'wirelessEarbuds':
      return buildWirelessEarbuds(kit);
    case 'laptopTablet':
      return { root: buildLaptopTabletCombo(kit) };
    case 'eReader':
      return { root: buildEReader(kit) };
  }
}

/* ----- 1945 --------------------------------------------------------------- */

function buildTeacup(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'gadget-teacup';
  const china = kit.std({ color: 0xf2ede2, roughness: 0.32 });
  const tea = kit.std({ color: 0x6f4a2e, roughness: 0.5 });
  const saucer = kit.cylinder(china, 0.046, 0.046, 0.006, 0, 0.003, 0);
  saucer.position.y = -0.002;
  root.add(saucer);
  const cup = kit.cylinder(china, 0.028, 0.02, 0.048, 0, 0.024, 0);
  root.add(cup);
  const teaSurface = kit.sphere(tea, 0.021, 0, 0.054, 0);
  teaSurface.scale.set(1.06, 0.96, 1.06);
  root.add(teaSurface);
  const handle = new THREE.Mesh(
    kit.custom(new THREE.TorusGeometry(0.016, 0.0045, 6, 12, Math.PI)),
    china,
  );
  handle.rotation.y = Math.PI / 2;
  handle.position.set(0.03, 0.032, 0);
  handle.name = 'handle';
  root.add(handle);
  return root;
}

function buildNewspaper(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'gadget-newspaper';
  const newsprint = kit.std({ color: 0xe9e4d5, roughness: 0.92 });
  const ink = kit.std({ color: 0x4a463f, roughness: 0.92 });
  const grey = kit.std({ color: 0xb5b0a5, roughness: 0.92 });
  root.add(kit.box(newsprint, 0.3, 0.004, 0.4, 0, 0.002, 0));
  const headline = kit.box(ink, 0.22, 0.0012, 0.028, 0, 0.0052, -0.158);
  headline.name = 'headline';
  root.add(headline);
  for (let i = 0; i < 5; i++) {
    const stripe = kit.box(grey, 0.24, 0.0008, 0.011, 0, 0.0048, -0.1 + i * 0.055);
    stripe.name = 'text-lines';
    root.add(stripe);
  }
  const fold = kit.box(grey, 0.3, 0.001, 0.004, 0, 0.0045, 0);
  fold.name = 'fold-crease';
  root.add(fold);
  return root;
}

function buildPipe(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'gadget-pipe';
  const wood = kit.std({ color: 0x5a3d28, roughness: 0.6 });
  const char = kit.std({ color: 0x2a2622, roughness: 0.9 });
  const stem = kit.cylinder(wood, 0.006, 0.007, 0.09);
  stem.rotation.x = Math.PI / 2;
  stem.position.set(0, -0.04, 0.045);
  root.add(stem);
  const bowl = kit.sphere(wood, 0.022, 0, -0.002, 0.095);
  bowl.scale.set(1.08, 0.95, 1.08);
  root.add(bowl);
  const rim = kit.cylinder(char, 0.018, 0.019, 0.008, 0, 0.014, 0.095);
  root.add(rim);
  return root;
}

/* ----- 1965 --------------------------------------------------------------- */

function buildTransistorRadio(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'gadget-transistorRadio';
  const ivory = kit.std({ color: 0xe8e0cc, roughness: 0.42 });
  const grillMat = kit.std({ color: 0x35322b, roughness: 0.8 });
  const chrome = kit.std({ color: 0xc9ccd1, roughness: 0.25, metalness: 0.85 });
  root.add(kit.box(ivory, 0.115, 0.07, 0.04, 0, 0.035, 0));
  const grill = kit.cylinder(grillMat, 0.026, 0.026, 0.005, -0.03, 0.037, 0.0205);
  grill.rotation.x = Math.PI / 2;
  grill.name = 'speaker-grill';
  root.add(grill);
  const dial = kit.cylinder(chrome, 0.013, 0.013, 0.006, 0.03, 0.044, 0.021);
  dial.rotation.x = Math.PI / 2;
  dial.name = 'tuning-dial';
  root.add(dial);
  const window = kit.box(grillMat, 0.03, 0.012, 0.004, 0.03, 0.024, 0.0205);
  window.name = 'display-window';
  root.add(window);
  const handle = kit.box(ivory, 0.07, 0.011, 0.013, 0, 0.076, 0);
  handle.name = 'carry-handle';
  root.add(handle);
  const antenna = kit.cylinder(chrome, 0.0028, 0.0028, 0.055, 0.05, 0.088, -0.012);
  antenna.rotation.z = 0.18;
  antenna.name = 'antenna';
  root.add(antenna);
  return root;
}

/* ----- 1985 --------------------------------------------------------------- */

function buildWalkman(kit: PatronKit): GadgetBuild {
  const root = new THREE.Group();
  root.name = 'gadget-walkman';
  const bodyMat = kit.std({ color: 0x4a5866, roughness: 0.42 });
  const dark = kit.std({ color: 0x2c2d31, roughness: 0.55 });
  const wire = kit.std({ color: WHITE, roughness: 0.85 });
  const foam = kit.std({ color: 0xff7a1a, roughness: 0.85, emissive: 0xff7a1a, emissiveIntensity: 0.18 });
  const bandMat = kit.std({ color: 0xcfcfcf, roughness: 0.35, metalness: 0.6 });

  // Belt unit, parented to torsoPivot.
  root.add(kit.box(bodyMat, 0.094, 0.058, 0.032, 0.03, 0.075, 0.132));
  root.add(kit.box(dark, 0.05, 0.022, 0.004, 0.03, 0.082, 0.149));
  for (const bx of [-0.008, 0.014]) {
    root.add(kit.box(dark, 0.012, 0.01, 0.004, 0.03 + bx, 0.05, 0.149));
  }

  // Headphones + cord on head pivot.
  const headRoot = new THREE.Group();
  headRoot.name = 'headphones-orange';
  for (const sx of [-1, 1]) {
    const pad = kit.cylinder(foam, 0.034, 0.034, 0.022, sx * (HEAD_RADIUS + 0.006), HEAD_CENTER_Y + 0.004, 0.004);
    pad.rotation.z = Math.PI / 2;
    pad.name = 'headphones-orange';
    headRoot.add(pad);
  }
  const band = new THREE.Mesh(
    kit.custom(new THREE.TorusGeometry(HEAD_RADIUS + 0.014, 0.0075, 6, 16, Math.PI)),
    bandMat,
  );
  band.position.set(0, HEAD_CENTER_Y, 0.002);
  band.name = 'headphones-band';
  headRoot.add(band);

  // Cords from walkman to headphones (static approximation).
  for (let i = 0; i < 2; i++) {
    const sx = i === 0 ? -1 : 1;
    const upper = wireBetween(kit, wire, sx * 0.05, 0.20, 0.13, sx * 0.098, 0.56, 0.02);
    upper.name = 'headphone-cord';
    root.add(upper);
    const bud = kit.sphere(foam, 0.009, sx * (HEAD_RADIUS + 0.001), HEAD_CENTER_Y + 0.001, 0.016);
    bud.name = 'headphone-bud';
    headRoot.add(bud);
  }

  return { root, headRoot };
}

function buildBoombox(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'gadget-boombox';
  const shell = kit.std({ color: 0x2c2d31, roughness: 0.5 });
  const face = kit.std({ color: 0x232428, roughness: 0.6 });
  const dark = kit.std({ color: 0x101114, roughness: 0.7 });
  const cone = kit.std({ color: 0x3a3d44, roughness: 0.75 });
  const chrome = kit.std({ color: 0xc9ccd1, roughness: 0.28, metalness: 0.85 });

  root.add(kit.box(shell, 0.46, 0.175, 0.135, 0, 0.0875, 0));
  root.add(kit.box(face, 0.446, 0.165, 0.006, 0, 0.0875, 0.0705));

  for (const [sx, name] of [
    [-1, 'boombox-speaker-l'] as const,
    [1, 'boombox-speaker-r'] as const,
  ]) {
    const speaker = kit.cylinder(dark, 0.056, 0.056, 0.01, sx * 0.145, 0.088, 0.068);
    speaker.rotation.x = Math.PI / 2;
    speaker.name = name;
    root.add(speaker);
    const inner = kit.cylinder(cone, 0.034, 0.034, 0.012, sx * 0.145, 0.088, 0.07);
    inner.rotation.x = Math.PI / 2;
    root.add(inner);
  }

  root.add(kit.box(dark, 0.14, 0.052, 0.005, 0, 0.108, 0.071));
  for (let i = 0; i < 5; i++) {
    const button = kit.box(i === 2 ? shell : chrome, 0.02, 0.012, 0.004, -0.08 + i * 0.04, 0.05, 0.0715);
    button.name = `button-${i}`;
    root.add(button);
  }
  root.add(kit.box(shell, 0.024, 0.055, 0.02, -0.17, 0.202, 0));
  root.add(kit.box(shell, 0.024, 0.055, 0.02, 0.17, 0.202, 0));
  root.add(kit.box(chrome, 0.372, 0.022, 0.022, 0, 0.235, 0));
  for (const sx of [-1, 1]) {
    const antenna = kit.cylinder(chrome, 0.0035, 0.0035, 0.17, sx * 0.205, 0.26, -0.03);
    antenna.rotation.z = sx * 0.5;
    antenna.name = 'antenna';
    root.add(antenna);
  }
  return root;
}

/* ----- 2005 --------------------------------------------------------------- */

function buildFlipPhone(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'gadget-flipPhone';
  const body = kit.std({ color: 0x2b3344, roughness: 0.45 });
  const keypad = kit.std({ color: 0x3d4859, roughness: 0.6 });
  const screen = kit.std({
    color: 0xa9c0cf,
    roughness: 0.3,
    emissive: 0xa9c0cf,
    emissiveIntensity: 0.15,
  });

  // Lower slab (hinge at origin, grip point).
  root.add(kit.box(body, 0.05, 0.088, 0.011, 0, -0.044, 0));
  const keypadInset = kit.box(keypad, 0.038, 0.05, 0.003, 0, -0.05, 0.0065);
  keypadInset.name = 'keypad';
  root.add(keypadInset);

  // Upper screen, hinged.
  const upper = new THREE.Group();
  upper.position.set(0, 0, 0.0055);
  upper.rotation.x = -0.38;
  upper.add(kit.box(body, 0.05, 0.078, 0.009, 0, 0.04, 0));
  const screenInset = kit.box(screen, 0.042, 0.062, 0.003, 0, 0.042, 0.005);
  screenInset.name = 'screen';
  upper.add(screenInset);
  root.add(upper);
  return root;
}

function buildEarbudCord(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'gadget-earbudCord';
  const wire = kit.std({ color: WHITE, roughness: 0.85 });
  const budMat = kit.std({ color: 0xfbfbfb, roughness: 0.4 });

  // Left cord: ear → chest pocket (2 segments).
  const lUpper = wireBetween(kit, wire, -0.105, 0.585, 0.03, -0.05, 0.34, 0.10);
  lUpper.name = 'earbud-cord';
  root.add(lUpper);
  const lLower = wireBetween(kit, wire, -0.05, 0.34, 0.10, -0.05, 0.16, 0.12);
  lLower.name = 'earbud-cord';
  root.add(lLower);
  const lBud = kit.sphere(budMat, 0.009, -0.105, 0.588, 0.03);
  lBud.name = 'earbud';
  root.add(lBud);

  // Right cord.
  const rUpper = wireBetween(kit, wire, 0.105, 0.585, 0.03, 0.05, 0.34, 0.10);
  rUpper.name = 'earbud-cord';
  root.add(rUpper);
  const rLower = wireBetween(kit, wire, 0.05, 0.34, 0.10, 0.05, 0.16, 0.12);
  rLower.name = 'earbud-cord';
  root.add(rLower);
  const rBud = kit.sphere(budMat, 0.009, 0.105, 0.588, 0.03);
  rBud.name = 'earbud';
  root.add(rBud);

  return root;
}

/* ----- 2025 --------------------------------------------------------------- */

function buildSmartphone(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'gadget-smartphone';
  const body = kit.std({ color: 0x14151c, roughness: 0.35, metalness: 0.4 });
  const screen = kit.std({
    color: 0xcfd8de,
    roughness: 0.2,
    emissive: 0x9fb4c4,
    emissiveIntensity: 0.22,
  });
  root.add(kit.box(body, 0.064, 0.128, 0.0085, 0, 0.05, 0));
  const screenInset = kit.box(screen, 0.055, 0.112, 0.003, 0, 0.05, 0.0048);
  screenInset.name = 'screen';
  root.add(screenInset);
  return root;
}

function buildWirelessEarbuds(kit: PatronKit): GadgetBuild {
  const root = new THREE.Group();
  root.name = 'gadget-wirelessEarbuds';
  const budMat = kit.std({ color: 0xfbfbfb, roughness: 0.35, emissive: 0xfbfbfb, emissiveIntensity: 0.15 });
  const headRoot = new THREE.Group();
  headRoot.name = 'wireless-earbuds-head';
  for (const sx of [-1, 1]) {
    const bud = kit.sphere(budMat, 0.0115, sx * (HEAD_RADIUS + 0.001), HEAD_CENTER_Y + 0.004, 0.016);
    bud.name = 'wireless-earbuds';
    headRoot.add(bud);
  }
  return { root, headRoot };
}

function buildLaptopTabletCombo(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'gadget-laptopTablet';
  const alu = kit.std({ color: 0x8f959c, roughness: 0.4, metalness: 0.55 });

  // Laptop base.
  root.add(kit.box(alu, 0.34, 0.014, 0.245, -0.12, 0.007, 0));
  const keys = kit.box(kit.std({ color: 0x33363b, roughness: 0.8 }), 0.295, 0.0035, 0.155, -0.12, 0.0158, 0.025);
  keys.name = 'keyboard';
  root.add(keys);
  const trackpad = kit.box(kit.std({ color: 0x33363b, roughness: 0.8 }), 0.09, 0.003, 0.05, -0.12, 0.0158, -0.075);
  trackpad.name = 'trackpad';
  root.add(trackpad);

  // Tablet.
  const tablet = new THREE.Group();
  tablet.name = 'tablet-slab';
  tablet.position.set(0.21, 0.0055, 0.01);
  tablet.rotation.y = 0.18;
  const slate = kit.std({ color: 0x3a3d44, roughness: 0.45, metalness: 0.35 });
  tablet.add(kit.box(slate, 0.175, 0.011, 0.245, 0, 0.0055, 0));
  const tScreen = kit.box(kit.std({ color: 0xc3ccd4, roughness: 0.2, emissive: 0xc3ccd4, emissiveIntensity: 0.15 }), 0.148, 0.003, 0.208, 0, 0.0118, 0);
  tScreen.name = 'tablet-screen';
  tablet.add(tScreen);
  root.add(tablet);

  return root;
}

function buildEReader(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'gadget-eReader';
  const shell = kit.std({ color: 0x23262b, roughness: 0.55 });
  const screen = kit.std({ color: 0xd8de, roughness: 0.95 });
  root.add(kit.box(shell, 0.118, 0.168, 0.011));
  const screenInset = kit.box(screen, 0.094, 0.124, 0.003, 0, 0.008, 0.006);
  screenInset.name = 'screen';
  root.add(screenInset);
  const button = kit.box(shell, 0.02, 0.02, 0.002, 0, -0.07, 0.006);
  button.name = 'home-button';
  root.add(button);
  return root;
}

/* ----- laptop (shared) ---------------------------------------------------- */

function buildLaptop(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'gadget-laptop';
  const alu = kit.std({ color: 0x8f959c, roughness: 0.4, metalness: 0.55 });
  const base = kit.box(alu, 0.34, 0.014, 0.245, 0, 0.007, 0);
  base.name = 'base';
  root.add(base);

  const keysMat = kit.std({ color: 0x33363b, roughness: 0.8 });
  const keys = kit.box(keysMat, 0.295, 0.0035, 0.155, 0, 0.0158, 0.025);
  keys.name = 'keyboard';
  root.add(keys);

  const trackpad = kit.box(keysMat, 0.09, 0.003, 0.05, 0, 0.0158, -0.075);
  trackpad.name = 'trackpad';
  root.add(trackpad);

  // Lid group hinged at back edge.
  const lid = new THREE.Group();
  lid.name = 'lid';
  lid.position.set(0, 0.012, -0.117);
  lid.rotation.x = 0.42;
  const lidMat = kit.std({ color: 0x7d838a, roughness: 0.42, metalness: 0.5 });
  const lidPanel = kit.box(lidMat, 0.34, 0.225, 0.012, 0, 0.1125, 0);
  lidPanel.name = 'lid-panel';
  lid.add(lidPanel);

  const screenMat = kit.std({
    color: 0xb9c7cf,
    roughness: 0.2,
    emissive: 0xb9c7cf,
    emissiveIntensity: 0.18,
  });
  const screen = kit.box(screenMat, 0.3, 0.185, 0.003, 0, 0.1125, 0.0065);
  screen.name = 'screen';
  lid.add(screen);

  root.add(lid);
  return root;
}

/* ----- counter stool ------------------------------------------------------ */

export function buildCounterStool(kit: PatronKit): THREE.Group {
  const root = new THREE.Group();
  root.name = 'counter-stool';
  const chrome = kit.std({ color: 0xc9ccd1, roughness: 0.28, metalness: 0.85 });
  const vinyl = kit.std({ color: 0x7a2f3a, roughness: 0.55 });

  // Seat pad.
  root.add(kit.cylinder(vinyl, 0.165, 0.165, 0.045, 0, 0.682, 0));
  root.add(kit.cylinder(chrome, 0.175, 0.175, 0.04, 0, 0.661, 0));

  // 4 splayed legs using wire-like helper.
  const legTop = 0.21;
  const legBot = 0.025;
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
    const leg = strutBetween(
      kit,
      chrome,
      Math.cos(a) * 0.155,
      legTop,
      Math.sin(a) * 0.155,
      Math.cos(a) * 0.05,
      legBot,
      Math.sin(a) * 0.05,
      0.011,
    );
    leg.name = 'leg';
    root.add(leg);
  }

  // Foot ring.
  const ring = new THREE.Mesh(
    kit.custom(new THREE.TorusGeometry(0.145, 0.009, 6, 18)),
    chrome,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.21, 0);
  ring.name = 'foot-ring';
  root.add(ring);
  return root;
}

/* ----- shared helpers ------------------------------------------------------ */

function wireBetween(
  kit: PatronKit,
  material: THREE.Material,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  r = 0.0032,
): THREE.Mesh {
  const a = new THREE.Vector3(ax, ay, az);
  const b = new THREE.Vector3(bx, by, bz);
  const dir = b.clone().sub(a);
  const len = dir.length() || 0.001;
  const mesh = kit.cylinder(material, r, r, len);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

function strutBetween(
  kit: PatronKit,
  material: THREE.Material,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  r: number,
): THREE.Mesh {
  const a = new THREE.Vector3(ax, ay, az);
  const b = new THREE.Vector3(bx, by, bz);
  const dir = b.clone().sub(a);
  const len = dir.length() || 0.001;
  const mesh = kit.cylinder(material, r, r, len);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}