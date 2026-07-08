import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { useSceneStore } from './store/sceneStore';
import { useEraAssets } from './hooks/useEraAssets';
import { useAudio } from './hooks/useAudio';
import { CafeScene } from './components/scene/CafeScene';
import { Timeline } from './components/hud/Timeline';
import { EraInfoPanel } from './components/hud/EraInfoPanel';
import { AudioControls } from './components/hud/AudioControls';
import { CameraControls } from './components/hud/CameraControls';
import { Intro } from './components/hud/Intro';
import { LoadingScreen } from './components/scene/LoadingScreen';

/**
 * Inner component that uses era data and applies CSS variables to :root.
 */
function EraThemeProvider({ children }: { children: React.ReactNode }) {
  const era = useEraAssets();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--era-primary', era.palette.primary);
    root.style.setProperty('--era-secondary', era.palette.secondary);
    root.style.setProperty('--era-accent', era.palette.accent);
    root.style.setProperty('--era-text', era.palette.text);
    root.style.setProperty('--era-bg', era.palette.bg);
  }, [era]);

  return <>{children}</>;
}

function AppContent() {
  useAudio();
  const activeEraId = useSceneStore((s) => s.activeEraId);

  return (
    <EraThemeProvider>
      {/* 3D Scene — full bleed */}
      <div className="fixed inset-0" data-era={activeEraId} data-testid="scene-root">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: 2, // ACESFilmicToneMapping
            toneMappingExposure: 1.0,
          }}
          camera={{ position: [8, 5, 10], fov: 50, near: 0.1, far: 100 }}
        >
          <Suspense fallback={null}>
            <CafeScene />
          </Suspense>
        </Canvas>
      </div>

      {/* Loading overlay (shown until Suspense resolves) */}
      <Suspense fallback={null}>
        <LoadingScreen />
      </Suspense>

      {/* HUD overlay */}
      <div className="pointer-events-none fixed inset-0 z-20">
        <Timeline />
        <EraInfoPanel />
        <CameraControls />
        <AudioControls />
      </div>

      {/* Intro overlay */}
      <Intro />
    </EraThemeProvider>
  );
}

export default function App() {
  return <AppContent />;
}
