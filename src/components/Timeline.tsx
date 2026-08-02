import { useCallback, useRef } from 'react';
import { ERAS, ERA_MAP } from '../data/eras';
import { eraIndex, useStore } from '../store/useStore';

/**
 * Top timeline slider. Dragging scrubs through the six era markers;
 * clicking a marker jumps straight to that era. Keyboard accessible.
 */
export function Timeline() {
  const era = useStore((s) => s.era);
  const targetEra = useStore((s) => s.targetEra);
  const transition = useStore((s) => s.transition);
  const setEra = useStore((s) => s.setEra);
  const reducedMotion = useStore((s) => s.reducedMotion);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  // The visible era is the incoming one once a cross-fade starts.
  const activeId = transition.phase === 'fading' ? transition.toEra : era;

  const ratioForClientX = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const r = (clientX - rect.left) / rect.width;
    return Math.min(1, Math.max(0, r));
  }, []);

  const eraForRatio = useCallback((ratio: number) => {
    const idx = Math.round(ratio * (ERAS.length - 1));
    return ERAS[Math.min(ERAS.length - 1, Math.max(0, idx))].id;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      const ratio = ratioForClientX(e.clientX);
      setEra(eraForRatio(ratio));
    },
    [eraForRatio, ratioForClientX, setEra],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const ratio = ratioForClientX(e.clientX);
      setEra(eraForRatio(ratio));
    },
    [eraForRatio, ratioForClientX, setEra],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = eraIndex(activeId);
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setEra(ERAS[Math.min(ERAS.length - 1, idx + 1)].id);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setEra(ERAS[Math.max(0, idx - 1)].id);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setEra(ERAS[0].id);
      } else if (e.key === 'End') {
        e.preventDefault();
        setEra(ERAS[ERAS.length - 1].id);
      }
    },
    [activeId, setEra],
  );

  const activeIndex = eraIndex(activeId);
  const activeRatio = ERAS.length > 1 ? activeIndex / (ERAS.length - 1) : 0;

  return (
    <div className="timeline" role="group" aria-label="Time period timeline">
      <div className="timeline__title">
        <span className="timeline__dot" />
        Café Time Period
      </div>

      <div
        ref={trackRef}
        className="timeline__track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label="Select time period"
        aria-valuemin={0}
        aria-valuemax={ERAS.length - 1}
        aria-valuenow={activeIndex}
        aria-valuetext={ERA_MAP[activeId].label}
        tabIndex={0}
        onKeyDown={handleKey}
      >
        <div className="timeline__rail" />
        <div
          className="timeline__fill"
          style={{ transform: `scaleX(${activeRatio})` }}
        />
        <div
          className="timeline__thumb"
          style={{ left: `${activeRatio * 100}%` }}
        />

        {ERAS.map((e, i) => {
          const pct = ERAS.length > 1 ? (i / (ERAS.length - 1)) * 100 : 0;
          const isActive = e.id === activeId;
          const isTarget = e.id === targetEra && transition.phase === 'fading';
          return (
            <button
              key={e.id}
              type="button"
              className={[
                'timeline__marker',
                isActive ? 'is-active' : '',
                isTarget && !isActive ? 'is-target' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ left: `${pct}%` }}
              onClick={(ev) => {
                ev.stopPropagation();
                setEra(e.id);
              }}
              onPointerDown={(ev) => {
                // Marker clicks are discrete jumps — don't let the track's
                // drag-to-scrub logic also fire on the same gesture.
                ev.stopPropagation();
              }}
              aria-label={`${e.label} — ${e.tagline}`}
              title={`${e.label} — ${e.tagline}`}
            >
              <span className="timeline__marker-dot" />
              <span className="timeline__marker-label">{e.label}</span>
            </button>
          );
        })}
      </div>

      <div className="timeline__meta">
        {reducedMotion ? (
          <span className="timeline__hint">Reduced motion — instant switching</span>
        ) : (
          <span className="timeline__hint">Drag to scrub · click a year to jump</span>
        )}
        <span className="timeline__tagline">{ERA_MAP[activeId].tagline}</span>
      </div>
    </div>
  );
}
