import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EraConfig } from '../types/era';
import { createRandom } from '../utils/canvasTexture';

interface PatronsProps {
  era: EraConfig;
}

/**
 * Café patrons styled per era (uniform → augmented). Positions are
 * deterministic per era; patrons gently idle (subtle bob) unless the
 * user prefers reduced motion.
 */
export function Patrons({ era }: PatronsProps) {
  const rand = useMemo(() => createRandom(era.seed + 31), [era.seed]);

  const palette = useMemo(() => {
    switch (era.patronStyle) {
      case 'uniform':
        return ['#4a5a4a', '#6a5a4a', '#3a4a5a'];
      case 'midcentury':
        return ['#c96f3a', '#4a6a5a', '#a8542a'];
      case 'retro':
        return ['#ff6a5e', '#4fc8ff', '#ffd27f'];
      case 'casual':
        return ['#8a8a8e', '#5a5a5e', '#b8b2a8'];
      case 'modern':
        return ['#2a2a2e', '#4a4a4e', '#6a665e'];
      case 'augmented':
        return ['#7fd4ff', '#b48cff', '#9fffb8'];
    }
  }, [era.patronStyle]);

  const patrons = useMemo(() => {
    const list: { pos: [number, number, number]; rot: number; color: string; h: number }[] = [];
    // Two patrons at tables.
    list.push({ pos: [-2.4, 0, -0.6], rot: 0.4, color: palette[0], h: 1.45 });
    list.push({ pos: [2.6, 0, 0.9], rot: -0.3, color: palette[1], h: 1.52 });
    // One patron at the counter.
    list.push({ pos: [1.2, 0, -2.5], rot: Math.PI, color: palette[2], h: 1.48 });
    return list;
  }, [palette]);

  void rand;

  return (
    <group>
      {patrons.map((p, i) => (
        <Patron key={i} position={p.pos} rotation={p.rot} color={p.color} height={p.h} seed={i + 1} />
      ))}
    </group>
  );
}

interface PatronProps {
  position: [number, number, number];
  rotation: number;
  color: string;
  height: number;
  seed: number;
}

function Patron({ position, rotation, color, height, seed }: PatronProps) {
  const bob = useMemo(() => 0.015 + (seed % 3) * 0.008, [seed]);

  useFrame((state) => {
    const reduced = document.documentElement.dataset.reducedMotion === 'true';
    if (reduced) {
      return;
    }
    const t = state.clock.elapsedTime;
    // Idle bob of the whole patron.
    const group = (state.scene.getObjectByName(`patron-${seed}`) ?? null) as THREE.Group | null;
    if (group) {
      group.position.y = bob * Math.sin(t * 1.2 + seed * 2.0);
    }
  });

  return (
    <group name={`patron-${seed}`} position={position} rotation={[0, rotation, 0]}>
      {/* Legs */}
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.84, 10]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
      {/* Body */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.12, 0.62, 12]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.36, 0]} castShadow>
        <sphereGeometry args={[0.11, 14, 14]} />
        <meshStandardMaterial color="#d8a878" roughness={0.6} />
      </mesh>
      {/* Hair / hat hint */}
      <mesh position={[0, 1.44, 0]} castShadow>
        <sphereGeometry args={[0.115, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.18, 0.98, 0.05]} rotation={[0, 0, -0.4]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {height > 1.5 ? (
        <mesh position={[-0.18, 0.98, 0.05]} rotation={[0, 0, 0.4]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.5, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ) : null}
    </group>
  );
}
