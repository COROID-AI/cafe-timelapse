/**
 * AudioEngine — procedural Web Audio engine for the Café Time Period Timelapse.
 *
 * Plays three layered ambient beds per era (see src/systems/audioProfiles.ts):
 *
 *   1. conversation murmur — a continuous filtered-noise loop whose level
 *      follows the era's crowd density;
 *   2. coffee machine hiss/clatter — a noise hiss bed plus scheduled filtered
 *      clatter bursts, spatialised at the era's brewing equipment;
 *   3. period-appropriate music — a generative tonal loop whose *source
 *      object* (wireless set → jukebox → boombox → iPod → phone/speaker) and
 *      sonic character (tempo, scale, waveform, filtering, hiss/crackle)
 *      change per era.
 *
 * The coffee machine and the music source are spatialised through PannerNodes
 * positioned at their in-scene objects. Layers crossfade on era change.
 *
 * Everything is synthesised procedurally (noise buffers, filtered noise and
 * oscillator sequences) — no copyrighted audio is shipped.
 *
 * Autoplay policy: the AudioContext is created lazily on the first call to
 * `unlock()`, which must happen from a user gesture (see main.ts). Until then
 * the engine is inert. `update()` should be called every frame so the
 * lookahead scheduler stays ahead of `currentTime`.
 */
import { getAudioProfile, DEFAULT_ERA } from './audioProfiles';
import type { AudioEraProfile, MusicProfile } from './audioProfiles';
import type { EraYear } from '../data/eras';
import type { MusicSourceKind } from '../data/EraData';

/** How far ahead (seconds) the generative schedulers place notes/SFX. */
const SCHEDULE_LOOKAHEAD = 0.12;
/** Default layer crossfade duration in seconds. */
const CROSSFADE_SECONDS = 1.2;

export interface AudioEngineOptions {
  /** Duration of layer crossfades on era change (seconds). */
  crossfadeSeconds?: number;
  /** Initial era whose profile plays (defaults to the first era). */
  initialEra?: EraYear;
  /** Test hook: supplies the AudioContext instead of the browser global. */
  audioContextFactory?: () => AudioContext;
}

/** One generative music bed (one era's source object). */
interface MusicChain {
  profile: MusicProfile;
  /** Crossfade bus for this chain. */
  gain: GainNode;
  /** Era character filter (vinyl warmth, jukebox honk, cassette body, …). */
  filter: BiquadFilterNode;
  /** Spatialiser positioned at the era's in-scene music source object. */
  panner: PannerNode;
  /** Source-object hiss bed (vinyl / tape / cassette noise). */
  noiseSource: AudioBufferSourceNode | null;
  noiseFilter: BiquadFilterNode | null;
  noiseGain: GainNode | null;
  /** Lookahead scheduler state. */
  nextNoteTime: number;
  stepIndex: number;
  nextCrackleTime: number;
  stopped: boolean;
}

/** Apply the shared spatialisation profile to a panner. */
function configurePanner(panner: PannerNode): void {
  panner.panningModel = 'equalpower';
  panner.distanceModel = 'inverse';
  panner.refDistance = 1;
  panner.maxDistance = 18;
  panner.rolloffFactor = 1.1;
}

export class AudioEngine {
  private readonly crossfadeSeconds: number;
  private readonly audioContextFactory?: () => AudioContext;

  private ctx: AudioContext | null = null;
  private unlocked = false;
  private _muted = false;
  private currentEra: EraYear;
  private profile: AudioEraProfile;

  // --- Audio graph (created on unlock) ------------------------------------
  private masterGain: GainNode | null = null;
  private murmurGain: GainNode | null = null;
  private coffeeGain: GainNode | null = null;
  private coffeePanner: PannerNode | null = null;
  private clatterGain: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private reverbSend: GainNode | null = null;
  private reverbReturn: GainNode | null = null;

  // --- Shared procedural buffers ------------------------------------------
  private murmurBuffer: AudioBuffer | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private clatterBuffer: AudioBuffer | null = null;
  private crackleBuffer: AudioBuffer | null = null;

  // --- Scheduler state -----------------------------------------------------
  private musicChain: MusicChain | null = null;
  private readonly chains: MusicChain[] = [];
  private readonly loopSources: AudioBufferSourceNode[] = [];
  private nextClatterTime = 0;

  constructor(options: AudioEngineOptions = {}) {
    this.crossfadeSeconds = options.crossfadeSeconds ?? CROSSFADE_SECONDS;
    this.audioContextFactory = options.audioContextFactory;
    this.currentEra = options.initialEra ?? DEFAULT_ERA;
    this.profile = getAudioProfile(this.currentEra);
  }

  /** The era whose audio profile is currently active. */
  get activeEra(): EraYear {
    return this.currentEra;
  }

  /** True once `unlock()` has created an AudioContext (first user gesture). */
  get isUnlocked(): boolean {
    return this.unlocked;
  }

  /** Current mute state (mute ramps the master gain, not the layer gains). */
  get muted(): boolean {
    return this._muted;
  }

  /** The music source-object kind of the active era. */
  get musicSourceKind(): MusicSourceKind {
    return this.profile.music.kind;
  }

  /** Human-readable description of the active era's music source. */
  get musicSourceLabel(): string {
    return this.profile.music.label;
  }

  /**
   * Create (once) and resume the AudioContext. Call from a user gesture to
   * satisfy the autoplay policy; calling again simply retries `resume()`.
   */
  async unlock(): Promise<void> {
    if (!this.ctx) {
      const ctx = this.createContext();
      this.ctx = ctx;
      this.createBuffers(ctx);
      this.buildGraph(ctx);
      this.startLoops(ctx);
      this.applyProfile(ctx, this.profile, 0);
    }
    this.unlocked = true;
    if (this.ctx.state !== 'running') {
      try {
        await this.ctx.resume();
      } catch {
        // Autoplay policy may keep the context suspended until a later gesture.
      }
    }
  }

  /**
   * Advance the generative schedulers. Call every frame; optionally pass the
   * camera position so the audio listener follows the navigator.
   */
  update(listenerPosition?: { x: number; y: number; z: number }): void {
    if (!this.unlocked || !this.ctx) return;
    if (listenerPosition) {
      this.ctx.listener.setPosition(
        listenerPosition.x,
        listenerPosition.y,
        listenerPosition.z,
      );
    }
    this.pruneChains();
    this.scheduleMusic();
    this.scheduleClatter();
  }

  /** Switch to another era, crossfading every layer. */
  setEra(era: EraYear): void {
    if (era === this.currentEra) return;
    this.currentEra = era;
    this.profile = getAudioProfile(era);
    if (!this.ctx) return; // applied on unlock()
    this.applyProfile(this.ctx, this.profile, this.crossfadeSeconds);
  }

  /** Toggle the master mute with a short fade. */
  setMuted(muted: boolean): void {
    if (muted === this._muted) return;
    this._muted = muted;
    if (!this.ctx || !this.masterGain) return;
    this.ramp(this.masterGain.gain, muted ? 0 : 1, 0.15);
  }

  /** Reposition the coffee machine panner (scene fragments may call this). */
  setCoffeeMachinePosition(x: number, y: number, z: number): void {
    this.coffeePanner?.setPosition(x, y, z);
  }

  /** Reposition the active music source panner. */
  setMusicPosition(x: number, y: number, z: number): void {
    this.musicChain?.panner.setPosition(x, y, z);
  }

  /** Stop all sources and close the AudioContext. */
  dispose(): void {
    for (const source of this.loopSources) {
      try {
        source.stop();
      } catch {
        // Already stopped (e.g. an old chain faded out on era change).
      }
    }
    this.loopSources.length = 0;
    if (this.ctx) {
      void this.ctx.close();
    }
    this.ctx = null;
    this.unlocked = false;
    this.musicChain = null;
    this.chains.length = 0;
    this.masterGain = null;
    this.murmurGain = null;
    this.coffeeGain = null;
    this.coffeePanner = null;
    this.clatterGain = null;
    this.musicBus = null;
    this.reverbSend = null;
    this.reverbReturn = null;
    this.murmurBuffer = null;
    this.noiseBuffer = null;
    this.clatterBuffer = null;
    this.crackleBuffer = null;
  }

  // --- Construction --------------------------------------------------------

  private createContext(): AudioContext {
    if (this.audioContextFactory) return this.audioContextFactory();
    const Ctor = globalThis.AudioContext;
    if (!Ctor) {
      throw new Error(
        'Web Audio is not available in this environment; call unlock() from a user gesture in a browser.',
      );
    }
    return new Ctor();
  }

  private createBuffers(ctx: AudioContext): void {
    this.murmurBuffer = this.createNoiseBuffer(ctx, 4);
    this.noiseBuffer = this.createNoiseBuffer(ctx, 4);
    this.clatterBuffer = this.createNoiseBuffer(ctx, 0.14);
    this.crackleBuffer = this.createNoiseBuffer(ctx, 0.02);
  }

  private buildGraph(ctx: AudioContext): void {
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(ctx.destination);

    // Murmur bed (ambient, not spatialised).
    this.murmurGain = ctx.createGain();
    this.murmurGain.gain.value = 0;
    this.murmurGain.connect(this.masterGain);

    // Coffee bed, spatialised at the era's brewing equipment.
    this.coffeePanner = ctx.createPanner();
    configurePanner(this.coffeePanner);
    this.coffeeGain = ctx.createGain();
    this.coffeeGain.gain.value = 0;
    this.coffeeGain.connect(this.coffeePanner);
    this.coffeePanner.connect(this.masterGain);
    this.clatterGain = ctx.createGain();
    this.clatterGain.gain.value = 1;
    this.clatterGain.connect(this.coffeeGain);

    // Music bus; each era's chain feeds its own spatialised panner into it.
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 1;
    this.musicBus.connect(this.masterGain);

    // Shared generative reverb (impulse from decaying noise).
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0;
    const convolver = ctx.createConvolver();
    convolver.buffer = this.createImpulseBuffer(ctx, 2.2, 2.5);
    this.reverbReturn = ctx.createGain();
    this.reverbReturn.gain.value = 0.9;
    this.reverbSend.connect(convolver);
    convolver.connect(this.reverbReturn);
    this.reverbReturn.connect(this.masterGain);
  }

  private startLoops(ctx: AudioContext): void {
    // Conversation murmur: two filtered noise layers (mid band + sibilance).
    const murmur = ctx.createBufferSource();
    murmur.buffer = this.murmurBuffer;
    murmur.loop = true;
    const murmurMid = ctx.createBiquadFilter();
    murmurMid.type = 'bandpass';
    murmurMid.frequency.value = 900;
    murmurMid.Q.value = 0.5;
    const murmurMidGain = ctx.createGain();
    murmurMidGain.gain.value = 0.55;
    const murmurSib = ctx.createBiquadFilter();
    murmurSib.type = 'bandpass';
    murmurSib.frequency.value = 2200;
    murmurSib.Q.value = 0.7;
    const murmurSibGain = ctx.createGain();
    murmurSibGain.gain.value = 0.3;
    murmur.connect(murmurMid);
    murmurMid.connect(murmurMidGain);
    murmurMidGain.connect(this.murmurGain!);
    murmur.connect(murmurSib);
    murmurSib.connect(murmurSibGain);
    murmurSibGain.connect(this.murmurGain!);
    murmur.start(ctx.currentTime + 0.03);
    this.loopSources.push(murmur);

    // Coffee machine hiss: high-passed noise at the machine position.
    const hiss = ctx.createBufferSource();
    hiss.buffer = this.noiseBuffer;
    hiss.loop = true;
    const hissFilter = ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 2600;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 1;
    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.coffeeGain!);
    hiss.start(ctx.currentTime + 0.03);
    this.loopSources.push(hiss);

    this.nextClatterTime = ctx.currentTime + 0.1;
  }

  private applyProfile(ctx: AudioContext, profile: AudioEraProfile, fade: number): void {
    const now = ctx.currentTime;

    // Continuous beds simply ramp to the new era's levels.
    this.ramp(this.murmurGain!.gain, profile.murmur.level, fade);
    this.ramp(this.coffeeGain!.gain, profile.coffee.hissLevel, fade);

    // Music: build a fresh chain for the new era's source object and crossfade
    // it against the outgoing chain.
    const old = this.musicChain;
    const next = this.createMusicChain(ctx, profile);
    this.musicChain = next;
    this.chains.push(next);
    if (fade > 0) {
      next.gain.gain.setValueAtTime(0, now);
      next.gain.gain.linearRampToValueAtTime(1, now + fade);
    } else {
      next.gain.gain.value = 1;
    }
    this.ramp(this.reverbSend!.gain, profile.music.reverb, fade);

    if (old) {
      old.stopped = true;
      this.ramp(old.gain.gain, 0, fade);
      if (old.noiseSource) {
        old.noiseSource.stop(now + fade + 0.05);
      }
    }

    // Spatialise the coffee machine at the era's brewing equipment.
    this.coffeePanner!.setPosition(
      profile.coffee.position[0],
      profile.coffee.position[1],
      profile.coffee.position[2],
    );
  }

  private createMusicChain(ctx: AudioContext, eraProfile: AudioEraProfile): MusicChain {
    const profile = eraProfile.music;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = profile.filterType;
    filter.frequency.value = profile.filterFrequency;
    filter.Q.value = profile.filterQ;
    const panner = ctx.createPanner();
    configurePanner(panner);
    panner.setPosition(
      eraProfile.musicPosition[0],
      eraProfile.musicPosition[1],
      eraProfile.musicPosition[2],
    );
    gain.connect(filter);
    filter.connect(panner);
    panner.connect(this.musicBus!);
    gain.connect(this.reverbSend!);

    let noiseSource: AudioBufferSourceNode | null = null;
    let noiseFilter: BiquadFilterNode | null = null;
    let noiseGain: GainNode | null = null;
    if (profile.noise > 0) {
      // Source-object hiss bed (valve hum, vinyl crackle, cassette hiss…).
      noiseSource = ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      noiseSource.loop = true;
      noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = profile.noiseFilterFrequency;
      noiseFilter.Q.value = 0.6;
      noiseGain = ctx.createGain();
      noiseGain.gain.value = profile.noise;
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(gain);
      noiseSource.start(ctx.currentTime + 0.03);
      this.loopSources.push(noiseSource);
    }

    return {
      profile,
      gain,
      filter,
      panner,
      noiseSource,
      noiseFilter,
      noiseGain,
      nextNoteTime: ctx.currentTime + 0.05,
      stepIndex: 0,
      nextCrackleTime: ctx.currentTime + 0.1,
      stopped: false,
    };
  }

  // --- Generative scheduling ----------------------------------------------

  private scheduleMusic(): void {
    const ctx = this.ctx!;
    const chain = this.musicChain;
    if (!chain || chain.stopped) return;
    const p = chain.profile;
    const step = 60 / p.bpm / 2; // eighth-note step
    while (chain.nextNoteTime < ctx.currentTime + SCHEDULE_LOOKAHEAD) {
      this.scheduleStep(chain, chain.nextNoteTime);
      chain.nextNoteTime += step;
      chain.stepIndex += 1;
    }
    if (p.crackleRate > 0 && chain.nextCrackleTime < ctx.currentTime + SCHEDULE_LOOKAHEAD) {
      this.scheduleCrackle(chain, chain.nextCrackleTime);
      chain.nextCrackleTime += 1 / p.crackleRate;
    }
  }

  private scheduleStep(chain: MusicChain, time: number): void {
    const p = chain.profile;
    const step = 60 / p.bpm / 2;
    const isBarStart = chain.stepIndex % 8 === 0;
    const isOffBeat = chain.stepIndex % 2 === 1;

    // The bass always anchors the bar start; extra bass hits follow the
    // era's bass probability.
    if (isBarStart || Math.random() < p.bassProbability) {
      this.playTone(
        chain,
        time,
        p.rootFrequency / 2,
        step * 3.5,
        0.16,
        'triangle',
      );
    }

    if (p.pad) {
      if (chain.stepIndex % 16 === 0) this.schedulePad(chain, time);
      return;
    }

    if (Math.random() < p.noteProbability || isBarStart) {
      const start = isOffBeat ? time + p.swing * step : time;
      const semitones = p.scale[Math.floor(Math.random() * p.scale.length)];
      const octave = Math.random() < 0.25 ? 12 : 0;
      const frequency = p.rootFrequency * Math.pow(2, (semitones + octave) / 12);
      const amplitude = 0.09 + Math.random() * 0.05;
      this.playTone(chain, start, frequency, step * 0.9, amplitude, p.waveform);
    }
  }

  private playTone(
    chain: MusicChain,
    time: number,
    frequency: number,
    duration: number,
    amplitude: number,
    waveform: OscillatorType,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = waveform;
    osc.frequency.value = frequency;
    osc.detune.value = Math.random() * 8 - 4;
    const g = ctx.createGain();
    const attack = Math.min(0.02, duration * 0.2);
    const release = Math.min(0.06, duration * 0.3);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(amplitude, time + attack);
    g.gain.setValueAtTime(amplitude, time + Math.max(attack, duration - release));
    g.gain.linearRampToValueAtTime(0.0001, time + duration);
    osc.connect(g);
    g.connect(chain.filter);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  private schedulePad(chain: MusicChain, time: number): void {
    const ctx = this.ctx!;
    const p = chain.profile;
    const step = 60 / p.bpm / 2;
    const duration = step * 14;
    for (const semitones of [0, 7, 12]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = p.rootFrequency * Math.pow(2, semitones / 12);
      osc.detune.value = Math.random() * 6 - 3;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(0.05, time + step * 2);
      g.gain.setValueAtTime(0.05, time + duration - step);
      g.gain.linearRampToValueAtTime(0.0001, time + duration);
      osc.connect(g);
      g.connect(chain.filter);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    }
  }

  private scheduleCrackle(chain: MusicChain, time: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.crackleBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.25 + Math.random() * 0.3, time + 0.001);
    g.gain.linearRampToValueAtTime(0.0001, time + 0.03);
    src.connect(hp);
    hp.connect(g);
    g.connect(chain.gain);
    src.start(time);
    src.stop(time + 0.04);
  }

  private scheduleClatter(): void {
    const ctx = this.ctx!;
    const rate = this.profile.coffee.clatterRate;
    if (rate <= 0) return;
    while (this.nextClatterTime < ctx.currentTime + SCHEDULE_LOOKAHEAD) {
      this.playClatterBurst(this.nextClatterTime);
      this.nextClatterTime += 60 / rate;
    }
  }

  /**
   * Drop music chains that finished crossfading out so repeated era switches
   * never accumulate stale gain/filter/panner nodes.
   */
  private pruneChains(): void {
    if (!this.ctx || this.chains.length < 2) return;
    const cutoff = this.ctx.currentTime - this.crossfadeSeconds - 0.5;
    const kept = this.chains.filter(
      (chain) => !chain.stopped || chain.nextNoteTime >= cutoff,
    );
    if (kept.length !== this.chains.length) {
      this.chains.splice(0, this.chains.length, ...kept);
    }
  }

  private playClatterBurst(time: number): void {
    const ctx = this.ctx!;
    const p = this.profile.coffee;
    const src = ctx.createBufferSource();
    src.buffer = this.clatterBuffer;
    src.playbackRate.value = 0.9 + Math.random() * 0.35;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1400;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400 + Math.random() * 1400;
    bp.Q.value = 1 + Math.random();
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.4 - 0.7;
    const g = ctx.createGain();
    const amplitude = p.clatterLevel * (0.4 + Math.random() * 0.5);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(amplitude, time + 0.004);
    g.gain.linearRampToValueAtTime(0.0001, time + 0.1);
    src.connect(hp);
    hp.connect(bp);
    bp.connect(pan);
    pan.connect(g);
    g.connect(this.clatterGain!);
    src.start(time);
    src.stop(time + 0.12);
  }

  // --- Shared helpers ------------------------------------------------------

  /** Cancel scheduled automation and (optionally) ramp `param` to `to`. */
  private ramp(param: AudioParam, to: number, fade: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    if (fade > 0) {
      param.linearRampToValueAtTime(to, now + fade);
    }
  }

  private createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  private createImpulseBuffer(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return buffer;
  }
}
