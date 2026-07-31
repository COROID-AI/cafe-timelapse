/**
 * src/audio/eraAudioConfigs.ts — per-era audio profiles consumed by the
 * AudioEngine (Phase 2 SFX system).
 *
 * Each config describes the generative / layered sound bed for one era. The
 * engine turns these descriptions into audio (oscillator/waverform beds,
 * filtered noise loops, spoken or granular murmur, machine hiss) — no audio
 * files are bundled.
 *
 * The 1945 profile is grounded in the era record (src/data/eras/1945.ts):
 * a valve wireless playing a big-band/swing-evocative generative bed, the
 * gentle murmur of patrons, and the hiss of the lever espresso machine.
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

/** Registry of era audio configs by year (extend as later era tasks land). */
export const ERA_AUDIO_CONFIGS: Record<number, EraAudioConfig> = {
  1945: ERA_AUDIO_1945,
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
