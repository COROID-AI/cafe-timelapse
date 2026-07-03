/**
 * stats-panel.js — Lightweight FPS + draw-call overlay (stats.js-compatible).
 *
 * Provides a toggleable performance panel that mirrors the stats.js API
 * (begin/end per frame) but adds a draw-call counter so we can verify the
 * < 200 draw-call budget per era.
 *
 * Toggle visibility with the P key.
 *
 * No external dependencies — pure DOM/CSS so it works in any browser.
 */

/**
 * A minimal performance stats panel.
 */
export class StatsPanel {
  constructor() {
    /** @type {HTMLDivElement} */
    this._panel = document.createElement('div');
    this._panel.id = 'cafe-stats-panel';
    this._applyStyles();

    /** @type {HTMLCanvasElement} */
    this._canvas = document.createElement('canvas');
    this._canvas.width = 100;
    this._canvas.height = 56;
    this._panel.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');

    /** @type {HTMLDivElement} */
    this._fpsLabel = document.createElement('div');
    this._fpsLabel.className = 'cafe-stats-fps';
    this._panel.appendChild(this._fpsLabel);

    /** @type {HTMLDivElement} */
    this._dcLabel = document.createElement('div');
    this._dcLabel.className = 'cafe-stats-dc';
    this._panel.appendChild(this._dcLabel);

    document.body.appendChild(this._panel);

    /** @type {number} */
    this._frames = 0;
    /** @type {number} */
    this._lastTime = performance.now();
    /** @type {number} */
    this._fps = 60;
    /** @type {number} */
    this._drawCalls = 0;
    /** @type {number} */
    this._maxDrawCalls = 0;
    /** @type {boolean} */
    this._visible = true;
    /** @type {number[]} */
    this._fpsHistory = new Array(100).fill(60);
    /** @type {number[]} */
    this._dcHistory = new Array(100).fill(0);
  }

  /**
   * Apply inline styles — keeps the panel self-contained.
   * @private
   */
  _applyStyles() {
    const s = this._panel.style;
    s.position = 'fixed';
    s.top = '60px';
    s.left = '10px';
    s.zIndex = '9999';
    s.background = 'rgba(0, 0, 0, 0.78)';
    s.color = '#00ff88';
    s.fontFamily = 'monospace';
    s.fontSize = '11px';
    s.padding = '4px';
    s.borderRadius = '4px';
    s.pointerEvents = 'none';
    s.display = 'flex';
    s.flexDirection = 'column';
    s.gap = '2px';
    s.minWidth = '104px';
  }

  /**
   * Toggle panel visibility.
   * @param {boolean} [force] — if provided, set to this value; otherwise toggle.
   * @returns {boolean} the new visibility state
   */
  toggle(force) {
    this._visible = (typeof force === 'boolean') ? force : !this._visible;
    this._panel.style.display = this._visible ? 'flex' : 'none';
    return this._visible;
  }

  /**
   * Returns true if the panel is currently visible.
   * @returns {boolean}
   */
  get visible() {
    return this._visible;
  }

  /**
   * Returns the current measured FPS.
   * @returns {number}
   */
  get fps() {
    return this._fps;
  }

  /**
   * Returns the latest draw-call count.
   * @returns {number}
   */
  get drawCalls() {
    return this._drawCalls;
  }

  /**
   * Set the draw-call count (called by the renderer after each frame).
   * @param {number} count
   */
  setDrawCalls(count) {
    this._drawCalls = count;
    if (count > this._maxDrawCalls) {
      this._maxDrawCalls = count;
    }
  }

  /**
   * Call at the start of each frame.
   */
  begin() {
    this._frameStartTime = performance.now();
  }

  /**
   * Call at the end of each frame. Updates FPS and redraws the mini-graph.
   */
  end() {
    const now = performance.now();
    this._frames++;

    if (now - this._lastTime >= 500) {
      this._fps = Math.round((this._frames * 1000) / (now - this._lastTime));
      this._frames = 0;
      this._lastTime = now;
      this._updateDisplay();
    }

    // Track history for the sparkline (every frame)
    this._fpsHistory.shift();
    this._fpsHistory.push(this._fps);
    this._dcHistory.shift();
    this._dcHistory.push(this._drawCalls);

    // Draw the mini sparkline every ~4 frames to save CPU
    if (this._frames % 4 === 0) {
      this._drawSparkline();
    }
  }

  /**
   * Update the text labels.
   * @private
   */
  _updateDisplay() {
    const fpsColor = this._fps >= 45 ? '#00ff88' : this._fps >= 30 ? '#ffaa00' : '#ff4444';
    const dcColor = this._drawCalls < 200 ? '#00ff88' : this._drawCalls < 300 ? '#ffaa00' : '#ff4444';

    this._fpsLabel.innerHTML = `FPS: <span style="color:${fpsColor}">${this._fps}</span>`;
    this._dcLabel.innerHTML = `DrawCalls: <span style="color:${dcColor}">${this._drawCalls}</span> <span style="opacity:0.5">(max ${this._maxDrawCalls})</span>`;
  }

  /**
   * Draw a small sparkline showing FPS and draw-call history.
   * @private
   */
  _drawSparkline() {
    const ctx = this._ctx;
    const w = this._canvas.width;
    const h = this._canvas.height;
    ctx.clearRect(0, 0, w, h);

    // FPS sparkline (green)
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < this._fpsHistory.length; i++) {
      const x = (i / (this._fpsHistory.length - 1)) * w;
      const y = h - Math.min(this._fpsHistory[i] / 70, 1) * (h - 4) - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw-call sparkline (cyan)
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < this._dcHistory.length; i++) {
      const x = (i / (this._dcHistory.length - 1)) * w;
      const y = h - Math.min(this._dcHistory[i] / 300, 1) * (h - 4) - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

export default StatsPanel;
