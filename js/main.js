/**
 * main.js — Application entry point.
 * Wires together SceneManager, CafeShell, PeriodManager, and TimelineUI.
 */

import { SceneManager } from "./scene-manager.js";
import { CafeShell } from "./cafe-shell.js";
import { PeriodManager } from "./period-manager.js";
import { TimelineUI } from "./timeline-ui.js";
import { YEARS, DEFAULT_YEAR_INDEX } from "./config.js";
import { setupPeriod1945, teardownPeriod1945 } from "./period1945.js";
import { setupPeriod2025, teardownPeriod2025 } from "./period2025.js";
import { audioManager } from "./audio-manager.js";

function init() {
  const container = document.getElementById("scene-container");
  if (!container) {
    console.error("Scene container not found.");
    return;
  }

  // ---- Three.js scene + camera + controls + render loop ----
  const sceneManager = new SceneManager(container);

  // ---- Shared café shell (walls, floor, ceiling, windows, door) ----
  // eslint-disable-next-line no-unused-vars
  const cafeShell = new CafeShell(sceneManager.scene);

  // ---- Period system ----
  const periodManager = new PeriodManager(sceneManager.scene, {
    onTransitionStart: (fromYear, toYear) => {
      console.log(`Transitioning from ${fromYear} → ${toYear}`);
      // Crossfade the music layer to the new era's motif.
      audioManager.playMusicForPeriod(toYear);
    },
    onTransitionEnd: (year) => {
      console.log(`Now viewing ${year}`);
    },
  });

  // ---- Timeline UI ----
  const timeline = new TimelineUI((year) => {
    periodManager.transitionTo(year);
  });

  // ---- Hook period overlay updates into the render loop ----
  sceneManager.onUpdate = (_delta, _elapsed) => {
    periodManager.updateOverlay(sceneManager.camera);
  };

  // ---- Activate the default period immediately ----
  const defaultYear = YEARS[DEFAULT_YEAR_INDEX];

  // Register period modules.
  periodManager.registerPeriod(1945, setupPeriod1945, teardownPeriod1945);
  periodManager.registerPeriod(2025, setupPeriod2025, teardownPeriod2025);

  periodManager.activateImmediately(defaultYear);

  // ---- Audio: initialise on first user gesture (autoplay-policy compliant) ----
  // The AudioContext cannot start until the user interacts with the page.
  const startAudio = () => {
    if (audioManager.init()) {
      audioManager.playAmbient();
      audioManager.playMusicForPeriod(defaultYear);
    }
    // Remove the one-shot listeners once audio has started.
    window.removeEventListener("click", startAudio);
    window.removeEventListener("touchstart", startAudio);
    window.removeEventListener("keydown", startAudio);
  };
  window.addEventListener("click", startAudio, { once: false });
  window.addEventListener("touchstart", startAudio, { once: false });
  window.addEventListener("keydown", startAudio, { once: false });

  // ---- Hide loader ----
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.add("loader--hidden");
  }

  // Expose key instances on window for debugging and downstream module access.
  window.__cafe = { sceneManager, cafeShell, periodManager, timeline, defaultYear, audioManager };

  console.log("Café Timelapse initialised. Shell + period system ready.");
  console.log(`Active period: ${defaultYear}`);
}

// Boot once DOM is ready.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Re-export init for module-level testing and external bootstrapping.
export { init };
