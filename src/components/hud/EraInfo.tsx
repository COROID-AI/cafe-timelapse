import { ERAS } from '../../data/eras';
import { useEraStore } from '../../store/useEraStore';
import { useEraTransition } from '../../hooks/useEraTransition';

/**
 * Current era information: label, tagline and a transition progress readout.
 */
export function EraInfo() {
  const targetEra = useEraStore((s) => s.targetEra);
  const { progress, from, to } = useEraTransition();
  const era = ERAS[targetEra];
  const pct = Math.round(progress * 100);

  const transitioning = progress < 1;

  return (
    <div className="era-info" role="status" aria-live="polite">
      <h2 className="era-title">
        <span className="era-year">{era.label}</span>
        <span className="era-tagline">{era.tagline}</span>
      </h2>
      {transitioning ? (
        <div className="era-progress" aria-label={`Transitioning from ${from.label} to ${to.label}`}>
          <div
            className="era-progress-bar"
            style={{ transform: `scaleX(${progress})` }}
            aria-hidden="true"
          />
          <span className="era-progress-text">
            {from.label} → {to.label} · {pct}%
          </span>
        </div>
      ) : null}
    </div>
  );
}
