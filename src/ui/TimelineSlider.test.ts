// @vitest-environment happy-dom
//
// DOM-level coverage for the top timeline control bar. The component is pure
// DOM/CSS (no three.js), so a happy-dom document is the only requirement.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TIMELINE_STOPS, TimelineSlider } from './TimelineSlider';
import type { TransitionProgressSource } from './TimelineSlider';
import type { EraTransitionProgressEvent } from '../cafe/EraTransitionController';

function makeProgressEvent(
  overrides: Partial<EraTransitionProgressEvent> = {},
): EraTransitionProgressEvent {
  return { progress: 0, fromYear: 1945, toYear: 2025, ...overrides };
}

describe('TimelineSlider', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  function makeSlider(options?: ConstructorParameters<typeof TimelineSlider>[0]) {
    const slider = new TimelineSlider({ mount: host, ...options });
    return { slider, bar: host.querySelector<HTMLElement>('.tl-bar')! };
  }

  /* ----- Stops & chrome ------------------------------------------------- */

  it('renders exactly five labeled stops in chronological order', () => {
    const { bar } = makeSlider();

    const chips = Array.from(bar.querySelectorAll<HTMLButtonElement>('.tl-chip'));
    expect(chips).toHaveLength(5);
    expect(chips.map((chip) => chip.dataset.year)).toEqual([
      '1945',
      '1965',
      '1985',
      '2005',
      '2025',
    ]);
    expect(TIMELINE_STOPS).toEqual([1945, 1965, 1985, 2005, 2025]);

    // Presentation polish: wordmark lives inside the same bar.
    expect(bar.querySelector('.tl-brand__name')?.textContent).toContain('Café');
  });

  it('highlights the requested initial year', () => {
    const { bar, slider } = makeSlider({ initialYear: 1985 });

    const active = Array.from(bar.querySelectorAll('.tl-chip.is-active'));
    expect(active).toHaveLength(1);
    expect(active[0].getAttribute('data-year')).toBe('1985');
    expect(slider.selectedYear).toBe(1985);
  });

  /* ----- Typed selection event ------------------------------------------- */

  it('fires typed onSelectYear when a chip is clicked and highlights it', () => {
    const slider = new TimelineSlider({ mount: host });
    const onSelect = vi.fn();
    slider.onSelectYear(onSelect);

    const chip1965 = host.querySelector<HTMLButtonElement>('.tl-chip[data-year="1965"]')!;
    chip1965.click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toBe(1965); // typed EraYear payload
    expect(host.querySelectorAll('.tl-chip.is-active')).toHaveLength(1);
    expect(chip1965.classList.contains('is-active')).toBe(true);
  });

  it('unsubscribes selection listeners via the returned handle', () => {
    const onSelect = vi.fn();
    const { slider } = makeSlider();

    const unsubscribe = slider.onSelectYear(onSelect);
    unsubscribe();
    slider.setSelectedYear(2005, true);

    expect(onSelect).not.toHaveBeenCalled();
  });

  /* ----- ARIA slider semantics -------------------------------------------- */

  it('exposes role=slider with aria-valuenow mirroring the selected year', () => {
    const { slider } = makeSlider({ initialYear: 2005 });
    const track = host.querySelector<HTMLElement>('[role="slider"]')!;

    expect(track.getAttribute('role')).toBe('slider');
    expect(track.getAttribute('aria-valuemin')).toBe('1945');
    expect(track.getAttribute('aria-valuemax')).toBe('2025');
    expect(track.getAttribute('aria-valuenow')).toBe('2005');
    expect(track.getAttribute('aria-valuetext')).toContain('2005');

    slider.setSelectedYear(1945);
    expect(track.getAttribute('aria-valuenow')).toBe('1945');
  });

  /* ----- Keyboard navigation ------------------------------------------------ */

  it('moves between stops with arrow keys and fires selections', () => {
    const onSelect = vi.fn();
    const { slider } = makeSlider({ initialYear: 1985 });
    slider.onSelectYear(onSelect);

    const track = host.querySelector<HTMLElement>('[role="slider"]')!;
    const press = (key: string) =>
      track.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );

    press('ArrowRight'); // → 2005
    press('ArrowRight'); // → 2025
    press('ArrowRight'); // clamped at last stop
    press('ArrowLeft'); // → 2005
    press('Home'); // → 1945
    press('End'); // → 2025

    expect(slider.selectedYear).toBe(2025);
    // Two of the presses moved onto a NEW stop beyond spam at the ends:
    // →2005, →2025, clamp(no emit? still emits), ←2005, Home 1945, End 2025.
    const years = onSelect.mock.calls.map((call) => call[0]);
    expect(years).toEqual([2005, 2025, 2025, 2005, 1945, 2025]);

    press('ShiftLeft'); // unrelated key must not select anything
    expect(onSelect).toHaveBeenCalledTimes(6);
  });

  it('keeps arrow key handling on the focused track, not the chips', () => {
    const { slider } = makeSlider({ initialYear: 1945 });

    const chip = host.querySelector<HTMLButtonElement>('.tl-chip[data-year="1965"]')!;
    chip.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );

    // Key events bubble from chips to the role=slider track, so keyboard flow
    // survives pointer focus landing on a chip.
    expect(slider.selectedYear).toBe(1965);
  });

  /* ----- Transition shimmer --------------------------------------------------- */

  it('animates the shimmer from controller progress events and clears on completion', () => {
    const progressListeners: ((event: EraTransitionProgressEvent) => void)[] = [];
    const completionListeners: ((event: EraTransitionProgressEvent) => void)[] = [];
    const controllerStub = {
      onProgress: vi.fn((listener: (event: EraTransitionProgressEvent) => void) => {
        progressListeners.push(listener);
        return () => {
          const i = progressListeners.indexOf(listener);
          if (i !== -1) progressListeners.splice(i, 1);
        };
      }),
      onComplete: vi.fn((listener: (event: EraTransitionProgressEvent) => void) => {
        completionListeners.push(listener);
        return () => {
          const i = completionListeners.indexOf(listener);
          if (i !== -1) completionListeners.splice(i, 1);
        };
      }),
    };

    const { bar } = makeSlider({
      transitions: controllerStub as unknown as TransitionProgressSource,
    });

    expect(controllerStub.onProgress).toHaveBeenCalledTimes(1);
    expect(controllerStub.onComplete).toHaveBeenCalledTimes(1);
    expect(bar.classList.contains('is-transitioning')).toBe(false);

    progressListeners[0](makeProgressEvent({ progress: 0.4 }));

    expect(bar.classList.contains('is-transitioning')).toBe(true);
    const glide = bar.querySelector<HTMLElement>('.tl-glide')!;
    expect(glide.style.opacity).not.toBe('0');
    expect(glide.style.width).not.toBe('');

    completionListeners[0](makeProgressEvent({ progress: 1 }));
    expect(bar.classList.contains('is-transitioning')).toBe(false);
  });

  it('snaps unknown transition years onto the nearest rendered stop', () => {
    const { slider } = makeSlider();
    // Must not throw even though 2055 is not one of the five stops.
    expect(() =>
      slider.applyTransitionProgress(makeProgressEvent({ toYear: 2055 })),
    ).not.toThrow();
  });

  /* ----- Lifecycle -------------------------------------------------------------- */

  it('disposes cleanly: removes the bar and detaches subscriptions', () => {
    const progressListeners: ((event: EraTransitionProgressEvent) => void)[] = [];
    const controllerStub = {
      onProgress: vi.fn((listener: (event: EraTransitionProgressEvent) => void) => {
        progressListeners.push(listener);
        return () => {
          const i = progressListeners.indexOf(listener);
          if (i !== -1) progressListeners.splice(i, 1);
        };
      }),
      onComplete: vi.fn(() => () => {}),
    };

    const { slider, bar } = makeSlider({
      transitions: controllerStub as unknown as TransitionProgressSource,
    });
    expect(host.contains(bar)).toBe(true);

    slider.dispose();

    expect(host.contains(bar)).toBe(false);
    expect(progressListeners).toHaveLength(0); // unsubscribed from the controller

    // Late events after disposal are ignored safely.
    expect(() => slider.applyTransitionProgress(makeProgressEvent())).not.toThrow();
    slider.dispose(); // idempotent
  });
});
