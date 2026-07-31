/**
 * patrons1985.test.ts — verifies the 1985-era patron population.
 *
 * Asserts every acceptance criterion for the "1985 patrons" task:
 *   1. 3–4 configs for 1985 with blazers / Members-Only jackets, big hair /
 *      mullets, and Walkman gadgets.
 *   2. Registered in CharacterRoster for era 1985.
 *   3. Seated at layout anchors.
 *   4. Not visible in other eras (era-scoped roster lookup returns 0 for
 *      every non-1985 era).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { ERA_YEARS } from '../data/EraData';
import {
  characterRoster,
  getPatronsForEra,
  buildAvatarsForEra,
  PATRONS_1985,
  registerEra1985Patrons,
} from './index';
import { ANCHORS, type AnchorKey } from '../world/layout';

describe('1985-era patron configs', () => {
  beforeEach(() => {
    characterRoster.clear();
    registerEra1985Patrons();
  });

  // --- AC 1: 3–4 configs with period outfits/hair/gadgets -----------------
  it('declares between 3 and 4 patron configs', () => {
    expect(PATRONS_1985.length).toBeGreaterThanOrEqual(3);
    expect(PATRONS_1985.length).toBeLessThanOrEqual(4);
  });

  it('every config targets era 1985', () => {
    for (const p of PATRONS_1985) {
      expect(p.era).toBe(1985);
    }
  });

  it('uses shoulder-pad blazers and/or Members-Only jackets', () => {
    const outfitTypes = new Set(PATRONS_1985.map((p) => p.outfit.type));
    const allowed = new Set(['shoulder-pad-blazer', 'members-only-jacket']);
    // At least one of the two required jacket types is present.
    for (const t of outfitTypes) {
      expect(allowed.has(t)).toBe(true);
    }
    // Both archetypal eighties jackets should appear across the population.
    expect(outfitTypes.has('shoulder-pad-blazer')).toBe(true);
    expect(outfitTypes.has('members-only-jacket')).toBe(true);
  });

  it('features big hair and/or mullets', () => {
    const hairStyles = PATRONS_1985.map((p) => p.hair.style);
    expect(hairStyles).toContain('big-hair');
    expect(hairStyles).toContain('mullet');
  });

  it('equips patrons with Sony Walkman headphones as gadgets', () => {
    for (const p of PATRONS_1985) {
      expect(p.gadgets).toContain('walkman-headphones');
    }
  });

  // --- AC 2: registered in CharacterRoster for era 1985 --------------------
  it('is registered in the CharacterRoster for era 1985', () => {
    expect(characterRoster.hasEra(1985)).toBe(true);
    expect(characterRoster.countForEra(1985)).toBe(PATRONS_1985.length);
  });

  it('getPatronsForEra(1985) returns every config', () => {
    const roster = getPatronsForEra(1985);
    expect(roster.length).toBe(PATRONS_1985.length);
    for (const p of roster) {
      expect(PATRONS_1985.some((c) => c.id === p.id)).toBe(true);
    }
  });

  // --- AC 3: seated at anchors ---------------------------------------------
  it('every patron is seated at a valid layout anchor', () => {
    const validAnchors = new Set<string>(Object.keys(ANCHORS));
    for (const p of PATRONS_1985) {
      expect(validAnchors.has(p.anchor as string)).toBe(true);
    }
  });

  it('places each avatar at its anchor world position', () => {
    const avatars = buildAvatarsForEra(1985);
    expect(avatars.length).toBe(PATRONS_1985.length);
    for (let i = 0; i < avatars.length; i++) {
      const cfg = PATRONS_1985[i];
      const anchor = ANCHORS[cfg.anchor as AnchorKey];
      expect(avatars[i].position.x).toBeCloseTo(anchor.x, 5);
      expect(avatars[i].position.z).toBeCloseTo(anchor.z, 5);
    }
  });

  // --- AC 4: not visible in other eras ------------------------------------
  it('is not visible in any other era (era-scoped roster lookup)', () => {
    for (const era of ERA_YEARS) {
      if (era === 1985) continue;
      expect(characterRoster.countForEra(era)).toBe(0);
      expect(getPatronsForEra(era)).toHaveLength(0);
    }
  });

  it('builds zero avatars for non-1985 eras', () => {
    for (const era of ERA_YEARS) {
      if (era === 1985) continue;
      expect(buildAvatarsForEra(era)).toHaveLength(0);
    }
  });
});
