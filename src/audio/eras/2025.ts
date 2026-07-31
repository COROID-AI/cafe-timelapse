/**
 * Era audio configuration — the sound identity of the 2025 café.
 *
 * The brief asks every era to supply an audio config. This module is a pure
 * data record (no WebAudio graph, no asset loading): it describes the layered
 * generative bed, the phone + Bluetooth speaker (Sonos-style) character and
 * the steam wand hiss so a future audio engine (or the QA gate) can build the
 * exact mix. Layer ids are stable handles an engine can attach gain nodes /
 * schedulers to.
 */
export interface EraAudioLayer {
  /** Stable id an audio engine can attach to. */
  id: string;
  /** What the layer sounds like. */
  description: string;
  /** How loud the layer sits in the mix (0..1). */
  gain: number;
  /** The generative style the engine should synthesise (no samples). */
  style:
    | 'lo-fi-bed'
    | 'modern-evocative-bed'
    | 'phone-bt-speaker-character'
    | 'steam-wand-hiss'
    | 'murmur'
    | 'ambient-room';
}

export interface EraAudioConfig {
  /** The year this config describes. */
  era: number;
  /**
   * The generative bed: lo-fi / modern-evocative. A single engine should
   * blend these two layers to evoke a 2025 specialty café without playing a
   * copyrighted track.
   */
  generativeBed: EraAudioLayer[];
  /** The phone + Bluetooth speaker (Sonos-style) character. */
  phoneBtSpeakerCharacter: EraAudioLayer;
  /** The multi-group flat-white machine's steam wand hiss. */
  steamWandHiss: EraAudioLayer;
}

/** 2025 — modern third-wave / specialty café audio config. */
export const ERA_AUDIO_2025: EraAudioConfig = {
  era: 2025,
  generativeBed: [
    {
      id: '2025-bed-lo-fi',
      description:
        'Lo-fi / chillhop-evocative generative bed: dusty vinyl crackle, soft Rhodes chords, mellow boom-bap beat at ~74 bpm.',
      gain: 0.45,
      style: 'lo-fi-bed',
    },
    {
      id: '2025-bed-modern',
      description:
        'Modern-evocative generative pad: airy synthesiser wash, subtle side-chain pulse and a warm low-passed bassline.',
      gain: 0.3,
      style: 'modern-evocative-bed',
    },
  ],
  phoneBtSpeakerCharacter: {
    id: '2025-phone-bt-speaker',
    description:
      'Smartphone + Bluetooth speaker (Sonos-style) character: soft Bluetooth connect chime, gentle speaker roll-off and faint room reflections.',
    gain: 0.3,
    style: 'phone-bt-speaker-character',
  },
  steamWandHiss: {
    id: '2025-steam-wand-hiss',
    description:
      'Multi-group flat-white espresso machine: brief steam wand hiss bursts as flat whites are steamed, then a quiet pump whirr.',
    gain: 0.2,
    style: 'steam-wand-hiss',
  },
};
