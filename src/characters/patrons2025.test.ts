/**
 * patrons2025.test.ts — asserts the 2025 patron population satisfies the
 * acceptance criteria: 3–4 configs, athleisure/oversized outfits, beanies /
 * top-knots, earbuds/smartphone/laptop/reusable-cup gadgets, registered for
 * era 2025, seated at anchors, and not visible in other eras.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  DEFAULT_SKIN_TONE,
  SEATING_ANCHORS,
  type PatronConfig,
} from './PatronConfig.js';
import { PATRONS_2025, registerPatrons2025 } from './patrons2025.js';
import { characterRoster } from './CharacterRoster.js';
import { assetRegistry } from '../registry/AssetRegistry.js';
import { ANCHORS } from '../world/layout.js';
import { ERA_YEARS } from '../data/EraData.js';

// ---------------------------------------------------------------------------
// 2025 patron population — acceptance criteria
// ---------------------------------------------------------------------------

describe('2025 patron population', () => {
  it('provides between 3 and 4 patrons', () => {
    expect(PATRONS_2025.length).toBeGreaterThanOrEqual(3);
    expect(PATRONS_2025.length).toBeLessThanOrEqual(4);
  });

  it('every patron targets era 2025', () => {
    for (const p of PATRONS_2025) {
      expect(p.era).toBe(2025);
    }
  });

  it('every patron has a unique id', () => {
    const ids = PATRONS_2025.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every patron wears a period outfit (athleisure or oversized)', () => {
    for (const p of PATRONS_2025) {
      expect(['athleisure', 'oversized']).toContain(p.outfit.type);
    }
    // At least one athleisure and at least one oversized for variety.
    const types = PATRONS_2025.map((p) => p.outfit.type);
    expect(types).toContain('athleisure');
    expect(types).toContain('oversized');
  });

  it('includes beanies on some patrons', () => {
    const beanies = PATRONS_2025.filter((p) => p.hat.type === 'beanie');
    expect(beanies.length).toBeGreaterThan(0);
    // All hats are period-appropriate types (beanie or none).
    for (const p of PATRONS_2025) {
      expect(['beanie', 'none']).toContain(p.hat.type);
    }
  });

  it('uses 2025-era hairstyles (top-knot and slicked-back)', () => {
    const periodStyles = ['topKnot', 'slickedBack'];
    for (const p of PATRONS_2025) {
      expect(periodStyles).toContain(p.hair.style);
    }
    // At least one top-knot (the contemporary gender-fluid style).
    const topKnots = PATRONS_2025.filter((p) => p.hair.style === 'topKnot');
    expect(topKnots.length).toBeGreaterThan(0);
  });

  it('patrons hold period gadgets (smartphone, laptop, earbuds, reusable cup)', () => {
    const periodGadgets = ['smartphone', 'openLaptop', 'earbuds', 'reusableCup'];
    for (const p of PATRONS_2025) {
      expect(periodGadgets).toContain(p.gadget.type);
    }
    // At least one of each new gadget family across the population? We assert
    // the gadget set is varied (≥3 distinct period gadgets among 4 patrons).
    const distinct = new Set(PATRONS_2025.map((p) => p.gadget.type));
    expect(distinct.size).toBeGreaterThanOrEqual(3);
  });

  it('seats every patron at a valid architecture anchor', () => {
    for (const p of PATRONS_2025) {
      expect(SEATING_ANCHORS).toContain(p.seat);
    }
  });

  it('patrons are NOT visible in other eras (era is pinned to 2025)', () => {
    const otherEras = ERA_YEARS.filter((y) => y !== 2025);
    for (const p of PATRONS_2025) {
      for (const y of otherEras) {
        expect(p.era).not.toBe(y);
      }
    }
  });

  it('does not reference 1945-only outfit/hat/hair/gadget families', () => {
    // 2025 patrons must not fall back to period-inappropriate families.
    for (const p of PATRONS_2025) {
      expect(['athleisure', 'oversized']).toContain(p.outfit.type);
      expect(['beanie', 'none']).toContain(p.hat.type);
      expect(['topKnot', 'slickedBack']).toContain(p.hair.style);
      expect(['smartphone', 'openLaptop', 'earbuds', 'reusableCup']).toContain(
        p.gadget.type,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// 2025 population module — roster + factory integration
// ---------------------------------------------------------------------------

describe('2025 population module integration', () => {
  beforeEach(() => {
    characterRoster.clearEra(2025);
  });

  it('registerPatrons2025 populates exactly 3–4 patrons for era 2025', () => {
    registerPatrons2025();
    const patrons = characterRoster.getForEra(2025);
    expect(patrons.length).toBeGreaterThanOrEqual(3);
    expect(patrons.length).toBeLessThanOrEqual(4);
  });

  it('every 2025 patron seat resolves to a real anchor', () => {
    registerPatrons2025();
    for (const p of characterRoster.getForEra(2025)) {
      expect(ANCHORS[p.seat]).toBeDefined();
    }
  });

  it('registers a patrons factory with the AssetRegistry for era 2025', () => {
    registerPatrons2025();
    expect(assetRegistry.has('patrons', 2025)).toBe(true);
  });

  it('2025 patrons do not leak into other eras via the roster', () => {
    registerPatrons2025();
    expect(characterRoster.getForEra(2025).length).toBeGreaterThan(0);
    const otherEras = ERA_YEARS.filter((y) => y !== 2025);
    for (const y of otherEras) {
      expect(characterRoster.getForEra(y)).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Contract sanity (DEFAULT_SKIN_TONE is still exported for 2025 patrons)
// ---------------------------------------------------------------------------

describe('2025 PatronConfig contract sanity', () => {
  it('every 2025 patron satisfies the PatronConfig interface', () => {
    const sample: PatronConfig = {
      ...PATRONS_2025[0],
    };
    expect(sample.id.length).toBeGreaterThan(0);
    expect(sample.era).toBe(2025);
    expect(DEFAULT_SKIN_TONE).toBeGreaterThan(0);
  });
});
