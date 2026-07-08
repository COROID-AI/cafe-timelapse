'use client';

import React, { useMemo } from 'react';
import { Period, PERIOD_CONFIGS } from '../PeriodConfig';

// Note: These components intentionally use the JSX elements provided by
// react-three-fiber (@react-three/fiber) without relying on custom intrinsic
// typings.

function CoffeeCup({ position, cupStyle }: { position: [number, number, number]; cupStyle: Period extends never ? never : string }) {
  const cupColors: Record<string, string> = {
    vintage: '#ffffff',
    modern: '#f0f0f0',
    minimal: '#ffffff',
    futuristic: '#ccfbff',
  };

  const saucerColors: Record<string, string> = {
    vintage: '#dddddd',
    modern: '#e0e0e0',
    minimal: '#ffffff',
    futuristic: '#67e8f9',
  };

  const materialProps = useMemo(() => {
    switch (cupStyle) {
      case 'futuristic':
        return {
          color: cupColors.futuristic,
          roughness: 0.1,
          metalness: 0.5,
          emissive: '#22d3ee',
          emissiveIntensity: 0.3,
        };
      case 'vintage':
        return { color: cupColors.vintage, roughness: 0.5, metalness: 0 };
      case 'minimal':
        return { color: cupColors.minimal, roughness: 0.2, metalness: 0 };
      case 'modern':
      default:
        return { color: cupColors.modern, roughness: 0.3, metalness: 0.1 };
    }
  }, [cupStyle]);

  const saucerColor = saucerColors[cupStyle] || '#ffffff';

  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 0.3]} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.28, 0.3, 0.03]} />
        <meshStandardMaterial color={saucerColor} />
      </mesh>
      <mesh position={[0, 0.31, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02]} />
        <meshStandardMaterial color="#4b2e2e" />
      </mesh>
    </group>
  );
}

function Teaspoon({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.4]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function Napkin({ position, period }: { position: [number, number, number]; period: Period }) {
  const napkinColors: Record<Period, string> = {
    1945: '#ffffff',
    1965: '#ffb6c1',
    1985: '#00ffff',
    2005: '#f0f0f0',
    2025: '#e0f2fe',
    2055: '#67e8f9',
  };

  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[0.3, 0.3]} />
        <meshStandardMaterial color={napkinColors[period]} transparent opacity={period === 2055 ? 0.6 : 0.9} />
      </mesh>
    </group>
  );
}

export function Tableware({ period }: { period: Period }) {
  const config = PERIOD_CONFIGS[period];

  const tablewarePositions: [number, number, number][] = [
    [5, 1.85, 2],
    [-5, 1.85, 0],
  ];

  return (
    <>
      {tablewarePositions.map((pos, index) => (
        <group key={index}>
          <CoffeeCup position={[pos[0], pos[1], pos[2]]} cupStyle={config.tableware.cupStyle} />
          <Teaspoon position={[pos[0] + 0.3, pos[1], pos[2]]} />
          <Napkin position={[pos[0] - 0.3, pos[1], pos[2]]} period={period} />
        </group>
      ))}
    </>
  );
}
