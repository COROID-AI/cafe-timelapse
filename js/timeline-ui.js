/**
 * TimelineUI — Wires the timeline slider buttons to PeriodManager.
 *
 * The HTML contains 5 buttons with data-year attributes:
 *   1945, 1965, 1985, 2005, 2025
 *
 * This module:
 *  - Queries those buttons
 *  - Handles click and keyboard activation
 *  - Calls PeriodManager.setYear(year) on selection
 *  - Updates the active visual state
 *  - Listens to PeriodManager 'yearchange' to keep UI in sync
 *  - Updates the HUD with the era name and year
 */

import * as PeriodManager from './period-manager.js';
import { SUPPORTED_YEARS } from '../src/contracts/PeriodPackage.js';

/** @type {NodeListOf<HTMLButtonElement>} */
let _stops = null;

/** @type {HTMLElement|null} */
let _hudYear = null;
/** @type {HTMLElement|null} */
let _hudEraName = null;

/**
 * Human-readable era names keyed by year.
 * These are fallback names; era packs may override via their `name` field.
 */
const ERA_NAMES = {
  1945: 'Post-War Coffee Bar',
  1965: 'Mod Coffeehouse',
  1985: 'Neon Synthwave Café',
  2005: 'Third-Wave Indie Café',
  2025: 'Modern Specialty Café',
};

/**
 * Initialize the timeline UI.
 * Must be called after DOM is ready.
 */
export function init() {
  _stops = document.querySelectorAll('.timeline-stop');
  _hudYear = document.getElementById('hud-year');
  _hudEraName = document.getElementById('hud-era-name');

  if (_stops.length !== SUPPORTED_YEARS.length) {
    console.warn(
      `[TimelineUI] Expected ${SUPPORTED_YEARS.length} timeline stops, found ${_stops.length}.`,
    );
  }

  // Validate that the buttons match the supported years exactly
  const buttonYears = [..._stops].map((b) => parseInt(b.dataset.year, 10));
  const expectedSorted = [...SUPPORTED_YEARS].sort((a, b) => a - b);
  const buttonSorted = [...buttonYears].sort((a, b) => a - b);

  const mismatch = expectedSorted.some((y, i) => y !== buttonSorted[i]);
  if (mismatch) {
    console.error(
      `[TimelineUI] Timeline stops do not match supported years. ` +
      `Expected: ${expectedSorted.join(', ')}, got: ${buttonSorted.join(', ')}`,
    );
  }

  // Wire up click handlers
  _stops.forEach((btn) => {
    const year = parseInt(btn.dataset.year, 10);

    btn.addEventListener('click', () => {
      PeriodManager.setYear(year);
    });

    // Keyboard support: Enter/Space activate, arrow keys move between stops
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        PeriodManager.setYear(year);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const idx = buttonYears.indexOf(year);
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const nextIdx = Math.max(0, Math.min(buttonYears.length - 1, idx + dir));
        const nextBtn = _stops[nextIdx];
        if (nextBtn) {
          nextBtn.focus();
          const nextYear = parseInt(nextBtn.dataset.year, 10);
          PeriodManager.setYear(nextYear);
        }
      }
    });
  });

  // Listen to PeriodManager year changes to update UI
  PeriodManager.on('yearchange', (data) => {
    updateActiveState(data.year);
    updateHUD(data.year, data.package);
  });

  // Set the default active year visually (default to 2025)
  const defaultYear = PeriodManager.getYear() || 2025;
  updateActiveState(defaultYear);
}

/**
 * Update which button appears active.
 * @param {number} year
 */
export function updateActiveState(year) {
  _stops.forEach((btn) => {
    const btnYear = parseInt(btn.dataset.year, 10);
    const isActive = btnYear === year;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', String(isActive));
  });
}

/**
 * Update the HUD display.
 * @param {number} year
 * @param {import('../src/contracts/PeriodPackage.js').PeriodPackage|null} pkg
 */
export function updateHUD(year, pkg) {
  if (_hudYear) {
    _hudYear.textContent = String(year);
  }
  if (_hudEraName) {
    _hudEraName.textContent = pkg?.name || ERA_NAMES[year] || '';
  }
}

/**
 * Programmatically select a year (for testing or programmatic control).
 * @param {number} year
 */
export function selectYear(year) {
  PeriodManager.setYear(year);
}

export default { init, updateActiveState, updateHUD, selectYear };
