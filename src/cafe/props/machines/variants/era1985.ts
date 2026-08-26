import * as THREE from 'three';
import { BACK_BAR } from '../layout';
import { configuredCount, stampPresetMetadata } from '../eraMeta';
import type { EraVariantContext } from '../types';
import { box, cylinder, markNoCastShadow, sphere, torus } from '../kit/geometries';
import {
  blackSteel,
  brushedSteel,
  ceramic,
  glass,
  glow,
  liquid,
  plastic,
  wood,
} from '../kit/materials';
import {
  makeBackBar,
  makeBacksplash,
  makeCoffeeCarafe,
  makeCupStack,
  makeHotplate,
  makeMugTree,
  makePilotDot,
  makePitcher,
  makeTray,
} from '../kit/parts';

/**
 * 1985 — boxy plastic decade back bar.
 *
 * Beige-and-brown automatic drip machine with its translucent ORANGE water
 * reservoir, stainless cappuccino frothing jug, hanging mug tree, stacks of
 * ceramic cups and a cordless jug kettle. Laminate browns with an orange pop.
 */
export function buildEra1985Machines(context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'machines-era-1985';
  group.position.set(BACK_BAR.centerX, BACK_BAR.topY, BACK_BAR.centerZ);

  const length = BACK_BAR.defaultLength;
  const depth = BACK_BAR.depth;

  // Palette.
  const beige = plastic(0xd9cdb2, 0.5);
  const brownTrim = plastic(0x6d4a2e, 0.55);
  const cream = plastic(0xf0ead8, 0.42);
  const orangeReservoir = glass(0xff7f27, 0.5);
  const ledRed = () => glow(0xff3b2f, 2.2);
  const oak = wood(0xa97e50);

  group.add(makeBackBar({ length, depth, top: beige, body: brownTrim, kick: blackSteel() }));
  group.add(makeBacksplash({ length, depth, panel: oak, trim: brownTrim }));

  /* --- Boxy automatic drip machine --------------------------------------- */
  const machineX = -2.15;
  const machine = new THREE.Group();
  machine.add(box(brownTrim, 0.4, 0.06, 0.32, 0, 0.03, 0));
  machine.add(box(beige, 0.38, 0.33, 0.27, 0, 0.225, 0));
  machine.add(box(beige, 0.38, 0.035, 0.29, 0, 0.4125, 0));
  // Signature translucent orange water reservoir on the top-left.
  machine.add(markNoCastShadow(box(orangeReservoir, 0.13, 0.2, 0.22, -0.11, 0.53, 0)));
  machine.add(cylinder(cream, 0.032, 0.032, 0.02, -0.11, 0.645, 0, true)); // filler cap
  // Control fascia: switches + red power lamp.
  machine.add(box(brownTrim, 0.36, 0.075, 0.012, 0, 0.115, -0.141));
  machine.add(box(cream, 0.032, 0.02, 0.012, -0.06, 0.115, -0.149));
  machine.add(box(cream, 0.032, 0.02, 0.012, 0.02, 0.115, -0.149));
  machine.add((() => {
    const led = makePilotDot(ledRed(), 0.009);
    led.rotation.x = Math.PI / 2;
    led.position.set(0.13, 0.115, -0.149);
    return led;
  })());
  // Brew basket hint under the lid lip.
  machine.add(box(brownTrim, 0.2, 0.05, 0.14, 0, 0.372, -0.05));
  // Warming plate + carafe.
  machine.add(makeHotplate({
    plate: brownTrim,
    coil: blackSteel(),
    glowRing: glow(0x8a1f16, 0.8),
    radius: 0.1,
  }).translateX(0.02).translateZ(-0.075));
  machine.add((() => {
    const carafe = makeCoffeeCarafe({
      glass: glass(0xd6e2da, 0.24),
      liquid: liquid(0x33200f),
      lid: brownTrim,
      fill: 0.55,
    });
    carafe.position.set(0.02, 0.055, -0.075);
    return carafe;
  })());
  machine.position.set(machineX, 0, 0);
  group.add(machine);

  /* --- Cappuccino frother jug(s) ------------------------------------------ */
  const frotherCount = configuredCount(context.spec, ['cappuccino', 'frother'], 1, 2);
  for (let i = 0; i < frotherCount; i += 1) {
    const jug = makePitcher({
      material: brushedSteel(),
      height: 0.17,
      rBottom: 0.047,
      rTop: 0.058,
    });
    jug.position.set(-1.02 - i * 0.17, 0, i % 2 === 0 ? -0.02 : 0.06);
    group.add(jug);
  }

  /* --- Mug tree ------------------------------------------------------------ */
  const mugTree = makeMugTree(oak, brownTrim, ceramic(0xe8ddc8));
  mugTree.position.set(-0.34, 0, 0.02);
  group.add(mugTree);

  /* --- Ceramic cup stack ---------------------------------------------------- */
  const cups = makeCupStack({
    cup: ceramic(0xe8ddc8),
    rim: brownTrim,
    count: 6,
    saucers: 2,
    radius: 0.042,
    height: 0.08,
  });
  cups.position.set(0.34, 0, -0.01);
  group.add(cups);

  /* --- Cordless jug kettle --------------------------------------------------- */
  const kettle = new THREE.Group();
  kettle.add(cylinder(blackSteel(), 0.085, 0.092, 0.02, 0, 0.01, 0, true));
  kettle.add(cylinder(cream, 0.062, 0.085, 0.19, 0, 0.115, 0));
  kettle.add(cylinder(cream, 0.05, 0.062, 0.022, 0, 0.222, 0, true));
  kettle.add(sphere(blackSteel(), 0.015, 0, 0.248, 0));
  const kettleHandle = torus(blackSteel(), 0.048, 0.007, 0.088, 0.15, 0, {
    arc: Math.PI,
    rotationZ: -Math.PI / 2,
  });
  kettleHandle.scale.y = 1.25;
  kettle.add(kettleHandle);
  kettle.position.set(0.98, 0, 0.03);
  group.add(kettle);

  /* --- Storage jars, tray, filter papers ------------------------------------- */
  const jarContents: Array<{ content: number; lid: number }> = [
    { content: 0x4a2f1a, lid: 0x6d4a2e }, // instant coffee
    { content: 0xf3eee2, lid: 0xb03a2e }, // sugar
  ];
  jarContents.forEach((spec, index) => {
    const jar = new THREE.Group();
    jar.add(markNoCastShadow(cylinder(glass(0xe4efe9, 0.28), 0.045, 0.045, 0.13, 0, 0.065, 0)));
    jar.add(cylinder(plastic(spec.content, 0.6), 0.038, 0.04, 0.088, 0, 0.05, 0));
    jar.add(cylinder(plastic(spec.lid, 0.45), 0.05, 0.05, 0.02, 0, 0.14, 0, true));
    jar.add(sphere(plastic(spec.lid, 0.45), 0.012, 0, 0.158, 0));
    jar.position.set(1.58 + index * 0.16, 0, 0.02);
    group.add(jar);
  });

  const tray = makeTray(cream, 0.145);
  tray.position.set(2.28, 0, -0.04);
  group.add(tray);
  group.add(box(cream, 0.12, 0.05, 0.09, 2.66, 0.025, 0.02)); // filter papers

  stampPresetMetadata(group, {
    year: 1985,
    title: 'Electric convenience',
    applianceLabels: [
      'Boxy automatic drip machine (beige/brown)',
      'Translucent orange water reservoir',
      `${frotherCount}× stainless cappuccino frother jug`,
      'Mug tree with hanging mugs',
      'Ceramic cup stack & cordless jug kettle',
    ],
  });

  return group;
}
