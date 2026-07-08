import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SteamParticlesProps {
  position?: [number, number, number];
  count?: number;
  /** Initial upward speed. */
  speed?: number;
  /** Particle spread radius. */
  spread?: number;
  /** Base colour of the steam. */
  color?: string;
}

/**
 * Shared steam / wisp particle system using instanced sprite quads (shader-free).
 * Used by 1945–2005 era coffee machines.
 */
export function SteamParticles({
  position = [0, 1, 0],
  count = 20,
  speed = 0.4,
  spread = 0.15,
  color = '#ffffff',
}: SteamParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Particle states: [x, y, z, life]
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * spread,
      y: Math.random() * 1.5,
      z: (Math.random() - 0.5) * spread,
      vy: speed * (0.6 + Math.random() * 0.6),
      life: Math.random(),
      scale: 0.05 + Math.random() * 0.1,
    }));
  }, [count, speed, spread]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]!;
      p.y += p.vy * dt;
      p.life += dt * 0.5;
      p.scale += dt * 0.15;

      // Reset when particle rises too high
      if (p.y > 2.0) {
        p.y = 0;
        p.x = (Math.random() - 0.5) * spread;
        p.z = (Math.random() - 0.5) * spread;
        p.life = 0;
        p.scale = 0.05 + Math.random() * 0.1;
      }

      dummy.position.set(position[0] + p.x, position[1] + p.y, position[2] + p.z);
      // Fade by scaling — InstancedMesh doesn't support per-instance opacity without shaders
      // so we use scale as a proxy for fade.
      const fadeScale = Math.sin(Math.min(p.life * Math.PI, Math.PI));
      dummy.scale.setScalar(p.scale * fadeScale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      position={position}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.25} depthWrite={false} />
    </instancedMesh>
  );
}
