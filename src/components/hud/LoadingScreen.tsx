interface LoadingScreenProps {
  visible: boolean;
  message?: string;
}

/**
 * Loading overlay shown while the WebGL scene initializes. Also used to
 * surface WebGL-unavailable and fallback states via `message`.
 */
export function LoadingScreen({ visible, message }: LoadingScreenProps) {
  if (!visible && !message) {
    return null;
  }
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-card">
        <div className="loading-spinner" aria-hidden="true" />
        <p>{message ?? 'Brewing the café…'}</p>
      </div>
    </div>
  );
}
