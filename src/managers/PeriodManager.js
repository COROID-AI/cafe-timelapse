/**
 * PeriodManager - Loads and manages era-specific period data.
 * Handles era transitions and provides access to period packages.
 */

import { Period1945 } from '../periods/period1945.js';
import { Period1965 } from '../periods/period1965.js';
import { Period1985 } from '../periods/period1985.js';
import { Period2005 } from '../periods/period2005.js';
import { Period2025 } from '../periods/period2025.js';

/** @type {Record<number, import('../contracts/PeriodPackage.js').PeriodPackage>} */
const periodRegistry = {
  1945: Period1945,
  1965: Period1965,
  1985: Period1985,
  2005: Period2005,
  2025: Period2025,
};

export class PeriodManager {
  constructor() {
    this.currentYear = 1945;
    this.currentPeriod = periodRegistry[this.currentYear];
  }

  /**
   * Get the current period package.
   * @returns {import('../contracts/PeriodPackage.js').PeriodPackage}
   */
  getCurrentPeriod() {
    return this.currentPeriod;
  }

  /**
   * Get a period by year.
   * @param {number} year
   * @returns {import('../contracts/PeriodPackage.js').PeriodPackage | undefined}
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
   * Transition to a new era.
   * @param {number} year
   */
  transitionTo(year) {
    if (periodRegistry[year]) {
      this.currentYear = year;
      this.currentPeriod = periodRegistry[year];
    }
  }
}

export const periodManager = new PeriodManager();
