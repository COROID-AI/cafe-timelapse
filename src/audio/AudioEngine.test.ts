import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioEngine } from "./AudioEngine";

/**
 * Autoplay-policy contract (handoff finding a3569112): no AudioContext
 * may be constructed until a genuine user gesture unlocks the engine.
 * A fake context factory lets us observe construction without WebAudio.
 */

function makeParam(initial = 0) {
  const param = {
    value: initial,
    setValueAtTime: vi.fn((v: number) => {
      param.value = v;
    }),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
  return param;
}

function makeFakeContext() {
  let oscCount = 0;
  const ctx = {
    sampleRate: 48000,
    currentTime: 0,
    state: "running",
    destination: {},
    resume: vi.fn(async () => undefined),
    suspend: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
    createdOscillators: () => oscCount,
    createGain: () => ({ gain: makeParam(1), connect: vi.fn((t: unknown) => t), disconnect: vi.fn() }),
    createBiquadFilter: () => ({
      type: "",
      frequency: makeParam(350),
      Q: makeParam(1),
      connect: vi.fn((t: unknown) => t),
      disconnect: vi.fn(),
    }),
    createOscillator: () => {
      oscCount += 1;
      return {
        type: "",
        frequency: makeParam(440),
        detune: makeParam(0),
        connect: vi.fn((t: unknown) => t),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
    },
    createBuffer: (_channels: number, length: number, rate: number) => ({
      numberOfChannels: _channels,
      length,
      sampleRate: rate,
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () => ({
      buffer: null as unknown,
      loop: false,
      connect: vi.fn((t: unknown) => t),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
  };
  return ctx;
}

type FakeCtx = ReturnType<typeof makeFakeContext>;

function makeEngine() {
  const contexts: FakeCtx[] = [];
  const factory = vi.fn(() => {
    const c = makeFakeContext();
    contexts.push(c);
    return c as unknown as AudioContext;
  });
  const engine = new AudioEngine({ createContext: factory });
  return { engine, factory, contexts };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("autoplay policy", () => {
  it("does not construct an AudioContext from programmatic enable", () => {
    const { engine, factory } = makeEngine();
    engine.setEnabled(true);
    expect(factory).not.toHaveBeenCalled();
    expect(engine.isUnlocked).toBe(false);
    engine.dispose();
  });

  it("unlock() is the only construction path and is idempotent", () => {
    const { engine, factory } = makeEngine();
    expect(engine.unlock()).toBe(true);
    expect(engine.unlock()).toBe(true);
    expect(factory).toHaveBeenCalledTimes(1);
    engine.dispose();
  });
});

describe("playback lifecycle", () => {
  it("gesture-enabled playback schedules music without errors", () => {
    const { engine, contexts } = makeEngine();
    engine.unlock();
    engine.setEnabled(true, { fromUserGesture: true });
    expect(() => vi.advanceTimersByTime(1500)).not.toThrow();
    expect(contexts[0].createdOscillators()).toBeGreaterThan(0);
    engine.dispose();
  });

  it("disable stops scheduling", () => {
    const { engine, contexts } = makeEngine();
    engine.unlock();
    engine.setEnabled(true, { fromUserGesture: true });
    vi.advanceTimersByTime(600);
    const before = contexts[0].createdOscillators();
    engine.setEnabled(false);
    vi.advanceTimersByTime(1200);
    expect(contexts[0].createdOscillators()).toBe(before);
    engine.dispose();
  });

  it("setProgram switches era music without recreating the context", () => {
    const { engine, factory, contexts } = makeEngine();
    engine.unlock();
    engine.setProgram("synth-pop");
    expect(engine.currentProgramId).toBe("synth-pop");
    engine.setProgram("not-a-program");
    expect(engine.currentProgramId).toBe("synth-pop");
    engine.setEnabled(true, { fromUserGesture: true });
    vi.advanceTimersByTime(800);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(contexts[0].createdOscillators()).toBeGreaterThan(0);
    engine.dispose();
  });
});

describe("disposal", () => {
  it("closes the context exactly once and ignores later commands", () => {
    const { engine, factory, contexts } = makeEngine();
    engine.unlock();
    engine.dispose();
    engine.dispose();
    expect(contexts[0].close).toHaveBeenCalledTimes(1);
    expect(() => {
      engine.setEnabled(true, { fromUserGesture: true });
      engine.setProgram("pop-dance");
      engine.unlock();
    }).not.toThrow();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(engine.isUnlocked).toBe(false);
  });
});
