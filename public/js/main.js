/**
 * main.js — Entry point for the Café Timelapse application.
 *
 * Wires the UI controls (timeline slider, mute button, volume slider,
 * SFX buttons) to the AudioManager and PeriodManager singletons.
 */

import audioManager from './audio-manager.js';
import periodManager from './period-manager.js';
import { Inspector } from './inspector.js';

const YEARS = [1945, 1965, 1985, 2005, 2025];

// ---------------------------------------------------------------------------
// Start overlay — must be dismissed by a user gesture for audio to work
// ---------------------------------------------------------------------------
const startOverlay = document.getElementById('start-overlay');

startOverlay.addEventListener('click', async () => {
  startOverlay.classList.add('hidden');

  // Initialise audio (requires user gesture for autoplay policy).
  await audioManager.init();
  await audioManager.preloadAll();

  // Start ambient loops.
  await audioManager.startAmbient('murmur', 0.35);
  await audioManager.startAmbient('espresso-hiss', 0.2);
  await audioManager.startAmbient('cup-clatter', 0.25);

  // Play the initial era's music (1945 by default).
  await audioManager.playMusicForYear(periodManager.getYear(), 3.0);

  console.log('[Main] Audio system ready. Press M to toggle mute.');
});

// ---------------------------------------------------------------------------
// Timeline slider
// ---------------------------------------------------------------------------
const yearSlider = document.getElementById('year-slider');
const yearTicks = document.querySelectorAll('.tick');

function updateTickHighlight(year) {
  yearTicks.forEach((tick) => {
    const tickYear = parseInt(tick.dataset.year, 10);
    tick.classList.toggle('active', tickYear === year);
  });
}

yearSlider.addEventListener('input', () => {
  const idx = parseInt(yearSlider.value, 10);
  const year = YEARS[idx];
  periodManager.setYear(year);
  updateTickHighlight(year);
});

// Clicking a year tick jumps to that year.
yearTicks.forEach((tick) => {
  tick.addEventListener('click', () => {
    const year = parseInt(tick.dataset.year, 10);
    const idx = YEARS.indexOf(year);
    yearSlider.value = idx;
    periodManager.setYear(year);
    updateTickHighlight(year);
  });
});

// ---------------------------------------------------------------------------
// Mute button
// ---------------------------------------------------------------------------
const muteBtn = document.getElementById('mute-btn');

muteBtn.addEventListener('click', () => {
  const muted = audioManager.toggleMute();
  muteBtn.textContent = muted ? '🔇' : '🔊';
});

// ---------------------------------------------------------------------------
// Volume slider
// ---------------------------------------------------------------------------
const volumeSlider = document.getElementById('volume-slider');

volumeSlider.addEventListener('input', () => {
  const vol = parseInt(volumeSlider.value, 10) / 100;
  audioManager.setMasterVolume(vol);
});

// ---------------------------------------------------------------------------
// SFX buttons
// ---------------------------------------------------------------------------
const sfxButtons = document.querySelectorAll('.sfx-btn');

sfxButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const sfxName = btn.dataset.sfx;
    audioManager.playSfx(sfxName, { volume: 0.7 });
  });
});

// ---------------------------------------------------------------------------
// Inspector — close-inspection mode + era-comparison HUD
// ---------------------------------------------------------------------------
const viewport = document.getElementById('viewport');
const inspector = new Inspector({ viewport, periodManager });
inspector.init();

// ---------------------------------------------------------------------------
// Expose singletons globally for debugging
// ---------------------------------------------------------------------------
window.__cafe = { audioManager, periodManager, inspector };

console.log('[Main] Café Timelapse loaded. Click "Enter Café" to start.');
