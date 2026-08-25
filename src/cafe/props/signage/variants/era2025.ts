import * as THREE from 'three';
import { cylinder, markGlowSurface, markNoCastShadow, sphere } from '../../machines/kit/geometries';
import { blackSteel, glass, glow } from '../../machines/kit/materials';
import { makeEdisonBulb, makeLedStrip, makeSignFace } from '../kit';
import type { EraVariantBuilder, SignageAnimator } from '../types';

/**
 * 2025 — contemporary minimal signage & lighting.
 *
 * A hairline LED neon outline sign glows on the north wall, smart bulbs drift
 * slowly between warm and cool "scenes", pendant Edison bulbs pool amber over
 * the tables, and a subtle mint LED strip breathes along the west shelf.
 */
export const buildEra2025Signage: EraVariantBuilder = (): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'signage-era-2025';

  const animators: SignageAnimator[] = [];

  /* --- Minimal LED neon outline sign ---------------------------------------- */
  const neonMat = glow(0x86e7ff, 1.7);
  const signCenterX = 0.4;
  const signY = 2.35;
  const signZ = 4.94;
  const halfW = 0.62;
  const halfH = 0.27;

  // Rounded-rectangle tube frame: two horizontals, two verticals, corner beads.
  group.add(cylinder(neonMat, 0.014, 0.014, halfW * 2, signCenterX, signY + halfH, signZ).rotateZ(Math.PI / 2));
  group.add(cylinder(neonMat, 0.014, 0.014, halfW * 2, signCenterX, signY - halfH, signZ).rotateZ(Math.PI / 2));
  for (const side of [-1, 1]) {
    group.add(
      cylinder(neonMat, 0.014, 0.014, halfH * 2, signCenterX + side * halfW, signY, signZ),
    );
    for (const ySide of [-1, 1]) {
      group.add(
        sphere(neonMat, 0.02, signCenterX + side * halfW, signY + ySide * halfH, signZ),
      );
    }
  }

  const scriptFace = makeSignFace({
    text: 'café',
    textColor: '#bff3ff',
    font: 'italic 600 150px "Futura", "Century Gothic", sans-serif',
    glowPx: 22,
    fallbackColor: 0x9fe8ff,
    emissiveIntensity: 1.5,
  });
  const scriptPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.34), scriptFace.material);
  scriptPlane.position.set(signCenterX, signY, signZ + 0.01);
  scriptPlane.rotation.y = Math.PI;
  group.add(scriptPlane);

  const neonLight = new THREE.PointLight(0x6cd9ff, 2.4, 4.2, 1.85);
  neonLight.position.set(signCenterX, signY, signZ - 0.4);
  group.add(neonLight);

  /* --- Smart bulbs running colour scenes ------------------------------------- */
  const smartSpots: Array<[number, number]> = [
    [-3.0, -1.8],
    [3.0, 1.4],
  ];
  let smartIndex = 0;
  for (const [sx, sz] of smartSpots) {
    const socket = cylinder(blackSteel(), 0.03, 0.026, 0.05, sx, 3.32, sz);
    group.add(socket);
    const envelope = sphere(glass(0xf6f2ea, 0.28), 0.062, sx, 3.24, sz);
    markNoCastShadow(envelope);
    group.add(envelope);
    const core = sphere(glow(0xffd9a6, 1.4), 0.03, sx, 3.24, sz);
    markGlowSurface(core);
    group.add(core);

    const sceneLight = new THREE.PointLight(0xffd9a6, 3.0, 5.5, 1.8);
    sceneLight.position.set(sx, 3.16, sz);
    group.add(sceneLight);

    // Slow warm↔cool scene cycle — the signature "smart home" tell.
    const baseIntensity = 3.0;
    const phase = smartIndex * Math.PI * 0.9;
    animators.push((t) => {
      const fadeFactor = (sceneLight.userData.fadeFactor as number | undefined) ?? 1;
      const blend = 0.5 + 0.42 * Math.sin(t * 0.21 + phase); // ~30 s round trip
      sceneLight.color.setHSL(0.08 + (0.57 - 0.08) * blend, 0.72 - 0.12 * blend, 0.6);
      (core.material as THREE.MeshStandardMaterial).emissive.copy(sceneLight.color);
      sceneLight.intensity = baseIntensity * fadeFactor * (0.92 + 0.08 * blend);
    });
    smartIndex += 1;
  }

  /* --- Pendant Edison bulbs over the tables ---------------------------------- */
  const edisonGlow = glow(0xffb87a, 1.5);
  const edisonXs = [-2.2, 0.2, 2.4];
  for (const ex of edisonXs) {
    const drop = 2.18;
    group.add(cylinder(blackSteel(), 0.005, 0.005, 3.6 - drop - 0.07, ex, (3.6 + drop + 0.07) / 2, -1.2));
    const bulb = makeEdisonBulb(edisonGlow, 0.048, true);
    bulb.position.set(ex, drop, -1.2);
    group.add(bulb);

    const light = new THREE.PointLight(0xffb87a, 2.4, 4.5, 1.9);
    light.position.set(ex, drop - 0.05, -1.2);
    group.add(light);
  }

  /* --- Subtle animated LED strip along the west shelf ------------------------- */
  const strip = makeLedStrip(2.8, 0xaef6dd, 1.35);
  strip.rotation.y = Math.PI / 2;
  strip.position.set(-5.9, 2.18, 0.2);
  group.add(strip);

  const stripLight = new THREE.PointLight(0x9fefdb, 1.8, 3.5, 1.85);
  stripLight.position.set(-5.72, 2.14, 0.2);
  group.add(stripLight);

  {
    const stripMaterial = strip.material as THREE.MeshStandardMaterial;
    const baseEmissive = stripMaterial.emissiveIntensity;
    const baseIntensity = 1.8;
    animators.push((t) => {
      const fadeFactor = (stripLight.userData.fadeFactor as number | undefined) ?? 1;
      const breathe = 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(t * 1.6));
      stripMaterial.emissiveIntensity = baseEmissive * breathe;
      stripLight.intensity = baseIntensity * fadeFactor * breathe;
    });
  }

  group.userData.eraTitle = 'LED neon & smart scenes';
  group.userData.fixtureLabels = [
    "Minimal LED neon 'café' outline sign",
    '2× smart bulbs cycling warm/cool scenes',
    '3× pendant Edison bulbs over tables',
    'Subtle animated mint LED shelf strip',
  ];
  group.userData.animators = animators;
  return group;
};
