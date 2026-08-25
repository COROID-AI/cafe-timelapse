/**
 * Generative music programs, one per era.
 *
 * Design goal (handoff finding b9f095f3): gentle, consonant material —
 * slow-attack pads on warm waveforms, low-pass filtered, quiet by
 * default. No shrieking leads; later eras add soft rhythmic texture
 * only.
 */

export interface MusicProgram {
  /** Human-readable name shown in the info panel. */
  name: string;
  /** Beats per minute for rhythmic layers (pads ignore this). */
  bpm: number;
  /** Chord voicings as MIDI note arrays, cycled in order. */
  chords: number[][];
  /** Waveform for the sustained pad layer. */
  padWave: OscillatorType;
  /** Waveform for the bass pluck layer. */
  bassWave: OscillatorType;
  /** Master low-pass cutoff in Hz — lower is warmer/darker. */
  brightness: number;
  /** Vinyl/cassette crackle layer (early formats only). */
  crackle: boolean;
  /** Soft hi-hat ticks (dance-floor eras). */
  hats: boolean;
}

const C = 0;

export const MUSIC_PROGRAMS: Record<string, MusicProgram> = {
  "swing-jazz": {
    name: "Swing Jazz (wireless broadcast)",
    bpm: 96,
    chords: [
      [48, 55, 60, 64], // Cmaj7
      [52, 59, 64, 67], // Em7-ish colour
      [45, 52, 57, 60], // A min7
      [43, 50, 55, 59], // G9 flavour
    ],
    padWave: "triangle",
    bassWave: "sine",
    brightness: 1400,
    crackle: true,
    hats: false,
  },
  "rock-n-roll": {
    name: "Rock'n'Roll (jukebox 45s)",
    bpm: 132,
    chords: [
      [48, 52, 55],
      [48, 52, 55],
      [53, 57, 60],
      [55, 59, 62],
    ],
    padWave: "sine",
    bassWave: "triangle",
    brightness: 2200,
    crackle: true,
    hats: false,
  },
  "synth-pop": {
    name: "Synth-Pop (cassette deck)",
    bpm: 118,
    chords: [
      [45, 52, 57, 60],
      [50, 57, 62, 65],
      [48, 55, 60, 64],
      [43, 50, 55, 58],
    ],
    padWave: "sawtooth",
    bassWave: "square",
    brightness: 2600,
    crackle: false,
    hats: true,
  },
  "pop-dance": {
    name: "Pop-Dance (iPod dock)",
    bpm: 124,
    chords: [
      [46, 53, 58, 62],
      [51, 58, 63, 65],
      [49, 56, 61, 63],
      [44, 51, 56, 60],
    ],
    padWave: "triangle",
    bassWave: "sine",
    brightness: 3000,
    crackle: false,
    hats: true,
  },
  "lofi-house": {
    name: "Lo-Fi House (smart speaker)",
    bpm: 108,
    chords: [
      [44, 51, 56, 59],
      [42, 49, 54, 57],
      [40, 47, 52, 55],
      [45, 52, 57, 60],
    ],
    padWave: "sine",
    bassWave: "sine",
    brightness: 1600,
    crackle: true,
    hats: true,
  },
  "ambient-scifi": {
    name: "Ambient Sci-Fi (holo-orb resonance)",
    bpm: 60,
    chords: [
      [36, 43, 50, 55, 62],
      [38, 45, 50, 57, 64],
    ],
    padWave: "sine",
    bassWave: "sine",
    brightness: 1100,
    crackle: false,
    hats: false,
  },
};

export function getProgram(id: string): MusicProgram {
  return MUSIC_PROGRAMS[id] ?? MUSIC_PROGRAMS[C];
}
