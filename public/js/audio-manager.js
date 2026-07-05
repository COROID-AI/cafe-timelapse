/**
 * AudioManager — layered AudioContext soundscape with era cross-fade.
 *
 * Builds a four-bus signal graph:
 *
 *   sources ─▶ musicBus    ┐
 *   sources ─▶ ambienceBus ├─▶ masterBus (gain) ─▶ destination
 *   sources ─▶ machineBus  ┘
 *
 * Each era receives a music track, a café-ambience layer (conversation murmur,
 * espresso hiss, cup clatter), and a machine SFX profile.  All audio is
 * **procedurally synthesised** in real time via the Web Audio API — no
 * external audio files are required, making every sound royalty-free and
 * public-domain by construction.
 *
 * On era change the current era's music + ambience fade out over 1.5 s while
 * the new era's fade in; machine SFX swap on the transition tick.
 *
 * @module audio-manager
 */

/* ============================================================ *
 *  Note / frequency utilities
 * ============================================================ */

/** A4 = 440 Hz reference pitch. */
const A4 = 440;

/** Equal-temperament semitone offset from C. */
const NOTE_OFFSETS = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10, B: 11,
};

/**
 * Converts a note name (e.g. `"A4"`, `"Eb3"`, `"F#5"`) into a frequency in Hz
 * using 12-TET tuning with A4 = 440 Hz.
 *
 * @param {string} note - Note name with octave, e.g. `"C4"`.
 * @returns {number} Frequency in Hz.
 */
function noteToFreq(note) {
  const match = /^([A-G][b#]?)(-?\d)$/.exec(note);
  if (!match) return A4;
  const [, name, octaveStr] = match;
  const semitone = NOTE_OFFSETS[name] ?? 9;
  const octave = Number(octaveStr);
  const midi = (octave + 1) * 12 + semitone;
  return A4 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Converts a MIDI note number to a frequency.
 * @param {number} midi
 * @returns {number}
 */
function midiToFreq(midi) {
  return A4 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Transposes a frequency by a number of semitones.
 * @param {number} freq
 * @param {number} semitones
 * @returns {number}
 */
function transpose(freq, semitones) {
  return freq * Math.pow(2, semitones / 12);
}

/* ============================================================ *
 *  Noise buffer factory (shared across engines)
 * ============================================================ */

/**
 * Creates a reusable looping noise buffer.  `type` controls the spectral tilt:
 *  - `"white"`  — flat spectrum
 *  - `"pink"`   −3 dB/oct (Paul Kellet's refined algorithm)
 *  - `"brown"`  −6 dB/oct (integrated white noise)
 *
 * @param {AudioContext} ctx
 * @param {number} [seconds=2] - Buffer length.
 * @param {'white'|'pink'|'brown'} [type='white']
 * @returns {AudioBuffer}
 */
function createNoiseBuffer(ctx, seconds = 2, type = 'white') {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
}

/* ============================================================ *
 *  ERA_AUDIO_PROFILES
 *
 *  Per-era metadata describing the synthesised soundscape.  The `musicSource`
 *  field mirrors the PeriodPackage `music.source` value so the AudioManager
 *  can match audio profiles to era packages.
 * ============================================================ */

/**
 * @typedef {Object} EraAudioProfile
 * @property {string}   musicSource   - Matches PeriodPackage `music.source`.
 * @property {Object}   music         - Synth-music parameters.
 * @property {Object}   ambience      - Ambience-layer parameters.
 * @property {Object}   machine       - Machine-SFX parameters.
 */

/** @type {Record<number, EraAudioProfile>} */
const ERA_AUDIO_PROFILES = {
  1945: {
    musicSource: 'wireless',
    music: {
      name: 'Swing-era big-band groove',
      root: noteToFreq('Eb3'),
      scale: 'majorPentatonic',
      tempo: 128, // bpm (swing feel)
      swing: 0.62,
      // I – vi – ii – V  (Eb – Cm – Fm – Bb) turnaround
      chords: [
        { root: noteToFreq('Eb2'), quality: 'maj', duration: 2 },
        { root: noteToFreq('C2'), quality: 'min', duration: 2 },
        { root: noteToFreq('F2'), quality: 'min', duration: 2 },
        { root: noteToFreq('Bb1'), quality: 'dom', duration: 2 },
      ],
      melodyVoice: { type: 'sawtooth', attack: 0.02, decay: 0.15, sustain: 0.5, release: 0.12, cutoff: 1800, gain: 0.14 },
      bassVoice: { type: 'triangle', attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.1, gain: 0.22 },
      chordVoice: { type: 'sawtooth', attack: 0.04, decay: 0.3, sustain: 0.4, release: 0.2, cutoff: 1200, gain: 0.07 },
      useDrums: true,
      drumPattern: 'brushes',
    },
    ambience: {
      murmurLevel: 0.18,
      murmurFilter: 520,
      roomSize: 'intimate',
      layers: ['murmur', 'clink'],
    },
    machine: {
      type: 'leverEspresso',
      shotInterval: 7.5,
      steamInterval: 11,
      grindInterval: 9,
      profile: { hissLevel: 0.16, grindPitch: 180, steamPitch: 900 },
    },
  },

  1965: {
    musicSource: 'jukebox',
    music: {
      name: 'Motown soul groove',
      root: noteToFreq('A2'),
      scale: 'minorPentatonic',
      tempo: 112,
      swing: 0.55,
      // i – VI – III – VII  (Am – F – C – G)
      chords: [
        { root: noteToFreq('A1'), quality: 'min', duration: 2 },
        { root: noteToFreq('F1'), quality: 'maj', duration: 2 },
        { root: noteToFreq('C2'), quality: 'maj', duration: 2 },
        { root: noteToFreq('G1'), quality: 'maj', duration: 2 },
      ],
      melodyVoice: { type: 'square', attack: 0.01, decay: 0.12, sustain: 0.4, release: 0.1, cutoff: 2200, gain: 0.1 },
      bassVoice: { type: 'sine', attack: 0.01, decay: 0.18, sustain: 0.35, release: 0.08, gain: 0.26 },
      chordVoice: { type: 'triangle', attack: 0.02, decay: 0.2, sustain: 0.35, release: 0.15, cutoff: 1600, gain: 0.06 },
      useDrums: true,
      drumPattern: 'soul',
    },
    ambience: {
      murmurLevel: 0.22,
      murmurFilter: 600,
      roomSize: 'lively',
      layers: ['murmur', 'clink', 'jukeboxHum'],
    },
    machine: {
      type: 'leverEspresso',
      shotInterval: 6.5,
      steamInterval: 10,
      grindInterval: 8,
      profile: { hissLevel: 0.18, grindPitch: 200, steamPitch: 950 },
    },
  },

  1985: {
    musicSource: 'boombox',
    music: {
      name: 'Synth-pop new wave',
      root: noteToFreq('D3'),
      scale: 'naturalMinor',
      tempo: 124,
      swing: 0.5,
      // i – VI – VII  (Dm – Bb – C)
      chords: [
        { root: noteToFreq('D2'), quality: 'min', duration: 2 },
        { root: noteToFreq('Bb1'), quality: 'maj', duration: 2 },
        { root: noteToFreq('C2'), quality: 'maj', duration: 2 },
        { root: noteToFreq('D2'), quality: 'min', duration: 2 },
      ],
      melodyVoice: { type: 'sawtooth', attack: 0.005, decay: 0.08, sustain: 0.3, release: 0.15, cutoff: 3000, gain: 0.12 },
      bassVoice: { type: 'sawtooth', attack: 0.005, decay: 0.1, sustain: 0.2, release: 0.05, cutoff: 500, gain: 0.2 },
      chordVoice: { type: 'square', attack: 0.03, decay: 0.25, sustain: 0.3, release: 0.2, cutoff: 2400, gain: 0.05 },
      useDrums: true,
      drumPattern: 'electronic',
    },
    ambience: {
      murmurLevel: 0.25,
      murmurFilter: 700,
      roomSize: 'open',
      layers: ['murmur', 'clink', 'tapeHiss'],
    },
    machine: {
      type: 'pumpEspresso',
      shotInterval: 5.5,
      steamInterval: 9,
      grindInterval: 7,
      profile: { hissLevel: 0.14, grindPitch: 240, steamPitch: 1000 },
    },
  },

  2005: {
    musicSource: 'ipod',
    music: {
      name: 'Indie chillout',
      root: noteToFreq('G2'),
      scale: 'major',
      tempo: 96,
      swing: 0.5,
      // I – V – vi – IV  (G – D – Em – C)
      chords: [
        { root: noteToFreq('G1'), quality: 'maj', duration: 2 },
        { root: noteToFreq('D2'), quality: 'maj', duration: 2 },
        { root: noteToFreq('E2'), quality: 'min', duration: 2 },
        { root: noteToFreq('C2'), quality: 'maj', duration: 2 },
      ],
      melodyVoice: { type: 'triangle', attack: 0.03, decay: 0.2, sustain: 0.5, release: 0.25, cutoff: 2500, gain: 0.1 },
      bassVoice: { type: 'sine', attack: 0.02, decay: 0.25, sustain: 0.4, release: 0.12, gain: 0.2 },
      chordVoice: { type: 'triangle', attack: 0.05, decay: 0.35, sustain: 0.45, release: 0.3, cutoff: 1800, gain: 0.06 },
      useDrums: true,
      drumPattern: 'soft',
    },
    ambience: {
      murmurLevel: 0.28,
      murmurFilter: 750,
      roomSize: 'modern',
      layers: ['murmur', 'clink'],
    },
    machine: {
      type: 'automaticEspresso',
      shotInterval: 4.5,
      steamInterval: 8,
      grindInterval: 6,
      profile: { hissLevel: 0.1, grindPitch: 280, steamPitch: 1050 },
    },
  },

  2025: {
    musicSource: 'phone',
    music: {
      name: 'Lo-fi chill beats',
      root: noteToFreq('F2'),
      scale: 'dorian',
      tempo: 74,
      swing: 0.58,
      // i – IV  (Fm – Bb) lo-fi vamp
      chords: [
        { root: noteToFreq('F1'), quality: 'min', duration: 4 },
        { root: noteToFreq('Bb1'), quality: 'dom', duration: 4 },
      ],
      melodyVoice: { type: 'sine', attack: 0.04, decay: 0.3, sustain: 0.4, release: 0.35, cutoff: 2000, gain: 0.08 },
      bassVoice: { type: 'sine', attack: 0.03, decay: 0.3, sustain: 0.5, release: 0.15, gain: 0.18 },
      chordVoice: { type: 'triangle', attack: 0.06, decay: 0.4, sustain: 0.5, release: 0.4, cutoff: 1400, gain: 0.05 },
      useDrums: true,
      drumPattern: 'lofi',
    },
    ambience: {
      murmurLevel: 0.2,
      murmurFilter: 650,
      roomSize: 'modern',
      layers: ['murmur', 'clink', 'vinylCrackle'],
    },
    machine: {
      type: 'automaticEspresso',
      shotInterval: 4,
      steamInterval: 7,
      grindInterval: 5.5,
      profile: { hissLevel: 0.09, grindPitch: 300, steamPitch: 1100 },
    },
  },
};
/* ============================================================ *
 *  Scale / chord helpers
 * ============================================================ */

/** Scale interval maps (semitone offsets from root). */
const SCALES = {
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

/**
 * Returns the chord-tone semitone offsets for a given quality.
 * @param {'maj'|'min'|'dom'} quality
 * @returns {number[]}
 */
function chordTones(quality) {
  if (quality === 'maj') return [0, 4, 7, 11];
  if (quality === 'min') return [0, 3, 7, 10];
  return [0, 4, 7, 10]; // dom7
}

/**
 * Picks a scale degree, with octave wrap.
 * @param {number[]} scale
 * @param {number} degree
 * @returns {number}
 */
function scaleDegreeToSemitone(scale, degree) {
  const len = scale.length;
  const octave = Math.floor(degree / len);
  const idx = ((degree % len) + len) % len;
  return scale[idx] + octave * 12;
}

/* ============================================================ *
 *  MusicEngine — procedural chord / bass / melody sequencer
 * ============================================================ */

/**
 * MusicEngine — a self-contained procedural music generator.
 *
 * Cycles through a chord progression, playing a pad chord, a walking/arp bass,
 * and a melodic line drawn from the era's scale.  Includes simple swing and
 * a drum pattern.  All output routes to a single destination gain node.
 */
class MusicEngine {
  /**
   * @param {AudioContext} ctx
   * @param {Object} params - Music profile params (see ERA_AUDIO_PROFILES).
   * @param {GainNode} destination - Bus input the music connects to.
   */
  constructor(ctx, params, destination) {
    this.ctx = ctx;
    this.params = params;
    this.destination = destination;

    this._subMix = ctx.createGain();
    this._subMix.gain.value = 0;
    this._subMix.connect(destination);

    this._scale = SCALES[params.scale] ?? SCALES.majorPentatonic;
    this._stepDur = 60 / params.tempo / 2; // eighth-note duration (s)

    this._chordIndex = 0;
    this._stepInChord = 0;
    this._nextStepTime = 0;
    this._timer = null;
    this._playing = false;
    this._melodyDegree = 0;
  }

  /**
   * Starts the music engine at the given audio-context time.
   * @param {number} when
   */
  start(when) {
    if (this._playing) return;
    this._playing = true;
    this._nextStepTime = when;
    this._scheduleAhead();
  }

  /** Schedules events ~0.2 s ahead using setTimeout. @private */
  _scheduleAhead() {
    if (!this._playing) return;
    const lookahead = 0.2;
    const now = this.ctx.currentTime;

    while (this._nextStepTime < now + lookahead) {
      this._scheduleStep(this._nextStepTime);
      this._nextStepTime += this._stepDur;
    }
    this._timer = setTimeout(() => this._scheduleAhead(), 50);
  }

  /**
   * Schedules one eighth-note step.
   * @private
   * @param {number} when
   */
  _scheduleStep(when) {
    const p = this.params;
    const chords = p.chords;
    const chord = chords[this._chordIndex];
    const stepsPerChord = Math.round(chord.duration / this._stepDur);

    // On the first step of a new chord, play the chord pad + bass.
    if (this._stepInChord === 0) {
      this._playChord(chord, when);
      this._playBass(chord, when);
    }

    // Melody: play on most steps, skip rests for breathing room.
    const beat = this._stepInChord % 2 === 0 ? 1 : (p.swing > 0.55 ? 0.7 : 0.85);
    if (Math.random() < beat) {
      this._playMelodyNote(chord, when, this._stepInChord);
    }

    // Drums
    if (p.useDrums) {
      this._playDrums(this._stepInChord, stepsPerChord, when);
    }

    this._stepInChord++;
    if (this._stepInChord >= stepsPerChord) {
      this._stepInChord = 0;
      this._chordIndex = (this._chordIndex + 1) % chords.length;
    }
  }

  /**
   * Plays the chord pad (3–4 detuned voices).
   * @private
   */
  _playChord(chord, when) {
    const voice = this.params.chordVoice;
    const tones = chordTones(chord.quality);
    for (const semi of tones) {
      const freq = transpose(chord.root, semi);
      this._voice(freq, when, voice, this._subMix);
    }
  }

  /**
   * Plays the bass note (root or fifth).
   * @private
   */
  _playBass(chord, when) {
    const voice = this.params.bassVoice;
    // Alternate root and fifth for a walking feel.
    const semi = this._chordIndex % 2 === 0 ? 0 : 7;
    const freq = transpose(chord.root, semi);
    this._voice(freq, when, voice, this._subMix);
  }

  /**
   * Plays a melodic note from the era scale, constrained to the chord.
   * @private
   */
  _playMelodyNote(chord, when, stepInChord) {
    const voice = this.params.melodyVoice;
    const root = this.params.root;
    // Walk the melody degree up and down for musical contour.
    const direction = Math.sin((this._chordIndex + stepInChord * 0.25) * 0.6);
    if (direction > -0.3) this._melodyDegree++;
    else this._melodyDegree--;
    // Clamp to a 1.5-octave range around degree 0.
    if (this._melodyDegree > 6) this._melodyDegree = 0;
    if (this._melodyDegree < -3) this._melodyDegree = 3;

    const semi = scaleDegreeToSemitone(this._scale, this._melodyDegree);
    const freq = transpose(root, semi);
    this._voice(freq, when, voice, this._subMix);
  }

  /**
   * Core voice oscillator + ADSR + optional low-pass filter.
   * @private
   */
  _voice(freq, when, voice, dest) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = voice.type;
    osc.frequency.value = freq;

    // Slight detune for warmth.
    if (voice.type === 'sawtooth' || voice.type === 'square') {
      osc.detune.value = (Math.random() - 0.5) * 8;
    }

    const gain = ctx.createGain();
    const peak = voice.gain ?? 0.15;
    const a = voice.attack ?? 0.01;
    const d = voice.decay ?? 0.1;
    const s = voice.sustain ?? 0.4;
    const r = voice.release ?? 0.1;
    const dur = this._stepDur * 1.5;

    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(peak, when + a);
    gain.gain.linearRampToValueAtTime(peak * s, when + a + d);
    gain.gain.linearRampToValueAtTime(peak * s, when + dur - r);
    gain.gain.linearRampToValueAtTime(0, when + dur);

    let outNode = osc;
    if (voice.cutoff) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = voice.cutoff;
      filter.Q.value = 1;
      osc.connect(filter);
      outNode = filter;
    }
    outNode.connect(gain);
    gain.connect(dest);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  /**
   * Plays a drum hit based on the pattern + step position.
   * @private
   */
  _playDrums(stepInChord, stepsPerChord, when) {
    const pattern = this.params.drumPattern;
    // Kick on beat 1 and 3 (steps 0 and stepsPerChord/2)
    if (stepInChord === 0 || stepInChord === Math.floor(stepsPerChord / 2)) {
      this._kick(when, pattern);
    }
    // Snare on beats 2 and 4
    if (stepInChord === Math.floor(stepsPerChord / 4) || stepInChord === Math.floor(stepsPerChord * 3 / 4)) {
      this._snare(when, pattern);
    }
    // Hi-hat on every step (or off-beats for swing)
    if (pattern === 'brushes' || pattern === 'lofi') {
      if (stepInChord % 2 === 1) this._hihat(when, pattern);
    } else {
      this._hihat(when, pattern);
    }
  }

  /** @private */
  _kick(when, pattern) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pattern === 'lofi' ? 60 : 120, when);
    osc.frequency.exponentialRampToValueAtTime(45, when + 0.08);
    const gain = ctx.createGain();
    const vol = pattern === 'lofi' ? 0.18 : 0.25;
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.18);
    osc.connect(gain);
    gain.connect(this._subMix);
    osc.start(when);
    osc.stop(when + 0.2);
  }

  /** @private */
  _snare(when, pattern) {
    const ctx = this.ctx;
    const dur = 0.12;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;
    const gain = ctx.createGain();
    const vol = pattern === 'brushes' ? 0.06 : (pattern === 'lofi' ? 0.08 : 0.12);
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._subMix);
    noise.start(when);
    noise.stop(when + dur);
  }

  /** @private */
  _hihat(when, pattern) {
    const ctx = this.ctx;
    const dur = pattern === 'electronic' ? 0.05 : 0.03;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    const vol = pattern === 'lofi' ? 0.015 : 0.03;
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._subMix);
    noise.start(when);
    noise.stop(when + dur);
  }

  /**
   * Fades the music sub-mix to `target` over `duration` seconds.
   * @param {number} target  - Gain value (0 = silence).
   * @param {number} when    - Audio-context time to start the fade.
   * @param {number} duration - Fade length in seconds.
   */
  fadeTo(target, when, duration) {
    const g = this._subMix.gain;
    g.cancelScheduledValues(when);
    g.setValueAtTime(Math.max(0.0001, g.value), when);
    g.linearRampToValueAtTime(Math.max(0.0001, target), when + duration);
  }

  /** Stops the music and releases all scheduled timers. */
  stop() {
    this._playing = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    // Disconnect sub-mix to release remaining nodes.
    try { this._subMix.disconnect(); } catch { /* already disconnected */ }
  }
}

/* ============================================================ *
 *  AmbienceEngine — café murmur, cup clinks, era-specific texture
 * ============================================================ */

/**
 * AmbienceEngine — layered café background sound.
 *
 *  - Conversation murmur: filtered brown/pink noise modulated by an LFO to
 *    simulate the ebb-and-flow of chatter.
 *  - Cup clatter: short filtered-noise bursts triggered at random intervals.
 *  - Era textures: jukebox hum, tape hiss, or vinyl crackle.
 */
class AmbienceEngine {
  /**
   * @param {AudioContext} ctx
   * @param {Object} params - Ambience profile params.
   * @param {GainNode} destination
   */
  constructor(ctx, params, destination) {
    this.ctx = ctx;
    this.params = params;
    this.destination = destination;

    this._subMix = ctx.createGain();
    this._subMix.gain.value = 0;
    this._subMix.connect(destination);

    this._activeNodes = [];
    this._clinkTimer = null;
    this._playing = false;
  }

  /**
   * Starts the ambience engine at the given time.
   * @param {number} when
   */
  start(when) {
    if (this._playing) return;
    this._playing = true;
    this._startMurmur(when);
    if (this.params.layers?.includes('clink')) {
      this._scheduleClinks();
    }
    if (this.params.layers?.includes('jukeboxHum')) {
      this._startJukeboxHum(when);
    }
    if (this.params.layers?.includes('tapeHiss')) {
      this._startTapeHiss(when);
    }
    if (this.params.layers?.includes('vinylCrackle')) {
      this._startVinylCrackle(when);
    }
  }

  /** Builds the conversation-murmur layer. @private */
  _startMurmur(when) {
    const ctx = this.ctx;
    const level = this.params.murmurLevel ?? 0.2;
    const cutoff = this.params.murmurFilter ?? 600;

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 3, 'brown');
    noise.loop = true;

    // Band-pass filter shapes noise into "speech-like" murmur.
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = cutoff;
    bandpass.Q.value = 0.7;

    // Second low-pass to tame harshness.
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = cutoff * 2.5;

    // LFO modulates the gain to simulate conversational ebb-and-flow.
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.18;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = level * 0.4;

    const gain = ctx.createGain();
    gain.gain.value = level;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this._subMix);

    noise.start(when);
    lfo.start(when);
    this._activeNodes.push(noise, bandpass, lowpass, lfo, lfoGain, gain);
  }

  /** Schedules random cup-clatter events. @private */
  _scheduleClinks() {
    const fire = () => {
      if (!this._playing) return;
      this._playClink(this.ctx.currentTime);
      const next = 1.5 + Math.random() * 4; // 1.5–5.5 s
      this._clinkTimer = setTimeout(fire, next * 1000);
    };
    fire();
  }

  /** Plays a single cup/clink sound. @private */
  _playClink(when) {
    const ctx = this.ctx;
    const dur = 0.08;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.015));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // High resonant band-pass gives a ceramic "clink".
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2500 + Math.random() * 3000;
    filter.Q.value = 8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._subMix);
    noise.start(when);
    noise.stop(when + dur + 0.02);
  }

  /** Low-frequency jukebox mechanical hum (1965). @private */
  _startJukeboxHum(when) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60;
    const gain = ctx.createGain();
    gain.gain.value = 0.012;
    osc.connect(gain);
    gain.connect(this._subMix);
    osc.start(when);
    this._activeNodes.push(osc, gain);
  }

  /** Cassette tape hiss (1985). @private */
  _startTapeHiss(when) {
    const ctx = this.ctx;
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 2, 'white');
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;
    const gain = ctx.createGain();
    gain.gain.value = 0.015;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._subMix);
    noise.start(when);
    this._activeNodes.push(noise, filter, gain);
  }

  /** Vinyl crackle for lo-fi era (2025). @private */
  _startVinylCrackle(when) {
    const ctx = this.ctx;
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 3, 'pink');
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.value = 0.02;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._subMix);
    noise.start(when);
    this._activeNodes.push(noise, filter, gain);

    // Random pops
    const popTimer = setInterval(() => {
      if (!this._playing) return;
      if (Math.random() < 0.3) this._playVinylPop(ctx.currentTime);
    }, 500);
    this._activeNodes.push({ disconnect: () => clearInterval(popTimer) });
  }

  /** @private */
  _playVinylPop(when) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 200 + Math.random() * 400;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.008, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.01);
    osc.connect(gain);
    gain.connect(this._subMix);
    osc.start(when);
    osc.stop(when + 0.015);
  }

  /**
   * Fades the ambience sub-mix.
   * @param {number} target
   * @param {number} when
   * @param {number} duration
   */
  fadeTo(target, when, duration) {
    const g = this._subMix.gain;
    g.cancelScheduledValues(when);
    g.setValueAtTime(Math.max(0.0001, g.value), when);
    g.linearRampToValueAtTime(Math.max(0.0001, target), when + duration);
  }

  /** Stops the ambience and releases all nodes/timers. */
  stop() {
    this._playing = false;
    if (this._clinkTimer) {
      clearTimeout(this._clinkTimer);
      this._clinkTimer = null;
    }
    for (const node of this._activeNodes) {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch { /* ignore */ }
    }
    this._activeNodes = [];
    try { this._subMix.disconnect(); } catch { /* ignore */ }
  }
}
/* ============================================================ *
 *  MachineEngine — espresso machine, grinder, and steam SFX
 * ============================================================ */

/**
 * MachineEngine — period-appropriate coffee-machine sound effects.
 *
 * Periodically triggers three sounds based on the era profile:
 *  - Espresso shot: a hissing burst (filtered noise) whose character changes
 *    by machine type (lever / pump / automatic).
 *  - Grinder: a gritty low-frequency noise burst.
 *  - Steam wand: a high-frequency filtered-noise burst.
 *
 * All sounds are synthesised — no audio files required.
 */
class MachineEngine {
  /**
   * @param {AudioContext} ctx
   * @param {Object} params - Machine profile params.
   * @param {GainNode} destination
   */
  constructor(ctx, params, destination) {
    this.ctx = ctx;
    this.params = params;
    this.destination = destination;

    this._subMix = ctx.createGain();
    this._subMix.gain.value = 0;
    this._subMix.connect(destination);

    this._timers = [];
    this._playing = false;
    this._hissNoise = null;
    this._hissGain = null;
  }

  /**
   * Starts the machine engine at the given time.
   * @param {number} when
   */
  start(when) {
    if (this._playing) return;
    this._playing = true;

    // Continuous low-level machine hum/idle.
    this._startIdleHum(when);

    // Periodic event scheduling.
    this._scheduleRepeating('shot', this.params.shotInterval);
    this._scheduleRepeating('steam', this.params.steamInterval);
    this._scheduleRepeating('grind', this.params.grindInterval);
  }

  /** Continuous low-level machine idle hum. @private */
  _startIdleHum(when) {
    const ctx = this.ctx;
    const type = this.params.type;
    // Lever machines are quieter at idle; automatic machines have a pump hum.
    const baseLevel = type === 'leverEspresso' ? 0.008 : 0.02;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = type === 'automaticEspresso' ? 90 : 50;
    const gain = ctx.createGain();
    gain.gain.value = baseLevel;
    osc.connect(gain);
    gain.connect(this._subMix);
    osc.start(when);
    this._idleNodes = [osc, gain];
  }

  /**
   * Schedules a repeating machine event.
   * @private
   * @param {'shot'|'steam'|'grind'} kind
   * @param {number} interval - Average seconds between events.
   */
  _scheduleRepeating(kind, interval) {
    const fire = () => {
      if (!this._playing) return;
      this._playEvent(kind, this.ctx.currentTime);
      // Jitter the next event ±30% for naturalism.
      const jitter = interval * (0.7 + Math.random() * 0.6);
      const timer = setTimeout(fire, jitter * 1000);
      this._timers.push(timer);
    };
    const initial = interval * (0.5 + Math.random() * 0.5);
    const timer = setTimeout(fire, initial * 1000);
    this._timers.push(timer);
  }

  /**
   * Plays a single machine event.
   * @private
   * @param {'shot'|'steam'|'grind'} kind
   * @param {number} when
   */
  _playEvent(kind, when) {
    if (kind === 'shot') this._playShot(when);
    else if (kind === 'steam') this._playSteam(when);
    else this._playGrind(when);
  }

  /** Espresso shot — filtered noise hiss burst. @private */
  _playShot(when) {
    const ctx = this.ctx;
    const profile = this.params.profile;
    const dur = this.params.type === 'leverEspresso' ? 1.5 : 1.2;
    const buffer = createNoiseBuffer(ctx, dur, 'pink');
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.6;

    const gain = ctx.createGain();
    const level = profile.hissLevel ?? 0.15;
    // Quick attack, gradual decay.
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(level, when + 0.08);
    gain.gain.linearRampToValueAtTime(level * 0.6, when + dur * 0.5);
    gain.gain.linearRampToValueAtTime(0, when + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._subMix);
    noise.start(when);
    noise.stop(when + dur + 0.05);
  }

  /** Grinder — gritty low-frequency noise. @private */
  _playGrind(when) {
    const ctx = this.ctx;
    const profile = this.params.profile;
    const dur = 0.8 + Math.random() * 0.6;
    const buffer = createNoiseBuffer(ctx, dur, 'brown');
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = profile.grindPitch ?? 200;
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.14, when + 0.05);
    gain.gain.linearRampToValueAtTime(0.14, when + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0, when + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._subMix);
    noise.start(when);
    noise.stop(when + dur + 0.05);
  }

  /** Steam wand — high-frequency filtered noise. @private */
  _playSteam(when) {
    const ctx = this.ctx;
    const profile = this.params.profile;
    const dur = 2 + Math.random() * 1.5;
    const buffer = createNoiseBuffer(ctx, dur, 'white');
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = profile.steamPitch ?? 1000;

    const gain = ctx.createGain();
    const level = (profile.hissLevel ?? 0.15) * 0.8;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(level, when + 0.15);
    gain.gain.linearRampToValueAtTime(level * 0.7, when + dur * 0.6);
    gain.gain.linearRampToValueAtTime(0, when + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._subMix);
    noise.start(when);
    noise.stop(when + dur + 0.05);
  }

  /**
   * Fades the machine sub-mix.
   * @param {number} target
   * @param {number} when
   * @param {number} duration
   */
  fadeTo(target, when, duration) {
    const g = this._subMix.gain;
    g.cancelScheduledValues(when);
    g.setValueAtTime(Math.max(0.0001, g.value), when);
    g.linearRampToValueAtTime(Math.max(0.0001, target), when + duration);
  }

  /** Stops the machine engine and releases all nodes/timers. */
  stop() {
    this._playing = false;
    for (const timer of this._timers) clearTimeout(timer);
    this._timers = [];
    for (const node of this._idleNodes ?? []) {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch { /* ignore */ }
    }
    this._idleNodes = [];
    try { this._subMix.disconnect(); } catch { /* ignore */ }
  }
}

/* ============================================================ *
 *  AudioManager — top-level orchestrator
 * ============================================================ */

/** Cross-fade duration in seconds (acceptance criterion: 1.5 s). */
const CROSSFADE_SECONDS = 1.5;

/** localStorage keys for persistence. */
const LS_VOLUME_KEY = 'cafe-audio-volume';
const LS_MUTED_KEY = 'cafe-audio-muted';

/** Default master volume (0–1). */
const DEFAULT_VOLUME = 0.6;

/**
 * AudioManager orchestrates the layered café soundscape.
 *
 * Builds the four-bus graph, manages per-era engines, cross-fades between
 * eras, and exposes HUD controls (mute + master volume).  Audio does not
 * autoplay until the user interacts with the page (browser autoplay policy).
 */
export class AudioManager {
  /**
   * @param {Object} [options]
   * @param {EventTarget} [options.timeline] - TimelineSlider instance.
   * @param {number} [options.initialYear]   - Year to load on first unlock.
   */
  constructor({ timeline, initialYear } = {}) {
    this.timeline = timeline ?? null;

    /** @type {AudioContext|null} */
    this._ctx = null;

    /** @type {{music: GainNode, ambience: GainNode, machine: GainNode, master: GainNode}|null} */
    this._buses = null;

    /** @type {Record<number, {music: MusicEngine, ambience: AmbienceEngine, machine: MachineEngine}>} */
    this._engines = {};

    /** @type {number|null} Currently active era year. */
    this._activeYear = null;

    /** @type {boolean} Whether the AudioContext is running. */
    this._unlocked = false;

    /** @type {number} Master volume (0–1), persisted. */
    this._volume = DEFAULT_VOLUME;

    /** @type {boolean} Mute state, persisted. */
    this._muted = false;

    // Restore persisted preferences.
    const savedVol = parseFloat(localStorage.getItem(LS_VOLUME_KEY));
    if (!Number.isNaN(savedVol)) this._volume = Math.max(0, Math.min(1, savedVol));
    this._muted = localStorage.getItem(LS_MUTED_KEY) === '1';

    /** @type {number|null} Year to activate once unlocked. */
    this._pendingYear = initialYear ?? null;

    // Subscribe to timeline changes if provided.
    if (this.timeline) {
      this._onTimelineChange = this._onTimelineChange.bind(this);
      this.timeline.addEventListener('change', this._onTimelineChange);
    }

    // Build the HUD UI.
    this._buildHud();
  }

  /* ---------- Bus graph ---------- */

  /**
   * Lazily creates the AudioContext and the four-bus signal graph.
   * Must be called after a user gesture (autoplay policy).
   * @private
   */
  _ensureContext() {
    if (this._ctx) return;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) {
      console.warn('[AudioManager] Web Audio API not supported');
      return;
    }
    this._ctx = new Ctor();

    // Four buses, each a GainNode, all feeding into masterBus → destination.
    this._buses = {
      music: this._ctx.createGain(),
      ambience: this._ctx.createGain(),
      machine: this._ctx.createGain(),
      master: this._ctx.createGain(),
    };

    // Connect each sub-bus into the master bus.
    this._buses.music.connect(this._buses.master);
    this._buses.ambience.connect(this._buses.master);
    this._buses.machine.connect(this._buses.master);

    // Master bus → speakers.
    this._buses.master.connect(this._ctx.destination);

    // Apply persisted volume/mute.
    this._applyMasterGain();
  }

  /* ---------- Unlock (autoplay gate) ---------- */

  /**
   * Unlocks audio playback.  Call from a user-gesture handler.
   * @returns {Promise<void>}
   */
  async unlock() {
    this._ensureContext();
    if (!this._ctx) return;
    if (this._ctx.state === 'suspended') {
      await this._ctx.resume();
    }
    if (this._unlocked) return;
    this._unlocked = true;
    // Activate the pending era if one was requested before unlock.
    if (this._pendingYear != null) {
      this._setEraImmediate(this._pendingYear);
      this._pendingYear = null;
    }
  }

  /* ---------- Era switching ---------- */

  /**
   * Handles timeline `change` events — triggers the cross-fade.
   * @private
   * @param {CustomEvent} event
   */
  _onTimelineChange(event) {
    const { year } = event.detail;
    if (year === this._activeYear) return;

    if (!this._unlocked) {
      // Audio not yet unlocked; remember the target era for when it is.
      this._pendingYear = year;
      return;
    }
    this.crossFadeTo(year);
  }

  /**
   * Instantly activates an era's engines (no fade).  Used on first unlock.
   * @private
   * @param {number} year
   */
  _setEraImmediate(year) {
    const profile = ERA_AUDIO_PROFILES[year];
    if (!profile) {
      console.warn(`[AudioManager] No audio profile for year ${year}`);
      return;
    }

    // Stop any currently active engines.
    this._stopActiveEngines();

    const engines = this._buildEngines(profile);
    this._engines[year] = engines;
    const when = this._ctx.currentTime;
    engines.music.start(when);
    engines.ambience.start(when);
    engines.machine.start(when);
    // Fade in quickly (0.4 s) for a smooth start.
    engines.music.fadeTo(1, when, 0.4);
    engines.ambience.fadeTo(1, when, 0.4);
    engines.machine.fadeTo(1, when, 0.4);
    this._activeYear = year;
  }

  /**
   * Cross-fades from the current era to a new era over 1.5 s.
   *
   * Fades out the outgoing era's music + ambience while fading in the new
   * era's.  Machine SFX swaps on the transition tick (instant swap after a
   * short fade).
   *
   * @param {number} year - Target era year.
   */
  crossFadeTo(year) {
    if (!this._ctx || !this._unlocked) {
      this._pendingYear = year;
      return;
    }
    const profile = ERA_AUDIO_PROFILES[year];
    if (!profile) {
      console.warn(`[AudioManager] No audio profile for year ${year}`);
      return;
    }
    if (year === this._activeYear) return;

    const ctx = this._ctx;
    const when = ctx.currentTime;
    const dur = CROSSFADE_SECONDS;

    // Build the new era's engines and start them at zero volume.
    const newEngines = this._buildEngines(profile);
    this._engines[year] = newEngines;
    newEngines.music.start(when);
    newEngines.ambience.start(when);
    newEngines.machine.start(when);

    // Fade in the new era's music + ambience (0 → 1).
    newEngines.music.fadeTo(1, when, dur);
    newEngines.ambience.fadeTo(1, when, dur);

    // Machine SFX swap on the change tick: fade the new one in quickly
    // while fading the old one out.
    newEngines.machine.fadeTo(1, when + dur * 0.3, dur * 0.5);

    // Fade out the outgoing era's music + ambience (1 → 0).
    const outgoing = this._engines[this._activeYear];
    if (outgoing) {
      outgoing.music.fadeTo(0, when, dur);
      outgoing.ambience.fadeTo(0, when, dur);
      outgoing.machine.fadeTo(0, when, dur * 0.3);
      // Stop + dispose after the fade completes.
      setTimeout(() => {
        outgoing.music.stop();
        outgoing.ambience.stop();
        outgoing.machine.stop();
      }, (dur + 0.2) * 1000);
    }

    this._activeYear = year;
  }

  /**
   * Constructs the three engines for a given profile.
   * @private
   * @param {EraAudioProfile} profile
   */
  _buildEngines(profile) {
    return {
      music: new MusicEngine(this._ctx, profile.music, this._buses.music),
      ambience: new AmbienceEngine(this._ctx, profile.ambience, this._buses.ambience),
      machine: new MachineEngine(this._ctx, profile.machine, this._buses.machine),
    };
  }

  /**
   * Stops and disposes all currently active era engines.
   * @private
   */
  _stopActiveEngines() {
    for (const year of Object.keys(this._engines)) {
      const e = this._engines[year];
      e.music.stop();
      e.ambience.stop();
      e.machine.stop();
    }
    this._engines = {};
    this._activeYear = null;
  }

  /* ---------- Volume / Mute ---------- */

  /**
   * Applies the current volume + mute state to the master bus gain.
   * @private
   */
  _applyMasterGain() {
    if (!this._buses) return;
    const when = this._ctx ? this._ctx.currentTime : 0;
    const target = this._muted ? 0 : this._volume;
    const g = this._buses.master.gain;
    g.cancelScheduledValues(when);
    g.setValueAtTime(Math.max(0.0001, g.value), when);
    g.linearRampToValueAtTime(target, when + 0.1);
  }

  /**
   * Sets the master volume (0–1) and persists it.
   * @param {number} volume
   */
  setVolume(volume) {
    this._volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem(LS_VOLUME_KEY, String(this._volume));
    // Unmute when the user raises the volume above zero (if currently muted).
    if (this._muted && this._volume > 0) {
      this._muted = false;
      localStorage.setItem(LS_MUTED_KEY, '0');
      this._syncHud();
    }
    this._applyMasterGain();
    this._syncHud();
  }

  /**
   * Toggles mute on/off and persists the state.
   * @returns {boolean} The new muted state.
   */
  toggleMute() {
    this._muted = !this._muted;
    localStorage.setItem(LS_MUTED_KEY, this._muted ? '1' : '0');
    this._applyMasterGain();
    this._syncHud();
    return this._muted;
  }

  /** @returns {boolean} */
  isMuted() { return this._muted; }

  /** @returns {number} */
  getVolume() { return this._volume; }

  /* ---------- HUD ---------- */

  /**
   * Builds the audio HUD: a mute button + master-volume slider.
   * Positioned at the bottom-right of the viewport, styled to match the
   * existing timeline slider design language.
   * @private
   */
  _buildHud() {
    const STYLE_ID = 'cafe-audio-hud-styles';
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        .cafe-audio-hud {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(20, 16, 12, 0.62);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
          user-select: none;
        }
        .cafe-audio-hud__btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #f3ece0;
          font-size: 18px;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
        }
        .cafe-audio-hud__btn:hover { background: rgba(255, 255, 255, 0.2); }
        .cafe-audio-hud__btn:active { transform: scale(0.92); }
        .cafe-audio-hud__btn.is-muted { color: #e88; }
        .cafe-audio-hud__slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100px;
          height: 5px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
          cursor: pointer;
        }
        .cafe-audio-hud__slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffd9a0;
          border: 2px solid #c98a4b;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .cafe-audio-hud__slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffd9a0;
          border: 2px solid #c98a4b;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }

    const hud = document.createElement('div');
    hud.className = 'cafe-audio-hud';
    hud.setAttribute('role', 'group');
    hud.setAttribute('aria-label', 'Audio controls');

    // Mute button
    this._muteBtn = document.createElement('button');
    this._muteBtn.type = 'button';
    this._muteBtn.className = 'cafe-audio-hud__btn';
    this._muteBtn.setAttribute('aria-label', 'Mute / unmute audio');
    this._muteBtn.addEventListener('click', () => {
      this.unlock();
      this.toggleMute();
    });
    hud.appendChild(this._muteBtn);

    // Volume slider
    this._volSlider = document.createElement('input');
    this._volSlider.type = 'range';
    this._volSlider.className = 'cafe-audio-hud__slider';
    this._volSlider.min = '0';
    this._volSlider.max = '1';
    this._volSlider.step = '0.01';
    this._volSlider.value = String(this._volume);
    this._volSlider.setAttribute('aria-label', 'Master volume');
    this._volSlider.addEventListener('input', () => {
      this.unlock();
      this.setVolume(parseFloat(this._volSlider.value));
    });
    hud.appendChild(this._volSlider);

    document.body.appendChild(hud);
    this._syncHud();
  }

  /**
   * Syncs the HUD controls to the current internal state.
   * @private
   */
  _syncHud() {
    if (!this._muteBtn) return;
    this._muteBtn.classList.toggle('is-muted', this._muted);
    this._muteBtn.textContent = this._muted ? '🔇' : '🔊';
    this._muteBtn.setAttribute('aria-pressed', String(this._muted));
    if (this._volSlider) {
      this._volSlider.value = String(this._volume);
      this._volSlider.style.opacity = this._muted ? '0.4' : '1';
    }
  }

  /* ---------- Public accessors (acceptance criteria) ---------- */

  /**
   * Returns the four bus gain nodes.
   * @returns {{music: GainNode, ambience: GainNode, machine: GainNode, master: GainNode}|null}
   */
  getBuses() {
    return this._buses;
  }

  /**
   * Returns the audio profile metadata for a given year.
   * @param {number} year
   * @returns {EraAudioProfile|undefined}
   */
  getEraProfile(year) {
    return ERA_AUDIO_PROFILES[year];
  }

  /**
   * Returns all era audio profiles keyed by year.
   * @returns {Record<number, EraAudioProfile>}
   */
  getAllEraProfiles() {
    return { ...ERA_AUDIO_PROFILES };
  }

  /** @returns {number|null} The currently active era year. */
  getActiveYear() {
    return this._activeYear;
  }

  /**
   * Tears down the AudioManager: stops engines, closes context, removes HUD.
   */
  dispose() {
    this._stopActiveEngines();
    if (this.timeline && this._onTimelineChange) {
      this.timeline.removeEventListener('change', this._onTimelineChange);
    }
    if (this._ctx) {
      this._ctx.close();
      this._ctx = null;
      this._buses = null;
    }
  }
}

export default AudioManager;
