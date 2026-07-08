import { Howl } from 'howler';
import type { AudioRecipe } from '../data/eras';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Channel = 'music' | 'ambient' | 'machine';

interface ManagedHowl {
  howl: Howl;
  channel: Channel;
}

/**
 * Procedural audio parameters for a given era, derived from {@link AudioRecipe}.
 * These feed the WebAudio-based generators (no external asset downloads).
 */
export interface EraAudioProfile {
  musicTone: string;
  baseFreq: number;
  ambient: string;
  machineSfx: string;
}

// ---------------------------------------------------------------------------
// Procedural buffer generators (WebAudio)
// ---------------------------------------------------------------------------

/** Build a looping music bed from oscillators + filters shaped by the era tone. */
function buildMusicBuffer(
  ctx: AudioContext,
  profile: EraAudioProfile,
  duration = 8,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  // Chord ratios per tone
  const ratios: Record<string, number[]> = {
    jazz: [1, 1.25, 1.5, 2],
    motown: [1, 1.2, 1.5, 1.875],
    synth: [1, 1.122, 1.335, 1.498],
    indie: [1, 1.26, 1.5, 2],
    lofi: [1, 1.189, 1.335, 1.782],
    'ambient-future': [1, 1.5, 2, 3],
  };
  const freqs = (ratios[profile.musicTone] ?? ratios['lofi']!).map(
    (r) => profile.baseFreq * r,
  );

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      // Add harmonics
      for (const freq of freqs) {
        // Slow vibrato
        const vibrato = 1 + Math.sin(t * 0.5) * 0.003;
        sample += Math.sin(2 * Math.PI * freq * vibrato * t) * 0.08;
        // Fifth harmonic for richness
        sample += Math.sin(2 * Math.PI * freq * 3 * t) * 0.015;
      }
      // Amplitude envelope pulse (era-dependent tempo)
      const tempo = profile.musicTone === 'synth' ? 2 : profile.musicTone === 'lofi' ? 0.8 : 1.2;
      sample *= 0.6 + 0.4 * Math.sin(2 * Math.PI * tempo * t);
      // Fade in/out at loop boundaries
      const fadeSamples = Math.floor(sampleRate * 0.5);
      if (i < fadeSamples) sample *= i / fadeSamples;
      if (i > length - fadeSamples) sample *= (length - i) / fadeSamples;
      data[i] = sample * 0.5;
    }
  }

  return buffer;
}

/** Build a looping ambient murmur bed — filtered noise that sounds like a café. */
function buildAmbientBuffer(
  ctx: AudioContext,
  profile: EraAudioProfile,
  duration = 6,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  // Different murmur characters
  const intensity: Record<string, number> = {
    hushed: 0.15,
    lively: 0.3,
    buzzy: 0.35,
    corporate: 0.2,
    artisanal: 0.18,
    ethereal: 0.1,
  };
  const amp = intensity[profile.ambient] ?? 0.2;

  // Deterministic-ish PRNG
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      // Pink-ish noise via low-pass filtering
      const white = rand() * 2 - 1;
      lp = lp * 0.97 + white * 0.03;
      // Random voice-like bursts
      const burst = Math.sin((i / sampleRate) * 200 * (0.5 + rand() * 0.5)) * (rand() > 0.99 ? 1 : 0);
      data[i] = (lp + burst * 0.3) * amp;
    }
  }

  return buffer;
}

/** Build a looping machine SFX bed — hiss, clatter, grind. */
function buildMachineBuffer(
  ctx: AudioContext,
  profile: EraAudioProfile,
  duration = 4,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  let seed = 67890;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      switch (profile.machineSfx) {
        case 'percolate': {
          // Bubbling
          sample = Math.sin(t * 80) * 0.1 * (0.5 + Math.sin(t * 5) * 0.5);
          sample += (rand() * 2 - 1) * 0.04;
          break;
        }
        case 'lever-hiss': {
          // Steam hiss burst
          const hiss = t % 2 < 0.5 ? (rand() * 2 - 1) * 0.2 : 0;
          sample = hiss;
          break;
        }
        case 'pump-clatter': {
          // Rhythmic pump
          const pump = Math.sin(t * 30) > 0.7 ? (rand() * 2 - 1) * 0.15 : 0;
          sample = pump + (rand() * 2 - 1) * 0.03;
          break;
        }
        case 'auto-grind': {
          // Whirring grind
          sample = (Math.sin(t * 150) * 0.08 + (rand() * 2 - 1) * 0.06) * (t % 3 < 1 ? 1 : 0.3);
          break;
        }
        case 'pour-trickle': {
          // Water trickle
          sample = (rand() * 2 - 1) * 0.06 * (0.5 + Math.sin(t * 8) * 0.5);
          break;
        }
        case 'sub-zero-hum': {
          // Low electronic hum
          sample = Math.sin(t * 60) * 0.04 + Math.sin(t * 120) * 0.02;
          break;
        }
        default:
          sample = (rand() * 2 - 1) * 0.03;
      }
      data[i] = sample;
    }
  }

  return buffer;
}

/** Convert an AudioBuffer to a WAV blob so Howler can consume it. */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, length - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length - 44, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i] ?? 0));
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ---------------------------------------------------------------------------
// AudioManager — singleton
// ---------------------------------------------------------------------------

class AudioManagerClass {
  private ctx: AudioContext | null = null;
  private howls: Map<string, ManagedHowl> = new Map();
  private currentEraId: string | null = null;
  private unlocked = false;
  private masterVolume = 1;
  private channelVolumes: Record<Channel, number> = {
    music: 0.5,
    ambient: 0.6,
    machine: 0.6,
  };
  private enabled = true;
  private objectUrls: string[] = [];

  /**
   * Must be called from within a user gesture (click/tap/keydown) to satisfy
   * autoplay policies. Creates the AudioContext and resumes it.
   */
  unlock(): void {
    if (this.unlocked) return;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      this.unlocked = true;
    } catch {
      console.error('AudioManager: failed to create AudioContext');
    }
  }

  get isUnlocked(): boolean {
    return this.unlocked;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.howls.forEach((m) => {
      if (enabled) {
        m.howl.mute(false);
      } else {
        m.howl.mute(true);
      }
    });
  }

  setChannelVolume(channel: Channel, volume: number): void {
    this.channelVolumes[channel] = volume;
    this.howls.forEach((m) => {
      if (m.channel === channel) {
        m.howl.volume(volume * this.masterVolume);
      }
    });
  }

  /**
   * Cross-fade all channels from the current era to a new one.
   * @param fromProfile source audio recipe (may be null on first load)
   * @param toProfile target audio recipe
   * @param durationMs crossfade duration
   */
  crossfade(
    fromProfile: EraAudioProfile | null,
    toProfile: EraAudioProfile,
    durationMs = 1500,
  ): void {
    if (!this.ctx || !this.unlocked) return;

    // Build new howls for the target era
    const newEraKey = `${toProfile.musicTone}-${toProfile.baseFreq}`;

    // Fade out old channels
    if (fromProfile) {
      this.howls.forEach((m, key) => {
        if (!key.startsWith(newEraKey)) {
          m.howl.fade(m.howl.volume(), 0, durationMs);
          const id = m.howl.play();
          m.howl.once('fade', () => {
            m.howl.stop();
            m.howl.unload();
            this.howls.delete(key);
          }, id);
        }
      });
    }

    // Build + play new channels
    const musicBuf = buildMusicBuffer(this.ctx, toProfile);
    const ambientBuf = buildAmbientBuffer(this.ctx, toProfile);
    const machineBuf = buildMachineBuffer(this.ctx, toProfile);

    const musicUrl = URL.createObjectURL(audioBufferToWavBlob(musicBuf));
    const ambientUrl = URL.createObjectURL(audioBufferToWavBlob(ambientBuf));
    const machineUrl = URL.createObjectURL(audioBufferToWavBlob(machineBuf));
    this.objectUrls.push(musicUrl, ambientUrl, machineUrl);

    const channels: Array<{ channel: Channel; url: string }> = [
      { channel: 'music', url: musicUrl },
      { channel: 'ambient', url: ambientUrl },
      { channel: 'machine', url: machineUrl },
    ];

    for (const { channel, url } of channels) {
      const key = `${newEraKey}-${channel}`;
      if (this.howls.has(key)) continue;

      const targetVol = this.channelVolumes[channel] * this.masterVolume;
      const howl = new Howl({
        src: [url],
        format: ['wav'],
        loop: true,
        volume: 0,
        html5: false,
      });

      if (!this.enabled) howl.mute(true);

      howl.once('load', () => {
        howl.fade(0, targetVol, durationMs);
        howl.play();
      });

      this.howls.set(key, { howl, channel });
    }
  }

  /** Start the initial audio for an era (no crossfade). */
  start(profile: EraAudioProfile, eraId: string): void {
    this.currentEraId = eraId;
    void this.currentEraId; // tracked for diagnostics / future guard logic
    this.crossfade(null, profile, 800);
  }

  /** Stop all audio. */
  stopAll(): void {
    this.howls.forEach((m) => {
      m.howl.stop();
      m.howl.unload();
    });
    this.howls.clear();
  }

  /** Clean up object URLs. */
  dispose(): void {
    this.stopAll();
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.unlocked = false;
  }
}

/** Singleton instance. */
export const AudioManager = new AudioManagerClass();

/** Convert an AudioRecipe to an EraAudioProfile. */
export function toAudioProfile(recipe: AudioRecipe): EraAudioProfile {
  return {
    musicTone: recipe.musicTone,
    baseFreq: recipe.baseFreq,
    ambient: recipe.ambient,
    machineSfx: recipe.machineSfx,
  };
}
