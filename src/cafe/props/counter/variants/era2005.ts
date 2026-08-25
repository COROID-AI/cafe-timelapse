import * as THREE from 'three';
import { SERVICE_COUNTER } from '../layout';
import { stampPresetMetadata } from '../eraMeta';
import type { EraVariantContext } from '../types';
import { addAnimator, cycle, pulse } from '../kit/animate';
import { box, cylinder, markGlowSurface } from '../kit/geometries';
import {
  blackSteel,
  brushedSteel,
  glow,
  paper,
  plastic,
} from '../kit/materials';
import {
  makeLedDot,
  makeReceiptCurl,
} from '../kit/parts';

/**
 * 2005 — flat-screen PC-based till + magnetic-stripe terminal.
 *
 * A black LCD monitor on a neck stand over a slim horizontal desktop box,
 * a low-profile keyboard on the operator side, a receipt printer curling
 * paper toward the customer, and a grey magnetic-stripe card terminal with
 * PIN pad, swipe channel and blinking approval LED. Idle life: the LCD
 * backlight breathes gently and the terminal LED blinks its approval pulse.
 */
export function buildEra2005Counter(_context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'counter-tech-era-2005';
  group.position.set(SERVICE_COUNTER.centerX, SERVICE_COUNTER.topY, SERVICE_COUNTER.centerZ);

  // Palette (fresh material instances per variant — required by crossfade).
  const matteBlack = plastic(0x1d1f24, 0.55);
  const caseGrey = brushedSteel();
  const keyboardPlastic = plastic(0x22252b, 0.6);
  const keyPlate = plastic(0x3a3f47, 0.5);
  const terminalGrey = plastic(0xb9bec5, 0.5);
  const terminalDark = plastic(0x2e3238, 0.55);
  const lcdMaterial = glow(0xbfd9ff, 1.15);
  const termScreen = glow(0x9fe6ff, 1.1);
  const receiptPaper = paper();

  /* --- PC till (left) -------------------------------------------------------- */
  const tillX = -0.55;

  // Monitor stand.
  group.add(cylinder(matteBlack, 0.075, 0.09, 0.014, tillX, 0.007, 0.02));
  group.add(box(matteBlack, 0.05, 0.17, 0.04, tillX, 0.095, 0.03));

  // Monitor leaning back (+z) so the panel faces the counter front.
  const monitor = new THREE.Group();
  monitor.name = 'till-monitor';
  monitor.rotation.x = 0.08;
  monitor.position.set(tillX, 0.18, 0.02);
  monitor.add(box(matteBlack, 0.46, 0.32, 0.026, 0, 0.13, 0));
  const screen = box(lcdMaterial, 0.42, 0.275, 0.006, 0, 0.132, -0.016);
  screen.name = 'till-lcd-screen';
  markGlowSurface(screen);
  monitor.add(screen);
  group.add(monitor);

  // Slim horizontal desktop tucked behind/below the monitor.
  const pcBox = box(caseGrey, 0.4, 0.062, 0.26, tillX + 0.02, 0.031, 0.14);
  pcBox.name = 'till-pc-box';
  group.add(pcBox);
  group.add(makeLedDot(0x33ff66, tillX - 0.16, 0.031, 0.272));

  // Low-profile keyboard on the operator side.
  const keyboard = box(keyboardPlastic, 0.4, 0.016, 0.145, tillX, 0.008, 0.21);
  keyboard.name = 'till-keyboard';
  group.add(keyboard);
  group.add(box(keyPlate, 0.36, 0.004, 0.105, tillX, 0.018, 0.21));

  /* --- Receipt printer (centre) ---------------------------------------------- */
  const printer = new THREE.Group();
  printer.name = 'receipt-printer';
  printer.position.set(-0.05, 0, -0.12);
  printer.add(box(matteBlack, 0.17, 0.115, 0.2, 0, 0.0575, 0));
  printer.add(box(matteBlack, 0.15, 0.02, 0.06, 0, 0.122, 0.01)); // tear bar
  printer.add(makeReceiptCurl(receiptPaper, 0.075, 0, 0.128, -0.02));
  group.add(printer);

  /* --- Magnetic-stripe card terminal (right) ---------------------------------- */
  const termX = 0.38;
  const terminal = new THREE.Group();
  terminal.name = 'stripe-terminal';
  terminal.position.set(termX, 0, 0.02);

  // Cradle base + raised back stop.
  terminal.add(box(terminalDark, 0.15, 0.038, 0.22, 0, 0.019, 0));
  terminal.add(box(terminalDark, 0.15, 0.05, 0.07, 0, 0.055, 0.07));

  // Angled faceplate assembly toward the customer (−z), tipped up.
  const faceUnit = new THREE.Group();
  faceUnit.rotation.x = 0.55;
  faceUnit.position.set(0, 0.055, -0.005);
  faceUnit.add(box(terminalGrey, 0.14, 0.165, 0.035, 0, 0.045, 0));
  const smallScreen = box(termScreen, 0.1, 0.05, 0.005, 0, 0.093, -0.019);
  smallScreen.name = 'stripe-terminal-screen';
  markGlowSurface(smallScreen);
  faceUnit.add(smallScreen);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      faceUnit.add(
        box(terminalDark, 0.028, 0.02, 0.008, -0.037 + col * 0.037, 0.052 - row * 0.03, -0.019),
      );
    }
  }
  terminal.add(faceUnit);

  // Magnetic-stripe swipe channel running along the right edge.
  const swipeChannel = box(blackSteel(), 0.032, 0.01, 0.2, 0.092, 0.098, -0.01);
  swipeChannel.name = 'stripe-swipe-slot';
  terminal.add(swipeChannel);
  terminal.add(box(terminalGrey, 0.05, 0.012, 0.2, 0.062, 0.092, -0.01));

  const led = makeLedDot(0x33ff66, -0.055, 0.104, -0.02);
  led.name = 'terminal-led';
  terminal.add(led);

  group.add(terminal);

  /* --- Idle animations --------------------------------------------------------- */
  let elapsed = 0;
  addAnimator(group, (deltaSeconds) => {
    elapsed += deltaSeconds;

    // LCD backlight breathing.
    lcdMaterial.emissiveIntensity = 1.15 + 0.18 * pulse(cycle(elapsed, 5.2, 1.3));

    // Terminal LED: short approval blink every ~1.6 s.
    const phase = cycle(elapsed, 1.6);
    const ledMaterial = led.material as THREE.MeshStandardMaterial;
    ledMaterial.emissiveIntensity = phase < 0.1 ? 2.2 : 0.25;
  });

  stampPresetMetadata(group, {
    year: 2005,
    title: 'PC-based till + stripe terminal',
    deviceLabels: [
      'Flat-screen PC till with keyboard',
      'Slim horizontal desktop unit',
      'Thermal receipt printer',
      'Magnetic-stripe card terminal with PIN pad',
      'Swipe channel + approval LED',
    ],
    receiptMethod: 'thermal roll',
  });

  return group;
}
