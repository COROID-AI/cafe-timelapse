'use client';

import React, { useMemo } from 'react';
import { Period, PERIOD_CONFIGS } from '../PeriodConfig';
import { Mesh, Group } from 'three';
import { useTimePeriodStore } from '@/lib/store';

// Manual Espresso Machine (1945)
function ManualEspresso({ color }: { color: string }) {
  return (
    <group position={[0, 1.5, -9]}>
      {/* Main body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 2]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Lever handle */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[1.5, 0.2, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Steam wand */}
      <mesh position={[0.7, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.5]} />
        <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -1.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.2]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// Drip Coffee Maker (1965)
function DripCoffeeMaker({ color }: { color: string }) {
  return (
    <group position={[0, 1, -9]}>
      {/* Main body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 1.5]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Glass carafe */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 1]} />
        <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
      </mesh>
      {/* Heating plate */}
      <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.1]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// Moka Pot (1985)
function MokaPot({ color }: { color: string }) {
  return (
    <group position={[0, 1.2, -9]}>
      {/* Main pot */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.8, 1.2]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.5, 0.08, 16, 32]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Knob */}
      <mesh position={[0.7, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ff0000" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Automatic Coffee Machine (2005)
function AutomaticCoffeeMachine({ color }: { color: string }) {
  return (
    <group position={[0, 1, -9]}>
      {/* Main body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 2, 1]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Digital display */}
      <mesh position={[0, 0.5, 0.51]} castShadow>
        <planeGeometry args={[0.8, 0.3]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.3} />
      </mesh>
      {/* Water reservoir */}
      <mesh position={[0, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.8]} />
        <meshStandardMaterial color="#ffffff" opacity={0.2} transparent />
      </mesh>
      {/* Buttons */}
      <mesh position={[-0.3, -0.2, 0.51]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#ff69b4" />
      </mesh>
      <mesh position={[0, -0.2, 0.51]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#00ffff" />
      </mesh>
      <mesh position={[0.3, -0.2, 0.51]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#ffff00" />
      </mesh>
    </group>
  );
}

// Smart Coffee Machine (2025)
function SmartCoffeeMachine({ color }: { color: string }) {
  return (
    <group position={[0, 1, -9]}>
      {/* Main body - sleek */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.8, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Touch screen */}
      <mesh position={[0, 0.3, 0.41]} castShadow>
        <planeGeometry args={[0.9, 1]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.2} />
      </mesh>
      {/* Grinder */}
      <mesh position={[-0.4, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.3]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Steam wand */}
      <mesh position={[0.3, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

// Automated Brewing System (2055)
function AutomatedBrewingSystem({ color }: { color: string }) {
  return (
    <group position={[0, 1, -9]}>
      {/* Main column */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 3]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} emissive="#22d3ee" emissiveIntensity={0.1} />
      </mesh>
      {/* Holographic display */}
      <mesh position={[0, 1, 0]} castShadow>
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.5} transparent opacity={0.7} />
      </mesh>
      {/* Dispensing arms */}
      <mesh position={[0, -0.5, 0.7]} rotation={[0, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, -0.5, -0.7]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Base platform */}
      <mesh position={[0, -1.8, 0]} receiveShadow>
        <cylinderGeometry args={[1, 1, 0.2]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function CoffeeEquipment({ period }: { period: Period }) {
  const config = PERIOD_CONFIGS[period];
  
  const equipment = useMemo(() => {
    switch (config.coffeeEquipment.type) {
      case 'manual-espresso':
        return <ManualEspresso color={config.coffeeEquipment.color} />;
      case 'drip':
        return <DripCoffeeMaker color={config.coffeeEquipment.color} />;
      case 'moka':
        return <MokaPot color={config.coffeeEquipment.color} />;
      case 'automatic':
        return <AutomaticCoffeeMachine color={config.coffeeEquipment.color} />;
      case 'smart':
        return <SmartCoffeeMachine color={config.coffeeEquipment.color} />;
      case 'automated':
        return <AutomatedBrewingSystem color={config.coffeeEquipment.color} />;
      default:
        return null;
    }
  }, [period, config]);

  return <>{equipment}</>;
}