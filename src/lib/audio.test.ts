import { describe, it, expect, vi } from 'vitest';

// Mock Howler before importing the AudioManager
vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(() => 0),
    stop: vi.fn(),
    fade: vi.fn(),
    mute: vi.fn(),
    unload: vi.fn(),
    volume: vi.fn(() => 0.5),
    once: vi.fn(),
    on: vi.fn(),
    state: vi.fn(() => 'loaded'),
  })),
}));

import { AudioManager, toAudioProfile } from './audio';
import type { AudioRecipe } from '../data/eras';

const mockRecipe: AudioRecipe = {
  musicTone: 'jazz',
  baseFreq: 220,
  ambient: 'hushed',
  machineSfx: 'percolate',
};

describe('AudioManager', () => {
  it('toAudioProfile converts an AudioRecipe correctly', () => {
    const profile = toAudioProfile(mockRecipe);
    expect(profile.musicTone).toBe('jazz');
    expect(profile.baseFreq).toBe(220);
    expect(profile.ambient).toBe('hushed');
    expect(profile.machineSfx).toBe('percolate');
  });

  it('is initially locked', () => {
    expect(AudioManager.isUnlocked).toBe(false);
  });

  it('crossfade does not throw when called before unlock', () => {
    expect(() => {
      const profile = toAudioProfile(mockRecipe);
      AudioManager.crossfade(null, profile, 100);
    }).not.toThrow();
  });
});
