/**
 * FpsCounter — a small on-screen frames-per-second readout (dev toggle).
 *
 * The counter samples the render loop's frame timestamps and displays a
 * smoothed FPS value in a fixed HUD chip (top-right). It is a dev tool:
 * `enabled` is driven by a URL flag (`?fps=1`), a global console toggle
 * (`window.__toggleFps()`), or a keyboard shortcut (`KeyP`) while the
 * counter is active. When disabled it removes the DOM node and stops
 * accumulating samples.
 *
 * The counter is DOM-only and safe to construct headlessly (QA gates can
 * assert the chip and toggle behaviour without a browser).
 */
export class FpsCounter {
  readonly root: HTMLDivElement;

  private readonly valueLabel: HTMLSpanElement;
  private readonly samples: number[] = [];
  private enabled: boolean;
  private lastFrameTime = 0;
  private accumulatedSamples = 0;
  private lastSecond = 0;
  private hidden = false;

  constructor(options: { enabled?: boolean } = {}) {
    this.enabled = options.enabled ?? false;

    this.root = document.createElement('div');
    this.root.className = 'fps-counter';
    this.root.setAttribute('aria-label', 'Frames per second');
    this.root.hidden = !this.enabled;

    const caption = document.createElement('span');
    caption.className = 'fps-counter__caption';
    caption.textContent = 'FPS';
    this.root.appendChild(caption);

    this.valueLabel = document.createElement('span');
    this.valueLabel.className = 'fps-counter__value';
    this.valueLabel.textContent = '—';
    this.root.appendChild(this.valueLabel);
  }

  /** True while the counter is collecting samples. */
  get isEnabled(): boolean {
    return this.enabled;
  }

  /** Toggle the counter on/off (also toggles the DOM node visibility). */
  toggle(): void {
    this.enabled = !this.enabled;
    this.root.hidden = !this.enabled;
    if (!this.enabled) {
      this.samples.length = 0;
      this.accumulatedSamples = 0;
      this.valueLabel.textContent = '—';
    }
  }

  /** Hide/show the chip without stopping sample collection. */
  setVisible(visible: boolean): void {
    this.hidden = !visible;
    this.root.style.display = this.hidden ? 'none' : '';
  }

  /**
   * Feed one render-loop frame timestamp. Returns the smoothed FPS when the
   * counter is enabled (0 while disabled). Call once per frame.
   */
  update(now: number): number {
    if (!this.enabled) return 0;

    if (this.lastFrameTime > 0) {
      const dt = (now - this.lastFrameTime) / 1000;
      if (dt > 0 && dt < 1) {
        this.accumulatedSamples += 1;
        const second = Math.floor(now / 1000);
        if (second !== this.lastSecond) {
          if (this.lastSecond > 0) {
            this.samples.push(this.accumulatedSamples);
            if (this.samples.length > 30) this.samples.shift();
          }
          this.lastSecond = second;
          this.accumulatedSamples = 0;
        }
      }
    }
    this.lastFrameTime = now;

    if (this.samples.length > 0) {
      const sum = this.samples.reduce((total, value) => total + value, 0);
      const fps = sum / this.samples.length;
      this.valueLabel.textContent = `${Math.round(fps)}`;
      return fps;
    }
    return 0;
  }
}

/**
 * True when the FPS counter should start enabled. Reads the `fps` URL query
 * flag (headless-safe: no window access when running in Node).
 */
export function fpsFlagEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('fps') === '1';
}
