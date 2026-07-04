import { isEra } from '../contracts/PeriodPackage.js';
import era1945 from '../eras/1945.js';
import era1965 from '../eras/1965.js';
import era1985 from '../eras/1985.js';
import era2005 from '../eras/2005.js';
import era2025 from '../eras/2025.js';

/**
 * PeriodManager loads and manages era data structures.
 */
class PeriodManager {
  constructor() {
    this.eras = new Map();
    this.currentEra = null;
    this.loadEras();
  }

  /**
   * Load all era data into the map.
   */
  loadEras() {
    const eras = [era1945, era1965, era1985, era2005, era2025];
    for (const era of eras) {
      if (!isEra(era)) {
        throw new Error(`Invalid era object for year ${era.year}`);
      }
      this.eras.set(era.year, era);
    }
  }

  /**
   * Get an era by year.
   * @param {number} year - The year of the era to retrieve.
   * @returns {Object|null} The era object or null if not found.
   */
  getEra(year) {
    return this.eras.get(year) || null;
  }

  /**
   * Set the current era by year.
   * @param {number} year - The year of the era to set as current.
   * @returns {boolean} True if the era was set, false if not found.
   */
  setCurrentEra(year) {
    const era = this.getEra(year);
    if (era) {
      this.currentEra = era;
      return true;
    }
    return false;
  }

  /**
   * Get the current era.
   * @returns {Object|null} The current era object or null if none set.
   */
  getCurrentEra() {
    return this.currentEra;
  }

  /**
   * Get all available years.
   * @returns {number[]} Array of years for which eras are defined.
   */
  getAvailableYears() {
    return Array.from(this.eras.keys());
  }
}

export default PeriodManager;