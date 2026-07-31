/**
 * Pure data + logic for the timeline slider UI (no DOM).
 *
 * Keeping the era names, ARIA value text and keyboard navigation model in a
 * DOM-free module lets the QA gate (`npm run check:timeline`) verify the
 * contract headlessly and keeps the DOM component (src/ui/TimelineSlider.ts)
 * focused on rendering and interaction.
 */
import type { EraYear } from '../data/eras';

/**
 * Human-readable era names used by the timeline stops' tooltips and the
 * slider's `aria-valuetext`. Grounded in the per-era data records'
 * descriptive comments (src/data/eras/<year>.ts) and the README brief.
 */
export type EraNameMap = Readonly<Record<EraYear, string>>;

export const ERA_NAMES: EraNameMap = {
  1945: 'Post-War Austerity',
  1965: 'Swinging Sixties',
  1985: 'Eighties',
  2005: 'Noughties',
  2025: 'Present Day',
  2055: 'Future',
};

/** Era name for a year, with a fallback for unknown years. */
export function eraName(year: EraYear, names?: EraNameMap): string {
  return names?.[year] ?? ERA_NAMES[year] ?? `Era ${year}`;
}

/**
 * Accessible value text for the slider thumb at one stop, e.g.
 * "3 of 6: 1985 — Eighties".
 */
export function eraValueText(
  year: EraYear,
  index: number,
  total: number,
  names?: EraNameMap,
): string {
  return `${index + 1} of ${total}: ${year} — ${eraName(year, names)}`;
}

/**
 * Keyboard navigation model: the target stop index for a keypress.
 * Arrow keys move one stop, Home/End jump to the ends; anything else keeps
 * the current stop.
 */
export function nextStopIndex(key: string, index: number, total: number): number {
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      return Math.max(0, index - 1);
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
      return Math.min(total - 1, index + 1);
    case 'Home':
      return 0;
    case 'End':
      return total - 1;
    default:
      return index;
  }
}
