/**
 * AudioEngine.ts — Web Audio engine for the Café Time Period Timelapse.
 *
 * Provides three continuously-playing layered ambient beds:
 *
 *   1. **Conversation murmur** — a low, formant-filtered noise bed that evokes
 *      the babble of overlapping voices in a busy café. Loudness grows in the
 *      busier modern eras.
 *   2. **Coffee machine hiss/clatter** — a continuous filtered-noise steam hiss
 *      punctuated by periodic transient "clatter" events (cups, spoons,
 *      portafilter). Spatialized at the scene's coffee-machine object.
 *   3. **Period-appropriate music bed** — a generative tonal loop whose timbre
 *      matches the era's music-source object (wireless set → jukebox → boombox
 *      → iPod → phone → streaming). Spatialized at the era's music-source
 *      object.
 *
 * All sound is synthesized procedurally via the Web Audio API — no external or
 * copyrighted audio assets are shipped. The per-era synthesis recipe is read
 * from the {@link EraAudioConfig} contract on {@link EraData}.
 *
 * Design notes
 * ------------
 * - **Autoplay policy**: no audio is produced until `unlock()` is called after
 *   a user gesture. `resume()` creates/resumes the AudioContext; before the
 *   first unlock, `setEra()` only records the target era so the beds can be
 *   spun up immediately once unlocked.
 * - **Spatialization**: the coffee-machine and music beds each pass through a
 *   `PannerNode` whose `positionX/Y/Z` is set from {@link EraSpatialConfig},
 *   matching the visible in-scene object. The murmur bed is non-spatialized
 *   (ambient) because café chatter surrounds the listener.
 * - **Crossfade**: on era change each bed's master gain is ramped to zero over
 *   {@link AUDIO_CROSSFADE_SECONDS}, the synthesis recipe is swapped, and the
 *   gain is ramped back up — a symmetric in/out crossfade per layer.
 * - **Mute**: a global mute gain node sits between every layer and the
 *   destination; `setMuted(true)` ramps it to zero so the audio graph keeps
 *   running (no clicks).
 */
import {
  AUDIO_CROSSFADE_SECONDS,
  type EraAudioConfig,
  type EraYear,
} from '../data/EraData.js';
import { getEra } from '../data/eras.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Master output ceiling, to keep the layered beds from clipping. */
const MASTER_GAIN = 0.8;

/** Seconds for the mute toggle to ramp (avoids clicks). */
const MUTE_FADE_SECONDS = 0.15;

/** Listener (camera) position — the "ears" of the café visitor. */
const LISTENER_POSITION: Readonly<Record<'x' | 'y' | 'z', number>> = {
  x: 0,
  y: 2,
  z: 5,
};

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Emitted when the engine starts producing audio (first user gesture). */
export interface AudioEngineUnlockInfo {
  /** The era the engine initialized with. */
  readonly era: EraYear;
}

/** Emitted when a crossfade between two eras' beds completes. */
export interface AudioEngineCrossfadeInfo {
  readonly fromYear: EraYear | null;
  readonly toYear: EraYear;
}

/** Callbacks the host can wire to react to engine lifecycle events. */
export interface AudioEngineCallbacks {
  onUnlock?: (info: AudioEngineUnlockInfo) => void;
  onCrossfadeComplete?: (info: AudioEngineCrossfadeInfo) => void;
}

// ---------------------------------------------------------------------------
// Internal layer state
// ---------------------------------------------------------------------------

/**
 * One continuously-synthesized ambient bed. Each concrete bed (murmur, coffee,
 * music) owns its graph nodes and knows how to (re)build itself for an era and
 * ramp its master gain for crossfades.
 */
interface AudioBed {
  /** Ramp this bed's master gain to `value` over `seconds`. */
  rampTo(value: number, seconds: number): void;
  /** Tear down and rebuild this bed's synthesis graph for a new era config. */
  rebuild(config: EraAudioConfig): void;
  /** Permanently stop and disconnect this bed's nodes. */
  dispose(): void;
}

// ===========================================================================
// AudioEngine
// ===========================================================================

/**
 * Central Web Audio engine. Owns the single `AudioContext`, the listener
 * position, the global mute/sum buss, and the three ambient beds. The host
 * (main entrypoint / UI) drives it via {@link unlock}, {@link setEra}, and
 * {@link setMuted}.
 */
export class AudioEngine {
  // --- Core context (created lazily on first unlock) -----------------------
  private ctx: AudioContext | null = null;
  /** Mute buss: ramps to 0 when muted, 1 when unmuted. */
  private muteGain: GainNode | null = null;
  /** A looping short noise buffer reused by hiss / murmur / crackle sources. */
  private noiseBuffer: AudioBuffer | null = null;

  // --- The three layered beds ---------------------------------------------
  private murmurBed: AudioBed | null = null;
  private coffeeBed: AudioBed | null = null;
  private musicBed: AudioBed | null = null;

  // --- State ---------------------------------------------------------------
  private currentEra: EraYear | null = null;
  private pendingEra: EraYear | null = null;
  private muted = false;
  private unlocked = false;
  private readonly callbacks: AudioEngineCallbacks;
  /** Active setTimeout handle for a crossfade finalization, if any. */
  private crossfadeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(callbacks: AudioEngineCallbacks = {}) {
    this.callbacks = callbacks;
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /** Whether the engine has been unlocked by a user gesture. */
  get isUnlocked(): boolean {
    return this.unlocked;
  }

  /** Whether the engine is currently muted. */
  get isMuted(): boolean {
    return this.muted;
  }

  /** The era the engine is currently rendering (or pending, pre-unlock). */
  get era(): EraYear | null {
    return this.currentEra ?? this.pendingEra;
  }

  /**
   * Unlock the audio engine after a user gesture. Creates (or resumes) the
   * `AudioContext`, builds the sum/mute buss, positions the listener, and
   * spins up all three beds for the current (or pending) era. Safe to call
   * repeatedly — only the first call boots the graph.
   */
  unlock(): void {
    if (this.unlocked) {
      // Already booted — just ensure the context is running (browsers may
      // suspend it in the background).
      void this.ctx?.resume();
      return;
    }

    const era = this.pendingEra ?? this.currentEra ?? this.defaultEra();
    this.pendingEra = null;
    this.bootContext(era);
    this.unlocked = true;
    this.callbacks.onUnlock?.({ era });
  }

  /**
   * Switch the era whose beds are playing. If the engine is already unlocked,
   * the three layers crossfade from the old era's recipe to the new one's.
   * If not yet unlocked, the target era is recorded as pending so the beds
   * build for it on the first unlock.
   */
  setEra(year: EraYear): void {
    if (!this.unlocked) {
      // Defer until unlock; just remember what to play.
      this.pendingEra = year;
      this.currentEra = year;
      return;
    }

    if (year === this.currentEra) return;

    const fromYear = this.currentEra;
    const config = getEra(year).audio;
    const duration = config.crossfadeSeconds ?? AUDIO_CROSSFADE_SECONDS;

    // Symmetric per-layer crossfade: ramp out, swap recipe, ramp in.
    for (const bed of this.beds()) {
      bed.rampTo(0, duration / 2);
    }

    // After the ramp-out half, rebuild each bed for the new era and ramp in.
    const halfMs = (duration / 2) * 1000;
    this.clearCrossfadeTimer();
    this.crossfadeTimer = setTimeout(() => {
      if (!this.ctx) return;
      for (const bed of this.beds()) {
        bed.rebuild(config);
        bed.rampTo(1, duration / 2);
      }
      this.currentEra = year;
      this.callbacks.onCrossfadeComplete?.({ fromYear, toYear: year });
    }, halfMs);

    // Optimistically record the target so reads during the fade see it.
    this.currentEra = year;
  }

  /**
   * Mute or unmute all audio. Ramps the mute buss to avoid clicks. When
   * unmuting, if the engine isn't unlocked yet this is a no-op (there's
   * nothing to unmute).
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.ctx || !this.muteGain) return;
    const target = muted ? 0 : 1;
    const now = this.ctx.currentTime;
    this.muteGain.gain.cancelScheduledValues(now);
    this.muteGain.gain.setValueAtTime(this.muteGain.gain.value, now);
    this.muteGain.gain.linearRampToValueAtTime(target, now + MUTE_FADE_SECONDS);
  }

  /** Toggle mute and return the new muted state. */
  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Permanently tear down the entire audio graph and release resources. */
  dispose(): void {
    this.clearCrossfadeTimer();
    this.murmurBed?.dispose();
    this.coffeeBed?.dispose();
    this.musicBed?.dispose();
    this.murmurBed = null;
    this.coffeeBed = null;
    this.musicBed = null;
    void this.ctx?.close();
    this.ctx = null;
    this.muteGain = null;
    this.noiseBuffer = null;
    this.unlocked = false;
    this.currentEra = null;
    this.pendingEra = null;
  }

  // -------------------------------------------------------------------------
  // Internals — context boot & shared resources
  // -------------------------------------------------------------------------

  /** The first canonical era (1945), used if none was set before unlock. */
  private defaultEra(): EraYear {
    return 1945;
  }

  /** Create the AudioContext, buss, listener, noise buffer, and all beds. */
  private bootContext(era: EraYear): void {
    const Ctor: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext ??
      AudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;

    // --- Sum → mute → destination buss --------------------------------------
    const sumGain = ctx.createGain();
    sumGain.gain.value = MASTER_GAIN;
    const muteGain = ctx.createGain();
    muteGain.gain.value = this.muted ? 0 : 1;
    sumGain.connect(muteGain).connect(ctx.destination);
    this.muteGain = muteGain;

    // --- Listener position (the café visitor's ears) ------------------------
    const listener = ctx.listener;
    this.positionListener(listener);

    // --- Shared looping noise buffer (2 s) ----------------------------------
    this.noiseBuffer = this.createNoiseBuffer(ctx, 2);

    const config = getEra(era).audio;
    this.currentEra = era;

    // --- Build the three beds into the buss ---------------------------------
    this.murmurBed = new MurmurBed(ctx, sumGain, this.noiseBuffer);
    this.coffeeBed = new CoffeeMachineBed(ctx, sumGain, this.noiseBuffer);
    this.musicBed = new MusicBed(ctx, sumGain, this.noiseBuffer);

    for (const bed of this.beds()) {
      bed.rebuild(config);
      // Fade in from silence so the first era doesn't slam on.
      bed.rampTo(1, AUDIO_CROSSFADE_SECONDS);
    }

    // Resume in case the context was created suspended (autoplay policy).
    void ctx.resume();
  }

  /** Position the AudioListener at the camera/listener coordinates. */
  private positionListener(listener: AudioListener): void {
    // Guard across browser implementations (positionX/Y/Z vs setPosition).
    if ('positionX' in listener) {
      const x = listener.positionX as AudioParam;
      const y = listener.positionY as AudioParam;
      const z = listener.positionZ as AudioParam;
      x.value = LISTENER_POSITION.x;
      y.value = LISTENER_POSITION.y;
      z.value = LISTENER_POSITION.z;
      if ('forwardX' in listener) {
        (listener.forwardX as AudioParam).value = 0;
        (listener.forwardY as AudioParam).value = 0;
        (listener.forwardZ as AudioParam).value = -1;
      }
    } else {
      // Legacy fallback (deprecated but still widely implemented).
      (listener as unknown as {
        setPosition: (x: number, y: number, z: number) => void;
      }).setPosition(
        LISTENER_POSITION.x,
        LISTENER_POSITION.y,
        LISTENER_POSITION.z,
      );
    }
  }

  /** Render `seconds` of white noise into a reusable looping AudioBuffer. */
  private createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /** The currently live beds (non-null after boot). */
  private beds(): AudioBed[] {
    return [this.murmurBed, this.coffeeBed, this.musicBed].filter(
      (b): b is AudioBed => b !== null,
    );
  }

  /** Clear any pending crossfade finalization timer. */
  private clearCrossfadeTimer(): void {
    if (this.crossfadeTimer !== null) {
      clearTimeout(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
  }
}

// ===========================================================================
// Bed: conversation murmur (ambient, non-spatialized)
// ===========================================================================

/**
 * A babble of overlapping café voices: several bandpass-filtered noise sources
 * whose center frequencies drift gently, summing to a formant-ish murmur. The
 * bed is ambient (no PannerNode) because chatter surrounds the listener.
 */
class MurmurBed implements AudioBed {
  private readonly ctx: AudioContext;
  private readonly noiseBuffer: AudioBuffer;
  private readonly master: GainNode;
  /** Per-voice source+gain chains, rebuilt per era. */
  private voices: { src: AudioScheduledSourceNode; gain: GainNode }[] = [];

  constructor(ctx: AudioContext, destination: AudioNode, noiseBuffer: AudioBuffer) {
    this.ctx = ctx;
    this.noiseBuffer = noiseBuffer;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(destination);
  }

  rampTo(value: number, seconds: number): void {
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(value, now + seconds);
  }

  rebuild(config: EraAudioConfig): void {
    this.disposeVoices();
    const { voiceCount, gain } = config.murmur;
    // Formant-ish bandpass centers spanning the human speech range.
    const centers = [500, 800, 1100, 1500, 2000, 2500];
    for (let i = 0; i < voiceCount; i++) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      src.playbackRate.value = 0.8 + Math.random() * 0.4;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = centers[i % centers.length] * (0.9 + Math.random() * 0.2);
      bp.Q.value = 4;

      const voiceGain = this.ctx.createGain();
      voiceGain.gain.value = (1 / voiceCount) * 0.6;

      // Gentle LFO on the filter center so each "voice" wobbles like speech.
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 2 + Math.random() * 3;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = bp.frequency.value * 0.15;
      lfo.connect(lfoGain).connect(bp.frequency);
      lfo.start();

      src.connect(bp).connect(voiceGain).connect(this.master);
      src.start();
      this.voices.push({ src: lfo, gain: lfoGain });
      this.voices.push({ src, gain: voiceGain });
    }
    // Scale the whole bed by the era's murmur gain.
    this.master.gain.value = gain;
  }

  dispose(): void {
    this.disposeVoices();
    this.master.disconnect();
  }

  private disposeVoices(): void {
    for (const v of this.voices) {
      try {
        v.src.stop();
      } catch {
        /* already stopped */
      }
      v.gain.disconnect();
    }
    this.voices = [];
  }
}

// ===========================================================================
// Bed: coffee machine hiss + clatter (spatialized at the machine)
// ===========================================================================

/**
 * Continuous filtered-noise steam hiss plus intermittent transient clatter
 * events (cups, spoons, portafilter). The whole bed is routed through a
 * PannerNode positioned at the coffee machine so the sound emanates from the
 * back counter.
 */
class CoffeeMachineBed implements AudioBed {
  private readonly ctx: AudioContext;
  private readonly noiseBuffer: AudioBuffer;
  private readonly master: GainNode;
  private readonly panner: PannerNode;
  private hissSource: AudioBufferSourceNode | null = null;
  private hissFilter: BiquadFilterNode | null = null;
  private clatterTimer: ReturnType<typeof setInterval> | null = null;

  constructor(ctx: AudioContext, destination: AudioNode, noiseBuffer: AudioBuffer) {
    this.ctx = ctx;
    this.noiseBuffer = noiseBuffer;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.panner = ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;
    this.panner.maxDistance = 30;
    this.panner.rolloffFactor = 1;
    this.master.connect(this.panner).connect(destination);
  }

  rampTo(value: number, seconds: number): void {
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(value, now + seconds);
  }

  rebuild(config: EraAudioConfig): void {
    this.stopHiss();
    this.stopClatter();

    const { hissGain, hissCutoff, clatterRate, clatterGain } = config.coffeeMachine;
    const { coffeeMachine } = config.spatial;

    // Position the panner at the coffee machine.
    this.setPannerPosition(this.panner, coffeeMachine.x, coffeeMachine.y, coffeeMachine.z);

    // --- Continuous steam hiss (looping filtered noise) -------------------
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = hissCutoff;
    lp.Q.value = 0.5;
    const hissGainNode = this.ctx.createGain();
    hissGainNode.gain.value = hissGain;
    src.connect(lp).connect(hissGainNode).connect(this.master);
    src.start();
    this.hissSource = src;
    this.hissFilter = lp;

    // --- Intermittent clatter transients ----------------------------------
    this.master.gain.value = 1; // master scales the bed; per-element gains set above
    if (clatterRate > 0 && clatterGain > 0) {
      const intervalMs = (1 / clatterRate) * 1000;
      this.clatterTimer = setInterval(() => {
        this.spawnClatter(clatterGain);
      }, intervalMs);
    }
  }

  /** Spawn one short clatter transient (filtered noise burst). */
  private spawnClatter(gain: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = false;
    // A short slice of noise.
    const dur = 0.04 + Math.random() * 0.08;
    const bp = this.ctx.createBiquadFilter();
    bp.type = Math.random() > 0.5 ? 'highpass' : 'bandpass';
    bp.frequency.value = 2000 + Math.random() * 4000;
    bp.Q.value = 2;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(gain, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(bp).connect(env).connect(this.master);
    src.start(now);
    src.stop(now + dur + 0.05);
  }

  private setPannerPosition(p: PannerNode, x: number, y: number, z: number): void {
    if ('positionX' in p) {
      (p.positionX as AudioParam).value = x;
      (p.positionY as AudioParam).value = y;
      (p.positionZ as AudioParam).value = z;
    } else {
      (p as unknown as {
        setPosition: (x: number, y: number, z: number) => void;
      }).setPosition(x, y, z);
    }
  }

  private stopHiss(): void {
    if (this.hissSource) {
      try {
        this.hissSource.stop();
      } catch {
        /* already stopped */
      }
      this.hissSource.disconnect();
      this.hissSource = null;
    }
    this.hissFilter?.disconnect();
    this.hissFilter = null;
  }

  private stopClatter(): void {
    if (this.clatterTimer !== null) {
      clearInterval(this.clatterTimer);
      this.clatterTimer = null;
    }
  }

  dispose(): void {
    this.stopHiss();
    this.stopClatter();
    this.panner.disconnect();
    this.master.disconnect();
  }
}

// ===========================================================================
// Bed: period-appropriate generative music (spatialized at the music source)
// ===========================================================================

/**
 * A generative tonal loop: a sustained pad voice plus a scheduler that triggers
 * short melodic note blips on the era's scale. The whole bed passes through a
 * per-era "medium filter" that imprints the playback-medium character (AM-radio
 * bandpass, cassette low-pass, vinyl crackle, etc.) and a PannerNode at the
 * music-source object so the music emanates from the era's device.
 */
class MusicBed implements AudioBed {
  private readonly ctx: AudioContext;
  private readonly noiseBuffer: AudioBuffer;
  private readonly master: GainNode;
  private readonly panner: PannerNode;
  private padOsc: OscillatorNode | null = null;
  private padGain: GainNode | null = null;
  private mediumFilter: BiquadFilterNode | null = null;
  private crackleSource: AudioBufferSourceNode | null = null;
  private noteTimer: ReturnType<typeof setInterval> | null = null;
  private wowLfo: OscillatorNode | null = null;
  private detuneGain: GainNode | null = null;
  private currentRoot = 220;
  private currentScale: readonly number[] = [0, 4, 7];

  constructor(ctx: AudioContext, destination: AudioNode, noiseBuffer: AudioBuffer) {
    this.ctx = ctx;
    this.noiseBuffer = noiseBuffer;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.panner = ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;
    this.panner.maxDistance = 30;
    this.panner.rolloffFactor = 1;
    this.master.connect(this.panner).connect(destination);
  }

  rampTo(value: number, seconds: number): void {
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(value, now + seconds);
  }

  rebuild(config: EraAudioConfig): void {
    this.stopAll();

    const { music, spatial } = config;
    const {
      timbre,
      rootFrequency,
      scale,
      waveform,
      notesPerSecond,
      mediumFilter: mf,
      crackle,
      wow,
      gain,
    } = music;

    this.currentRoot = rootFrequency;
    this.currentScale = scale;
    this.setPannerPosition(
      this.panner,
      spatial.musicSource.x,
      spatial.musicSource.y,
      spatial.musicSource.z,
    );

    // --- Medium-character filter (imprints the playback medium) -----------
    const mediumFilter = this.ctx.createBiquadFilter();
    mediumFilter.type = mf.type;
    mediumFilter.frequency.value = mf.frequency;
    mediumFilter.Q.value = mf.Q;
    mediumFilter.connect(this.master);
    this.mediumFilter = mediumFilter;

    // --- Sustained pad voice ---------------------------------------------
    const padOsc = this.ctx.createOscillator();
    padOsc.type = waveform;
    padOsc.frequency.value = rootFrequency;
    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.12;
    padOsc.connect(padGain).connect(mediumFilter);
    padOsc.start();
    this.padOsc = padOsc;
    this.padGain = padGain;

    // --- Tape wow/flutter pitch modulation -------------------------------
    if (wow > 0) {
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 5; // flutter rate
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = rootFrequency * wow * 0.5;
      lfo.connect(lfoGain).connect(padOsc.detune);
      lfo.start();
      this.wowLfo = lfo;
      this.detuneGain = lfoGain;
    }

    // --- Vinyl surface crackle -------------------------------------------
    if (crackle > 0) {
      const crackleSrc = this.ctx.createBufferSource();
      crackleSrc.buffer = this.noiseBuffer;
      crackleSrc.loop = true;
      crackleSrc.playbackRate.value = 1.5;
      // High-pass to isolate the ticky crackle texture.
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 4000;
      const cg = this.ctx.createGain();
      cg.gain.value = crackle;
      crackleSrc.connect(hp).connect(cg).connect(mediumFilter);
      crackleSrc.start();
      this.crackleSource = crackleSrc;
    }

    // --- Generative melodic note scheduler -------------------------------
    if (notesPerSecond > 0) {
      const intervalMs = (1 / notesPerSecond) * 1000;
      this.noteTimer = setInterval(() => {
        this.spawnNote(timbre, waveform, gain);
      }, intervalMs);
    }

    this.master.gain.value = gain;
  }

  /** Spawn one short melodic note blip from the era's scale. */
  private spawnNote(timbre: string, waveform: OscillatorType, gain: number): void {
    if (!this.ctx || !this.mediumFilter) return;
    const scale = this.currentScale;
    const semitone = scale[Math.floor(Math.random() * scale.length)];
    const octave = Math.random() > 0.5 ? 2 : 1;
    const freq = this.currentRoot * Math.pow(2, (semitone / 12) * octave);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = waveform;
    osc.frequency.value = freq;
    const env = this.ctx.createGain();
    const peak = gain * 0.18;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.03);
    // AM-radio notes decay faster; spatial-audio notes ring longer.
    const decay = timbre === 'am-radio' ? 0.4 : 1.2;
    env.gain.exponentialRampToValueAtTime(0.0001, now + decay);
    osc.connect(env).connect(this.mediumFilter);
    osc.start(now);
    osc.stop(now + decay + 0.1);
  }

  private setPannerPosition(p: PannerNode, x: number, y: number, z: number): void {
    if ('positionX' in p) {
      (p.positionX as AudioParam).value = x;
      (p.positionY as AudioParam).value = y;
      (p.positionZ as AudioParam).value = z;
    } else {
      (p as unknown as {
        setPosition: (x: number, y: number, z: number) => void;
      }).setPosition(x, y, z);
    }
  }

  private stopAll(): void {
    if (this.padOsc) {
      try {
        this.padOsc.stop();
      } catch {
        /* already stopped */
      }
      this.padOsc.disconnect();
      this.padOsc = null;
    }
    this.padGain?.disconnect();
    this.padGain = null;
    this.mediumFilter?.disconnect();
    this.mediumFilter = null;
    if (this.crackleSource) {
      try {
        this.crackleSource.stop();
      } catch {
        /* already stopped */
      }
      this.crackleSource.disconnect();
      this.crackleSource = null;
    }
    if (this.wowLfo) {
      try {
        this.wowLfo.stop();
      } catch {
        /* already stopped */
      }
      this.wowLfo.disconnect();
      this.wowLfo = null;
    }
    this.detuneGain?.disconnect();
    this.detuneGain = null;
    if (this.noteTimer !== null) {
      clearInterval(this.noteTimer);
      this.noteTimer = null;
    }
  }

  dispose(): void {
    this.stopAll();
    this.panner.disconnect();
    this.master.disconnect();
  }
}

// ---------------------------------------------------------------------------
// Shared process-wide instance (lazy, SSR-safe)
// ---------------------------------------------------------------------------

/**
 * Shared AudioEngine instance. Created lazily so importing this module never
 * constructs an AudioContext during SSR or the `check:eras` Node gate. The host
 * should call {@link getAudioEngine().unlock} after the first user gesture.
 */
let sharedEngine: AudioEngine | null = null;

/** Get (creating if necessary) the shared AudioEngine instance. */
export function getAudioEngine(callbacks?: AudioEngineCallbacks): AudioEngine {
  if (!sharedEngine) sharedEngine = new AudioEngine(callbacks);
  return sharedEngine;
}

/** Reset the shared engine (primarily for tests). */
export function resetAudioEngine(): void {
  sharedEngine?.dispose();
  sharedEngine = null;
}
