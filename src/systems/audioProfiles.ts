/**
 * Per-era audio profiles for the Café Time Period Timelapse.
 *
 * Every canonical era (src/data/eras.ts) maps to an AudioEraProfile describing
 * the three layered ambient beds the AudioEngine plays:
 *
 *   1. conversation murmur loop — a filtered noise bed whose level changes
 *      with the crowd density of the era;
 *   2. coffee machine hiss/clatter SFX — a noise hiss bed plus procedural
 *      clatter bursts, spatialised at the era's brewing equipment;
 *   3. period-appropriate music — a generative tonal loop whose *source
 *      object* (wireless set → jukebox → boombox → iPod → phone/speaker) and
 *      sonic character (tempo, scale, waveform, filtering, noise/crackle)
 *      change per era.
 *
 * Everything is synthesised procedurally (noise buffers, filtered noise and
 * oscillator sequences), so no copyrighted audio is ever shipped.
 */
import { ERAS, type EraYear } from '../data/eras';
import type { MusicSourceKind } from '../data/EraData';

/** Oscillator shape used by the generative music bed. */
export type MusicWaveform = 'sine' | 'triangle' | 'square' | 'sawtooth';

/**
 * The perceived playback source of the music bed. Kept in sync with the
 * EraData `musicSource.kind` so the audio source object matches the in-scene
 * object the era registers.
 */
export type MusicTimbre =
  | 'wireless-set'
  | 'jukebox'
  | 'boombox'
  | 'ipod'
  | 'phone'
  | 'streaming';

/** Sonic character of one era's generative music bed. */
export interface MusicProfile {
  /** Source object kind (matches EraData.musicSource.kind). */
  kind: MusicSourceKind;
  /** Human-readable description of the source object. */
  label: string;

  /** Tempo of the generative loop in beats per minute. */
  bpm: number;
  /** Root frequency of the melody/bass in Hz. */
  rootFrequency: number;
  /** Semitone offsets from the root that the melody walks through. */
  scale: number[];
  /** Oscillator waveform for the lead voice. */
  waveform: MusicWaveform;
  /** Character of the perceived source object. */
  timbre: MusicTimbre;

  /** 0..1 bed level (before the master gain). */
  level: number;
  /** Probability a melody note fires on a step. */
  noteProbability: number;
  /** Probability the bass plays on a bar start. */
  bassProbability: number;
  /** Swing offset (fraction of a step) applied to off-beats. */
  swing: number;
  /** 0..1 reverb send level for the music bed. */
  reverb: number;
  /** 0..1 level of the source-object noise bed (vinyl/tape hiss). */
  noise: number;
  /** Centre frequency of the source-object noise bed in Hz. */
  noiseFilterFrequency: number;
  /** Random crackle pops per second (worn records, loose valves…). */
  crackleRate: number;

  /** Shared character filter applied to the whole music bed. */
  filterType: BiquadFilterType;
  filterFrequency: number;
  filterQ: number;

  /** When true the loop plays long pad chords instead of a melody. */
  pad?: boolean;
}

/** Coffee machine hiss/clatter character for one era. */
export interface CoffeeProfile {
  /** 0..1 level of the continuous hiss bed. */
  hissLevel: number;
  /** Clatter bursts per minute. */
  clatterRate: number;
  /** 0..1 peak level of clatter bursts. */
  clatterLevel: number;
  /** In-scene position of the brewing equipment (world units). */
  position: [number, number, number];
}

/** Conversation murmur character for one era. */
export interface MurmurProfile {
  /** 0..1 level of the murmur bed. */
  level: number;
}

/** The complete audio configuration for one era. */
export interface AudioEraProfile {
  era: EraYear;
  music: MusicProfile;
  coffee: CoffeeProfile;
  murmur: MurmurProfile;
  /** In-scene position of the music source object (world units). */
  musicPosition: [number, number, number];
}

/**
 * Canonical per-era audio configuration. Positions lie inside the café shell
 * bounds (src/systems/cafeShell.ts) so the PannerNodes sit at the era's
 * in-scene coffee machine and music source objects.
 */
export const AUDIO_ERA_PROFILES: Record<EraYear, AudioEraProfile> = {
  1945: {
    era: 1945,
    music: {
      kind: 'wireless-set',
      label: 'Valve wireless set — crackling swing band',
      timbre: 'wireless-set',
      bpm: 96,
      rootFrequency: 220,
      scale: [0, 3, 5, 6, 7, 10], // blues-ish for a wartime wireless broadcast
      waveform: 'triangle',
      level: 0.5,
      noteProbability: 0.55,
      bassProbability: 0.9,
      swing: 0.18,
      reverb: 0.12,
      noise: 0.05,
      noiseFilterFrequency: 7000,
      crackleRate: 0.6,
      filterType: 'lowpass',
      filterFrequency: 1300,
      filterQ: 0.6,
    },
    coffee: {
      hissLevel: 0.14,
      clatterRate: 6,
      clatterLevel: 0.55,
      position: [-1.5, 1.05, -2.4],
    },
    murmur: { level: 0.12 },
    musicPosition: [-5.4, 1.7, -5.0],
  },
  1965: {
    era: 1965,
    music: {
      kind: 'jukebox',
      label: 'Wurlitzer jukebox — bright pop single',
      timbre: 'jukebox',
      bpm: 118,
      rootFrequency: 196,
      scale: [0, 2, 4, 7, 9], // major pentatonic pop
      waveform: 'sine',
      level: 0.55,
      noteProbability: 0.6,
      bassProbability: 0.85,
      swing: 0.1,
      reverb: 0.2,
      noise: 0.08,
      noiseFilterFrequency: 5500,
      crackleRate: 1.4,
      filterType: 'lowpass',
      filterFrequency: 3200,
      filterQ: 0.7,
    },
    coffee: {
      hissLevel: 0.16,
      clatterRate: 8,
      clatterLevel: 0.6,
      position: [-1.5, 1.05, -2.4],
    },
    murmur: { level: 0.14 },
    musicPosition: [6.0, 1.0, -4.4],
  },
  1985: {
    era: 1985,
    music: {
      kind: 'boombox',
      label: 'Ghetto blaster — synth-pop on cassette',
      timbre: 'boombox',
      bpm: 112,
      rootFrequency: 196,
      scale: [0, 2, 3, 5, 7, 9, 10], // dorian synth-pop
      waveform: 'square',
      level: 0.6,
      noteProbability: 0.65,
      bassProbability: 0.9,
      swing: 0.05,
      reverb: 0.1,
      noise: 0.12,
      noiseFilterFrequency: 4200,
      crackleRate: 0.3,
      filterType: 'bandpass',
      filterFrequency: 1800,
      filterQ: 0.9,
    },
    coffee: {
      hissLevel: 0.18,
      clatterRate: 10,
      clatterLevel: 0.65,
      position: [-1.5, 1.15, -2.4],
    },
    murmur: { level: 0.16 },
    musicPosition: [-1.5, 1.15, -2.4],
  },
  2005: {
    era: 2005,
    music: {
      kind: 'ipod',
      label: 'iPod docked on the counter — clean indie rock',
      timbre: 'ipod',
      bpm: 100,
      rootFrequency: 220,
      scale: [0, 2, 3, 5, 7, 8, 10], // natural minor
      waveform: 'triangle',
      level: 0.55,
      noteProbability: 0.6,
      bassProbability: 0.8,
      swing: 0.08,
      reverb: 0.25,
      noise: 0.01,
      noiseFilterFrequency: 9000,
      crackleRate: 0.05,
      filterType: 'highpass',
      filterFrequency: 120,
      filterQ: 0.5,
    },
    coffee: {
      hissLevel: 0.2,
      clatterRate: 11,
      clatterLevel: 0.7,
      position: [-1.5, 1.1, -2.4],
    },
    murmur: { level: 0.14 },
    musicPosition: [1.6, 1.1, -2.4],
  },
  2025: {
    era: 2025,
    music: {
      kind: 'streaming-speaker',
      label: 'Smart speaker — lo-fi stream',
      timbre: 'streaming',
      bpm: 84,
      rootFrequency: 220,
      scale: [0, 2, 4, 7, 9, 10], // major pentatonic with a minor 6th
      waveform: 'sine',
      level: 0.5,
      noteProbability: 0.5,
      bassProbability: 0.75,
      swing: 0.15,
      reverb: 0.35,
      noise: 0.06,
      noiseFilterFrequency: 6000,
      crackleRate: 0.5,
      filterType: 'lowpass',
      filterFrequency: 3800,
      filterQ: 0.7,
    },
    coffee: {
      hissLevel: 0.22,
      clatterRate: 12,
      clatterLevel: 0.75,
      position: [-1.5, 1.1, -2.4],
    },
    murmur: { level: 0.16 },
    musicPosition: [5.2, 1.6, -4.8],
  },
  2055: {
    era: 2055,
    music: {
      kind: 'streaming-speaker',
      label: 'Ambient neural stream — spatial pads',
      timbre: 'streaming',
      bpm: 70,
      rootFrequency: 174,
      scale: [0, 3, 5, 7, 10], // minor pentatonic ambient
      waveform: 'sine',
      level: 0.5,
      noteProbability: 0.4,
      bassProbability: 0.5,
      swing: 0,
      reverb: 0.5,
      noise: 0,
      noiseFilterFrequency: 10000,
      crackleRate: 0,
      filterType: 'lowpass',
      filterFrequency: 2600,
      filterQ: 0.4,
      pad: true,
    },
    coffee: {
      hissLevel: 0.24,
      clatterRate: 14,
      clatterLevel: 0.8,
      position: [-1.5, 1.2, -2.4],
    },
    murmur: { level: 0.12 },
    musicPosition: [0, 2.6, 0],
  },
};

/** The era whose profile is used before the user picks another (1945). */
export const DEFAULT_ERA: EraYear = ERAS[0];

/** Return the audio profile for an era, throwing when none is registered. */
export function getAudioProfile(era: EraYear): AudioEraProfile {
  const profile = AUDIO_ERA_PROFILES[era];
  if (!profile) {
    throw new Error(`No audio profile registered for era ${era}.`);
  }
  return profile;
}
