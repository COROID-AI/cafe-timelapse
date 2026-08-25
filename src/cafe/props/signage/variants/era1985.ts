import * as THREE from 'three';
import { box, cylinder } from '../../machines/kit/geometries';
import { blackSteel, paint } from '../../machines/kit/materials';
import { makeSignFace, makeTrackHead } from '../kit';
import type { EraVariantBuilder } from '../types';

/**
 * 1985 — mall-era pop signage & lighting.
 *
 * A hot-pink/cyan backlit plastic lightbox glows above the back bar, a black
 * track rail carries four aimed spot heads through magenta/teal/amber gels,
 * and two crisp white halogen spots punch down onto the counter.
 */
export const buildEra1985Signage: EraVariantBuilder = (): THREE.Group => {
  const group = new THREE.Group();
  group.name = 'signage-era-1985';

  /* --- Backlit plastic lightbox ------------------------------------------- */
  const boxCenterX = -1.2;
  const body = box(paint(0x26262c, 0.45), 2.1, 0.72, 0.16, boxCenterX, 2.42, 4.92);
  group.add(body);

  const face = makeSignFace({
    text: 'CAFÉ',
    textColor: '#ff4fd0',
    backgroundColor: '#12081c',
    borderColor: '#2fd6ff',
    borderWidth: 12,
    font: 'italic bold 170px "Arial Black", "Haettenschweiler", sans-serif',
    glowPx: 30,
    fallbackColor: 0xff4fd0,
    emissiveIntensity: 1.55,
  });
  const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.62), face.material);
  facePlane.position.set(boxCenterX, 2.42, 4.83);
  group.add(facePlane);

  const washLight = new THREE.PointLight(0xff4fa8, 4.2, 5.5, 1.8);
  washLight.position.set(boxCenterX, 2.3, 4.5);
  group.add(washLight);

  /* --- Track lighting with colourful gels ---------------------------------- */
  const railMat = blackSteel();
  const rail = cylinder(railMat, 0.028, 0.028, 4.6, 0, 3.53, -2.4);
  rail.rotation.z = Math.PI / 2;
  group.add(rail);

  interface GelSpec {
    x: number;
    color: number;
    intensity: number;
    angle: number;
    targetX: number;
    targetZ: number;
  }
  const gelSpecs: GelSpec[] = [
    { x: -1.7, color: 0xff59d6, intensity: 26, angle: 0.42, targetX: -1.9, targetZ: -0.7 },
    { x: -0.6, color: 0x2fd6c8, intensity: 24, angle: 0.42, targetX: -0.5, targetZ: -1.1 },
    { x: 0.6, color: 0xffb347, intensity: 24, angle: 0.42, targetX: 0.7, targetZ: -0.9 },
    { x: 1.7, color: 0xfff4e0, intensity: 46, angle: 0.34, targetX: 1.8, targetZ: -0.7 },
  ];

  for (const spec of gelSpecs) {
    // Stem drops from the rail; head aims at its table target via lookAt.
    group.add(cylinder(railMat, 0.014, 0.014, 0.09, spec.x, 3.48, -2.4));

    const head = makeTrackHead(blackSteel());
    head.position.set(spec.x, 3.41, -2.4);

    const target = new THREE.Object3D();
    target.position.set(spec.targetX, 0.9, spec.targetZ);
    group.add(target);
    head.lookAt(target.position); // local aim (group at origin)
    group.add(head);

    const spot = new THREE.SpotLight(spec.color, spec.intensity, 8.5, spec.angle, 0.45, 1.7);
    spot.position.set(spec.x, 3.38, -2.4);
    spot.target = target;
    group.add(spot);
  }

  /* --- Halogen counter spots ------------------------------------------------ */
  const halogenSpecs: Array<[number, number]> = [
    [-1.6, 1.35],
    [1.6, 1.35],
  ];
  for (const [hx, htz] of halogenSpecs) {
    const canBody = cylinder(paint(0x2b2b30, 0.5), 0.06, 0.075, 0.09, hx, 3.54, 0.35);
    group.add(canBody);

    const target = new THREE.Object3D();
    target.position.set(hx * 0.75, 0.95, htz + 0.15);
    group.add(target);

    const halogen = new THREE.SpotLight(0xfff1dc, 60, 7, 0.3, 0.32, 1.6);
    halogen.position.set(hx, 3.48, 0.35);
    halogen.target = target;
    group.add(halogen);
  }

  group.userData.eraTitle = 'Backlit plastic & track gels';
  group.userData.fixtureLabels = [
    "Backlit plastic 'CAFÉ' lightbox",
    '4× track spots (magenta/teal/amber/white gels)',
    '2× halogen counter spots',
  ];
  return group;
};
