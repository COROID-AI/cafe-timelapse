import * as THREE from 'three';
import { BACK_BAR } from '../layout';
import { configuredCount, stampPresetMetadata } from '../eraMeta';
import type { EraVariantContext } from '../types';
import { box, cylinder, markGlowSurface, markNoCastShadow, sphere } from '../kit/geometries';
import {
  blackSteel,
  ceramic,
  chrome,
  glass,
  glow,
  liquid,
  plastic,
  wood,
} from '../kit/materials';
import {
  makeBackBar,
  makeBacksplash,
  makeColdBrewDispenser,
  makeCupStack,
  makeGooseneckTap,
  makeGlowScreen,
  makeMilkCarton,
} from '../kit/parts';

/**
 * 2025 — app-ordering specialty bar.
 *
 * Matte-graphite super-automatic espresso centre with an angled touch screen
 * and glowing status strip, tablet ordering display on a stem, cold-brew tap
 * tower pouring into glass dispensers, and a glass-door milk fridge closing
 * the run at floor level. Warm oak slats soften the tech.
 */
export function buildEra2025Machines(context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'machines-era-2025';
  group.position.set(BACK_BAR.centerX, BACK_BAR.topY, BACK_BAR.centerZ);

  // Shorter run than other eras: the milk fridge closes the line at the right.
  const length = 4.6;
  const depth = BACK_BAR.depth;

  // Palette.
  const graphite = plastic(0x2b2d31, 0.52);
  const charcoal = plastic(0x222428, 0.58);
  const oak = wood(0xb08a5e);
  const chromeTrim = chrome();
  const stone = ceramic(0x8f8b84);
  const fridgeWhite = plastic(0xeef0ee, 0.5);

  group.add(makeBackBar({ length, depth, top: graphite, body: charcoal, kick: blackSteel() }));
  group.add(makeBacksplash({
    length,
    depth,
    panel: charcoal,
    trim: graphite,
    slats: Math.floor(length / 0.09),
    slatMaterial: oak,
  }));

  /* --- Super-automatic touchscreen centre ---------------------------------- */
  const centerX = -1.7;
  const centre = new THREE.Group();

  centre.add(box(graphite, 0.72, 0.44, 0.44, 0, 0.22, 0));
  // Chamfered crown strip.
  centre.add(box(charcoal, 0.72, 0.035, 0.46, 0, 0.455, 0));
  // Angled ordering / drink-selection touchscreen.
  centre.add((() => {
    const screen = makeGlowScreen({
      frame: charcoal,
      screen: glow(0x9fe8ff, 2.2),
      width: 0.26,
      height: 0.17,
      bezel: 0.012,
    });
    screen.position.set(-0.14, 0.33, -0.14);
    screen.rotation.x = -0.55;
    return screen;
  })());
  // Chrome coffee spout pair above the cup cradle.
  centre.add(cylinder(chromeTrim, 0.014, 0.014, 0.09, 0.1, 0.2, -0.235));
  centre.add(cylinder(chromeTrim, 0.014, 0.014, 0.09, 0.15, 0.2, -0.235));
  centre.add(box(charcoal, 0.16, 0.015, 0.1, 0.125, 0.145, -0.235)); // cup cradle slot
  // Drip tray drawer with recessed grip line.
  centre.add(box(charcoal, 0.34, 0.05, 0.14, 0.125, 0.045, -0.21));
  centre.add(box(graphite, 0.1, 0.008, 0.02, 0.125, 0.072, -0.275));
  // Glowing status strip along the base front.
  centre.add(markGlowSurface(box(glow(0x7dffcf, 1.8), 0.68, 0.012, 0.008, 0, 0.035, -0.222)));
  // Side ventilation grooves.
  for (let i = 0; i < 5; i += 1) {
    centre.add(box(charcoal, 0.012, 0.24, 0.008, 0.361, 0.22, -0.14 + i * 0.06));
  }
  // Bean hopper dome peeking from the crown.
  centre.add(markNoCastShadow(sphere(glass(0x2f3338, 0.42), 0.06, -0.24, 0.49, 0.05, 0.8)));
  centre.position.set(centerX, 0, 0.02);
  group.add(centre);

  /* --- Cold-brew tap tower --------------------------------------------------- */
  const towerX = -0.42;
  const tower = new THREE.Group();
  tower.add(box(graphite, 0.17, 0.85, 0.17, 0, 0.425, 0));
  tower.add(box(charcoal, 0.2, 0.025, 0.2, 0, 0.87, 0)); // cap
  tower.add(markGlowSurface(box(glow(0xffffff, 1.1), 0.05, 0.05, 0.006, 0, 0.62, -0.088))); // brand dot
  // Twin taps at staggered heights (nitro + still).
  const tapNitro = makeGooseneckTap({ material: chromeTrim, columnHeight: 0.05, reach: 0.08 });
  tapNitro.position.set(0, 0.78, -0.085);
  tower.add(tapNitro);
  const tapStill = makeGooseneckTap({ material: chromeTrim, columnHeight: 0.05, reach: 0.08 });
  tapStill.position.set(0, 0.64, -0.085);
  tower.add(tapStill);
  // Drip grid base.
  tower.add(box(charcoal, 0.46, 0.014, 0.22, 0, 0.007, -0.12));
  for (let i = 0; i < 6; i += 1) {
    tower.add(box(blackSteel(), 0.014, 0.004, 0.16, -0.19 + i * 0.075, 0.016, -0.12));
  }
  tower.position.set(towerX, 0, 0.06);
  group.add(tower);

  // Dispensers catching the pours.
  const dispenserCount = configuredCount(context.spec, ['cold brew', 'dispenser', 'nitro'], 2, 2);
  for (let i = 0; i < dispenserCount; i += 1) {
    const dispenser = makeColdBrewDispenser({
      glass: glass(0xdfe9ec, 0.24),
      liquid: liquid(i === 0 ? 0x8a5a24 : 0x6e4a20),
      lid: graphite,
      size: 0.165,
      fill: i === 0 ? 0.82 : 0.55,
    });
    dispenser.position.set(towerX - 0.12 + i * 0.24, 0.014, -0.12);
    group.add(dispenser);
  }

  /* --- Tablet ordering display ------------------------------------------------ */
  const tabletX = 0.62;
  const tabletStand = new THREE.Group();
  tabletStand.add(cylinder(chromeTrim, 0.055, 0.06, 0.016, 0, 0.008, 0, true));
  tabletStand.add(cylinder(chromeTrim, 0.011, 0.011, 0.27, 0, 0.15, 0));
  tabletStand.add((() => {
    const screen = makeGlowScreen({
      frame: charcoal,
      screen: glow(0xdff3ff, 1.9),
      width: 0.24,
      height: 0.165,
      bezel: 0.01,
    });
    screen.position.set(0, 0.315, 0);
    screen.rotation.x = -0.38;
    return screen;
  })());
  tabletStand.position.set(tabletX, 0, -0.02);
  group.add(tabletStand);

  /* --- Stoneware cup stacks ----------------------------------------------------- */
  const stackA = makeCupStack({ cup: stone, count: 5, radius: 0.042, height: 0.08 });
  stackA.position.set(1.12, 0, 0);
  group.add(stackA);
  const stackB = makeCupStack({ cup: ceramic(0xa9a49b), count: 3, radius: 0.036, height: 0.07 });
  stackB.position.set(1.38, 0, 0.05);
  group.add(stackB);

  /* --- Under-counter milk fridge (floor unit) ------------------------------------- */
  const fridgeX = 2.82;
  const fridge = new THREE.Group();
  fridge.add(box(charcoal, 0.66, 0.88, 0.58, 0, 0.44, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    fridge.add(box(blackSteel(), 0.05, 0.04, 0.05, sx * 0.27, 0.02, sz * 0.23));
  }
  // Glass door framing on the front face.
  fridge.add(box(graphite, 0.05, 0.76, 0.03, -0.295, 0.47, -0.295));
  fridge.add(box(graphite, 0.05, 0.76, 0.03, 0.295, 0.47, -0.295));
  fridge.add(box(graphite, 0.64, 0.05, 0.03, 0, 0.865, -0.295));
  fridge.add(box(graphite, 0.64, 0.06, 0.03, 0, 0.09, -0.295));
  fridge.add(markNoCastShadow(box(glass(0xcfdde2, 0.2), 0.54, 0.72, 0.015, 0, 0.47, -0.3)));
  // Chrome pull handle.
  fridge.add(cylinder(chromeTrim, 0.011, 0.011, 0.5, -0.33, 0.47, -0.31));
  // Interior: shelves, milk cartons, warm light strip.
  fridge.add(box(fridgeWhite, 0.56, 0.014, 0.44, 0, 0.28, 0.02));
  fridge.add(box(fridgeWhite, 0.56, 0.014, 0.44, 0, 0.52, 0.02));
  for (const [cx, cy] of [[-0.16, 0.365], [0, 0.365], [0.16, 0.605]] as const) {
    const carton = makeMilkCarton(fridgeWhite, 0.15);
    carton.position.set(cx, cy, 0.05);
    fridge.add(carton);
  }
  fridge.add(markGlowSurface(box(glow(0xfff2dd, 1.3), 0.5, 0.012, 0.02, 0, 0.83, 0.05)));
  fridge.position.set(fridgeX, -BACK_BAR.topY, 0.02);
  group.add(fridge);

  stampPresetMetadata(group, {
    year: 2025,
    title: 'App-era specialty bar',
    applianceLabels: [
      'Super-automatic touchscreen espresso centre',
      `${dispenserCount}-tap cold-brew tower with glass dispensers`,
      'Tablet ordering display',
      'Glass-door under-counter milk fridge',
      'Stoneware cup stacks',
    ],
  });

  return group;
}
