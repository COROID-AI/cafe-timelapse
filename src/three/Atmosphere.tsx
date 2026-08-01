import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EraConfig } from '../types/era';
import { lerp } from '../utils/interpolation';
import { createRandom } from '../utils/canvasTexture';

interface AtmosphereProps {
  from: EraConfig;
  to: EraConfig;
  progress: number;
}

/**
 * Scene atmosphere: a light haze of dust motes drifting in the air.
 * Dust positions are deterministic (seeded PRNG) so renders are stable;
 * motion is disabled under reduced motion via the `data-reduced-motion`
 * document attribute. The era-mood fog is applied declaratively at scene
 * level by SceneContents (`<fogExp2 attach="fog">`).
 */
export function Atmosphere(_props: AtmosphereProps) {
  const dustCount = 90;
  const dust = useMemo(() => {
    const rand = createRandom(0xcafe);
    const arr: { pos: [number, number, number]; speed: number; size: number }[] = [];
    for (let i = 0; i < dustCount; i++) {
      arr.push({
        pos: [-4.2 + rand() * 8.4, 0.3 + rand() * 3, -3.2 + rand() * 6.4],
        speed: 0.02 + rand() * 0.04,
        size: 0.008 + rand() * 0.02,
      });
    }
    return arr;
  }, []);
  const dustRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const reduced = document.documentElement.dataset.reducedMotion === 'true';
    if (reduced) {
      return;
    }
    const t = state.clock.elapsedTime;
    dustRef.current?.children.forEach((child, i) => {
      const d = dust[i];
      if (!d) {
        return;
      }
      child.position.y = d.pos[1] + Math.sin(t * d.speed + i) * 0.05;
      child.position.x = d.pos[0] + Math.cos(t * d.speed * 0.7 + i * 1.7) * 0.06;
    });
  });

  return (
    <group ref={dustRef}>
      {dust.map((d, i) => (
        <mesh key={i} position={d.pos}>
          <sphereGeometry args={[d.size, 6, 6]} />
          <meshBasicMaterial color="#ffe9c9" transparent opacity={0.28} />
        </mesh>
      ))}
    </group>
  );
}

// Re-exported for callers that want the fog color (SceneContents).
export function fogColorFor(from: EraConfig, to: EraConfig, progress: number): string {
  const c = from.lighting.fog;
  const c2 = to.lighting.fog;
  const r = Math.round(lerp(c.r, c2.r, progress) * 255);
  const g = Math.round(lerp(c.g, c2.g, progress) * 255);
  const b = Math.round(lerp(c.b, c2.b, progress) * 255);
  return `rgb(${r},${g},${b})`;
}
