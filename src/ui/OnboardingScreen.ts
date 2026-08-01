/**
 * OnboardingScreen — the loading / 'click to enter' gate before the scene.
 *
 * The app boots with a full-screen overlay:
 *   1. "Loading café…" while the era registry (async) is being prepared;
 *   2. "Click to enter" once assets are ready — the click both dismisses the
 *      overlay and unlocks Web Audio (a user gesture, per the browser
 *      autoplay policy).
 *
 * The component is DOM-only: it renders into a container element the host
 * provides and reports the enter click through an optional callback. It
 * exposes `showReady()` / `hide()` so main.ts can drive the two states.
 */
export interface OnboardingScreenOptions {
  /** Container the overlay is rendered into (appended as a child). */
  container: HTMLElement;
  /** Called when the user clicks the enter button (audio unlock hook). */
  onEnter?: () => void;
}

export class OnboardingScreen {
  readonly root: HTMLDivElement;

  private readonly overlay: HTMLDivElement;
  private readonly status: HTMLParagraphElement;
  private readonly enterButton: HTMLButtonElement;
  private readonly onEnter?: () => void;
  private entered = false;

  constructor(options: OnboardingScreenOptions) {
    this.onEnter = options.onEnter;

    this.root = document.createElement('div');
    this.root.className = 'onboarding';

    this.overlay = document.createElement('div');
    this.overlay.className = 'onboarding__overlay';
    this.overlay.setAttribute('aria-live', 'polite');

    const title = document.createElement('h2');
    title.className = 'onboarding__title';
    title.textContent = 'Café Time Period Timelapse';
    this.overlay.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'onboarding__subtitle';
    subtitle.textContent = 'Step through six decades of one café — 1945 to 2055.';
    this.overlay.appendChild(subtitle);

    this.status = document.createElement('p');
    this.status.className = 'onboarding__status';
    this.status.textContent = 'Loading café…';
    this.overlay.appendChild(this.status);

    this.enterButton = document.createElement('button');
    this.enterButton.type = 'button';
    this.enterButton.className = 'onboarding__enter';
    this.enterButton.textContent = 'Click to enter';
    this.enterButton.hidden = true;
    this.enterButton.addEventListener('click', () => {
      if (this.entered) return;
      this.entered = true;
      this.onEnter?.();
      this.hide();
    });
    this.overlay.appendChild(this.enterButton);

    this.root.appendChild(this.overlay);
    options.container.appendChild(this.root);
  }

  /** Show the ready state (assets preloaded) and reveal the enter button. */
  showReady(): void {
    this.status.textContent = 'Ready';
    this.enterButton.hidden = false;
    this.enterButton.focus();
  }

  /** Dismiss the overlay (after the enter click). */
  hide(): void {
    this.root.classList.add('is-hidden');
    this.root.hidden = true;
    // Release the overlay's pointer-events so the scene is interactive.
    this.root.style.pointerEvents = 'none';
  }
}
