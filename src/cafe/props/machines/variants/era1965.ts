import * as THREE from 'three';
import { BACK_BAR } from '../layout';
import { configuredCount, stampPresetMetadata } from '../eraMeta';
import type { EraVariantContext } from '../types';
import { box, cone, cylinder, markNoCastShadow, sphere, torus } from '../kit/geometries';
import { blackSteel, chrome, glass, glow, liquid, metal, paint, plastic } from '../kit/materials';
import {
  makeBackBar,
  makeBacksplash,
  makeCoffeeCarafe,
  makeCupStack,
  makeHotplate,
  makePitcher,
  makePilotDot,
  makeTray,
} from '../kit/parts';

/**
 * 1965 — mid-century diner back bar.
 *
 * A big chrome percolator with black bakelite finial, a chrome filter drip
 * machine with its glass carafe on a warming plate, a second carafe resting
 * on a standalone hotplate. Chrome, formica white and teal, diner cup stacks
 * and a lidded sugar globe complete the look.
 */
export function buildEra1965Machines(context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'machines-era-1965';
  group.position.set(BACK_BAR.centerX, BACK_BAR.topY, BACK_BAR.centerZ);

  const length = BACK_BAR.defaultLength;
  const depth = BACK_BAR.depth;

  // Palette.
  const formicaWhite = plastic(0xf4f1e6, 0.32);
  const teal = paint(0x2fa39a, 0.5);
  const mint = plastic(0xcfe8de, 0.4);
  const chromePlate = chrome();
  const bakelite = blackSteel();

  group.add(makeBackBar({ length, depth, top: formicaWhite, body: teal, kick: chromePlate }));
  group.add(makeBacksplash({ length, depth, panel: mint, trim: chromePlate }));

  // Chrome service rail running along the splashback.
  const rail = cylinder(chromePlate, 0.012, 0.012, length - 0.24, 0, 0.31, depth / 2 - 0.06);
  rail.rotation.z = Math.PI / 2;
  group.add(rail);

  /* --- Big chrome percolator (far left) ---------------------------------- */
  const percX = -2.4;
  group.add(cylinder(chromePlate, 0.175, 0.185, 0.03, percX, 0.015, 0, true));
  group.add(cylinder(chromePlate, 0.15, 0.152, 0.44, percX, 0.25, 0));
  group.add(sphere(chromePlate, 0.152, percX, 0.47, 0, 0.55)); // domed lid
  group.add(cylinder(bakelite, 0.006, 0.006, 0.05, percX, 0.575, 0)); // finial stalk
  group.add(sphere(bakelite, 0.026, percX, 0.61, 0)); // finial knob
  // Spout on the front-left shoulder.
  const spout = cone(chromePlate, 0.024, 0.09, percX - 0.09, 0.43, -0.135);
  spout.rotation.x = -0.95;
  group.add(spout);
  // Bakelite side handle.
  group.add(torus(bakelite, 0.085, 0.011, percX + 0.168, 0.28, 0, { arc: Math.PI, rotationZ: -Math.PI / 2 }));
  // Lid sight knob (heat-proof glass).
  group.add(markNoCastShadow(sphere(glass(0xd8e6e8, 0.35), 0.02, percX, 0.53, -0.12)));

  /* --- Chrome filter drip machine ---------------------------------------- */
  const machineX = -1.32;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    group.add(box(bakelite, 0.03, 0.03, 0.03, machineX + sx * 0.14, 0.015, 0.04 + sz * 0.1));
  }
  group.add(box(chromePlate, 0.36, 0.36, 0.26, machineX, 0.23, 0.04));
  group.add(box(bakelite, 0.3, 0.05, 0.2, machineX, 0.435, 0.04)); // water tank lid
  group.add(sphere(bakelite, 0.017, machineX, 0.475, 0.04));
  group.add(box(chromePlate, 0.18, 0.03, 0.12, machineX, 0.41, -0.1)); // brew basket lip
  // Control fascia with pilot lamp.
  group.add(box(bakelite, 0.36, 0.07, 0.012, machineX, 0.115, -0.095));
  const pilot = makePilotDot(glow(0xff5a3c, 2), 0.009);
  pilot.rotation.x = Math.PI / 2;
  pilot.position.set(machineX + 0.13, 0.115, -0.103);
  group.add(pilot);
  // Warming plate + carafe under the housing overhang.
  const warmPlate = makeHotplate({
    plate: bakelite,
    coil: blackSteel(),
    glowRing: glow(0xd23c2a, 0.9),
    radius: 0.105,
  });
  warmPlate.position.set(machineX, 0.03, -0.07);
  group.add(warmPlate);
  const carafeOne = makeCoffeeCarafe({
    glass: glass(0xcfe3e6, 0.22),
    liquid: liquid(0x3a2418),
    lid: bakelite,
    handle: chromePlate,
    fill: 0.6,
  });
  carafeOne.position.set(machineX, 0.052, -0.07);
  group.add(carafeOne);

  /* --- Standalone hotplate + second carafe ------------------------------- */
  const carafeTotal = configuredCount(context.spec, ['carafe', 'decanter', 'coffee pot'], 2, 3);
  const spareX = -0.48;
  const sparePlate = makeHotplate({ plate: chromePlate, coil: bakelite, radius: 0.1 });
  sparePlate.position.set(spareX, 0, -0.02);
  group.add(sparePlate);
  if (carafeTotal >= 2) {
    const carafeTwo = makeCoffeeCarafe({
      glass: glass(0xcfe3e6, 0.22),
      liquid: liquid(0x3a2418),
      lid: bakelite,
      handle: chromePlate,
      fill: 0.3,
    });
    carafeTwo.position.set(spareX, 0.028, -0.02);
    group.add(carafeTwo);
  }
  if (carafeTotal >= 3) {
    const carafeThree = makeCoffeeCarafe({
      glass: glass(0xcfe3e6, 0.22),
      liquid: liquid(0x3a2418),
      lid: bakelite,
      handle: chromePlate,
      fill: 0.05,
    });
    carafeThree.position.set(-0.92, 0, 0.16);
    group.add(carafeThree);
  }

  /* --- Diner crockery & counter sundries --------------------------------- */
  const stackA = makeCupStack({
    cup: plastic(0xffffff, 0.3),
    rim: teal,
    count: 6,
    saucers: 3,
    radius: 0.04,
    height: 0.07,
  });
  stackA.position.set(0.38, 0, 0);
  group.add(stackA);
  const stackB = makeCupStack({
    cup: plastic(0xffffff, 0.3),
    rim: teal,
    count: 4,
    radius: 0.04,
    height: 0.07,
  });
  stackB.position.set(0.66, 0, 0.04);
  group.add(stackB);

  // Lidded sugar globe.
  group.add(sphere(chromePlate, 0.055, 1.12, 0.026, 0, 0.5));
  group.add(markNoCastShadow(sphere(glass(0xf2f6f4, 0.3), 0.047, 1.12, 0.08, 0)));
  group.add(box(chromePlate, 0.05, 0.012, 0.04, 1.12, 0.128, 0));

  // Napkin dispenser.
  group.add(box(chromePlate, 0.125, 0.13, 0.095, 1.58, 0.065, -0.02));
  group.add(box(bakelite, 0.1, 0.008, 0.01, 1.58, 0.132, -0.05));

  // Stainless creamer and serving tray.
  group.add((() => {
    const creamer = makePitcher({ material: metal(0xd7dade, 0.28, 0.9), height: 0.115, rBottom: 0.034, rTop: 0.044 });
    creamer.position.set(2.0, 0, 0.02);
    return creamer;
  })());
  group.add((() => {
    const tray = makeTray(chromePlate, 0.17);
    tray.position.set(2.55, 0, -0.03);
    return tray;
  })());

  stampPresetMetadata(group, {
    year: 1965,
    title: 'Mid-century diner boom',
    applianceLabels: [
      'Chrome urn-style percolator (bakelite finial)',
      'Chrome filter drip machine with warming plate',
      `${carafeTotal}× glass coffee carafes`,
      'Standalone carafe hotplate',
      'Diner cup stacks, sugar globe, napkin dispenser',
    ],
  });

  return group;
}
