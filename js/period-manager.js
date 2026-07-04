// Period Manager with Era Transition Logic
// Manages era state and transitions between periods

import { isEra } from '../src/contracts/PeriodPackage.js';

class PeriodManager {
  constructor() {
    this.erasPromise = this.loadEras();
    this.eras = null;
    this.currentEra = null;
    this.currentYear = null;
    this.onEraChangeCallbacks = [];

    // Initialize to 1945 (fire and forget - getState() will wait for loading)
    this.setEra(1945).catch(err => {
        console.error('Failed to set initial era:', err);
        // Don't throw here as constructor can't throw async errors easily
        // The error will surface when methods are called
    });
}

  async loadEras() {
    // Load all era modules as ES modules and get their default export
    const [module1945, module1965, module1985, module2005, module2025] = await Promise.all([
      import('../src/eras/1945.js'),
      import('../src/eras/1965.js'),
      import('../src/eras/1985.js'),
      import('../src/eras/2005.js'),
      import('../src/eras/2025.js')
    ]);

    const eras = {
      1945: module1945.default,
      1965: module1965.default,
      1985: module1985.default,
      2005: module2005.default,
      2025: module2025.default
    };

    // Validate all eras
    for (const [year, era] of Object.entries(eras)) {
      if (!isEra(era)) {
        throw new Error(`Invalid era data for year ${year}`);
      }
    }

    return eras;
  }

  async ensureErasLoaded() {
    if (!this.eras) {
      this.eras = await this.erasPromise;
    }
    return this.eras;
  }

  /**
   * Register a callback to be called when era changes
   * @param {Function} callback - Function to call with new era object
   */
  onEraChange(callback) {
    this.onEraChangeCallbacks.push(callback);
  }

  /**
   * Set the current era by year
   * @param {number} year - One of 1945, 1965, 1985, 2005, 2025
   */
  async setEra(year) {
    const eras = await this.ensureErasLoaded();
    const era = eras[year];
    if (!era) {
      throw new Error(`Invalid year: ${year}. Must be one of 1945, 1965, 1985, 2005, 2025`);
    }

    this.currentEra = era;
    this.currentYear = year;

    // Notify all callbacks (for UI updates and transition animations)
    this.onEraChangeCallbacks.forEach(callback => callback(era));
  }

  /**
   * Get the current era state for rendering
   * @returns {Promise<Object>} Current era object
   */
  async getState() {
    await this.ensureErasLoaded();
    return this.currentEra;
  }

  /**
   * Get the current year
   * @returns {Promise<number>} Current year
   */
  async getCurrentYear() {
    await this.ensureErasLoaded();
    return this.currentYear;
  }
}

// Export as ES6 module
export default PeriodManager;