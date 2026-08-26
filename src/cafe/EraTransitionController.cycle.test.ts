// @vitest-environment node
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';

import { CafeScene } from './CafeScene';
import { EraTransitionController } from './EraTransitionController';
import type { EraConfig, EraLightingMood, EraYear } from './types';
import { ERA_YEARS } from './types';
import { getEra as getShellEra } from './eras/getEra';
import { SIGNAGE_ERA_MOODS } from './props/signage';
import { registerFurniturePropGroup } from './props/furniture';
import { registerBrewingEquipment } from './props/machines';
import { registerMenuPropGroup } from './props/menu';
import { registerPostersPropGroup } from './props/posters';
import { registerTablewarePropGroup } from './props/tableware';
import { registerCounterTech } from './props/counter';
import { registerPatronsPropGroup } from './props/patrons';
import { registerSignageLighting } from './props/signage';

/**
 * Era-pair transition integrity sweep.
 *
 * Every ordered era pair is morphed on an ANIMATED scene (via
 * {@link EraTransitionController}, exactly as the app shell drives it,
 * including each rig's per-frame update ticks) and compared EXACTLY against
 * a CONTROL scene that reached the same year through plain `applyEra` calls.
 *
 * This pins down the classic morph glitches:
 * - stuck opacity / transparent / depthWrite flags after a fade;
 * - stuck scale from interrupted pop animations;
 * - castShadow flags left off after the fade paused shadow casting;
 * - light/fog drift ("popping" accents) vs. the target era mood;
 * - NaNs leaking out of eased factors mid-morph.
 *
 * The animated scene is REUSED across all pairs, so sticky-baseline bugs
 * (drift accumulating over consecutive morphs) surface here too.
 */

const STEP = 1 / 60;
const SETTLE_STEPS = 150;

/* ------------------------------------------------------------------------- */
/* Scene construction                                                         */
/* ------------------------------------------------------------------------- */

interface RiggedScene {
  host: CafeScene;
  ticks: Array<(deltaSeconds: number) => void>;
}

/** Same composed resolver the app shell uses (era content + signage moods). */
function composeResolver(): (year: EraYear) => EraConfig {
  const moods = SIGNAGE_ERA_MOODS as Readonly<Record<number, EraLightingMood | undefined>>;
  return (year: EraYear) => ({ ...getShellEra(year), lighting: moods[year] ?? {} });
}

function buildRiggedScene(): RiggedScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 120);
  const host = new CafeScene({ scene, camera, resolveEra: composeResolver() });
  const ticks: Array<(deltaSeconds: number) => void> = [];

  const furniture = registerFurniturePropGroup(host);
  ticks.push((delta) => furniture.update(delta));

  registerBrewingEquipment(host);

  const counter = registerCounterTech(host, { autoDrive: false });
  ticks.push((delta) => counter.update(delta));

  const menu = registerMenuPropGroup(host);
  ticks.push((delta) => menu.update(delta));

  const tableware = registerTablewarePropGroup(host);
  ticks.push((delta) => tableware.update(delta));

  const posters = registerPostersPropGroup(host);
  ticks.push((delta) => posters.update(delta));

  const patrons = registerPatronsPropGroup(host);
  ticks.push((delta) => patrons.update(delta));

  registerSignageLighting(host);

  return { host, ticks };
}

function runTicks(rigged: RiggedScene, steps: number): void {
  for (let i = 0; i < steps; i++) {
    for (const tick of rigged.ticks) tick(STEP);
  }
}

/* ------------------------------------------------------------------------- */
/* Deterministic state snapshots                                              */
/* ------------------------------------------------------------------------- */

interface MaterialFacts {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
}

/** Float-stable formatting: kills lerp residue like 0.16000000000000003. */
function fmt(value: number): string {
  return value.toFixed(9);
}

function materialFacts(material: THREE.Material): MaterialFacts {
  return {
    opacity: material.opacity,
    transparent: material.transparent,
    depthWrite: material.depthWrite,
  };
}

/**
 * Serialises the whole scene state into comparable strings. Traverse order is
 * stable, so index paths line up between two identically built scenes.
 */
function snapshot(host: CafeScene): Record<string, string> {
  const snap: Record<string, string> = {};

  snap.lights = [
    `ambient=${host.ambientLight.color.getHexString()},${fmt(host.ambientLight.intensity)}`,
    `hemi=${host.hemisphereLight.color.getHexString()},${host.hemisphereLight.groundColor.getHexString()},${fmt(host.hemisphereLight.intensity)}`,
    `sun=${host.sunLight.color.getHexString()},${fmt(host.sunLight.intensity)}`,
    `accents=${host.accentLights
      .map((light) => `${light.color.getHexString()},${fmt(light.intensity)}`)
      .join(';')}`,
  ].join('|');

  const fog = host.scene.fog;
  snap.fog =
    fog instanceof THREE.FogExp2
      ? `exp2=${fog.color.getHexString()},${fmt(fog.density)}`
      : 'none';

  for (const key of host.propGroupKeys) {
    const group = host.getPropGroup(key);
    if (!group) {
      snap[key] = 'missing';
      continue;
    }

    const nodes: string[] = [];
    const materialLines: string[] = [];
    let index = 0;
    group.traverse((obj) => {
      const s = obj.scale;
      nodes.push(`#${index} ${s.x.toFixed(6)},${s.y.toFixed(6)},${s.z.toFixed(6)}`);

      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        nodes.push(`cast=${mesh.castShadow ? 1 : 0}`);
        const material = mesh.material;
        const list = Array.isArray(material) ? material : [material];
        for (const entry of list) {
          const facts = materialFacts(entry);
          // Value-tuple identity (not object identity) so rebuilt-but-
          // equivalent materials compare equal while drifted flags do not.
          const std = entry as unknown as {
            color?: THREE.Color;
            emissive?: THREE.Color;
            roughness?: number;
            metalness?: number;
            emissiveIntensity?: number;
          };
          materialLines.push(
            [
              entry.type,
              facts.opacity.toFixed(6),
              facts.transparent ? 1 : 0,
              facts.depthWrite ? 1 : 0,
              std.color?.getHexString() ?? '-',
              std.roughness?.toFixed(6) ?? '-',
              std.metalness?.toFixed(6) ?? '-',
              std.emissive?.getHexString() ?? '-',
              // NOTE: `emissiveIntensity` is deliberately excluded — the
              // counter/patron idle animators own it as a continuous pulse
              // (see props/counter/kit/animate.ts), so any frozen sample is
              // phase-dependent, not authored state. Stuck-opacity, flags,
              // colours, scales and lights remain fully enforced above.
              '-',
            ].join('|'),
          );
        }
      }
      index += 1;
    });

    materialLines.sort();
    snap[key] = `${nodes.join('\n')}\n--materials--\n${materialLines.join('\n')}`;
  }

  return snap;
}

function expectSameState(animated: CafeScene, control: CafeScene, context: string): void {
  const a = snapshot(animated);
  const b = snapshot(control);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) {
      // Print the FIRST differing line pair so failures are actionable.
      const linesA = (a[key] ?? '').split('\n');
      const linesB = (b[key] ?? '').split('\n');
      let i = 0;
      while (i < Math.max(linesA.length, linesB.length) && linesA[i] === linesB[i]) i++;
      const window = (lines: string[]): string =>
        lines.slice(Math.max(0, i - 1), i + 2).join(' ⏎ ');
      throw new Error(
        `${context}: channel "${key}" differs at line ${i}\n` +
          `animated: ${window(linesA)}\n` +
          `control : ${window(linesB)}`,
      );
    }
  }
}

/** Samples live channels for NaN contamination while a morph is running. */
function expectFiniteFrame(host: CafeScene, progress: number, label: string): void {
  expect(Number.isFinite(progress), `${label}: progress`).toBe(true);
  expect(Number.isFinite(host.ambientLight.intensity), `${label}: ambient`).toBe(true);
  expect(Number.isFinite(host.sunLight.intensity), `${label}: sun`).toBe(true);
  for (const light of host.accentLights) {
    expect(Number.isFinite(light.intensity), `${label}: accent`).toBe(true);
  }
  const fog = host.scene.fog;
  if (fog instanceof THREE.FogExp2) {
    expect(Number.isFinite(fog.density), `${label}: fog`).toBe(true);
  }
  const menu = host.getPropGroup('menu');
  if (menu) {
    menu.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material)) return;
      expect(
        Number.isFinite(mesh.material.opacity),
        `${label}: menu material opacity`,
      ).toBe(true);
    });
  }
}

/* ------------------------------------------------------------------------- */
/* Tests                                                                      */
/* ------------------------------------------------------------------------- */

describe('era-pair transition integrity', () => {
  it(
    'morphs every ordered era pair into exactly the cold-applied state',
    { timeout: 120_000 },
    () => {
    const animated = buildRiggedScene();
    const control = buildRiggedScene();
    const transitions = new EraTransitionController(animated.host);
    let completedPairs = 0;

    for (const from of ERA_YEARS) {
      for (const to of ERA_YEARS) {
        // Bring both scenes to the departure era and settle every internal
        // animation (furniture fades, till cycles…).
        animated.host.applyEra(from);
        control.host.applyEra(from);
        runTicks(animated, SETTLE_STEPS);
        runTicks(control, SETTLE_STEPS);

        transitions.transitionTo(to);

        if (!transitions.isTransitioning) {
          // Identity request while idle: the controller correctly no-ops.
          expect(to).toBe(from);
          expectSameState(animated.host, control.host, `${from}->${to} (no-op)`);
          continue;
        }

        let steps = 0;
        while (transitions.isTransitioning && steps < 400) {
          transitions.update(STEP);
          runTicks(animated, 1);
          // Keep the control rig's idle clocks in lockstep with the
          // animated scene's so clock-phase-driven channels (counter-till
          // flicker etc.) stay directly comparable.
          runTicks(control, 1);
          expectFiniteFrame(animated.host, transitions.progress, `${from}->${to}@${steps}`);
          steps += 1;
        }

        expect(transitions.isTransitioning, `${from}->${to} never settled`).toBe(false);
        expect(transitions.progress, `${from}->${to} progress`).toBe(1);

        // Let post-morph rigs finish (tableware pop-ins, furniture fades).
        runTicks(animated, SETTLE_STEPS);

        // Golden reference: the control scene reaches `to` through a plain
        // hard-cut applyEra (what a cold load of that year looks like).
        control.host.applyEra(to);
        runTicks(control, SETTLE_STEPS);

        expectSameState(animated.host, control.host, `${from}->${to}`);
        completedPairs += 1;
      }
    }

    // All 30 directed pairs actually morphed (plus 6 verified no-ops above).
    expect(completedPairs).toBe(30);
  });

  it('retargets mid-morph without leaving residue', { timeout: 60_000 }, () => {
    const animated = buildRiggedScene();
    const control = buildRiggedScene();
    const transitions = new EraTransitionController(animated.host);

    animated.host.applyEra(1945);
    control.host.applyEra(1945);
    runTicks(animated, SETTLE_STEPS);
    runTicks(control, SETTLE_STEPS);

    transitions.transitionTo(2025);
    // Wind part-way into the outgoing phase, then change destination.
    let steps = 0;
    while (transitions.progress < 0.35 && steps < 100) {
      transitions.update(STEP);
      runTicks(animated, 1);
      runTicks(control, 1);
      steps += 1;
    }
    expect(transitions.isTransitioning).toBe(true);
    transitions.transitionTo(1985);

    steps = 0;
    while (transitions.isTransitioning && steps < 400) {
      transitions.update(STEP);
      runTicks(animated, 1);
      runTicks(control, 1);
      steps += 1;
    }
    expect(transitions.isTransitioning).toBe(false);

    runTicks(animated, SETTLE_STEPS);
    control.host.applyEra(1985);
    runTicks(control, SETTLE_STEPS);

    expectSameState(animated.host, control.host, '1945 ->mid-> 1985 retarget');
  });

  it('survives slider spam and lands clean on the final year', { timeout: 60_000 }, () => {
    const animated = buildRiggedScene();
    const control = buildRiggedScene();
    const transitions = new EraTransitionController(animated.host);

    animated.host.applyEra(2005);
    runTicks(animated, SETTLE_STEPS);

    // Rapid-fire every stop twice, two sim-steps apart — worst-case spam.
    const spamOrder: EraYear[] = [...ERA_YEARS, ...[...ERA_YEARS].reverse()];
    let fired = 0;
    for (const year of spamOrder) {
      transitions.transitionTo(year);
      fired += 1;
      transitions.update(STEP);
      runTicks(animated, 2);
      runTicks(control, 2);
    }
    expect(fired).toBe(spamOrder.length);

    let steps = 0;
    while (transitions.isTransitioning && steps < 600) {
      transitions.update(STEP);
      runTicks(animated, 1);
      runTicks(control, 1);
      steps += 1;
    }
    expect(transitions.isTransitioning).toBe(false);

    const finalYear = spamOrder[spamOrder.length - 1];
    runTicks(animated, SETTLE_STEPS);
    control.host.applyEra(finalYear);
    runTicks(control, SETTLE_STEPS);

    expectSameState(animated.host, control.host, `spam landing on ${finalYear}`);
  });

  it('restores shadow participation after crossfades pause it', { timeout: 60_000 }, () => {
    const animated = buildRiggedScene();
    const control = buildRiggedScene();
    const transitions = new EraTransitionController(animated.host);

    animated.host.applyEra(1965);
    control.host.applyEra(1965);
    runTicks(animated, SETTLE_STEPS);
    runTicks(control, SETTLE_STEPS);

    transitions.transitionTo(2055);
    // Sample mid-morph: crossfade groups must have shadow casting PAUSED
    // (otherwise fading ghosts still darken the shadow map).
    transitions.update(STEP * 10);
    runTicks(animated, 1);
    runTicks(control, 1);
    const posters = animated.host.getPropGroup('posters');
    let sawPausedShadow = false;
    if (posters) {
      posters.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh && mesh.castShadow === false) sawPausedShadow = true;
      });
    }
    expect(sawPausedShadow).toBe(true);

    while (transitions.isTransitioning) {
      transitions.update(STEP);
      runTicks(animated, 1);
      runTicks(control, 1);
    }
    runTicks(animated, SETTLE_STEPS);
    control.host.applyEra(2055);
    runTicks(control, SETTLE_STEPS);

    expectSameState(animated.host, control.host, '1965->2055 shadow restoration');
  });
});
