/**
 * patrons1965.test.ts — verifies the 1965-era patron population meets every
 * acceptance criterion:
 *   • 3-4 configs for 1965 with mod shifts/slim suits, beehives, transistor
 *     radios (and other era-appropriate gadgets).
 *   • Registered in CharacterRoster for era 1965.
 *   • Seated at layout anchors (seatingTableA/B/C).
 *   • Not visible in other eras (era-scoped visibility).
 */
import { describe, expect, it } from 'vitest';
import { characterRoster, buildCharacterAvatars } from './index.js';
import { getPatrons1965, registerPatrons1965 } from './patrons1965.js';
import { ANCHORS } from '../world/layout.js';
import { ERA_YEARS } from '../data/EraData.js';
import type { FlatSlugPatronConfig } from './PatronConfig.js';

describe('1965 patron population', () => {
  it('defines 3-4 configs for era 1965', () => {
    const configs = getPatrons1965();
    expect(configs.length).toBeGreaterThanOrEqual(3);
    expect(configs.length).toBeLessThanOrEqual(4);
    for (const c of configs) {
      expect(c.era).toBe(1965);
    }
  });

  it('uses mod-shift dresses / slim suits and beehives', () => {
    const configs = getPatrons1965();
    const outfits = configs.map((c) => c.outfit);
    const hairstyles = configs.map((c) => c.hairstyle);
    // At least one mod shift dress and at least one slim suit.
    expect(outfits).toContain('mod-shift-dress');
    expect(outfits).toContain('slim-suit');
    // At least one beehive hairstyle.
    expect(hairstyles).toContain('beehive');
    // Era-appropriate vocabulary only — no non-1965 outfits leak in.
    for (const o of outfits) {
      expect(['mod-shift-dress', 'slim-suit', 'miniskirt']).toContain(o);
    }
    for (const h of hairstyles) {
      expect(['beehive', 'bouffant', 'bowl-cut', 'mod-bob']).toContain(h);
    }
  });

  it('includes transistor-radio and other era-appropriate gadgets', () => {
    const configs = getPatrons1965();
    const gadgets = configs.map((c) => c.gadget);
    // At least one transistor radio (the headline 1965 gadget).
    expect(gadgets).toContain('transistor-radio');
    // All gadgets are 1965-appropriate (or null).
    const allowed = ['transistor-radio', 'cigarette', 'cigarette-case', 'sunglasses', null];
    for (const g of gadgets) {
      expect(allowed).toContain(g);
    }
  });

  it('registers the population with CharacterRoster for era 1965', () => {
    // patrons1965.ts self-registers on import; ensure the roster sees it.
    registerPatrons1965(); // idempotent
    const rosterPatrons = characterRoster.getPatrons(1965);
    expect(rosterPatrons.length).toBeGreaterThanOrEqual(3);
    // Every roster patron for 1965 is one of our defined configs.
    const definedIds = new Set(getPatrons1965().map((c) => c.id));
    for (const c of rosterPatrons) {
      expect(definedIds.has(c.id)).toBe(true);
      expect(c.era).toBe(1965);
    }
  });

  it('seats every patron at a layout anchor', () => {
    const configs = getPatrons1965();
    const validAnchors = new Set(Object.keys(ANCHORS));
    for (const c of configs) {
      expect(validAnchors.has(c.anchor)).toBe(true);
    }
    // At least one patron seated at each of the three seating tables.
    const anchors = configs.map((c) => c.anchor);
    expect(anchors).toContain('seatingTableA');
    expect(anchors).toContain('seatingTableB');
    expect(anchors).toContain('seatingTableC');
  });

  it('is not visible in any other era (era-scoped visibility)', () => {
    const ids1965 = new Set(getPatrons1965().map((c) => c.id));
    for (const era of ERA_YEARS) {
      if (era === 1965) continue;
      const otherPatrons = characterRoster.getPatrons(era);
      for (const c of otherPatrons) {
        expect(ids1965.has(c.id)).toBe(false);
      }
    }
    // The roster's own era-exclusivity assertion should pass for 1965.
    expect(characterRoster.assertEraExclusive(1965, 3)).toBe(true);
  });

  it('builds distinct seated avatars at the correct world positions', () => {
    const configs = getPatrons1965();
    const avatars = buildCharacterAvatars(configs);
    expect(avatars.length).toBe(configs.length);
    const positions = new Set<string>();
    for (let i = 0; i < configs.length; i++) {
      const c = configs[i] as FlatSlugPatronConfig;
      const a = avatars[i];
      const anchor = ANCHORS[c.anchor];
      const expectedX = anchor.x + c.offset.x;
      const expectedZ = anchor.z + c.offset.z;
      expect(a.position.x).toBeCloseTo(expectedX, 5);
      expect(a.position.z).toBeCloseTo(expectedZ, 5);
      expect(a.position.y).toBe(0);
      expect(a.rotation.y).toBe(c.rotation);
      positions.add(`${a.position.x.toFixed(2)},${a.position.z.toFixed(2)}`);
    }
    // Avatars are at distinct positions (no two patrons overlap).
    expect(positions.size).toBe(configs.length);
  });

  it('avatars carry era-1965 patron group names', () => {
    const avatars = buildCharacterAvatars(getPatrons1965());
    for (const a of avatars) {
      expect(a.name).toMatch(/^patron:1965-/);
      expect(a.name).toContain('1965');
    }
  });
});
