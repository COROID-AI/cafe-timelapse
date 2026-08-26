import * as THREE from 'three';
import { SERVICE_COUNTER } from '../layout';
import { stampPresetMetadata } from '../eraMeta';
import type { EraVariantContext } from '../types';
import { addAnimator, cycle, pulse } from '../kit/animate';
import { box, cylinder, markGlowSurface, sphere } from '../kit/geometries';
import { blackSteel, glow, paper, plastic } from '../kit/materials';
import { makeContactlessWaves, makeLedDot, makeQrPlaque } from '../kit/parts';

/**
 * 2025 — tablet POS on a swivel stand + contactless tap-to-pay reader.
 *
 * A tablet running the register app on a weighted swivel stand (colourful
 * order tiles on screen), an upright tap-to-pay reader with a glowing
 * contactless wave symbol, and a tent-card QR ordering stand for table
 * service. Idle life: the tablet slowly swivels toward the queue and the
 * reader's waves breathe their "tap ready" pulse.
 */
export function buildEra2025Counter(_context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'counter-tech-era-2025';
  group.position.set(SERVICE_COUNTER.centerX, SERVICE_COUNTER.topY, SERVICE_COUNTER.centerZ);

  // Palette (fresh material instances per variant — required by crossfade).
  const spaceGrey = plastic(0x2a2c31, 0.5);
  const darkBase = blackSteel();
  const screenMaterial = glow(0x8fd8ff, 1.35);
  const tileOrange = glow(0xffa94d, 1.25);
  const tileGreen = glow(0x69db7c, 1.25);
  const tileBlue = glow(0x74c0fc, 1.25);
  const tilePink = glow(0xf783ac, 1.25);
  const readerBody = plastic(0x23262b, 0.55);
  const waveMaterial = glow(0x35e0ff, 1.7);
  const readerScreen = glow(0x59d9ff, 0.9);
  const plaqueWhite = paper(0xf6f4ee);

  /* --- Tablet POS on swivel stand (left) -------------------------------------- */
  const standX = -0.6;
  const stand = new THREE.Group();
  stand.name = 'tablet-stand';
  stand.position.set(standX, 0, -0.04);
  stand.add(cylinder(darkBase, 0.095, 0.105, 0.016, 0, 0.008, 0));
  stand.add(cylinder(spaceGrey, 0.014, 0.017, 0.17, 0, 0.1, 0));

  // Swivel head carrying the tablet.
  const head = new THREE.Group();
  head.name = 'tablet-head';
  head.rotation.x = 0.22;
  head.position.set(0, 0.195, 0);
  head.add(box(spaceGrey, 0.26, 0.178, 0.012));
  const tabletScreen = box(screenMaterial, 0.235, 0.152, 0.003, 0, 0, -0.0075);
  tabletScreen.name = 'tablet-screen';
  markGlowSurface(tabletScreen);
  head.add(tabletScreen);
  // Order-app tiles floating just above the screen glass.
  const tileSpecs: Array<[number, number, THREE.MeshStandardMaterial]> = [
    [-0.055, 0.04, tileOrange],
    [0.055, 0.04, tileGreen],
    [-0.055, -0.04, tileBlue],
    [0.055, -0.04, tilePink],
  ];
  for (const [tx, ty, material] of tileSpecs) {
    const tile = box(material, 0.09, 0.052, 0.002, tx, ty, -0.0095);
    markGlowSurface(tile);
    head.add(tile);
  }
  head.add(sphere(darkBase, 0.006, 0, 0.075, -0.007)); // camera dot
  stand.add(head);
  group.add(stand);

  /* --- Contactless tap-to-pay reader (centre) ---------------------------------- */
  const readerX = 0.02;
  const reader = new THREE.Group();
  reader.name = 'tap-reader';
  reader.position.set(readerX, 0, -0.06);
  reader.add(box(darkBase, 0.11, 0.018, 0.09, 0, 0.009, 0)); // foot
  const body = box(readerBody, 0.105, 0.15, 0.05, 0, 0.093, 0.008);
  body.name = 'tap-reader-body';
  reader.add(body);
  // Small status strip above the waves.
  const strip = box(readerScreen, 0.08, 0.03, 0.004, 0, 0.148, -0.0185);
  strip.name = 'tap-reader-strip';
  markGlowSurface(strip);
  reader.add(strip);
  // Glowing contactless target on the customer face (−z).
  const target = box(waveMaterial, 0.062, 0.062, 0.004, 0, 0.098, -0.0175);
  target.name = 'tap-reader-glow';
  markGlowSurface(target);
  reader.add(target);
  reader.add(makeContactlessWaves(waveMaterial, 0.014, 0, 0.098, -0.021));
  group.add(reader);

  /* --- QR ordering stand (right) ------------------------------------------------ */
  const qrX = 0.52;
  const qrStand = new THREE.Group();
  qrStand.name = 'qr-stand';
  qrStand.position.set(qrX, 0, -0.05);
  qrStand.add(box(spaceGrey, 0.16, 0.012, 0.11, 0, 0.006, 0));

  // Easel-style holder leaning back so the code faces the standing customer.
  const holder = new THREE.Group();
  holder.rotation.x = 0.42;
  holder.position.set(0, 0.01, 0);
  holder.add(box(spaceGrey, 0.145, 0.145, 0.006, 0, 0.08, 0));
  const plaque = makeQrPlaque(plaqueWhite, darkBase, 0.125);
  plaque.position.set(0, 0.08, -0.005);
  plaque.name = 'qr-code';
  holder.add(plaque);
  qrStand.add(holder);
  qrStand.add(makeLedDot(0x69db7c, 0.058, 0.014, -0.042));
  group.add(qrStand);

  /* --- Idle animations ------------------------------------------------------------ */
  let elapsed = 0;
  addAnimator(group, (deltaSeconds) => {
    elapsed += deltaSeconds;

    // Tablet swivels gently between barista and queue side.
    head.rotation.y = Math.sin(elapsed * 0.65) * 0.14;

    // Tap reader breathing: waves and target pulse together.
    const readyPulse = 0.55 + 0.45 * pulse(cycle(elapsed, 2.4));
    waveMaterial.emissiveIntensity = 0.9 + 1.5 * readyPulse;

    // Screen brightness follows a slow ambient cycle.
    screenMaterial.emissiveIntensity = 1.3 + 0.15 * Math.sin(elapsed * 0.9);
  });

  stampPresetMetadata(group, {
    year: 2025,
    title: 'Tablet POS + contactless',
    deviceLabels: [
      'Tablet POS on swivel stand',
      'Order-app tile interface',
      'Contactless tap-to-pay reader (glowing)',
      'QR ordering stand',
    ],
    receiptMethod: 'email / SMS receipt',
  });

  return group;
}