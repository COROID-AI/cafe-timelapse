import * as THREE from 'three';
import { box, cylinder, orient, sphere, torus } from '../../machines/kit/geometries';
import { chrome, glow, paint, plastic } from '../../machines/kit/materials';
import { WINDOW_SIGN } from '../layout';
import { makePendantLamp, makeSignFace } from '../kit';
import type { EraVariantBuilder } from '../types';

/**
 * 1965 — American-diner signage & lighting.
 *
 * A cherry-red neon "CAFÉ" buzzes in the middle street window on a dark
 * backing panel, chrome-and-vinyl pendants hang over the tables, and a long
 * ceiling fluorescent tube lifts the whole room to a bright, even hum.
 */
export const buildEra1965Signage: EraVariantBuilder = (): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'signage-era-1965';

  const animators: ((elapsedSeconds: number) => void)[] = [];

  /* --- Neon 'CAFÉ' window sign -------------------------------------------- */
  const backing = box(paint(0x15151a, 0.55), 1.5, 0.62, 0.06, WINDOW_SIGN.x, WINDOW_SIGN.y, WINDOW_SIGN.z - 0.03);
  backing.rotation.x = -0.06;
  group.add(backing);

  const neonFace = makeSignFace({
    text: 'CAFÉ',
    textColor: '#ff6a48',
    font: 'bold 170px "Brush Script MT", "Segoe Script", cursive',
    glowPx: 26,
    italic: true,
    fallbackColor: 0xff5238,
    emissiveIntensity: 1.9,
  });
  for (const side of [-1, 1]) {
    const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.54), neonFace.material);
    facePlane.position.set(WINDOW_SIGN.x, WINDOW_SIGN.y, WINDOW_SIGN.z + side * 0.005);
    if (side === 1) facePlane.rotation.y = Math.PI;
    facePlane.rotation.x = -0.06;
    group.add(facePlane);
  }
  // Glass tube caps at the lettering corners sell the "real tube" read.
  const tubeGlass = plastic(0xffd3c4, 0.25);
  for (const offsetX of [-0.62, 0.62]) {
    group.add(sphere(tubeGlass, 0.02, WINDOW_SIGN.x + offsetX, WINDOW_SIGN.y, WINDOW_SIGN.z));
  }

  const neonLight = new THREE.PointLight(0xff4a38, 4.5, 5.5, 1.8);
  neonLight.position.set(WINDOW_SIGN.x, WINDOW_SIGN.y, WINDOW_SIGN.z + 0.45);
  group.add(neonLight);

  // Transformer hum: fast subtle flicker plus an occasional stutter.
  {
    const material = neonFace.material;
    const baseEmissive = material.emissiveIntensity;
    const baseIntensity = 4.5;
    animators.push((t) => {
      const fadeFactor = (neonLight.userData.fadeFactor as number | undefined) ?? 1;
      let flicker = 0.92 + 0.06 * Math.sin(t * 31.7) + 0.02 * Math.sin(t * 7.3);
      if (Math.sin(t * 1.7) > 0.995) flicker *= 0.55; // rare starter stutter
      material.emissiveIntensity = baseEmissive * flicker;
      neonLight.intensity = baseIntensity * fadeFactor * flicker;
    });
  }

  /* --- Chrome-and-vinyl pendant lights ------------------------------------- */
  const chromeShade = chrome();
  const vinylRim = plastic(0x3fa8a0, 0.4); // turquoise diner vinyl trim
  const bulbGlow = glow(0xfff2cf, 1.3);
  const pendantXs = [-2.3, 0, 2.3];
  for (const px of pendantXs) {
    const lamp = makePendantLamp({
      dropY: 2.3,
      shade: chromeShade,
      rim: vinylRim,
      bulb: bulbGlow,
      shadeRadius: 0.19,
      shadeHeight: 0.16,
    });
    lamp.position.set(px, 0, -1.6);
    group.add(lamp);

    const light = new THREE.PointLight(0xffe7bd, 3.6, 5.2, 1.85);
    light.position.set(px, 2.22, -1.6);
    group.add(light);
  }

  /* --- Fluorescent ceiling run (brighter ambient) --------------------------- */
  const housingMat = paint(0xe8e8ea, 0.4);
  group.add(box(housingMat, 2.2, 0.07, 0.2, 0, 3.47, 0.8));
  group.add(
    orient(cylinder(housingMat, 0.008, 0.008, 0.13, -1.05, 3.53, 0.8), 0, 0, Math.PI / 2),
  );
  group.add(orient(cylinder(housingMat, 0.008, 0.008, 0.13, 1.05, 3.53, 0.8), 0, 0, Math.PI / 2));

  const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 0.16), glow(0xeef6ff, 1.35).clone());
  diffuser.rotation.x = Math.PI / 2;
  diffuser.position.set(0, 3.43, 0.8);
  group.add(diffuser);

  const fluorescent = new THREE.PointLight(0xedf4ff, 6.5, 9.5, 1.7);
  fluorescent.position.set(0, 3.32, 0.8);
  group.add(fluorescent);

  // Ballast shimmer — barely there, keeps the tube alive.
  {
    const baseIntensity = 6.5;
    animators.push((t) => {
      const fadeFactor = (fluorescent.userData.fadeFactor as number | undefined) ?? 1;
      fluorescent.intensity =
        baseIntensity * fadeFactor * (0.99 + 0.01 * Math.sin(t * 119.0)); // ~19 Hz beat
    });
  }

  // Chrome starburst accent beside the sign — pure diner jewellery.
  const burst = new THREE.Group();
  burst.add(sphere(chrome(), 0.05, 0, 0, 0));
  for (let i = 0; i < 8; i++) {
    const ray = cylinder(chrome(), 0.008, 0.016, 0.14, 0, 0.11, 0);
    ray.rotation.z = (i / 8) * Math.PI * 2;
    const holder = new THREE.Group();
    holder.add(ray);
    holder.rotation.x = (i % 2 === 0 ? 1 : -1) * 0.12;
    burst.add(holder);
  }
  burst.add(torus(vinylRim, 0.07, 0.012, 0, 0, 0));
  burst.position.set(-1.15, 2.35, -4.94);
  burst.rotation.x = 0.35;
  group.add(burst);

  group.userData.eraTitle = 'Diner neon & chrome';
  group.userData.fixtureLabels = [
    "Neon 'CAFÉ' window sign",
    '3× chrome-and-vinyl pendants',
    'Fluorescent ceiling run (bright ambient)',
  ];
  group.userData.animators = animators;
  return group;
};
