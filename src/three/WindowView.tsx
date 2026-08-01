import { useMemo } from 'react';
import type { EraConfig } from '../types/era';
import { lerp, lerpColor } from '../utils/interpolation';

interface WindowViewProps {
  from: EraConfig;
  to: EraConfig;
  progress: number;
}

function css(c: { r: number; g: number; b: number }): string {
  return `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
}

/**
 * The world seen through the café's front window: a sky gradient, distant
 * city silhouette, and a warm exterior light that interpolates with the era.
 */
export function WindowView({ from, to, progress }: WindowViewProps) {
  const sky = useMemo(() => {
    const a = from.lighting.exterior;
    const b = to.lighting.exterior;
    return {
      top: css(lerpColor(a, b, progress)),
      bottom: css(lerpColor({ r: 0.95, g: 0.75, b: 0.55 }, { r: 0.3, g: 0.4, b: 0.7 }, progress)),
    };
  }, [from, to, progress]);

  const glow = useMemo(() => lerp(from.atmosphere.warmth, to.atmosphere.warmth, progress), [from, to, progress]);

  // Distant skyline silhouette: simple boxes with varied heights.
  const skyline = useMemo(() => {
    const heights = [2.2, 3.4, 2.8, 4.0, 3.0, 2.4, 3.6, 2.6, 3.2, 2.0];
    const widths = [0.8, 0.9, 0.7, 1.0, 0.8, 0.75, 0.9, 0.7, 0.85, 0.6];
    return heights.map((h, i) => ({
      x: -4.5 + i * 0.95,
      h,
      w: widths[i],
    }));
  }, []);

  return (
    <group position={[0, 1.95, 3.65]}>
      {/* Sky backdrop */}
      <mesh position={[0, 0, -0.5]}>
        <planeGeometry args={[5.6, 2.1]} />
        <meshBasicMaterial color={sky.bottom} />
      </mesh>
      {/* Sky gradient via a second tinted plane */}
      <mesh position={[0, 0.5, -0.45]}>
        <planeGeometry args={[5.6, 1.1]} />
        <meshBasicMaterial color={sky.top} transparent opacity={0.6} />
      </mesh>
      {/* Skyline silhouette */}
      {skyline.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2 - 0.6, -0.3]}>
          <boxGeometry args={[b.w, b.h, 0.1]} />
          <meshBasicMaterial color="#151a24" />
        </mesh>
      ))}
      {/* Exterior glow light */}
      <pointLight position={[0, 0.2, 0.6]} intensity={1.6 + glow * 0.6} color={css(lerpColor(from.lighting.exterior, to.lighting.exterior, progress))} distance={4} decay={2} />
      {/* Window panes / mullions */}
      {[-1.4, 0, 1.4].map((x) => (
        <mesh key={x} position={[x, 0, 0.1]}>
          <boxGeometry args={[0.06, 2.1, 0.05]} />
          <meshStandardMaterial color="#1a1a1e" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[5.6, 0.06, 0.05]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}
