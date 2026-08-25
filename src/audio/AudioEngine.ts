import { getProgram } from "./musicPrograms";

/**
 * Web-Audio engine for period music + café ambience.
 *
 * Autoplay policy (handoff finding a3569112): the AudioContext is ONLY
 * constructed inside `unlock()`, which the UI invokes synchronously from
 * a real user gesture (the Sound toggle click). Programmatic calls to
 * `setEnabled(true)` are ignored while no unlocked context exists.
 *
 * Disposal (plan convention): `dispose()` stops timers, disconnects the
 * graph and closes the context. The engine owns nothing declarative, so
 * there is nothing for React Fiber to dispose.
 */

export interface AudioEngineDeps {
  createContext?: () => AudioContext;
}

interface GainLike {
  gain: {
    value: number;
    setValueAtTime(v: number, t: number): void;
    linearRampToValueAtTime(v: number, t: number): void;
    setTargetAtTime(v: number, t: number, tc: number): void;
    cancelScheduledValues(t: number): void;
  };
}

const LOOKAHEAD_S = 0.3;
const TICK_MS = 100;

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class AudioEngine {
  private readonly factory: () => AudioContext;
  private ctx: AudioContext | null = null;
  private master: GainLike & { connect(n: unknown): void } | null = null;
  private musicBus: GainLike | null = null;
  private sfxBus: GainLike | null = null;
  private lowPass: BiquadFilterNode | null = null;
  private enabled = false;
  private disposed = false;
  private programId = "swing-jazz";
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private stepIndex = 0;
  private hissCountdownSteps = 40;

  constructor(deps: AudioEngineDeps = {}) {
    this.factory =
      deps.createContext ??
      (() =>
        new AudioContext({
          latencyHint: "playback",
        }));
  }

  get isUnlocked(): boolean {
    return this.ctx !== null;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Create/resume the context. Call sites must be genuine user gestures
   * (click/keydown handlers). Safe to call repeatedly; idempotent.
   */
  unlock(): boolean {
    if (this.disposed) return false;
    if (!this.ctx) {
      try {
        this.ctx = this.factory();
        this.buildGraph();
      } catch {
        this.ctx = null;
        return false;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => undefined);
    return true;
  }

  /**
   * Enable/disable playback. When `on` is requested programmatically
   * (no prior unlock), the request is dropped — browsers would block
   * the context anyway, so we never even build one.
   */
  setEnabled(on: boolean, opts: { fromUserGesture?: boolean } = {}): void {
    if (this.disposed) return;
    if (on && !this.ctx) {
      if (!opts.fromUserGesture || !this.unlock()) return;
    }
    if (!on && !this.ctx) return;
    this.enabled = on;
    const t = this.ctx!.currentTime;
    const g = this.master!.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(on ? 0.85 : 0, t + 0.25);
    if (on) this.startScheduler();
    else this.stopScheduler();
  }

  /** Switch era program; takes effect at the next scheduled step. */
  setProgram(programId: string): void {
    if (getProgram(programId)) this.programId = programId;
  }

  get currentProgramId(): string {
    return this.programId;
  }

  /** Tab-hidden pause hook (plan convention: clamp/pause off-screen). */
  suspend(): void {
    if (this.ctx && this.ctx.state === "running") void this.ctx.suspend().catch(() => undefined);
  }

  resume(): void {
    if (this.ctx && this.enabled && this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => undefined);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.stopScheduler();
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
      this.master = null;
      this.musicBus = null;
      this.sfxBus = null;
      this.lowPass = null;
    }
  }

  // ------------------------------------------------------------------
  // Graph construction
  // ------------------------------------------------------------------

  private buildGraph(): void {
    const ctx = this.ctx!;
    const master = ctx.createGain();
    master.gain.value = 0;
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 3200;

    const musicBus = ctx.createGain();
    musicBus.gain.value = 0.55;
    const sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.5;

    musicBus.connect(lowPass);
    sfxBus.connect(master);
    lowPass.connect(master);
    master.connect(ctx.destination);

    this.master = master as unknown as typeof this.master;
    this.musicBus = musicBus as unknown as GainLike;
    this.sfxBus = sfxBus as unknown as GainLike;
    this.lowPass = lowPass;

    this.startAmbience();
  }

  /** Looping filtered-noise beds: room murmur + vinyl crackle. */
  private startAmbience(): void {
    const ctx = this.ctx!;
    const murmur = this.makeNoiseSource(ctx, 2.5);
    if (murmur) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      murmur.connect(lp).connect(g).connect(this.sfxBus! as unknown as AudioNode);
      murmur.start();
    }
  }

  private makeNoiseSource(
    ctx: AudioContext,
    seconds: number,
  ): AudioBufferSourceNode | null {
    try {
      const len = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.2;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      return src;
    } catch {
      return null;
    }
  }

  // ------------------------------------------------------------------
  // Scheduler
  // ------------------------------------------------------------------

  private startScheduler(): void {
    if (this.timer !== null) return;
    this.nextTime = this.ctx!.currentTime + 0.05;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private stopScheduler(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    const ctx = this.ctx;
    if (!ctx || !this.enabled || !this.musicBus) return;
    const program = getProgram(this.programId);

    // Update filter brightness for the new program.
    if (this.lowPass) {
      this.lowPass.frequency.setTargetAtTime(program.brightness, ctx.currentTime, 0.2);
    }

    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      this.scheduleStep(program, this.nextTime);
      const stepDur = 60 / program.bpm / 2; // eighth-note grid
      this.nextTime += stepDur;
      this.stepIndex += 1;
      this.hissCountdownSteps -= 1;
      if (this.hissCountdownSteps <= 0) {
        this.scheduleCoffeeSfx(ctx, this.nextTime);
        this.hissCountdownSteps = 48 + Math.floor(Math.random() * 60);
      }
    }
  }

  private scheduleStep(program: ReturnType<typeof getProgram>, time: number): void {
    const step = this.stepIndex;
    const stepsPerBar = 16;
    const barIndex = Math.floor(step / stepsPerBar) % program.chords.length;

    // Pad chord at each bar start (slow attack/release — gentle by design).
    if (step % stepsPerBar === 0) {
      const chord = program.chords[barIndex];
      chord.forEach((m, i) => this.schedulePad(m, time, i));
    }
    // Bass pluck on beats 1 & 3.
    if (step % 8 === 0) {
      const chord = program.chords[barIndex];
      this.schedulePluck(chord[0] - 12, time, program.bassWave, 0.22);
    }
    // Soft hats on off-beats for dance-floor eras.
    if (program.hats && step % 4 === 2) {
      this.scheduleHat(time);
    }
  }

  private schedulePad(midi: number, time: number, voiceIndex: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = getProgram(this.programId).padWave;
    osc.frequency.value = midiToFreq(midi);
    osc.detune.value = (voiceIndex % 2 === 0 ? 1 : -1) * 4;

    const g = ctx.createGain();
    const dur = (60 / getProgram(this.programId).bpm) * 4;
    const peak = 0.07;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(peak, time + dur * 0.35);
    g.gain.linearRampToValueAtTime(0, time + dur);

    osc.connect(g).connect(this.musicBus! as unknown as AudioNode);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  private schedulePluck(midi: number, time: number, wave: OscillatorType, peak: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = midiToFreq(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    osc.connect(g).connect(this.musicBus! as unknown as AudioNode);
    osc.start(time);
    osc.stop(time + 0.4);
  }

  private scheduleHat(time: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 6000 + Math.random() * 2000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.015, time);
    g.gain.exponentialRampToValueAtTime(0.0005, time + 0.06);
    osc.connect(g).connect(this.musicBus! as unknown as AudioNode);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  /** Espresso-machine hiss + occasional cup clatter on the SFX bus. */
  private scheduleCoffeeSfx(ctx: AudioContext, time: number): void {
    if (!this.sfxBus) return;
    const hiss = ctx.createOscillator();
    hiss.type = "sawtooth";
    hiss.frequency.setValueAtTime(3200 + Math.random() * 900, time);
    hiss.frequency.exponentialRampToValueAtTime(2200, time + 0.7);
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0.0001, time);
    hg.gain.linearRampToValueAtTime(0.02, time + 0.12);
    hg.gain.exponentialRampToValueAtTime(0.0001, time + 0.75);
    hiss.connect(hg).connect(this.sfxBus as unknown as AudioNode);
    hiss.start(time);
    hiss.stop(time + 0.8);

    if (Math.random() < 0.4) {
      const clink = ctx.createOscillator();
      clink.type = "sine";
      clink.frequency.setValueAtTime(2400, time + 0.9);
      clink.frequency.exponentialRampToValueAtTime(1700, time + 0.98);
      const cg = ctx.createGain();
      cg.gain.setValueAtTime(0.03, time + 0.9);
      cg.gain.exponentialRampToValueAtTime(0.0001, time + 1.05);
      clink.connect(cg).connect(this.sfxBus as unknown as AudioNode);
      clink.start(time + 0.9);
      clink.stop(time + 1.1);
    }
  }
}

/** App-wide singleton. UI components import this instance. */
export const audioEngine = new AudioEngine();
