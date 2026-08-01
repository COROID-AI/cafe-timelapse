import { useMemo } from 'react';
import type { EraConfig } from '../types/era';

interface TablewareProps {
  era: EraConfig;
}

/**
 * Tableware on the café tables, era-specific:
 * - 1945: porcelain white cups
 * - 1965: stoneware mugs
 * - 1985: melamine (colorful)
 * - 2005: ceramic latte cups
 * - 2025: matte specialty cups
 * - 2055: biogel translucent cups
 */
export function Tableware({ era }: TablewareProps) {
  const style = era.tablewareStyle;

  const colors = useMemo(() => {
    switch (style) {
      case 'porcelain':
        return ['#f5f2ec', '#e8e0d0', '#d8d0c0'];
      case 'stoneware':
        return ['#c96f3a', '#7a4a2a', '#b8a888'];
      case 'melamine':
        return ['#ff6a5e', '#4fc8ff', '#ffd27f'];
      case 'ceramic':
        return ['#f2f0ea', '#e0dcd2', '#8a8a8e'];
      case 'matte':
        return ['#e8e4dc', '#b8b2a8', '#6a665e'];
      case 'biogel':
        return ['#9fffb8', '#7fd4ff', '#ff9ec8'];
    }
  }, [style]);

  // Cups on the two tables.
  const tables = [
    { x: -2.6, z: -1.0, rot: 0 },
    { x: 2.4, z: 0.6, rot: Math.PI / 6 },
  ];

  return (
    <group>
      {tables.map((t, ti) => (
        <group key={ti} position={[t.x, 0, t.z]} rotation={[0, t.rot, 0]}>
          {[0, 1, 2].map((i) => {
            const angle = (i / 3) * Math.PI * 2;
            const cx = Math.cos(angle) * 0.4;
            const cz = Math.sin(angle) * 0.4;
            const color = colors[i % colors.length];
            const isTranslucent = style === 'biogel';
            return (
              <group key={i} position={[cx, 0.78, cz]}>
                {/* Cup body */}
                <mesh position={[0, 0.07, 0]} castShadow>
                  <cylinderGeometry args={[0.06, 0.045, 0.14, 14]} />
                  <meshStandardMaterial
                    color={color}
                    roughness={0.35}
                    metalness={0.05}
                    transparent={isTranslucent}
                    opacity={isTranslucent ? 0.65 : 1}
                  />
                </mesh>
                {/* Saucer */}
                <mesh position={[0, 0.005, 0]} receiveShadow>
                  <cylinderGeometry args={[0.11, 0.11, 0.015, 16]} />
                  <meshStandardMaterial color={color} roughness={0.4} />
                </mesh>
                {/* Coffee surface */}
                <mesh position={[0, 0.135, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.01, 12]} />
                  <meshBasicMaterial color={style === 'biogel' ? '#8fe8ff' : '#4a2c14'} />
                </mesh>
              </group>
            );
          })}
          {/* A small plate */}
          <mesh position={[0.25, 0.79, 0.2]} receiveShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
            <meshStandardMaterial color={colors[1]} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
