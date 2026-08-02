import { ERA_MAP } from '../data/eras';
import { useStore } from '../store/useStore';
import type { Era } from '../types';

function EraPanel() {
  const era = useStore((s) => s.era);
  const transition = useStore((s) => s.transition);
  const eraId = transition.phase === 'fading' ? transition.toEra : era;
  const e: Era = ERA_MAP[eraId];

  return (
    <section className="panel era-panel" aria-label="Era details">
      <header className="era-panel__head">
        <h2 className="era-panel__year">{e.label}</h2>
        <p className="era-panel__tagline">{e.tagline}</p>
      </header>

      <div className="era-panel__row">
        <span className="era-panel__kicker">Menu</span>
        <span className="era-panel__value">{e.menu.title}</span>
      </div>
      <ul className="era-panel__menu">
        {e.menu.items.map((it) => (
          <li key={it.item}>
            <span>{it.item}</span>
            <span className="era-panel__price">{it.price}</span>
          </li>
        ))}
      </ul>

      <div className="era-panel__row">
        <span className="era-panel__kicker">Music</span>
        <span className="era-panel__value">{e.music.device}</span>
      </div>
      <p className="era-panel__note">
        {e.music.genre} · {e.music.tempo} BPM — {e.music.note}
      </p>

      <div className="era-panel__row">
        <span className="era-panel__kicker">Seating</span>
        <span className="era-panel__value">{e.furniture.chairStyle}</span>
      </div>
    </section>
  );
}

export function CameraControls() {
  const requestCameraPreset = useStore((s) => s.requestCameraPreset);
  const resetCamera = useStore((s) => s.resetCamera);
  const cameraPreset = useStore((s) => s.cameraPreset);
  const cameraAnimState = useStore((s) => s.cameraAnimState);

  const presetBtn = (key: 'overview' | 'counter' | 'table', label: string) => {
    const active = cameraAnimState === 'done' && cameraPreset === key;
    return (
      <button
        type="button"
        className={`hud-btn${active ? ' is-active' : ''}`}
        onClick={() => requestCameraPreset(key)}
      >
        {label}
      </button>
    );
  };

  return (
    <section className="panel camera-panel" aria-label="Camera presets">
      <div className="camera-panel__label">View</div>
      <div className="camera-panel__buttons">
        {presetBtn('overview', 'Overview')}
        {presetBtn('counter', 'Counter')}
        {presetBtn('table', 'Table')}
        <button type="button" className="hud-btn" onClick={resetCamera} title="Reset view">
          Reset
        </button>
      </div>
      <p className="camera-panel__hint">
        Drag to orbit · scroll to zoom · right-drag to pan
      </p>
    </section>
  );
}

export function AudioControls() {
  const audioEnabled = useStore((s) => s.audioEnabled);
  const toggleAudio = useStore((s) => s.toggleAudio);
  const audioStarted = useStore((s) => s.audioStarted);
  const paused = useStore((s) => s.paused);
  const setPaused = useStore((s) => s.setPaused);

  return (
    <section className="audio-controls" aria-label="Audio and playback controls">
      <button
        type="button"
        className={`hud-btn${audioEnabled ? ' is-active' : ''}`}
        onClick={toggleAudio}
        title={audioEnabled ? 'Mute ambient audio' : 'Enable ambient audio'}
        aria-pressed={audioEnabled}
      >
        {audioEnabled ? '🔊 Sound on' : '🔇 Sound off'}
      </button>
      <button
        type="button"
        className={`hud-btn${paused ? ' is-active' : ''}`}
        onClick={() => setPaused(!paused)}
        title={paused ? 'Resume timelapse' : 'Pause timelapse'}
        aria-pressed={paused}
      >
        {paused ? '▶ Resume' : '⏸ Pause'}
      </button>
      {audioEnabled && !audioStarted && (
        <span className="audio-controls__hint">Tap sound, then interact to hear the café</span>
      )}
    </section>
  );
}

export function Hud() {
  return (
    <>
      <EraPanel />
      <CameraControls />
      <AudioControls />
    </>
  );
}
