/**
 * @file src/managers/AudioManager.js
 * Web Audio API manager with three buses: music, sfx, ambient.
 *
 * - Music: 5 synthesized period-style loops (one per era), crossfaded via gain
 *   ramps. AudioManager prefers user-supplied files in
 *   /assets/audio/{era}.{mp3|ogg} if present and falls back to procedural
 *   synthesis otherwise, so the demo always works with zero licensed assets.
 * - SFX: procedurally synthesized clinks, steam hiss, register chime, percolator
 *   gurgle — generated with OscillatorNode + filtered noise.
 * - Ambient: brown-noise crowd murmur with band-passed EQ.
 *
 * The AudioContext is created lazily and resumed on the first user gesture
 * (autoplay-policy compliance). isReady() resolves on first gesture.
 */

const ERA_TRACKS = {
  1945: { tempo: 120, scale: [0, 3, 5, 7, 10], root: 196.0, waveform: 'sine', filter: 1400, name: 'Big Band Swing' },
  1965: { tempo: 108, scale: [0, 2, 4, 7, 9], root: 261.63, waveform: 'triangle', filter: 2200, name: 'Motown Soul' },
  1985: { tempo: 118, scale: [0, 2, 3, 7, 9], root: 220.0, waveform: 'sawtooth', filter: 1800, name: 'Synth-Pop' },
  2005: { tempo: 84, scale: [0, 2, 4, 5, 7], root: 174.61, waveform: 'sine', filter: 1200, name: 'Downtempo' },
  2025: { tempo: 76, scale: [0, 2, 4, 7, 9], root: 164.81, waveform: 'triangle', filter: 900, name: 'Lo-Fi Chill' }
};

// Resolved music file URLs (if user supplied overrides exist in /assets/audio).
const fileCheckCache = {};

async function resolveMusicFile(eraId) {
  if (eraId in fileCheckCache) return fileCheckCache[eraId];
  let result = null;
  for (const ext of ['mp3', 'ogg', 'wav']) {
    try {
      const res = await fetch(`/assets/audio/${eraId}.${ext}`, { method: 'HEAD' });
      if (res.ok) {
        result = `/assets/audio/${eraId}.${ext}`;
        break;
      }
    } catch {
      /* ignore — fall back to synthesis */
    }
  }
  fileCheckCache[eraId] = result;
  return result;
}

export default class AudioManager {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this._readyResolvers = [];
    this.muted = false;

    this.musicBus = null;
    this.sfxBus = null;
    this.ambientBus = null;

    this.currentEra = null;
    this.musicNodes = null; // active procedural nodes
    this.musicSource = null; // active <audio>/buffer source
    this.musicGain = null; // gain node for current music
    this.musicFileAudio = null;

    this.ambientNodes = null;

    this._onGesture = this._onGesture.bind(this);
  }

  /** Attach first-gesture listeners that resume the AudioContext. */
  attachGestureGate() {
    const opts = { once: true };
    window.addEventListener('pointerdown', this._onGesture, opts);
    window.addEventListener('keydown', this._onGesture, opts);
    window.addEventListener('touchstart', this._onGesture, opts);
  }

  _onGesture() {
    this.unlock();
  }

  /** Create + resume the AudioContext. Safe to call multiple times. */
  async unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        console.warn('[AudioManager] Web Audio API not supported.');
        return;
      }
      this.ctx = new AC();
      this._buildBuses();
    }
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('[AudioManager] resume failed', e);
      }
    }
    if (!this.ready) {
      this.ready = true;
      this._startAmbient();
      for (const resolve of this._readyResolvers) resolve();
      this._readyResolvers = [];
    }
  }

  /** Returns a promise that resolves when audio is unlocked. */
  isReady() {
    return new Promise((resolve) => {
      if (this.ready) resolve();
      else this._readyResolvers.push(resolve);
    });
  }

  _buildBuses() {
    const ctx = this.ctx;
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = this.muted ? 0 : 0.5;
    this.musicBus.connect(ctx.destination);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = this.muted ? 0 : 0.7;
    this.sfxBus.connect(ctx.destination);

    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = this.muted ? 0 : 0.18;
    this.ambientBus.connect(ctx.destination);
  }

  /* ---------------------------------------------------------------- *
   * Ambient crowd murmur (brown noise + bandpass)
   * ---------------------------------------------------------------- */
  _startAmbient() {
    if (this.ambientNodes) return;
    const ctx = this.ctx;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 480;
    bp.Q.value = 0.4;

    // subtle LFO on the bandpass for a "living" murmur
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);

    noise.connect(bp);
    bp.connect(this.ambientBus);
    noise.start();
    lfo.start();
    this.ambientNodes = { noise, bp, lfo };
  }

  /* ---------------------------------------------------------------- *
   * Music: procedural synthesis per era
   * ---------------------------------------------------------------- */

  /**
   * Crossfade to the music for the given era id ("1945".."2025").
   * @param {string} eraId
   * @param {number} [crossfadeMs=600]
   */
  async playMusicFor(eraId, crossfadeMs = 600) {
    if (!this.ready) return;
    if (this.currentEra === eraId && (this.musicNodes || this.musicFileAudio)) return;
    const prevEra = this.currentEra;
    this.currentEra = eraId;

    // Fade out existing music
    this._stopMusic(crossfadeMs);

    // Try user-supplied file first
    const fileUrl = await resolveMusicFile(eraId);
    if (fileUrl) {
      this._playMusicFile(fileUrl, crossfadeMs);
    } else {
      this._playSynthMusic(eraId, crossfadeMs);
    }
    void prevEra;
  }

  _playMusicFile(url, crossfadeMs) {
    const ctx = this.ctx;
    if (!this.musicFileAudio) {
      this.musicFileAudio = new Audio();
      this.musicFileAudio.loop = true;
      this.musicFileAudio.crossOrigin = 'anonymous';
    }
    this.musicFileAudio.src = url;
    const src = ctx.createMediaElementSource(this.musicFileAudio);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(gain);
    gain.connect(this.musicBus);
    this.musicSource = src;
    this.musicGain = gain;
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(1, t0 + crossfadeMs / 1000);
    this.musicFileAudio.play().catch((e) => {
      console.warn('[AudioManager] file playback failed, falling back to synth', e);
      this._stopMusic(0);
      this._playSynthMusic(this.currentEra, crossfadeMs);
    });
  }

  _playSynthMusic(eraId, crossfadeMs) {
    const ctx = this.ctx;
    const track = ERA_TRACKS[eraId];
    if (!track) return;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = track.filter;
    filter.Q.value = 0.7;

    gain.connect(filter);
    filter.connect(this.musicBus);

    const beatDur = 60 / track.tempo;
    const noteDur = beatDur * 0.5;

    // Bass line (root note pulses)
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = track.root / 2;
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0;
    bass.connect(bassGain);
    bassGain.connect(gain);
    bass.start();

    // Melody oscillator (scheduled notes via frequency automation)
    const mel = ctx.createOscillator();
    mel.type = track.waveform;
    mel.frequency.value = track.root;
    const melGain = ctx.createGain();
    melGain.gain.value = 0;
    mel.connect(melGain);
    melGain.connect(gain);
    mel.start();

    // Pad chord (two detuned oscillators)
    const pad1 = ctx.createOscillator();
    pad1.type = track.waveform;
    pad1.frequency.value = track.root;
    const pad2 = ctx.createOscillator();
    pad2.type = track.waveform;
    pad2.frequency.value = track.root * 1.5;
    const padGain = ctx.createGain();
    padGain.gain.value = 0;
    pad1.connect(padGain);
    pad2.connect(padGain);
    padGain.connect(gain);
    pad1.start();
    pad2.start();

    // Soft percussion (filtered noise burst) via scheduled gain
    const noiseBuf = this._makeNoiseBuffer(0.3);

    this.musicNodes = { bass, bassGain, mel, melGain, pad1, pad2, padGain, filter, gain, noiseBuf };

    // Fade in
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.85, t0 + crossfadeMs / 1000);

    // Schedule the looping melody + bass pattern
    this._scheduleMusicLoop(eraId, t0);
  }

  _scheduleMusicLoop(eraId, startTime) {
    if (!this.musicNodes || this.currentEra !== eraId) return;
    const ctx = this.ctx;
    const track = ERA_TRACKS[eraId];
    const { bass, bassGain, mel, melGain, pad1, pad2, padGain } = this.musicNodes;
    const beatDur = 60 / track.tempo;
    const barDur = beatDur * 4;
    const now = startTime;

    // Melody: walk the scale across the bar
    const scale = track.scale;
    for (let i = 0; i < 8; i++) {
      const semi = scale[i % scale.length];
      const freq = track.root * Math.pow(2, semi / 12) * (i >= 4 ? 2 : 1);
      const t = now + i * (beatDur / 2);
      mel.frequency.setValueAtTime(freq, t);
      melGain.gain.setValueAtTime(0.0, t);
      melGain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      melGain.gain.exponentialRampToValueAtTime(0.001, t + beatDur / 2 * 0.9);
    }

    // Bass: root on beats 1 and 3
    for (const b of [0, 2]) {
      const t = now + b * beatDur;
      bassGain.gain.setValueAtTime(0.0, t);
      bassGain.gain.linearRampToValueAtTime(0.3, t + 0.03);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + beatDur * 0.8);
    }

    // Pad: slow swell across the bar
    padGain.gain.setValueAtTime(0.0, now);
    padGain.gain.linearRampToValueAtTime(0.06, now + beatDur);
    padGain.gain.linearRampToValueAtTime(0.04, now + beatDur * 3);
    padGain.gain.linearRampToValueAtTime(0.0, now + barDur);
    // detune pad slightly
    pad1.frequency.setValueAtTime(track.root, now);
    pad2.frequency.setValueAtTime(track.root * 1.5, now);

    // Schedule next bar
    const next = now + barDur;
    const id = setTimeout(() => this._scheduleMusicLoop(eraId, next), Math.max(0, (next - ctx.currentTime) * 1000 - 50));
    if (this._loopTimer) clearTimeout(this._loopTimer);
    this._loopTimer = id;
  }

  _makeNoiseBuffer(seconds) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  _stopMusic(fadeMs = 600) {
    const ctx = this.ctx;
    if (this._loopTimer) {
      clearTimeout(this._loopTimer);
      this._loopTimer = null;
    }
    // Stop procedural nodes
    if (this.musicNodes) {
      const { gain, bass, mel, pad1, pad2, filter } = this.musicNodes;
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeMs / 1000);
      } catch { /* noop */ }
      const nodes = this.musicNodes;
      setTimeout(() => {
        try { bass.stop(); } catch { /* noop */ }
        try { mel.stop(); } catch { /* noop */ }
        try { pad1.stop(); } catch { /* noop */ }
        try { pad2.stop(); } catch { /* noop */ }
        try { filter.disconnect(); } catch { /* noop */ }
        try { gain.disconnect(); } catch { /* noop */ }
      }, fadeMs + 50);
      this.musicNodes = null;
      void nodes;
    }
    // Stop file audio
    if (this.musicFileAudio) {
      try {
        const g = this.musicGain;
        if (g) {
          g.gain.cancelScheduledValues(ctx.currentTime);
          g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeMs / 1000);
        }
        const audio = this.musicFileAudio;
        setTimeout(() => {
          audio.pause();
        }, fadeMs + 50);
      } catch { /* noop */ }
      this.musicSource = null;
      this.musicGain = null;
    }
  }

  /* ---------------------------------------------------------------- *
   * SFX
   * ---------------------------------------------------------------- */

  /**
   * Play a named SFX.
   * @param {'percolator'|'steam'|'clink'|'chime'|'whoosh'} name
   * @param {number} [delayMs=0]
   */
  playSfx(name, delayMs = 0) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + delayMs / 1000;
    switch (name) {
      case 'percolator': this._sfxPercolator(t); break;
      case 'steam': this._sfxSteam(t); break;
      case 'clink': this._sfxClink(t); break;
      case 'chime': this._sfxChime(t); break;
      case 'whoosh': this._sfxWhoosh(t); break;
      default: break;
    }
  }

  /** Play the era-appropriate coffee-machine SFX. */
  playEraSfx(sfxType, delayMs = 0) {
    this.playSfx(sfxType === 'percolator' ? 'percolator' : 'steam', delayMs);
  }

  _sfxPercolator(t) {
    const ctx = this.ctx;
    // gurgle: low filtered noise bursts
    const buf = this._makeNoiseBuffer(0.6);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 320;
    bp.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    // rhythmic bursts
    for (let i = 0; i < 5; i++) {
      const bt = t + i * 0.12;
      g.gain.linearRampToValueAtTime(0.5, bt + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, bt + 0.09);
    }
    src.connect(bp);
    bp.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.7);
  }

  _sfxSteam(t) {
    const ctx = this.ctx;
    const buf = this._makeNoiseBuffer(0.9);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.4, t + 0.05);
    g.gain.setValueAtTime(0.4, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.95);
  }

  _sfxClink(t) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  _sfxChime(t) {
    const ctx = this.ctx;
    const freqs = [880, 1320];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = ctx.createGain();
      const tt = t + i * 0.08;
      g.gain.setValueAtTime(0.0, tt);
      g.gain.linearRampToValueAtTime(0.25, tt + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, tt + 0.5);
      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(tt);
      osc.stop(tt + 0.55);
    });
  }

  _sfxWhoosh(t) {
    const ctx = this.ctx;
    const buf = this._makeNoiseBuffer(0.4);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2000, t + 0.3);
    bp.Q.value = 1.0;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.4);
  }

  /* ---------------------------------------------------------------- *
   * Mute
   * ---------------------------------------------------------------- */
  setMuted(muted) {
    this.muted = muted;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const target = muted ? 0 : null;
    for (const bus of [this.musicBus, this.sfxBus, this.ambientBus]) {
      if (!bus) continue;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(target ?? (bus === this.musicBus ? 0.5 : bus === this.sfxBus ? 0.7 : 0.18), t + 0.2);
    }
  }

  isMuted() {
    return this.muted;
  }

  dispose() {
    this._stopMusic(0);
    if (this.ambientNodes) {
      try { this.ambientNodes.noise.stop(); } catch { /* noop */ }
      try { this.ambientNodes.lfo.stop(); } catch { /* noop */ }
    }
    if (this.ctx) {
      try { this.ctx.close(); } catch { /* noop */ }
    }
  }
}
