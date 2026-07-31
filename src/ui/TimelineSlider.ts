/**
 * TimelineSlider — the top timeline control bar.
 *
 * A fixed top control bar with a brief title and six labeled stops
 * [1945, 1965, 1985, 2005, 2025, 2055]. Clicking a stop, dragging the
 * draggable handle, or selecting a stop with the keyboard commits the era and
 * dispatches an `eraChange` CustomEvent on the root element. main.ts listens
 * for it and drives the TransitionController (which coordinates with the
 * SceneManager's setActiveEra hooks), so every commit cross-fades the scene.
 *
 * Interaction model:
 *  - Pointer: pressing a stop commits it; dragging the handle slides it
 *    between stops (live-snapping to the nearest stop, showing the year
 *    bubble) and commits the nearest stop on release.
 *  - Keyboard: the stops are `role="radio"` buttons in an aria-labelled
 *    radiogroup (arrow keys / Home / End move selection and commit it); the
 *    handle is a `role="slider"` with the same key map.
 *  - The bar is `pointer-events: auto` but only on its own surface; the rest
 *    of the page (the WebGL canvas) receives pointer events, so the overlay
 *    never blocks scene navigation outside the control.
 *
 * ARIA: radiogroup + radios, slider with `aria-valuenow` = era year and
 * `aria-valuetext`, tooltips via `aria-describedby` on each stop.
 *
 * The class is DOM-only: all era names / keyboard math live in
 * src/ui/timelineData.ts so the QA gate can verify them headlessly.
 */
import { eraName, eraValueText, nextStopIndex } from './timelineData';
import { ERAS, type EraYear } from '../data/eras';

/** Fired on the root element after a stop is committed via pointer or keyboard. */
export const ERA_CHANGE_EVENT = 'eraChange';

export interface TimelineSliderOptions {
  /** Years to render as stops, in timeline order. Defaults to `ERAS`. */
  years?: readonly EraYear[];
  /** Initial selected era (used for `aria-checked` + handle position). */
  initialEra?: EraYear;
}

/** Fixed track width (px), mirrors `.timeline-bar__track` width in style.css. */
const TRACK_WIDTH = 340;
/** Fixed stop width (px), mirrors `.timeline-stop` width in style.css. */
const STOP_WIDTH = 44;

export class TimelineSlider {
  readonly root: HTMLDivElement;

  private readonly years: readonly EraYear[];
  private activeEra: EraYear;
  private activeIndex = 0;

  /** True while the handle is being dragged with a pointer. */
  private dragging = false;

  private readonly track: HTMLDivElement;
  private readonly stopsRow: HTMLDivElement;
  private readonly stops: HTMLButtonElement[] = [];
  private readonly handle: HTMLDivElement;
  private readonly handleBubble: HTMLSpanElement;

  constructor(options: TimelineSliderOptions = {}) {
    this.years = options.years && options.years.length > 0 ? [...options.years] : [...ERAS];
    this.activeEra = this.years.includes(options.initialEra as EraYear)
      ? (options.initialEra as EraYear)
      : this.years[0];
    this.activeIndex = this.years.indexOf(this.activeEra);

    this.root = document.createElement('div');
    this.root.className = 'timeline-bar';
    this.root.setAttribute('role', 'group');
    this.root.setAttribute('aria-label', 'Café era timeline');

    const title = document.createElement('h2');
    title.className = 'timeline-bar__title';
    title.textContent = 'Timeline';
    title.id = 'timeline-bar-title';
    this.root.appendChild(title);

    // --- Track ----------------------------------------------------------------
    this.track = document.createElement('div');
    this.track.className = 'timeline-bar__track';

    this.stopsRow = document.createElement('div');
    this.stopsRow.className = 'timeline-bar__stops';
    this.stopsRow.setAttribute('role', 'radiogroup');
    this.stopsRow.setAttribute('aria-label', 'Era years');
    this.stopsRow.setAttribute('aria-describedby', 'timeline-bar-title');

    const stopCount = this.years.length;
    this.years.forEach((year, index) => {
      const stop = document.createElement('button');
      stop.type = 'button';
      stop.className = 'timeline-stop';
      stop.setAttribute('role', 'radio');
      stop.setAttribute('aria-checked', String(index === this.activeIndex));
      stop.setAttribute('aria-label', `${year}`);
      const describedBy = document.createElement('span');
      describedBy.className = 'timeline-stop__tip';
      describedBy.textContent = eraName(year);
      describedBy.id = `timeline-tip-${year}`;
      stop.appendChild(describedBy);
      stop.setAttribute('aria-describedby', describedBy.id);
      this.stopsRow.appendChild(stop);

      const label = document.createElement('span');
      label.className = 'timeline-stop__label';
      label.textContent = String(year);
      label.setAttribute('aria-hidden', 'true');
      stop.appendChild(label);

      // Clicking a stop commits its era immediately.
      stop.addEventListener('click', (event) => {
        event.preventDefault();
        this.commit(year, index);
      });

      // Keyboard navigation on the focused stop (radio-group pattern).
      stop.addEventListener('keydown', (event) => {
        const next = nextStopIndex(event.key, index, stopCount);
        if (next !== index) {
          event.preventDefault();
          this.commit(this.years[next], next);
          this.focusStop(next);
        }
      });

      this.stops.push(stop);
    });

    this.track.appendChild(this.stopsRow);

    // --- Draggable handle ------------------------------------------------------
    // A separate `role="slider"` element so it never blocks the clickable
    // stops (it only covers the stop it currently sits on). Dragging uses
    // pointer capture: the handle slides between stops, snapping live to the
    // nearest one, and commits on release.
    this.handle = document.createElement('div');
    this.handle.className = 'timeline-handle';
    this.handle.setAttribute('role', 'slider');
    this.handle.setAttribute('tabindex', '0');
    this.handle.setAttribute('aria-label', 'Era year');
    this.handle.setAttribute('aria-valuemin', String(this.years[0]));
    this.handle.setAttribute('aria-valuemax', String(this.years[this.years.length - 1]));
    this.handle.setAttribute('aria-valuenow', String(this.activeEra));
    this.handle.setAttribute(
      'aria-valuetext',
      eraValueText(this.activeEra, this.activeIndex, this.years.length),
    );

    this.handleBubble = document.createElement('span');
    this.handleBubble.className = 'timeline-handle__bubble';
    this.handleBubble.setAttribute('aria-hidden', 'true');
    this.handleBubble.textContent = String(this.activeEra);
    this.handle.appendChild(this.handleBubble);

    // Keyboard: arrows / Home / End move the selection and commit it.
    this.handle.addEventListener('keydown', (event) => {
      const next = nextStopIndex(event.key, this.activeIndex, stopCount);
      if (next !== this.activeIndex) {
        event.preventDefault();
        this.commit(this.years[next], next);
      }
    });

    // Pointer drag with capture; the rest of the page stays pointer-transparent.
    this.handle.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      this.dragging = true;
      this.handle.classList.add('is-dragging');
      if (typeof this.handle.setPointerCapture === 'function') {
        this.handle.setPointerCapture(event.pointerId);
      }
      this.moveHandleToPointer(event);
      event.preventDefault();
    });
    this.handle.addEventListener('pointermove', (event) => {
      if (!this.dragging) return;
      this.moveHandleToPointer(event);
    });
    const finishDrag = (event: PointerEvent): void => {
      if (!this.dragging) return;
      this.dragging = false;
      this.handle.classList.remove('is-dragging');
      if (
        typeof this.handle.hasPointerCapture === 'function' &&
        typeof this.handle.releasePointerCapture === 'function' &&
        this.handle.hasPointerCapture(event.pointerId)
      ) {
        this.handle.releasePointerCapture(event.pointerId);
      }
      this.commit(this.years[this.activeIndex], this.activeIndex);
    };
    this.handle.addEventListener('pointerup', finishDrag);
    this.handle.addEventListener('pointercancel', finishDrag);

    this.track.appendChild(this.handle);
    this.root.appendChild(this.track);

    this.syncPositions();
    this.renderHandle(this.activeIndex);
  }

  /** The currently selected era. */
  get era(): EraYear {
    return this.activeEra;
  }

  /**
   * Programmatically select an era (used by main.ts to reflect a
   * SceneManager / transition change). No event is emitted.
   */
  setEra(era: EraYear): void {
    const index = this.years.indexOf(era);
    if (index < 0) return;
    this.activeEra = era;
    this.activeIndex = index;
    this.syncPositions();
    this.renderHandle(index);
  }

  /** Commit a stop: update state/ARIA, invoke the callback and emit eraChange. */
  private commit(year: EraYear, index: number): void {
    if (index === this.activeIndex) return;
    this.activeEra = year;
    this.activeIndex = index;
    this.syncPositions();
    this.renderHandle(index);
    this.root.dispatchEvent(
      new CustomEvent<EraYear>(ERA_CHANGE_EVENT, {
        detail: year,
        bubbles: true,
      }),
    );
  }

  /** Focus the stop at `index` (keyboard navigation target). */
  private focusStop(index: number): void {
    this.stops[index]?.focus();
  }

  /** Keep stop `aria-checked` and `.is-active` in sync with `activeIndex`. */
  private syncPositions(): void {
    this.stops.forEach((stop, index) => {
      const active = index === this.activeIndex;
      stop.setAttribute('aria-checked', String(active));
      stop.classList.toggle('is-active', active);
    });
  }

  /** Update the handle position / value / bubble for `index`. */
  private renderHandle(index: number): void {
    const year = this.years[index];
    this.handle.style.left = `${this.stopCenterX(index)}px`;
    this.handle.setAttribute('aria-valuenow', String(year));
    this.handle.setAttribute(
      'aria-valuetext',
      eraValueText(year, index, this.years.length),
    );
    this.handleBubble.textContent = String(year);
  }

  /** X offset (px) of the stop centre inside the track. */
  private stopCenterX(index: number): number {
    if (this.years.length <= 1) return TRACK_WIDTH / 2;
    const span = TRACK_WIDTH - STOP_WIDTH;
    return STOP_WIDTH / 2 + (index / (this.years.length - 1)) * span;
  }

  /** Snap the handle to the stop nearest the pointer x (live drag preview). */
  private moveHandleToPointer(event: PointerEvent): void {
    const rect = this.track.getBoundingClientRect();
    if (rect.width === 0) return;
    const left = rect.left + STOP_WIDTH / 2;
    const span = Math.max(1, rect.width - STOP_WIDTH);
    const t = Math.min(1, Math.max(0, (event.clientX - left) / span));
    const index = Math.round(t * (this.years.length - 1));
    if (index !== this.activeIndex) {
      this.activeIndex = index;
      this.activeEra = this.years[index];
      this.syncPositions();
    }
    this.renderHandle(index);
  }
}

/** Factory used by main.ts and tests. */
export function createTimelineSlider(
  options: TimelineSliderOptions = {},
): TimelineSlider {
  return new TimelineSlider(options);
}
