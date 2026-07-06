/**
 * @file src/inspector.js
 * Inspector overlay. On click within the canvas, raycasts against hotspot
 * invisible hit meshes. On hit, animates a right-side panel in (translateX +
 * opacity) showing the era-aware title + body from hotspot-data.js and a
 * "Back to scene" button. Esc and click-outside close it. Disables OrbitControls
 * while open so the camera does not drift.
 *
 * Also renders screen-space-billboarded pulsing DOM markers for each hotspot
 * so the user can see what is clickable. Markers rebuild on era change.
 */
import { getHotspotText } from './hotspot-data.js';

export default class Inspector {
  /**
   * @param {{renderer:object, dom:object}} opts
   *   renderer - SceneRenderer instance (provides camera, scene, raycast, worldToScreen)
   *   dom      - hotspots container + inspector elements
   */
  constructor({ renderer, dom }) {
    this.renderer = renderer;
    this.dom = dom;
    this.camera = renderer.getCamera();
    this.scene = renderer.getScene();
    this.eraId = null;
    this.hotspots = []; // [{id, position, radius, mesh}]
    this.markerEls = [];
    this.open = false;
    this._tooltipEl = null;

    // Bind handlers
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onClickClose = this._onClickClose.bind(this);
    this._onScrimClick = this._onScrimClick.bind(this);
    this.update = this.update.bind(this);

    // Wire DOM events
    const canvas = this.renderer.getDomElement();
    canvas.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('keydown', this._onKeyDown);
    this.dom.closeBtn.addEventListener('click', this._onClickClose);
    this.dom.backBtn.addEventListener('click', this._onClickClose);
    this.dom.scrim.addEventListener('click', this._onScrimClick);

    // Register the per-frame update (marker billboarding).
    this.renderer.addUpdateCallback(this.update);
  }

  /**
   * Rebuild hotspot hit meshes + DOM markers for a new era.
   * @param {import('./contracts/PeriodPackage.js').PeriodPackage} pkg
   */
  setEra(pkg) {
    // Remove old hit meshes.
    for (const h of this.hotspots) {
      if (h.mesh && h.mesh.parent) h.mesh.parent.remove(h.mesh);
      if (h.mesh && h.mesh.geometry) h.mesh.geometry.dispose();
    }
    this.hotspots = [];
    // Remove old DOM markers.
    for (const el of this.markerEls) {
      el.el.remove();
    }
    this.markerEls = [];
    this.eraId = pkg.id;

    const THREE = window.THREE || null;
    for (const spot of pkg.hotspots) {
      // Create an invisible hit sphere for raycasting.
      const hitGeo = new (this._sphereCtor())(spot.radius ?? 0.5, 12, 12);
      const hitMat = new (this._basicMatCtor())({ visible: false });
      const hitMesh = new (this._meshCtor())(hitGeo, hitMat);
      hitMesh.position.set(spot.position[0], spot.position[1], spot.position[2]);
      hitMesh.userData.hotspotId = spot.id;
      hitMesh.userData.isHotspot = true;
      pkg.group.add(hitMesh);
      this.hotspots.push({ id: spot.id, position: spot.position, radius: spot.radius ?? 0.5, mesh: hitMesh });

      // DOM marker.
      const markerEl = document.createElement('button');
      markerEl.className = 'hotspot-marker';
      markerEl.type = 'button';
      markerEl.setAttribute('aria-label', `Inspect ${spot.id}`);
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this._openPanel(spot.id);
      });
      markerEl.addEventListener('mouseenter', () => this._showTooltip(spot.id, markerEl));
      markerEl.addEventListener('mouseleave', () => this._hideTooltip());
      this.dom.markersRoot.appendChild(markerEl);
      this.markerEls.push({ el: markerEl, id: spot.id, position: spot.position });
    }
  }

  /* Use Three.js constructors via a lazy import-safe approach: we store the
   * THREE module on window from main.js so the inspector (which is UI-only)
   * doesn't need a hard ESM dependency. This keeps the bundle lean. */
  _sphereCtor() {
    return window.THREE.SphereGeometry;
  }
  _basicMatCtor() {
    return window.THREE.MeshBasicMaterial;
  }
  _meshCtor() {
    return window.THREE.Mesh;
  }

  /* ---------------------------------------------------------------- *
   * Per-frame: billboard DOM markers to screen space.
   * ---------------------------------------------------------------- */
  update() {
    if (this.open) return; // freeze markers while panel is open
    for (const m of this.markerEls) {
      const world = new (this._vec3Ctor())(m.position[0], m.position[1], m.position[2]);
      const screen = this.renderer.worldToScreen(world);
      const rect = this.renderer.getDomElement().getBoundingClientRect();
      const relX = screen.x - rect.left;
      const relY = screen.y - rect.top;
      if (screen.behind) {
        m.el.classList.remove('is-visible');
      } else {
        m.el.classList.add('is-visible');
        m.el.style.left = `${relX}px`;
        m.el.style.top = `${relY}px`;
      }
    }
    if (this._tooltipEl) {
      // keep tooltip near its marker (already positioned)
    }
  }

  _vec3Ctor() {
    return window.THREE.Vector3;
  }

  /* ---------------------------------------------------------------- *
   * Click raycast against hotspot hit meshes.
   * ---------------------------------------------------------------- */
  _onPointerDown(e) {
    if (this.open) return;
    if (this.hotspots.length === 0) return;
    // Ignore drags (orbit). We detect a click vs drag by tracking movement.
    this._downX = e.clientX;
    this._downY = e.clientY;
    const onUp = (ev) => {
      this.renderer.getDomElement().removeEventListener('pointerup', onUp);
      const dx = ev.clientX - this._downX;
      const dy = ev.clientY - this._downY;
      if (Math.hypot(dx, dy) > 6) return; // it was a drag
      this.renderer.setPointer(ev.clientX, ev.clientY);
      const targets = this.hotspots.map((h) => h.mesh);
      const hit = this.renderer.raycast(targets);
      if (hit) {
        const id = hit.object.userData.hotspotId;
        this._openPanel(id);
      }
    };
    this.renderer.getDomElement().addEventListener('pointerup', onUp, { once: true });
  }

  _onKeyDown(e) {
    if (e.key === 'Escape' && this.open) {
      this._closePanel();
    }
  }

  _onScrimClick() {
    if (this.open) this._closePanel();
  }

  _onClickClose() {
    this._closePanel();
  }

  _openPanel(hotspotId) {
    const text = getHotspotText(this.eraId, hotspotId);
    if (!text) return;
    const pkg = window.__activePkg;
    const eraLabel = pkg ? pkg.eraName : this.eraId;
    this.dom.era.textContent = `${pkg ? pkg.year : ''} — ${eraLabel}`;
    this.dom.title.textContent = text.title;
    this.dom.body.textContent = text.body;
    this.dom.root.classList.add('is-open');
    this.dom.root.setAttribute('aria-hidden', 'false');
    this.open = true;
    // Disable camera controls so it doesn't drift.
    this.renderer.setControlsEnabled(false);
  }

  _closePanel() {
    this.dom.root.classList.remove('is-open');
    this.dom.root.setAttribute('aria-hidden', 'true');
    this.open = false;
    this.renderer.setControlsEnabled(true);
  }

  _showTooltip(id, markerEl) {
    const text = getHotspotText(this.eraId, id);
    if (!text) return;
    if (!this._tooltipEl) {
      this._tooltipEl = document.createElement('div');
      this._tooltipEl.className = 'hotspot-tooltip';
      this.dom.markersRoot.appendChild(this._tooltipEl);
    }
    this._tooltipEl.textContent = text.title;
    const rect = markerEl.getBoundingClientRect();
    const rootRect = this.dom.markersRoot.getBoundingClientRect();
    this._tooltipEl.style.left = `${rect.left - rootRect.left + rect.width / 2}px`;
    this._tooltipEl.style.top = `${rect.top - rootRect.top}px`;
    this._tooltipEl.classList.add('is-visible');
  }

  _hideTooltip() {
    if (this._tooltipEl) this._tooltipEl.classList.remove('is-visible');
  }

  dispose() {
    this.renderer.getDomElement().removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('keydown', this._onKeyDown);
    this.renderer.removeUpdateCallback(this.update);
    for (const m of this.markerEls) m.el.remove();
  }
}
