'use client';

import React, { useMemo } from 'react';
import { Period, PERIOD_CONFIGS } from '../PeriodConfig';
import * as THREE from 'three';

// Patron base with period-appropriate styling
function Patron({ 
  position, 
  outfit, 
  hairstyle, 
  gadget,
  period 
}: { 
  position: [number, number, number]; 
  outfit: string;
  hairstyle: string;
  gadget?: string;
  period: Period;
}) {
  const outfitColors: Record<Period, string> = {
    1945: '#2c1810', // Dark brown
    1965: '#ff69b4', // Hot pink
    1985: '#00ffff', // Cyan
    2005: '#2f4f4f', // Slate gray
    2025: '#38bdf8', // Bright blue
    2055: '#22d3ee', // Cyan
  };

  const hairColors: Record<Period, string> = {
    1945: '#2c1810',
    1965: '#4b0082', // Indigo
    1985: '#ff00ff', // Magenta
    2005: '#000000',
    2025: '#666666',
    2055: '#22d3ee', // Chrome/silver
  };

  // Head
  const headGeometry = useMemo(() => {
    if (period === 2055 && hairstyle.includes('neon')) {
      return <sphereGeometry args={[0.3, 16, 16]} />;
    }
    return <sphereGeometry args={[0.25, 16, 16]} />;
  }, [period, hairstyle]);

  // Body
  const bodyGeometry = useMemo(() => {
    if (period === 2055) {
      return <boxGeometry args={[0.6, 1, 0.3]} />;
    }
    return <boxGeometry args={[0.5, 1.2, 0.4]} />;
  }, [period]);

  // Hair
  const hairMesh = useMemo(() => {
    switch (hairstyle) {
      case 'victory-rolls':
        return (
          <group>
            <mesh position={[0, 0.35, 0]}>
              <torusGeometry args={[0.28, 0.08, 16, 32]} />
              <meshStandardMaterial color={hairColors[period]} />
            </mesh>
          </group>
        );
      case 'pompadour':
        return (
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.6, 0.2, 0.5]} />
            <meshStandardMaterial color={hairColors[period]} />
          </mesh>
        );
      case 'beehive':
        return (
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.3, 0.2, 0.4]} />
            <meshStandardMaterial color={hairColors[period]} />
          </mesh>
        );
      case 'mohawk':
        return (
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.05, 0.8, 0.1]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
        );
      case 'long-hair':
        return (
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.28, 16, 16]} />
            <meshStandardMaterial color={hairColors[period]} />
          </mesh>
        );
      case 'neon-dye':
        return (
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color={hairColors[period]} 
              emissive={hairColors[period]} 
              emissiveIntensity={0.6} 
            />
          </mesh>
        );
      default:
        return (
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.55, 0.15, 0.5]} />
            <meshStandardMaterial color={hairColors[period]} />
          </mesh>
        );
    }
  }, [hairstyle, period, hairColors]);

  // Gadget
  const gadgetMesh = useMemo(() => {
    if (!gadget) return null;
    
    switch (gadget) {
      case 'smartphone':
        return (
          <mesh position={[0.4, 1.2, 0]}>
            <boxGeometry args={[0.15, 0.3, 0.05]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        );
      case 'tablet':
        return (
          <mesh position={[0.5, 1, 0]}>
            <boxGeometry args={[0.25, 0.2, 0.03]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        );
      case 'ar-glasses':
        return (
          <mesh position={[0, 0.05, 0.28]}>
            <torusGeometry args={[0.28, 0.02, 16, 32]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
          </mesh>
        );
      case 'holo-tablet':
        return (
          <mesh position={[0.5, 1, 0]}>
            <boxGeometry args={[0.2, 0.15, 0.01]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.6} transparent opacity={0.6} />
          </mesh>
        );
      default:
        return null;
    }
  }, [gadget]);

  return (
    <group position={position}>
      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        {headGeometry}
        <meshStandardMaterial color="#fdbcb4" />
      </mesh>
      
      {/* Hair */}
      {hairMesh}
      
      {/* Body */}
      <mesh position={[0, 0.5, 0]}>
        {bodyGeometry}
        <meshStandardMaterial color={outfitColors[period]} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.35, 0.4, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.2]} />
        <meshStandardMaterial color={outfitColors[period]} />
      </mesh>
      <mesh position={[0.35, 0.4, 0]}>
        <boxGeometry args={[0.15, 0.6, 0.2]} />
        <meshStandardMaterial color={outfitColors[period]} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.15, -0.3, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.25]} />
        <meshStandardMaterial color={outfitColors[period]} />
      </mesh>
      <mesh position={[0.15, -0.3, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.25]} />
        <meshStandardMaterial color={outfitColors[period]} />
      </mesh>
      
      {/* Gadget */}
      {gadgetMesh}
    </group>
  );
}

export function Patrons({ period }: { period: Period }) {
  const config = PERIOD_CONFIGS[period];
  
  const patronCount = 4; // Number of patrons
  const patronPositions: [number, number, number][] = [
    [-3, 0, 3], [3, 0, 3], [-3, 0, -2], [3, 0, -2]
  ];

  const patrons = useMemo(() => {
    return patronPositions.map((pos, index) => ({
      position: pos,
      outfit: config.patrons.outfits[index % config.patrons.outfits.length],
      hairstyle: config.patrons.hairstyles[index % config.patrons.hairstyles.length],
      gadget: config.patrons.gadgets[index % config.patrons.gadgets.length],
    }));
  }, [period, config, patronPositions]);

  return (
    <>
      {patrons.map((patron, index) => (
        <Patron
          key={index}
          position={patron.position}
          outfit={patron.outfit}
          hairstyle={patron.hairstyle}
          gadget={patron.gadget}
          period={period}
        />
      ))}
    </>
  );
}