import { useCallback, useRef } from 'react';
import { ERAS } from '../../data/eras';
import { useSceneStore } from '../../store/sceneStore';
import { cn } from '../../lib/cn';

/**
 * Top-of-screen timeline slider with 6 era stops.
 * Keyboard accessible: Tab to focus, Arrow Left/Right to navigate.
 */
export function Timeline() {
  const activeEraId = useSceneStore((s) => s.activeEraId);
  const setEra = useSceneStore((s) => s.setEra);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = ERAS.findIndex((e) => e.id === activeEraId);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(ERAS.length - 1, index));
      const era = ERAS[clamped];
      if (era) setEra(era.id);
    },
    [setEra],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToIndex(activeIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToIndex(activeIndex - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToIndex(ERAS.length - 1);
      }
    },
    [activeIndex, goToIndex],
  );

  return (
    <div className="pointer-events-auto fixed top-0 left-0 right-0 z-30 flex justify-center px-4 pt-4">
      <div
        ref={containerRef}
        role="group"
        aria-label="Timeline era selector"
        className="glass-panel rounded-2xl px-4 py-3 sm:px-6 sm:py-4"
        data-testid="timeline"
      >
        {/* Connecting line */}
        <div className="relative">
          <div className="absolute top-1/2 left-3 right-3 -translate-y-1/2 h-0.5 bg-white/15 rounded-full" />
          <div
            className="absolute top-1/2 left-3 -translate-y-1/2 h-0.5 rounded-full transition-all duration-500"
            style={{
              width: `calc(${(activeIndex / (ERAS.length - 1)) * 100}% * (1 - 6px / 100%) + 0px)`,
              background: 'var(--era-accent)',
            }}
          />

          {/* Stops */}
          <div
            className="relative flex items-center justify-between gap-2 sm:gap-6"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={ERAS.length - 1}
            aria-valuenow={activeIndex}
            aria-label="Era timeline"
          >
            {ERAS.map((era, i) => {
              const isActive = era.id === activeEraId;
              const isPassed = i < activeIndex;
              return (
                <button
                  key={era.id}
                  data-testid={`era-stop-${era.id}`}
                  data-era={era.id}
                  onClick={() => goToIndex(i)}
                  className="group relative flex flex-col items-center gap-2 outline-none"
                  aria-label={`${era.year} — ${era.label}`}
                  aria-pressed={isActive}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {/* Marker */}
                  <span
                    className={cn(
                      'relative flex items-center justify-center rounded-full border-2 transition-all duration-300',
                      isActive
                        ? 'h-5 w-5 border-white scale-125'
                        : 'h-3.5 w-3.5 border-white/40 hover:border-white/70 hover:scale-110',
                    )}
                    style={{
                      background: isActive
                        ? 'var(--era-accent)'
                        : isPassed
                          ? 'color-mix(in srgb, var(--era-accent) 50%, transparent)'
                          : 'rgba(255,255,255,0.1)',
                      boxShadow: isActive ? '0 0 12px var(--era-accent)' : 'none',
                    }}
                  >
                    {isActive && (
                      <span className="absolute inset-0 rounded-full animate-pulse-glow" />
                    )}
                  </span>

                  {/* Label */}
                  <span
                    className={cn(
                      'flex flex-col items-center transition-all duration-300',
                      isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-80',
                    )}
                  >
                    <span
                      className={cn(
                        'font-display font-bold leading-none transition-all duration-300',
                        isActive ? 'text-lg sm:text-xl text-white' : 'text-sm sm:text-base text-white/70',
                      )}
                    >
                      {era.year}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] leading-tight whitespace-nowrap transition-all duration-300',
                        isActive ? 'text-[var(--era-text)]' : 'text-white/40',
                      )}
                    >
                      {era.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
