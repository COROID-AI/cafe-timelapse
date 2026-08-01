/**
 * Controls hint overlay: how to navigate, reset the view, toggle walk mode,
 * and use keyboard shortcuts.
 */
export function ControlsHint() {
  return (
    <div className="controls-hint" role="note" aria-label="Controls help">
      <p>
        <strong>Drag</strong> orbit · <strong>Scroll</strong> zoom · <strong>Right-drag</strong> pan
      </p>
      <p>
        <strong>1–6</strong> eras · <strong>M</strong> mute · <strong>R</strong> reset view · <strong>W</strong> walk mode
      </p>
    </div>
  );
}
