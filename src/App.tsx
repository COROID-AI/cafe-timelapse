import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SceneCanvas } from './components/SceneCanvas';
import { AudioToggle } from './components/hud/AudioToggle';
import { ControlsHint } from './components/hud/ControlsHint';
import { EraInfo } from './components/hud/EraInfo';
import { LoadingScreen } from './components/hud/LoadingScreen';
import { Timeline } from './components/hud/Timeline';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useEraStore } from './store/useEraStore';
import { ERAS } from './data/eras';

/** Detect WebGL availability once (used by the interface-level fallback). */
function detectWebglSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * Café Time Period Timelapse — top-level application.
 * Wires the timeline, era store, audio engine, navigation shortcuts and the
 * WebGL scene together, and surfaces loading/error states in the interface.
 */
export default function App() {
  useReducedMotion();
  const { muted, toggleMute, unlock, playForEra, startAmbience } = useAudioEngine();
  const targetEra = useEraStore((s) => s.targetEra);
  const [sceneReady, setSceneReady] = useState(false);
  const [webglFailed] = useState<boolean>(() => !detectWebglSupport());
  const [walkMode, setWalkMode] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  // Unlock audio on the first user gesture anywhere in the app.
  useEffect(() => {
    const unlockOnce = () => {
      unlock();
      startAmbience();
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
    window.addEventListener('pointerdown', unlockOnce);
    window.addEventListener('keydown', unlockOnce);
    return () => {
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
  }, [unlock, startAmbience]);

  // Play the era's generative music when the target era changes (post-gesture).
  useEffect(() => {
    playForEra(ERAS[targetEra]);
  }, [targetEra, playForEra]);

  // Keyboard shortcuts: 1-6 eras, M mute, R reset view, W walk mode.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const eraIdx = ['1', '2', '3', '4', '5', '6'].indexOf(e.key);
      if (eraIdx >= 0) {
        const ids = ['1945', '1965', '1985', '2005', '2025', '2055'] as const;
        useEraStore.getState().setEra(ids[eraIdx]);
        return;
      }
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'r' || e.key === 'R') {
        setResetSignal((v) => v + 1);
      } else if (e.key === 'w' || e.key === 'W') {
        setWalkMode((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleMute]);

  const handleReset = useCallback(() => {
    window.location.reload();
  }, []);

  const sceneUnavailable = webglFailed;

  return (
    <ErrorBoundary onReset={handleReset}>
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">Café Time Period Timelapse</h1>
          <Timeline />
        </header>

        <main className="app-main">
          {sceneUnavailable ? (
            <div className="webgl-fallback" role="alert">
              <h2>WebGL unavailable</h2>
              <p>Your browser or device does not support hardware-accelerated 3D graphics, which this scene requires.</p>
              <button type="button" className="btn btn-primary" onClick={handleReset}>
                Try again
              </button>
            </div>
          ) : (
            <SceneCanvas onReady={() => setSceneReady(true)} walkMode={walkMode} resetSignal={resetSignal} />
          )}
        </main>

        <EraInfo />

        <div className="hud-controls">
          <AudioToggle muted={muted} onToggle={toggleMute} />
          <button
            type="button"
            className="btn"
            aria-pressed={walkMode}
            onClick={() => setWalkMode((v) => !v)}
          >
            {walkMode ? '🚶 Walk: ON' : '🚶 Walk: OFF'}
          </button>
          <button type="button" className="btn" onClick={() => setResetSignal((v) => v + 1)}>
            ⟲ Reset view (R)
          </button>
        </div>

        <ControlsHint />

        {!sceneReady && !sceneUnavailable ? <LoadingScreen visible /> : null}
      </div>
    </ErrorBoundary>
  );
}
