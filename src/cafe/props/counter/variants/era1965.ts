import * as THREE from 'three';
import { SERVICE_COUNTER } from '../layout';
import { stampPresetMetadata } from '../eraMeta';
import type { EraVariantContext } from '../types';
import { addAnimator, cycle, smoothstep } from '../kit/animate';
import { box, cylinder, markGlowSurface, orient, sphere } from '../kit/geometries';
import {
  blackSteel,
  chrome,
  enamel,
  glow,
  metal,
  paper,
  plastic,
} from '../kit/materials';
import {
  makeCoinStack,
  makeReceiptCurl,
} from '../kit/parts';

/**
 * 1965 — electromechanical cash register.
 *
 * A big cream-enamel cabinet with a chrome belt line, a sloped deck of large
 * round key buttons for the barista, a pop-up total flag in a roof slot, a
 * receipt roll curling out of the back, and a steel change tray with coins.
 * Idle life: the total flag periodically pops up, holds, and drops.
 */
export function buildEra1965Counter(_context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'counter-tech-era-1965';
  group.position.set(SERVICE_COUNTER.centerX, SERVICE_COUNTER.topY, SERVICE_COUNTER.centerZ);

  // Palette (fresh material instances per variant — required by crossfade).
  const cream = enamel(0xe8e0cc);
  const darkCap = plastic(0x2b2b2e, 0.55);
  const lightCap = enamel(0xf4efe0);
  const trim = chrome();
  const iron = blackSteel();
  const traySteel = metal(0x9aa0a6, 0.35, 0.85);
  const receiptPaper = paper();

  /* --- Register body ------------------------------------------------------ */
  const regX = -0.45;
  const reg = new THREE.Group();
  reg.position.set(regX, 0, -0.02);

  // Plinth and main cabinet.
  reg.add(box(iron, 0.54, 0.05, 0.46, 0, 0.025, 0));
  reg.add(box(cream, 0.5, 0.28, 0.42, 0, 0.19, 0));
  // Chrome belt line around the waist (four thin strips).
  reg.add(box(trim, 0.51, 0.014, 0.012, 0, 0.24, -0.213));
  reg.add(box(trim, 0.51, 0.014, 0.012, 0, 0.24, 0.213));
  reg.add(box(trim, 0.012, 0.014, 0.43, -0.251, 0.24, 0));
  reg.add(box(trim, 0.012, 0.014, 0.43, 0.251, 0.24, 0));

  // Domed roof section.
  reg.add(box(cream, 0.46, 0.13, 0.38, 0, 0.395, -0.01));

  /* --- Pop-up total flag --------------------------------------------------- */
  const flagHousing = box(darkCap, 0.22, 0.115, 0.06, 0, 0.465, -0.08);
  flagHousing.name = 'register-flag-slot';
  reg.add(flagHousing);
  // Flag face + printed digit bars travel together.
  const flag = new THREE.Group();
  flag.name = 'register-total-flag';
  flag.add(box(lightCap, 0.17, 0.085, 0.008, 0, 0.462, -0.08));
  for (let i = 0; i < 4; i += 1) {
    flag.add(box(darkCap, 0.018, 0.048, 0.003, -0.057 + i * 0.038, 0.466, -0.0855));
  }
  reg.add(flag);

  /* --- Operator key deck (sloped down toward +z) ---------------------------- */
  const deck = box(darkCap, 0.44, 0.03, 0.22, 0, 0.235, 0.185);
  deck.rotation.x = 0.5;
  deck.name = 'register-key-deck';
  reg.add(deck);
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const key = cylinder(
        (row + col) % 2 === 0 ? cream : darkCap,
        0.027,
        0.03,
        0.02,
        -0.16 + col * 0.08,
        0.262 - row * 0.052,
        0.135 + row * 0.075,
      );
      key.rotation.x = 0.5;
      key.name = `register-key-${row}-${col}`;
      reg.add(key);
    }
  }
  // Big chrome repeat bar lying across the bottom of the deck.
  const repeatBar = cylinder(trim, 0.03, 0.033, 0.11, 0, 0.163, 0.283);
  orient(repeatBar, 0.5, 0, Math.PI / 2);
  reg.add(repeatBar);

  /* --- Customer-side details ----------------------------------------------- */
  // Round glass window over the internal counter wheels.
  const wheelWindow = sphere(glow(0xffe9b0, 0.35), 0.055, 0, 0.31, -0.222, 0.4);
  wheelWindow.name = 'register-wheel-window';
  markGlowSurface(wheelWindow);
  reg.add(wheelWindow);
  // Gold brand badge.
  reg.add(box(metal(0xc9a53f, 0.32, 1), 0.09, 0.03, 0.008, -0.16, 0.33, -0.212));

  // Receipt slot at the roof back with a curled strip.
  reg.add(box(darkCap, 0.16, 0.02, 0.05, 0, 0.442, -0.165));
  reg.add(makeReceiptCurl(receiptPaper, 0.14, 0, 0.452, -0.175));

  group.add(reg);

  /* --- Steel change tray (right) ------------------------------------------- */
  const tray = new THREE.Group();
  tray.name = 'change-tray';
  tray.add(box(traySteel, 0.3, 0.018, 0.2, 0, 0.009, 0));
  tray.add(box(traySteel, 0.3, 0.03, 0.01, 0, 0.015, -0.095));
  tray.add(box(traySteel, 0.3, 0.03, 0.01, 0, 0.015, 0.095));
  tray.add(box(traySteel, 0.01, 0.03, 0.2, -0.145, 0.015, 0));
  tray.add(box(traySteel, 0.01, 0.03, 0.2, 0.145, 0.015, 0));
  tray.position.set(0.18, 0, 0.02);
  group.add(tray);
  group.add(makeCoinStack([trim, traySteel], 4, 0.015, 0.1, 0.0));
  group.add(makeCoinStack([traySteel, trim], 6, 0.013, 0.25, 0.06));

  /* --- Idle animation: the total flag pops --------------------------------- */
  let elapsed = 0;
  const FLAG_PERIOD = 6;
  const baseFlagY = flag.position.y;
  addAnimator(group, (deltaSeconds) => {
    elapsed += deltaSeconds;
    const phase = cycle(elapsed, FLAG_PERIOD);
    let rise = 0;
    if (phase < 0.18) rise = smoothstep(phase / 0.18);
    else if (phase < 0.62) rise = 1;
    else if (phase < 0.8) rise = 1 - smoothstep((phase - 0.62) / 0.18);
    flag.position.y = baseFlagY + rise * 0.062;
  });

  stampPresetMetadata(group, {
    year: 1965,
    title: 'Electromechanical cash register',
    deviceLabels: [
      'Cream electromechanical cash register',
      'Ten big round key buttons + repeat bar',
      'Pop-up total flag display',
      'Roll receipt printer',
      'Steel change tray with coins',
    ],
    receiptMethod: 'register roll',
  });

  return group;
}
