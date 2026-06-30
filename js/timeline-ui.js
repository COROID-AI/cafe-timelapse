/**
 * TimelineUI — top-of-viewport timeline slider for the Café Time Period
 * Timelapse.
 *
 * Renders a polished overlay exposing exactly five years (1945, 1965, 1985,
 * 2005, 2025). Selecting a stop — by click or keyboard — dispatches a
 * `period-change` CustomEvent on `window` carrying the chosen year, which the
 * PeriodManager subscribes to. The timeline is the single source of truth for
 * the active period.
 *
 * Contract for downstream consumers (e.g. PeriodManager):
 *   - Read the initial period via `window.Cafe.timeline.currentYear`.
 *   - React to subsequent changes via:
 *       window.addEventListener('period-change', (e) => {
 *         const { year, index } = e.detail;
 *       });
 */

/** The five selectable years, in chronological order. */
export const YEARS = [1945, 1965, 1985, 2005, 2025];

export class TimelineUI {
  /**
   * @param {number[]} [years]      Ordered list of selectable years.
   * @param {number}   [initialIndex] Index of the year selected on load.
   */
  constructor(years = YEARS, initialIndex = 0) {
    this.years = [...years];
    this.currentIndex = 0;

    this._build();
    this.setIndex(initialIndex, { dispatch: false });
    this._wireEvents();
  }

  /** The currently selected year. */
  get currentYear() {
    return this.years[this.currentIndex];
  }

  /**
   * Select a stop by index.
   * @param {number} index
   * @param {{ dispatch?: boolean }} [opts]  Dispatch `period-change` (default true).
   * @returns {number} the selected year.
   */
  setIndex(index, { dispatch = true } = {}) {
    const clamped = Math.max(0, Math.min(this.years.length - 1, index | 0));
    this.currentIndex = clamped;
    this._render();
    if (dispatch) this._dispatch();
    return this.years[clamped];
  }

  /**
   * Select a stop by year value. No-op (with dispatch) if the year is unknown.
   * @param {number} year
   * @param {{ dispatch?: boolean }} [opts]
   * @returns {number|null} the selected year, or null if not found.
   */
  setYear(year, opts) {
    const index = this.years.indexOf(year);
    if (index === -1) return null;
    return this.setIndex(index, opts);
  }

  // ---------------------------------------------------------------------
  // DOM construction
  // ---------------------------------------------------------------------

  _build() {
    const overlay = document.createElement('div');
    overlay.className = 'timeline-overlay';
    overlay.setAttribute('aria-hidden', 'false');

    const timeline = document.createElement('div');
    timeline.className = 'timeline';
    timeline.setAttribute('role', 'group');
    timeline.setAttribute('aria-label', 'Café time period selector');
    timeline.tabIndex = -1;

    const caption = document.createElement('p');
    caption.className = 'timeline-caption';
    caption.textContent = 'Timeline';
    timeline.appendChild(caption);

    const track = document.createElement('div');
    track.className = 'timeline-track';
    track.appendChild(document.createElement('div')).className = 'timeline-progress';
    timeline.appendChild(track);

    const stops = document.createElement('div');
    stops.className = 'timeline-stops';

    this._stopEls = this.years.map((year) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'timeline-stop';
      btn.dataset.year = String(year);
      btn.setAttribute('aria-label', `Select year ${year}`);

      const node = document.createElement('span');
      node.className = 'timeline-node';
      btn.appendChild(node);

      const label = document.createElement('span');
      label.className = 'timeline-label';
      label.textContent = String(year);
      btn.appendChild(label);

      stops.appendChild(btn);
      return btn;
    });

    timeline.appendChild(stops);
    overlay.appendChild(timeline);
    document.body.appendChild(overlay);

    this._root = overlay;
    this._control = timeline;
    this._progress = track.querySelector('.timeline-progress');
  }

  /** Reflect `currentIndex` in the DOM (active class, aria, progress fill). */
  _render() {
    const total = this.years.length;
    const progress = total > 1 ? this.currentIndex / (total - 1) : 0;
    this._progress.style.setProperty('--progress', String(progress));

    this._stopEls.forEach((el, i) => {
      const active = i === this.currentIndex;
      el.classList.toggle('active', active);
      if (active) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
  }

  // ---------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------

  _wireEvents() {
    this._stopEls.forEach((el, index) => {
      el.addEventListener('click', () => this.setIndex(index));
    });

    // Keyboard support on the control: arrows / Home / End.
    this._control.addEventListener('keydown', (e) => {
      let next = null;
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          next = this.currentIndex - 1;
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          next = this.currentIndex + 1;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = this.years.length - 1;
          break;
        default:
          return; // do not preventDefault for unrelated keys
      }
      e.preventDefault();
      const target = this.setIndex(next);
      // Keep focus on the newly active stop for screen-reader feedback.
      this._stopEls[this.currentIndex].focus();
      return target;
    });
  }

  /** Dispatch the `period-change` event carrying the selected year. */
  _dispatch() {
    window.dispatchEvent(
      new CustomEvent('period-change', {
        detail: { year: this.currentYear, index: this.currentIndex },
      })
    );
  }

  /** Remove the overlay from the DOM and tear down listeners. */
  destroy() {
    this._stopEls.forEach((el) => el.replaceWith(el.cloneNode(true)));
    this._root.remove();
  }
}
