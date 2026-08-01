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
 *  - 1965: a tabletop jukebox playing a Motown/folk-evocative generative bed,
 *    the early electric drip urn hiss, and patron murmur.
 *  - 2025: a smartphone + Bluetooth speaker (Sonos-style) playing a lo-fi /
 *    modern-evocative generative bed, the steam-wand hiss of the multi-group
 *    flat-white machine, and soft specialty-café murmur.
 *  - 2055: a holographic emitter playing a spatial-audio-evocative generative
 *    bed, the robotic bean-to-cup brew sounds, and bio-room tone.
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

/** The 1965 mid-century / beatnik café audio bed. */
export const ERA_AUDIO_1965: EraAudioConfig = {
  era: 1965,
  label: '1965 — jukebox Motown/folk bed, drip urn hiss, beatnik murmur',
  layers: [
    {
      id: '1965-bed-motown',
      label: 'Motown / beat-evocative generative bed',
      kind: 'swing-bed',
      gain: 0.5,
      note: 'walking bass pulse, brushed backbeat, tambourine shimmer, soft electric piano chords',
    },
    {
      id: '1965-bed-folk',
      label: 'Folk / acoustic-evocative generative bed',
      kind: 'swing-bed',
      gain: 0.3,
      note: 'fingerpicked acoustic guitar arpeggios and airy vocal pads for the beatnik corner',
    },
    {
      id: '1965-jukebox',
      label: 'Tabletop mini-jukebox character',
      kind: 'radio-static',
      gain: 0.35,
      note: 'button clicks, selection thunk, 45rpm vinyl crackle and rumble',
    },
    {
      id: '1965-urn-hiss',
      label: 'Early electric drip urn hiss',
      kind: 'machine-hiss',
      gain: 0.25,
      note: 'steady low hiss with a slow percolation plink and an occasional steam puff',
    },
    {
      id: '1965-murmur',
      label: 'Patron conversation murmur',
      kind: 'murmur',
      gain: 0.12,
      note: 'low-passed speech-like granular noise, gentle swell',
    },
    {
      id: '1965-room',
      label: 'Room tone',
      kind: 'ambient-room',
      gain: 0.08,
      note: 'warm mid-century room tone with distant street noise',
    },
  ],
  meta: {
    tempo: '104 bpm',
    mode: 'generative-loop',
    masterGain: '0.4',
    source: 'jukebox',
  },
};

/** The 2025 modern third-wave / specialty café audio bed. */
export const ERA_AUDIO_2025: EraAudioConfig = {
  era: 2025,
  label: '2025 — lo-fi/modern bed from a BT speaker, steam-wand hiss, murmur',
  layers: [
    {
      id: '2025-bed-lo-fi',
      label: 'Lo-fi / chillhop-evocative generative bed',
      kind: 'synth-bed',
      gain: 0.45,
      note: 'dusty vinyl crackle, soft Rhodes chords, mellow boom-bap beat at ~74 bpm',
    },
    {
      id: '2025-bed-modern',
      label: 'Modern-evocative generative pad',
      kind: 'swing-bed',
      gain: 0.3,
      note: 'airy synthesiser wash, subtle side-chain pulse, warm low-passed bassline',
    },
    {
      id: '2025-phone-bt-speaker',
      label: 'Smartphone + Bluetooth speaker character',
      kind: 'radio-static',
      gain: 0.3,
      note: 'soft Bluetooth connect chime, gentle speaker roll-off, faint room reflections',
    },
    {
      id: '2025-steam-wand-hiss',
      label: 'Multi-group flat-white machine steam-wand hiss',
      kind: 'machine-hiss',
      gain: 0.2,
      note: 'brief steam wand hiss bursts, then a quiet pump whirr',
    },
    {
      id: '2025-murmur',
      label: 'Patron conversation murmur',
      kind: 'murmur',
      gain: 0.12,
      note: 'low-passed speech-like granular noise, gentle swell',
    },
    {
      id: '2025-room',
      label: 'Room tone',
      kind: 'ambient-room',
      gain: 0.07,
      note: 'soft specialty-café room tone with laptop keyboard clicks',
    },
  ],
  meta: {
    tempo: '74 bpm',
    mode: 'generative-loop',
    masterGain: '0.38',
    source: 'bt-speaker',
  },
};

/** The 2055 near-future speculative café audio bed. */
export const ERA_AUDIO_2055: EraAudioConfig = {
  era: 2055,
  label: '2055 — spatial bed, holographic emitter, robotic brew, bio-room tone',
  layers: [
    {
      id: '2055-bed-spatial',
      label: 'Ambient / spatial-audio-evocative generative bed',
      kind: 'synth-bed',
      gain: 0.4,
      note: 'airy evolving pads, slow panning shimmer, sub-bass pulse at ~72 bpm',
    },
    {
      id: '2055-holo-emitter',
      label: 'Holographic emitter character',
      kind: 'murmur',
      gain: 0.3,
      note: 'soft chime pulses, a data hum, an occasional AR menu refresh blip',
    },
    {
      id: '2055-robotic-brew',
      label: 'Robotic bean-to-cup brew sounds',
      kind: 'grinder-clatter',
      gain: 0.28,
      note: 'precise servo whirr, bean-grind crunch, gurgling pour, short steam puff',
    },
    {
      id: '2055-murmur',
      label: 'Patron conversation murmur',
      kind: 'murmur',
      gain: 0.1,
      note: 'low-passed speech-like granular noise, gentle swell',
    },
    {
      id: '2055-room',
      label: 'Bio-room tone',
      kind: 'ambient-room',
      gain: 0.15,
      note: 'hum of the vertical garden circulation and faint LED driver whine',
    },
  ],
  meta: {
    tempo: '72 bpm',
    mode: 'generative-loop',
    masterGain: '0.36',
    source: 'holographic-emitter',
  },
};

/** Registry of era audio configs by year (extend as later era tasks land). */
export const ERA_AUDIO_CONFIGS: Record<number, EraAudioConfig> = {
  1945: ERA_AUDIO_1945,
  1965: ERA_AUDIO_1965,
  1985: ERA_AUDIO_1985,
  2005: ERA_AUDIO_2005,
  2025: ERA_AUDIO_2025,
  2055: ERA_AUDIO_2055,
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
