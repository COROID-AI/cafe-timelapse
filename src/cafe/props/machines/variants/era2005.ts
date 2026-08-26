import * as THREE from 'three';
import { BACK_BAR } from '../layout';
import { stampPresetMetadata } from '../eraMeta';
import type { EraVariantContext } from '../types';
import { box, cylinder, markNoCastShadow, orient, sphere } from '../kit/geometries';
import {
  blackSteel,
  brushedSteel,
  ceramic,
  chrome,
  glass,
  glow,
  plastic,
} from '../kit/materials';
import {
  makeBackBar,
  makeBacksplash,
  makeCupStack,
  makeDripTray,
  makeHopper,
  makeKnockBox,
  makePitcher,
  makePortafilter,
  makePressureGauge,
  makeSteamWand,
} from '../kit/parts';

/**
 * 2005 — third-wave specialty back bar.
 *
 * Stainless semi-automatic espresso machine with a locked-in portafilter, a
 * spare portafilter parked on the drip tray area, pivoting steam wand and
 * pressure gauge; burr grinder with transparent bean hopper, cup-warmer
 * stacks up top, knock box, milk jug and flavoured syrup bottles.
 */
export function buildEra2005Machines(context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'machines-era-2005';
  group.position.set(BACK_BAR.centerX, BACK_BAR.topY, BACK_BAR.centerZ);

  const length = BACK_BAR.defaultLength;
  const depth = BACK_BAR.depth;

  // Palette.
  const stainless = brushedSteel();
  const chromeTrim = chrome();
  const matteBlack = plastic(0x1f2124, 0.6);
  const deepRed = plastic(0x8e2430, 0.42);
  const whiteCup = ceramic(0xf2efe8);

  group.add(makeBackBar({ length, depth, top: stainless, body: matteBlack, kick: blackSteel() }));
  group.add(makeBacksplash({ length, depth, panel: stainless, trim: matteBlack }));

  /* --- Semi-automatic espresso machine ------------------------------------ */
  const machineX = -1.95;
  const machine = new THREE.Group();

  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    machine.add(box(matteBlack, 0.05, 0.05, 0.05, sx * 0.26, 0.025, sz * 0.18));
  }
  machine.add(box(stainless, 0.62, 0.34, 0.46, 0, 0.23, 0));
  machine.add(box(matteBlack, 0.62, 0.1, 0.012, 0, 0.115, -0.232)); // lower front panel
  machine.add(box(deepRed, 0.62, 0.028, 0.008, 0, 0.388, -0.228)); // brand band

  // Group head + locked-in portafilter over the drip tray.
  machine.add(orient(cylinder(chromeTrim, 0.05, 0.055, 0.07, 0, 0.2, -0.255), Math.PI / 2, 0, 0));
  const portafilter = makePortafilter(chromeTrim, matteBlack);
  portafilter.position.set(0, 0.155, -0.27);
  machine.add(portafilter);
  machine.add((() => {
    const tray = makeDripTray({ body: matteBlack, slots: blackSteel(), width: 0.3, depth: 0.15 });
    tray.position.set(0, 0.002, -0.185);
    return tray;
  })());

  // Steam wand pivoting off the right cheek + chrome valve knob.
  const wand = makeSteamWand(chromeTrim, blackSteel(), 0.17);
  wand.position.set(0.245, 0.24, -0.21);
  wand.rotation.y = 0.35;
  machine.add(wand);
  machine.add(sphere(chromeTrim, 0.02, 0.245, 0.27, -0.2));

  // Pressure gauge (upper-left) and rocker switches (lower-right).
  machine.add((() => {
    const gauge = makePressureGauge({
      rim: chromeTrim,
      face: whiteCup,
      needle: deepRed,
      radius: 0.034,
    });
    gauge.position.set(-0.19, 0.305, -0.225);
    return gauge;
  })());
  machine.add((() => {
    const switchA = box(glow(0xffa53b, 1.6), 0.03, 0.02, 0.012, 0.14, 0.125, -0.239);
    return switchA;
  })());
  machine.add(box(glow(0xfff3d8, 1.2), 0.03, 0.02, 0.012, 0.19, 0.125, -0.239));

  // Cup warmer top: rails plus two pre-warmed stacks.
  const railA = cylinder(chromeTrim, 0.008, 0.008, 0.56, 0, 0.425, -0.19);
  railA.rotation.z = Math.PI / 2;
  machine.add(railA);
  const railB = cylinder(chromeTrim, 0.008, 0.008, 0.56, 0, 0.425, 0.17);
  railB.rotation.z = Math.PI / 2;
  machine.add(railB);
  const warmerStackA = makeCupStack({ cup: whiteCup, count: 4, radius: 0.038, height: 0.07 });
  warmerStackA.position.set(-0.16, 0.4, 0);
  machine.add(warmerStackA);
  const warmerStackB = makeCupStack({ cup: whiteCup, count: 3, radius: 0.038, height: 0.07 });
  warmerStackB.position.set(0.14, 0.4, 0.02);
  machine.add(warmerStackB);

  machine.position.set(machineX, 0, 0);
  group.add(machine);

  /* --- Burr grinder (skipped only when config explicitly sets none) -------- */
  const includeGrinder = context.spec?.grinder !== null;
  if (includeGrinder) {
    const grinderX = -0.95;
    const grinder = new THREE.Group();
    grinder.add(box(matteBlack, 0.19, 0.3, 0.23, 0, 0.15, 0));
    grinder.add((() => {
      const hopper = makeHopper({
        glass: glass(0x30343a, 0.4),
        lid: matteBlack,
        content: plastic(0x5a3a20, 0.7),
        rTop: 0.068,
        rBottom: 0.05,
        height: 0.14,
        fill: 0.66,
      });
      hopper.position.set(0, 0.3, 0);
      return hopper;
    })());
    // Doser chamber + throw lever.
    grinder.add(cylinder(matteBlack, 0.05, 0.05, 0.09, 0, 0.09, -0.14));
    const lever = box(chromeTrim, 0.05, 0.012, 0.02, 0, 0.135, -0.175);
    lever.rotation.x = -0.5;
    grinder.add(lever);
    grinder.position.set(grinderX, 0, 0.02);
    group.add(grinder);
  }

  /* --- Supporting accessories ---------------------------------------------- */
  const saucerStack = makeCupStack({
    cup: whiteCup,
    count: 5,
    saucers: 4,
    radius: 0.04,
    height: 0.072,
  });
  saucerStack.position.set(-0.32, 0, 0.05);
  group.add(saucerStack);

  const knockBoxPart = makeKnockBox({ body: matteBlack, rim: chromeTrim, bar: blackSteel() });
  knockBoxPart.position.set(0.28, 0, 0.04);
  group.add(knockBoxPart);

  const milkJug = makePitcher({ material: brushedSteel(), height: 0.145, rBottom: 0.042, rTop: 0.052 });
  milkJug.position.set(0.68, 0, -0.03);
  group.add(milkJug);

  const serviceStack = makeCupStack({ cup: whiteCup, rim: deepRed, count: 6, radius: 0.042, height: 0.078 });
  serviceStack.position.set(1.1, 0, 0);
  group.add(serviceStack);
  const secondStack = makeCupStack({ cup: whiteCup, count: 4, radius: 0.042, height: 0.078 });
  secondStack.position.set(1.42, 0, 0.04);
  group.add(secondStack);

  // Syrup bottles (vanilla / caramel / hazelnut).
  const syrups: Array<[number, number]> = [
    [0x7a4a21, 0x2b2118],
    [0x9c5b23, 0x2b2118],
    [0x4a2f1a, 0x2b2118],
  ];
  syrups.forEach(([tint, cap], index) => {
    const bottle = new THREE.Group();
    bottle.add(markNoCastShadow(cylinder(glass(tint, 0.62), 0.032, 0.035, 0.21, 0, 0.105, 0)));
    bottle.add(cylinder(plastic(cap, 0.4), 0.014, 0.014, 0.05, 0, 0.235, 0));
    bottle.add(cylinder(plastic(cap, 0.4), 0.011, 0.011, 0.02, 0, 0.268, 0, true));
    bottle.position.set(1.88 + index * 0.14, 0, 0.03);
    group.add(bottle);
  });

  // Spare portafilter parked on the bench + tamper.
  const spare = makePortafilter(chromeTrim, matteBlack);
  spare.rotation.x = Math.PI;
  spare.rotation.z = 0.12;
  spare.position.set(2.5, 0.05, 0.05);
  group.add(spare);
  const tamper = new THREE.Group();
  tamper.add(cylinder(chromeTrim, 0.033, 0.028, 0.02, 0, 0.01, 0));
  tamper.add(cylinder(matteBlack, 0.012, 0.012, 0.07, 0, 0.05, 0));
  tamper.add(sphere(matteBlack, 0.02, 0, 0.095, 0));
  tamper.position.set(2.78, 0, -0.02);
  group.add(tamper);

  stampPresetMetadata(group, {
    year: 2005,
    title: 'Specialty espresso culture',
    applianceLabels: [
      'Stainless semi-automatic espresso machine',
      'Twin portafilters + pivoting steam wand',
      'Pressure gauge & rocker switches',
      includeGrinder ? 'Burr grinder with bean hopper' : '(grinder omitted by config)',
      'Cup-warmer stacks, knock box, milk jug, syrups',
    ],
  });

  return group;
}
