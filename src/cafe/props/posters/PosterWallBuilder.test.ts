import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { CafeScene } from '../../CafeScene';
import { getEra } from '../../eras/getEra';
import type { EraConfig } from '../../types';
import { POSTER_ERA_CONTENT } from './eraContent';
import { PosterWallBuilder } from './PosterWallBuilder';
import { registerPostersPropGroup, POSTERS_PROP_GROUP_KEY } from './index';
import { POSTER_ERA_YEARS } from './types';
import type { PosterEraYear } from './types';

/* ----- helpers ------------------------------------------------------------ */

function makeScene(resolveEra?: (year: Parameters<typeof getEra>[0]) => EraConfig): CafeScene {
  return new CafeScene({ scene: new THREE.Scene(), resolveEra });
}

function eraSet(scene: CafeScene, year: PosterEraYear): THREE.Group {
  const group = scene.getPropGroup('posters');
  if (!group) throw new Error('posters prop group missing');
  const set = group.getObjectByName(`posters-era-${year}`);
  if (!(set instanceof THREE.Group)) throw new Error(`era set ${year} missing`);
  return set;
}

function faceOf(set: THREE.Group, posterId: string): THREE.Mesh {
  const face = set.getObjectByName(`${posterId}-face`);
  if (!(face instanceof THREE.Mesh)) throw new Error(`face ${posterId} missing`);
  return face;
}

function posterIds(set: THREE.Group): Set<string> {
  const ids = new Set<string>();
  set.traverse((obj) => {
    const id = obj.userData.posterId;
    if (typeof id === 'string') ids.add(id);
  });
  return ids;
}

function settle(builder: PosterWallBuilder, seconds = 2): void {
  const step = 0.05;
  for (let t = 0; t < seconds; t += step) builder.update(step);
}

function visibleYears(scene: CafeScene): PosterEraYear[] {
  return POSTER_ERA_YEARS.filter((year) => eraSet(scene, year).visible);
}

/* ----- catalogue sanity (era-thematic wall art) ---------------------------- */

describe('poster era catalogues', () => {
  it('gives every era a full, pairwise-disjoint set of invented wall art', () => {
    const titlesByYear = new Map<PosterEraYear, Set<string>>();
    for (const year of POSTER_ERA_YEARS) {
      const content = POSTER_ERA_CONTENT[year];
      expect(content.papers.length).toBeGreaterThanOrEqual(4);
      const titles = new Set(content.papers.map((paper) => paper.title));
      expect(titles.size).toBe(content.papers.length); // unique within the era
      titlesByYear.set(year, titles);
    }
    for (let i = 0; i < POSTER_ERA_YEARS.length; i++) {
      for (let j = i + 1; j < POSTER_ERA_YEARS.length; j++) {
        for (const title of titlesByYear.get(POSTER_ERA_YEARS[i])!) {
          expect(
            titlesByYear.get(POSTER_ERA_YEARS[j])!.has(title),
            `"${title}" shared between eras`,
          ).toBe(false);
        }
      }
    }
  });

  it('is thematically correct: wartime notices → pop art → neon → glossy film → minimal', () => {
    const stylesOf = (year: PosterEraYear) =>
      new Set(POSTER_ERA_CONTENT[year].papers.map((paper) => paper.style));

    // 1945: wartime propaganda / rationing notices on faded paper palettes.
    const styles45 = stylesOf(1945);
    expect(styles45.has('propagandaNotice')).toBe(true);
    expect(styles45.has('rationingNotice')).toBe(true);
    expect([...styles45].every((style) => style === 'propagandaNotice' || style === 'rationingNotice')).toBe(true);

    // 1965: bright pop-art concert/movie + travel.
    const styles65 = stylesOf(1965);
    expect(styles65.has('popArtConcert')).toBe(true);
    expect(styles65.has('bMoviePoster')).toBe(true);
    expect(styles65.has('travelPoster')).toBe(true);

    // 1985: neon band posters, arcade/film ads, polaroid photos.
    const styles85 = stylesOf(1985);
    expect(styles85.has('neonBandPoster')).toBe(true);
    expect(styles85.has('arcadeAd')).toBe(true);
    expect(styles85.has('filmAd')).toBe(true);
    expect(styles85.has('polaroidPhoto')).toBe(true);

    // 2005: glossy one-sheets + wifi sticker + loyalty card by the till.
    const styles05 = stylesOf(2005);
    expect(styles05.has('glossyOneSheet')).toBe(true);
    expect(styles05.has('wifiSticker')).toBe(true);
    expect(styles05.has('loyaltyCard')).toBe(true);

    // 2025: minimal prints + QR event posters + sustainability certificate.
    const styles25 = stylesOf(2025);
    expect(styles25.has('minimalPrint')).toBe(true);
    expect(styles25.has('qrEventPoster')).toBe(true);
    expect(styles25.has('sustainabilityCert')).toBe(true);
  });

  it('keeps period-appropriate palettes on every piece', () => {
    for (const year of POSTER_ERA_YEARS) {
      for (const paper of POSTER_ERA_CONTENT[year].papers) {
        expect(paper.palette.length).toBeGreaterThanOrEqual(2);
        for (const swatch of paper.palette) {
          expect(typeof swatch).toBe('string');
          expect(swatch.length).toBeGreaterThan(0);
        }
        // Physical sizes stay inside their slot budgets.
        expect(paper.size[0]).toBeGreaterThan(0.1);
        expect(paper.size[1]).toBeGreaterThan(0.1);
      }
    }
  });
});

/* ----- registry + runtime behaviour ---------------------------------------- */

describe('posters prop group', () => {
  it("registers under the 'posters' key with five prebuilt era sets", () => {
    const scene = makeScene();
    const builder = registerPostersPropGroup(scene);

    expect(POSTERS_PROP_GROUP_KEY).toBe('posters');
    expect(scene.hasPropGroup('posters')).toBe(true);
    expect(scene.getPropGroup('posters')?.name).toBe('prop-group:posters');

    const root = builder.getGroup();
    for (const year of POSTER_ERA_YEARS) {
      const set = eraSet(scene, year);
      expect(set.children.length).toBeGreaterThan(0);
      expect(root.getObjectByName(`posters-era-${year}`)).toBe(set);
      expect(set.visible).toBe(false); // nothing shown until applyEra
    }
  });

  it('produces distinct, correctly-placed wall art per era', () => {
    const scene = makeScene();
    const builder = registerPostersPropGroup(scene);

    const idsByYear = new Map<PosterEraYear, Set<string>>();
    for (const year of POSTER_ERA_YEARS) {
      scene.applyEra(year);
      settle(builder);
      const ids = posterIds(eraSet(scene, year));
      expect(ids.size).toBeGreaterThanOrEqual(4);
      idsByYear.set(year, ids);

      // Every mounted poster sits inside the room shell and off the floor.
      const set = eraSet(scene, year);
      const box = new THREE.Box3().setFromObject(set);
      expect(box.min.y).toBeGreaterThan(0.8);
      expect(box.max.y).toBeLessThan(3.2);
      expect(box.min.z).toBeGreaterThan(-5.15);
      expect(box.max.z).toBeLessThan(5.15);
      expect(box.min.x).toBeGreaterThan(-6.15);
      expect(box.max.x).toBeLessThan(6.15);
    }

    // Signature pieces are exclusive to their own era.
    const signatures: Array<[PosterEraYear, string]> = [
      [1945, 'dig-for-victory'],
      [1945, 'tea-rationing'],
      [1965, 'voltage-four-live'],
      [1965, 'sunny-cove-travel'],
      [1985, 'midnight-circuit-tour'],
      [1985, 'star-vipers-arcade'],
      [1985, 'polaroid-the-gig'],
      [2005, 'chronicle-wars-one-sheet'],
      [2005, 'wifi-zone-sticker'],
      [2005, 'bean-barrel-loyalty-card'],
      [2025, 'form-stillness-no4'],
      [2025, 'open-mic-qr'],
      [2025, 'green-leaf-certificate'],
    ];
    for (const [year, id] of signatures) {
      for (const other of POSTER_ERA_YEARS) {
        expect(posterIds(eraSet(scene, other)).has(id)).toBe(other === year);
      }
    }

    // Pairwise disjoint id spaces overall.
    const years = POSTER_ERA_YEARS;
    for (let i = 0; i < years.length; i++) {
      for (let j = i + 1; j < years.length; j++) {
        for (const id of idsByYear.get(years[i])!) {
          expect(idsByYear.get(years[j])!.has(id), `${id} leaked across eras`).toBe(false);
        }
      }
    }
  });

  it('snaps on first application and crossfades cleanly between eras', () => {
    const scene = makeScene();
    const builder = registerPostersPropGroup(scene);
    builder.setTransitionSeconds(0.5);

    scene.applyEra(1945); // cold start: snap
    expect(builder.isTransitioning()).toBe(false);
    expect(visibleYears(scene)).toEqual([1945]);
    const mat45 = faceOf(eraSet(scene, 1945), 'dig-for-victory').material as THREE.MeshStandardMaterial;
    expect(mat45.opacity).toBeCloseTo(1, 8);

    scene.applyEra(1985);
    expect(builder.isTransitioning()).toBe(true);
    const outMat = mat45;
    const inMat = faceOf(eraSet(scene, 1985), 'midnight-circuit-tour')
      .material as THREE.MeshStandardMaterial;

    builder.update(0.25); // half-way
    expect(outMat.opacity).toBeGreaterThan(0.35);
    expect(outMat.opacity).toBeLessThan(0.65);
    expect(inMat.opacity).toBeGreaterThan(0.35);
    expect(inMat.opacity).toBeLessThan(0.65);
    expect(eraSet(scene, 1945).visible).toBe(true);
    expect(eraSet(scene, 1985).visible).toBe(true);

    settle(builder);
    expect(builder.isTransitioning()).toBe(false);
    expect(visibleYears(scene)).toEqual([1985]);
    expect(inMat.transparent).toBe(true);
    expect(Math.abs(inMat.opacity - 1)).toBeLessThan(1e-6);
    // Hidden set's materials rest at authored baseline 1 (visibility does the hiding).
    expect(Math.abs(outMat.opacity - 1)).toBeLessThan(1e-6);
  });

  it('plays the paper-curl scale-pop: slight overshoot in, shrink out, flat at rest', () => {
    const scene = makeScene();
    const builder = registerPostersPropGroup(scene);
    builder.setTransitionSeconds(0.6);

    scene.applyEra(1965);
    settle(builder);
    const set65 = eraSet(scene, 1965);
    const pivot65 = set65.children[0] as THREE.Object3D;

    scene.applyEra(1985);
    const set85 = eraSet(scene, 1985);

    let maxInScale = 0;
    let minInScale = Infinity;
    let minOutScale = Infinity;
    let maxCurl = 0;
    for (let step = 0; step < 60; step++) {
      builder.update(0.02);
      maxInScale = Math.max(maxInScale, set85.scale.x);
      minInScale = Math.min(minInScale, set85.scale.x);
      minOutScale = Math.min(minOutScale, set65.scale.x);
      for (const pivot of [set85.children[0], set85.children[1]]) {
        const baseTilt = (pivot.userData.baseTiltZ as number) ?? 0;
        maxCurl = Math.max(maxCurl, Math.abs(pivot.rotation.z - baseTilt));
      }
    }
    void pivot65;

    // Slight pop: rises above 1 briefly (overshoot) but never far.
    expect(maxInScale).toBeGreaterThan(1.002);
    expect(maxInScale).toBeLessThan(1.02);
    // Starts compressed…
    expect(minInScale).toBeLessThan(0.96);
    // …outgoing shrinks away rather than popping.
    expect(minOutScale).toBeLessThan(0.99);
    // Paper curl ripples while in flight but stays subtle.
    expect(maxCurl).toBeGreaterThan(0.01);
    expect(maxCurl).toBeLessThanOrEqual(0.07);

    // Fully settled: exact flat scale and exact authored tilts.
    expect(Math.abs(set85.scale.x - 1)).toBeLessThan(1e-9);
    for (const pivot of set85.children) {
      expect(pivot.rotation.z).toBeCloseTo((pivot.userData.baseTiltZ as number) ?? 0, 12);
    }
  });

  it('crossfades cleanly across every ordered era pair', () => {
    const scene = makeScene();
    const builder = registerPostersPropGroup(scene);
    builder.setTransitionSeconds(0.3);

    for (const from of POSTER_ERA_YEARS) {
      for (const to of POSTER_ERA_YEARS) {
        if (from === to) continue;
        scene.applyEra(from);
        settle(builder);
        expect(visibleYears(scene)).toEqual([from]);

        scene.applyEra(to);
        // Interrupt once mid-flight to prove retarget-safety of the pair swap.
        builder.update(0.1);
        scene.applyEra(to); // same target again: keeps morphing
        settle(builder);
        expect(visibleYears(scene)).toEqual([to]);
        expect(builder.isTransitioning()).toBe(false);
      }
    }
  });

  it('falls back to the nearest dressed era for undressed timeline years', () => {
    const scene = makeScene();
    const builder = registerPostersPropGroup(scene);
    scene.applyEra(2055);
    settle(builder);
    expect(visibleYears(scene)).toEqual([2025]);
  });

  it('is driven by the era config slice: WallPoster entries replace built-ins', () => {
    // Only 1985 carries curated entries; other years resolve their built-ins.
    const curatedScene = makeScene((year) =>
      year === 1985
        ? {
            ...getEra(year),
            posters: {
              posters: [
                { label: 'ZURE KOMBUCHA', kind: 'advert', palette: ['#123456', '#ffffff', '#00ffcc'], placement: 'north wall' },
                { headline: 'NEON NIGHT MARKET', kind: 'event', placement: 'east' },
                { label: 'STAFF NOTICE', kind: 'public information notice', placement: 'south' },
              ],
            },
          }
        : getEra(year),
    );
    const builder = registerPostersPropGroup(curatedScene);
    curatedScene.applyEra(1985);
    settle(builder);

    const ids = posterIds(eraSet(curatedScene, 1985));
    expect(ids.has('zure-kombucha-0')).toBe(true);
    expect(ids.has('neon-night-market-1')).toBe(true);
    expect(ids.has('staff-notice-2')).toBe(true);
    // Built-in catalogue replaced for this year.
    expect(ids.has('midnight-circuit-tour')).toBe(false);
    expect(ids.size).toBe(3);

    // Other years keep their built-in art.
    curatedScene.applyEra(1945);
    settle(builder);
    expect(posterIds(eraSet(curatedScene, 1945)).has('dig-for-victory')).toBe(true);

    // Re-applying the curated year swaps back to the cached slice content.
    curatedScene.applyEra(1985);
    settle(builder);
    expect(posterIds(eraSet(curatedScene, 1985)).has('zure-kombucha-0')).toBe(true);
    expect(visibleYears(curatedScene)).toEqual([1985]);
  });

  it('dispose removes the group and releases resources without throwing', () => {
    const scene = makeScene();
    const builder = registerPostersPropGroup(scene);
    scene.applyEra(2005);
    settle(builder);

    const root = builder.getGroup();
    const parent = root.parent;
    builder.dispose();

    expect(parent?.children.includes(root)).toBe(false);
    expect(() => builder.dispose()).not.toThrow(); // idempotent
    expect(() => builder.update(0.016)).not.toThrow(); // dead loop stays dead
    expect(builder.isTransitioning()).toBe(false);
  });
});
