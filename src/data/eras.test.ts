import { describe, expect, it } from 'vitest';
import { ERAS, ERA_IDS } from './eras';
import type { EraConfig } from '../types/era';

describe('era data', () => {
  it('contains exactly six eras', () => {
    expect(ERA_IDS).toEqual(['1945', '1965', '1985', '2005', '2025', '2055']);
  });

  it('every era satisfies the EraConfig contract with non-empty sub-fields', () => {
    for (const id of ERA_IDS) {
      const era: EraConfig = ERAS[id];
      expect(era.id).toBe(id);
      expect(era.label).toBeTruthy();
      expect(era.tagline).toBeTruthy();
      expect(era.menu.length).toBeGreaterThan(0);
      for (const item of era.menu) {
        expect(item.name.length).toBeGreaterThan(0);
        expect(item.price.length).toBeGreaterThan(0);
      }
      expect(era.machineVariant).toBeTruthy();
      expect(era.deviceType).toBeTruthy();
      expect(era.tillType).toBeTruthy();
      expect(era.posterTheme).toBeTruthy();
      expect(era.signageType).toBeTruthy();
      expect(era.patronStyle).toBeTruthy();
      expect(era.tablewareStyle).toBeTruthy();
      expect(era.decorTheme).toBeTruthy();
      expect(era.seed).toBeGreaterThan(0);
    }
  });

  it('eras are visually distinct (differing configs)', () => {
    // At least lighting temperature and furniture tone differ between adjacent eras.
    for (let i = 0; i < ERA_IDS.length - 1; i++) {
      const a = ERAS[ERA_IDS[i]];
      const b = ERAS[ERA_IDS[i + 1]];
      expect(a.lighting.temperature).not.toBe(b.lighting.temperature);
      expect(a.machineVariant).not.toBe(b.machineVariant);
      expect(a.deviceType).not.toBe(b.deviceType);
    }
  });
});
