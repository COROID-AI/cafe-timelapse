/**
 * src/audio/eraAudioConfigs.ts — per-era audio profiles consumed by the
 * AudioEngine (Phase 2 SFX system).
 *
 * Each config describes the generative / layered sound bed for one era. The
 * engine turns these descriptions into audio (oscillator/waverform beds,
 * filtered noise loops, spoken or granular murmur, machine hiss) — no audio
 * files are bundled.
 *
 * Profiles are grounded in the era records (src/data/eras/*.ts):
 *  - 1945: a valve wireless playing a big-band/swing-evocative generative
 *    bed, the gentle murmur of patrons, and the hiss of the lever espresso
 *    machine.
 *  - 1985: a boombox/ghetto-blaster playing a synth-pop/new-wave-evocative
 *    generative bed (cassette hiss + tape wobble character), the churn of
 *    the grinder doser, and the hiss of the commercial espresso machine.
 *  - 2005: an iPod dock playing an indie/acoustic-evocative generative bed,
 *    the whir and hiss of the superautomatic espresso machine, and warm
 *    halogen-lit room tone.
 */
export interface EraAudioLayer {
  /** Stable identifier for the layer (engine hook / debugging). */
  id: string;
  /** Human-readable description of the layer. */
  label: string;
  /** Generative synthesis kind the engine maps to a voice. */
  kind:
    | 'radio-static'
    | 'swing-bed'
    | 'synth-bed'
    | 'cassette-hiss'
    | 'grinder-clatter'
    | 'murmur'
    | 'machine-hiss'
    | 'ambient-room'
    | 'none';
  /** Suggested loudness in [0, 1]. */
  gain: number;
  /** Optional notes for the engine (timbre, tempo, filter shape). */
  note?: string;
}

export interface EraAudioConfig {
  era: number;
  /** Master bed description (engine-level label). */
  label: string;
  /** Layered voices for the engine. */
  layers: EraAudioLayer[];
  /** Optional per-layer loop/duration hints. */
  meta?: Record<string, string>;
}

/** The 1945 post-war café audio bed. */
export const ERA_AUDIO_1945: EraAudioConfig = {
  era: 1945,
  label: '1945 — valve wireless, big-band swing, café murmur',
  layers: [
    {
      id: 'radio-static',
      label: 'Valve wireless tuning static',
      kind: 'radio-static',
      gain: 0.06,
      note: 'soft band-limited noise bed, faint 50 Hz hum',
    },
    {
      id: 'swing-bed',
      label: 'Big-band / swing-evocative generative bed',
      kind: 'swing-bed',
      gain: 0.4,
      note: 'upright bass pulse, brushed cymbal shimmer, muted horn stabs, 4/4 at ~96 bpm',
    },
    {
      id: 'murmur',
      label: 'Patron conversation murmur',
      kind: 'murmur',
      gain: 0.12,
      note: 'low-passed speech-like granular noise, gentle swell',
    },
    {
      id: 'machine-hiss',
      label: 'Lever espresso machine hiss',
      kind: 'machine-hiss',
      gain: 0.1,
      note: 'short steam hiss bursts on the lever pull, then quiet',
    },
    {
      id: 'ambient-room',
      label: 'Room tone',
      kind: 'ambient-room',
      gain: 0.08,
      note: 'warm tungsten room tone with distant street traffic',
    },
  ],
  meta: {
    tempo: '96 bpm',
    mode: 'generative-loop',
    masterGain: '0.35',
  },
};

/** The 1985 espresso-bar audio bed. */
export const ERA_AUDIO_1985: EraAudioConfig = {
  era: 1985,
  label: '1985 — boombox synth-pop bed, grinder clatter, espresso hiss',
  layers: [
    {
      id: 'synth-bed',
      label: 'Synth-pop / new-wave-evocative generative bed',
      kind: 'synth-bed',
      gain: 0.42,
      note: 'bass-synth pulse, gated snare, shimmering pads, 4/4 at ~112 bpm',
    },
    {
      id: 'cassette-hiss',
      label: 'Boombox cassette character',
      kind: 'cassette-hiss',
      gain: 0.08,
      note: 'soft tape hiss and slow wow/flutter wobble, stereo speakers',
    },
    {
      id: 'grinder-clatter',
      label: 'Coffee grinder doser clatter',
      kind: 'grinder-clatter',
      gain: 0.14,
      note: 'short whirr + bean rattle bursts as doses are ground',
    },
    {
      id: 'machine-hiss',
      label: 'Commercial espresso machine hiss',
      kind: 'machine-hiss',
      gain: 0.1,
      note: 'pump pressure whoosh and brief steam wand hiss',
    },
    {
      id: 'murmur',
      label: 'Patron conversation murmur',
      kind: 'murmur',
      gain: 0.12,
      note: 'low-passed speech-like granular noise, gentle swell',
    },
    {
      id: 'ambient-room',
      label: 'Room tone',
      kind: 'ambient-room',
      gain: 0.08,
      note: 'cool fluorescent room tone with distant street noise',
    },
  ],
  meta: {
    tempo: '112 bpm',
    mode: 'generative-loop',
    masterGain: '0.4',
  },
};

/** The 2005 second-wave coffeehouse audio bed. */
export const ERA_AUDIO_2005: EraAudioConfig = {
  era: 2005,
  label: '2005 — indie/acoustic-evocative bed from an iPod dock, superauto hiss',
  layers: [
    {
      id: 'indie-bed',
      label: 'Indie / acoustic-evocative generative bed',
      kind: 'swing-bed',
      gain: 0.32,
      note: 'fingerpicked acoustic guitar arpeggios, brushed drums, soft vocal hum, mid-tempo ~88 bpm',
    },
    {
      id: 'ipod-dock',
      label: 'iPod dock character',
      kind: 'radio-static',
      gain: 0.05,
      note: 'tiny dock speaker roll-off, faint white-noise floor and a click when a track advances',
    },
    {
      id: 'superauto-hiss',
      label: 'Superautomatic espresso machine hiss',
      kind: 'machine-hiss',
      gain: 0.09,
      note: 'one-touch grinder whir, then short high-pressure steam hiss bursts every ~30 s',
    },
    {
      id: 'murmur',
      label: 'Patron conversation murmur',
      kind: 'murmur',
      gain: 0.12,
      note: 'low-passed speech-like granular noise, gentle swell',
    },
    {
      id: 'room-tone',
      label: 'Room tone',
      kind: 'ambient-room',
      gain: 0.07,
      note: 'warm halogen-lit room tone with laptop keyboard clicks',
    },
  ],
  meta: {
    tempo: '88 bpm',
    mode: 'generative-loop',
    masterGain: '0.33',
    source: 'ipod-dock',
  },
};

/** Registry of era audio configs by year (extend as later era tasks land). */
export const ERA_AUDIO_CONFIGS: Record<number, EraAudioConfig> = {
  1945: ERA_AUDIO_1945,
  1985: ERA_AUDIO_1985,
  2005: ERA_AUDIO_2005,
};

/** Return the audio config for an era (falls back to a silent bed). */
export function eraAudioConfigFor(year: number): EraAudioConfig {
  return (
    ERA_AUDIO_CONFIGS[year] ?? {
      era: year,
      label: `Era ${year} — no audio profile`,
      layers: [{ id: 'silence', label: 'Silence', kind: 'none', gain: 0 }],
    }
  );
}
