import * as THREE from 'three';
import { BACK_BAR } from '../layout';
import { configuredCount, stampPresetMetadata } from '../eraMeta';
import type { EraVariantContext } from '../types';
import { box, cone, cylinder, orient, sphere } from '../kit/geometries';
import {
  blackSteel,
  brass,
  ceramic,
  enamel,
  fabric,
  glow,
  metal,
  paint,
  wood,
} from '../kit/materials';
import {
  makeBackBar,
  makeBacksplash,
  makeCanisterRow,
  makeCupStack,
  makeGasBurner,
} from '../kit/parts';

/**
 * 1945 — post-war austerity back bar.
 *
 * Stovetop moka pots on a gas ring fed by a visible pipe run, a big enamel
 * coffee urn with brass spigot, and a wooden-box hand grinder clamped to the
 * bench edge. Utilitarian palette: cream enamel, black iron, copper and
 * walnut, with thick cups stacked near the till end of the counter.
 */
export function buildEra1945Machines(context: EraVariantContext): THREE.Group {
  const group = new THREE.Group();
  group.name = 'machines-era-1945';
  group.position.set(BACK_BAR.centerX, BACK_BAR.topY, BACK_BAR.centerZ);

  const length = BACK_BAR.defaultLength;
  const depth = BACK_BAR.depth;

  // Palette (fresh material instances per variant — required by crossfade).
  const walnutTop = wood(0x5e4430);
  const sageBody = paint(0x8a9078);
  const iron = blackSteel();
  const creamEnamel = enamel(0xe9e2ce);
  const agedBrass = brass();
  const aluminium = metal(0xb9bcc0, 0.38, 0.75);
  const copperPot = metal(0xb5713c, 0.34, 0.85);

  group.add(makeBackBar({ length, depth, top: walnutTop, body: sageBody, kick: iron }));
  group.add(makeBacksplash({ length, depth, panel: creamEnamel, trim: agedBrass }));
  // Beadboard grooves down the splashback.
  const grooveHeight = BACK_BAR.backsplashHeight - 0.06;
  for (let i = 0; i < Math.floor(length / 0.12); i += 1) {
    const x = -length / 2 + 0.06 + i * 0.12;
    group.add(cylinder(agedBrass, 0.004, 0.004, grooveHeight, x, grooveHeight / 2, depth / 2 - 0.03));
  }

  /* --- Enamel coffee urn (far left) ------------------------------------- */
  const urnX = -2.45;
  group.add(cylinder(iron, 0.175, 0.185, 0.05, urnX, 0.025, 0, true));
  group.add(cylinder(creamEnamel, 0.15, 0.155, 0.4, urnX, 0.25, 0));
  group.add(cylinder(iron, 0.157, 0.157, 0.03, urnX, 0.13, 0, true));
  group.add(cylinder(iron, 0.157, 0.157, 0.03, urnX, 0.36, 0, true));
  group.add(sphere(creamEnamel, 0.152, urnX, 0.452, 0, 0.55)); // domed lid
  group.add(cylinder(agedBrass, 0.008, 0.008, 0.035, urnX, 0.53, 0));
  group.add(sphere(iron, 0.024, urnX, 0.56, 0)); // lid knob
  group.add(orient(cylinder(agedBrass, 0.012, 0.012, 0.06, urnX, 0.16, -0.16), Math.PI / 2, 0, 0));
  group.add(cylinder(agedBrass, 0.007, 0.007, 0.05, urnX, 0.125, -0.188)); // spigot drop
  group.add(cylinder(iron, 0.02, 0.02, 0.014, urnX + 0.17, 0.28, 0, true)); // side handle boss

  /* --- Gas ring with moka pots (centre-left) ----------------------------- */
  const ringCenterX = -1.2;
  group.add(box(iron, 0.95, 0.035, 0.44, ringCenterX, 0.018, -0.02));
  // Gas pipe dropping behind the bench toward the floor.
  group.add(cylinder(agedBrass, 0.016, 0.016, 0.42, ringCenterX + 0.42, 0.23, depth / 2 - 0.09));

  const burnerOffsets = [-0.26, 0.26];
  for (const offset of burnerOffsets) {
    const burner = makeGasBurner(iron, glow(0xff8c3b, 1.6), 0.078);
    burner.position.set(ringCenterX + offset, 0.035, -0.02);
    group.add(burner);
  }

  // Two stovetop moka pots — classic hourglass silhouettes.
  const mokaCount = configuredCount(context.spec, ['moka'], 2, 3);
  for (let i = 0; i < mokaCount; i += 1) {
    const pot = new THREE.Group();
    const bodyMaterial = i % 2 === 0 ? aluminium : copperPot;
    pot.add(cylinder(bodyMaterial, 0.048, 0.075, 0.11, 0, 0.055, 0));
    pot.add(cylinder(iron, 0.05, 0.05, 0.014, 0, 0.117, 0, true)); // threaded waist
    pot.add(cylinder(bodyMaterial, 0.068, 0.05, 0.1, 0, 0.174, 0));
    pot.add(cone(bodyMaterial, 0.066, 0.03, 0, 0.239, 0)); // lid cap
    pot.add(sphere(iron, 0.021, 0, 0.262, 0)); // bakelite knob
    const handleArm = box(iron, 0.018, 0.02, 0.085, 0, 0.16, -0.105);
    handleArm.rotation.x = -0.35;
    pot.add(handleArm);
    pot.position.set(ringCenterX + burnerOffsets[i % burnerOffsets.length], 0.088, -0.02);
    pot.rotation.y = i === 0 ? 0 : Math.PI * 0.9;
    group.add(pot);
  }

  /* --- Hand grinder clamped near centre-right ---------------------------- */
  const grinderWood = wood(0x6b4a2f);
  const grinderTrim = wood(0x7a5842);
  const grinder = new THREE.Group();
  grinder.add(box(grinderWood, 0.15, 0.13, 0.15, 0, 0.065, 0));
  grinder.add(box(grinderTrim, 0.128, 0.052, 0.01, 0, 0.04, -0.077)); // drawer face
  grinder.add(sphere(agedBrass, 0.011, 0, 0.04, -0.086)); // drawer knob
  grinder.add(cone(grinderTrim, 0.052, 0.06, 0, 0.158, 0)); // hopper mouth
  grinder.add(cylinder(iron, 0.03, 0.036, 0.018, 0, 0.196, 0, true)); // grind cap
  // Crank assembly pivoting above the box, plus the bench-edge clamp below.
  const crankAssembly = new THREE.Group();
  crankAssembly.add(cylinder(iron, 0.006, 0.006, 0.03, 0, 0.218, 0)); // axle
  crankAssembly.add(box(iron, 0.085, 0.012, 0.012, 0.042, 0.232, 0)); // bent arm
  crankAssembly.add(cylinder(iron, 0.006, 0.006, 0.03, 0.085, 0.217, 0)); // drop link
  crankAssembly.add(sphere(wood(0x8a6543), 0.017, 0.085, 0.2, 0)); // wooden knob
  grinder.add(crankAssembly);
  // Edge clamp under the bench lip.
  grinder.add(box(iron, 0.11, 0.014, 0.05, 0, -0.014, -0.06));
  grinder.add(cylinder(iron, 0.008, 0.008, 0.05, 0, -0.04, -0.085));
  grinder.position.set(0.1, 0, 0.06);

  /* --- Supporting accessories -------------------------------------------- */
  const cups = makeCupStack({
    cup: ceramic(0xf0ead8),
    rim: ceramic(0x707a5e),
    count: 5,
    saucers: 3,
    radius: 0.04,
    height: 0.075,
  });
  cups.position.set(0.95, 0, 0.02);
  group.add(cups);

  const canisters = makeCanisterRow({
    materials: [creamEnamel, enamel(0xded4ba), creamEnamel],
    lid: iron,
    heights: [0.17, 0.15, 0.135],
  });
  canisters.position.set(1.75, 0, -0.02);
  group.add(canisters);

  // Folded service cloth and a tin scoop.
  group.add(box(fabric(0x9aa189), 0.16, 0.022, 0.12, 2.35, 0.011, 0.05));
  const scoopHandle = cylinder(iron, 0.006, 0.006, 0.09, 2.62, 0.05, -0.08);
  scoopHandle.rotation.z = 0.9;
  group.add(scoopHandle);

  stampPresetMetadata(group, {
    year: 1945,
    title: 'Post-war austerity',
    applianceLabels: [
      'Enamel coffee urn with brass spigot',
      'Twin-burner gas ring',
      `${mokaCount}× stovetop moka pot`,
      'Walnut hand grinder (edge clamp)',
      'Thick ceramic cup stack & enamel canisters',
    ],
  });

  return group;
}
