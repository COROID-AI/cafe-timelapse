/**
 * patrons2005.test.ts — asserts the 2005-era patron population module
 * registers 3–4 patrons with the CharacterRoster for era 2005, seats them at
 * valid anchors, uses 2005-period outfits/hair/gadgets, and does not leak
 * into other eras.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { characterRoster } from './CharacterRoster.js';
import { ANCHORS } from '../world/layout.js';
import { ERA_YEARS } from '../data/EraData.js';
import {
  PATRONS_2005,
  registerPatrons2005,
} from './patrons2005.js';
import {
  SEATING_ANCHORS,
  type GadgetType,
  type HairStyle,
  type OutfitType,
} from './PatronConfig.js';

/** Period-appropriate gadget families for the 2005 era. */
const ERA_2005_GADGETS: readonly GadgetType[] = [
  'flipPhone',
  'iPod',
  'laptop',
];

/** Period-appropriate hairstyle families for the 2005 era. */
const ERA_2005_HAIR: readonly HairStyle[] = ['sideSweptBangs', 'spiky'];

/** The 2005-era outfit family. */
const ERA_2005_OUTFIT: readonly OutfitType[] = ['bootcutJeans'];

describe('patrons2005 module', () => {
  beforeEach(() => {
    characterRoster.clearEra(2005);
  });

  it('exports 3–4 patron configs', () => {
    expect(PATRONS_2005.length).toBeGreaterThanOrEqual(3);
    expect(PATRONS_2005.length).toBeLessThanOrEqual(4);
  });

  it('every exported config is for era 2005', () => {
    for (const p of PATRONS_2005) {
      expect(p.era).toBe(2005);
    }
  });

  it('every config uses a bootcut-jeans outfit', () => {
    for (const p of PATRONS_2005) {
      expect(ERA_2005_OUTFIT).toContain(p.outfit.type);
    }
  });

  it('uses 2005-period hairstyles (sideSweptBangs / spiky)', () => {
    const styles = PATRONS_2005.map((p) => p.hair.style);
    // At least one of each era-specific style.
    expect(styles).toContain('sideSweptBangs');
    expect(styles).toContain('spiky');
    for (const s of styles) {
      expect(ERA_2005_HAIR).toContain(s);
    }
  });

  it('uses 2005-period gadgets (flipPhone / iPod / laptop)', () => {
    const gadgets = PATRONS_2005.map((p) => p.gadget.type);
    // At least two distinct era gadgets appear.
    const eraGadgetsUsed = gadgets.filter((g) =>
      ERA_2005_GADGETS.includes(g),
    );
    expect(eraGadgetsUsed.length).toBeGreaterThanOrEqual(2);
    for (const g of gadgets) {
      expect([...ERA_2005_GADGETS, 'none']).toContain(g);
    }
  });

  it('every patron is seated at a valid seating anchor', () => {
    for (const p of PATRONS_2005) {
      expect(SEATING_ANCHORS).toContain(p.seat);
      expect(ANCHORS[p.seat]).toBeDefined();
    }
  });

  it('all patron ids are unique', () => {
    const ids = PATRONS_2005.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('patrons2005 roster integration', () => {
  beforeEach(() => {
    characterRoster.clearEra(2005);
  });

  it('registerPatrons2005 populates the roster for era 2005', () => {
    registerPatrons2005();
    expect(characterRoster.has(2005)).toBe(true);
    const patrons = characterRoster.getForEra(2005);
    expect(patrons.length).toBeGreaterThanOrEqual(3);
    expect(patrons.length).toBeLessThanOrEqual(4);
  });

  it('registerPatrons2005 is idempotent', () => {
    registerPatrons2005();
    const countAfterFirst = characterRoster.getForEra(2005).length;
    registerPatrons2005(); // should no-op
    expect(characterRoster.getForEra(2005).length).toBe(countAfterFirst);
  });

  it('2005 patrons are not visible in other eras', () => {
    registerPatrons2005();
    // 2005 has patrons.
    expect(characterRoster.getForEra(2005).length).toBeGreaterThan(0);
    // No other era has 2005 patrons.
    const otherEras = ERA_YEARS.filter((y) => y !== 2005);
    for (const y of otherEras) {
      const patronsForEra = characterRoster.getForEra(y);
      // No 2005-config id should appear in another era's roster.
      const ids2005 = PATRONS_2005.map((p) => p.id);
      for (const p of patronsForEra) {
        expect(ids2005).not.toContain(p.id);
      }
    }
  });
});
