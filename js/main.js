/**
 * main.js — Entry point for the Café Timelapse application.
 *
 * Wires the UI controls (timeline slider, mute button, volume slider,
 * SFX buttons, captions toggle, hotspot navigation) to the AudioManager,
 * PeriodManager, and SceneRenderer (Three.js).
 *
 * Full keyboard control:
 *   ←/→  — Scrub timeline
 *   H    — Cycle hotspots
 *   Enter — Navigate to focused hotspot
 *   Esc  — Exit hotspot (reset camera)
 *   M    — Mute/unmute
 *   C    — Toggle SFX captions
 *   P    — Toggle stats.js overlay
 *   WASD — Move camera
 *   Q/E  — Move camera up/down
 */

import audioManager from './audio-manager.js';
import periodManager from './period-manager.js';
import { SceneRenderer } from './scene-renderer.js';
import { StatsPanel } from './stats-panel.js';

const YEARS = [1945, 1965, 1985, 2005, 2025];

const ERA_NAMES = {
  1945: '1945 — Post-War Coffee Bar',
  1965: '1965 — Mod Coffeehouse',
  1985: '1985 — Neon Synthwave Café',
  2005: '2005 — Third-Wave Indie Café',
  2025: '2025 — Modern Specialty Café',
};

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------
const startOverlay = document.getElementById('start-overlay');
const yearSlider = document.getElementById('year-slider');
const yearTicks = document.querySelectorAll('.tick');
const muteBtn = document.getElementById('mute-btn');
const captionsBtn = document.getElementById('captions-btn');
const volumeSlider = document.getElementById('volume-slider');
const sfxButtons = document.querySelectorAll('.sfx-btn');
const captionsEl = document.getElementById('captions');
const srAnnouncer = document.getElementById('sr-announcer');
const hotspotList = document.getElementById('hotspot-list');

// ---------------------------------------------------------------------------
// Stats panel + Scene renderer
// ---------------------------------------------------------------------------
const stats = new StatsPanel();
let sceneRenderer = null;

// ---------------------------------------------------------------------------
// Screen reader announcements
// ---------------------------------------------------------------------------
let announceTimeout = null;
function announce(text) {
  srAnnouncer.textContent = text;
  // Clear after a delay so the live region can re-trigger
  if (announceTimeout) clearTimeout(announceTimeout);
  announceTimeout = setTimeout(() => { srAnnouncer.textContent = ''; }, 3000);
}

// ---------------------------------------------------------------------------
// Captions display
// ---------------------------------------------------------------------------
let captionTimeout = null;
function showCaption(text) {
  captionsEl.textContent = text;
  captionsEl.classList.add('visible');
  if (captionTimeout) clearTimeout(captionTimeout);
  captionTimeout = setTimeout(() => {
    captionsEl.classList.remove('visible');
  }, 3000);
}

// Wire the AudioManager caption callback
audioManager.setCaptionCallback((label) => {
  showCaption(`🔊 ${label}`);
});

// ---------------------------------------------------------------------------
// Timeline slider
// ---------------------------------------------------------------------------
function updateTickHighlight(year) {
  yearTicks.forEach((tick) => {
    const tickYear = parseInt(tick.dataset.year, 10);
    const isActive = tickYear === year;
    tick.classList.toggle('active', isActive);
    tick.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function updateSliderAria(year) {
  yearSlider.setAttribute('aria-valuenow', String(year));
  yearSlider.setAttribute('aria-valuetext', ERA_NAMES[year] || String(year));
}

function changeYear(year) {
  periodManager.setYear(year);
  updateTickHighlight(year);
  updateSliderAria(year);
  announce(`Era changed to ${ERA_NAMES[year]}`);
}

yearSlider.addEventListener('input', () => {
  const idx = parseInt(yearSlider.value, 10);
  const year = YEARS[idx];
  changeYear(year);
});

// Clicking a year tick jumps to that year
yearTicks.forEach((tick) => {
  tick.addEventListener('click', () => {
    const year = parseInt(tick.dataset.year, 10);
    const idx = YEARS.indexOf(year);
    yearSlider.value = idx;
    changeYear(year);
  });
});

// ---------------------------------------------------------------------------
// Mute button
// ---------------------------------------------------------------------------
muteBtn.addEventListener('click', () => {
  const muted = audioManager.toggleMute();
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
  announce(muted ? 'Audio muted' : 'Audio unmuted');
});

// ---------------------------------------------------------------------------
// Captions toggle button
// ---------------------------------------------------------------------------
captionsBtn.addEventListener('click', () => {
  const enabled = audioManager.toggleCaptions();
  captionsBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  captionsBtn.style.borderColor = enabled ? '#c8a874' : 'rgba(200, 170, 130, 0.3)';
  announce(enabled ? 'Captions enabled' : 'Captions disabled');
});

// ---------------------------------------------------------------------------
// Volume slider
// ---------------------------------------------------------------------------
volumeSlider.addEventListener('input', () => {
  const vol = parseInt(volumeSlider.value, 10) / 100;
  audioManager.setMasterVolume(vol);
  volumeSlider.setAttribute('aria-valuetext', `${volumeSlider.value} percent`);
});

// ---------------------------------------------------------------------------
// SFX buttons
// ---------------------------------------------------------------------------
sfxButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const sfxName = btn.dataset.sfx;
    audioManager.playSfx(sfxName, { volume: 0.7 });
  });
});

// ---------------------------------------------------------------------------
// Hotspot navigation
// ---------------------------------------------------------------------------
function buildHotspotList() {
  if (!sceneRenderer) return;
  const hotspots = sceneRenderer.getHotspots();
  hotspotList.innerHTML = '';

  hotspots.forEach((hs) => {
    const btn = document.createElement('button');
    btn.className = 'hotspot-btn';
    btn.textContent = hs.label;
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-label', `Navigate to ${hs.label}`);
    btn.addEventListener('click', () => {
      sceneRenderer.navigateToHotspot(hs.id);
      announce(`Viewing: ${hs.label}`);
    });
    hotspotList.appendChild(btn);
  });
}

// ---------------------------------------------------------------------------
// Keyboard controls (global)
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  // Don't intercept if user is typing in an input (except the slider)
  const tag = e.target.tagName;
  if (tag === 'INPUT' && e.target.type === 'range') {
    // Let the slider handle its own arrow keys
    return;
  }

  switch (e.key) {
  case 'ArrowLeft': {
    e.preventDefault();
    const idx = Math.max(0, parseInt(yearSlider.value, 10) - 1);
    yearSlider.value = idx;
    changeYear(YEARS[idx]);
    break;
  }
  case 'ArrowRight': {
    e.preventDefault();
    const idx = Math.min(YEARS.length - 1, parseInt(yearSlider.value, 10) + 1);
    yearSlider.value = idx;
    changeYear(YEARS[idx]);
    break;
  }
  case 'h':
  case 'H': {
    e.preventDefault();
    if (sceneRenderer) {
      sceneRenderer.cycleHotspot(1);
      // Announce the current hotspot
    }
    break;
  }
  case 'Enter': {
    // If a hotspot is focused via Tab, navigate to it
    if (e.target.classList && e.target.classList.contains('hotspot-btn')) {
      return; // Let the button click handler do its thing
    }
    break;
  }
  case 'Escape': {
    e.preventDefault();
    if (sceneRenderer) {
      // Reset camera to default position
      sceneRenderer._cameraState.azimuth = 0;
      sceneRenderer._cameraState.polar = Math.PI / 3;
      sceneRenderer._cameraState.distance = 10;
      sceneRenderer._cameraState.target = { x: 0, y: 1, z: 0 };
      sceneRenderer._focusedHotspot = null;
      if (sceneRenderer._camera) {
        sceneRenderer._camera.fov = 60;
        sceneRenderer._camera.updateProjectionMatrix();
      }
      sceneRenderer._updateCameraFromOrbit();
      announce('Returned to default view');
    }
    break;
  }
  case 'm':
  case 'M': {
    // Mute toggle — handled by AudioManager's own key handler, but we
    // also update the button UI here.
    setTimeout(() => {
      const muted = audioManager.isMuted();
      muteBtn.textContent = muted ? '🔇' : '🔊';
      muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    }, 0);
    break;
  }
  case 'c':
  case 'C': {
    e.preventDefault();
    const enabled = audioManager.toggleCaptions();
    captionsBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    captionsBtn.style.borderColor = enabled ? '#c8a874' : 'rgba(200, 170, 130, 0.3)';
    announce(enabled ? 'Captions enabled' : 'Captions disabled');
    break;
  }
  case 'p':
  case 'P': {
    e.preventDefault();
    const visible = stats.toggle();
    announce(visible ? 'Stats overlay shown' : 'Stats overlay hidden');
    break;
  }
  }
});

// ---------------------------------------------------------------------------
// PeriodManager event wiring
// ---------------------------------------------------------------------------
periodManager.onTransformComplete(({ year }) => {
  announce(`Now viewing ${ERA_NAMES[year]}`);
  // Rebuild hotspot list for the new era
  setTimeout(buildHotspotList, 100);
});

// ---------------------------------------------------------------------------
// Start overlay — must be dismissed by a user gesture for audio to work
// ---------------------------------------------------------------------------
startOverlay.addEventListener('click', async () => {
  startOverlay.classList.add('hidden');

  // Initialise the 3D scene renderer
  sceneRenderer = new SceneRenderer({ stats });
  await sceneRenderer.init();

  // Wire the SceneRenderer as the PeriodManager's adapter
  periodManager.setAdapter(sceneRenderer);

  // Initialise audio (requires user gesture for autoplay policy)
  await audioManager.init();

  // Lazy-load the initial era's audio
  await audioManager.lazyLoadEraAudio(1945);

  // Preload shared SFX (small files)
  try {
    await audioManager._loadBuffer('assets/audio/sfx/murmur.wav');
    await audioManager._loadBuffer('assets/audio/sfx/espresso-hiss.wav');
    await audioManager._loadBuffer('assets/audio/sfx/cup-clatter.wav');
  } catch (err) {
    console.warn('[Main] SFX preload warning:', err.message);
  }

  // Start ambient loops
  await audioManager.startAmbient('murmur', 0.35);
  await audioManager.startAmbient('espresso-hiss', 0.2);
  await audioManager.startAmbient('cup-clatter', 0.25);

  // Play the initial era's music (1945 by default)
  await audioManager.playMusicForYear(periodManager.getYear(), 3.0);

  // Load the initial era's 3D content
  await periodManager.setYear(1945);

  // Build the hotspot list for the initial era
  buildHotspotList();

  // Make the viewport focusable for keyboard interaction
  const viewport = document.getElementById('viewport');
  viewport.setAttribute('tabindex', '0');

  console.log('[Main] Café Timelapse ready.');
  console.log('[Main] Controls: ←/→ timeline, H hotspots, Enter go, Esc exit, M mute, C captions, P stats, WASD move');
});

// ---------------------------------------------------------------------------
// Expose singletons globally for debugging
// ---------------------------------------------------------------------------
window.__cafe = { audioManager, periodManager, sceneRenderer: () => sceneRenderer, stats };

console.log('[Main] Café Timelapse loaded. Click "Enter Café" to start.');
