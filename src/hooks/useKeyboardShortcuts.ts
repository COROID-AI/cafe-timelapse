import { useEffect } from "react";
import { audioEngine } from "../audio/AudioEngine";
import { useEraStore } from "../state/eraStore";

/**
 * Sound toggling must originate from a real user gesture (handoff
 * finding a3569112). Both the on-screen button and the M-key shortcut
 * route through this helper so unlock() always happens synchronously
 * inside a gesture handler.
 */
export function userToggleSound(): void {
  const state = useEraStore.getState();
  const next = !state.audioEnabled;
  if (next) {
    audioEngine.unlock();
    audioEngine.setEnabled(true, { fromUserGesture: true });
  } else {
    audioEngine.setEnabled(false);
  }
  useEraStore.setState({ audioEnabled: next });
}

/**
 * Global shortcuts:
 *   ← / →   previous / next era
 *   1 … 6   jump straight to a year
 *   M       toggle sound (gesture-safe)
 *   P       play/pause timeline autoplay
 *   R       reset camera to the overview preset
 *
 * Arrow keys are skipped while the range slider owns focus — the native
 * range behaviour already steps it, and double-handling would jump two
 * eras per press.
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        ((target.tagName === "INPUT" &&
          (target as HTMLInputElement).type !== "range") ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing) return;

      const store = useEraStore.getState();

      if (event.key >= "1" && event.key <= "6") {
        store.setEra(Number(event.key) - 1);
        return;
      }

      const rangeHasFocus =
        target instanceof HTMLInputElement && target.type === "range";
      if (!rangeHasFocus) {
        if (event.key === "ArrowLeft") {
          store.prevEra();
          return;
        }
        if (event.key === "ArrowRight") {
          store.nextEra();
          return;
        }
      }

      switch (event.key) {
        case "m":
        case "M":
          userToggleSound();
          break;
        case "p":
        case "P":
          store.togglePlay();
          break;
        case "r":
        case "R":
          store.setViewPreset("default");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
