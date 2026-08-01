import { useMemo } from 'react';
import type { EraConfig } from '../types/era';
import { lerp, lerpColor } from '../utils/interpolation';

interface LightingProps {
  from: EraConfig;
  to: EraConfig;
  progress: number;
}

function css(c: { r: number; g: number; b: number }): string {
  return `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
}

/**
 * Interior and exterior lighting for the café. Every light color/intensity
 * interpolates with the era transition so continuous attributes morph
 * smoothly between periods.
 */
export function Lighting({ from, to, progress }: LightingProps) {
  const ambient = useMemo(() => lerpColor(from.lighting.ambient, to.lighting.ambient, progress), [from, to, progress]);
  const key = useMemo(() => lerpColor(from.lighting.key, to.lighting.key, progress), [from, to, progress]);
  const pendant = useMemo(() => lerpColor(from.lighting.pendant, to.lighting.pendant, progress), [from, to, progress]);
  const exterior = useMemo(() => lerpColor(from.lighting.exterior, to.lighting.exterior, progress), [from, to, progress]);
  const intensity = useMemo(() => lerp(from.lighting.intensity, to.lighting.intensity, progress), [from, to, progress]);

  return (
    <group>
      {/* Warm interior fill */}
      <ambientLight intensity={intensity * 0.55} color={css(ambient)} />
      {/* Key light from the front, warm */}
      <directionalLight
        position={[0, 4.2, 2.2]}
        intensity={intensity * 0.9}
        color={css(key)}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      {/* Cool exterior light through the window */}
      <directionalLight position={[0, 3, 5.5]} intensity={intensity * 0.7} color={css(exterior)} />
      {/* Ceiling pendant glow (visual, warm) */}
      <pointLight position={[0, 3.3, -1.2]} intensity={intensity * 1.1} color={css(pendant)} distance={7} decay={2} />
      {/* Small counter task light */}
      <pointLight position={[-2.6, 1.7, -2.6]} intensity={intensity * 0.7} color={css(key)} distance={5} decay={2} />
      {/* Exterior lamp post glow through the window */}
      <pointLight position={[0, 2.4, 5.2]} intensity={intensity * 0.5} color={css(exterior)} distance={6} decay={2} />
    </group>
  );
}
