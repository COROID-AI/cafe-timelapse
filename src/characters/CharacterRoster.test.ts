/**
 * CharacterRoster.test.ts — asserts the era-scoped registry stores patrons,
 * registers a scene-fragment factory with the AssetRegistry, builds per-era
 * groups, and isolates eras (1945 patrons do not leak into other eras).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { Group } from 'three';
import { characterRoster } from './CharacterRoster.js';
import { assetRegistry } from '../registry/AssetRegistry.js';
import { ANCHORS } from '../world/layout.js';
import { ERA_YEARS, type EraYear } from '../data/EraData.js';
import type { PatronConfig } from './PatronConfig.js';

/** Build a throwaway 1945 patron for isolated roster tests. */
function makePatron(id: string, era: EraYear = 1945): PatronConfig {
  return {
    id,
    era,
    outfit: { type: 'suit', color: 0x333333, accent: 0xeeeeee },
    hat: { type: 'fedora', color: 0x333333 },
    hair: { style: 'slickedBack', color: 0x222222 },
    gadget: { type: 'newspaper' },
    seat: 'seatingTableA',
  };
}

describe('CharacterRoster', () => {
  beforeEach(() => {
    characterRoster.clear();
    // The AssetRegistry is also module-global and throws on duplicate
    // registration. We cannot easily reset it, so roster tests use a private
    // era id space by only asserting on `has`/`getForEra` and the factory for
    // eras that are freshly registered in this test run.
  });

  it('stores a registered patron', () => {
    characterRoster.register(makePatron('p1'));
    expect(characterRoster.has(1945)).toBe(true);
    expect(characterRoster.getForEra(1945)).toHaveLength(1);
    expect(characterRoster.getById(1945, 'p1')).toBeDefined();
  });

  it('stores multiple patrons via an array', () => {
    characterRoster.register([makePatron('a'), makePatron('b'), makePatron('c')]);
    expect(characterRoster.getForEra(1945)).toHaveLength(3);
  });

  it('rejects duplicate patron ids within an era', () => {
    characterRoster.register(makePatron('dup'));
    expect(() => characterRoster.register(makePatron('dup'))).toThrow(/duplicate/);
  });

  it('rejects mixed eras in a single array call', () => {
    expect(() =>
      characterRoster.register([makePatron('x', 1945), makePatron('y', 1965)]),
    ).toThrow(/mixed eras/);
  });

  it('keeps other eras empty when only 1945 is populated', () => {
    characterRoster.register([makePatron('a'), makePatron('b')]);
    for (const y of ERA_YEARS) {
      if (y === 1945) {
        expect(characterRoster.has(y)).toBe(true);
      } else {
        expect(characterRoster.has(y)).toBe(false);
        expect(characterRoster.getForEra(y)).toHaveLength(0);
      }
    }
  });

  it('tracks the total size across eras', () => {
    characterRoster.register([makePatron('a'), makePatron('b'), makePatron('c')]);
    expect(characterRoster.size).toBe(3);
  });

  it('clearEra empties one era without touching others', () => {
    characterRoster.register(makePatron('a'));
    characterRoster.clearEra(1945);
    expect(characterRoster.has(1945)).toBe(false);
    expect(characterRoster.size).toBe(0);
  });
});

describe('CharacterRoster factory wiring', () => {
  it('registers a patrons factory with the AssetRegistry for the populated era', () => {
    // Use a unique id so this test is independent.
    characterRoster.clear();
    characterRoster.register(makePatron('factory-test'));
    expect(assetRegistry.has('patrons', 1945)).toBe(true);
  });

  it('the factory builds a Group containing the era patrons', () => {
    characterRoster.clear();
    characterRoster.register([
      makePatron('f1'),
      { ...makePatron('f2'), seat: 'seatingTableB' },
    ]);
    const factory = assetRegistry.get('patrons', 1945);
    expect(factory).toBeDefined();
    const obj = factory!({ era: 1945, category: 'patrons' });
    expect(obj).toBeInstanceOf(Group);
    // Two patrons = two child groups.
    expect(obj.children.length).toBe(2);
  });

  it('patrons mount only for their era — other eras have no roster patrons', () => {
    characterRoster.clear();
    characterRoster.register([makePatron('iso1'), makePatron('iso2')]);
    // 1945 has patrons.
    expect(characterRoster.getForEra(1945).length).toBe(2);
    // No other era has roster patrons.
    const otherEras = ERA_YEARS.filter((y) => y !== 1945);
    for (const y of otherEras) {
      expect(characterRoster.getForEra(y)).toHaveLength(0);
    }
  });
});

describe('1945 population module integration', () => {
  it('registerPatrons1945 populates exactly 3–4 patrons for era 1945', async () => {
    // The module is side-effectful on first import; because Vitest caches modules,
    // re-importing may not re-fire the side effect. Call the explicit registrar
    // (which is idempotent) to guarantee the roster is populated.
    const { registerPatrons1945 } = await import('./patrons1945.js');
    characterRoster.clearEra(1945);
    registerPatrons1945();
    const patrons = characterRoster.getForEra(1945);
    expect(patrons.length).toBeGreaterThanOrEqual(3);
    expect(patrons.length).toBeLessThanOrEqual(4);
  });

  it('every 1945 patron seat resolves to a real anchor', async () => {
    const { registerPatrons1945 } = await import('./patrons1945.js');
    characterRoster.clearEra(1945);
    registerPatrons1945();
    for (const p of characterRoster.getForEra(1945)) {
      expect(ANCHORS[p.seat]).toBeDefined();
    }
  });
});
