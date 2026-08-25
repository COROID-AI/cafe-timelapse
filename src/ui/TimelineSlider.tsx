import { ERA_YEARS } from "../eras/eraConfig";
import { getAllEraConfigs } from "../eras/eraConfig";
import { useEraStore } from "../state/eraStore";

/**
 * AC5 timeline: semantic range input pinned to six stops at the top of
 * the experience. Dragging snaps (step=1), year labels are clickable,
 * ← → step natively when focused, digits 1–6 work globally, and Play
 * auto-advances through all years with looping (interval lives in App).
 * An aria-live region announces every selection.
 */
export default function TimelineSlider() {
  const eraIndex = useEraStore((s) => s.eraIndex);
  const setEra = useEraStore((s) => s.setEra);
  const playMode = useEraStore((s) => s.playMode);
  const togglePlay = useEraStore((s) => s.togglePlay);

  const configs = getAllEraConfigs();
  const current = configs[eraIndex];

  return (
    <section className="panel timeline" aria-label="Café timeline">
      <div className="timeline-head">
        <h1>Café Time Period Timelapse</h1>
        <button
          type="button"
          className={`btn play-btn${playMode ? " active" : ""}`}
          aria-pressed={playMode}
          onClick={togglePlay}
        >
          {playMode ? "⏸ Pause eras" : "▶ Play eras"}
        </button>
      </div>

      <input
        className="era-range"
        type="range"
        min={0}
        max={ERA_YEARS.length - 1}
        step={1}
        value={eraIndex}
        onChange={(event) => setEra(Number(event.target.value))}
        aria-label="Select café year"
        aria-valuetext={`${current.year} — ${current.label}`}
        list="era-tick-marks"
      />
      <datalist id="era-tick-marks">
        {configs.map((config, index) => (
          <option key={config.year} value={index} label={String(config.year)} />
        ))}
      </datalist>

      <div className="ticks" role="group" aria-label="Jump to a year">
        {configs.map((config, index) => (
          <button
            key={config.year}
            type="button"
            className={`tick${index === eraIndex ? " current" : ""}`}
            aria-current={index === eraIndex}
            onClick={() => setEra(index)}
          >
            {config.year}
          </button>
        ))}
      </div>

      <p role="status" className="sr-only">
        {`Selected ${current.year}, ${current.label}. ${current.tagline}`}
      </p>
      <p className="hint">Drag the slider · click a year · keys ← → or 1–6</p>
    </section>
  );
}
