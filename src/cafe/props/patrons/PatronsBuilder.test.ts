import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CafeScene } from '../../CafeScene';
import { getEra } from '../../eras/getEra';
import type { EraConfig } from '../../types';
import { PATRON_ERA_YEARS } from './types';
import type { PatronEraYear, PatronIdleKind } from './types';
import { PatronsBuilder } from './PatronsBuilder';
import { registerPatronsPropGroup, PATRONS_PROP_GROUP_KEY } from './index';

/* ----- helpers ------------------------------------------------------------ */

function makeScene(resolveEra?: (year: Parameters<typeof getEra>[0]) => EraConfig): CafeScene {
  return new CafeScene({ scene: new THREE.Scene(), resolveEra });
}

function eraCast(scene: CafeScene, year: PatronEraYear): THREE.Group {
  const group = scene.getPropGroup(PATRONS_PROP_GROUP_KEY);
  if (!group) throw new Error('patrons prop group missing');
  const cast = group.getObjectByName(`patrons-era-${year}`);
  if (!(cast instanceof THREE.Group)) throw new Error(`era cast ${year} missing`);
  return cast;
}

function collectNames(root: THREE.Object3D): Set<string> {
  const names = new Set<string>();
  root.traverse((obj) => {
    if (obj.name) names.add(obj.name);
  });
  return names;
}

function settle(builder: PatronsBuilder, seconds = 3): void {
  const step = 0.05;
  for (let t = 0; t < seconds; t += step) builder.update(step);
}

function visibleCasts(scene: CafeScene): PatronEraYear[] {
  return PATRON_ERA_YEARS.filter((year) => eraCast(scene, year).visible);
}

function slotRoots(cast: THREE.Group): THREE.Group[] {
  return cast.children.filter(
    (child): child is THREE.Group =>
      child instanceof THREE.Group && child.name.startsWith('patron-slot-'),
  );
}

/** First torso material of a cast — representative fade witness. */
function castMaterial(cast: THREE.Group): THREE.MeshStandardMaterial {
  const torso = cast.getObjectByName('torso');
  if (!(torso instanceof THREE.Mesh)) throw new Error('torso mesh missing');
  const material = torso.material as THREE.MeshStandardMaterial;
  if (!(material instanceof THREE.MeshStandardMaterial)) throw new Error('material missing');
  return material;
}

/** Finds a figure's head pivot whose spec runs the requested idle kind. */
function headPivotRunning(cast: THREE.Group, kind: PatronIdleKind): THREE.Group {
  for (const slot of slotRoots(cast)) {
    const figure = slot.getObjectByName('patron-figure');
    if (!figure) continue;
    if ((figure.userData as { idleKind?: string }).idleKind !== kind) continue;
    const head = figure.getObjectByName('head-pivot');
    if (head instanceof THREE.Group) return head;
  }
  throw new Error(`no ${kind} figure found`);
}

/**
 * Simulates `EraTransitionController.engageFade` on the registered group:
 * during a morph the controller flips `castShadow` off on every mesh and
 * forces `depthWrite = false` on every material until the morph finishes.
 */
function engageExternalFade(scene: CafeScene): void {
  const group = scene.getPropGroup(PATRONS_PROP_GROUP_KEY);
  if (!group) throw new Error('patrons group missing');
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) mesh.castShadow = false;
    const material = mesh.material as THREE.Material | undefined;
    if (material && material.isMaterial) {
      material.transparent = true;
      material.depthWrite = false;
    }
  });
}

/** The matching restore pass (`restoreGroupVisuals`). */
function restoreExternalFade(scene: CafeScene): void {
  const group = scene.getPropGroup(PATRONS_PROP_GROUP_KEY);
  if (!group) throw new Error('patrons group missing');
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) mesh.castShadow = true;
    const material = mesh.material as THREE.Material | undefined;
    if (material && material.isMaterial) material.depthWrite = true;
  });
}

/* ----- tests --------------------------------------------------------------- */

describe('patrons prop group', () => {
  it('registers under the "patrons" key with five prebuilt era casts', () => {
    const scene = makeScene();
    const builder = registerPatronsPropGroup(scene);

    expect(scene.hasPropGroup(PATRONS_PROP_GROUP_KEY)).toBe(true);
    expect(scene.getPropGroup(PATRONS_PROP_GROUP_KEY)?.name).toBe(
      `prop-group:${PATRONS_PROP_GROUP_KEY}`,
    );

    const root = builder.getGroup();
    for (const year of PATRON_ERA_YEARS) {
      const cast = eraCast(scene, year);
      expect(cast.children.length).toBeGreaterThan(0);
      expect(root.getObjectByName(`patrons-era-${year}`)).toBe(cast);
    }
  });

  it('stages 4–6 seated figures per era', () => {
    const scene = makeScene();
    registerPatronsPropGroup(scene);

    for (const year of PATRON_ERA_YEARS) {
      const slots = slotRoots(eraCast(scene, year));
      expect(slots.length, `${year} figure count`).toBeGreaterThanOrEqual(4);
      expect(slots.length, `${year} figure count`).toBeLessThanOrEqual(6);
      for (const slot of slots) {
        expect(slot.getObjectByName('patron-figure')).toBeInstanceOf(THREE.Group);
        expect(slot.getObjectByName('head-pivot')).toBeInstanceOf(THREE.Group);
        expect(slot.getObjectByName('torso-pivot')).toBeInstanceOf(THREE.Group);
      }
    }
    // The brief's counter-stool boombox patron gives 1985 the max staging.
    expect(slotRoots(eraCast(scene, 1985))).toHaveLength(6);
  });

  it('renders era-correct hairstyles and gadgets, exclusive per era', () => {
    const scene = makeScene();
    registerPatronsPropGroup(scene);

    // Marks that MUST appear in their era. Newspapers span several decades,
    // so they are required-in-era without being exclusive.
    const requiredMarks: Record<PatronEraYear, string[]> = {
      1945: ['hair-victoryRolls', 'mustache', 'gadget-newspaper', 'gadget-pipe'],
      1965: ['hair-modBowl', 'hair-modCrop', 'gadget-transistorRadio', 'gadget-newspaper'],
      1985: [
        'hair-bigPerm',
        'shoulder-pad',
        'accent-stripe',
        'gadget-walkman',
        'headphones-orange',
        'gadget-boombox',
        'boombox-speaker-l',
        'counter-stool',
        'gadget-newspaper',
      ],
      2005: [
        'hair-frostedTips',
        'hair-emoFringe',
        'gadget-flipPhone',
        'earbud-cord',
        'gadget-laptop',
      ],
      2025: [
        'hair-topBun',
        'hair-naturalCurls',
        'gadget-smartphone',
        'wireless-earbuds',
        'tablet-slab',
        'gadget-eReader',
      ],
    };

    // Marks that must appear ONLY in their own era (instant datestamps).
    const exclusiveMarks: Record<PatronEraYear, string[]> = {
      1945: ['hair-victoryRolls', 'mustache', 'gadget-pipe'],
      1965: ['hair-modBowl', 'hair-modCrop', 'gadget-transistorRadio'],
      1985: [
        'hair-bigPerm',
        'shoulder-pad',
        'accent-stripe',
        'gadget-walkman',
        'headphones-orange',
        'gadget-boombox',
        'counter-stool',
      ],
      2005: [
        'hair-frostedTips',
        'hair-emoFringe',
        'gadget-flipPhone',
        'earbud-cord',
        'gadget-laptop',
      ],
      2025: [
        'hair-topBun',
        'hair-naturalCurls',
        'gadget-smartphone',
        'wireless-earbuds',
        'tablet-slab',
        'gadget-eReader',
      ],
    };

    for (const year of PATRON_ERA_YEARS) {
      const names = collectNames(eraCast(scene, year));
      for (const mark of requiredMarks[year]) {
        expect(names.has(mark), `${mark} missing from ${year}`).toBe(true);
      }
      for (const [otherYear, marks] of Object.entries(exclusiveMarks)) {
        if (Number(otherYear) === year) continue;
        for (const mark of marks) {
          expect(names.has(mark), `${mark} leaked into ${year}`).toBe(false);
        }
      }
    }
  });

  it('snaps on first application and crossfades cleanly between any pair', () => {
    const scene = makeScene();
    const builder = registerPatronsPropGroup(scene);
    builder.setTransitionSeconds(0.5);

    scene.applyEra(1945); // cold start: snap
    expect(builder.isTransitioning()).toBe(false);
    expect(visibleCasts(scene)).toEqual([1945]);

    scene.applyEra(1985);
    expect(builder.isTransitioning()).toBe(true);
    const mat45 = castMaterial(eraCast(scene, 1945));
    const mat85 = castMaterial(eraCast(scene, 1985));

    builder.update(0.25); // half-way through the 0.5 s blend
    expect(mat45.opacity).toBeGreaterThan(0.4);
    expect(mat45.opacity).toBeLessThan(0.7);
    expect(mat85.opacity).toBeGreaterThan(0.4);

    settle(builder);
    expect(builder.isTransitioning()).toBe(false);
    expect(visibleCasts(scene)).toEqual([1985]);
    expect(Math.abs(mat85.opacity - 1)).toBeLessThan(1e-6);

    // Non-adjacent jump interrupted mid-flight still lands on one cast.
    scene.applyEra(2005);
    builder.update(0.1);
    scene.applyEra(1965);
    settle(builder);
    expect(visibleCasts(scene)).toEqual([1965]);
  });

  it('maps undressed timeline years (2055) onto the nearest era', () => {
    const scene = makeScene();
    const builder = registerPatronsPropGroup(scene);
    scene.applyEra(2055);
    settle(builder);
    expect(visibleCasts(scene)).toEqual([2025]);
  });

  it('is driven by the era config slice: headcountHint clamps staged patrons', () => {
    const scene = makeScene((year) => ({
      ...getEra(year),
      patrons: { headcountHint: 4 },
    }));
    const builder = registerPatronsPropGroup(scene);

    scene.applyEra(1985); // six-slot cast clamped down to four
    settle(builder);
    const slots = slotRoots(eraCast(scene, 1985));
    expect(slots.filter((slot) => slot.visible)).toHaveLength(4);

    // Without a payload hint the full cast shows.
    const plainScene = makeScene();
    const plainBuilder = registerPatronsPropGroup(plainScene);
    plainScene.applyEra(1985);
    settle(plainBuilder);
    expect(slotRoots(eraCast(plainScene, 1985)).every((slot) => slot.visible)).toBe(
      true,
    );
    expect(eraCast(plainScene, 1985).userData.payloadApplied).toBe(false);
  });

  it('runs subtle idle loops while idle', () => {
    const scene = makeScene();
    const builder = registerPatronsPropGroup(scene);
    scene.applyEra(1945);
    settle(builder);

    const head = headPivotRunning(eraCast(scene, 1945), 'headTurn');
    const before = head.rotation.y;

    builder.update(0.1);
    builder.update(0.4);
    const after = head.rotation.y;

    expect(Number.isFinite(after)).toBe(true);
    expect(after).not.toBeCloseTo(before, 6);
    expect(builder.isIdleAnimationActive()).toBe(true);
  });

  it('freezes idles when manually paused and resumes afterwards', () => {
    const scene = makeScene();
    const builder = registerPatronsPropGroup(scene);
    scene.applyEra(1945);
    settle(builder);

    const head = headPivotRunning(eraCast(scene, 1945), 'headTurn');

    builder.setIdlePaused(true);
    expect(builder.isIdleAnimationActive()).toBe(false);
    const frozen = head.rotation.y;
    for (let i = 0; i < 20; i++) builder.update(0.1);
    expect(head.rotation.y).toBe(frozen);

    builder.setIdlePaused(false);
    builder.update(0.25);
    expect(head.rotation.y).not.toBe(frozen);
  });

  it('pauses idles while an EraTransitionController-style morph owns the group', () => {
    const scene = makeScene();
    const builder = registerPatronsPropGroup(scene);
    builder.setTransitionSeconds(0.5);
    scene.applyEra(1945);
    settle(builder);

    const head = headPivotRunning(eraCast(scene, 1945), 'headTurn');
    const frozen = head.rotation.y;

    // engageFade flips castShadow/depthWrite across the whole group…
    engageExternalFade(scene);
    expect(builder.isIdleAnimationActive()).toBe(false);
    for (let i = 0; i < 20; i++) builder.update(0.1);
    expect(head.rotation.y).toBe(frozen);

    // …restoreGroupVisuals puts everything back and idles resume.
    restoreExternalFade(scene);
    expect(builder.isIdleAnimationActive()).toBe(true);
    builder.update(0.25);
    expect(head.rotation.y).not.toBe(frozen);
  });

  it('also pauses idles while the internal era crossfade blends', () => {
    const scene = makeScene();
    const builder = registerPatronsPropGroup(scene);
    builder.setTransitionSeconds(0.5);
    scene.applyEra(1945);
    settle(builder);

    const head = headPivotRunning(eraCast(scene, 1945), 'headTurn');
    const frozen = head.rotation.y;

    scene.applyEra(1965);
    expect(builder.isIdleAnimationActive()).toBe(false);
    builder.update(0.2);
    expect(head.rotation.y).toBe(frozen); // holds still mid-blend

    settle(builder);
    expect(builder.isIdleAnimationActive()).toBe(true);
    builder.update(0.25);
    expect(head.rotation.y).not.toBe(frozen);
  });

  it('keeps every pose above floor level across a long idle sweep', () => {
    const scene = makeScene();
    const builder = registerPatronsPropGroup(scene);
    scene.applyEra(2025);
    settle(builder);

    for (let i = 0; i < 240; i++) builder.update(1 / 30); // 8 s ≈ one glance cycle
    const box = new THREE.Box3().setFromObject(eraCast(scene, 2025));
    expect(box.min.y).toBeGreaterThanOrEqual(-0.02);
    expect(box.max.y).toBeLessThan(2.2); // stylised seated height sanity cap
  });

  it('dispose removes the group and releases resources without throwing', () => {
    const scene = makeScene();
    const builder = registerPatronsPropGroup(scene);
    scene.applyEra(1965);
    settle(builder);

    const root = builder.getGroup();
    const parent = root.parent;
    builder.dispose();

    expect(parent?.children.includes(root)).toBe(false);
    expect(() => builder.dispose()).not.toThrow(); // idempotent
    expect(() => builder.update(0.016)).not.toThrow(); // dead loop stays dead
  });
});

/* ------------------------------------------------------------------------ */
