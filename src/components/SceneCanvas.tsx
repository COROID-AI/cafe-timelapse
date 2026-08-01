import { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { CameraControls } from './CameraControls';
import { Effects } from '../three/Effects';
import { SceneRoot } from '../three/SceneRoot';
import { fogColorFor } from '../three/Atmosphere';
import { useEraTransition } from '../hooks/useEraTransition';

interface SceneCanvasProps {
  onReady?: () => void;
  walkMode?: boolean;
  resetSignal?: number;
}

/**
 * The WebGL canvas hosting the café scene. Includes a performance monitor
 * that adapts the device-pixel-ratio so the scene stays smooth on lower-end
 * hardware while remaining detailed.
 */
export function SceneCanvas({ onReady, walkMode = false, resetSignal = 0 }: SceneCanvasProps) {
  const [dpr, setDpr] = useState<number>(1.6);
  const [ready, setReady] = useState(false);

  const glProps = useMemo(
    () => ({
      antialias: true,
      powerPreference: 'high-performance' as const,
      failIfMajorPerformanceCaveat: false,
    }),
    [],
  );

  return (
    <div
      className="scene-canvas"
      role="img"
      aria-label="3D café interior. Drag to orbit, scroll to zoom, right-drag to pan."
    >
      <Canvas
        shadows="percentage"
        dpr={[1, dpr]}
        gl={glProps}
        camera={{ position: [0, 1.7, 4.2], fov: 50, near: 0.1, far: 60 }}
        onCreated={() => {
          if (!ready) {
            setReady(true);
            onReady?.();
          }
        }}
      >
        <Suspense fallback={null}>
          <PerformanceMonitor onDecline={() => setDpr((v) => Math.max(1, v - 0.3))} onIncline={() => setDpr((v) => Math.min(1.8, v + 0.1))}>
            <SceneContents walkMode={walkMode} resetSignal={resetSignal} />
          </PerformanceMonitor>
        </Suspense>
      </Canvas>
    </div>
  );
}

interface SceneContentsProps {
  walkMode: boolean;
  resetSignal: number;
}

function SceneContents({ walkMode, resetSignal }: SceneContentsProps) {
  const { from, to, progress } = useEraTransition();
  const fogColor = useMemo(() => fogColorFor(from, to, progress), [from, to, progress]);

  return (
    <>
      {/* Scene-level exponential fog that follows the era mood. */}
      <fogExp2 attach="fog" args={[fogColor, 0.13]} />
      <SceneRoot />
      <CameraControls walkMode={walkMode} resetSignal={resetSignal} />
      <Effects from={from} to={to} progress={progress} />
    </>
  );
}
