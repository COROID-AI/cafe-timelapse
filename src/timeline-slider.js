/**
 * @file src/timeline-slider.js
 * Top-of-screen slider. Five snap stops (1945, 1965, 1985, 2005, 2025) with tick
 * marks + year labels. Click/drag/keyboard-arrow (Left/Right/Home/End) all snap
 * to stops. Emits a 'select' callback with the chosen year.
 *
 * Visual style: the track fill + thumb color update to match the era it is
 * about to commit to (preview) via CSS custom properties set by the active era.
 * A subtle 200ms flash plays on the thumb when a new year commits.
 */
import { PERIOD_YEARS } from './contracts/PeriodPackage.js';

const THUMB_W = 38; // px, must match CSS .timeline-thumb width

export default class TimelineSlider {
  /**
   * @param {{el:HTMLElement, onSelect:Function}} opts
   */
  constructor({ el, onSelect }) {
    this.el = el;
    this.onSelect = onSelect;
    this.years = PERIOD_YEARS;
    this.index = 0; // currently committed index
    this.previewIndex = 0; // index the thumb is hovering/dragging toward

    // DOM refs
    this.rail = el.querySelector('#timeline-rail');
    this.track = el.querySelector('#timeline-track');
    this.trackFill = el.querySelector('#timeline-track-fill');
    this.thumb = el.querySelector('#timeline-thumb');
    this.stopsContainer = el.querySelector('#timeline-stops');

    this.dragging = false;
    this._dragMoved = false;

    this._buildStops();
    this._bindEvents();
    this._render();
  }

  _buildStops() {
    this.stopsContainer.innerHTML = '';
    this.stopEls = [];
    this.years.forEach((year, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'timeline-stop';
      btn.innerHTML = `<span class="timeline-stop-tick"></span><span class="timeline-stop-label">${year}</span>`;
      btn.setAttribute('aria-label', `Select year ${year}`);
      btn.addEventListener('click', () => this._commit(i));
      this.stopsContainer.appendChild(btn);
      this.stopEls.push(btn);
    });
  }

  _bindEvents() {
    // Thumb drag
    this.thumb.addEventListener('pointerdown', (e) => this._onThumbDown(e));

    // Track click (snap to nearest stop)
    this.track.addEventListener('click', (e) => {
      if (this._dragMoved) return; // suppress click after drag
      const idx = this._xToIndex(e.clientX);
      this._commit(idx);
    });

    // Keyboard on the thumb (focusable)
    this.thumb.addEventListener('keydown', (e) => this._onKeyDown(e));

    // Window-level pointer move/up for smooth dragging
    this._onMove = (e) => this._onThumbMove(e);
    this._onUp = (e) => this._onThumbUp(e);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
  }

  // Local clamp to avoid importing THREE into this UI-only module.
  _clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  _onThumbDown(e) {
    e.preventDefault();
    this.dragging = true;
    this._dragMoved = false;
    this.thumb.setPointerCapture(e.pointerId);
    this.thumb.classList.add('is-active');
  }

  _onThumbMove(e) {
    if (!this.dragging) return;
    const idx = this._xToIndex(e.clientX);
    if (idx !== this.previewIndex) {
      this._dragMoved = true;
      this.previewIndex = idx;
      this._render();
    }
  }

  _onThumbUp(e) {
    if (!this.dragging) return;
    this.dragging = false;
    this.thumb.classList.remove('is-active');
    // Commit to the previewed stop.
    this._commit(this.previewIndex);
  }

  _onKeyDown(e) {
    let handled = true;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        this._commit(Math.max(0, this.index - 1));
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        this._commit(Math.min(this.years.length - 1, this.index + 1));
        break;
      case 'Home':
        this._commit(0);
        break;
      case 'End':
        this._commit(this.years.length - 1);
        break;
      default:
        handled = false;
    }
    if (handled) e.preventDefault();
  }

  /** Convert a client X to the nearest stop index. */
  _xToIndex(clientX) {
    const rect = this.track.getBoundingClientRect();
    const ratio = this._clamp((clientX - rect.left) / rect.width, 0, 1);
    const idx = Math.round(ratio * (this.years.length - 1));
    return idx;
  }

  /** Commit a stop: update index, fire onSelect, flash the thumb. */
  _commit(idx) {
    if (idx < 0 || idx >= this.years.length) return;
    const changed = idx !== this.index;
    this.index = idx;
    this.previewIndex = idx;
    this._render();
    if (changed) {
      this._flash();
      if (this.onSelect) this.onSelect(this.years[idx]);
    }
  }

  _flash() {
    this.thumb.classList.remove('is-flashing');
    // force reflow to restart animation
    void this.thumb.offsetWidth;
    this.thumb.classList.add('is-flashing');
    setTimeout(() => this.thumb.classList.remove('is-flashing'), 220);
  }

  _render() {
    const n = this.years.length;
    const display = this.dragging ? this.previewIndex : this.index;
    const pct = n === 1 ? 0 : (display / (n - 1)) * 100;

    // Thumb position (centered on stop)
    this.thumb.style.left = `${pct}%`;

    // Track fill
    this.trackFill.style.width = `${pct}%`;

    // Active stop styling
    this.stopEls.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === this.index);
    });

    // Thumb aria
    this.thumb.setAttribute('aria-valuenow', String(this.years[this.index]));
    this.thumb.setAttribute('aria-valuemin', String(this.years[0]));
    this.thumb.setAttribute('aria-valuemax', String(this.years[n - 1]));
  }

  /** Programmatically set the active year (no event fired). */
  setYear(year) {
    const idx = this.years.indexOf(year);
    if (idx >= 0) {
      this.index = idx;
      this.previewIndex = idx;
      this._render();
    }
  }

  getYear() {
    return this.years[this.index];
  }

  dispose() {
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
  }
}
