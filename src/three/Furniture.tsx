import { useMemo } from 'react';
import type { EraConfig } from '../types/era';
import { lerpColor } from '../utils/interpolation';

interface FurnitureProps {
  from: EraConfig;
  to: EraConfig;
  progress: number;
}

function css(c: { r: number; g: number; b: number }): string {
  return `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
}

/**
 * The café's tables and chairs. Finishes interpolate with the era; the
 * shape/type of seating is era-specific (through the EraGroup mount
 * strategy this component supplies the neutral furniture shell).
 */
export function Furniture({ from, to, progress }: FurnitureProps) {
  const table = useMemo(() => css(lerpColor(from.furniture.table, to.furniture.table, progress)), [from, to, progress]);
  const chair = useMemo(() => css(lerpColor(from.furniture.chair, to.furniture.chair, progress)), [from, to, progress]);

  // Two tables with four chairs each.
  const tables = useMemo(
    () => [
      { pos: [-2.6, 0, -1.0] as const, r: 0 },
      { pos: [2.4, 0, 0.6] as const, r: Math.PI / 6 },
    ],
    [],
  );

  return (
    <group>
      {tables.map((t, ti) => {
        const chairAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
        return (
          <group key={ti} position={[...t.pos]} rotation={[0, t.r, 0]}>
            {/* Table base */}
            <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.32, 0.42, 0.76, 20]} />
              <meshStandardMaterial color={table} roughness={0.55} metalness={0.05} />
            </mesh>
            {/* Table top */}
            <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.78, 0.78, 0.06, 28]} />
              <meshStandardMaterial color={table} roughness={0.45} metalness={0.1} />
            </mesh>
            {chairAngles.map((a, ci) => {
              const cx = Math.sin(a) * 1.05;
              const cz = Math.cos(a) * 1.05;
              return (
                <group key={ci} position={[cx, 0, cz]} rotation={[0, a, 0]}>
                  {/* Seat */}
                  <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.44, 0.06, 0.44]} />
                    <meshStandardMaterial color={chair} roughness={0.7} metalness={0.02} />
                  </mesh>
                  {/* Legs */}
                  {[
                    [-0.18, 0.23, -0.18],
                    [0.18, 0.23, -0.18],
                    [-0.18, 0.23, 0.18],
                    [0.18, 0.23, 0.18],
                  ].map((lp, li) => (
                    <mesh key={li} position={lp as [number, number, number]} castShadow>
                      <cylinderGeometry args={[0.025, 0.025, 0.46, 8]} />
                      <meshStandardMaterial color={chair} roughness={0.7} />
                    </mesh>
                  ))}
                  {/* Backrest */}
                  <mesh position={[0, 0.72, -0.2]} castShadow>
                    <boxGeometry args={[0.44, 0.42, 0.05]} />
                    <meshStandardMaterial color={chair} roughness={0.7} />
                  </mesh>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
