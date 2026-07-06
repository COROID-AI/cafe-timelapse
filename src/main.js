/**
 * @file src/main.js
 * App bootstrap. Constructs SceneRenderer, TimelineSlider, AudioManager,
 * PeriodManager, Inspector. Wires the slider → period transitions and the
 * inspector. Owns the loading-screen / first-gesture flow.
 *
 * Three.js is loaded as an ESM from the installed package (not a CDN) so the
 * project works offline and `npm run build` is self-contained. We expose THREE
 * on window for the UI-only Inspector module (DOM hotspots) to avoid a heavy
 * second ESM dependency in that file.
 */
import * as THREE from 'three';
import SceneRenderer from './scene-renderer.js';
import TimelineSlider from './timeline-slider.js';
import AudioManager from './managers/AudioManager.js';
import PeriodManager from './managers/PeriodManager.js';
import Inspector from './inspector.js';

// Expose THREE for the DOM-layer inspector markers.
window.THREE = THREE;

const INITIAL_YEAR = 1985; // start in the middle for immediate visual interest
const HOTSPOT_IDEAS = ['music', 'menu', 'counter', 'equipment', 'patron'];

function $(id) {
  return document.getElementById(id);
}

function setProgress(pct) {
  const fill = $('loading-bar-fill');
  if (fill) fill.style.width = `${pct}%`;
}

function init() {
  setProgress(15);

  // --- Scene ---
  const sceneRoot = $('scene-root');
  const renderer = new SceneRenderer(sceneRoot);
  setProgress(40);

  // --- Audio ---
  const audio = new AudioManager();
  audio.attachGestureGate();

  // --- Audio toggle ---
  const audioToggle = $('audio-toggle');
  audioToggle.addEventListener('click', () => {
    const muted = !audio.isMuted();
    audio.setMuted(muted);
    audioToggle.setAttribute('aria-pressed', String(muted));
  });

  // --- Era badge ---
  const eraBadgeYear = $('era-badge-year');
  const eraBadgeName = $('era-badge-name');

  // --- Period manager ---
  const periodManager = new PeriodManager({
    renderer,
    audio,
    onPeriodChanged: (pkg) => {
      // Update global ref for inspector.
      window.__activePkg = pkg;
      // Update badge.
      eraBadgeYear.textContent = String(pkg.year);
      eraBadgeName.textContent = pkg.label;
      // Update inspector hotspots.
      inspector.setEra(pkg);
      // Play era-appropriate coffee SFX once after the transition.
      audio.playEraSfx(pkg.sfxType, 900);
    }
  });
  setProgress(60);

  // --- Inspector ---
  const inspector = new Inspector({
    renderer,
    dom: {
      root: $('inspector-root'),
      panel: $('inspector-panel'),
      scrim: $('inspector-scrim'),
      closeBtn: $('inspector-close'),
      backBtn: $('inspector-back'),
      title: $('inspector-title'),
      body: $('inspector-body'),
      era: $('inspector-era'),
      markersRoot: document.body
    }
  });

  // --- Timeline slider ---
  const sliderEl = $('timeline-root');
  const slider = new TimelineSlider({
    el: sliderEl,
    onSelect: (year) => {
      periodManager.setPeriod(year, true);
    }
  });
  setProgress(80);

  // --- Initial period (non-animated mount) ---
  slider.setYear(INITIAL_YEAR);
  periodManager.setPeriod(INITIAL_YEAR, false);
  setProgress(100);

  // --- Loading / first-gesture flow ---
  const loadingScreen = $('loading-screen');
  const startBtn = $('loading-start');

  function dismissLoading() {
    if (!loadingScreen.classList.contains('is-visible')) return;
    loadingScreen.classList.remove('is-visible');
    document.body.setAttribute('data-interactive', 'true');
    // Unlock audio on this gesture.
    audio.unlock().then(() => {
      // Start music + ambient after unlock.
      const active = periodManager.getActivePackage();
      if (active) audio.playMusicFor(active.id, 600);
    });
  }

  startBtn.addEventListener('click', dismissLoading);
  // Also dismiss on any keypress (accessibility).
  window.addEventListener('keydown', (e) => {
    if (loadingScreen.classList.contains('is-visible')) {
      dismissLoading();
    }
  });

  // Auto-dismiss the loading overlay shortly after the scene is built so the 3D
  // café is visible immediately. Audio remains gated until the first user
  // gesture (autoplay policy); the overlay prompt + toggle handle that.
  setTimeout(() => {
    if (loadingScreen.classList.contains('is-visible')) {
      loadingScreen.classList.remove('is-visible');
      document.body.setAttribute('data-interactive', 'true');
    }
  }, 1500);

  // --- Periodic ambient SFX for life (clinks, chimes) ---
  setInterval(() => {
    if (!audio.isReady) return;
    // Only if audio context is actually running.
    if (audio.ctx && audio.ctx.state === 'running' && !audio.isMuted()) {
      const pick = Math.random();
      if (pick < 0.5) audio.playSfx('clink', Math.random() * 800);
      else if (pick < 0.8) audio.playSfx('chime', Math.random() * 600);
      else audio.playSfx('whoosh', 0);
    }
  }, 7000);

  // --- Visibility: pause heavy work when tab hidden ---
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (audio.ctx && audio.ctx.state === 'running') {
        audio.ctx.suspend().catch(() => {});
      }
    } else {
      if (audio.ctx && audio.ctx.state === 'suspended') {
        audio.ctx.resume().catch(() => {});
      }
    }
  });

  // --- FPS counter (optional, via ?fps=1) ---
  if (new URLSearchParams(window.location.search).has('fps')) {
    enableFpsCounter();
  }

  function enableFpsCounter() {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:6px;left:6px;z-index:99;color:#0f0;font:12px monospace;background:rgba(0,0,0,0.6);padding:3px 6px;border-radius:4px;pointer-events:none;';
    document.body.appendChild(div);
    let frames = 0;
    let last = performance.now();
    function tick() {
      frames++;
      const now = performance.now();
      if (now - last >= 500) {
        div.textContent = `${Math.round((frames * 1000) / (now - last))} fps`;
        frames = 0;
        last = now;
      }
      requestAnimationFrame(tick);
    }
    tick();
  }
}

// Boot when DOM is ready.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
