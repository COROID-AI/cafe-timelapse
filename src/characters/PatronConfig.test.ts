/**
 * PatronConfig.test.ts — asserts the declarative patron-config contract and the
 * period-appropriateness of the 1945 patron population.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SKIN_TONE,
  SEATING_ANCHORS,
  type PatronConfig,
} from './PatronConfig.js';
import { PATRONS_1945 } from './patrons1945.js';
import { ERA_YEARS } from '../data/EraData.js';

// ---------------------------------------------------------------------------
// Contract helpers
// ---------------------------------------------------------------------------

/** A minimal-but-valid PatronConfig for shape assertions. */
function sampleConfig(): PatronConfig {
  return {
    id: 'test',
    era: 1945,
    outfit: { type: 'suit', color: 0x333333, accent: 0xeeeeee },
    hat: { type: 'fedora', color: 0x333333 },
    hair: { style: 'slickedBack', color: 0x222222 },
    gadget: { type: 'newspaper' },
    seat: 'seatingTableA',
  };
}

// ---------------------------------------------------------------------------
// PatronConfig shape
// ---------------------------------------------------------------------------

describe('PatronConfig', () => {
  it('exposes the seating anchor keys', () => {
    expect(SEATING_ANCHORS).toContain('seatingTableA');
    expect(SEATING_ANCHORS).toContain('seatingTableB');
    expect(SEATING_ANCHORS).toContain('seatingTableC');
  });

  it('provides a default skin tone', () => {
    expect(DEFAULT_SKIN_TONE).toBeGreaterThan(0);
  });

  it('a sample config satisfies the interface', () => {
    const c = sampleConfig();
    expect(c.id).toBe('test');
    expect(c.era).toBe(1945);
    expect(c.outfit.type).toBe('suit');
    expect(c.hat.type).toBe('fedora');
    expect(c.hair.style).toBe('slickedBack');
    expect(c.gadget.type).toBe('newspaper');
    expect(c.seat).toBe('seatingTableA');
  });
});

// ---------------------------------------------------------------------------
// 1945 patron population — acceptance criteria
// ---------------------------------------------------------------------------

describe('1945 patron population', () => {
  it('provides between 3 and 4 patrons', () => {
    expect(PATRONS_1945.length).toBeGreaterThanOrEqual(3);
    expect(PATRONS_1945.length).toBeLessThanOrEqual(4);
  });

  it('every patron targets era 1945', () => {
    for (const p of PATRONS_1945) {
      expect(p.era).toBe(1945);
    }
  });

  it('every patron has a unique id', () => {
    const ids = PATRONS_1945.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every patron wears a period outfit (suit or day dress)', () => {
    for (const p of PATRONS_1945) {
      expect(['suit', 'dayDress']).toContain(p.outfit.type);
    }
    // At least one suit and at least one dress for variety.
    const types = PATRONS_1945.map((p) => p.outfit.type);
    expect(types).toContain('suit');
    expect(types).toContain('dayDress');
  });

  it('includes fedora hats on suit-wearing patrons', () => {
    const suited = PATRONS_1945.filter((p) => p.outfit.type === 'suit');
    expect(suited.length).toBeGreaterThan(0);
    for (const p of suited) {
      expect(p.hat.type).toBe('fedora');
    }
  });

  it('uses 1945-era hairstyles (victory rolls, finger waves, slicked back, pompadour)', () => {
    const periodStyles = ['victoryRolls', 'fingerWaves', 'slickedBack', 'pompadour'];
    for (const p of PATRONS_1945) {
      expect(periodStyles).toContain(p.hair.style);
    }
    // At least one victory-roll or finger-wave (feminine 1940s updo).
    const updos = PATRONS_1945.filter(
      (p) => p.hair.style === 'victoryRolls' || p.hair.style === 'fingerWaves',
    );
    expect(updos.length).toBeGreaterThan(0);
  });

  it('patrons hold period newspapers (gadgets)', () => {
    const newspapers = PATRONS_1945.filter((p) => p.gadget.type === 'newspaper');
    expect(newspapers.length).toBeGreaterThan(0);
    // All gadgets are period-appropriate types.
    for (const p of PATRONS_1945) {
      expect(['newspaper', 'pocketWatch']).toContain(p.gadget.type);
    }
  });

  it('seats every patron at a valid architecture anchor', () => {
    for (const p of PATRONS_1945) {
      expect(SEATING_ANCHORS).toContain(p.seat);
    }
  });

  it('patrons are NOT visible in other eras (era is pinned to 1945)', () => {
    const otherEras = ERA_YEARS.filter((y) => y !== 1945);
    for (const p of PATRONS_1945) {
      for (const y of otherEras) {
        expect(p.era).not.toBe(y);
      }
    }
  });
});
