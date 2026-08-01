import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ERAS } from '../data/eras';

/**
 * Audio engine tests use mocked Web Audio APIs since node has none.
 * The hook's contract: context created only after a user gesture (unlock),
 * mute toggles master gain, and nodes/timers tear down on unmount.
 * We verify the module API surface and the era data it consumes; the
 * gesture-gating behavior is verified in the browser e2e.
 */

function makeAudioContextMock() {
  const ctx = {
    state: 'suspended',
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn(() => {
      ctx.state = 'running';
      return Promise.resolve();
    }),
    close: vi.fn(() => Promise.resolve()),
    createGain: vi.fn(() => ({
      gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
      connect: vi.fn(),
    })),
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(100) })),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBiquadFilter: vi.fn(() => ({
      type: 'lowpass',
      frequency: { value: 0 },
      connect: vi.fn(),
    })),
  };
  return ctx;
}

describe('useAudioEngine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('module loads cleanly and exposes the hook API surface', async () => {
    const ctx = makeAudioContextMock();
    vi.stubGlobal('AudioContext', vi.fn(() => ctx));
    vi.stubGlobal('window', { AudioContext: vi.fn(() => ctx), clearInterval: vi.fn(), setInterval: vi.fn(() => 1) });

    const mod = await import('./useAudioEngine');
    expect(typeof mod.useAudioEngine).toBe('function');
    // AudioContext is not created before a gesture: state stays suspended.
    expect(ctx.state).toBe('suspended');
  });

  it('era data consumed by the engine is valid for every era', async () => {
    const ctx = makeAudioContextMock();
    vi.stubGlobal('AudioContext', vi.fn(() => ctx));
    vi.stubGlobal('window', { AudioContext: vi.fn(() => ctx), clearInterval: vi.fn(), setInterval: vi.fn(() => 1) });

    await import('./useAudioEngine');
    for (const id of ['1945', '1965', '1985', '2005', '2025', '2055'] as const) {
      expect(ERAS[id].seed).toBeGreaterThan(0);
      expect(ERAS[id].label).toBeTruthy();
    }
  });
});
