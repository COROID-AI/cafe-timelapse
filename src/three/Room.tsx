import { useMemo } from 'react';
import type { EraConfig } from '../types/era';
import { lerpColor } from '../utils/interpolation';

export const ROOM_W = 9;
export const ROOM_D = 7;
export const ROOM_H = 3.6;

interface RoomProps {
  from: EraConfig;
  to: EraConfig;
  progress: number;
}

/**
 * The café room shell: floor, walls, ceiling, baseboards, and a large
 * front window through which exterior light enters. All tones interpolate
 * with the era transition.
 */
export function Room({ from, to, progress }: RoomProps) {
  const floor = useMemo(() => lerpColor(from.furniture.floor, to.furniture.floor, progress), [from, to, progress]);
  const wall = useMemo(() => lerpColor(from.furniture.wall, to.furniture.wall, progress), [from, to, progress]);
  const trim = useMemo(() => lerpColor(from.furniture.trim, to.furniture.trim, progress), [from, to, progress]);
  const ceiling = useMemo(() => lerpColor({ r: 0.85, g: 0.82, b: 0.75 }, { r: 0.75, g: 0.78, b: 0.88 }, progress), [progress]);

  const w = ROOM_W;
  const d = ROOM_D;
  const h = ROOM_H;

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={`rgb(${floor.r * 255},${floor.g * 255},${floor.b * 255})`} roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Back wall (negative z) */}
      <mesh position={[0, h / 2, -d / 2]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={`rgb(${wall.r * 255},${wall.g * 255},${wall.b * 255})`} roughness={0.95} metalness={0} />
      </mesh>

      {/* Left wall (negative x) */}
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[d, h]} />
        <meshStandardMaterial color={`rgb(${wall.r * 255},${wall.g * 255},${wall.b * 255})`} roughness={0.95} metalness={0} />
      </mesh>

      {/* Right wall (positive x) */}
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[d, h]} />
        <meshStandardMaterial color={`rgb(${wall.r * 255},${wall.g * 255},${wall.b * 255})`} roughness={0.95} metalness={0} />
      </mesh>

      {/* Front wall (positive z) built from panels around a window opening */}
      <group position={[0, 0, d / 2]}>
        {/* Left solid panel */}
        <mesh position={[-3.3, h / 2, 0]} receiveShadow>
          <boxGeometry args={[1.7, h, 0.15]} />
          <meshStandardMaterial color={`rgb(${wall.r * 255},${wall.g * 255},${wall.b * 255})`} roughness={0.95} />
        </mesh>
        {/* Right solid panel */}
        <mesh position={[3.3, h / 2, 0]} receiveShadow>
          <boxGeometry args={[1.7, h, 0.15]} />
          <meshStandardMaterial color={`rgb(${wall.r * 255},${wall.g * 255},${wall.b * 255})`} roughness={0.95} />
        </mesh>
        {/* Above window */}
        <mesh position={[0, h - 0.55, 0]} receiveShadow>
          <boxGeometry args={[4.9, 1.1, 0.15]} />
          <meshStandardMaterial color={`rgb(${wall.r * 255},${wall.g * 255},${wall.b * 255})`} roughness={0.95} />
        </mesh>
        {/* Below window */}
        <mesh position={[0, 0.45, 0]} receiveShadow>
          <boxGeometry args={[4.9, 0.9, 0.15]} />
          <meshStandardMaterial color={`rgb(${wall.r * 255},${wall.g * 255},${wall.b * 255})`} roughness={0.95} />
        </mesh>
      </group>

      {/* Ceiling */}
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={`rgb(${ceiling.r * 255},${ceiling.g * 255},${ceiling.b * 255})`} roughness={0.9} metalness={0} />
      </mesh>

      {/* Baseboard trim around the room */}
      {[
        { pos: [0, 0.12, -d / 2 + 0.05] as const, size: [w, 0.24, 0.08] as const, rot: 0 },
        { pos: [-w / 2 + 0.05, 0.12, 0] as const, size: [0.08, 0.24, d] as const, rot: 0 },
        { pos: [w / 2 - 0.05, 0.12, 0] as const, size: [0.08, 0.24, d] as const, rot: 0 },
        { pos: [0, 0.12, d / 2 - 0.05] as const, size: [w, 0.24, 0.08] as const, rot: 0 },
      ].map((b, i) => (
        <mesh key={i} position={b.pos} receiveShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color={`rgb(${trim.r * 255},${trim.g * 255},${trim.b * 255})`} roughness={0.6} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}
