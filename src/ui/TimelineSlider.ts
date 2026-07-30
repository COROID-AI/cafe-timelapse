/**
 * TimelineSlider.ts — top-bar era selector for the Café Time Period Timelapse.
 *
 * Renders a fixed overlay bar across the top of the viewport with six discrete,
 * labeled year stops (1945–2055). Selecting a stop — by click, drag, or
 * keyboard — moves the draggable handle, updates the era-name tooltip, and
 * dispatches an {@link ERA_CHANGE_EVENT | eraChange} event whose
 * {@link EraChangeEventDetail} the application wiring forwards to
 * {@link SceneManager.setActiveEra} and the audio engine.
 *
 * The overlay container uses `pointer-events: none` so that pointer events
 * pass through to the WebGL canvas everywhere except the bar itself, which
 * re-enables `pointer-events: auto`.
 *
 * Accessibility:
 * - The track is an ARIA `radiogroup`; each stop is a `radio` with roving
 *   `tabindex` (only the active radio is in the tab order).
 * - Arrow Left/Right/Up/Down, Home, and End move between stops with automatic
 *   activation (focus + selection move together).
 * - Enter/Space re-confirms the focused stop.
 * - Each stop's `aria-label` includes both the year and the era name.
 */
import { ERA_YEARS, type EraYear } from '../data/EraData.js';
import { getEra } from '../data/eras.js';

// ---------------------------------------------------------------------------
// Public event contract
// ---------------------------------------------------------------------------

/** The DOM event name dispatched when the active era changes. */
export const ERA_CHANGE_EVENT = 'eraChange' as const;

/** How a stop selection was triggered. */
export type SelectionSource = 'click' | 'drag' | 'keyboard';

/**
 * Detail payload for the {@link ERA_CHANGE_EVENT} event.
 *
 * Consumed by the application wiring layer to call
 * {@link SceneManager.setActiveEra} and by the audio engine to swap the
 * ambient soundtrack.
 */
export interface EraChangeEventDetail {
  /** The newly selected era year. */
  readonly year: EraYear;
  /** The previously selected era year, or `null` on the very first selection. */
  readonly prevYear: EraYear | null;
  /** How the selection was triggered. */
  readonly source: SelectionSource;
}

/** Convenience handler type for {@link TimelineSlider.onEraChange}. */
export type EraChangeHandler = (detail: EraChangeEventDetail) => void;

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** Constructor options for {@link TimelineSlider}. */
export interface TimelineSliderOptions {
  /**
   * The selectable years in display order. Defaults to the six canonical
   * {@link ERA_YEARS}.
   */
  readonly years?: readonly EraYear[];
  /** Maps a year to its display label (era name). Defaults to `getEra(year).label`. */
  readonly getEraLabel?: (year: EraYear) => string;
  /** The brief title shown at the left of the bar. */
  readonly title?: string;
  /** The year that should appear selected on mount. Defaults to the first year. */
  readonly initialYear?: EraYear;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Horizontal inset (px) keeping edge stops within the track bounds. */
const INSET_PX = 14;

// ---------------------------------------------------------------------------
// Styles (self-contained — no external CSS framework)
// ---------------------------------------------------------------------------

const STYLES = `
.ctt-timeline {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: #e8eef5;
  -webkit-user-select: none;
  user-select: none;
}

.ctt-timeline__bar {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 24px;
  background: linear-gradient(
    to bottom,
    rgba(12, 16, 22, 0.92),
    rgba(12, 16, 22, 0.78)
  );
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  backdrop-filter: blur(14px) saturate(1.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}

.ctt-timeline__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.ctt-timeline__title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8295a8;
  white-space: nowrap;
}

.ctt-timeline__era {
  font-size: 18px;
  font-weight: 700;
  color: #f0c878;
  white-space: nowrap;
}

.ctt-timeline__track {
  --inset: ${INSET_PX}px;
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  height: 48px;
  touch-action: none;
}

.ctt-timeline__rail {
  position: absolute;
  top: 14px;
  left: var(--inset);
  right: var(--inset);
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.ctt-timeline__fill {
  --pct: 0;
  position: absolute;
  top: 14px;
  left: var(--inset);
  height: 3px;
  width: calc(100% - 2 * var(--inset));
  transform: scaleX(var(--pct));
  transform-origin: left center;
  border-radius: 999px;
  background: linear-gradient(to right, #b8762e, #f0c060);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.ctt-timeline__stop {
  --pct: 0;
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--inset) + var(--pct) * (100% - 2 * var(--inset)));
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 52px;
  padding: 0;
  padding-top: 8px;
  gap: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: inherit;
  font: inherit;
}

.ctt-timeline__stop:focus {
  outline: none;
}

.ctt-timeline__stop:focus-visible {
  outline: 2px solid rgba(240, 200, 120, 0.75);
  outline-offset: 3px;
  border-radius: 8px;
}

.ctt-timeline__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: background 0.2s ease, border-color 0.2s ease,
    transform 0.2s ease, box-shadow 0.2s ease;
}

.ctt-timeline__stop:hover .ctt-timeline__dot {
  background: rgba(240, 192, 96, 0.5);
  border-color: rgba(240, 192, 96, 0.7);
  transform: scale(1.2);
}

.ctt-timeline__stop[aria-checked="true"] .ctt-timeline__dot {
  background: #f0c060;
  border-color: #f5d690;
  transform: scale(1.25);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.ctt-timeline__year {
  font-size: 13px;
  font-weight: 600;
  color: #8fa0b4;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.ctt-timeline__stop:hover .ctt-timeline__year {
  color: #c8d4e0;
}

.ctt-timeline__stop[aria-checked="true"] .ctt-timeline__year {
  color: #f0c060;
}

.ctt-timeline__handle {
  --pct: 0;
  position: absolute;
  top: 14px;
  left: calc(var(--inset) + var(--pct) * (100% - 2 * var(--inset)));
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f0c060;
  border: 3px solid #fff;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
  cursor: grab;
  touch-action: none;
  transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

.ctt-timeline__handle--dragging {
  cursor: grabbing;
  transition: none;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.55);
}

.ctt-timeline__tooltip {
  --pct: 0;
  position: absolute;
  top: 42px;
  left: calc(var(--inset) + var(--pct) * (100% - 2 * var(--inset)));
  transform: translateX(-50%);
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.88);
  color: #f0f5fa;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.18s ease, left 0.2s ease;
  z-index: 3;
}

.ctt-timeline__tooltip::before {
  content: "";
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top: none;
  border-bottom-color: rgba(0, 0, 0, 0.88);
}

.ctt-timeline__tooltip--visible {
  opacity: 1;
}

@media (max-width: 640px) {
  .ctt-timeline__bar {
    gap: 12px;
    padding: 8px 12px;
  }
  .ctt-timeline__heading {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ctt-timeline__fill,
  .ctt-timeline__handle,
  .ctt-timeline__tooltip,
  .ctt-timeline__dot {
    transition: none !important;
  }
}
`;

// ---------------------------------------------------------------------------
// Module-level style injection guard
// ---------------------------------------------------------------------------

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-ctt', 'timeline-slider');
  style.textContent = STYLES;
  document.head.append(style);
  stylesInjected = true;
}

// ---------------------------------------------------------------------------
// Small DOM helpers
// ---------------------------------------------------------------------------

function makeEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  return el;
}

/** Returns the unit-less ratio string `index / (count - 1)`, clamped to [0, 1]. */
function ratioAt(index: number, count: number): string {
  if (count <= 1) return '0';
  return String(index / (count - 1));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * A fixed-position top timeline bar with six labeled year stops.
 *
 * ```ts
 * const timeline = new TimelineSlider();
 * timeline.mount(document.body);
 * timeline.onEraChange(({ year }) => sceneManager.setActiveEra(year));
 * ```
 */
export class TimelineSlider {
  // --- DOM elements --------------------------------------------------------
  private readonly host: HTMLElement;
  private readonly eraName: HTMLElement;
  private readonly track: HTMLElement;
  private readonly fill: HTMLElement;
  private readonly handle: HTMLElement;
  private readonly tooltip: HTMLElement;
  private readonly stops: HTMLButtonElement[] = [];

  // --- Configuration -------------------------------------------------------
  private readonly years: readonly EraYear[];
  private readonly getEraLabel: (year: EraYear) => string;

  // --- State ---------------------------------------------------------------
  private activeIndex = 0;
  private hoverIndex: number | null = null;
  private dragging = false;
  private dragPointerId: number | null = null;
  private disposed = false;

  // --- Unique tooltip id (safe for multiple instances) --------------------
  private static instanceSeq = 0;
  private readonly tooltipId: string;

  /**
   * @param options Optional overrides for years, labels, title, and initial selection.
   */
  constructor(options: TimelineSliderOptions = {}) {
    this.years = options.years ?? ERA_YEARS;
    this.getEraLabel = options.getEraLabel ?? ((y) => getEra(y).label);

    const initialYear = options.initialYear ?? this.years[0];
    const initialIdx = this.years.indexOf(initialYear);
    this.activeIndex = initialIdx >= 0 ? initialIdx : 0;

    TimelineSlider.instanceSeq += 1;
    this.tooltipId = `ctt-tooltip-${TimelineSlider.instanceSeq}`;

    // --- Build DOM ---------------------------------------------------------
    this.host = makeEl('div', 'ctt-timeline');

    const bar = makeEl('div', 'ctt-timeline__bar');

    // Heading: title + active era name.
    const heading = makeEl('div', 'ctt-timeline__heading');
    const titleEl = makeEl('span', 'ctt-timeline__title');
    titleEl.textContent = options.title ?? 'Café Through Time';
    this.eraName = makeEl('span', 'ctt-timeline__era');
    heading.append(titleEl, this.eraName);

    // Track (the radiogroup).
    this.track = makeEl('div', 'ctt-timeline__track');
    this.track.setAttribute('role', 'radiogroup');
    this.track.setAttribute('aria-label', 'Café time period selection');
    this.track.setAttribute('aria-orientation', 'horizontal');

    // Rail (background line) + fill (progress to active stop).
    const rail = makeEl('div', 'ctt-timeline__rail');
    this.fill = makeEl('div', 'ctt-timeline__fill');

    // Stops.
    for (let i = 0; i < this.years.length; i++) {
      const year = this.years[i];
      const stop = document.createElement('button');
      stop.type = 'button';
      stop.className = 'ctt-timeline__stop';
      stop.setAttribute('role', 'radio');
      stop.setAttribute('aria-checked', 'false');
      stop.tabIndex = -1;
      stop.setAttribute(
        'aria-label',
        `${year}, ${this.getEraLabel(year)}`,
      );
      stop.style.setProperty('--pct', ratioAt(i, this.years.length));

      const dot = makeEl('span', 'ctt-timeline__dot');
      const yearLabel = makeEl('span', 'ctt-timeline__year');
      yearLabel.textContent = String(year);
      stop.append(dot, yearLabel);
      this.stops.push(stop);

      // --- Events --------------------------------------------------------
      stop.addEventListener('click', () => this.selectIndex(i, 'click'));
      stop.addEventListener('keydown', (e) => this.onKeyDown(e, i));
      stop.addEventListener('mouseenter', () => this.setHover(i));
      stop.addEventListener('mouseleave', () => this.setHover(null));
      stop.addEventListener('focus', () => this.setHover(i));
      stop.addEventListener('blur', () => this.setHover(null));
    }

    // Draggable handle (visual only — keyboard goes through the radios).
    this.handle = makeEl('div', 'ctt-timeline__handle');
    this.handle.setAttribute('aria-hidden', 'true');
    this.handle.addEventListener('pointerdown', (e) => this.onDragStart(e));
    this.handle.addEventListener('pointermove', (e) => this.onDragMove(e));
    this.handle.addEventListener('pointerup', (e) => this.onDragEnd(e));
    this.handle.addEventListener('pointercancel', (e) => this.onDragEnd(e));

    // Tooltip (visual only — accessible name comes from aria-label).
    this.tooltip = makeEl('div', 'ctt-timeline__tooltip');
    this.tooltip.id = this.tooltipId;
    this.tooltip.setAttribute('role', 'tooltip');
    this.tooltip.setAttribute('aria-hidden', 'true');

    this.track.append(rail, this.fill, ...this.stops, this.handle, this.tooltip);
    bar.append(heading, this.track);
    this.host.append(bar);

    // Inject styles once.
    injectStyles();

    // Render the initial visual state.
    this.applyActiveState();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Append the overlay into a parent element (defaults to `document.body`).
   * Returns `this` for chaining.
   */
  mount(parent: HTMLElement = document.body): this {
    if (this.disposed) throw new Error('TimelineSlider has been disposed.');
    parent.append(this.host);
    return this;
  }

  /** The root overlay element. `eraChange` events bubble from here. */
  get element(): HTMLElement {
    return this.host;
  }

  /** The currently selected year. */
  get activeYear(): EraYear {
    return this.years[this.activeIndex];
  }

  /** The six (or configured) selectable years, in order. */
  get selectableYears(): readonly EraYear[] {
    return this.years;
  }

  /**
   * Programmatically select a year. No-op (and no event) if `year` is already
   * active or not among the configured years.
   */
  selectYear(year: EraYear, source: SelectionSource = 'click'): void {
    const index = this.years.indexOf(year);
    if (index >= 0) this.selectIndex(index, source);
  }

  /**
   * Register an {@link ERA_CHANGE_EVENT} listener. Returns an unsubscribe
   * function.
   */
  onEraChange(handler: EraChangeHandler): () => void {
  const listener = (e: Event): void => {
      handler((e as CustomEvent<EraChangeEventDetail>).detail);
    };
    this.host.addEventListener(ERA_CHANGE_EVENT, listener);
    return () => this.host.removeEventListener(ERA_CHANGE_EVENT, listener);
  }

  /** Remove the overlay from the DOM. After this the instance is unusable. */
  dispose(): void {
    this.disposed = true;
    this.host.remove();
  }

  // -------------------------------------------------------------------------
  // Internal — selection & state
  // -------------------------------------------------------------------------

  private selectIndex(index: number, source: SelectionSource): void {
    const clamped = Math.max(0, Math.min(this.years.length - 1, index));
    if (clamped === this.activeIndex) return; // no-op for the active era

    const prevYear: EraYear | null = this.years[this.activeIndex] ?? null;
    this.activeIndex = clamped;
    this.applyActiveState();
    this.emitChange(this.years[clamped], prevYear, source);
  }

  /** Sync all DOM visuals + ARIA state to {@link activeIndex}. */
  private applyActiveState(): void {
    const pctVal = ratioAt(this.activeIndex, this.years.length);

    this.fill.style.setProperty('--pct', pctVal);
    this.handle.style.setProperty('--pct', pctVal);
    this.eraName.textContent = this.getEraLabel(this.years[this.activeIndex]);

    for (let i = 0; i < this.stops.length; i++) {
      const isActive = i === this.activeIndex;
      this.stops[i].setAttribute('aria-checked', String(isActive));
      this.stops[i].tabIndex = isActive ? 0 : -1; // roving tabindex
    }

    if (this.hoverIndex === null) {
      this.updateTooltip(this.activeIndex);
    }
  }

  private emitChange(
    year: EraYear,
    prevYear: EraYear | null,
    source: SelectionSource,
  ): void {
    const detail: EraChangeEventDetail = { year, prevYear, source };
    this.host.dispatchEvent(
      new CustomEvent<EraChangeEventDetail>(ERA_CHANGE_EVENT, {
        detail,
        bubbles: true,
        cancelable: false,
      }),
    );
  }

  // -------------------------------------------------------------------------
  // Internal — keyboard
  // -------------------------------------------------------------------------

  private onKeyDown(e: KeyboardEvent, index: number): void {
    let next: number | null = null;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        next = index - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        next = index + 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = this.years.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.selectIndex(index, 'keyboard');
        return;
      default:
        return;
    }

    e.preventDefault();
    if (next !== null) {
      next = Math.max(0, Math.min(this.years.length - 1, next));
      this.stops[next].focus();
      this.selectIndex(next, 'keyboard');
    }
  }

  // -------------------------------------------------------------------------
  // Internal — hover / tooltip
  // -------------------------------------------------------------------------

  private setHover(index: number | null): void {
    this.hoverIndex = index;
    if (index !== null) {
      this.updateTooltip(index);
      this.tooltip.classList.add('ctt-timeline__tooltip--visible');
    } else {
      this.updateTooltip(this.activeIndex);
      this.tooltip.classList.remove('ctt-timeline__tooltip--visible');
    }
  }

  private updateTooltip(index: number): void {
    const year = this.years[index];
    this.tooltip.textContent = this.getEraLabel(year);
    this.tooltip.style.setProperty('--pct', ratioAt(index, this.years.length));
  }

  // -------------------------------------------------------------------------
  // Internal — pointer drag
  // -------------------------------------------------------------------------

  private onDragStart(e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // left-click only
    e.preventDefault();

    this.dragging = true;
    this.dragPointerId = e.pointerId;
    this.handle.setPointerCapture(e.pointerId);
    this.handle.classList.add('ctt-timeline__handle--dragging');

    this.moveHandleToPointer(e.clientX);
  }

  private onDragMove(e: PointerEvent): void {
    if (!this.dragging || e.pointerId !== this.dragPointerId) return;
    this.moveHandleToPointer(e.clientX);
  }

  private onDragEnd(e: PointerEvent): void {
    if (!this.dragging || e.pointerId !== this.dragPointerId) return;

    this.dragging = false;
    this.dragPointerId = null;
    try {
      this.handle.releasePointerCapture(e.pointerId);
    } catch {
      // releasePointerCapture throws if capture was already lost; ignore.
    }
    this.handle.classList.remove('ctt-timeline__handle--dragging');

    // Snap to the nearest stop and select it.
    const index = this.indexFromClientX(e.clientX);
    this.selectIndex(index, 'drag');
    this.applyActiveState(); // snap handle precisely onto the stop
  }

  /** Move the handle (and fill) to follow the live pointer X during a drag. */
  private moveHandleToPointer(clientX: number): void {
    const liveRatio = this.ratioFromClientX(clientX);
    this.handle.style.setProperty('--pct', String(liveRatio));
    this.fill.style.setProperty('--pct', String(liveRatio));
  }

  /** Convert a pointer client-X into a ratio [0, 1] across the stop range. */
  private ratioFromClientX(clientX: number): number {
    const rect = this.track.getBoundingClientRect();
    const range = rect.width - 2 * INSET_PX;
    if (range <= 0) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left - INSET_PX) / range));
  }

  /** Convert a pointer client-X into the nearest stop index. */
  private indexFromClientX(clientX: number): number {
    const ratio = this.ratioFromClientX(clientX);
    return Math.round(ratio * (this.years.length - 1));
  }
}
