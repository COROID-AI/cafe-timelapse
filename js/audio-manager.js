/**
 * AudioManager — Web Audio API synthesised soundscape for the café.
 *
 * Three independent layers:
 *   • Ambient  — continuous filtered-noise conversation murmur (~0.1–0.2 gain).
 *   • Music    — period-appropriate synthesised melodies that crossfade on change.
 *   • SFX      — coffee-machine hiss/clatter triggered at random 5–15s intervals.
 *
 * All audio is generated procedurally via oscillators and noise buffers —
 * no external audio files are loaded.
 *
 * Autoplay-policy compliant: the AudioContext is created lazily on the first
 * user gesture (click/tap) via `init()`.
 */

import { YEARS } from "./config.js";

/** Default per-layer volume levels (linear gain 0..1). */
const DEFAULT_VOLUMES = {
  ambient: 0.15,
  music: 0.22,
  sfx: 0.35,
};

/** Crossfade duration (seconds) when switching music between periods. */
const MUSIC_CROSSFADE = 1.5;

/** Min/max delay (ms) between automatic coffee-machine SFX triggers. */
const SFX_MIN_INTERVAL = 5000;
const SFX_MAX_INTERVAL = 15000;

/**
 * Period music definitions.
 *
 * Each entry describes a short looping melodic motif synthesised from
 * oscillators. `notes` is a sequence of MIDI note numbers; `tempo` is the
 * per-note duration in seconds; `wave` selects the oscillator waveform;
 * `filterFreq` shapes the timbre to evoke the era's playback medium.
 */
const PERIOD_MUSIC = {
  1945: {
    // Warm, crackling wireless-set swing — mellow sine/triangle ballad.
    notes: [62, 65, 69, 72, 71, 67, 65, 62],
    tempo: 0.45,
    wave: "triangle",
    filterFreq: 1800,
  },
  1965: {
    // Bright jukebox pop — punchy square-wave melody.
    notes: [64, 67, 71, 72, 74, 72, 71, 67],
    tempo: 0.32,
    wave: "square",
    filterFreq: 2600,
  },
  1985: {
    // Synthy boombox — sawtooth lead with a softer low-pass.
    notes: [57, 60, 64, 67, 64, 60, 62, 64],
    tempo: 0.28,
    wave: "sawtooth",
    filterFreq: 2200,
  },
  2005: {
    // Clean iPod-era acoustic-pop — warm sine arpeggio.
    notes: [60, 64, 67, 72, 67, 64, 72, 67],
    tempo: 0.3,
    wave: "sine",
    filterFreq: 3200,
  },
  2025: {
    // Modern lo-fi phone stream — mellow triangle with airy filter sweep.
    notes: [60, 63, 67, 70, 67, 63, 65, 67],
    tempo: 0.36,
    wave: "triangle",
    filterFreq: 3500,
  },
};

/** Convert a MIDI note number to its frequency in Hz. */
function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;

    /** Master gain node (all layers route through this). */
    this.master = null;

    /** Per-layer gain nodes. */
    this.gains = { ambient: null, music: null, sfx: null };

    /** Per-layer user volume multipliers (0..1). */
    this.volumes = { ...DEFAULT_VOLUMES };

    /** Shared noise buffer used by ambient + SFX layers. */
    this.noiseBuffer = null;

    /** Active ambient source node (kept running once started). */
    this.ambientSource = null;

    /** Currently playing music voice (oscillators + gain), if any. */
    this.musicVoice = null;

    /** Currently playing music year (null when silent). */
    this.musicYear = null;

    /** setTimeout handle for the next automatic SFX trigger. */
    this.sfxTimer = null;

    /** Whether the manager has been initialised (AudioContext created). */
    this.initialised = false;

    /** Whether ambient + SFX loops are currently active. */
    this.ambientPlaying = false;
  }

  // ------------------------------------------------------------------ //
  //  Lifecycle                                                         //
  // ------------------------------------------------------------------ //

  /**
   * Create the AudioContext and wire up the master/layer gains.
   *
   * Must be invoked from a user-gesture handler (click/tap) to satisfy
   * browser autoplay policies. Safe to call multiple times.
   *
   * @returns {boolean} true if the context is ready (now or already was).
   */
  init() {
    if (this.initialised) {
      // Already created — just resume if it was suspended.
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return true;
    }

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      console.warn("AudioManager: Web Audio API is not supported in this browser.");
      return false;
    }

    this.ctx = new Ctx();

    // Master gain → destination.
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);

    // Per-layer gains → master.
    Object.keys(this.gains).forEach((layer) => {
      const g = this.ctx.createGain();
      g.gain.value = this.volumes[layer];
      g.connect(this.master);
      this.gains[layer] = g;
    });

    // Pre-render a reusable white-noise buffer.
    this.noiseBuffer = this._createNoiseBuffer(2);

    this.initialised = true;
    console.log("AudioManager: AudioContext ready.");
    return true;
  }

  /**
   * Stop everything, tear down voices, and close the AudioContext.
   */
  async stopAll() {
    this._clearSfxTimer();

    if (this.musicVoice) {
      this._stopMusicVoice(this.musicVoice, 0.2);
      this.musicVoice = null;
      this.musicYear = null;
    }

    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch (_e) {
        /* already stopped */
      }
      this.ambientSource = null;
    }
    this.ambientPlaying = false;

    if (this.ctx) {
      try {
        await this.ctx.close();
      } catch (_e) {
        /* ignore */
      }
    }
    this.ctx = null;
    this.master = null;
    this.gains = { ambient: null, music: null, sfx: null };
    this.initialised = false;
  }

  // ------------------------------------------------------------------ //
  //  Ambient layer                                                     //
  // ------------------------------------------------------------------ //

  /**
   * Start (or ensure running) the continuous conversation-murmur ambient
   * layer: a looping filtered-noise bed shaped to resemble distant chatter.
   */
  playAmbient() {
    if (!this._ensureReady()) return;
    if (this.ambientPlaying) return; // already running

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    // Band-pass filter centred on speech frequencies for a "murmur" feel.
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 500;
    bandpass.Q.value = 0.8;

    // Slow LFO on the filter frequency to simulate the ebb/flow of voices.
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.2;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);

    source.connect(bandpass);
    bandpass.connect(this.gains.ambient);

    source.start();
    lfo.start();

    this.ambientSource = source;
    this.ambientPlaying = true;

    // Begin auto-triggering the coffee-machine SFX at random intervals.
    this._startAutoSfx();
  }

  // ------------------------------------------------------------------ //
  //  Music layer                                                       //
  // ------------------------------------------------------------------ //

  /**
   * Crossfade to the music motif for the given year. If a different motif
   * is already playing it fades out over `MUSIC_CROSSFADE` seconds while
   * the new one fades in. No-op if the requested year is already playing.
   *
   * @param {number} year — one of the YEARS entries (1945..2025).
   */
  playMusicForPeriod(year) {
    if (!this._ensureReady()) return;
    if (!PERIOD_MUSIC[year]) {
      console.warn(`AudioManager: no music definition for year ${year}.`);
      return;
    }
    if (this.musicYear === year && this.musicVoice) return; // already playing

    const now = this.ctx.currentTime;
    const newVoice = this._createMusicVoice(PERIOD_MUSIC[year], now);

    // Fade out the previous voice (if any) then dispose it.
    if (this.musicVoice) {
      this._stopMusicVoice(this.musicVoice, MUSIC_CROSSFADE);
    }

    this.musicVoice = newVoice;
    this.musicYear = year;
  }

  /**
   * Build a looping music voice: a low-pass-filtered oscillator that steps
   * through the motif's note sequence, faded in over `MUSIC_CROSSFADE`.
   */
  _createMusicVoice(def, startTime) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, startTime);
    voiceGain.gain.exponentialRampToValueAtTime(1, startTime + MUSIC_CROSSFADE);

    // Low-pass filter to colour the timbre per era.
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = def.filterFreq;
    filter.Q.value = 1;

    filter.connect(voiceGain);
    voiceGain.connect(this.gains.music);

    // Schedule the note sequence as a repeating loop.
    const stepDur = def.tempo;
    const oscillators = [];
    let t = startTime + 0.05;

    // Schedule two full loops ahead so the voice keeps sounding; the loop
    // is refreshed by a setInterval that re-schedules further ahead.
    const scheduleLoop = (startT) => {
      def.notes.forEach((midi) => {
        const osc = this.ctx.createOscillator();
        osc.type = def.wave;
        osc.frequency.setValueAtTime(midiToFreq(midi), startT);
        osc.connect(filter);
        osc.start(startT);
        osc.stop(startT + stepDur);
        oscillators.push(osc);
        startT += stepDur;
      });
      return startT;
    };

    let nextStart = scheduleLoop(t);
    nextStart = scheduleLoop(nextStart);

    // Keep scheduling loops until the voice is stopped.
    const loopMs = def.notes.length * stepDur * 1000;
    const voice = { gain: voiceGain, filter, oscillators, intervalId: null };
    voice.intervalId = setInterval(() => {
      if (!this.ctx || this.musicVoice !== voice) return;
      // Schedule one more loop to land right after the last scheduled note.
      const ahead = this.ctx.currentTime + 0.2;
      while (nextStart < ahead + loopMs / 1000) {
        nextStart = scheduleLoop(nextStart);
      }
    }, loopMs);

    return voice;
  }

  /**
   * Fade out and dispose a music voice.
   * @param {object} voice  — the voice object returned by `_createMusicVoice`.
   * @param {number} fade   — fade-out duration in seconds.
   */
  _stopMusicVoice(voice, fade) {
    if (!this.ctx || !voice) return;
    const now = this.ctx.currentTime;
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + fade);
    } catch (_e) {
      /* gain already disposed */
    }
    clearInterval(voice.intervalId);
    // Let the fade finish, then disconnect.
    setTimeout(() => {
      voice.oscillators.forEach((osc) => {
        try {
          osc.disconnect();
        } catch (_e) {
          /* already gone */
        }
      });
      try {
        voice.filter.disconnect();
        voice.gain.disconnect();
      } catch (_e) {
        /* ignore */
      }
    }, fade * 1000 + 50);
  }

  // ------------------------------------------------------------------ //
  //  SFX layer                                                         //
  // ------------------------------------------------------------------ //

  /**
   * Trigger a single coffee-machine sound effect: a steam hiss (filtered
   * noise burst) followed by a mechanical clatter (short percussive hits).
   */
  triggerSFX() {
    if (!this._ensureReady()) return;
    this._playHiss();
    // Clatter lands just after the hiss tails off.
    setTimeout(() => this._playClatter(), 350);
  }

  /**
   * Begin auto-triggering the coffee-machine SFX at random intervals
   * (5–15s). Called automatically once ambient starts; safe to call again.
   */
  _startAutoSfx() {
    this._clearSfxTimer();
    const schedule = () => {
      const delay =
        SFX_MIN_INTERVAL +
        Math.random() * (SFX_MAX_INTERVAL - SFX_MIN_INTERVAL);
      this.sfxTimer = setTimeout(() => {
        this.triggerSFX();
        schedule();
      }, delay);
    };
    schedule();
  }

  /** Clear any pending auto-SFX timer. */
  _clearSfxTimer() {
    if (this.sfxTimer) {
      clearTimeout(this.sfxTimer);
      this.sfxTimer = null;
    }
  }

  /** Synthesise a short steam-hiss burst from filtered white noise. */
  _playHiss() {
    const now = this.ctx.currentTime;
    const dur = 0.6;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3000;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.9, now + 0.08);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(hp);
    hp.connect(env);
    env.connect(this.gains.sfx);

    src.start(now);
    src.stop(now + dur + 0.05);
  }

  /** Synthesise a mechanical clatter: a few quick percussive noise hits. */
  _playClatter() {
    const now = this.ctx.currentTime;
    const hits = 4;
    for (let i = 0; i < hits; i++) {
      const t = now + i * 0.06;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;

      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1200 + i * 200;
      bp.Q.value = 2;

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.7, t + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

      src.connect(bp);
      bp.connect(env);
      env.connect(this.gains.sfx);

      src.start(t);
      src.stop(t + 0.12);
    }
  }

  // ------------------------------------------------------------------ //
  //  Volume                                                            //
  // ------------------------------------------------------------------ //

  /**
   * Set the volume for a single layer.
   *
   * @param {("ambient"|"music"|"sfx")} layer
   * @param {number} value — 0..1
   */
  setVolume(layer, value) {
    if (!(layer in this.volumes)) {
      console.warn(`AudioManager: unknown layer "${layer}".`);
      return;
    }
    const v = Math.max(0, Math.min(1, value));
    this.volumes[layer] = v;
    if (this.gains[layer] && this.ctx) {
      this.gains[layer].gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  // ------------------------------------------------------------------ //
  //  Helpers                                                           //
  // ------------------------------------------------------------------ //

  /**
   * Ensure the context is ready; resume it if suspended. Returns false when
   * the manager has not been initialised yet.
   * @returns {boolean}
   */
  _ensureReady() {
    if (!this.initialised || !this.ctx) {
      console.warn("AudioManager: not initialised. Call init() from a user gesture first.");
      return false;
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return true;
  }

  /**
   * Render a white-noise AudioBuffer of the given duration (seconds).
   * @param {number} seconds
   * @returns {AudioBuffer}
   */
  _createNoiseBuffer(seconds) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(seconds * sampleRate);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1; // uniform white noise
    }
    return buffer;
  }
}

/**
 * Shared singleton instance consumed by the transition manager and UI.
 * Constructed lazily so importing the module has no side effects until used.
 */
export const audioManager = new AudioManager();

/** Convenience: the set of years that have music definitions. */
export const SUPPORTED_MUSIC_YEARS = YEARS.filter((y) => y in PERIOD_MUSIC);
