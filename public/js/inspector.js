/**
 * @file public/js/inspector.js
 * @description
 * Close-inspection mode controller + era-comparison HUD for the Cafe Timelapse.
 *
 * Responsibilities:
 *   1. HotspotRegistry — renders clickable per-object hotspot markers on
 *      the 2D viewport. Clicking a hotspot (or pressing Enter on a
 *      focused marker) opens inspect mode.
 *   2. InspectMode — tweens the camera to a fixed close-up of the target
 *      and opens a side panel with object name, era-specific notes, and
 *      era-accurate copy.
 *   3. HudOverlay — shows the active year and a 'changes from previous
 *      era' subtitle derived from diffing two era summaries.
 *   4. Keyboard — Esc exits inspect mode and restores the previous camera.
 *      Tab cycles hotspot focus; Enter opens the focused hotspot.
 *      A visible focus ring is shown on the focused marker.
 *
 * Since there is no live Three.js renderer yet (the viewport is a CSS
 * placeholder), the camera tween is simulated via a CSS transform on the
 * viewport's inner placeholder element and a progress indicator. When a
 * real renderer is added, the tweenCamera() hook can be swapped for an
 * actual Three.js camera animation.
 */

import {
  diffEras,
  formatDiffSubtitle,
  getInspectionNote,
} from './era-data.js';
import {
  getHotspotsForYear,
  getEraSummary,
} from './hotspot-data.js';

/**
 * The Inspector class manages the hotspot registry, inspect mode, HUD,
 * and keyboard interactions for the cafe timelapse.
 */
export class Inspector {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.viewport — the #viewport element
   * @param {object} opts.periodManager — the PeriodManager singleton
   * @param {number} [opts.tweenDuration] — camera tween duration in ms
   */
  constructor({ viewport, periodManager, tweenDuration = 800 }) {
    /** @type {HTMLElement} */
    this._viewport = viewport;
    /** @type {object} */
    this._periodManager = periodManager;
    /** @type {number} */
    this._tweenDuration = tweenDuration;

    /** @type {boolean} */
    this._inspectMode = false;
    /** @type {object|null} */
    this._currentHotspot = null;
    /** @type {number|null} */
    this._currentYear = periodManager.getYear();
    /** @type {number|null} */
    this._previousYear = null;
    /** @type {HTMLElement[]} */
    this._markerElements = [];
    /** @type {number} */
    this._focusedIndex = -1;
    /** @type {number|null} */
    this._tweenRafId = null;

    // DOM element refs (created lazily)
    /** @type {HTMLElement|null} */
    this._hotspotLayer = null;
    /** @type {HTMLElement|null} */
    this._inspectPanel = null;
    /** @type {HTMLElement|null} */
    this._hudElement = null;
    /** @type {HTMLElement|null} */
    this._tweenOverlay = null;

    // Saved camera state for restore on Esc
    /** @type {string} */
    this._savedTransform = '';

    this._onKeyDownBound = this._onKeyDown.bind(this);
    this._onYearChangeBound = this._onYearChange.bind(this);
  }

  // -----------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------

  /**
   * Initialise the inspector: build DOM, register listeners, and render
   * hotspots for the current year.
   */
  init() {
    this._buildDom();
    this._periodManager.addListener(this._onYearChangeBound);
    document.addEventListener('keydown', this._onKeyDownBound);
    this._renderHotspots();
    this._updateHud();
    console.log('[Inspector] Initialised. Click a hotspot or Tab to focus, Enter to inspect.');
  }

  /**
   * Whether inspect mode is currently active.
   * @returns {boolean}
   */
  get isInspectMode() {
    return this._inspectMode;
  }

  /**
   * Open inspect mode for the given hotspot.
   *
   * Saves the current camera transform, tweens to the hotspot's close-up
   * position, and shows the side panel with era-specific notes.
   *
   * @param {object} hotspot — the hotspot data object
   */
  openInspect(hotspot) {
    if (this._inspectMode) return;
    this._inspectMode = true;
    this._currentHotspot = hotspot;

    // Save current camera state (viewport transform) for restore
    const inner = this._viewport.querySelector('.placeholder');
    if (inner) {
      this._savedTransform = inner.style.transform || '';
    }

    // Hide hotspot markers while inspecting
    if (this._hotspotLayer) {
      this._hotspotLayer.classList.add('hidden');
    }

    // Build and show the inspect panel
    this._showInspectPanel(hotspot);

    // Start the camera tween
    this._tweenCamera(hotspot);

    console.log(`[Inspector] Inspecting: ${hotspot.label}`);
  }

  /**
   * Exit inspect mode and restore the previous camera position.
   */
  exitInspect() {
    if (!this._inspectMode) return;
    this._inspectMode = false;
    this._currentHotspot = null;

    // Cancel any running tween
    if (this._tweenRafId !== null) {
      cancelAnimationFrame(this._tweenRafId);
      this._tweenRafId = null;
    }

    // Restore camera
    const inner = this._viewport.querySelector('.placeholder');
    if (inner) {
      inner.style.transform = this._savedTransform;
      inner.style.filter = '';
    }

    // Hide the tween overlay
    if (this._tweenOverlay) {
      this._tweenOverlay.classList.remove('visible');
    }

    // Hide inspect panel
    if (this._inspectPanel) {
      this._inspectPanel.classList.remove('visible');
    }

    // Show hotspot markers again
    if (this._hotspotLayer) {
      this._hotspotLayer.classList.remove('hidden');
    }

    console.log('[Inspector] Exited inspect mode.');
  }

  // -----------------------------------------------------------------
  // DOM construction
  // -----------------------------------------------------------------

  /**
   * Build the inspector DOM layers: hotspot layer, inspect panel, HUD,
   * and tween overlay.
   * @private
   */
  _buildDom() {
    // --- Hotspot marker layer ---
    this._hotspotLayer = document.createElement('div');
    this._hotspotLayer.id = 'hotspot-layer';
    Object.assign(this._hotspotLayer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '50',
    });
    this._viewport.appendChild(this._hotspotLayer);

    // --- Inspect side panel ---
    this._inspectPanel = document.createElement('aside');
    this._inspectPanel.id = 'inspect-panel';
    this._inspectPanel.setAttribute('role', 'dialog');
    this._inspectPanel.setAttribute('aria-label', 'Object inspection');
    this._inspectPanel.innerHTML = ''
      + '<button class="inspect-close" aria-label="Close inspector (Esc)">\u2715</button>'
      + '<h2 class="inspect-title"></h2>'
      + '<p class="inspect-note"></p>'
      + '<p class="inspect-copy"></p>'
      + '<p class="inspect-year"></p>'
      + '<p class="inspect-hint">Press Esc to exit</p>';
    this._viewport.appendChild(this._inspectPanel);

    // Close button
    const closeBtn = this._inspectPanel.querySelector('.inspect-close');
    closeBtn.addEventListener('click', () => this.exitInspect());

    // --- HUD overlay ---
    this._hudElement = document.createElement('div');
    this._hudElement.id = 'era-hud';
    this._hudElement.setAttribute('aria-live', 'polite');
    this._hudElement.innerHTML = ''
      + '<span class="hud-year"></span>'
      + '<span class="hud-name"></span>'
      + '<span class="hud-diff"></span>';
    document.body.appendChild(this._hudElement);

    // --- Tween overlay (progress indicator) ---
    this._tweenOverlay = document.createElement('div');
    this._tweenOverlay.id = 'tween-overlay';
    this._tweenOverlay.innerHTML = '<div class="tween-bar"></div>';
    this._viewport.appendChild(this._tweenOverlay);

    // Inject inspector styles
    this._injectStyles();
  }

  /**
   * Inject CSS for inspector, hotspot markers, inspect panel, and HUD.
   * @private
   */
  _injectStyles() {
    const style = document.createElement('style');
    style.id = 'inspector-styles';
    style.textContent = `
      /* --- Hotspot markers --- */
      .hotspot-marker {
        position: absolute;
        width: 28px;
        height: 28px;
        margin: -14px 0 0 -14px;
        border-radius: 50%;
        background: rgba(200, 170, 130, 0.35);
        border: 2px solid rgba(200, 170, 130, 0.7);
        cursor: pointer;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s, border-color 0.2s, transform 0.2s;
        outline: none;
      }
      .hotspot-marker:hover {
        background: rgba(200, 170, 130, 0.55);
        border-color: rgba(232, 221, 208, 0.9);
        transform: scale(1.15);
      }
      .hotspot-marker::after {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(232, 221, 208, 0.8);
      }
      /* Focus ring — visible when keyboard-focused */
      .hotspot-marker:focus-visible,
      .hotspot-marker.focused {
        box-shadow: 0 0 0 4px rgba(200, 170, 130, 0.4), 0 0 0 6px rgba(232, 221, 208, 0.3);
        border-color: #e8ddd0;
        background: rgba(200, 170, 130, 0.5);
      }
      .hotspot-marker .hotspot-label {
        position: absolute;
        bottom: -22px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.65rem;
        white-space: nowrap;
        color: #a08866;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
      }
      .hotspot-marker:hover .hotspot-label,
      .hotspot-marker.focused .hotspot-label {
        opacity: 1;
      }

      /* --- Inspect side panel --- */
      #inspect-panel {
        position: absolute;
        top: 70px;
        right: 20px;
        width: 340px;
        max-height: calc(100vh - 160px);
        overflow-y: auto;
        background: rgba(10, 8, 6, 0.94);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(200, 170, 130, 0.25);
        border-radius: 14px;
        padding: 24px;
        color: #e8ddd0;
        z-index: 200;
        opacity: 0;
        transform: translateX(20px);
        pointer-events: none;
        transition: opacity 0.35s, transform 0.35s;
      }
      #inspect-panel.visible {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
      }
      #inspect-panel .inspect-close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: 1px solid rgba(200, 170, 130, 0.3);
        border-radius: 6px;
        color: #a08866;
        font-size: 0.9rem;
        width: 28px;
        height: 28px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      #inspect-panel .inspect-close:hover {
        background: rgba(200, 170, 130, 0.15);
        color: #e8ddd0;
      }
      #inspect-panel .inspect-title {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 12px;
        color: #e8ddd0;
        padding-right: 30px;
      }
      #inspect-panel .inspect-note {
        font-size: 0.85rem;
        line-height: 1.55;
        color: #c8b898;
        margin-bottom: 14px;
      }
      #inspect-panel .inspect-copy {
        font-size: 0.8rem;
        font-style: italic;
        color: #a08866;
        padding: 10px 14px;
        background: rgba(200, 170, 130, 0.08);
        border-left: 3px solid rgba(200, 170, 130, 0.4);
        border-radius: 4px;
        margin-bottom: 14px;
      }
      #inspect-panel .inspect-copy:empty { display: none; }
      #inspect-panel .inspect-year {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: #7a6648;
        margin-bottom: 8px;
      }
      #inspect-panel .inspect-hint {
        font-size: 0.7rem;
        color: #5a4a36;
        margin-top: 16px;
      }

      /* --- HUD overlay --- */
      #era-hud {
        position: fixed;
        top: 62px;
        left: 24px;
        z-index: 90;
        background: rgba(10, 8, 6, 0.88);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(200, 170, 130, 0.15);
        border-radius: 10px;
        padding: 10px 16px;
        color: #e8ddd0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-width: 380px;
      }
      #era-hud .hud-year {
        font-size: 1.4rem;
        font-weight: 700;
        letter-spacing: 0.03em;
      }
      #era-hud .hud-name {
        font-size: 0.75rem;
        color: #a08866;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      #era-hud .hud-diff {
        font-size: 0.72rem;
        color: #c8a874;
        line-height: 1.4;
      }
      #era-hud .hud-diff:empty { display: none; }

      /* --- Tween overlay --- */
      #tween-overlay {
        position: absolute;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 4px;
        background: rgba(200, 170, 130, 0.15);
        border-radius: 2px;
        overflow: hidden;
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 150;
      }
      #tween-overlay.visible { opacity: 1; }
      #tween-overlay .tween-bar {
        height: 100%;
        width: 0%;
        background: #c8a874;
        border-radius: 2px;
        transition: width 0.05s linear;
      }

      /* Utility */
      #hotspot-layer.hidden { display: none; }
    `;
    document.head.appendChild(style);
  }

  // -----------------------------------------------------------------
  // Hotspot rendering
  // -----------------------------------------------------------------

  /**
   * Re-render the hotspot markers for the current year.
   * @private
   */
  _renderHotspots() {
    // Clear existing markers
    if (!this._hotspotLayer) return;
    this._hotspotLayer.innerHTML = '';
    this._markerElements = [];
    this._focusedIndex = -1;

    const year = this._periodManager.getYear();
    const hotspots = getHotspotsForYear(year);

    for (let i = 0; i < hotspots.length; i++) {
      const hs = hotspots[i];
      const marker = document.createElement('button');
      marker.className = 'hotspot-marker';
      marker.setAttribute('type', 'button');
      marker.setAttribute('data-hotspot-id', hs.id);
      marker.setAttribute('aria-label', `Inspect: ${hs.label}`);
      marker.setAttribute('tabindex', '0');
      marker.style.left = `${hs.screenPosition[0]}%`;
      marker.style.top = `${hs.screenPosition[1]}%`;

      const labelEl = document.createElement('span');
      labelEl.className = 'hotspot-label';
      labelEl.textContent = hs.label;
      marker.appendChild(labelEl);

      // Click → open inspect mode
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        this._focusMarker(i);
        this.openInspect(hs);
      });

      // Keyboard: Enter opens inspect
      marker.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          this.openInspect(hs);
        }
      });

      this._hotspotLayer.appendChild(marker);
      this._markerElements.push(marker);
    }
  }

  /**
   * Focus a specific marker by index and show the focus ring.
   * @param {number} index
   * @private
   */
  _focusMarker(index) {
    // Remove previous focus class
    if (this._focusedIndex >= 0 && this._markerElements[this._focusedIndex]) {
      this._markerElements[this._focusedIndex].classList.remove('focused');
    }
    this._focusedIndex = index;
    if (index >= 0 && this._markerElements[index]) {
      this._markerElements[index].classList.add('focused');
      this._markerElements[index].focus();
    }
  }

  /**
   * Cycle focus to the next hotspot (Tab) or previous (Shift+Tab).
   * @param {boolean} reverse
   * @private
   */
  _cycleFocus(reverse) {
    if (this._markerElements.length === 0) return;
    let next = this._focusedIndex;
    if (next < 0) {
      next = reverse ? this._markerElements.length - 1 : 0;
    } else {
      next = reverse
        ? (next - 1 + this._markerElements.length) % this._markerElements.length
        : (next + 1) % this._markerElements.length;
    }
    this._focusMarker(next);
  }

  // -----------------------------------------------------------------
  // Inspect panel
  // -----------------------------------------------------------------

  /**
   * Show the inspect side panel with era-specific notes for the hotspot.
   * @param {object} hotspot
   * @private
   */
  _showInspectPanel(hotspot) {
    if (!this._inspectPanel) return;

    const year = this._periodManager.getYear();
    const note = getInspectionNote(year, hotspot.id, hotspot.label);

    const titleEl = this._inspectPanel.querySelector('.inspect-title');
    const noteEl = this._inspectPanel.querySelector('.inspect-note');
    const copyEl = this._inspectPanel.querySelector('.inspect-copy');
    const yearEl = this._inspectPanel.querySelector('.inspect-year');

    titleEl.textContent = note ? note.name : hotspot.label;
    noteEl.textContent = note ? note.note : 'No detailed description available for this era.';
    copyEl.textContent = note ? note.copy : '';
    yearEl.textContent = `${year} \u00b7 ${this._getEraName(year)}`;

    // Defer the visible class so the CSS transition fires
    requestAnimationFrame(() => {
      this._inspectPanel.classList.add('visible');
    });
  }

  /**
   * Get the era display name for a year.
   * @param {number} year
   * @returns {string}
   * @private
   */
  _getEraName(year) {
    const summary = getEraSummary(year);
    return summary ? summary.name : '';
  }

  // -----------------------------------------------------------------
  // Camera tween (simulated)
  // -----------------------------------------------------------------

  /**
   * Tween the camera to the hotspot's close-up position.
   *
   * Since there is no live Three.js renderer, this simulates the camera
   * move with a CSS zoom transform on the viewport's inner element and a
   * progress bar. When a real renderer is added, replace this method body
   * with a Three.js camera animation using cameraPosition / lookAt / fov.
   *
   * @param {object} hotspot
   * @private
   */
  _tweenCamera(hotspot) {
    const inner = this._viewport.querySelector('.placeholder');
    if (!inner) return;

    // Show progress bar
    if (this._tweenOverlay) {
      this._tweenOverlay.classList.add('visible');
      const bar = this._tweenOverlay.querySelector('.tween-bar');
      if (bar) bar.style.width = '0%';
    }

    // Compute a zoom transform based on the hotspot's fov (lower fov = more zoom)
    const baseFov = 60;
    const zoomFactor = baseFov / (hotspot.fov || 45);
    const targetScale = Math.min(zoomFactor * 1.2, 2.5);

    // Compute a pan offset based on the hotspot's screenPosition
    const panX = (50 - hotspot.screenPosition[0]) * 0.4;
    const panY = (50 - hotspot.screenPosition[1]) * 0.3;

    const startTime = performance.now();
    const duration = this._tweenDuration;

    /**
     * Animation frame callback.
     * @param {number} now
     */
    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-in-out cubic
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const scale = 1 + (targetScale - 1) * eased;
      const tx = panX * eased;
      const ty = panY * eased;

      inner.style.transform = `scale(${scale}) translate(${tx}%, ${ty}%)`;
      inner.style.filter = `brightness(${0.7 + 0.3 * eased})`;

      // Update progress bar
      if (this._tweenOverlay) {
        const bar = this._tweenOverlay.querySelector('.tween-bar');
        if (bar) bar.style.width = `${t * 100}%`;
      }

      if (t < 1) {
        this._tweenRafId = requestAnimationFrame(animate);
      } else {
        this._tweenRafId = null;
        // Hide progress bar after a short delay
        setTimeout(() => {
          if (this._tweenOverlay) {
            this._tweenOverlay.classList.remove('visible');
          }
        }, 300);
      }
    };

    this._tweenRafId = requestAnimationFrame(animate);
  }

  // -----------------------------------------------------------------
  // HUD
  // -----------------------------------------------------------------

  /**
   * Update the HUD overlay: active year, era name, and diff subtitle.
   * @private
   */
  _updateHud() {
    if (!this._hudElement) return;

    const year = this._periodManager.getYear();
    const summary = getEraSummary(year);

    const yearEl = this._hudElement.querySelector('.hud-year');
    const nameEl = this._hudElement.querySelector('.hud-name');
    const diffEl = this._hudElement.querySelector('.hud-diff');

    yearEl.textContent = `${year}`;
    nameEl.textContent = summary ? summary.name : '';

    // Compute diff from previous era
    if (this._previousYear !== null && this._previousYear !== year) {
      const prevSummary = getEraSummary(this._previousYear);
      if (prevSummary && summary) {
        const tokens = diffEras(prevSummary, summary);
        diffEl.textContent = formatDiffSubtitle(tokens);
      } else {
        diffEl.textContent = '';
      }
    } else {
      diffEl.textContent = '';
    }
  }

  // -----------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------

  /**
   * Handle year changes from the PeriodManager.
   * @param {number} newYear
   * @param {number} oldYear
   * @private
   */
  _onYearChange(newYear, oldYear) {
    this._previousYear = oldYear;
    this._currentYear = newYear;

    // Exit inspect mode if active (the hotspots change with the era)
    if (this._inspectMode) {
      this.exitInspect();
    }

    // Re-render hotspots for the new era
    this._renderHotspots();

    // Update HUD with new year + diff
    this._updateHud();
  }

  /**
   * Global keyboard handler.
   *
   * - Esc: exit inspect mode
   * - Tab / Shift+Tab: cycle hotspot focus (when not in inspect mode)
   * - Enter: open inspect for the focused hotspot (when not in inspect mode)
   *
   * @param {KeyboardEvent} e
   * @private
   */
  _onKeyDown(e) {
    // Esc always exits inspect mode
    if (e.key === 'Escape') {
      if (this._inspectMode) {
        e.preventDefault();
        this.exitInspect();
      }
      return;
    }

    // In inspect mode, only Esc is handled
    if (this._inspectMode) return;

    // Tab cycles hotspot focus
    if (e.key === 'Tab') {
      // Only intercept Tab if no input is focused
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      this._cycleFocus(e.shiftKey);
      return;
    }

    // Enter opens the focused hotspot
    if (e.key === 'Enter') {
      if (this._focusedIndex >= 0 && this._markerElements[this._focusedIndex]) {
        const marker = this._markerElements[this._focusedIndex];
        const hotspotId = marker.getAttribute('data-hotspot-id');
        const year = this._periodManager.getYear();
        const hotspots = getHotspotsForYear(year);
        const hs = hotspots.find((h) => h.id === hotspotId);
        if (hs) {
          e.preventDefault();
          this.openInspect(hs);
        }
      }
    }
  }
}

export default Inspector;
