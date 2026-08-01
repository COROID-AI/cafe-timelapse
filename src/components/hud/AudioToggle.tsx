import { useCallback } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

interface AudioToggleProps {
  muted: boolean;
  onToggle: () => void;
}

/**
 * Accessible audio mute control with keyboard operability (native button).
 */
export function AudioToggle({ muted, onToggle }: AudioToggleProps) {
  const handleKey = useCallback(
    (e: ReactKeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onToggle();
      }
    },
    [onToggle],
  );

  return (
    <button
      type="button"
      className="btn audio-toggle"
      aria-pressed={!muted}
      aria-label={muted ? 'Unmute ambient audio' : 'Mute ambient audio'}
      title={muted ? 'Unmute (M)' : 'Mute (M)'}
      onClick={onToggle}
      onKeyDown={handleKey}
    >
      {muted ? '🔇 Muted' : '🔊 Sound'}
    </button>
  );
}
