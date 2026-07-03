/**
 * AudioManager — Stub for period-appropriate audio.
 *
 * Will be extended by era packs and the SFX task to play:
 *  - Period-appropriate background music (wireless set, jukebox, boombox, iPod, phone)
 *  - Ambient SFX (conversation murmur, coffee machine hiss/clatter)
 *
 * For now, this provides the interface skeleton with Web Audio API readiness.
 */

/** @type {Map<number, {trackUrl?: string, volume?: number, sfx?: string[]}>} */
const _eraAudio = new Map();

/** @type {HTMLAudioElement|null} */
let _musicEl = null;

/** @type {number} */
let _currentYear = null; // eslint-disable-line no-unused-vars

/**
 * Register audio config for an era.
 * @param {number} year
 * @param {{trackUrl?: string, volume?: number, sfx?: string[]}} config
 */
export function registerAudio(year, config) {
  _eraAudio.set(year, config);
}

/**
 * Switch to the audio for a given year.
 * @param {number} year
 */
export function setYear(year) {
  _currentYear = year;
  const config = _eraAudio.get(year);

  if (!config) {
    // No audio for this era yet — stop current
    stopMusic();
    return;
  }

  if (config.trackUrl) {
    playMusic(config.trackUrl, config.volume ?? 0.4);
  } else {
    stopMusic();
  }

  // SFX will be handled by a future task
  if (config.sfx && config.sfx.length > 0) {
    console.log(`[AudioManager] SFX for ${year}:`, config.sfx);
  }
}

/**
 * Play a music track.
 * @param {string} url
 * @param {number} volume - 0 to 1
 */
export function playMusic(url, volume = 0.4) {
  if (!_musicEl) {
    _musicEl = new Audio();
    _musicEl.loop = true;
  }

  // Only restart if the track changed
  if (_musicEl.src !== url) {
    _musicEl.src = url;
    _musicEl.volume = volume;
    _musicEl.play().catch((err) => {
      // Autoplay may be blocked until user interaction
      console.warn(`[AudioManager] Could not play ${url}:`, err.message);
    });
  }
}

/**
 * Stop music playback.
 */
export function stopMusic() {
  if (_musicEl) {
    _musicEl.pause();
    _musicEl.src = '';
  }
}

/**
 * Set the master volume.
 * @param {number} volume - 0 to 1
 */
export function setVolume(volume) {
  if (_musicEl) {
    _musicEl.volume = Math.max(0, Math.min(1, volume));
  }
}

/**
 * Resume audio context (call after user gesture to satisfy autoplay policies).
 */
export function resume() {
  if (_musicEl && _musicEl.src && _musicEl.paused) {
    _musicEl.play().catch(() => {});
  }
}

export default {
  registerAudio,
  setYear,
  playMusic,
  stopMusic,
  setVolume,
  resume,
};
