import { useEraStore } from "../state/eraStore";
import { userToggleSound } from "../hooks/useKeyboardShortcuts";

const VIEWS = [
  { id: "default", label: "Overview" },
  { id: "closeup", label: "Espresso bar" },
  { id: "wide", label: "Wide orbit" },
] as const;

/** Camera presets + gesture-safe sound toggle cluster (bottom right). */
export default function ViewControls() {
  const viewPreset = useEraStore((s) => s.viewPreset);
  const setViewPreset = useEraStore((s) => s.setViewPreset);
  const audioEnabled = useEraStore((s) => s.audioEnabled);

  return (
    <div className="panel views" aria-label="View and sound controls">
      <div role="group" aria-label="Camera preset" className="views-group">
        {VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            className="btn"
            aria-pressed={viewPreset === view.id}
            onClick={() => setViewPreset(view.id)}
          >
            {view.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn sound-btn"
        aria-pressed={audioEnabled}
        onClick={userToggleSound}
      >
        {audioEnabled ? "🔊 Sound on" : "🔇 Sound off"}
      </button>
      <ul className="keys" aria-hidden="true">
        <li><kbd>M</kbd> sound</li>
        <li><kbd>P</kbd> play</li>
        <li><kbd>R</kbd> reset view</li>
      </ul>
    </div>
  );
}
