import * as THREE from 'three';
import { SERVICE_COUNTER } from '../layout';
import { stampPresetMetadata } from '../eraMeta';
import type { EraVariantContext } from '../types';
import { addAnimator, cycle, smoothstep } from '../kit/animate';
import { box, markGlowSurface } from '../kit/geometries';
import {
  brushedSteel,
  chrome,
  glow,
  paper,
  plastic,
} from '../kit/materials';
import {
  makeFlatSheet,
  makeSheetStack,
} from '../kit/parts';

/**
 * 1985 — early electronic POS terminal + card imprinter.
 *
 * A beige wedge-shaped electronic POS terminal with a green VFD customer
 * display on a tilted head and a matrix keypad, next to the classic
 * click-clack card imprinter: an aluminium flat bed, a sliding carriage arm
 * with red grip, and stacks of carbon-paper sales slips. Idle life: the VFD
 * glow flickers like a real fluorescent display and the imprinter arm makes
 * its periodic two-stroke drag across a slip.
 */
export function buildEra1985Counter(_context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'counter-tech-era-1985';
  group.position.set(SERVICE_COUNTER.centerX, SERVICE_COUNTER.topY, SERVICE_COUNTER.centerZ);

  // Palette (fresh material instances per variant — required by crossfade).
  const beige = plastic(0xd8cfb4, 0.52);
  const brownTrim = plastic(0x4a3d30, 0.6);
  const keyCap = plastic(0x33352f, 0.55);
  const vfdMaterial = glow(0x51ff5a, 1.5);
  const segMaterial = glow(0x74ff70, 2.2);
  const bedAlloy = brushedSteel();
  const railChrome = chrome();
  const gripRed = plastic(0xb03a2e, 0.4);
  const slipWhite = paper();
  const slipCarbon = paper(0x23252a);

  /* --- Electronic POS terminal (left) --------------------------------------- */
  const posX = -0.62;
  const pos = new THREE.Group();
  pos.position.set(posX, 0, -0.02);

  // Wedge base.
  pos.add(box(beige, 0.36, 0.12, 0.3, 0, 0.06, 0));
  pos.add(box(brownTrim, 0.37, 0.014, 0.31, 0, 0.007, 0)); // dark foot skirt

  // Keypad matrix on the operator deck (+z side), slightly tilted.
  const keypadDeck = box(brownTrim, 0.3, 0.02, 0.14, 0, 0.125, 0.06);
  keypadDeck.rotation.x = 0.3;
  pos.add(keypadDeck);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const key = box(keyCap, 0.038, 0.014, 0.026, -0.108 + col * 0.072, 0.148 - row * 0.021, 0.028 + row * 0.043);
      key.rotation.x = 0.3;
      key.name = `pos-key-${row}-${col}`;
      pos.add(key);
    }
  }

  // Tilted VFD head facing the customer (−z), tipped up for eye line.
  const head = new THREE.Group();
  head.name = 'pos-display-head';
  head.rotation.x = 0.42;
  head.position.set(0, 0.155, -0.075);
  head.add(box(beige, 0.32, 0.14, 0.055, 0, 0.045, 0));
  const bezel = box(brownTrim, 0.29, 0.105, 0.012, 0, 0.05, -0.03);
  head.add(bezel);
  const vfdScreen = box(vfdMaterial, 0.255, 0.075, 0.006, 0, 0.05, -0.038);
  vfdScreen.name = 'pos-vfd-screen';
  markGlowSurface(vfdScreen);
  head.add(vfdScreen);
  // Segment digits glowing brighter than the panel background.
  for (let i = 0; i < 6; i += 1) {
    const seg = box(segMaterial, 0.022, 0.036, 0.002, -0.1 + i * 0.04, 0.05, -0.043);
    seg.name = `vfd-segment-${i}`;
    markGlowSurface(seg);
    head.add(seg);
  }
  pos.add(head);
  group.add(pos);

  /* --- Click-clack card imprinter (right) ----------------------------------- */
  const impX = 0.22;
  const imprinter = new THREE.Group();
  imprinter.position.set(impX, 0, -0.03);

  // Flat bed with guide rails along x.
  imprinter.add(box(bedAlloy, 0.26, 0.026, 0.34, 0, 0.013, 0));
  imprinter.add(box(railChrome, 0.24, 0.012, 0.014, 0, 0.032, -0.13));
  imprinter.add(box(railChrome, 0.24, 0.012, 0.014, 0, 0.032, 0.13));
  imprinter.name = 'imprinter-base';

  // Sliding carriage: end posts + cross bar + red grip knob.
  const carriage = new THREE.Group();
  carriage.name = 'imprinter-arm';
  carriage.position.set(0, 0.038, 0);
  carriage.add(box(railChrome, 0.02, 0.085, 0.03, -0.1, 0.042, 0));
  carriage.add(box(railChrome, 0.02, 0.085, 0.03, 0.1, 0.042, 0));
  carriage.add(box(gripRed, 0.23, 0.024, 0.036, 0, 0.089, 0));
  carriage.add(cylinderLike());
  imprinter.add(carriage);

  group.add(imprinter);

  /* --- Carbon slip stacks between terminal and imprinter -------------------- */
  const slipStackA = makeSheetStack(
    [slipWhite, slipCarbon, slipWhite, slipCarbon, slipWhite],
    0.14,
    0.2,
    0.0018,
  );
  slipStackA.position.set(-0.16, 0, -0.08);
  group.add(slipStackA);
  const slipStackB = makeSheetStack(
    [slipWhite, slipCarbon, slipWhite],
    0.14,
    0.2,
    0.0018,
  );
  slipStackB.position.set(-0.14, 0, 0.16);
  group.add(slipStackB);
  // A blank slip laid on the imprinter bed, ready for the clack.
  group.add(makeFlatSheet(slipWhite, 0.13, 0.19, impX - 0.02, -0.03, 0.04));

  /* --- Idle animations ------------------------------------------------------- */
  let elapsed = 0;
  const DRAG_PERIOD = 4.6;
  addAnimator(group, (deltaSeconds) => {
    elapsed += deltaSeconds;

    // VFD flicker: fast small ripple plus slow breathing.
    const flicker = 0.92 + 0.08 * Math.sin(elapsed * 21) * Math.sin(elapsed * 5.3);
    vfdMaterial.emissiveIntensity = 1.5 * flicker;
    segMaterial.emissiveIntensity = 2.2 * flicker;

    // Imprinter drag: rest → pull left → dwell → push right → rest.
    const phase = cycle(elapsed, DRAG_PERIOD);
    let slide = 0;
    if (phase < 0.1) slide = 0;
    else if (phase < 0.28) slide = smoothstep((phase - 0.1) / 0.18);
    else if (phase < 0.48) slide = 1;
    else if (phase < 0.66) slide = 1 - smoothstep((phase - 0.48) / 0.18);
    else slide = 0;
    carriage.position.x = -slide * 0.085;
  });

  stampPresetMetadata(group, {
    year: 1985,
    title: 'Electronic POS + card imprinter',
    deviceLabels: [
      'Beige electronic POS terminal',
      'Green VFD customer display',
      'Click-clack card imprinter',
      'Carbon-paper sales slips',
    ],
    receiptMethod: 'carbon slips + dot-matrix roll',
  });

  return group;

  /** Local helper so the grip knob stays next to its carriage definition. */
  function cylinderLike(): THREE.Mesh {
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.05, 14),
      gripRed,
    );
    knob.rotation.z = Math.PI / 2;
    knob.position.set(0, 0.089, 0.03);
    return knob;
  }
}
