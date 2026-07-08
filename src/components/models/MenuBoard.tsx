'use client';

import React, { useMemo } from 'react';
import { Period, PERIOD_CONFIGS } from '../PeriodConfig';

// Menu board base component
function MenuBoardBase({ 
  period, 
  items, 
  backgroundColor, 
  textColor,
  fontStyle 
}: {
  period: Period;
  items: Array<{ name: string; price: string; description?: string }>;
  backgroundColor: string;
  textColor: string;
  fontStyle: string;
}) {
  const fontFamilies = {
    vintage: '"Courier New", monospace',
    modern: 'Inter, system-ui',
    futuristic: '"Orbitron", sans-serif',
  };

  return (
    <group position={[0, 3, -9.9]}>
      {/* Back panel */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color={backgroundColor} />
      </mesh>
      
      {/* Menu items - using simple 3D text representation */}
      {items.map((item, index) => (
        <group key={index} position={[-3.5, 1.5 - index * 0.8, 0.11]}>
          {/* Item name plate */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.5, 0.3, 0.02]} />
            <meshStandardMaterial color={backgroundColor} />
          </mesh>
          {/* Price plate */}
          <mesh position={[2.5, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.3, 0.02]} />
            <meshStandardMaterial color={backgroundColor} />
          </mesh>
          {/* Decorative border */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.01, 0.35, 0.02]} />
            <meshStandardMaterial color={textColor} emissive={textColor} emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
      
      {/* Period-specific decorations */}
      {period === 1985 && (
        <group>
          <mesh position={[3, -1, 0.11]}>
            <boxGeometry args={[0.5, 0.5, 0.02]} />
            <meshStandardMaterial color="#0fff0f" emissive="#0fff0f" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}
      
      {period === 2055 && (
        <group>
          <mesh position={[0, -1.5, 0.11]}>
            <ringGeometry args={[0.5, 0.8, 16]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 1945 Menu Board - Chalkboard style
function VintageMenuBoard({ config }: { config: typeof PERIOD_CONFIGS[1945] }) {
  return (
    <MenuBoardBase
      period={1945}
      items={config.menu.items}
      backgroundColor="#2f1b0c"
      textColor="#ffffff"
      fontStyle="vintage"
    />
  );
}

// 1965 Menu Board - Bright modern
function HippieMenuBoard({ config }: { config: typeof PERIOD_CONFIGS[1965] }) {
  return (
    <MenuBoardBase
      period={1965}
      items={config.menu.items}
      backgroundColor="#ffebf0"
      textColor="#4a004e"
      fontStyle="modern"
    />
  );
}

// 1985 Menu Board - Neon
function NeonMenuBoard({ config }: { config: typeof PERIOD_CONFIGS[1985] }) {
  return (
    <MenuBoardBase
      period={1985}
      items={config.menu.items}
      backgroundColor="#000000"
      textColor="#0fff0f"
      fontStyle="modern"
    />
  );
}

// 2005 Menu Board - Digital
function DigitalMenuBoard({ config }: { config: typeof PERIOD_CONFIGS[2005] }) {
  return (
    <group position={[0, 3, -9.9]}>
      {/* LCD Screen */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[8, 4, 0.3]} />
        <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Screen content */}
      <mesh position={[0, 0, 0.16]}>
        <boxGeometry args={[7.8, 3.8, 0.01]} />
        <meshStandardMaterial color="#ffffff" opacity={0.1} transparent />
      </mesh>
    </group>
  );
}

// 2025 Menu Board - Modern LED
function LEDMenuBoard({ config }: { config: typeof PERIOD_CONFIGS[2025] }) {
  return (
    <group position={[0, 3, -9.9]}>
      {/* LED Display */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[8, 4, 0.2]} />
        <meshStandardMaterial color="#1e293b" emissive="#0ea5e9" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

// 2055 Menu Board - Holographic
function HolographicMenuBoard({ config }: { config: typeof PERIOD_CONFIGS[2055] }) {
  return (
    <group position={[0, 3, -9.9]}>
      {/* Holographic projection */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8, 4, 0.1]} />
        <meshStandardMaterial 
          color="#0891b2" 
          emissive="#22d3ee" 
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Projection rings */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0, -0.2 - i * 0.1]}>
          <ringGeometry args={[3 + i * 0.5, 3.5 + i * 0.5, 32]} />
          <meshStandardMaterial 
            color="#22d3ee" 
            emissive="#22d3ee" 
            emissiveIntensity={0.3 - i * 0.1}
            transparent
            opacity={0.5 - i * 0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

export function MenuBoard({ period }: { period: Period }) {
  const config = PERIOD_CONFIGS[period];
  
  const menu = useMemo(() => {
    switch (period) {
      case 1945:
        return <VintageMenuBoard config={config} />;
      case 1965:
        return <HippieMenuBoard config={config} />;
      case 1985:
        return <NeonMenuBoard config={config} />;
      case 2005:
        return <DigitalMenuBoard config={config} />;
      case 2025:
        return <LEDMenuBoard config={config} />;
      case 2055:
        return <HolographicMenuBoard config={config} />;
      default:
        return <VintageMenuBoard config={config} />;
    }
  }, [period, config]);

  return <>{menu}</>;
}