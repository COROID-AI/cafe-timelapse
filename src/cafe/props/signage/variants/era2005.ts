import * as THREE from 'three';
import { glow } from '../../machines/kit/materials';
import { COUNTER_LIP } from '../layout';
import { makeBlockyLetter, makeDownlightCan, makeLedStrip } from '../kit';
import type { EraVariantBuilder } from '../types';

/**
 * 2005 — brushed-metal café-retail signage & lighting.
 *
 * Dimensional brushed-steel letters spell CAFÉ on the north fascia (no
 * illumination — pure machined metal catching the room), recessed cool-white
 * downlights wash the seating zones, and blue-white LED strips graze along
 * under the counter lip.
 */
export const buildEra2005Signage: EraVariantBuilder = (): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'signage-era-2005';

  /* --- Brushed-metal dimensional letters ----------------------------------- */
  const letterMaterial = new THREE.MeshStandardMaterial({
    color: 0xb9bec6,
    metalness: 0.88,
    roughness: 0.34,
  });

  const CELL = 0.055;
  const DEPTH = 0.05;
  const LETTER_W = CELL * 3;
  const GAP = 0.08;
  const RUN_CENTER_X = -1.0;
  const LETTER_Y = 2.72;

  const patterns: Array<{ rows: string[]; accent?: boolean }> = [
    { rows: ['111', '100', '100', '100', '111'] }, // C
    { rows: ['010', '101', '111', '101', '101'] }, // A
    { rows: ['111', '100', '110', '100', '100'] }, // F
    { rows: ['111', '100', '110', '100', '111'], accent: true }, // É
  ];

  let cursorX = RUN_CENTER_X - ((LETTER_W * 4 + GAP * 3) / 2) + LETTER_W / 2;
  for (const pattern of patterns) {
    const letter = makeBlockyLetter(pattern.rows, letterMaterial, CELL, DEPTH);
    letter.position.set(cursorX, LETTER_Y, 4.95);
    group.add(letter);

    if (pattern.accent) {
      // Acute accent floating over the E.
      const accent = new THREE.Mesh(
        new THREE.BoxGeometry(CELL * 1.4, CELL * 0.5, DEPTH),
        letterMaterial,
      );
      accent.position.set(cursorX, LETTER_Y + CELL * 3.1, 4.95);
      accent.rotation.z = 0.5;
      group.add(accent);
    }
    cursorX += LETTER_W + GAP;
  }

  /* --- Recessed cool-white downlights --------------------------------------- */
  const diffuser = glow(0xf2f7ff, 1.25);
  const canSpots: Array<[number, number]> = [
    [-2.6, -1.0],
    [2.6, -1.0],
    [-1.4, 1.8],
    [1.8, 1.8],
  ];
  for (const [cx, cz] of canSpots) {
    const can = makeDownlightCan(diffuser);
    can.position.set(cx, 3.585, cz);
    group.add(can);

    const target = new THREE.Object3D();
    target.position.set(cx, 0, cz);
    group.add(target);

    const downlight = new THREE.SpotLight(0xf2f7ff, 40, 7, 0.55, 0.65, 1.6);
    downlight.position.set(cx, 3.55, cz);
    downlight.target = target;
    group.add(downlight);
  }

  /* --- Cool-white LED strips under the counter lip --------------------------- */
  for (const stripX of [-1.45, 1.45]) {
    const strip = makeLedStrip(2.5, 0xcfe4ff, 1.45);
    strip.position.set(stripX, COUNTER_LIP.y, COUNTER_LIP.z);
    group.add(strip);

    const channel = new THREE.Mesh(
      new THREE.BoxGeometry(2.56, 0.03, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x9aa2ad, metalness: 0.7, roughness: 0.4 }),
    );
    channel.position.set(stripX, COUNTER_LIP.y + 0.028, COUNTER_LIP.z);
    group.add(channel);

    const wash = new THREE.PointLight(0xcfe4ff, 3.2, 3.2, 1.85);
    wash.position.set(stripX, COUNTER_LIP.y - 0.05, COUNTER_LIP.z - 0.12);
    group.add(wash);
  }

  group.userData.eraTitle = 'Brushed metal & LED strips';
  group.userData.fixtureLabels = [
    "Brushed-metal dimensional 'CAFÉ' letters",
    '4× recessed cool-white downlights',
    '2× blue-white LED strips under the counter lip',
  ];
  return group;
};
