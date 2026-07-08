'use client';

import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Html, useProgress } from '@react-three/drei';
import { useTimePeriodStore } from '@/lib/store';
import { Period, PERIOD_CONFIGS } from './PeriodConfig';
import { CoffeeEquipment } from './models/CoffeeEquipment';
import { CafeFurniture } from './models/CafeFurniture';
import { MenuBoard } from './models/MenuBoard';
import { Patrons } from './models/Patrons';
import { Decor } from './models/Decor';
import { Tableware } from './models/Tableware';
import { useAudio } from './audio/AudioManager';

// Loading component
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-center">
        <div className="text-2xl mb-2">Loading Café...</div>
        <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm mt-2">{Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

// Lighting component that changes with period
function CafeLighting({ period }: { period: Period }) {
  const config = PERIOD_CONFIGS[period];
  
  return (
    <>
      <ambientLight 
        color={config.lighting.ambientColor} 
        intensity={config.lighting.ambientIntensity} 
      />
      <directionalLight
        position={[10, 10, 5]}
        color={config.lighting.directionalColor}
        intensity={config.lighting.directionalIntensity}
        castShadow
      />
      <directionalLight
        position={[-10, 5, -5]}
        color={config.lighting.fillColor}
        intensity={0.5}
      />
    </>
  );
}

// Floor component
function CafeFloor({ period }: { period: Period }) {
  const floorColors: Record<Period, string> = {
    1945: '#8b4513', // Wood floor
    1965: '#2d2d2d', // Dark tile
    1985: '#1a1a1a', // Black/white tile
    2005: '#2f4f4f', // Slate tile
    2025: '#1e293b', // Modern dark
    2055: '#083d77', // Futuristic dark blue
  };

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 30]} />
      <meshStandardMaterial color={floorColors[period]} roughness={0.8} metalness={0.2} />
    </mesh>
  );
}

// Walls component
function CafeWalls({ period }: { period: Period }) {
  const wallColors: Record<Period, string> = {
    1945: '#f5f5dc', // Cream
    1965: '#ffb6c1', // Light pink
    1985: '#2d2d2d', // Dark gray
    2005: '#e0e0e0', // Light gray
    2025: '#1e293b', // Modern blue-gray
    2055: '#0891b2', // Futuristic cyan
  };

  return (
    <>
      {/* Back wall */}
      <mesh position={[0, 5, -15]} receiveShadow>
        <planeGeometry args={[50, 10]} />
        <meshStandardMaterial color={wallColors[period]} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-25, 5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color={wallColors[period]} />
      </mesh>
      {/* Right wall */}
      <mesh position={[25, 5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color={wallColors[period]} />
      </mesh>
    </>
  );
}

// Counter component
function CafeCounter({ period }: { period: Period }) {
  const config = PERIOD_CONFIGS[period];
  const counterWidth = 20;
  const counterHeight = 1;
  const counterDepth = 2;

  return (
    <group position={[0, 0.5, -10]}>
      {/* Main counter */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[counterWidth, counterHeight, counterDepth]} />
        <meshStandardMaterial 
          color={config.counter.color} 
          metalness={config.counter.technology === 'biometric' ? 0.8 : 0.3}
          roughness={config.counter.technology === 'biometric' ? 0.2 : 0.7}
        />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, counterHeight / 2 + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[counterWidth, 0.2, counterDepth + 0.1]} />
        <meshStandardMaterial 
          color={config.counter.technology === 'biometric' ? '#22d3ee' : '#8b4513'}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

// Main Cafe Scene
export function CafeScene() {
  const currentPeriod = useTimePeriodStore((state) => state.currentPeriod);
  const completeTransition = useTimePeriodStore((state) => state.completeTransition);

  // Transition animation
  useEffect(() => {
    const timer = setTimeout(() => {
      completeTransition();
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentPeriod, completeTransition]);

  return (
    <div className="w-full h-screen">
      <Canvas 
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 5, 20], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={<Loader />}>
          <CafeLighting period={currentPeriod} />
          <CafeFloor period={currentPeriod} />
          <CafeWalls period={currentPeriod} />
          <CafeCounter period={currentPeriod} />
          
          {/* 3D Model Components */}
          <CoffeeEquipment period={currentPeriod} />
          <CafeFurniture period={currentPeriod} />
          <MenuBoard period={currentPeriod} />
          <Patrons period={currentPeriod} />
          <Decor period={currentPeriod} />
          <Tableware period={currentPeriod} />
          
          <Environment preset="apartment" />
        </Suspense>
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={10}
          maxDistance={40}
        />
      </Canvas>
    </div>
  );
}