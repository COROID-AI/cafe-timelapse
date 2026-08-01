import { useMemo } from 'react';
import type { EraConfig } from '../types/era';

interface CoffeeMachineProps {
  era: EraConfig;
  progress: number;
}

/**
 * The café's espresso machine, era-specific:
 * - 1945: brass lever machine
 * - 1965: chrome piston machine
 * - 1985: automatic machine
 * - 2005: modern espresso machine
 * - 2025: bean-to-cup automatic
 * - 2055: molecular brewer with glowing elements
 */
export function CoffeeMachine({ era, progress }: CoffeeMachineProps) {
  const variant = era.machineVariant;
  const body = useMemo(() => {
    switch (variant) {
      case 'lever':
        return '#b98a4e';
      case 'piston':
        return '#c0c4cc';
      case 'automatic':
        return '#8a2b2b';
      case 'espresso':
        return '#33373d';
      case 'bean-to-cup':
        return '#20242a';
      case 'molecular':
        return '#a8c8ff';
    }
  }, [variant]);

  const glow = variant === 'molecular' || variant === 'automatic';
  const scale = 0.85 + progress * 0.05;

  return (
    <group position={[-2.4, 1.12, -2.75]} scale={scale}>
      {/* Base */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.24, 0.55]} />
        <meshStandardMaterial color={body} roughness={0.35} metalness={0.55} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.82, 0.42, 0.5]} />
        <meshStandardMaterial color={body} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Group head */}
      <mesh position={[0.18, 0.62, 0.08]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.18, 14]} />
        <meshStandardMaterial color={variant === 'molecular' ? '#7fb2ff' : '#d8d8dc'} roughness={0.25} metalness={0.7} />
      </mesh>
      {/* Portafilter handle */}
      <mesh position={[0.4, 0.6, 0.08]} rotation={[0, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color="#3a2c1c" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Steam wand */}
      <mesh position={[-0.3, 0.6, 0.05]} rotation={[0, 0, 0.8]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.34, 8]} />
        <meshStandardMaterial color="#d8d8dc" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Drip tray */}
      <mesh position={[0, 0.02, 0.1]}>
        <boxGeometry args={[0.6, 0.04, 0.3]} />
        <meshStandardMaterial color="#9aa0a8" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Era-specific details */}
      {variant === 'lever' ? (
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.28, 10]} />
          <meshStandardMaterial color="#8a6a3a" roughness={0.5} metalness={0.4} />
        </mesh>
      ) : null}
      {variant === 'molecular' ? (
        <>
          <mesh position={[0, 0.66, 0.18]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshBasicMaterial color="#7fd4ff" />
          </mesh>
          <pointLight position={[0, 0.7, 0.3]} intensity={0.8} color="#7fd4ff" distance={2} decay={2} />
        </>
      ) : null}
      {glow ? (
        <mesh position={[0, 0.5, 0.26]}>
          <planeGeometry args={[0.5, 0.1]} />
          <meshBasicMaterial color="#ffd27f" transparent opacity={0.9} />
        </mesh>
      ) : null}
    </group>
  );
}
