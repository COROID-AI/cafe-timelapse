import { useEffect } from "react";
import Overlays from "./ui/Overlays";
import CafeScene from "./scene/CafeScene";
import { audioEngine } from "./audio/AudioEngine";
import { getAllEraConfigs } from "./eras/eraConfig";
import { PLAY_ADVANCE_MS } from "./utils/timeline";
import { useEraStore } from "./state/eraStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

/**
 * App shell: single Canvas + semantic overlays.
 *
 * Audio lifecycle: the context is only ever unlocked inside user-gesture
 * handlers (Sound button / M key). This component only mirrors state —
 * it switches programs per era and pauses/resumes with tab visibility.
 */
export default function App() {
  const eraIndex = useEraStore((s) => s.eraIndex);
  const playMode = useEraStore((s) => s.playMode);
  useKeyboardShortcuts();

  // Keep the generative program in sync with the selected era.
  useEffect(() => {
    const programId = getAllEraConfigs()[eraIndex].musicProgramId;
    audioEngine.setProgram(programId);
  }, [eraIndex]);

  // Pause audio while the tab is hidden; never autoplay on return.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        audioEngine.suspend();
      } else {
        audioEngine.resume();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      audioEngine.setEnabled(false);
    };
  }, []);

  // Play button auto-advances through all years, looping (AC5).
  useEffect(() => {
    if (!playMode) return undefined;
    const id = setInterval(() => {
      useEraStore.getState().nextEra();
    }, PLAY_ADVANCE_MS);
    return () => clearInterval(id);
  }, [playMode]);

  return (
    <div className="app">
      <div className="canvas-holder">
        <CafeScene />
      </div>
      <Overlays />
    </div>
  );
}
