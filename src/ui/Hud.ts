/**
 * HUD — the small in-scene overlay: active era label, mute toggle, walk-mode
 * toggle and a controls hint.
 *
 * The HUD is DOM-only and updates through `setEra()` / `setMuted()` /
 * `setMode()`. The mute and mode toggles report clicks through callbacks so
 * main.ts can drive the AudioEngine and Navigation rig (and keep the button
 * labels in sync).
 */
import { eraName } from './timelineData';
import type { EraYear } from '../data/eras';
import type { NavigationMode } from '../systems/Navigation';

export interface HudOptions {
  /** Called when the user clicks the mute toggle. */
  onToggleMute?: () => void;
  /** Called when the user clicks the walk-mode toggle. */
  onToggleMode?: () => void;
}

export class Hud {
  readonly root: HTMLDivElement;

  private readonly eraLabel: HTMLParagraphElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly modeButton: HTMLButtonElement;
  private readonly modeLabel: HTMLSpanElement;
  private readonly onToggleMute?: () => void;
  private readonly onToggleMode?: () => void;

  constructor(options: HudOptions = {}) {
    this.onToggleMute = options.onToggleMute;
    this.onToggleMode = options.onToggleMode;

    this.root = document.createElement('div');
    this.root.className = 'hud';
    this.root.setAttribute('aria-label', 'Café controls');

    const eraBlock = document.createElement('div');
    eraBlock.className = 'hud__block';

    const eraCaption = document.createElement('span');
    eraCaption.className = 'hud__caption';
    eraCaption.textContent = 'Active era';
    eraBlock.appendChild(eraCaption);

    this.eraLabel = document.createElement('p');
    this.eraLabel.className = 'hud__era';
    this.eraLabel.textContent = 'Loading…';
    eraBlock.appendChild(this.eraLabel);
    this.root.appendChild(eraBlock);

    const actions = document.createElement('div');
    actions.className = 'hud__actions';

    this.muteButton = document.createElement('button');
    this.muteButton.type = 'button';
    this.muteButton.className = 'hud__button hud__mute';
    this.muteButton.setAttribute('aria-pressed', 'false');
    this.muteButton.textContent = '🔊 Sound on';
    this.muteButton.addEventListener('click', () => {
      this.onToggleMute?.();
    });
    actions.appendChild(this.muteButton);

    this.modeButton = document.createElement('button');
    this.modeButton.type = 'button';
    this.modeButton.className = 'hud__button hud__button--mode';
    this.modeLabel = document.createElement('span');
    this.modeLabel.className = 'hud__mode-label';
    this.modeLabel.textContent = 'Orbit';
    this.modeButton.appendChild(this.modeLabel);
    this.modeButton.appendChild(document.createTextNode(' (F)'));
    this.modeButton.addEventListener('click', () => {
      this.onToggleMode?.();
    });
    actions.appendChild(this.modeButton);

    this.root.appendChild(actions);

    const hint = document.createElement('p');
    hint.className = 'hud__hint';
    hint.textContent =
      'Drag to orbit · right-drag to pan · scroll to zoom · F for walk mode';
    this.root.appendChild(hint);
  }

  /** Update the active era label (era name + year). */
  setEra(era: EraYear | number): void {
    this.eraLabel.textContent = `${era} — ${eraName(era as EraYear)}`;
  }

  /** Reflect the AudioEngine's muted state in the button. */
  setMuted(muted: boolean): void {
    this.muteButton.setAttribute('aria-pressed', String(muted));
    this.muteButton.textContent = muted ? '🔇 Sound off' : '🔊 Sound on';
  }

  /** Reflect the Navigation rig's mode in the toggle. */
  setMode(mode: NavigationMode): void {
    this.modeLabel.textContent = mode === 'orbit' ? 'Walk up close' : 'Orbit';
    this.modeButton.setAttribute('aria-pressed', String(mode === 'walk'));
  }
}
