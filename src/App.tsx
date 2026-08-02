import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { CafeScene } from './components/CafeScene';
import { Timeline } from './components/Timeline';
import { Hud } from './components/Hud';
import { useStore } from './store/useStore';
import { useAudio } from './hooks/useAudio';
import { ERA_MAP } from './data/eras';

function SceneCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 55, near: 0.1, far: 80, position: [0, 3.2, 11.2] }}
    >
      <Suspense fallback={null}>
        <CafeScene />
      </Suspense>
    </Canvas>
  );
}

export default function App() {
  useAudio();
  const era = useStore((s) => s.era);
  const transition = useStore((s) => s.transition);
  const activeId = transition.phase === 'fading' ? transition.toEra : era;
  const active = ERA_MAP[activeId];

  return (
    <div className="app">
      <SceneCanvas />
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__logo">☕</span>
          <span className="topbar__name">Café Time Period Timelapse</span>
        </div>
        <Timeline />
        <div className="topbar__right">
          <span className="topbar__year">{active.label}</span>
        </div>
      </header>
      <Hud />
      <footer className="footer">
        <span>{active.tagline}</span>
        <span className="footer__sep">·</span>
        <span>Drag to orbit · scroll to zoom · right-drag to pan</span>
      </footer>
    </div>
  );
}
