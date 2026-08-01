/**
 * AudioEngine — generative per-era sound bed with Web Audio spatialization.
 *
 * The engine has no bundled audio files: each era's config
 * (src/audio/eraAudioConfigs.ts) describes layered voices (music bed, machine
 * hiss, patron murmur, room tone) that the engine synthesizes with
 * oscillators and filtered noise. The whole graph is created lazily so the
 * module is safe to import headlessly (CI / QA gates): nothing touches
 * `AudioContext` until {@link unlock} is called from a user gesture
 * (autoplay policy).
 *
 * Responsibilities:
 *  - `unlock()` — create/resume the AudioContext on the onboarding click;
 *  - `setEra(era)` — tear down the previous era's voices and build the new
 *    era's bed, in lockstep with the TransitionController era swap;
 *  - `update(dt, camera)` — move the Web Audio listener with the camera each
 *    frame so layers are heard from the current viewpoint (spatialization);
 *  - `toggleMute()` — master mute for the HUD, without tearing down voices;
 *  - `dispose()` — stop every voice and close the context (no node leaks).
 */
import * as THREE from 'three';
import {
  eraAudioConfigFor,
  type EraAudioLayer,
} from './eraAudioConfigs';

/** One synthesized voice: panner, per-layer gain and teardown closure. */
interface Voice {
  layerId: string;
  gain: GainNode;
  panner: PannerNode;
  stop: () => void;
  position: THREE.Vector3;
}

/** Rough room-space positions (inside the café shell) for layer families. */
const MUSIC_POSITION = new THREE.Vector3(0, 1.4, 3.1);
const MACHINE_POSITION = new THREE.Vector3(0, 1.1, 3.5);
const ROOM_POSITION = new THREE.Vector3(0, 1.6, 0);
const MURMUR_POSITIONS = [
  new THREE.Vector3(-2.6, 1.1, -1.2),
  new THREE.Vector3(2.6, 1.1, -1.2),
  new THREE.Vector3(0, 1.1, -2.4),
];

/** Pick a room position for one layer based on its id / kind. */
function positionForLayer(layer: EraAudioLayer): THREE.Vector3 {
  if (layer.kind === 'ambient-room') return ROOM_POSITION;
  if (layer.id.includes('murmur')) {
    let hash = 0;
    for (let i = 0; i < layer.id.length; i += 1) hash += layer.id.charCodeAt(i);
    return MURMUR_POSITIONS[hash % MURMUR_POSITIONS.length];
  }
  if (
    layer.id.includes('hiss') ||
    layer.id.includes('urn') ||
    layer.id.includes('brew') ||
    layer.id.includes('wand') ||
    layer.id.includes('grinder') ||
    layer.id.includes('superauto')
  ) {
    return MACHINE_POSITION;
  }
  return MUSIC_POSITION;
}

const LISTENER_FORWARD = new THREE.Vector3();
const LISTENER_UP = new THREE.Vector3();

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices: Voice[] = [];
  private targetEra: number | null = null;
  private currentEra: number | null = null;
  private muted = false;

  /** True once a user gesture has created the AudioContext. */
  get isUnlocked(): boolean {
    return this.ctx !== null;
  }

  /** True while the master bus is muted (HUD state). */
  get isMuted(): boolean {
    return this.muted;
  }

  /** The era whose bed is (or will be) playing. */
  get activeEra(): number | null {
    return this.currentEra ?? this.targetEra;
  }

  /**
   * Create / resume the AudioContext. Called from the onboarding click so the
   * browser's autoplay policy allows audio to start.
   */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume?.();
      return;
    }
    const globalScope = globalThis as typeof globalThis & {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = globalScope.AudioContext ?? globalScope.webkitAudioContext;
    if (!Ctor) return;

    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    if (this.targetEra !== null) this.setEra(this.targetEra);
  }

  /**
   * Swap the era's sound bed. Before unlock this only records the target era;
   * the bed is applied when unlock() creates the context.
   */
  setEra(era: number): void {
    this.targetEra = era;
    if (!this.ctx || !this.master) return;
    if (era === this.currentEra) return;

    this.teardownVoices();
    this.currentEra = era;
    const config = eraAudioConfigFor(era);
    const now = this.ctx.currentTime;

    for (const layer of config.layers) {
      if (layer.kind === 'none' || layer.gain <= 0) continue;
      const built = this.buildVoice(this.ctx, layer);
      if (!built) continue;

      const panner = this.ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 2.5;
      panner.maxDistance = 22;
      panner.rolloffFactor = 1;
      const position = positionForLayer(layer);
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(
        Math.min(1, Math.max(0, layer.gain)) * (this.muted ? 0 : 1),
        now + 0.9,
      );

      built.output.connect(panner);
      panner.connect(gain);
      gain.connect(this.master);
      this.voices.push({ layerId: layer.id, gain, panner, stop: built.stop, position });
    }
  }

  /**
   * Per-frame spatialization: move the listener with the camera so the bed is
   * heard from the current viewpoint. No-op until unlocked.
   */
  update(_dt: number, camera: THREE.PerspectiveCamera): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const listener = this.ctx.listener;
    LISTENER_FORWARD.set(0, 0, -1).applyQuaternion(camera.quaternion);
    LISTENER_UP.set(0, 1, 0).applyQuaternion(camera.quaternion);

    if ('positionX' in listener) {
      listener.positionX.setTargetAtTime(camera.position.x, now, 0.08);
      listener.positionY.setTargetAtTime(camera.position.y, now, 0.08);
      listener.positionZ.setTargetAtTime(camera.position.z, now, 0.08);
      listener.forwardX.setTargetAtTime(LISTENER_FORWARD.x, now, 0.08);
      listener.forwardY.setTargetAtTime(LISTENER_FORWARD.y, now, 0.08);
      listener.forwardZ.setTargetAtTime(LISTENER_FORWARD.z, now, 0.08);
      listener.upX.setTargetAtTime(LISTENER_UP.x, now, 0.08);
      listener.upY.setTargetAtTime(LISTENER_UP.y, now, 0.08);
      listener.upZ.setTargetAtTime(LISTENER_UP.z, now, 0.08);
    } else {
      const legacy = listener as unknown as {
        setPosition?: (x: number, y: number, z: number) => void;
        setOrientation?: (
          fx: number,
          fy: number,
          fz: number,
          ux: number,
          uy: number,
          uz: number,
        ) => void;
      };
      legacy.setPosition?.(camera.position.x, camera.position.y, camera.position.z);
      legacy.setOrientation?.(
        LISTENER_FORWARD.x,
        LISTENER_FORWARD.y,
        LISTENER_FORWARD.z,
        LISTENER_UP.x,
        LISTENER_UP.y,
        LISTENER_UP.z,
      );
    }
  }

  /** Flip the master mute; returns the new muted state (for the HUD label). */
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  /** Stop every voice and close the context (no leaked audio nodes). */
  dispose(): void {
    this.teardownVoices();
    if (this.master) {
      this.master.disconnect();
      this.master = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }

  // --- Voice synthesis -----------------------------------------------------

  private teardownVoices(): void {
    for (const voice of this.voices) {
      voice.stop();
      voice.gain.disconnect();
      voice.panner.disconnect();
    }
    this.voices = [];
  }

  /** Build the audio sub-graph for one layer kind. Returns null for silence. */
  private buildVoice(
    ctx: AudioContext,
    layer: EraAudioLayer,
  ): { output: AudioNode; stop: () => void } | null {
    switch (layer.kind) {
      case 'none':
        return null;
      case 'swing-bed':
        return this.padVoice(ctx, 'sawtooth', 110);
      case 'synth-bed':
        return this.padVoice(ctx, 'triangle', 165);
      case 'radio-static':
        return this.filteredNoise(ctx, 'bandpass', 480);
      case 'cassette-hiss':
        return this.filteredNoise(ctx, 'highpass', 3200);
      case 'murmur':
        return this.filteredNoise(ctx, 'lowpass', 750);
      case 'grinder-clatter':
        return this.burstyNoise(ctx, 520, 0.7);
      case 'machine-hiss':
        return this.burstyNoise(ctx, 2800, 0.12);
      case 'ambient-room':
        return this.drone(ctx, 55);
      default:
        return null;
    }
  }

  /** 2-second looping white-noise buffer (shared across voices). */
  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /** Looping filtered noise with a slow filter-frequency LFO. */
  private filteredNoise(
    ctx: AudioContext,
    type: BiquadFilterType,
    frequency: number,
  ): { output: AudioNode; stop: () => void } {
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer(ctx);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = frequency * 0.2;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    source.start();
    lfo.start();

    const stop = (): void => {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
      try {
        lfo.stop();
      } catch {
        /* already stopped */
      }
      source.disconnect();
      filter.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
    };
    return { output: filter, stop };
  }

  /** Two detuned oscillators through a low-pass, with slow detune wander. */
  private padVoice(
    ctx: AudioContext,
    type: OscillatorType,
    baseFrequency: number,
  ): { output: AudioNode; stop: () => void } {
    const osc1 = ctx.createOscillator();
    osc1.type = type;
    osc1.frequency.value = baseFrequency;
    const osc2 = ctx.createOscillator();
    osc2.type = type;
    osc2.frequency.value = baseFrequency * 1.5;

    const wander = ctx.createOscillator();
    wander.frequency.value = 0.15;
    const wanderGain = ctx.createGain();
    wanderGain.gain.value = 4;
    wander.connect(wanderGain);
    wanderGain.connect(osc1.detune);
    wanderGain.connect(osc2.detune);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    osc1.connect(filter);
    osc2.connect(filter);

    osc1.start();
    osc2.start();
    wander.start();

    const stop = (): void => {
      try {
        osc1.stop();
      } catch {
        /* already stopped */
      }
      try {
        osc2.stop();
      } catch {
        /* already stopped */
      }
      try {
        wander.stop();
      } catch {
        /* already stopped */
      }
      osc1.disconnect();
      osc2.disconnect();
      wander.disconnect();
      wanderGain.disconnect();
      filter.disconnect();
    };
    return { output: filter, stop };
  }

  /** Noise gated by a slow LFO → periodic hiss/clatter bursts. */
  private burstyNoise(
    ctx: AudioContext,
    frequency: number,
    rate: number,
  ): { output: AudioNode; stop: () => void } {
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer(ctx);
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;

    const gate = ctx.createGain();
    gate.gain.value = 0.5;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = Math.max(0.05, rate);
    const depth = ctx.createGain();
    depth.gain.value = 0.5;
    const base = ctx.createGain();
    base.gain.value = 0.5;
    lfo.connect(depth);
    depth.connect(gate.gain);
    base.connect(gate.gain);

    source.connect(filter);
    filter.connect(gate);
    source.start();
    lfo.start();

    const stop = (): void => {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
      try {
        lfo.stop();
      } catch {
        /* already stopped */
      }
      source.disconnect();
      filter.disconnect();
      gate.disconnect();
      lfo.disconnect();
      depth.disconnect();
      base.disconnect();
    };
    return { output: gate, stop };
  }

  /** Low sine drone mixed with a whisper of low-passed noise (room tone). */
  private drone(
    ctx: AudioContext,
    frequency: number,
  ): { output: AudioNode; stop: () => void } {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;

    const noise = this.filteredNoise(ctx, 'lowpass', 400);
    const mix = ctx.createGain();
    mix.gain.value = 0.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.15;

    osc.connect(mix);
    noise.output.connect(noiseGain);
    noiseGain.connect(mix);
    osc.start();

    const stop = (): void => {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
      osc.disconnect();
      noise.stop();
      noiseGain.disconnect();
      mix.disconnect();
    };
    return { output: mix, stop };
  }
}
