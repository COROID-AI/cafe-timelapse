import './timeline-slider.css';

import { ERA_YEARS } from '../cafe/eras';
import type { EraYear } from '../cafe/eras';
import type { EraTransitionProgressEvent } from '../cafe/EraTransitionController';

/**
 * TimelineSlider — polished top-of-screen control bar for the café timelapse.
 *
 * Renders exactly five labeled stops (1945 · 1965 · 1985 · 2005 · 2025) as
 * clickable year chips on a horizontal track above the WebGL canvas. It is a
 * pure DOM/CSS overlay: no framework, no canvas involvement, and it never
 * touches the scene graph directly. Instead it emits a typed
 * {@link TimelineSlider.onSelectYear} event that `main.ts` routes into
 * `EraTransitionController.transitionTo` (which commits `CafeScene.applyEra`
 * at the halfway point of the morph).
 *
 * ## Interaction model (ARIA slider pattern)
 *
 * The whole track behaves like ONE slider widget:
 *
 * - The track carries `role="slider"` with `aria-valuemin/-max/-now` expressed
 *   in actual years (`aria-valuenow` mirrors the selected year) plus a
 *   human-readable `aria-valuetext` ("1985 · Neon eighties").
 * - Pointer: clicking any chip selects it; clicking the bare rail selects the
 *   nearest stop.
 * - Keyboard: ←/→ and ↑/↓ step between neighbouring stops, Home/End jump to
 *   the first/last stop. The focused track receives these keys, so chips stay
 *   non-tabbable (`tabindex="-1"` + `aria-hidden`) and never double-announce.
 *
 * ## Transition shimmer
 *
 * Pass an {@link EraTransitionController}-shaped source via the `transitions`
 * option (or call {@link TimelineSlider.applyTransitionProgress} manually).
 * Progress ticks drive a soft glow that sweeps along the rail from the
 * departure year towards the destination year, plus a faint sheen across the
 * chrome — subtle enough for presentation, cheap enough for every frame
 * (two style writes, zero allocations).
 *
 * ## Responsive contract
 *
 * The bar reflows below 720px (brand stacks above a full-width track) and
 * stays fully usable at ~360px viewports: chips compress, the wordmark
 * collapses to its mark, and nothing overlaps the bottom-left navigation HUD.
 *
 * @example
 * ```ts
 * const slider = new TimelineSlider({ initialYear: 2025, transitions });
 * slider.onSelectYear((year) => transitions.transitionTo(year));
 * ```
 */

/** Exact chronological stops rendered by the timeline — no other years. */
export const TIMELINE_STOPS: readonly [EraYear, EraYear, EraYear, EraYear, EraYear] =
  ERA_YEARS;

/** Short period flavour used for tooltips and `aria-valuetext`. */
const STOP_DESCRIPTIONS: Readonly<Record<EraYear, string>> = {
  1945: 'Post-war austerity',
  1965: 'Mid-century diner',
  1985: 'Neon eighties',
  2005: 'Espresso-bar noughties',
  2025: 'Speciality third wave',
};

/** Structural slice of {@link EraTransitionController} the slider consumes. */
export interface TransitionProgressSource {
  /** Per-frame progress ticks; returns an unsubscribe function. */
  onProgress(listener: (event: EraTransitionProgressEvent) => void): () => void;
  /** Fired once when a morph reaches progress 1; returns unsubscribe. */
  onComplete(listener: (event: EraTransitionProgressEvent) => void): () => void;
}

export interface TimelineSliderOptions {
  /** Element the control bar mounts into. Defaults to `document.body`. */
  mount?: HTMLElement;
  /** Year highlighted on construction (should match the scene's applied era). */
  initialYear?: EraYear;
  /**
   * Morph controller whose progress events drive the shimmer. Optional —
   * omit it and drive {@link TimelineSlider.applyTransitionProgress} yourself.
   */
  transitions?: TransitionProgressSource;
}

type SelectYearListener = (year: EraYear) => void;

/* ------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* ------------------------------------------------------------------------- */

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Index of the stop nearest to `year` (unknown years snap to an end stop). */
function nearestStopIndex(year: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < TIMELINE_STOPS.length; i++) {
    const distance = Math.abs(TIMELINE_STOPS[i] - year);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}

function createBrandElement(): HTMLDivElement {
  const brand = document.createElement('div');
  brand.className = 'tl-brand';

  // Inline wordmark glyph — decorative only, the text names carry meaning.
  brand.innerHTML =
    '<svg class="tl-brand__mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M3.5 9h12v5.5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9z"/>' +
    '<path d="M15.5 10.2h1.6a2.4 2.4 0 0 1 0 4.8h-1.6"/>' +
    '<path d="M7 3.5c0 1.2-1 1.2-1 2.4M10.5 3.5c0 1.2-1 1.2-1 2.4M14 3.5c0 1.2-1 1.2-1 2.4"/>' +
    '</svg>' +
    '<span class="tl-brand__text">' +
    '<span class="tl-brand__name">Café Timelapse</span>' +
    '<span class="tl-brand__sub">Time Period Timelapse</span>' +
    '</span>';
  return brand;
}

/* ------------------------------------------------------------------------- */
/* TimelineSlider                                                            */
/* ------------------------------------------------------------------------- */

export class TimelineSlider {
  /** Selected stop index (0..4). Kept in lockstep with the DOM. */
  private _selectedIndex = 0;

  private readonly root: HTMLElement;
  private readonly sliderEl: HTMLElement;
  private readonly glideEl: HTMLElement;
  private readonly glideFillEl: HTMLElement;
  private readonly chipEls: HTMLButtonElement[] = [];

  private readonly selectListeners: SelectYearListener[] = [];
  private readonly listenerSignal = new AbortController();
  private readonly unsubscribes: (() => void)[] = [];

  private disposed = false;

  constructor(options: TimelineSliderOptions = {}) {
    const initialIndex = nearestStopIndex(options.initialYear ?? TIMELINE_STOPS[TIMELINE_STOPS.length - 1]);

    /* ----- Chrome ------------------------------------------------------- */

    this.root = document.createElement('header');
    this.root.className = 'tl-bar';
    this.root.setAttribute('role', 'group');
    this.root.setAttribute('aria-label', 'Café time period controls');

    this.root.appendChild(createBrandElement());

    /* ----- Slider track -------------------------------------------------- */

    // role=slider owns all keyboard interaction; chips inside are decorative
    // click targets (tabindex=-1 + aria-hidden keeps the AT tree flat).
    this.sliderEl = document.createElement('div');
    this.sliderEl.className = 'tl-slider';
    this.sliderEl.setAttribute('role', 'slider');
    this.sliderEl.tabIndex = 0;
    this.sliderEl.setAttribute('aria-label', 'Timeline year');
    this.sliderEl.setAttribute('aria-orientation', 'horizontal');
    this.sliderEl.setAttribute('aria-valuemin', String(TIMELINE_STOPS[0]));
    this.sliderEl.setAttribute('aria-valuemax', String(TIMELINE_STOPS[TIMELINE_STOPS.length - 1]));

    // Rail: static track line + travelled fill (pure decoration).
    const rail = document.createElement('div');
    rail.className = 'tl-rail';
    rail.setAttribute('aria-hidden', 'true');
    const railFill = document.createElement('div');
    railFill.className = 'tl-rail__fill';
    rail.appendChild(railFill);

    // Stops: one clickable chip per year, evenly spaced by percentage.
    const stops = document.createElement('ol');
    stops.className = 'tl-stops';
    stops.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < TIMELINE_STOPS.length; i++) {
      const year = TIMELINE_STOPS[i];
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'tl-chip';
      chip.dataset.year = String(year);
      chip.dataset.stopIndex = String(i);
      chip.tabIndex = -1; // keyboard flows through the role=slider track
      chip.title = `Travel to ${year} · ${STOP_DESCRIPTIONS[year]}`;
      chip.style.left = `${(i / (TIMELINE_STOPS.length - 1)) * 100}%`;
      chip.innerHTML =
        '<span class="tl-chip__dot"></span>' +
        `<span class="tl-chip__year">${year}</span>`;
      chip.addEventListener('click', () => this.selectIndex(i), { signal: this.listenerSignal.signal });
      stops.appendChild(chip as unknown as Node);
      this.chipEls.push(chip);
    }

    // Transition shimmer sweeping between the departure/target stops.
    this.glideEl = document.createElement('div');
    this.glideEl.className = 'tl-glide';
    this.glideEl.setAttribute('aria-hidden', 'true');
    this.glideFillEl = document.createElement('div');
    this.glideFillEl.className = 'tl-glide__fill';
    this.glideEl.appendChild(this.glideFillEl);

    this.sliderEl.append(rail, stops, this.glideEl);
    this.root.appendChild(this.sliderEl);

    /* ----- Events --------------------------------------------------------- */

    this.sliderEl.addEventListener('keydown', (event) => this.onKeyDown(event), {
      signal: this.listenerSignal.signal,
    });

    // Clicking bare rail picks the nearest stop (chip clicks stop propagation
    // implicitly by matching data-year first).
    this.sliderEl.addEventListener(
      'pointerdown',
      (event) => {
        if (!(event.target instanceof Element) || event.target.closest('.tl-chip')) return;
        const index = this.indexFromPointer(event.clientX);
        if (index !== null) this.selectIndex(index);
      },
      { signal: this.listenerSignal.signal },
    );

    /* ----- Mount + state ---------------------------------------------- */

    const mount = options.mount ?? document.body;
    mount.appendChild(this.root);

    this._selectedIndex = initialIndex;
    this.syncSelection();

    if (options.transitions) this.observeTransitions(options.transitions);
  }

  /* ----- Public surface --------------------------------------------------- */

  /** Year whose chip is currently highlighted. */
  get selectedYear(): EraYear {
    return TIMELINE_STOPS[this.selectedIndex];
  }

  /** Zero-based index of the selected stop within {@link TIMELINE_STOPS}. */
  get selectedIndex(): number {
    return this.selectedIndexSafe();
  }

  /** Root control-bar element (handy for visual regression snapshots). */
  getRootElement(): HTMLElement {
    return this.root;
  }

  /**
   * Subscribes to typed year selections. Returns an unsubscribe function.
   * Fires on every explicit selection — including re-clicking the active
   * year — so consumers can decide how to dedupe.
   */
  onSelectYear(listener: SelectYearListener): () => void {
    this.selectListeners.push(listener);
    return () => {
      const index = this.selectListeners.indexOf(listener);
      if (index !== -1) this.selectListeners.splice(index, 1);
    };
  }

  /**
   * Highlights `year` (snapped to its stop) and optionally emits
   * {@link TimelineSlider.onSelectYear}. Used internally by pointer/keyboard
   * input; exposed so hosts can mirror external state changes.
   */
  setSelectedYear(year: EraYear, emit = false): void {
    this.selectIndex(nearestStopIndex(year), emit);
  }

  /**
   * Feeds one morph-progress tick into the shimmer. Accepts the reused event
   * object emitted by {@link EraTransitionController} — fields are read
   * synchronously, never retained.
   */
  applyTransitionProgress(event: EraTransitionProgressEvent): void {
    if (this.disposed) return;

    const fromIndex = nearestStopIndex(event.fromYear);
    const toIndex = nearestStopIndex(event.toYear);
    const progress = clamp(Number.isFinite(event.progress) ? event.progress : 0, 0, 1);

    const percentOf = (index: number): number =>
      (index / (TIMELINE_STOPS.length - 1)) * 100;
    const left = percentOf(Math.min(fromIndex, toIndex));
    const right = percentOf(Math.max(fromIndex, toIndex));

    this.root.classList.add('is-transitioning');
    this.glideEl.style.left = `${left}%`;
    this.glideEl.style.width = `${Math.max(right - left, 0.5)}%`;

    // Fill grows from the departure end towards the destination…
    const forward = toIndex >= fromIndex;
    this.glideFillEl.style.transformOrigin = forward ? 'left center' : 'right center';
    this.glideFillEl.style.transform = `scaleX(${progress})`;

    // …while the whole glow eases in at the start and dissolves at the end.
    this.glideEl.style.opacity = String(clamp(Math.min(progress * 6, (1 - progress) * 6), 0, 1));
  }

  /** Clears the shimmer once a morph completes (wired to `onComplete`). */
  clearTransitionProgress(): void {
    if (this.disposed) return;
    this.root.classList.remove('is-transitioning');
    this.glideEl.style.opacity = '0';
  }

  /**
   * Subscribes the shimmer to an {@link EraTransitionController}-shaped
   * source. Calling it twice replaces the previous subscription.
   */
  observeTransitions(source: TransitionProgressSource): void {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    this.unsubscribes.length = 0;
    this.unsubscribes.push(
      source.onProgress((event) => this.applyTransitionProgress(event)),
      source.onComplete(() => this.clearTransitionProgress()),
    );
  }

  /** Removes the bar, every listener and every controller subscription. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    this.unsubscribes.length = 0;
    this.listenerSignal.abort();
    this.selectListeners.length = 0;
    this.root.remove();
  }

  /* ----- Internals ---------------------------------------------------------- */

  private selectedIndexSafe(): number {
    return clamp(this._selectedIndex, 0, TIMELINE_STOPS.length - 1);
  }

  private selectIndex(index: number, emit = true): void {
    this._selectedIndex = clamp(Math.round(index), 0, TIMELINE_STOPS.length - 1);
    this.syncSelection();
    if (!emit) return;
    const year = TIMELINE_STOPS[this.selectedIndexSafe()];
    for (let i = 0; i < this.selectListeners.length; i++) this.selectListeners[i](year);
  }

  /** Mirrors `selectedIndex` into chip classes and slider ARIA state. */
  private syncSelection(): void {
    const index = this.selectedIndexSafe();
    const year = TIMELINE_STOPS[index];

    for (let i = 0; i < this.chipEls.length; i++) {
      this.chipEls[i].classList.toggle('is-active', i === index);
    }
    this.sliderEl.setAttribute('aria-valuenow', String(year));
    this.sliderEl.setAttribute('aria-valuetext', `${year} · ${STOP_DESCRIPTIONS[year]}`);

    // Travelled rail fill spans stop 0 → selected stop (decorative mirror).
    const railFill = this.sliderEl.querySelector<HTMLElement>('.tl-rail__fill');
    if (railFill) railFill.style.width = `${(index / (TIMELINE_STOPS.length - 1)) * 100}%`;
  }

  private onKeyDown(event: KeyboardEvent): void {
    const last = TIMELINE_STOPS.length - 1;
    let next: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(this.selectedIndexSafe() + 1, last);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(this.selectedIndexSafe() - 1, 0);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return; // Unrelated key — leave page/browser behaviour untouched.
    }

    event.preventDefault();
    this.selectIndex(next);
  }

  /** Nearest stop to a viewport x-coordinate, or null pre-layout (tests). */
  private indexFromPointer(clientX: number): number | null {
    const bounds = this.sliderEl.getBoundingClientRect();
    if (bounds.width <= 0) return null;
    const fraction = clamp((clientX - bounds.left) / bounds.width, 0, 1);
    return Math.round(fraction * (TIMELINE_STOPS.length - 1));
  }
}
