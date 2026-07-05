/**
 * Inspector — interactive hotspot markers + detail side panel.
 *
 * Renders glowing 3D marker sprites at each era hotspot position, handles
 * raycast-based hover (label tooltip) and click (side panel with era-specific
 * description, price list, or product detail), and projects marker world
 * positions to screen space each frame so the HTML tooltips stay pinned.
 *
 * Markers are rebuilt whenever the era changes (via `setEra`), and old markers
 * are fully disposed to prevent GPU leaks across era switches.
 *
 * @module inspector
 */

import * as THREE from 'three';
import { getHotspotsForYear } from './hotspot-data.js';

/** Unique DOM id prefix for inspector UI elements. */
const UI_PREFIX = 'cafe-inspector';

/** Colour of a marker sprite based on its category. */
const CATEGORY_COLORS = {
  menu: 0xffd166,
  equipment: 0xef6f6c,
  music: 0x9b5de5,
  counter: 0x06d6a0,
  patron: 0x4cc9f0,
};

// ---------------------------------------------------------------------------
// CSS — injected once.
// ---------------------------------------------------------------------------

/** Injects all inspector panel + tooltip styles exactly once. */
function ensureInspectorStyles() {
  if (document.getElementById(`${UI_PREFIX}-styles`)) return;
  const style = document.createElement('style');
  style.id = `${UI_PREFIX}-styles`;
  style.textContent = `
    .${UI_PREFIX}-tooltip {
      position: fixed;
      z-index: 60;
      padding: 5px 10px;
      border-radius: 6px;
      background: rgba(20,16,12,0.85);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      color: #f3ece0;
      font-family: system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.03em;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transform: translate(-50%, calc(-100% - 14px));
      transition: opacity 0.12s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .${UI_PREFIX}-tooltip.is-visible { opacity: 1; }
    .${UI_PREFIX}-tooltip::after {
      content: "";
      position: absolute;
      bottom: -5px; left: 50%;
      transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid rgba(20,16,12,0.85);
    }

    .${UI_PREFIX}-panel {
      position: fixed;
      top: 0; right: -380px;
      width: 360px;
      height: 100vh;
      z-index: 70;
      background: rgba(22,18,14,0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-left: 1px solid rgba(255,255,255,0.12);
      box-shadow: -12px 0 40px rgba(0,0,0,0.5);
      color: #f3ece0;
      font-family: system-ui, sans-serif;
      transition: right 0.32s cubic-bezier(0.22, 1, 0.36, 1);
      overflow-y: auto;
      overflow-x: hidden;
    }
    .${UI_PREFIX}-panel.is-open { right: 0; }

    .${UI_PREFIX}-panel-close {
      position: absolute;
      top: 14px; right: 14px;
      width: 32px; height: 32px;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      color: #f3ece0;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
    }
    .${UI_PREFIX}-panel-close:hover { background: rgba(255,255,255,0.16); }

    .${UI_PREFIX}-panel-body {
      padding: 40px 24px 32px;
    }

    .${UI_PREFIX}-panel-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 100px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 14px;
    }

    .${UI_PREFIX}-panel-title {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.25;
      margin: 0 0 6px;
      color: #fff;
    }

    .${UI_PREFIX}-panel-subtitle {
      font-size: 13px;
      font-weight: 500;
      color: rgba(243,236,224,0.6);
      margin: 0 0 18px;
    }

    .${UI_PREFIX}-panel-body p {
      font-size: 14px;
      line-height: 1.65;
      color: rgba(243,236,224,0.82);
      margin: 0 0 20px;
    }

    .${UI_PREFIX}-panel-section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(243,236,224,0.45);
      margin: 0 0 10px;
    }

    .${UI_PREFIX}-pricelist {
      list-style: none;
      padding: 0;
      margin: 0 0 20px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .${UI_PREFIX}-pricelist li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      font-size: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .${UI_PREFIX}-pricelist li:last-child { border-bottom: none; }
    .${UI_PREFIX}-pricelist li:nth-child(odd) { background: rgba(255,255,255,0.03); }
    .${UI_PREFIX}-pricelist .name { color: rgba(243,236,224,0.9); font-weight: 500; }
    .${UI_PREFIX}-pricelist .price { color: #ffd166; font-weight: 700; }

    .${UI_PREFIX}-specs {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 8px;
    }
    .${UI_PREFIX}-specs dt {
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 700;
      color: rgba(243,236,224,0.5);
      background: rgba(255,255,255,0.04);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .${UI_PREFIX}-specs dd {
      padding: 8px 12px;
      margin: 0;
      font-size: 13px;
      color: rgba(243,236,224,0.85);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .${UI_PREFIX}-specs > div:last-child dt,
    .${UI_PREFIX}-specs > div:last-child dd { border-bottom: none; }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Marker texture (round glowing dot, drawn once and reused).
// ---------------------------------------------------------------------------

/** Shared canvas texture for the marker sprite. */
let _markerTexture = null;

/**
 * Creates (once) and returns a radial-gradient dot texture for markers.
 * @returns {THREE.CanvasTexture}
 */
function getMarkerTexture() {
  if (_markerTexture) return _markerTexture;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();
  // Solid centre.
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(64, 64, 14, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  _markerTexture = tex;
  return tex;
}

/**
 * Creates a marker sprite for a single hotspot.
 *
 * The sprite is slightly emissive-looking (bright additive sprite) and scaled
 * to read well in the scene.  A ring mesh underneath provides a subtle glow.
 *
 * @param {Object} hotspot
 * @returns {THREE.Sprite}
 */
function createMarker(hotspot) {
  const color = CATEGORY_COLORS[hotspot.category] ?? 0xffffff;
  const mat = new THREE.SpriteMaterial({
    map: getMarkerTexture(),
    color,
    transparent: true,
    opacity: 0.85,
    depthTest: false,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.28, 0.28, 1);
  sprite.position.set(hotspot.position[0], hotspot.position[1], hotspot.position[2]);
  sprite.name = `hotspot:${hotspot.id}`;
  sprite.userData.hotspot = hotspot;
  sprite.userData.baseOpacity = 0.85;
  sprite.renderOrder = 999;
  return sprite;
}

// ---------------------------------------------------------------------------
// Inspector class.
// ---------------------------------------------------------------------------

/**
 * Manages interactive hotspot markers and the detail side panel.
 */
export class Inspector {
  /**
   * @param {Object} options
   * @param {THREE.Camera} options.camera  - The active scene camera.
   * @param {HTMLElement}   options.domElement - The renderer canvas (for raycast coords).
   * @param {THREE.Scene}   options.scene  - Scene to add markers to.
   * @param {THREE.Group}   [options.markerGroup] - Optional parent group; created if omitted.
   */
  constructor({ camera, domElement, scene, markerGroup } = {}) {
    if (!camera || !domElement || !scene) {
      throw new Error('Inspector requires camera, domElement, and scene');
    }

    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;

    // Marker group — persistent; markers swapped per era.
    this.markerGroup = markerGroup ?? new THREE.Group();
    this.markerGroup.name = 'hotspots';
    if (!markerGroup) this.scene.add(this.markerGroup);

    /** @type {THREE.Sprite[]} */
    this._markers = [];

    /** @type {number|null} Currently hovered marker index (in _markers). */
    this._hovered = null;

    ensureInspectorStyles();
    this._buildTooltip();
    this._buildPanel();

    // Raycaster + pointer state.
    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();
    this._disposed = false;

    // Bind handlers.
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onResize = this._onResize.bind(this);
    this.update = this.update.bind(this);

    this.domElement.addEventListener('pointermove', this._onPointerMove);
    this.domElement.addEventListener('click', this._onClick);
    window.addEventListener('resize', this._onResize);

    /** @type {number} Animation clock for pulsing markers. */
    this._clock = new THREE.Clock();
  }

  // -------------------------------------------------------------------------
  // DOM construction
  // -------------------------------------------------------------------------

  /** Builds the floating hover tooltip element. @private */
  _buildTooltip() {
    this._tooltip = document.createElement('div');
    this._tooltip.className = `${UI_PREFIX}-tooltip`;
    document.body.appendChild(this._tooltip);
  }

  /** Builds the slide-in detail side panel. @private */
  _buildPanel() {
    this._panel = document.createElement('aside');
    this._panel.className = `${UI_PREFIX}-panel`;
    this._panel.setAttribute('role', 'complementary');
    this._panel.setAttribute('aria-label', 'Hotspot details');

    const closeBtn = document.createElement('button');
    closeBtn.className = `${UI_PREFIX}-panel-close`;
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close detail panel');
    closeBtn.addEventListener('click', () => this.closePanel());

    this._panelBody = document.createElement('div');
    this._panelBody.className = `${UI_PREFIX}-panel-body`;

    this._panel.appendChild(closeBtn);
    this._panel.appendChild(this._panelBody);
    document.body.appendChild(this._panel);

    // Close on Escape.
    this._onKeyDown = (e) => {
      if (e.key === 'Escape') this.closePanel();
    };
    window.addEventListener('keydown', this._onKeyDown);
  }

  // -------------------------------------------------------------------------
  // Era switching
  // -------------------------------------------------------------------------

  /**
   * Rebuilds all markers for a new era.  Old markers are disposed first.
   *
   * @param {number} year
   * @returns {void}
   */
  setEra(year) {
    this._clearMarkers();
    this.closePanel();

    const hotspots = getHotspotsForYear(year);
    for (const hotspot of hotspots) {
      const marker = createMarker(hotspot);
      this.markerGroup.add(marker);
      this._markers.push(marker);
    }
  }

  /** Disposes and removes all current markers. @private */
  _clearMarkers() {
    for (const marker of this._markers) {
      this.markerGroup.remove(marker);
      if (marker.material) marker.material.dispose();
    }
    this._markers = [];
    this._hovered = null;
    this._hideTooltip();
  }

  // -------------------------------------------------------------------------
  // Interaction
  // -------------------------------------------------------------------------

  /**
   * Converts a pointer event into normalised device coordinates.
   * @private
   * @param {PointerEvent} event
   */
  _setPointerFromEvent(event) {
    const rect = this.domElement.getBoundingClientRect();
    this._pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Returns the topmost marker under the pointer, or null.
   * @private
   * @returns {THREE.Sprite|null}
   */
  _pickMarker() {
    if (this._markers.length === 0) return null;
    this._raycaster.setFromCamera(this._pointer, this.camera);
    const hits = this._raycaster.intersectObjects(this._markers, false);
    return hits.length > 0 ? hits[0].object : null;
  }

  /** @private Pointer-move handler — hover detection + tooltip. */
  _onPointerMove(event) {
    this._setPointerFromEvent(event);
    const hit = this._pickMarker();

    if (hit) {
      const idx = this._markers.indexOf(hit);
      this._hovered = idx;
      this._showTooltip(hit.userData.hotspot, event.clientX, event.clientY);
      this.domElement.style.cursor = 'pointer';
    } else {
      this._hovered = null;
      this._hideTooltip();
      this.domElement.style.cursor = '';
    }
  }

  /** @private Click handler — open the detail panel. */
  _onClick(event) {
    this._setPointerFromEvent(event);
    const hit = this._pickMarker();
    if (hit) {
      this._renderPanel(hit.userData.hotspot);
      this.openPanel();
    }
  }

  // -------------------------------------------------------------------------
  // Tooltip
  // -------------------------------------------------------------------------

  /** @private */
  _showTooltip(hotspot, x, y) {
    this._tooltip.textContent = hotspot.label;
    this._tooltip.style.left = `${x}px`;
    this._tooltip.style.top = `${y}px`;
    this._tooltip.classList.add('is-visible');
  }

  /** @private */
  _hideTooltip() {
    this._tooltip.classList.remove('is-visible');
  }

  // -------------------------------------------------------------------------
  // Side panel
  // -------------------------------------------------------------------------

  /** Opens the detail side panel. */
  openPanel() {
    this._panel.classList.add('is-open');
  }

  /** Closes the detail side panel. */
  closePanel() {
    this._panel.classList.remove('is-open');
  }

  /**
   * Renders a hotspot's detail content into the side panel.
   * @private
   * @param {Object} hotspot
   */
  _renderPanel(hotspot) {
    const color = CATEGORY_COLORS[hotspot.category] ?? 0xffffff;
    const hex = '#' + color.toString(16).padStart(6, '0');

    let html = '';

    // Badge.
    html += `<span class="${UI_PREFIX}-panel-badge" style="background:${hex}22;color:${hex};border:1px solid ${hex}44;">${hotspot.category}</span>`;

    // Title + subtitle.
    html += `<h2 class="${UI_PREFIX}-panel-title">${this._escape(hotspot.title)}</h2>`;
    if (hotspot.subtitle) {
      html += `<p class="${UI_PREFIX}-panel-subtitle">${this._escape(hotspot.subtitle)}</p>`;
    }

    // Body paragraph.
    if (hotspot.body) {
      const paras = hotspot.body.split('\n\n');
      for (const p of paras) {
        html += `<p>${this._escape(p)}</p>`;
      }
    }

    // Price list (menu hotspots).
    if (hotspot.priceList && hotspot.priceList.length > 0) {
      html += `<h3 class="${UI_PREFIX}-panel-section-title">Price List</h3>`;
      html += `<ul class="${UI_PREFIX}-pricelist">`;
      for (const item of hotspot.priceList) {
        html += `<li><span class="name">${this._escape(item.name)}</span><span class="price">${this._escape(item.price)}</span></li>`;
      }
      html += `</ul>`;
    }

    // Specs (key/value).
    if (hotspot.specs && hotspot.specs.length > 0) {
      html += `<h3 class="${UI_PREFIX}-panel-section-title">Details</h3>`;
      html += `<dl class="${UI_PREFIX}-specs">`;
      for (const s of hotspot.specs) {
        html += `<dt>${this._escape(s.label)}</dt><dd>${this._escape(s.value)}</dd>`;
      }
      html += `</dl>`;
    }

    this._panelBody.innerHTML = html;
  }

  /** @private Escapes HTML special characters in text. */
  _escape(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  // -------------------------------------------------------------------------
  // Per-frame update (call from the render loop)
  // -------------------------------------------------------------------------

  /**
   * Per-frame update: pulses markers and re-projects tooltip position if a
   * marker is hovered.  Should be called every frame from the scene's
   * animation loop.
   *
   * @returns {void}
   */
  update() {
    if (this._disposed) return;

    const t = this._clock.getElapsedTime();

    // Pulse all markers.
    for (let i = 0; i < this._markers.length; i++) {
      const marker = this._markers[i];
      const pulse = 0.85 + Math.sin(t * 2.4 + i * 0.7) * 0.15;
      marker.material.opacity = marker.userData.baseOpacity * pulse;
      const s = 0.28 + Math.sin(t * 2.4 + i * 0.7) * 0.025;
      marker.scale.set(s, s, 1);
    }

    // Re-project hovered marker to keep tooltip pinned.
    if (this._hovered != null && this._markers[this._hovered]) {
      const marker = this._markers[this._hovered];
      const pos = marker.position.clone();
      pos.project(this.camera);
      const rect = this.domElement.getBoundingClientRect();
      const x = (pos.x * 0.5 + 0.5) * rect.width + rect.left;
      const y = (-pos.y * 0.5 + 0.5) * rect.height + rect.top;
      this._tooltip.style.left = `${x}px`;
      this._tooltip.style.top = `${y}px`;
    }
  }

  // -------------------------------------------------------------------------
  // Resize + disposal
  // -------------------------------------------------------------------------

  /** @private */
  _onResize() {
    // Tooltip position auto-corrects on next update(); nothing else needed.
  }

  /**
   * Returns the number of currently active markers.
   * @returns {number}
   */
  getMarkerCount() {
    return this._markers.length;
  }

  /**
   * Tears down the inspector: removes markers, listeners, and DOM elements.
   * @returns {void}
   */
  dispose() {
    this._disposed = true;
    this._clearMarkers();
    this.domElement.removeEventListener('pointermove', this._onPointerMove);
    this.domElement.removeEventListener('click', this._onClick);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('keydown', this._onKeyDown);
    this._tooltip?.remove();
    this._panel?.remove();
    if (_markerTexture) {
      _markerTexture.dispose();
      _markerTexture = null;
    }
  }
}

export default Inspector;
