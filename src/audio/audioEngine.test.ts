import { describe, expect, it } from 'vitest';
import { midiToFreq, eraBpm } from './audioEngine';
import { ERAS, ERA_MAP } from '../data/eras';
import { menuPriceLines } from '../three/decor';

describe('audio engine pure helpers', () => {
  it('converts MIDI to frequency correctly', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5);
    expect(midiToFreq(81)).toBeCloseTo(880, 5);
    expect(midiToFreq(57)).toBeCloseTo(220, 5);
  });

  it('era BPMs are positive and varied across periods', () => {
    const bpms = ERAS.map((e) => eraBpm(e));
    expect(bpms.every((b) => b > 0)).toBe(true);
    expect(new Set(bpms).size).toBeGreaterThanOrEqual(4);
  });

  it('every era has a music device and menu title', () => {
    for (const era of ERAS) {
      expect(era.music.device.length).toBeGreaterThan(0);
      expect(era.menu.title.length).toBeGreaterThan(0);
      expect(era.musicDeviceIndex).toBeGreaterThanOrEqual(0);
      expect(era.musicDeviceIndex).toBeLessThan(6);
    }
  });

  it('era posters reference the wall slots used by the decor builder', () => {
    const known = ['left', 'center', 'right'];
    for (const era of ERAS) {
      for (const poster of era.posters) {
        expect(known).toContain(poster.slot);
      }
    }
  });

  it('menuPriceLines formats menu items', () => {
    const lines = menuPriceLines(ERA_MAP.e2025.menu.items);
    expect(lines).toHaveLength(4);
    expect(lines[0]).toContain('Flat White');
    expect(lines[0]).toContain('$5.00');
  });
});
