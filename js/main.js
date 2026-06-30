/**
 * main.js — Application entry point.
 * Wires together SceneManager, CafeShell, AudioManager, PeriodManager,
 * and TimelineUI.
 *
 * All modules are loaded as classic (non-module) scripts and expose their
 * classes/functions on the global `window.Cafe` namespace. This avoids
 * ES-module CORS restrictions when the page is opened directly from the
 * filesystem (file:// protocol).
 */

(function () {
  function boot() {
    const {
      SceneManager,
      CafeShell,
      AudioManager,
      PeriodManager,
      TimelineUI,
      YEARS,
      DEFAULT_YEAR_INDEX,
      setupPeriod1945,
      teardownPeriod1945,
      setupPeriod2025,
      teardownPeriod2025,
    } = window.Cafe;

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

      // ---- Audio manager (period-appropriate ambience + crossfade) ----
      const audioManager = new AudioManager();

      // ---- Period system (wired to audio for synchronized transitions) ----
      const periodManager = new PeriodManager(sceneManager.scene, {
        audioManager,
        onTransitionStart: (fromYear, toYear) => {
          console.log(`Transitioning from ${fromYear} → ${toYear}`);
        },
        onTransitionEnd: (year) => {
          console.log(`Now viewing ${year}`);
        },
      });

      // ---- Timeline UI ----
      const timeline = new TimelineUI((year) => {
        // Unlock audio on the first user gesture (browser autoplay policy).
        audioManager.unlock();
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

      // ---- Hide loader ----
      const loader = document.getElementById("loader");
      if (loader) {
        loader.classList.add("loader--hidden");
      }

      // Expose key instances on window for debugging and downstream access.
      window.__cafe = {
        sceneManager,
        cafeShell,
        audioManager,
        periodManager,
        timeline,
        defaultYear,
      };

      console.log("Café Timelapse initialised. Shell + period system ready.");
      console.log(`Active period: ${defaultYear}`);
    }

    // Expose init for external bootstrapping / testing.
    window.Cafe.init = init;

    // Boot once DOM is ready.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  // THREE is loaded asynchronously via an inline module script that
  // dispatches a "three-ready" event once window.THREE is populated.
  // Wait for it before booting the app.
  if (window.THREE) {
    boot();
  } else {
    window.addEventListener("three-ready", boot, { once: true });
  }
})();
