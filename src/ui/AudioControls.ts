/**
 * AudioControls.ts — minimal UI overlay for the Web Audio engine.
 *
 * Provides two things:
 *   1. A **mute toggle** button (the acceptance-criteria UI control) that
 *      flips the shared {@link AudioEngine}'s mute state and reflects it via
 *      an icon + aria-pressed.
 *   2. An **autoplay-policy unlock** layer: because browsers block audio
 *      until a user gesture, the button is also the gesture surface. The first
 *      click/tap unlocks the engine (which boots the AudioContext) *and*
 *      toggles mute thereafter.
 *
 * The control is framework-free (plain DOM) to match the project's current
 * zero-dependency UI approach. All styles are scoped to the created elements so
 * no external stylesheet is required.
 */
import { getAudioEngine } from '../systems/AudioEngine.js';

/** Icon glyphs for the mute button (plain text, no asset shipping). */
const ICON_ON = '🔊';
const ICON_OFF = '🔇';

/** Visible label next to the icon. */
const LABEL_ON = 'Sound on';
const LABEL_OFF = 'Muted';

/** CSS scoped to the audio controls overlay. */
const STYLES = `
.audio-controls {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
}
.audio-controls__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(20, 24, 32, 0.72);
  color: #f0f0f0;
  font: 600 13px/1 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: background 0.15s ease, border-color 0.15s ease;
  user-select: none;
}
.audio-controls__btn:hover {
  background: rgba(40, 46, 58, 0.85);
  border-color: rgba(255, 255, 255, 0.35);
}
.audio-controls__btn:focus-visible {
  outline: 2px solid #6cb6ff;
  outline-offset: 2px;
}
.audio-controls__icon {
  font-size: 16px;
  line-height: 1;
}
`;

/**
 * Mount the audio controls overlay into the document. Creates the mute button,
 * injects scoped styles, and wires it to the shared {@link AudioEngine}.
 *
 * The first click unlocks the engine (autoplay policy) — no audio plays until
 * then. Subsequent clicks toggle the mute state.
 *
 * @returns the container element (also appended to `document.body`).
 */
export function mountAudioControls(): HTMLDivElement {
  const engine = getAudioEngine();

  // --- Styles (injected once) ----------------------------------------------
  if (!document.getElementById('audio-controls-style')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'audio-controls-style';
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
  }

  // --- Container + button ---------------------------------------------------
  const container = document.createElement('div');
  container.className = 'audio-controls';

  const button = document.createElement('button');
  button.className = 'audio-controls__btn';
  button.type = 'button';
  button.setAttribute('aria-label', 'Toggle sound');

  const icon = document.createElement('span');
  icon.className = 'audio-controls__icon';
  const label = document.createElement('span');
  label.className = 'audio-controls__label';

  const sync = (): void => {
    const muted = engine.isMuted;
    icon.textContent = muted ? ICON_OFF : ICON_ON;
    label.textContent = muted ? LABEL_OFF : LABEL_ON;
    button.setAttribute('aria-pressed', String(muted));
  };

  button.append(icon, label);
  sync();
  container.appendChild(button);

  // --- Interaction ----------------------------------------------------------
  button.addEventListener('click', () => {
    if (!engine.isUnlocked) {
      // First user gesture → unlock the AudioContext, then sync label.
      engine.unlock();
      sync();
      return;
    }
    engine.toggleMute();
    sync();
  });

  document.body.appendChild(container);
  return container;
}
