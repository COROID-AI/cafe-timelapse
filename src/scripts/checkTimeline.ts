/**
 * QA gate: `npm run check:timeline`
 *
 * Headless (no browser, no WebGL) verification of the timeline slider UI:
 *  - the component renders six labeled stops in canonical order
 *    [1945, 1965, 1985, 2005, 2025, 2055];
 *  - clicking a stop commits the era, moves the active state and the handle,
 *    and emits the `eraChange` event with the era as detail;
 *  - keyboard navigation (arrow keys / Home / End) selects the neighbour /
 *    first / last stop and commits it;
 *  - dragging the handle snaps to the nearest stop and commits on release;
 *  - the stops expose the accessibility surface (radiogroup + radios,
 *    `aria-checked`, `aria-label`, `aria-describedby` tooltip references, and
 *    a slider handle with `aria-valuenow`/`aria-valuetext`);
 *  - era names and keyboard math from src/ui/timelineData.ts are correct.
 *
 * The DOM environment is happy-dom (a real layout engine is not available in
 * CI), so pointer-drag coverage uses the component's public pointer handlers
 * directly with a stubbed track rect rather than synthetic layout-dependent
 * coordinates.
 *
 * Exits non-zero on any assertion failure.
 */
import { Window } from 'happy-dom';
import { ERAS, type EraYear } from '../data/eras';
import {
  TimelineSlider,
  ERA_CHANGE_EVENT,
} from '../ui/TimelineSlider';
import {
  ERA_NAMES,
  eraName,
  eraValueText,
  nextStopIndex,
} from '../ui/timelineData';

function run(): void {
  let failures = 0;
  const assert = (condition: boolean, message: string): void => {
    if (!condition) {
      failures += 1;
      console.error(`  FAIL: ${message}`);
    } else {
      console.log(`  ok: ${message}`);
    }
  };

  const window = new Window();

  // Register the happy-dom globals so the component (which references
  // `document` and `CustomEvent`) runs in this headless environment.
  Object.assign(globalThis, {
    window,
    document: window.document,
    CustomEvent: window.CustomEvent,
  });

  // happy-dom's event/node classes are structurally incompatible with
  // lib.dom's, so bridge the two when dispatching into lib.dom-typed nodes.
  const fire = (target: Element, event: unknown): void => {
    target.dispatchEvent(event as unknown as Event);
  };

  // 1. Era names + keyboard math are canonical.
  assert(
    ERA_NAMES[1945] === 'Post-War Austerity' &&
      ERA_NAMES[2055] === 'Future' &&
      Object.keys(ERA_NAMES).length === ERAS.length,
    'ERA_NAMES covers every canonical era',
  );
  assert(
    nextStopIndex('ArrowRight', 0, 6) === 1 &&
      nextStopIndex('ArrowLeft', 0, 6) === 0 &&
      nextStopIndex('End', 2, 6) === 5 &&
      nextStopIndex('Home', 3, 6) === 0,
    'nextStopIndex implements arrow / Home / End navigation',
  );
  assert(
    eraValueText(1985, 2, 6) === '3 of 6: 1985 — Eighties',
    'eraValueText formats the accessible value text',
  );

  // 2. Rendering: six stops in canonical order + title + handle.
  const slider = new TimelineSlider({ initialEra: 1945 });
  document.body.appendChild(
    slider.root as unknown as Parameters<typeof document.body.appendChild>[0],
  );

  const stops = [...slider.root.querySelectorAll<HTMLButtonElement>('.timeline-stop')];
  assert(stops.length === 6, 'renders six stops');
  assert(
    stops.every((stop, index) => stop.textContent?.includes(String(ERAS[index]))),
    'stops are labeled with the six canonical years in order',
  );
  assert(
    slider.root.querySelector('.timeline-bar__title')?.textContent === 'Timeline',
    'renders a brief title',
  );
  const handle = slider.root.querySelector<HTMLDivElement>('.timeline-handle');
  assert(handle !== null, 'renders a draggable handle');
  assert(
    slider.root.querySelectorAll('.timeline-stop__tip').length === 6,
    'every stop has an era-name tooltip element',
  );

  // 3. Accessibility surface.
  const radiogroup = slider.root.querySelector('[role="radiogroup"]');
  assert(radiogroup !== null, 'stops live in a role="radiogroup"');
  assert(
    stops.every((stop) => stop.getAttribute('role') === 'radio'),
    'each stop is role="radio"',
  );
  assert(
    stops[0].getAttribute('aria-checked') === 'true' &&
      stops[1].getAttribute('aria-checked') === 'false',
    'initial era is aria-checked',
  );
  const describedBy = stops[0].getAttribute('aria-describedby');
  const tip = describedBy
    ? slider.root.querySelector<HTMLElement>(`#${describedBy}`)
    : null;
  assert(
    describedBy !== null && tip?.textContent === eraName(1945),
    'stop references its era-name tooltip via aria-describedby',
  );
  assert(
    (handle?.getAttribute('role') === 'slider' &&
      handle.getAttribute('aria-valuenow') === '1945' &&
      (handle.getAttribute('aria-valuetext')?.includes('1945 — Post-War Austerity') ??
        false)) ??
      false,
    'handle is a slider with aria-valuenow / aria-valuetext',
  );

  // 4. Clicking a stop commits + emits eraChange.
  let lastEvent: EraYear | null = null;
  slider.root.addEventListener(ERA_CHANGE_EVENT, (event) => {
    lastEvent = (event as CustomEvent<EraYear>).detail;
  });

  fire(stops[3], new window.MouseEvent('click', { bubbles: true }));
  assert(lastEvent === 2005, 'clicking a stop emits eraChange with the era');
  assert(slider.era === 2005, 'clicking a stop updates the active era');
  assert(
    stops[3].getAttribute('aria-checked') === 'true' &&
      stops[0].getAttribute('aria-checked') === 'false',
    'active stop aria-checked follows the click',
  );
  assert(
    handle?.getAttribute('aria-valuenow') === '2005',
    'handle aria-valuenow follows the click',
  );

  // Clicking the already-active stop is a no-op (no duplicate event).
  lastEvent = null;
  fire(stops[3], new window.MouseEvent('click', { bubbles: true }));
  assert(lastEvent === null, 'clicking the active stop does not re-emit eraChange');

  // 5. Keyboard navigation on a stop.
  const stop2 = stops[2]; // 1985
  stop2.focus();
  fire(stop2, new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert(slider.era === 2005, 'ArrowRight on a stop moves to the next era');

  const stop5 = stops[5]; // 2055
  stop5.focus();
  fire(stop5, new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert(slider.era === 1945, 'Home on a stop jumps to the first era');

  // 6. Keyboard navigation on the handle.
  if (handle) {
    fire(handle, new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert(slider.era === 1965, 'ArrowRight on the handle moves to the next era');
    fire(handle, new window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    assert(slider.era === 2055, 'End on the handle jumps to the last era');
  }

  // 7. Drag the handle: pointerdown + pointermove snap to a stop, release
  // commits. getBoundingClientRect is stubbed to the fixed track geometry so
  // pointer positions map deterministically (track 340px, stop width 44px).
  Object.defineProperty(slider['track'], 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ left: 0, right: 340, width: 340, top: 0, height: 30 }),
  });
  const pointerId = 7;
  if (handle) {
    fire(
      handle,
      new window.PointerEvent('pointerdown', {
        pointerId,
        pointerType: 'mouse',
        button: 0,
        clientX: 100,
        bubbles: true,
      }),
    );
    fire(
      handle,
      new window.PointerEvent('pointermove', {
        pointerId,
        pointerType: 'mouse',
        clientX: 260, // nearest stop centre to 2025 (≈258.8) → snaps to 2025
        bubbles: true,
      }),
    );
    fire(
      handle,
      new window.PointerEvent('pointerup', {
        pointerId,
        pointerType: 'mouse',
        clientX: 260,
        bubbles: true,
      }),
    );
    assert(slider.era === 2025, 'dragging the handle commits the nearest stop');
  }

  // 8. setEra reflects an external change without emitting eraChange.
  lastEvent = null;
  slider.setEra(2055);
  assert(slider.era === 2055, 'setEra updates the active era');
  assert(lastEvent === null, 'setEra does not emit eraChange');
  assert(
    handle?.getAttribute('aria-valuenow') === '2055',
    'setEra moves the handle aria-valuenow',
  );

  if (failures > 0) {
    console.error(`\nTimeline slider check FAILED (${failures} failure(s)).`);
    process.exitCode = 1;
  } else {
    console.log('\nAll timeline slider assertions passed.');
  }
}

run();
