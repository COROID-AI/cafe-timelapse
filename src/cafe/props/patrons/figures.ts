/**
 * Parametric low-poly seated figure builder.
 *
 * One stylised human, ~40 primitives, no facial features (anti-uncanny):
 * pelvis + torso + smooth head with era hair, jointed arms (shoulder → elbow
 * pivots for the idle loops) and simple seated legs. Authored facing local
 * +z; the caster positions/yaws it onto its chair.
 */

import * as THREE from 'three';
import { PatronKit, mulberry32 } from './kit';
import { HEAD_CENTER_Y, HEAD_RADIUS, buildHairstyle } from './hairstyles';
import {
  ITEM_UPRIGHT_X,
  applyStaticPose,
  type FigureJoints,
} from './animations';
import type { PatronEraYear, PatronFigureSpec } from './types';

/** Joint handles + anchor groups the caster and animator need. */
export interface FigureBuild {
  root: THREE.Group;
  kit: PatronKit;
  joints: FigureJoints;
  /** Right-wrist anchor: held items parent here (upright at rest). */
  handItemAnchor: THREE.Group;
  /** Chest-front anchor for both-hands holds (newspaper, e-reader). */
  holdFrontAnchor: THREE.Group;
  torsoPivot: THREE.Group;
  headPivot: THREE.Group;
}

export function buildPatronFigure(
  spec: PatronFigureSpec,
  eraYear: PatronEraYear,
  index: number,
  seatY: number,
): FigureBuild {
  const kit = new PatronKit();
  const rnd = mulberry32(eraYear * 7919 + index * 131 + 5);

  const skin = kit.std({ color: spec.skin, roughness: 0.62 });
  const topMat = kit.std({ color: spec.outfit.top, roughness: 0.8 });
  const bottomHex = spec.outfit.bottom ?? spec.outfit.top;
  const bottomMat = kit.std({ color: bottomHex, roughness: 0.82 });
  const shoeMat = kit.std({ color: spec.shoes ?? '#26221f', roughness: 0.6 });

  const root = new THREE.Group();
  root.name = 'patron-figure';
  root.userData = {
    eraYear,
    index,
    specId: spec.id,
    label: spec.label,
    hairstyle: spec.hairstyle,
    outfitLabel: spec.outfit.label,
    idleKind: spec.idle,
  };

  /* ----- pelvis & legs ---------------------------------------------------- */

  const hipY = seatY + 0.03;
  const pelvis = kit.box(bottomMat, 0.32, 0.16, 0.24, 0, hipY, 0);
  pelvis.name = 'pelvis';
  root.add(pelvis);

  const kneeZ = 0.44;
  const thighLen = 0.36;
  for (const sx of [-1, 1]) {
    // Thighs run forward (+z); dresses/jeans/suit trousers colour them.
    root.add(kit.box(bottomMat, 0.13, 0.12, thighLen, sx * 0.085, hipY - 0.02, 0.11 + thighLen / 2));
  }
  const shinTop = hipY - 0.09;
  const ankleY = 0.055;
  const shinLen = shinTop - ankleY;
  for (const sx of [-1, 1]) {
    root.add(
      kit.box(
        spec.outfit.bottom ? bottomMat : skin,
        0.105,
        shinLen,
        0.115,
        sx * 0.08,
        ankleY + shinLen / 2,
        kneeZ - 0.02,
      ),
    );
    const foot = kit.box(shoeMat, 0.095, 0.055, 0.2, sx * 0.08, 0.0275, kneeZ + 0.03);
    foot.name = 'shoe';
    root.add(foot);
  }

  /* ----- torso ------------------------------------------------------------ */

  const torsoPivot = new THREE.Group();
  torsoPivot.name = 'torso-pivot';
  torsoPivot.position.set(0, hipY + 0.06, 0);
  root.add(torsoPivot);

  const torso = kit.box(topMat, 0.36, 0.46, 0.24, 0, 0.23, 0);
  torso.name = 'torso';
  torsoPivot.add(torso);

  if (spec.shoulderPads) {
    for (const sx of [-1, 1]) {
      const pad = kit.box(topMat, 0.11, 0.06, 0.26, sx * 0.215, 0.41, 0);
      pad.name = 'shoulder-pad';
      torsoPivot.add(pad);
    }
  }
  if (spec.accentStripe && spec.outfit.accent) {
    const accentMat = kit.std({ color: spec.outfit.accent, roughness: 0.75 });
    const stripe = kit.box(accentMat, 0.365, 0.085, 0.245, 0, 0.3, 0);
    stripe.name = 'accent-stripe';
    torsoPivot.add(stripe);
  }

  torsoPivot.add(kit.cylinder(skin, 0.042, 0.042, 0.07, 0, 0.487, 0)); // neck

  /* ----- head ------------------------------------------------------------- */

  const headPivot = new THREE.Group();
  headPivot.name = 'head-pivot';
  headPivot.position.set(0, 0.545, 0);
  torsoPivot.add(headPivot);

  const head = kit.sphere(skin, HEAD_RADIUS, 0, HEAD_CENTER_Y, 0);
  head.name = 'patron-head';
  headPivot.add(head);

  headPivot.add(buildHairstyle(spec.hairstyle, { kit, color: spec.hairColor, rnd }));

  if (spec.facialHair === 'rafMustache') {
    const mustacheMat = kit.std({
      color: new THREE.Color(spec.hairColor).multiplyScalar(0.55),
      roughness: 0.9,
    });
    const mustache = kit.box(mustacheMat, 0.072, 0.022, 0.02, 0, HEAD_CENTER_Y - 0.05, HEAD_RADIUS * 0.88);
    mustache.name = 'mustache';
    headPivot.add(mustache);
  }

  /* ----- arms -------------------------------------------------------------- */

  const sleeveShort = spec.sleeves === 'short';
  const armPivots: Array<{ pivot: THREE.Group; elbow: THREE.Group }> = [];
  const handItemAnchor = new THREE.Group();
  handItemAnchor.name = 'hand-item-anchor';
  handItemAnchor.rotation.x = ITEM_UPRIGHT_X; // items upright at rest pose

  for (const side of ['r', 'l'] as const) {
    const s = side === 'r' ? 1 : -1;
    const armPivot = new THREE.Group();
    armPivot.name = `arm-${side}-pivot`;
    armPivot.position.set(s * 0.205, 0.4, 0.01);
    torsoPivot.add(armPivot);
    armPivot.add(kit.box(topMat, 0.072, 0.26, 0.082, 0, -0.13, 0)); // upper arm

    const elbowPivot = new THREE.Group();
    elbowPivot.name = `elbow-${side}-pivot`;
    elbowPivot.position.set(0, -0.26, 0);
    armPivot.add(elbowPivot);
    elbowPivot.add(kit.box(sleeveShort ? skin : topMat, 0.062, 0.24, 0.072, 0, -0.12, 0));
    const hand = kit.sphere(skin, 0.043, 0, -0.262, 0);
    hand.name = `hand-${side}`;
    elbowPivot.add(hand);

    if (side === 'r') {
      handItemAnchor.position.set(0, -0.278, 0);
      elbowPivot.add(handItemAnchor);
    }

    armPivots.push({ pivot: armPivot, elbow: elbowPivot });
  }

  /* ----- chest-front hold anchor ------------------------------------------- */

  const holdFrontAnchor = new THREE.Group();
  holdFrontAnchor.name = 'hold-front-anchor';
  holdFrontAnchor.position.set(0, 0.315, 0.19);
  holdFrontAnchor.rotation.x = -0.52; // lean back towards the reader's face
  torsoPivot.add(holdFrontAnchor);

  const joints: FigureJoints = {
    headPivot,
    armRPivot: armPivots[0].pivot,
    elbowRPivot: armPivots[0].elbow,
    armLPivot: armPivots[1].pivot,
    elbowLPivot: armPivots[1].elbow,
  };
  applyStaticPose(joints, 'rest');

  return { root, kit, joints, handItemAnchor, holdFrontAnchor, torsoPivot, headPivot };
}
