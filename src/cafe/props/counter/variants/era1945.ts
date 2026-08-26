import * as THREE from 'three';
import { SERVICE_COUNTER } from '../layout';
import { stampPresetMetadata } from '../eraMeta';
import type { EraVariantContext } from '../types';
import { addAnimator, cycle, smoothstep } from '../kit/animate';
import { box, cylinder, orient, sphere } from '../kit/geometries';
import {
  blackSteel,
  brass,
  paper,
  wood,
} from '../kit/materials';
import {
  makeCoinStack,
  makeFlatSheet,
  makePaperRoll,
  makePencil,
  makeServiceBell,
  makeSheetStack,
} from '../kit/parts';

/**
 * 1945 — post-war manual till.
 *
 * A brass-trimmed wooden mechanical crank till with an ornate customer plate,
 * a number-key deck for the barista, a paper roll poking out of the lid, a
 * hand-written receipt pad with pencil, scattered coins — and a service bell.
 * Idle life: the crank arm slowly turns, and every few seconds the coin
 * drawer pops open while the bell gives a tiny wobble.
 */
export function buildEra1945Counter(_context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'counter-tech-era-1945';
  group.position.set(SERVICE_COUNTER.centerX, SERVICE_COUNTER.topY, SERVICE_COUNTER.centerZ);

  // Palette (fresh material instances per variant — required by crossfade).
  const mahogany = wood(0x5a3a24);
  const walnutTrim = wood(0x6f4a2e);
  const agedBrass = brass();
  const iron = blackSteel();
  const padPaper = paper();
  const slipPaper = paper(0xe8dfc6);

  /* --- Till body -------------------------------------------------------- */
  const tillX = -0.55;
  const tillZ = -0.02;
  const till = new THREE.Group();

  // Plinth + feet.
  till.add(box(walnutTrim, 0.52, 0.05, 0.46, 0, 0.025, 0));
  for (const [fx, fz] of [[-0.22, -0.18], [0.22, -0.18], [-0.22, 0.18], [0.22, 0.18]] as const) {
    till.add(cylinder(agedBrass, 0.018, 0.022, 0.03, fx, 0.015, fz, true));
  }
  // Lower body (coin drawer bay) + upper cabinet.
  till.add(box(mahogany, 0.46, 0.26, 0.38, 0, 0.18, 0));
  till.add(box(mahogany, 0.42, 0.16, 0.34, 0, 0.39, -0.01));
  // Brass edge trims along the cabinet top.
  till.add(box(agedBrass, 0.44, 0.012, 0.012, 0, 0.462, -0.176));
  till.add(box(agedBrass, 0.44, 0.012, 0.012, 0, 0.462, 0.156));
  till.add(box(agedBrass, 0.012, 0.012, 0.344, -0.216, 0.462, -0.01));
  till.add(box(agedBrass, 0.012, 0.012, 0.344, 0.216, 0.462, -0.01));

  // Ornate customer-facing plate (−z): brass panel with embossed rosettes.
  const frontPlate = box(agedBrass, 0.32, 0.17, 0.014, 0, 0.185, -0.196);
  till.add(frontPlate);
  for (let i = 0; i < 3; i += 1) {
    till.add(sphere(agedBrass, 0.02, -0.09 + i * 0.09, 0.185, -0.206, 0.45));
  }
  till.add(cylinder(agedBrass, 0.05, 0.05, 0.016, 0, 0.335, -0.181)); // round crest boss

  // Operator key deck slanted down toward +z (the barista side).
  const deck = box(walnutTrim, 0.38, 0.024, 0.24, 0, 0.472, 0.1);
  deck.rotation.x = 0.42;
  till.add(deck);
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const key = cylinder(
        row === 0 ? padPaper : agedBrass,
        0.021,
        0.023,
        0.014,
        -0.135 + col * 0.09,
        0.507 - row * 0.043,
        0.078 + row * 0.062,
      );
      key.rotation.x = 0.42;
      till.add(key);
    }
  }

  /* --- Crank on the right cheek ----------------------------------------- */
  // Static axle stub poking out of the body…
  const axleStub = cylinder(iron, 0.011, 0.011, 0.05, 0.247, 0.33, 0);
  orient(axleStub, Math.PI / 2, 0, 0);
  till.add(axleStub);
  // …and the bent handle pivoting AROUND the axle end.
  const crank = new THREE.Group();
  crank.name = 'till-crank-arm';
  crank.position.set(0.272, 0.33, 0);
  const crankArm = box(iron, 0.052, 0.014, 0.014, 0.026, 0, 0);
  crankArm.name = 'till-crank-handle';
  crank.add(crankArm);
  crank.add(cylinder(iron, 0.007, 0.007, 0.035, 0.05, -0.018, 0));
  crank.add(sphere(walnutTrim, 0.019, 0.05, -0.038, 0));
  till.add(crank);

  /* --- Paper roll under the lid ------------------------------------------ */
  const roll = makePaperRoll(padPaper, 0.042, 0.3, 0, 0.495, -0.08);
  till.add(roll);
  // Strip feeding forward over the lid edge.
  const feedStrip = box(padPaper, 0.28, 0.003, 0.13, 0, 0.512, 0.0);
  feedStrip.rotation.x = -0.18;
  feedStrip.name = 'till-paper-strip';
  till.add(feedStrip);

  /* --- Coin drawer (barista side, animated) ------------------------------ */
  // Lip protrudes past the body face when closed; sliding +z reveals the
  // coin tray without ever intersecting the cabinet volume.
  const drawer = new THREE.Group();
  drawer.name = 'till-drawer';
  drawer.add(box(walnutTrim, 0.3, 0.075, 0.12, 0, 0.105, 0));
  drawer.add(box(agedBrass, 0.24, 0.05, 0.012, 0, 0.108, 0.061));
  drawer.add(sphere(agedBrass, 0.014, 0, 0.108, 0.073));
  // Open coin compartments visible when popped.
  drawer.add(box(iron, 0.115, 0.02, 0.1, -0.062, 0.148, -0.005));
  drawer.add(box(iron, 0.115, 0.02, 0.1, 0.062, 0.148, -0.005));
  drawer.position.set(0, 0, 0.13);
  till.add(drawer);

  till.position.set(tillX, 0, tillZ);
  group.add(till);

  /* --- Hand-written receipt pad (left) ----------------------------------- */
  const padStack = makeSheetStack(
    [padPaper, slipPaper, padPaper, slipPaper, padPaper, slipPaper],
    0.16,
    0.22,
    0.004,
  );
  padStack.position.set(-1.02, 0, 0.02);
  group.add(padStack);
  group.add(makeFlatSheet(padPaper, 0.15, 0.2, -1.0, -0.16, 0.25));
  group.add(makePencil(walnutTrim, padPaper, 0.14, -1.02, 0.2));

  /* --- Service bell (front-right of the till) ----------------------------- */
  const bellGroup = makeServiceBell(agedBrass, iron, 0.052);
  bellGroup.name = 'till-bell';
  bellGroup.position.set(-0.12, 0, -0.2);
  group.add(bellGroup);

  /* --- Loose coins -------------------------------------------------------- */
  group.add(makeCoinStack([agedBrass, brass()], 5, 0.017, 0.12, -0.12));
  group.add(makeCoinStack([brass(), agedBrass], 3, 0.014, 0.2, 0.05));

  /* --- Idle animation ------------------------------------------------------ */
  let elapsed = 0;
  const DRAWER_PERIOD = 9;
  const baseDrawerZ = drawer.position.z;
  addAnimator(group, (deltaSeconds) => {
    elapsed += deltaSeconds;

    // Crank turns slowly back and forth like a cashier mid-sale.
    crank.rotation.z = Math.sin((elapsed / 6) * Math.PI * 2) * 0.85;

    // Drawer pop: closed → slides out → holds → retracts.
    const phase = cycle(elapsed, DRAWER_PERIOD);
    let out = 0;
    if (phase < 0.06) out = smoothstep(phase / 0.06);
    else if (phase < 0.2) out = 1;
    else if (phase < 0.26) out = 1 - smoothstep((phase - 0.2) / 0.06);
    drawer.position.z = baseDrawerZ + out * 0.13;

    // Bell wobbles right as the drawer shoots home.
    const wobblePhase = cycle(elapsed, DRAWER_PERIOD, -DRAWER_PERIOD * 0.24);
    if (wobblePhase > 0 && wobblePhase < 0.05) {
      const decay = 1 - wobblePhase / 0.05;
      bellGroup.rotation.z = Math.sin(wobblePhase / 0.05 * Math.PI * 6) * 0.14 * decay;
    } else {
      bellGroup.rotation.z *= 0.8;
    }
  });

  stampPresetMetadata(group, {
    year: 1945,
    title: 'Brass mechanical crank till',
    deviceLabels: [
      'Brass-trimmed mechanical crank till',
      'Paper-roll receipt printer (manual)',
      'Hand-written receipt pad & pencil',
      'Spring-loaded coin drawer',
      'Counter service bell',
    ],
    receiptMethod: 'handwritten pad',
  });

  return group;
}
