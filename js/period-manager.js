/**
 * PeriodManager - Era state manager for café timelapse scene
 * Handles era transitions and provides access to period packages.
 */

import { Period1945 } from '../src/periods/period1945.js';
import { Period1965 } from '../src/periods/period1965.js';
import { Period1985 } from '../src/periods/period1985.js';
import { Period2005 } from '../src/periods/period2005.js';
import { Period2025 } from '../src/periods/period2025.js';

/** @typedef {Object} EraState
 * @property {number} year
 * @property {string} name
 * @property {string} theme
 * @property {import('./contracts/PeriodPackage.js').PeriodPackage} data
 */

/** @type {Record<number, import('./contracts/PeriodPackage.js').PeriodPackage>} */
const periodRegistry = {
  1945: Period1945,
  1965: Period1965,
  1985: Period1985,
  2005: Period2005,
  2025: Period2025,
};

export class PeriodManager {
  constructor() {
    /** @type {number} */
    this.currentYear = 1945;
    /** @type {EraState} */
    this.currentEra = {
      year: 1945,
      name: '',
      theme: '',
      data: Period1945
    };
    /** @type {Array<function(EraState): void>} */
    this._listeners = [];
    /** @type {number} */
    this.sliderPosition = 0;
    /** @type {boolean} */
    this.transitioning = false;
  }

  /**
   * Get the current era state with full data object.
   * @returns {EraState}
   */
  getState() {
    return this.currentEra;
  }

  /**
   * Get the current period package.
   * @returns {import('./contracts/PeriodPackage.js').PeriodPackage}
   */
  getCurrentPeriod() {
    return this.currentEra.data;
  }

  /**
   * Get a period by year.
   * @param {number} year
   * @returns {import('./contracts/PeriodPackage.js').PeriodPackage | undefined}
   */
  getPeriod(year) {
    return periodRegistry[year];
  }

  /**
   * Get all available years.
   * @returns {number[]}
   */
  getAvailableYears() {
    return Object.keys(periodRegistry).map(Number);
  }

  /**
   * Update the UI slider position based on year selection.
   * @param {number} year
   */
  updateSliderPosition(year) {
    const years = this.getAvailableYears();
    const index = years.indexOf(year);
    this.sliderPosition = index >= 0 ? (index / (years.length - 1)) * 100 : 0;
  }

  /**
   * Subscribe to era change events.
   * @param {function(EraState): void} callback
   */
  onEraChange(callback) {
    this._listeners.push(callback);
  }

  /**
   * Emit era change event to all subscribers.
   * @private
   * @param {EraState} era
   */
  _emitEraChange(era) {
    this._listeners.forEach(callback => {
      try {
        callback(era);
      } catch (e) {
        console.error('PeriodManager listener error:', e);
      }
    });
  }

  /**
   * Trigger transition animation.
   * @private
   */
  _triggerTransitionAnimation() {
    this.transitioning = true;
    // Animation will be handled by CSS/transitions
    // Reset transitioning flag after animation duration
    setTimeout(() => {
      this.transitioning = false;
    }, 500);
  }

  /**
   * Transition to a new era by year.
   * @param {number} year
   */
  selectEra(year) {
    const period = periodRegistry[year];
    if (!period) {
      console.warn(`Period not found for year: ${year}`);
      return;
    }

    if (this.currentYear === year) {
      return;
    }

    // Trigger transition animation
    this._triggerTransitionAnimation();

    // Update state
    this.currentYear = year;
    const periodData = periodRegistry[year];
    this.currentEra = {
      year: periodData.year,
      name: periodData.name,
      theme: periodData.theme,
      data: periodData
    };

    // Update slider position
    this.updateSliderPosition(year);

    // Emit event
    this._emitEraChange(this.currentEra);
  }

  /**
   * Transition to a new era (alias for selectEra for compatibility).
   * @param {number} year
   */
  transitionTo(year) {
    this.selectEra(year);
  }
}

export const periodManager = new PeriodManager();
