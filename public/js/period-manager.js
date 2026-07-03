/**
 * PeriodManager — Manages the café timelapse year/era state.
 *
 * Holds the current year, validates transitions, and notifies registered
 * listeners (including AudioManager) when the year changes.
 */

import audioManager from './audio-manager.js';

const VALID_YEARS = [1945, 1965, 1985, 2005, 2025];

class PeriodManager {
  constructor() {
    /** @type {number} */
    this._year = 1945;

    /** @type {Array<(newYear: number, oldYear: number) => void>} */
    this._listeners = [];

    // Register AudioManager as a built-in listener.
    this.addListener((newYear, oldYear) => {
      audioManager.onYearChange(newYear, oldYear);
    });
  }

  /**
   * Get the current year.
   * @returns {number}
   */
  getYear() {
    return this._year;
  }

  /**
   * Set the year, triggering all listeners if the year actually changes.
   * @param {number} year — One of 1945, 1965, 1985, 2005, 2025.
   */
  setYear(year) {
    if (!VALID_YEARS.includes(year)) {
      console.warn(`[PeriodManager] Invalid year ${year}. Valid: ${VALID_YEARS.join(', ')}`);
      return;
    }
    const oldYear = this._year;
    if (year === oldYear) return;

    this._year = year;
    console.log(`[PeriodManager] Year: ${oldYear} → ${year}`);

    for (const listener of this._listeners) {
      try {
        listener(year, oldYear);
      } catch (err) {
        console.error('[PeriodManager] Listener error:', err);
      }
    }
  }

  /**
   * Register a callback for year changes.
   * @param {(newYear: number, oldYear: number) => void} callback
   */
  addListener(callback) {
    if (typeof callback === 'function') {
      this._listeners.push(callback);
    }
  }

  /**
   * Remove a previously registered callback.
   * @param {(newYear: number, oldYear: number) => void} callback
   */
  removeListener(callback) {
    const idx = this._listeners.indexOf(callback);
    if (idx !== -1) {
      this._listeners.splice(idx, 1);
    }
  }

  /**
   * @returns {number[]} The list of valid era years.
   */
  getValidYears() {
    return [...VALID_YEARS];
  }
}

const periodManager = new PeriodManager();
export default periodManager;
export { PeriodManager, VALID_YEARS };
