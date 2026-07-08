'use client';

import React, { useMemo } from 'react';
import { Period, PERIOD_CONFIGS } from '../PeriodConfig';

// Wooden Booth (1945)
function WoodenBooth({ color }: { color: string }) {
  return (
    <group position={[-5, 0, 0]}>
      {/* Booth seat */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.5, 1.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 1.2, -0.45]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.5, 0.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Table */}
      <mesh position={[0, 1, 1.8]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.2]} />
        <meshStandardMaterial color="#a0522d" />
      </mesh>
    </group>
  );
}

// Plastic Booth (1965)
function PlasticBooth({ color }: { color: string }) {
  return (
    <group position={[-5, 0, 0]}>
      {/* Booth seat - curved plastic */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.4, 1.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Backrest - curved */}
      <mesh position={[0, 1, -0.45]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.2, 0.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Table - formica */}
      <mesh position={[0, 0.9, 1.8]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.1, 1.6]} />
        <meshStandardMaterial color="#9370db" />
      </mesh>
    </group>
  );
}

// Neon Style Booth (1985)
function NeonBooth({ color }: { color: string }) {
  return (
    <group position={[-5, 0, 0]}>
      {/* Booth base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.3, 1.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Backrest - angular */}
      <mesh position={[0, 1, -0.45]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.4, 0.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Table - glass top with neon base */}
      <mesh position={[0, 1, 2]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.1, 1.6]} />
        <meshStandardMaterial color="#00ffff" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}

// Modern Metal/Glass Booth (2005)
function ModernBooth({ color }: { color: string }) {
  return (
    <group position={[-5, 0, 0]}>
      {/* Seat - metal base */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.35, 1.5]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Backrest - metal frame */}
      <mesh position={[0, 1, -0.45]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.2, 0.15]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Table - glass */}
      <mesh position={[0, 0.85, 1.8]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.05, 1.6]} />
        <meshStandardMaterial color="#c0c0c0" opacity={0.5} transparent metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// Smart Furniture (2055)
function SmartBooth({ color }: { color: string }) {
  return (
    <group position={[-5, 0, 0]}>
      {/* Seat - holographic surface */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.3, 1.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.8} />
      </mesh>
      {/* Backrest - flexible display */}
      <mesh position={[0, 1, -0.45]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.2, 0.15]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.8} />
      </mesh>
      {/* Table - interactive surface */}
      <mesh position={[0, 0.8, 1.8]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.05, 1.6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.9} />
      </mesh>
    </group>
  );
}

// Wooden Table
function WoodenTable({ color }: { color: string }) {
  return (
    <mesh position={[5, 0.8, 2]} castShadow receiveShadow>
      <cylinderGeometry args={[1, 1, 0.1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Chair
function Chair({ color, period }: { color: string; period: Period }) {
  const materials = {
    1945: { metalness: 0.2, roughness: 0.8 },
    1965: { metalness: 0.1, roughness: 0.9 },
    1985: { metalness: 0.3, roughness: 0.7, emissive: color, emissiveIntensity: 0.2 },
    2005: { metalness: 0.5, roughness: 0.5 },
    2025: { metalness: 0.4, roughness: 0.6 },
    2055: { metalness: 0.8, roughness: 0.2, emissive: color, emissiveIntensity: 0.5 },
  };

  const material = materials[period];

  return (
    <group position={[5, 0, 3]}>
      {/* Seat */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshStandardMaterial {...material} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 1.5, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.1, 0.1]} />
        <meshStandardMaterial {...material} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.4, 0.4, -0.4]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.8]} />
        <meshStandardMaterial {...material} />
      </mesh>
      <mesh position={[0.4, 0.4, -0.4]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.8]} />
        <meshStandardMaterial {...material} />
      </mesh>
      <mesh position={[-0.4, 0.4, 0.4]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.8]} />
        <meshStandardMaterial {...material} />
      </mesh>
      <mesh position={[0.4, 0.4, 0.4]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.8]} />
        <meshStandardMaterial {...material} />
      </mesh>
    </group>
  );
}

export function CafeFurniture({ period }: { period: Period }) {
  const config = PERIOD_CONFIGS[period];
  
  const booth = useMemo(() => {
    const boothProps = { color: config.furniture.boothMaterial };
    
    switch (config.furniture.boothStyle) {
      case 'wooden':
        return <WoodenBooth {...boothProps} />;
      case 'plastic':
        return <PlasticBooth {...boothProps} color={config.furniture.boothMaterial} />;
      case 'metal':
        return <ModernBooth {...boothProps} />;
      case 'smart':
        return <SmartBooth {...boothProps} />;
      default:
        return <WoodenBooth {...boothProps} />;
    }
  }, [period, config]);

  return (
    <>
      {booth}
      <WoodenTable color={config.furniture.tableMaterial} />
      <Chair color={config.furniture.chairColor} period={period} />
    </>
  );
}