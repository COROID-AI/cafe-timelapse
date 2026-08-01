import { useMemo } from 'react';
import type { EraConfig } from '../types/era';
import { createRandom } from '../utils/canvasTexture';

interface WallDecorProps {
  era: EraConfig;
}

/**
 * Wall posters/ads and decor that are visually distinct per period.
 * Positions are deterministic per era (seeded PRNG) so the layout is stable.
 */
export function WallDecor({ era }: WallDecorProps) {
  const rand = useMemo(() => createRandom(era.seed + 77), [era.seed]);

  const palette = useMemo(() => {
    switch (era.posterTheme) {
      case 'war':
        return ['#c2a878', '#a8845c', '#d8c098', '#8a6a3a'];
      case 'coffee':
        return ['#c96f3a', '#e8d9a8', '#6a4a2a', '#f2e3c0'];
      case 'soda':
        return ['#ff6a5e', '#4fc8ff', '#ffd27f', '#ff3e9e'];
      case 'digital':
        return ['#3e8ef7', '#9fe8ff', '#ff8c42', '#2a2a3a'];
      case 'minimal':
        return ['#e8e4dc', '#b8b2a8', '#6a665e', '#f5f2ec'];
      case 'holographic':
        return ['#7fd4ff', '#b48cff', '#ff9ec8', '#9fffb8'];
    }
  }, [era.posterTheme]);

  const posters = useMemo(() => {
    // Two walls: back wall (z=-3.4) and left wall (x=-4.45).
    const list: { pos: [number, number, number]; rot: [number, number, number]; size: [number, number]; color: string }[] = [];
    const add = (x: number, y: number, z: number, rot: [number, number, number], w: number, h: number, color: string) => {
      list.push({ pos: [x, y, z], rot, size: [w, h], color });
    };
    const colors = palette;
    // Back wall
    add(-3.0, 1.8, -3.38, [0, 0, 0], 0.7, 1.0, colors[0]);
    add(0.6, 2.0, -3.38, [0, 0, 0], 0.9, 1.2, colors[1]);
    add(3.0, 1.7, -3.38, [0, 0, 0], 0.7, 0.95, colors[2]);
    // Left wall
    add(-4.42, 1.9, -1.4, [0, Math.PI / 2, 0], 0.8, 1.1, colors[3]);
    add(-4.42, 1.6, 0.8, [0, Math.PI / 2, 0], 0.6, 0.85, colors[0]);
    return list;
  }, [palette]);

  // Deterministic scatter for decorative elements (poster overlap offset).
  void rand;

  return (
    <group>
      {posters.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.rot} castShadow>
          <planeGeometry args={p.size} />
          <meshStandardMaterial color={p.color} roughness={0.8} />
        </mesh>
      ))}
      {/* Framing strips for a gallery feel */}
      {posters.map((p, i) => (
        <mesh key={`f${i}`} position={p.pos} rotation={p.rot}>
          <planeGeometry args={[p.size[0] + 0.12, p.size[1] + 0.12]} />
          <meshBasicMaterial color="#1c1814" transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}
