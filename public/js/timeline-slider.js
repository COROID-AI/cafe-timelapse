import { PERIOD_YEARS } from '@/contracts/PeriodPackage.js';

const STYLE_ID = 'cafe-timeline-slider-styles';

/**
 * Injects the timeline-slider stylesheet exactly once into <head>.
 * @returns {void}
 */
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .cafe-timeline {
      position: fixed;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      width: min(720px, 92vw);
      padding: 12px 20px 14px;
      border-radius: 14px;
      background: rgba(20, 16, 12, 0.62);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
      color: #f3ece0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      user-select: none;
    }
    .cafe-timeline__title {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }
    .cafe-timeline__heading {
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      opacity: 0.7;
    }
    .cafe-timeline__value {
      font-size: 20px;
      font-weight: 700;
      color: #ffd9a0;
      font-variant-numeric: tabular-nums;
    }
    .cafe-timeline__track {
      position: relative;
      width: 100%;
    }
    /* Native range input reset + custom thumb */
    .cafe-timeline__range {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      margin: 0;
      border-radius: 999px;
      background: linear-gradient(90deg, #6b4a2b, #c98a4b);
      outline: none;
      cursor: pointer;
    }
    .cafe-timeline__range::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff3e0;
      border: 3px solid #c98a4b;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
      transition: transform 0.12s ease;
    }
    .cafe-timeline__range::-webkit-slider-thumb:hover { transform: scale(1.12); }
    .cafe-timeline__range::-moz-range-thumb {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff3e0;
      border: 3px solid #c98a4b;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
      cursor: pointer;
    }
    .cafe-timeline__range:focus-visible {
      box-shadow: 0 0 0 3px rgba(255, 217, 160, 0.45);
    }
    .cafe-timeline__ticks {
      position: relative;
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      padding: 0 2px;
    }
    .cafe-timeline__tick {
      position: relative;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: rgba(243, 236, 224, 0.55);
      font-size: 13px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      transition: color 0.15s ease, transform 0.15s ease;
    }
    .cafe-timeline__tick::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(243, 236, 224, 0.4);
      transition: background 0.15s ease, transform 0.15s ease;
    }
    .cafe-timeline__tick:hover { color: #fff3e0; }
    .cafe-timeline__tick.is-active { color: #ffd9a0; }
    .cafe-timeline__tick.is-active::before {
      background: #ffd9a0;
      transform: scale(1.35);
    }
    /* Evenly distribute the 5 stops across the full track width. */
    .cafe-timeline__tick:nth-child(1) { left: 0%; }
    .cafe-timeline__tick:nth-child(2) { left: 25%; }
    .cafe-timeline__tick:nth-child(3) { left: 50%; }
    .cafe-timeline__tick:nth-child(4) { left: 75%; }
    .cafe-timeline__tick:nth-child(5) { left: 100%; }
    .cafe-timeline__tick { position: absolute; }
    .cafe-timeline__ticks { height: 34px; }
  `;
  document.head.appendChild(style);
}

/**
 * TimelineSlider — a top-of-screen era selector.
 *
 * Renders a polished range control with five labelled stops (1945, 1965, 1985,
 * 2005, 2025 by default, sourced from the shared PeriodPackage contract) and
 * emits a `change` {@link CustomEvent} whose `detail` is
 * `{ index: number, year: number, previousYear: number }` whenever the user
 * selects a different stop (via drag, keyboard, or clicking a tick label).
 *
 * @extends EventTarget
 */
export class TimelineSlider extends EventTarget {
  /**
   * @param {Object} [options]
   * @param {number[]} [options.years]     Ordered list of era years.
   * @param {number}   [options.initialYear] Year to select on mount.
   * @param {HTMLElement} [options.container] Element to mount the slider into.
   */
  constructor({
    years = PERIOD_YEARS,
    initialYear,
    container = document.body,
  } = {}) {
    super();
    this.years = [...years];
    this._index = 0;
    if (initialYear != null) {
      const i = this.years.indexOf(initialYear);
      if (i >= 0) this._index = i;
    }
    this._previousYear = this.years[this._index];

    ensureStyles();
    this.el = this._build();
    if (container) container.appendChild(this.el);
    this._syncActive();
  }

  /** Builds the DOM tree for the slider. @private */
  _build() {
    const wrap = document.createElement('div');
    wrap.className = 'cafe-timeline';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Café timeline');

    const title = document.createElement('div');
    title.className = 'cafe-timeline__title';

    this._headingEl = document.createElement('span');
    this._headingEl.className = 'cafe-timeline__heading';
    this._headingEl.textContent = 'Café through the decades';

    this._valueEl = document.createElement('span');
    this._valueEl.className = 'cafe-timeline__value';
    this._valueEl.textContent = String(this.years[this._index]);

    title.append(this._headingEl, this._valueEl);

    const track = document.createElement('div');
    track.className = 'cafe-timeline__track';

    this._rangeEl = document.createElement('input');
    this._rangeEl.type = 'range';
    this._rangeEl.className = 'cafe-timeline__range';
    this._rangeEl.min = '0';
    this._rangeEl.max = String(this.years.length - 1);
    this._rangeEl.step = '1';
    this._rangeEl.value = String(this._index);
    this._rangeEl.setAttribute('aria-label', 'Select a year');
    this._rangeEl.addEventListener('input', () => {
      this._selectIndex(Number(this._rangeEl.value), /* emit */ true);
    });

    const ticks = document.createElement('div');
    ticks.className = 'cafe-timeline__ticks';
    this._tickEls = this.years.map((year, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cafe-timeline__tick';
      btn.dataset.index = String(index);
      btn.textContent = String(year);
      btn.setAttribute('aria-label', `Select year ${year}`);
      btn.addEventListener('click', () => this._selectIndex(index, true));
      ticks.appendChild(btn);
      return btn;
    });

    track.append(this._rangeEl, ticks);
    wrap.append(title, track);
    return wrap;
  }

  /**
   * Selects a stop by index and, when `emit` is true, dispatches `change`.
   * @private
   * @param {number} index
   * @param {boolean} emit
   */
  _selectIndex(index, emit) {
    const clamped = Math.max(0, Math.min(this.years.length - 1, index | 0));
    if (clamped === this._index && emit) {
      // Same stop: still reflect the value but don't re-emit a change.
      this._rangeEl.value = String(clamped);
      return;
    }
    const year = this.years[clamped];
    const previousYear = this.years[this._index];
    this._index = clamped;
    this._rangeEl.value = String(clamped);
    this._syncActive();
    if (emit) {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { index: clamped, year, previousYear },
        }),
      );
    }
  }

  /** Updates the active tick + read-out to match the current index. @private */
  _syncActive() {
    const year = this.years[this._index];
    if (this._valueEl) this._valueEl.textContent = String(year);
    if (this._tickEls) {
      this._tickEls.forEach((btn, i) => {
        btn.classList.toggle('is-active', i === this._index);
      });
    }
  }

  /**
   * Programmatically selects a year. Emits `change` only if the year differs
   * from the current selection.
   * @param {number} year
   * @returns {boolean} true if the selection changed.
   */
  setYear(year) {
    const index = this.years.indexOf(year);
    if (index < 0) return false;
    if (index === this._index) return false;
    this._selectIndex(index, true);
    return true;
  }

  /** @returns {number} The currently selected year. */
  getYear() {
    return this.years[this._index];
  }

  /** @returns {number} The zero-based index of the current stop. */
  getIndex() {
    return this._index;
  }

  /** Removes the slider from the DOM. @returns {void} */
  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
}

export default TimelineSlider;
