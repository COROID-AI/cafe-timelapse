import { Html, useProgress } from '@react-three/drei';

/**
 * Loading screen shown while procedural assets (textures, fonts) initialize.
 * Rendered inside a Suspense boundary within the Canvas.
 */
export function LoadingScreen() {
  // This component is only active while the scene is suspended.
  // We hook into Drei's useProgress to display a percentage.
  const { progress, active } = useProgress();

  if (!active && progress >= 100) return null;

  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[var(--era-accent)]" />
        <span className="text-sm text-white/60">{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}
