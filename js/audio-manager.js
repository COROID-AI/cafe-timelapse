/**
 * AudioManager — period music + ambient SFX for the Café Time Period Timelapse.
 *
 * Uses the Web Audio API to synthesise everything in-browser (no external
 * audio assets), delivering the README's SFX requirement: period-appropriate
 * music plus the murmur of conversation and the hiss and clatter of the
 * coffee machine.
 *
 * Responsibilities
 *   1. Lazily create / resume the AudioContext on the first user gesture so the
 *      browser's autoplay policy is satisfied.
 *   2. Continuously loop an ambient bed: conversation murmur (filtered, slowly
 *      modulated noise) + coffee-machine steam hiss + intermittent cup clatter.
 *   3. Map each era to its own synthesised music track and cross-fade between
 *      tracks whenever the active period changes.
 *   4. Provide a mute / unmute UI control (and API) that toggles all output.
 *
 * Integration
 *   import { AudioManager } from './audio-manager.js';
 *   const audio = new AudioManager();
 *   audio.unlockOnGesture();        // arm gesture unlock
 *   audio.start(initialYear);       // begin ambient + initial music
 *   // AudioManager auto-listens for `period-change` window events, so era
 *   // swaps cross-fade automatically — no manual wiring required.
 */

// ---------------------------------------------------------------------------
// Note-frequency helpers
// ---------------------------------------------------------------------------

/** Map of "<NOTE><OCTAVE>" (e.g. "A4", "C#3") → frequency in Hz. */
const NOTE_FREQS = (() => {
  const map = {};
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  // A4 = 440 Hz is the reference; every pitch is derived from it.
  for (let octave = 1; octave <= 6; octave++) {
    names.forEach((name, i) => {
      const semitonesFromA4 = i + (octave - 4) * 12 - 9;
      map[name + octave] = 440 * Math.pow(2, semitonesFromA4 / 12);
    });
  }
  return map;
})();

/** Look up the frequency for a note name (e.g. freq('D3') → ~146.83). */
const freq = (note) => NOTE_FREQS[note];

// ---------------------------------------------------------------------------
// Low-level synth primitives
// ---------------------------------------------------------------------------

/** Create a looping white-noise AudioBuffer (mono). */
function createNoiseBuffer(ctx, seconds = 2) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/**
 * Schedule a single enveloped oscillator note on the Web Audio timeline.
 *
 * @param {AudioContext} ctx
 * @param {AudioNode} dest           Destination node.
 * @param {OscillatorType} wave      Oscillator waveform.
 * @param {number} hz                Pitch in Hz.
 * @param {number} start             Absolute ctx.currentTime to begin.
 * @param {number} duration          Note length in seconds.
 * @param {number} peak              Peak gain (0–1).
 * @param {number|null} filterCutoff Optional low-pass cutoff in Hz.
 */
function playNote(ctx, dest, wave, hz, start, duration, peak, filterCutoff) {
  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.value = hz;

  let stage = osc;
  if (filterCutoff) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = filterCutoff;
    lp.Q.value = 0.7;
    osc.connect(lp);
    stage = lp;
  }

  const env = ctx.createGain();
  // Quick attack → sustain → exponential release (click-free).
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(peak, start + 0.018);
  env.gain.setValueAtTime(peak, start + duration * 0.55);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  stage.connect(env);
  env.connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

// ---------------------------------------------------------------------------
// Era music definitions
// ---------------------------------------------------------------------------

/**
 * Each era maps to a 4-bar chord progression. Bars are 4/4; one chord lasts
 * one bar (8 eighth notes). The MusicTrack adds a sustained pad, a bass line
 * on beats 1 & 3, and an arpeggiated lead — all derived from the chord tones,
 * so a compact progression yields a full, looping, era-appropriate bed.
 *
 * @typedef {Object} EraMusic
 * @property {string} name
 * @property {number} bpm
 * @property {number} swing       Off-beat swing factor (0 = straight).
 * @property {{pad:OscillatorType,bass:OscillatorType,lead:OscillatorType}} waves
 * @property {number} padFilter   Low-pass cutoff for the pad (Hz).
 * @property {number} leadFilter  Low-pass cutoff for the lead (Hz).
 * @property {number} arpEvery    Arpeggio every N eighth notes (1 or 2).
 * @property {{bass:string,tones:string[]}[]} progression
 */
const ERA_MUSIC = {
  // 1945 — warm swing/jazz turnaround (Dm7 – G7 – Cmaj7 – A7).
  1945: {
    name: 'Swing Café',
    bpm: 104,
    swing: 0.62,
    waves: { pad: 'triangle', bass: 'sine', lead: 'triangle' },
    padFilter: 2400,
    leadFilter: 3200,
    arpEvery: 1,
    progression: [
      { bass: 'D2', tones: ['D3', 'F3', 'A3', 'C4'] },
      { bass: 'G2', tones: ['G3', 'B3', 'D4', 'F4'] },
      { bass: 'C2', tones: ['C3', 'E3', 'G3', 'B3'] },
      { bass: 'A1', tones: ['A2', 'C#3', 'E3', 'G3'] },
    ],
  },
  // 1965 — gentle lounge bossa (Cmaj7 – Am7 – Dm7 – G7).
  1965: {
    name: 'Lounge Bossa',
    bpm: 96,
    swing: 0,
    waves: { pad: 'sine', bass: 'sine', lead: 'triangle' },
    padFilter: 1800,
    leadFilter: 2600,
    arpEvery: 2,
    progression: [
      { bass: 'C2', tones: ['C3', 'E3', 'G3', 'B3'] },
      { bass: 'A1', tones: ['A2', 'C3', 'E3', 'G3'] },
      { bass: 'D2', tones: ['D3', 'F3', 'A3', 'C4'] },
      { bass: 'G1', tones: ['G2', 'B2', 'D3', 'F3'] },
    ],
  },
  // 1985 — bright synth-pop minor (Cm7 – Abmaj7 – Ebmaj7 – Bb7).
  1985: {
    name: 'Synth Pop',
    bpm: 124,
    swing: 0,
    waves: { pad: 'sawtooth', bass: 'square', lead: 'sawtooth' },
    padFilter: 1700,
    leadFilter: 4200,
    arpEvery: 1,
    progression: [
      { bass: 'C2', tones: ['C3', 'D#3', 'G3', 'A#3'] },
      { bass: 'G#1', tones: ['G#2', 'C3', 'D#3', 'G3'] },
      { bass: 'D#2', tones: ['D#3', 'G3', 'A#3', 'D4'] },
      { bass: 'A#1', tones: ['A#2', 'D3', 'F3', 'G#3'] },
    ],
  },
  // 2005 — smooth lounge turnaround (Am7 – Dm7 – G7 – Cmaj7).
  2005: {
    name: 'Smooth Lounge',
    bpm: 100,
    swing: 0.1,
    waves: { pad: 'sine', bass: 'sine', lead: 'triangle' },
    padFilter: 2100,
    leadFilter: 2900,
    arpEvery: 2,
    progression: [
      { bass: 'A1', tones: ['A2', 'C3', 'E3', 'G3'] },
      { bass: 'D2', tones: ['D3', 'F3', 'A3', 'C4'] },
      { bass: 'G1', tones: ['G2', 'B2', 'D3', 'F3'] },
      { bass: 'C2', tones: ['C3', 'E3', 'G3', 'B3'] },
    ],
  },
  // 2025 — dreamy lo-fi ambient (Cmaj7 – Em7 – Fmaj7 – G).
  2025: {
    name: 'Lo-fi Ambient',
    bpm: 82,
    swing: 0,
    waves: { pad: 'sine', bass: 'sine', lead: 'sine' },
    padFilter: 900,
    leadFilter: 1500,
    arpEvery: 2,
    progression: [
      { bass: 'C2', tones: ['C3', 'E3', 'G3', 'B3'] },
      { bass: 'E2', tones: ['E3', 'G3', 'B3', 'D4'] },
      { bass: 'F2', tones: ['F3', 'A3', 'C4', 'E4'] },
      { bass: 'G2', tones: ['G3', 'B3', 'D4', 'F#4'] },
    ],
  },
};

// ---------------------------------------------------------------------------
// AmbientLayer — looping conversation murmur + coffee machine SFX
// ---------------------------------------------------------------------------

/**
 * A continuous ambient bed of synthesised café sound: band-pass-modulated
 * noise for the murmur of conversation, high-pass noise for the steam hiss of
 * the coffee machine, and intermittent filtered-noise bursts for cup clatter.
 */
class AmbientLayer {
  /**
   * @param {AudioContext} ctx
   * @param {AudioNode} destination
   * @param {{murmur:number,hiss:number,clatter:number}} levels Per-layer peaks.
   */
  constructor(ctx, destination, levels) {
    this.ctx = ctx;
    this.destination = destination;
    this.levels = levels;
    this._nodes = [];
    this._running = false;
    this._clatterTimer = null;
    this._noiseBuffer = null;
    this._clatterBuffer = null;
  }

  /** Build and connect every ambient voice, then start them. */
  start() {
    if (this._running) return;
    this._running = true;

    this._noiseBuffer = createNoiseBuffer(this.ctx, 2);
    this._clatterBuffer = createNoiseBuffer(this.ctx, 0.25);

    // One looping white-noise source fans out to every ambient voice.
    const noise = this.ctx.createBufferSource();
    noise.buffer = this._noiseBuffer;
    noise.loop = true;

    // --- Conversation murmur: mid band, slowly modulated gain ---------------
    const murmur = this.ctx.createBiquadFilter();
    murmur.type = 'bandpass';
    murmur.frequency.value = 480;
    murmur.Q.value = 0.8;

    const murmurGain = this.ctx.createGain();
    murmurGain.gain.value = this.levels.murmur;

    // Slow LFO on the murmur gain simulates the ebb & flow of chatter.
    const murmurLfo = this.ctx.createOscillator();
    murmurLfo.frequency.value = 0.7;
    const murmurLfoDepth = this.ctx.createGain();
    murmurLfoDepth.gain.value = this.levels.murmur * 0.5;
    murmurLfo.connect(murmurLfoDepth);
    murmurLfoDepth.connect(murmurGain.gain);

    noise.connect(murmur);
    murmur.connect(murmurGain);
    murmurGain.connect(this.destination);

    // --- Higher "chatter" band for richness --------------------------------
    const chatter = this.ctx.createBiquadFilter();
    chatter.type = 'bandpass';
    chatter.frequency.value = 1100;
    chatter.Q.value = 0.9;
    const chatterGain = this.ctx.createGain();
    chatterGain.gain.value = this.levels.murmur * 0.45;
    noise.connect(chatter);
    chatter.connect(chatterGain);
    chatterGain.connect(this.destination);

    // --- Coffee-machine steam hiss: steady high band ------------------------
    const hiss = this.ctx.createBiquadFilter();
    hiss.type = 'highpass';
    hiss.frequency.value = 3800;
    const hissGain = this.ctx.createGain();
    hissGain.gain.value = this.levels.hiss;
    // Gentle shimmer so the hiss breathes slightly.
    const hissLfo = this.ctx.createOscillator();
    hissLfo.frequency.value = 0.35;
    const hissLfoDepth = this.ctx.createGain();
    hissLfoDepth.gain.value = this.levels.hiss * 0.3;
    hissLfo.connect(hissLfoDepth);
    hissLfoDepth.connect(hissGain.gain);
    noise.connect(hiss);
    hiss.connect(hissGain);
    hissGain.connect(this.destination);

    noise.start();
    murmurLfo.start();
    hissLfo.start();

    this._nodes = [
      noise, murmur, murmurGain, murmurLfo, murmurLfoDepth,
      chatter, chatterGain, hiss, hissGain, hissLfo, hissLfoDepth,
    ];

    // --- Intermittent cup / machine clatter (scheduled bursts) -------------
    this._scheduleClatter();
  }

  /** Randomly space out short filtered-noise bursts to mimic cup clatter. */
  _scheduleClatter() {
    if (!this._running) return;
    const delay = 1800 + Math.random() * 2600; // 1.8s – 4.4s
    this._clatterTimer = setTimeout(() => {
      this._burst();
      this._scheduleClatter();
    }, delay);
  }

  /** Spawn a single short clatter burst on the audio timeline. */
  _burst() {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this._clatterBuffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500 + Math.random() * 2000;
    bp.Q.value = 1.2;

    const g = ctx.createGain();
    const peak = this.levels.clatter * (0.6 + Math.random() * 0.6);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(peak, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    src.connect(bp);
    bp.connect(g);
    g.connect(this.destination);
    src.start(now);
    src.stop(now + 0.25);
  }

  /** Stop all voices and clear the clatter scheduler. */
  stop() {
    this._running = false;
    if (this._clatterTimer) {
      clearTimeout(this._clatterTimer);
      this._clatterTimer = null;
    }
    for (const node of this._nodes) {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (_) {
        /* already stopped */
      }
    }
    this._nodes = [];
  }
}

// ---------------------------------------------------------------------------
// MusicTrack — one synthesised, looping, cross-fadeable era track
// ---------------------------------------------------------------------------

/**
 * Schedules a looping era progression using the classic Web Audio look-ahead
 * pattern (schedule notes ~120 ms ahead via a short setInterval). Output gain
 * starts silent so the AudioManager can cross-fade it in/out.
 */
class MusicTrack {
  /**
   * @param {AudioContext} ctx
   * @param {AudioNode} destination  Music bus gain.
   * @param {EraMusic} config
   * @param {number} level           Target output gain (post cross-fade).
   */
  constructor(ctx, destination, config, level) {
    this.ctx = ctx;
    this.config = config;
    this.level = level;

    this.output = ctx.createGain();
    this.output.gain.value = 0.0001; // silent until faded in
    this.output.connect(destination);

    this._step = 0;
    this._nextNoteTime = 0;
    this._timer = null;
    this._running = false;
    this._tick = this._tick.bind(this);
  }

  /** Begin scheduling the loop. */
  start() {
    if (this._running) return;
    this._running = true;
    this._step = 0;
    this._nextNoteTime = this.ctx.currentTime + 0.1;
    this._timer = setTimeout(this._tick, 25);
  }

  /** Smoothly raise output to the target level. */
  fadeIn(duration) {
    const t = this.ctx.currentTime;
    this.output.gain.cancelScheduledValues(t);
    this.output.gain.setValueAtTime(Math.max(0.0001, this.output.gain.value), t);
    this.output.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.level), t + duration);
  }

  /** Smoothly lower output to silence, then stop the scheduler. */
  fadeOut(duration, onDone) {
    const t = this.ctx.currentTime;
    this.output.gain.cancelScheduledValues(t);
    this.output.gain.setValueAtTime(Math.max(0.0001, this.output.gain.value), t);
    this.output.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    const self = this;
    setTimeout(() => {
      self.stop();
      if (onDone) onDone();
    }, duration * 1000 + 60);
  }

  /** Stop scheduling and disconnect output. */
  stop() {
    this._running = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    try {
      this.output.disconnect();
    } catch (_) {
      /* already disconnected */
    }
  }

  // --- Scheduler ------------------------------------------------------------

  _tick() {
    if (!this._running) return;
    const eighth = 60 / this.config.bpm / 2; // seconds per eighth note
    const lookahead = 0.12;
    while (this._nextNoteTime < this.ctx.currentTime + lookahead) {
      this._scheduleStep(this._step, this._nextNoteTime, eighth);
      this._nextNoteTime += eighth;
      this._step = (this._step + 1) % 32; // 4 chords × 8 eighths
    }
    this._timer = setTimeout(this._tick, 25);
  }

  _scheduleStep(step, time, eighth) {
    const cfg = this.config;
    const chord = cfg.progression[Math.floor(step / 8)];
    const inBar = step % 8;

    // Swing: delay off-beat (odd) eighths.
    const swingOffset = inBar % 2 === 1 ? cfg.swing * eighth * 0.66 : 0;
    const t = time + swingOffset;

    // Sustained chord pad at the top of each bar.
    if (inBar === 0) {
      const dur = eighth * 8 * 0.95;
      for (const note of chord.tones) {
        playNote(this.ctx, this.output, cfg.waves.pad, freq(note), t, dur, 0.1, cfg.padFilter);
      }
    }

    // Bass on beats 1 and 3.
    if (inBar === 0 || inBar === 4) {
      playNote(this.ctx, this.output, cfg.waves.bass, freq(chord.bass), t, eighth * 3.5, 0.22, null);
    }

    // Arpeggiated lead cycling through the chord tones, one octave up.
    if (step % cfg.arpEvery === 0) {
      const idx = Math.floor(step / cfg.arpEvery) % chord.tones.length;
      const leadHz = freq(chord.tones[idx]) * 2;
      playNote(this.ctx, this.output, cfg.waves.lead, leadHz, t, eighth * 1.4, 0.06, cfg.leadFilter);
    }
  }
}

// ---------------------------------------------------------------------------
// AudioManager — public façade
// ---------------------------------------------------------------------------

export class AudioManager {
  /**
   * @param {object} [options]
   * @param {number} [options.crossfade=1.5]      Music cross-fade duration (s).
   * @param {number} [options.masterVolume=0.9]   Master output level.
   * @param {number} [options.musicLevel=0.32]    Per-track music level.
   * @param {{murmur:number,hiss:number,clatter:number}} [options.ambient]
   */
  constructor(options = {}) {
    this.options = Object.assign(
      {
        crossfade: 1.5,
        masterVolume: 0.9,
        musicLevel: 0.32,
        ambient: { murmur: 0.16, hiss: 0.06, clatter: 0.12 },
      },
      options
    );

    /** @type {AudioContext|null} */
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.ambientBus = null;

    /** @type {AmbientLayer|null} */
    this._ambient = null;
    /** @type {MusicTrack|null} */
    this._track = null;
    this._currentYear = null;

    this._muted = false;
    this._unlocked = false;
    this._started = false;

    this._onPeriodChange = (event) => {
      const { year } = event.detail || {};
      if (year != null) this.playMusicForPeriod(year);
    };

    this._buildMuteButton();
  }

  /** Whether all audio is currently muted. */
  get isMuted() {
    return this._muted;
  }

  /** Whether the AudioContext has been created (i.e. a gesture occurred). */
  get isUnlocked() {
    return this._unlocked;
  }

  /**
   * Create (or resume) the AudioContext. Safe to call repeatedly — it is a
   * no-op once unlocked. Must be invoked from within a user-gesture handler to
   * satisfy browser autoplay policies.
   *
   * @returns {boolean} true if the context is available.
   */
  unlock() {
    if (this._unlocked) {
      this._resume();
      return true;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return false;

    this.ctx = new Ctor();

    this.master = this.ctx.createGain();
    this.master.gain.value = this._muted ? 0.0001 : this.options.masterVolume;
    this.master.connect(this.ctx.destination);

    this.musicBus = this.ctx.createGain();
    this.musicBus.connect(this.master);

    this.ambientBus = this.ctx.createGain();
    this.ambientBus.connect(this.master);

    this._unlocked = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Start the continuous ambient bed.
    this._ambient = new AmbientLayer(this.ctx, this.ambientBus, this.options.ambient);
    this._ambient.start();

    // Begin music for whatever period is currently active.
    const year = this._currentYear ?? window.Cafe?.timeline?.currentYear ?? null;
    if (year != null) this.playMusicForPeriod(year);

    return true;
  }

  /** Resume a suspended context (e.g. after returning to the tab). */
  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  /**
   * Arm a one-shot gesture listener (click / keydown / touchstart) that unlocks
   * audio on the first interaction. Removes itself after firing.
   */
  unlockOnGesture() {
    const arm = () => {
      this.unlock();
      window.removeEventListener('click', arm);
      window.removeEventListener('keydown', arm);
      window.removeEventListener('touchstart', arm);
    };
    window.addEventListener('click', arm);
    window.addEventListener('keydown', arm);
    window.addEventListener('touchstart', arm);
    return this;
  }

  /**
   * Subscribe to timeline `period-change` events and remember the initial era.
   * Call after construction (typically right after the TimelineUI exists).
   *
   * @param {number} [initialYear]
   */
  start(initialYear) {
    window.addEventListener('period-change', this._onPeriodChange);
    this._currentYear = initialYear ?? window.Cafe?.timeline?.currentYear ?? null;
    this._started = true;
    if (this._unlocked && this._currentYear != null) {
      this.playMusicForPeriod(this._currentYear);
    }
    return this;
  }

  /**
   * Cross-fade into the music track mapped to `year`. If audio is not yet
   * unlocked, the year is remembered and played once a gesture occurs.
   *
   * @param {number} year
   */
  playMusicForPeriod(year) {
    this._currentYear = year;
    if (!this._unlocked || !this.ctx) return;

    const config = ERA_MUSIC[year];
    if (!config) return;

    const incoming = new MusicTrack(this.ctx, this.musicBus, config, this.options.musicLevel);
    incoming.start();
    incoming.fadeIn(this.options.crossfade);

    const outgoing = this._track;
    this._track = incoming;
    if (outgoing) outgoing.fadeOut(this.options.crossfade);
  }

  /** Toggle mute on/off. Returns the new muted state. */
  toggleMute() {
    return this.setMuted(!this._muted);
  }

  /**
   * Mute or unmute all audio output with a short ramp.
   *
   * @param {boolean} muted
   * @returns {boolean} the new muted state.
   */
  setMuted(muted) {
    this._muted = !!muted;
    this._updateMuteButton();
    if (!this.ctx || !this.master) return this._muted;

    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), t);
    this.master.gain.linearRampToValueAtTime(
      this._muted ? 0.0001 : this.options.masterVolume,
      t + 0.25
    );
    return this._muted;
  }

  // --- Mute / unmute UI control ---------------------------------------------

  /** Inject a compact floating mute button (self-contained styles). */
  _buildMuteButton() {
    if (!document.getElementById('cafe-audio-styles')) {
      const style = document.createElement('style');
      style.id = 'cafe-audio-styles';
      style.textContent = `
        .cafe-audio-toggle{
          position:fixed;top:16px;right:16px;z-index:50;
          width:44px;height:44px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          background:rgba(20,20,28,0.55);color:#fff;
          border:1px solid rgba(255,255,255,0.18);
          backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
          cursor:pointer;font-size:18px;line-height:1;padding:0;
          opacity:.85;transition:background .2s ease,transform .1s ease,opacity .2s ease;
        }
        .cafe-audio-toggle:hover{background:rgba(40,40,56,0.7);opacity:1;}
        .cafe-audio-toggle:active{transform:scale(.94);}
        .cafe-audio-toggle:focus-visible{outline:2px solid rgba(255,255,255,0.6);outline-offset:2px;}
        .cafe-audio-toggle.is-muted{opacity:.6;}
      `;
      document.head.appendChild(style);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cafe-audio-toggle';
    btn.setAttribute('aria-label', 'Mute audio');
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = '<span class="cafe-audio-icon" aria-hidden="true">🔊</span>';
    btn.addEventListener('click', () => {
      this.unlock(); // first click on the control also satisfies the gesture
      this.toggleMute();
    });
    document.body.appendChild(btn);
    this._button = btn;
  }

  /** Reflect the current mute state in the button (icon + aria). */
  _updateMuteButton() {
    if (!this._button) return;
    const icon = this._button.querySelector('.cafe-audio-icon');
    if (icon) icon.textContent = this._muted ? '🔇' : '🔊';
    this._button.classList.toggle('is-muted', this._muted);
    this._button.setAttribute('aria-pressed', String(this._muted));
    this._button.setAttribute('aria-label', this._muted ? 'Unmute audio' : 'Mute audio');
  }

  /** Tear everything down: unsubscribe, stop voices, close context. */
  dispose() {
    window.removeEventListener('period-change', this._onPeriodChange);
    if (this._track) this._track.stop();
    if (this._ambient) this._ambient.stop();
    if (this._button) this._button.remove();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this._unlocked = false;
  }
}

export default AudioManager;
