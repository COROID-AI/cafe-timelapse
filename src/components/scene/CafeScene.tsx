import { useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls, PointerLockControls, ContactShadows, Stats } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEraAssets } from '../../hooks/useEraAssets';
import { useSceneStore } from '../../store/sceneStore';
import { Room } from './Room';
import { Counter } from './Counter';
import { CoffeeMachine } from './CoffeeMachine';
import { MenuBoard } from './MenuBoard';
import { Tables } from './Tables';
import { MusicSource } from './MusicSource';
import { Posters } from './Posters';
import { Patrons } from './Patrons';
import { Lighting } from './Lighting';
import { WalkControls } from './WalkControls';

declare const IS_DEV: boolean;

/**
 * R3F scene root. Mounts all café sub-components, lighting, fog, and controls.
 * The `key` on the group forces a remount on era change, which combined with the
 * DOM overlay in App provides the cross-fade effect.
 */
export function CafeScene() {
  const era = useEraAssets();
  const eraId = era.id;
  const cameraMode = useSceneStore((s) => s.cameraMode);

  return (
    <>
      <Lighting />

      {/* Era-tinted fog */}
      <fog attach="fog" args={[era.lighting.fog, era.lighting.fogNear, era.lighting.fogFar]} />

      {/* The café interior — remounts on era change for a clean swap */}
      <group key={`cafe-${eraId}`} data-era={eraId}>
        <Room />
        <Counter />
        <CoffeeMachine />
        <MenuBoard />
        <Tables />
        <MusicSource />
        <Posters />
        <Patrons />
      </group>

      {/* Soft contact shadows under furniture */}
      <ContactShadows
        position={[0, 0.01, 0]}
        scale={20}
        far={6}
        blur={2.5}
        opacity={0.35}
        resolution={512}
        color="#000000"
      />

      {/* Camera controls */}
      {cameraMode === 'orbit' ? (
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 6}
          target={[0, 1.5, 0]}
          enableDamping
          dampingFactor={0.08}
        />
      ) : (
        <>
          <WalkControls />
          <PointerLockControls />
        </>
      )}

      {/* Dev-only FPS stats */}
      {IS_DEV && <Stats />}
    </>
  );
}

/** Placeholder re-export to satisfy potential tree-shaking. */
export const _sceneHelpers = { THREE, useMemo, useFrame, useThree };
