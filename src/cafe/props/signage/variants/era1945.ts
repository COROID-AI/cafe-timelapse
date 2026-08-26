import * as THREE from 'three';
import { box, cylinder, sphere } from '../../machines/kit/geometries';
import { blackSteel, fabric, glow, metal, wood } from '../../machines/kit/materials';
import { DOORWAY, EAST_WINDOWS, SOUTH_WINDOWS } from '../layout';
import { makeGasSconce, makePaintedBoard, makePendantLamp, makeSignFace } from '../kit';
import type { EraVariantBuilder } from '../types';

/**
 * 1945 — wartime blackout signage & lighting.
 *
 * A hand-painted hanging wooden sign ("CAFÉ" cream on bottle green) swings in
 * the middle street window on chain links. Two low-wattage filament bulbs in
 * plain tin shades pool warm light over tables, heavy blackout curtains seal
 * every street window, and gaslight-style sconces flank the doorway. The room
 * should read as an island of warmth in a dark street.
 */
export const buildEra1945Signage: EraVariantBuilder = (): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'signage-era-1945';

  const animators: ((elapsedSeconds: number) => void)[] = [];

  /* --- Hand-painted hanging wooden sign ---------------------------------- */
  const face = makeSignFace({
    text: 'CAFÉ',
    textColor: '#f2e6c4',
    backgroundColor: '#1f3a2a',
    borderColor: '#d9c48f',
    borderWidth: 14,
    font: 'bold 150px Georgia, "Times New Roman", serif',
    glowPx: 10,
    fallbackColor: 0x24402e,
    emissiveIntensity: 0.22,
  });
  const frameWood = wood(0x54402c, 0.7);
  const board = makePaintedBoard(1.15, 0.42, 0.05, face, frameWood);
  board.position.set(SOUTH_WINDOWS.centerX[1], SOUTH_WINDOWS.sillY + 1.12, -4.82);
  board.rotation.z = 0.02;
  group.add(board);

  // Chain links up to the window head.
  const chainMat = blackSteel();
  for (const offsetX of [-0.42, 0.42]) {
    group.add(
      cylinder(
        chainMat,
        0.008,
        0.008,
        SOUTH_WINDOWS.topY - (SOUTH_WINDOWS.sillY + 1.33),
        SOUTH_WINDOWS.centerX[1] + offsetX,
        (SOUTH_WINDOWS.topY + SOUTH_WINDOWS.sillY + 1.33) / 2,
        -4.82,
      ),
    );
    group.add(sphere(chainMat, 0.016, SOUTH_WINDOWS.centerX[1] + offsetX, SOUTH_WINDOWS.topY - 0.02, -4.82));
  }

  /* --- Warm filament pendants in simple tin shades ------------------------ */
  const tinShade = metal(0x4b463c, 0.62, 0.55);
  const bulbGlow = glow(0xffd9a0, 1.15);
  const pendantSpots: Array<[number, number]> = [
    [-1.6, -2.2],
    [1.8, -0.4],
  ];
  let pendantIndex = 0;
  for (const [px, pz] of pendantSpots) {
    const lamp = makePendantLamp({
      dropY: 2.35,
      shade: tinShade,
      bulb: bulbGlow,
      shadeRadius: 0.16,
      shadeHeight: 0.13,
    });
    lamp.position.set(px, 0, pz);
    group.add(lamp);

    const light = new THREE.PointLight(0xffbf80, 2.2, 4.5, 1.9);
    light.position.set(px, 2.28, pz);
    group.add(light);

    // Low-wattage filaments breathe almost imperceptibly with the mains.
    const baseIntensity = 2.2;
    const phase = pendantIndex * 1.9;
    animators.push((t) => {
      const fadeFactor = (light.userData.fadeFactor as number | undefined) ?? 1;
      light.intensity = baseIntensity * fadeFactor * (0.97 + 0.03 * Math.sin(t * 6.1 + phase));
    });
    pendantIndex += 1;
  }

  /* --- Blackout curtains over every street window ------------------------- */
  const curtain = fabric(0x241f18);
  const pelmet = wood(0x3a2f22, 0.75);
  for (const centerX of SOUTH_WINDOWS.centerX) {
    const height = SOUTH_WINDOWS.topY - SOUTH_WINDOWS.sillY + 0.06;
    const centerY = SOUTH_WINDOWS.sillY + height / 2 - 0.03;
    for (const side of [-1, 1]) {
      const panel = box(curtain, 1.0, height, 0.04, centerX + side * 0.47, centerY, -4.93);
      panel.rotation.y = side * 0.05;
      group.add(panel);
    }
    group.add(box(pelmet, 2.0, 0.12, 0.07, centerX, SOUTH_WINDOWS.topY + 0.05, -4.92));
  }
  for (const centerZ of EAST_WINDOWS.centerZ) {
    const height = EAST_WINDOWS.topY - EAST_WINDOWS.sillY + 0.06;
    const centerY = EAST_WINDOWS.sillY + height / 2 - 0.03;
    for (const side of [-1, 1]) {
      const panel = box(curtain, 0.86, height, 0.04, 5.94, centerY, centerZ + side * 0.4);
      panel.rotation.x = side * 0.05;
      group.add(panel);
    }
    group.add(box(pelmet, 0.07, 0.12, 1.66, 5.95, EAST_WINDOWS.topY + 0.05, centerZ));
  }

  /* --- Gaslight-style sconces flanking the doorway ------------------------ */
  const sconceZs = [DOORWAY.centerZ - 0.85, DOORWAY.centerZ + 0.85];
  let sconceIndex = 0;
  for (const sz of sconceZs) {
    const { group: sconce, flame } = makeGasSconce();
    sconce.position.set(-5.93, 1.98, sz);
    group.add(sconce);

    const light = new THREE.PointLight(0xff9e4f, 1.1, 3.2, 1.8);
    light.position.set(-5.78, 2.0, sz);
    group.add(light);

    // Gas flames flutter.
    const baseIntensity = 1.1;
    const phase = sconceIndex * 2.4;
    animators.push((t) => {
      const fadeFactor = (light.userData.fadeFactor as number | undefined) ?? 1;
      const flutter = 0.88 + 0.12 * Math.sin(t * 9.3 + phase) * Math.sin(t * 3.7 + phase * 1.6);
      light.intensity = baseIntensity * fadeFactor * flutter;
      flame.scale.set(
        0.028 * (0.94 + 0.06 * Math.sin(t * 11.1 + phase)),
        0.042 * (0.9 + 0.1 * Math.sin(t * 8.2 + phase)),
        0.028,
      );
    });
    sconceIndex += 1;
  }

  group.userData.eraTitle = 'Wartime blackout';
  group.userData.fixtureLabels = [
    'Hand-painted hanging wooden sign',
    '2× low-wattage filament pendants, tin shades',
    'Blackout curtains on all street windows',
    '2× gaslight-style wall sconces',
  ];
  group.userData.animators = animators;
  return group;
};
