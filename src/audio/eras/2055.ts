/**
 * Era audio configuration — the sound identity of the 2055 café.
 *
 * The brief asks every era to supply an audio config. This module is a pure
 * data record (no WebAudio graph, no asset loading): it describes the layered
 * generative bed, the holographic emitter character and the robotic brew
 * sounds so a future audio engine (or the QA gate) can build the exact mix.
 * Layer ids are stable handles an engine can attach gain nodes / schedulers
 * to.
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
    | 'spatial-audio-bed'
    | 'holographic-emitter'
    | 'robotic-brew'
    | 'ambient-room';
}

export interface EraAudioConfig {
  /** The year this config describes. */
  era: number;
  /**
   * The generative bed: ambient / spatial-audio-evocative. A single engine
   * should blend these layers to evoke a near-future café without playing a
   * copyrighted track.
   */
  generativeBed: EraAudioLayer[];
  /** The holographic emitter object's character: chimes, data hum, AR blips. */
  holographicEmitter: EraAudioLayer;
  /** The robotic bean-to-cup arm / pour-over: servo whirr, grind, pour. */
  roboticBrew: EraAudioLayer;
}

/** 2055 — near-future speculative café audio config. */
export const ERA_AUDIO_2055: EraAudioConfig = {
  era: 2055,
  generativeBed: [
    {
      id: '2055-bed-spatial',
      description:
        'Ambient/spatial-audio-evocative generative bed: airy evolving pads, slow panning shimmer, sub-bass pulse at ~72 bpm.',
      gain: 0.4,
      style: 'spatial-audio-bed',
    },
    {
      id: '2055-bed-room',
      description:
        'Soft bio-room tone: the hum of the vertical garden circulation and faint LED driver whine.',
      gain: 0.15,
      style: 'ambient-room',
    },
  ],
  holographicEmitter: {
    id: '2055-holo-emitter',
    description:
      'Holographic emitter character: soft chime pulses, a data hum, and an occasional AR menu refresh blip from the emitter object.',
    gain: 0.3,
    style: 'holographic-emitter',
  },
  roboticBrew: {
    id: '2055-robotic-brew',
    description:
      'Robotic bean-to-cup brew sounds: precise servo whirr, bean-grind crunch, gurgling pour, and a short steam puff as the arm docks a cup.',
    gain: 0.28,
    style: 'robotic-brew',
  },
};
