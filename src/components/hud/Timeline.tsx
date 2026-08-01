import { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { ERA_IDS, ERAS } from '../../data/eras';
import { useEraStore } from '../../store/useEraStore';

/**
 * The top timeline slider with exactly six era options (1945 → 2055).
 * Selecting any era begins the transition. Keyboard-operable (native range
 * input), with per-era labeled buttons and shortcut keys 1–6.
 */
export function Timeline() {
  const targetEra = useEraStore((s) => s.targetEra);
  const setEra = useEraStore((s) => s.setEra);

  const handleRange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const idx = Number(e.target.value);
      const era = ERA_IDS[idx];
      if (era) {
        setEra(era);
      }
    },
    [setEra],
  );

  const selectedIndex = ERA_IDS.indexOf(targetEra);

  return (
    <div className="timeline" role="region" aria-label="Time period selector">
      <div className="timeline-labels" aria-label="Era options">
        {ERA_IDS.map((id, i) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === targetEra}
            aria-label={`Era ${ERAS[id].label} (shortcut ${i + 1})`}
            title={`${ERAS[id].label} — ${ERAS[id].tagline} (${i + 1})`}
            className={`timeline-era ${id === targetEra ? 'is-active' : ''}`}
            onClick={() => setEra(id)}
          >
            {ERAS[id].label}
          </button>
        ))}
      </div>
      <input
        type="range"
        className="timeline-slider"
        min={0}
        max={ERA_IDS.length - 1}
        step={1}
        value={selectedIndex}
        onChange={handleRange}
        aria-label="Select café time period"
        aria-valuetext={`${ERAS[targetEra].label} — ${ERAS[targetEra].tagline}`}
      />
    </div>
  );
}
