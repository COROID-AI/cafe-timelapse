/**
 * AudioManager — period-appropriate ambient music & SFX crossfade controller.
 *
 * Uses the Web Audio API to synthesize lightweight period-appropriate
 * ambience (no external asset downloads required), so the café always has
 * audio even offline. Each period gets a distinct tonal palette:
 *
 *   1945 — warm radio-jazz drone (low triangle + slow tremolo)
 *   1965 — brighter mid drone (sawtooth chord)
 *   1985 — synth-pop pad (square wave chord)
 *   2005 — clean digital pad (sine chord)
 *   2025 — airy modern pad (sine + subtle filter sweep)
 *
 * `playMusicForPeriod(year)` starts a crossfade to the target period's
 * bed. The crossfade duration is synchronized with the visual transition.
 */

import { AUDIO_CONFIG } from "./config.js";

/** Per-period oscillator/voice definitions. */
const PERIOD_VOICES = {
  1945: { type: "triangle", freqs: [110, 164.81, 220], gain: 0.18, lfo: 4.5 },
  1965: { type: "sawtooth", freqs: [130.81, 196, 261.63], gain: 0.14, lfo: 5.5 },
  1985: { type: "square", freqs: [146.83, 220, 293.66], gain: 0.10, lfo: 6.0 },
  2005: { type: "sine", freqs: [164.81, 246.94, 329.63], gain: 0.16, lfo: 3.5 },
  2025: { type: "sine", freqs: [174.61, 261.63, 349.23], gain: 0.15, lfo: 2.8 },
};

export class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    /** @type {GainNode|null} master output gain */
    this.master = null;
    /** @type {number|null} currently playing period year */
    this.currentPeriod = null;
    /** Active voice nodes for the current period (for teardown/crossfade). */
    this._activeVoices = [];
    /** Whether audio has been unlocked (browsers require a user gesture). */
    this._unlocked = false;
    /** Target master volume. */
    this.targetVolume = AUDIO_CONFIG.defaultVolume;
  }

  /**
 * Lazily create the AudioContext. Must be triggered by a user gesture
 * (e.g. the first slider interaction) to satisfy autoplay policies.
 */
  _ensureContext() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      console.warn("Web Audio API unavailable; audio disabled.");
      return;
    }
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  /**
 * Unlock/resume the audio context. Call from a user-gesture handler.
 */
  unlock() {
    this._ensureContext();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this._unlocked = true;
  }

  /**
 * Start (or crossfade to) the ambient bed for a given period year.
 * @param {number} year
 * @param {number} [duration] — crossfade duration in ms.
 * @returns {Promise<void>} resolves when the crossfade completes.
 */
  playMusicForPeriod(year, duration = AUDIO_CONFIG.crossfadeDuration) {
    this._ensureContext();
    if (!this.ctx || !this.master) return Promise.resolve();

    // Resume if suspended (best-effort within a user gesture chain).
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    const voice = PERIOD_VOICES[year];
    if (!voice) {
      console.warn(`No audio voice defined for period ${year}.`);
      return Promise.resolve();
    }

    // Fade out + tear down existing voices, then build the new bed.
    return this._crossfadeTo(voice, duration).then(() => {
      this.currentPeriod = year;
    });
  }

  /**
 * Crossfade from the current voice set to a new one.
 * @returns {Promise<void>}
 */
  _crossfadeTo(voice, duration) {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const durSec = Math.max(duration / 1000, 0.1);

    // 1. Fade out & schedule removal of old voices.
    const oldVoices = this._activeVoices;
    this._activeVoices = [];

    oldVoices.forEach((v) => {
      try {
        v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.setValueAtTime(v.gain.gain.value, now);
        v.gain.gain.linearRampToValueAtTime(0.0001, now + durSec);
      } catch (_) { /* noop */ }
      // Stop oscillators after the fade completes.
      v.nodes.forEach((node) => {
        if (node.stop) {
          try { node.stop(now + durSec + 0.05); } catch (_) { /* noop */ }
        }
      });
    });

    // 2. Build the new voice bed.
    const bedGain = ctx.createGain();
    bedGain.gain.setValueAtTime(0.0001, now);
    bedGain.gain.linearRampToValueAtTime(voice.gain, now + durSec);
    bedGain.connect(this.master);

    const nodes = [bedGain];
    voice.freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = voice.type;
      osc.frequency.value = freq;
      osc.connect(bedGain);
      osc.start(now);
      nodes.push(osc);
    });

    // Subtle tremolo via a low-frequency gain modulation.
    if (voice.lfo) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = voice.lfo;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = voice.gain * 0.25;
      lfo.connect(lfoGain);
      lfoGain.connect(bedGain.gain);
      lfo.start(now);
      nodes.push(lfo, lfoGain);
    }

    this._activeVoices.push({ gain: bedGain, nodes });

    // 3. Ramp the master to target volume (fades the whole bed in).
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(this.targetVolume, now + durSec);

    // Resolve once the crossfade duration elapses.
    return new Promise((resolve) =>
      setTimeout(resolve, duration)
    );
  }

  /**
 * Stop all audio and release Web Audio resources.
 */
  dispose() {
    this._activeVoices.forEach((v) => {
      v.nodes.forEach((node) => {
        try { if (node.stop) node.stop(); } catch (_) { /* noop */ }
        try { if (node.disconnect) node.disconnect(); } catch (_) { /* noop */ }
      });
    });
    this._activeVoices = [];
    if (this.master) {
      try { this.master.disconnect(); } catch (_) { /* noop */ }
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.currentPeriod = null;
    this._unlocked = false;
  }
}
