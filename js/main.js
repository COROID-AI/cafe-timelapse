/**
 * main.js — Application entry point.
 * Wires together SceneManager, CafeShell, PeriodManager, and TimelineUI.
 */

import { SceneManager } from "./scene-manager.js";
import { CafeShell } from "./cafe-shell.js";
import { PeriodManager } from "./period-manager.js";
import { TimelineUI } from "./timeline-ui.js";
import { YEARS, DEFAULT_YEAR_INDEX } from "./config.js";
import { setupPeriod1965, teardownPeriod1965 } from "./period1965.js";

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

  // Register all available period modules before activation.
  periodManager.registerPeriod(1965, setupPeriod1965, teardownPeriod1965);

  periodManager.activateImmediately(defaultYear);

  // ---- Hide loader ----
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.add("loader--hidden");
  }

  // Expose key instances on window for debugging and downstream module access.
  window.__cafe = { sceneManager, cafeShell, periodManager, timeline };

  console.log("Café Timelapse initialised. Shell + period system ready.");
}

// Boot once DOM is ready.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
