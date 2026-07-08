'use client';

import React, { useMemo } from 'react';
import { Period, PERIOD_CONFIGS } from '../PeriodConfig';

// Poster component
function Poster({ 
  position, 
  posterType,
  period 
}: { 
  position: [number, number, number]; 
  posterType: string;
  period: Period;
}) {
  const posterColors: Record<string, string> = {
    'war-bonds': '#8b4513',
    'victory-garden': '#228b22',
    'beatles': '#ff69b4',
    'rolling-stones': '#ffa500',
    'mtv': '#ff0000',
    'ipod': '#ffffff',
    'climate-awareness': '#0ea5e9',
    'crypto-coffee': '#facc15',
  };

  const posterTexts: Record<string, string> = {
    'war-bonds': 'WAR BONDS',
    'victory-garden': 'VICTORY GARDEN',
    'beatles': 'THE BEATLES',
    'rolling-stones': 'ROLLING STONES',
    'mtv': 'MTV',
    'ipod': 'iPod',
    'climate-awareness': 'CLIMATE ACTION',
    'crypto-coffee': 'ETH COFFEE',
  };

  return (
    <group position={position}>
      {/* Poster background */}
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2, 3]} />
        <meshStandardMaterial 
          color={posterColors[posterType] || '#ffffff'} 
          emissive={period === 1985 || period === 2055 ? posterColors[posterType] : '#000000'}
          emissiveIntensity={period === 1985 || period === 2055 ? 0.5 : 0}
        />
      </mesh>
    </group>
  );
}

// Lighting fixtures
function LightingFixture({ 
  position,
  lightingType,
  period 
}: { 
  position: [number, number, number]; 
  lightingType: string;
  period: Period;
}) {
  switch (lightingType) {
    case 'incandescent':
      return (
        <group position={position}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color="#f5deb3" emissive="#ffdead" emissiveIntensity={0.3} />
          </mesh>
        </group>
      );
    case 'fluorescent':
      return (
        <group position={position}>
          <mesh>
            <boxGeometry args={[3, 0.1, 0.1]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        </group>
      );
    case 'neon':
      return (
        <group position={position}>
          <mesh>
            <boxGeometry args={[3, 0.15, 0.05]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    case 'led':
      return (
        <group position={position}>
          <mesh>
            <boxGeometry args={[2, 0.05, 0.5]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.4} />
          </mesh>
        </group>
      );
    case 'holographic':
      return (
        <group position={position}>
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.6} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.5 + i * 0.3, 0]}>
              <torusGeometry args={[0.5 + i * 0.2, 0.02, 16, 32]} />
              <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.4 - i * 0.1} transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
}

// Signage
function Sign({ 
  position,
  period,
  text 
}: { 
  position: [number, number, number]; 
  period: Period;
  text: string;
}) {
  const signColors: Record<Period, string> = {
    1945: '#8b4513',
    1965: '#ff1493',
    1985: '#00ffff',
    2005: '#ffffff',
    2025: '#0ea5e9',
    2055: '#22d3ee',
  };

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[3, 1, 0.2]} />
        <meshStandardMaterial 
          color={signColors[period]} 
          emissive={period === 1985 || period === 2055 ? signColors[period] : '#000000'}
          emissiveIntensity={period === 1985 || period === 2055 ? 0.5 : 0}
        />
      </mesh>
    </group>
  );
}

export function Decor({ period }: { period: Period }) {
  const config = PERIOD_CONFIGS[period];
  
  const posters = useMemo(() => {
    return config.decor.posters.map((poster, index) => ({
      position: [-15 + index * 10, 4, -14.9] as [number, number, number],
      poster: poster,
    }));
  }, [period, config]);

  const ads = useMemo(() => {
    return config.decor.advertisements.map((ad, index) => ({
      position: [15, 4, -10 + index * 5] as [number, number, number],
      ad: ad,
    }));
  }, [period, config]);

  return (
    <>
      {/* Posters on back wall */}
      {posters.map((p, idx) => (
        <Poster 
          key={idx} 
          position={p.position} 
          posterType={p.poster} 
          period={period}
        />
      ))}
      
      {/* Lighting fixtures on ceiling */}
      <LightingFixture 
        position={[0, 9, 0]} 
        lightingType={config.decor.lightingType}
        period={period}
      />
      
      {/* Café sign */}
      <Sign 
        position={[0, 6, -14.9]} 
        period={period}
        text="CAFÉ"
      />
    </>
  );
}