import { describe, it, expect } from 'vitest';
import { ERAS, assertAllErasComplete, assertEraComplete } from './eras';

describe('eras.ts — single source of truth', () => {
  describe('ERAS array', () => {
    it('contains exactly six eras', () => {
      expect(ERAS).toHaveLength(6);
    });

    it('has the expected years in order', () => {
      const years = ERAS.map((e) => e.year);
      expect(years).toEqual([1945, 1965, 1985, 2005, 2025, 2055]);
    });

    it('has unique ids', () => {
      const ids = ERAS.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('assertEraComplete', () => {
    it('passes for every era in the array', () => {
      for (const era of ERAS) {
        expect(() => assertEraComplete(era)).not.toThrow();
      }
    });

    it('throws for an era with a missing required field', () => {
      const bad = { ...ERAS[0]!, machine: '' } as unknown as (typeof ERAS)[number];
      expect(() => assertEraComplete(bad)).toThrow();
    });
  });

  describe('assertAllErasComplete', () => {
    it('does not throw for the current ERAS data', () => {
      expect(() => assertAllErasComplete()).not.toThrow();
    });
  });

  describe('every era has required fields populated', () => {
    for (const era of ERAS) {
      describe(`era ${era.year}`, () => {
        it('has non-empty furniture', () => {
          expect(era.furniture).toBeDefined();
          expect(era.furniture.floorColor).toBeTruthy();
          expect(era.furniture.wallColor).toBeTruthy();
        });

        it('has non-empty machine', () => {
          expect(era.machine).toBeTruthy();
          expect(era.machineLabel).toBeTruthy();
        });

        it('has non-empty music', () => {
          expect(era.music).toBeTruthy();
          expect(era.musicLabel).toBeTruthy();
        });

        it('has at least one poster', () => {
          expect(era.posters.length).toBeGreaterThanOrEqual(1);
          era.posters.forEach((p) => {
            expect(p.title).toBeTruthy();
            expect(p.bg).toBeTruthy();
          });
        });

        it('has non-empty tableware', () => {
          expect(era.tableware).toBeTruthy();
          expect(era.tablewareLabel).toBeTruthy();
        });

        it('has non-empty lighting recipe', () => {
          expect(era.lighting).toBeDefined();
          expect(era.lighting.ambient).toBeTruthy();
          expect(era.lighting.key).toBeTruthy();
          expect(era.lighting.lamp).toBeTruthy();
        });

        it('has non-empty counterTech', () => {
          expect(era.counterTech).toBeTruthy();
          expect(era.counterTechLabel).toBeTruthy();
        });

        it('has at least one patron', () => {
          expect(era.patrons.length).toBeGreaterThanOrEqual(1);
          era.patrons.forEach((p) => {
            expect(p.outfit).toBeDefined();
            expect(p.hairstyle).toBeTruthy();
          });
        });

        it('has menu items with positive prices', () => {
          expect(era.menu.length).toBeGreaterThanOrEqual(1);
          era.menu.forEach((item) => {
            expect(item.name).toBeTruthy();
            expect(item.price).toBeGreaterThan(0);
            expect(typeof item.price).toBe('number');
          });
        });
      });
    }
  });
});
