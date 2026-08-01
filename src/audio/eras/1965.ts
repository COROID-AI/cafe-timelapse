/**
 * Era audio configuration — the sound identity of the 1965 café.
 *
 * The brief asks every era to supply an audio config. This module is a pure
 * data record (no WebAudio graph, no asset loading): it describes the layered
 * generative bed, the jukebox character and the counter-side urn hiss so a
 * future audio engine (or the QA gate) can build the exact mix. Layer ids are
 * stable handles an engine can attach gain nodes / schedulers to.
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
    | 'motown-beat-bed'
    | 'folk-acoustic-bed'
    | 'jukebox-character'
    | 'urn-hiss'
    | 'ambient-room';
}

export interface EraAudioConfig {
  /** The year this config describes. */
  era: number;
  /**
   * The generative bed: Motown/beat/folk-evocative. A single engine should
   * blend these two layers to evoke a mid-60s café without playing a
   * copyrighted track.
   */
  generativeBed: EraAudioLayer[];
  /** The tabletop jukebox selector's character: clicks, thunks, vinyl rumble. */
  jukeboxCharacter: EraAudioLayer;
  /** The early electric drip urn: steady hiss + percolation plink. */
  urnHiss: EraAudioLayer;
}

/** 1965 — mid-century / beatnik café audio config. */
export const ERA_AUDIO_1965: EraAudioConfig = {
  era: 1965,
  generativeBed: [
    {
      id: '1965-bed-motown',
      description: 'Motown/beat-evocative generative bed: walking bass, brushed backbeat, tambourine shimmer, soft electric piano chords.',
      gain: 0.5,
      style: 'motown-beat-bed',
    },
    {
      id: '1965-bed-folk',
      description: 'Folk-evocative generative bed: fingerpicked acoustic guitar and airy vocal pads for the beatnik corner.',
      gain: 0.3,
      style: 'folk-acoustic-bed',
    },
  ],
  jukeboxCharacter: {
    id: '1965-jukebox',
    description: 'Tabletop mini-jukebox selector: button clicks, selection thunk, 45rpm vinyl crackle and rumble as the record drops.',
    gain: 0.35,
    style: 'jukebox-character',
  },
  urnHiss: {
    id: '1965-urn-hiss',
    description: 'Early electric drip urn: steady low hiss with a slow percolation plink and an occasional steam puff.',
    gain: 0.25,
    style: 'urn-hiss',
  },
};
