/**
 * AudioManager — Full Web Audio bus for the Café Timelapse scene.
 *
 * Features:
 *   - Multi-bus architecture (music, sfx, ambient) with independent gain
 *   - playMusicForYear(year) — loads and loops the era-appropriate track
 *   - crossfade(fromYear, toYear, duration) — click-free linear-gain crossfade
 *   - playSfx(name) — one-shot SFX playback
 *   - duckVoice(active) — sidechain ducking of music when voice/SFX fires
 *   - mute() / toggleMute() — master mute toggle
 *   - M key keyboard shortcut for mute
 *   - setMasterVolume(0..1)
 *   - Wiring to PeriodManager.setYear via onYearChange callback
 *
 * Uses the native Web Audio API — no external dependencies.
 * All assets are loaded lazily and cached as AudioBuffers.
 */

const ERA_YEARS = [1945, 1965, 1985, 2005, 2025];

const MUSIC_PATHS = {
  1945: 'assets/audio/1945/music-1945.wav',
  1965: 'assets/audio/1965/music-1965.wav',
  1985: 'assets/audio/1985/music-1985.wav',
  2005: 'assets/audio/2005/music-2005.wav',
  2025: 'assets/audio/2025/music-2025.wav',
};

const SFX_PATHS = {
  'murmur': 'assets/audio/sfx/murmur.wav',
  'espresso-hiss': 'assets/audio/sfx/espresso-hiss.wav',
  'cup-clatter': 'assets/audio/sfx/cup-clatter.wav',
  'register-ding': 'assets/audio/sfx/register-ding.wav',
  'jukebox-clack': 'assets/audio/sfx/jukebox-clack.wav',
};

/** Default crossfade duration in seconds. */
const DEFAULT_CROSSFADE = 2.0;

/** How much music is attenuated (linear) when ducking is active. */
const DUCK_AMOUNT = 0.35;

/** Time to ramp ducking in/out, avoiding clicks. */
const DUCK_RAMP = 0.15;

class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    /** @type {GainNode|null} */
    this.masterGain = null;
    /** @type {GainNode|null} */
    this.musicGain = null;
    /** @type {GainNode|null} */
    this.sfxGain = null;
    /** @type {GainNode|null} */
    this.ambientGain = null;

    /** Cached decoded AudioBuffers, keyed by path. */
    this._bufferCache = new Map();

    /** Active music source nodes, keyed by year. */
    this._musicSources = new Map();

    /** The year whose music is currently playing (or null). */
    this._currentYear = null;

    /** Whether the master bus is muted. */
    this._muted = false;

    /** User-facing master volume (0..1), preserved across mute toggles. */
    this._masterVolume = 0.8;

    /** Whether ducking is currently active. */
    this._ducking = false;

    /** Whether the audio system has been initialised. */
    this._initialised = false;

    /** Ambient loops currently playing (murmur, espresso-hiss, cup-clatter). */
    this._ambientSources = new Map();

    /** Bound key handler reference for cleanup. */
    this._keyHandler = null;
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Initialise the AudioContext and bus graph.
   * Must be called from a user gesture (click, keypress) in most browsers.
   */
  async init() {
    if (this._initialised) return;

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      console.warn('[AudioManager] Web Audio API not supported.');
      return;
    }

    this.ctx = new Ctx();

    // --- Bus graph ---
    // masterGain -> destination
    //   ├── musicGain   (ducked by sidechain)
    //   ├── sfxGain
    //   └── ambientGain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._masterVolume;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 1.0;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 1.0;
    this.sfxGain.connect(this.masterGain);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.6;
    this.ambientGain.connect(this.masterGain);

    // Resume context if it started suspended (Chrome autoplay policy)
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Wire M key for mute toggle
    this._keyHandler = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        this.toggleMute();
      }
    };
    window.addEventListener('keydown', this._keyHandler);

    this._initialised = true;
    console.log('[AudioManager] Initialised. Sample rate:', this.ctx.sampleRate);
  }

  /**
   * Tear down all audio nodes and release resources.
   */
  destroy() {
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    this.stopAllMusic();
    this.stopAllAmbient();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this._initialised = false;
  }

  // -----------------------------------------------------------------------
  // Buffer loading
  // -----------------------------------------------------------------------

  /**
   * Load and decode an audio file, caching the result.
   * @param {string} path — Relative URL to the audio file.
   * @returns {Promise<AudioBuffer>}
   */
  async _loadBuffer(path) {
    if (this._bufferCache.has(path)) {
      return this._bufferCache.get(path);
    }
    if (!this.ctx) {
      throw new Error('[AudioManager] AudioContext not initialised. Call init() first.');
    }
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`[AudioManager] Failed to fetch ${path}: ${res.status} ${res.statusText}`);
    }
    const arrayBuf = await res.arrayBuffer();
    const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
    this._bufferCache.set(path, audioBuf);
    return audioBuf;
  }

  /**
   * Preload all music and SFX assets.
   * Call after init() to avoid latency on first play.
   */
  async preloadAll() {
    if (!this._initialised) await this.init();
    const all = [...Object.values(MUSIC_PATHS), ...Object.values(SFX_PATHS)];
    await Promise.all(
      all.map(async (p) => {
        try {
          await this._loadBuffer(p);
        } catch (err) {
          console.warn(`[AudioManager] Preload failed for ${p}:`, err.message);
        }
      })
    );
    console.log('[AudioManager] All assets preloaded.');
  }

  // -----------------------------------------------------------------------
  // Music playback
  // -----------------------------------------------------------------------

  /**
   * Play (or switch to) the music track for the given year.
   * If a different track is already playing, performs a smooth crossfade.
   * @param {number} year — One of 1945, 1965, 1985, 2005, 2025.
   * @param {number} [fadeDuration] — Crossfade duration in seconds.
   */
  async playMusicForYear(year, fadeDuration = DEFAULT_CROSSFADE) {
    if (!this._initialised) await this.init();
    if (!ERA_YEARS.includes(year)) {
      console.warn(`[AudioManager] Unknown year ${year}. Expected one of ${ERA_YEARS}.`);
      return;
    }

    const path = MUSIC_PATHS[year];

    // If the same year is already playing, do nothing.
    if (this._currentYear === year && this._musicSources.has(year)) {
      return;
    }

    // Load the new buffer.
    let buffer;
    try {
      buffer = await this._loadBuffer(path);
    } catch (err) {
      console.error(`[AudioManager] Cannot play music for ${year}:`, err.message);
      return;
    }

    // Create the new music source.
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.musicGain);

    // Per-source gain for crossfade control.
    const sourceGain = this.ctx.createGain();
    sourceGain.gain.value = 0;
    source.disconnect();
    source.connect(sourceGain);
    sourceGain.connect(this.musicGain);

    // If there is existing music, crossfade out.
    const now = this.ctx.currentTime;
    if (this._currentYear !== null) {
      const oldSource = this._musicSources.get(this._currentYear);
      if (oldSource) {
        const { source: oldSrc, gain: oldGain } = oldSource;
        // Ramp old track out.
        oldGain.gain.cancelScheduledValues(now);
        oldGain.gain.setValueAtTime(oldGain.gain.value, now);
        oldGain.gain.linearRampToValueAtTime(0, now + fadeDuration);
        // Stop and clean up after the fade.
        oldSrc.stop(now + fadeDuration + 0.05);
        this._musicSources.delete(this._currentYear);
      }
    }

    // Ramp new track in.
    sourceGain.gain.setValueAtTime(0, now);
    sourceGain.gain.linearRampToValueAtTime(1, now + fadeDuration);
    source.start(now);

    this._musicSources.set(year, { source, gain: sourceGain });
    this._currentYear = year;

    // Re-apply ducking state if active.
    if (this._ducking) {
      this._applyDuck(now + fadeDuration);
    }

    console.log(`[AudioManager] ▶ Music: ${year} (crossfade ${fadeDuration}s)`);
  }

  /**
   * Crossfade explicitly between two era tracks.
   * Convenience wrapper around playMusicForYear.
   * @param {number} fromYear
   * @param {number} toYear
   * @param {number} [duration]
   */
  async crossfade(fromYear, toYear, duration = DEFAULT_CROSSFADE) {
    if (this._currentYear !== fromYear) {
      // If the "from" track isn't playing, just start the "to" track.
      await this.playMusicForYear(toYear, duration);
      return;
    }
    await this.playMusicForYear(toYear, duration);
  }

  /**
   * Stop all music sources immediately (with a tiny fade to avoid clicks).
   */
  stopAllMusic() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const [, entry] of this._musicSources) {
      const { source, gain } = entry;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      try {
        source.stop(now + 0.15);
      } catch (_e) {
        // Already stopped.
      }
    }
    this._musicSources.clear();
    this._currentYear = null;
  }

  // -----------------------------------------------------------------------
  // SFX playback
  // -----------------------------------------------------------------------

  /**
   * Play a one-shot sound effect.
   * @param {string} name — One of: murmur, espresso-hiss, cup-clatter, register-ding, jukebox-clack.
   * @param {Object} [opts]
   * @param {number} [opts.volume=1.0] — Playback volume (0..1).
   * @param {boolean} [opts.duck=true] — Whether to duck music while this SFX plays.
   */
  async playSfx(name, opts = {}) {
    const { volume = 1.0, duck = true } = opts;

    if (!this._initialised) await this.init();

    const path = SFX_PATHS[name];
    if (!path) {
      console.warn(`[AudioManager] Unknown SFX "${name}". Available: ${Object.keys(SFX_PATHS).join(', ')}`);
      return;
    }

    let buffer;
    try {
      buffer = await this._loadBuffer(path);
    } catch (err) {
      console.error(`[AudioManager] Cannot play SFX ${name}:`, err.message);
      return;
    }

    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = false;

    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.sfxGain);

    source.start(now);

    // Duck music while SFX plays, then restore.
    if (duck) {
      this.duckVoice(true);
      // Schedule duck release.
      const restoreDuck = () => {
        // Only release if no other ducking request is pending.
        this.duckVoice(false);
      };
      // Use setTimeout for simplicity (Web Audio scheduling of duck release
      // could also be done with setValueAtTime, but the duck gain is shared).
      setTimeout(restoreDuck, (buffer.duration + 0.2) * 1000);
    }

    // Clean up the source node when it ends.
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
  }

  // -----------------------------------------------------------------------
  // Ambient loops
  // -----------------------------------------------------------------------

  /**
   * Start a looping ambient sound (e.g., murmur, espresso-hiss).
   * @param {string} name
   * @param {number} [volume=0.5]
   */
  async startAmbient(name, volume = 0.5) {
    if (!this._initialised) await this.init();
    const path = SFX_PATHS[name];
    if (!path) {
      console.warn(`[AudioManager] Unknown ambient "${name}".`);
      return;
    }
    // If already playing, just update volume.
    if (this._ambientSources.has(name)) {
      const entry = this._ambientSources.get(name);
      entry.gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.5);
      return;
    }

    const buffer = await this._loadBuffer(path);
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1.0);

    source.connect(gain);
    gain.connect(this.ambientGain);
    source.start();

    this._ambientSources.set(name, { source, gain });
  }

  /**
   * Stop a looping ambient sound.
   * @param {string} name
   */
  stopAmbient(name) {
    const entry = this._ambientSources.get(name);
    if (!entry || !this.ctx) return;
    const { source, gain } = entry;
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    try {
      source.stop(now + 0.6);
    } catch (_e) {
      // Already stopped.
    }
    this._ambientSources.delete(name);
  }

  /** Stop all ambient loops. */
  stopAllAmbient() {
    for (const name of this._ambientSources.keys()) {
      this.stopAmbient(name);
    }
  }

  // -----------------------------------------------------------------------
  // Ducking
  // -----------------------------------------------------------------------

  /**
   * Engage or release music ducking (sidechain-style gain reduction).
   * Uses a short linear ramp to avoid clicks.
   * @param {boolean} active
   */
  duckVoice(active) {
    this._ducking = active;
    if (!this.ctx || !this.musicGain) return;
    this._applyDuck(this.ctx.currentTime);
  }

  /**
   * Internal: schedule the ducking gain ramp.
   * @param {number} startTime
   */
  _applyDuck(startTime) {
    if (!this.musicGain) return;
    const target = this._ducking ? DUCK_AMOUNT : 1.0;
    this.musicGain.gain.cancelScheduledValues(startTime);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, startTime);
    this.musicGain.gain.linearRampToValueAtTime(target, startTime + DUCK_RAMP);
  }

  // -----------------------------------------------------------------------
  // Mute & volume
  // -----------------------------------------------------------------------

  /**
   * Toggle master mute. Returns the new muted state.
   * @returns {boolean}
   */
  toggleMute() {
    this._muted = !this._muted;
    this._applyMute();
    console.log(`[AudioManager] Mute: ${this._muted ? 'ON 🔇' : 'OFF 🔊'}`);
    return this._muted;
  }

  /**
   * Explicitly set the mute state.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this._muted = muted;
    this._applyMute();
  }

  /**
   * @returns {boolean} Whether audio is currently muted.
   */
  isMuted() {
    return this._muted;
  }

  /**
   * Internal: apply the mute state to the master gain node.
   */
  _applyMute() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const target = this._muted ? 0 : this._masterVolume;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(target, now + 0.1);
  }

  /**
   * Set the master output volume.
   * @param {number} vol — 0..1
   */
  setMasterVolume(vol) {
    this._masterVolume = Math.max(0, Math.min(1, vol));
    if (!this._muted && this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this._masterVolume, now + 0.1);
    }
  }

  /**
   * @returns {number} Current master volume (0..1).
   */
  getMasterVolume() {
    return this._masterVolume;
  }

  // -----------------------------------------------------------------------
  // PeriodManager integration
  // -----------------------------------------------------------------------

  /**
   * Callback invoked by PeriodManager.setYear.
   * Crossfades to the new era's music and adjusts ambient layers.
   * @param {number} newYear
   * @param {number} oldYear
   */
  onYearChange(newYear, oldYear) {
    if (newYear === oldYear) return;
    this.crossfade(oldYear, newYear, DEFAULT_CROSSFADE);
  }

  /**
   * @returns {number|null} The year whose music is currently playing.
   */
  getCurrentYear() {
    return this._currentYear;
  }
}

// Export a singleton instance.
const audioManager = new AudioManager();
export default audioManager;
export { AudioManager, ERA_YEARS, MUSIC_PATHS, SFX_PATHS };
