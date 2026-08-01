import { useMemo } from 'react';
import type { EraConfig } from '../types/era';

interface SignageProps {
  era: EraConfig;
  progress: number;
}

/**
 * The café's front signage, era-specific:
 * - 1945: warm neon tube
 * - 1965: painted wooden sign
 * - 1985: plastic illuminated sign
 * - 2005: LED sign
 * - 2025: backlit minimal sign
 * - 2055: holographic projection
 */
export function Signage({ era, progress }: SignageProps) {
  const type = era.signageType;
  const isNeon = type === 'neon';
  const isHolo = type === 'holo';

  const colors = useMemo(() => {
    switch (type) {
      case 'neon':
        return { main: '#ff9e5e', glow: '#ff5e2e' };
      case 'painted':
        return { main: '#e8d9a8', glow: '#8a6a3a' };
      case 'plastic':
        return { main: '#ffd27f', glow: '#ff8c42' };
      case 'led':
        return { main: '#9fe8ff', glow: '#4fc8ff' };
      case 'backlit':
        return { main: '#ffffff', glow: '#c8a46a' };
      case 'holo':
        return { main: '#9fd4ff', glow: '#5e9eff' };
    }
  }, [type]);

  const glyphCount = 6; // "CAFÉ"
  const glyphW = 0.34;
  const gap = 0.1;

  void progress;

  return (
    <group position={[0, 3.1, 3.45]}>
      {isHolo ? (
        <>
          {/* Holographic projection */}
          <mesh position={[0, 0.4, 0]}>
            <planeGeometry args={[2.6, 0.8]} />
            <meshBasicMaterial color={colors.glow} transparent opacity={0.25} />
          </mesh>
          <pointLight position={[0, 0.4, 0.3]} intensity={1.2} color={colors.glow} distance={3} decay={2} />
        </>
      ) : (
        <>
          {/* Sign board */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[3.0, 0.85, 0.12]} />
            <meshStandardMaterial
              color={type === 'painted' ? '#6a4a2a' : type === 'backlit' ? '#20242a' : '#1c1a16'}
              roughness={0.5}
              metalness={0.2}
            />
          </mesh>
          {/* Mounting brackets */}
          {[-1.3, 1.3].map((x) => (
            <mesh key={x} position={[x, 0.4, -0.1]}>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
              <meshStandardMaterial color="#55555a" roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
          {/* Glyphs */}
          {Array.from({ length: glyphCount }).map((_, i) => (
            <mesh key={i} position={[-0.75 + i * (glyphW + gap), 0.42, 0.07]}>
              <boxGeometry args={[glyphW, 0.5, 0.02]} />
              <meshBasicMaterial color={colors.main} />
            </mesh>
          ))}
        </>
      )}
      {isNeon ? (
        <>
          <pointLight position={[0, 0.4, 0.3]} intensity={1.6} color={colors.glow} distance={3.5} decay={2} />
          {/* Flicker handled by Effects-level animation; static glow here */}
        </>
      ) : null}
    </group>
  );
}
