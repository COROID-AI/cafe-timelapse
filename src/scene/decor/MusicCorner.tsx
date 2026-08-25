import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dominantEraIndex } from "../TransitionController";

/**
 * The music corner: wireless set → jukebox → boombox → iPod dock →
 * smart speaker → holographic orb. Six props stay mounted permanently;
 * visibility flips at the blend midpoint. Idle animations (glow pulses,
 * spinning record, bobbing holo-core) run every frame regardless of era.
 */

const CORNER_POS: [number, number] = [-6.4, -5.1];
const CORNER_ROT = Math.PI / 5;

export default function MusicCorner() {
  const refs = [
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
  ];
  const jukeGlow = useRef<THREE.MeshStandardMaterial>(null);
  const platterRef = useRef<THREE.Mesh>(null);
  const orbCore = useRef<THREE.Mesh>(null);
  const ledMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const active = dominantEraIndex();
    for (let i = 0; i < refs.length; i++) {
      const g = refs[i].current;
      if (g) g.visible = i === active;
    }
    const time = state.clock.elapsedTime;

    if (platterRef.current) {
      // Radio's tuning dial / jukebox platter spins softly when visible.
      platterRef.current.rotation.y = active <= 1 ? time * 0.8 : 0;
    }
    if (jukeGlow.current) {
      jukeGlow.current.emissiveIntensity = 0.9 + Math.sin(time * 2.2) * 0.35;
    }
    if (ledMat.current) {
      ledMat.current.emissiveIntensity = Math.sin(time * 6) > 0 ? 1.3 : 0.25;
    }
    if (orbCore.current) {
      orbCore.current.rotation.y = time * 0.7;
      orbCore.current.position.y = 1.32 + Math.sin(time * 1.3) * 0.05;
    }
  });

  return (
    <group position={[CORNER_POS[0], 0, CORNER_POS[1]]} rotation={[0, CORNER_ROT, 0]}>
      {/* 1945 — wooden wireless set */}
      <group ref={refs[0]} visible>
        <mesh castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[0.62, 1.1, 0.4]} />
          <meshStandardMaterial color="#5a4632" roughness={0.65} />
        </mesh>
        <mesh position={[-0.12, 0.72, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.03, 20]} />
          <meshStandardMaterial color="#c8b98a" roughness={0.85} />
        </mesh>
        <mesh position={[0.18, 0.78, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 14]} />
          <meshStandardMaterial color="#d8cfb0" roughness={0.7} />
        </mesh>
        <mesh ref={platterRef} position={[0.18, 0.62, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.015, 14]} />
          <meshStandardMaterial color="#8a8060" roughness={0.6} />
        </mesh>
      </group>

      {/* 1965 — jukebox with glowing arch */}
      <group ref={refs[1]} visible={false}>
        <mesh castShadow position={[0, 0.75, 0]}>
          <boxGeometry args={[0.85, 1.5, 0.45]} />
          <meshStandardMaterial color="#7a2438" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh castShadow position={[0, 1.5, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e8b23a" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.95, 0.23]}>
          <planeGeometry args={[0.52, 0.7]} />
          <meshStandardMaterial ref={jukeGlow} color="#ffdf8a" emissive="#ffb84a" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0, 0.42, 0.23]}>
          <planeGeometry args={[0.56, 0.22]} />
          <meshStandardMaterial color="#2a1a10" roughness={0.5} />
        </mesh>
      </group>

      {/* 1985 — boombox with blinking LEDs */}
      <group ref={refs[2]} visible={false}>
        <mesh castShadow position={[0, 0.62, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[1.0, 0.55, 0.3]} />
          <meshStandardMaterial color="#23262b" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[-0.28, 0.62, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.03, 18]} />
          <meshStandardMaterial color="#14161a" roughness={0.7} />
        </mesh>
        <mesh position={[0.28, 0.62, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.03, 18]} />
          <meshStandardMaterial color="#14161a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.68, 0.16]}>
          <planeGeometry args={[0.26, 0.1]} />
          <meshStandardMaterial color="#0d0f13" emissive="#57d8ff" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0.44, 0.16]}>
          <planeGeometry args={[0.04, 0.04]} />
          <meshStandardMaterial ref={ledMat} color="#ff3355" emissive="#ff3355" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0, 0.94, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.02, 8, 18, Math.PI]} />
          <meshStandardMaterial color="#33363a" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* 2005 — iPod dock */}
      <group ref={refs[3]} visible={false}>
        <mesh castShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[0.5, 1.0, 0.34]} />
          <meshStandardMaterial color="#e8eaec" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.86, 0.1]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.12, 0.22, 0.03]} />
          <meshStandardMaterial color="#fbfbfd" roughness={0.25} emissive="#bcd9ff" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0, 0.86, 0.115]} rotation={[0.15, 0, 0]}>
          <planeGeometry args={[0.09, 0.16]} />
          <meshStandardMaterial color="#0a1420" emissive="#9fc8ff" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0, 0.36, 0.18]}>
          <circleGeometry args={[0.07, 18]} />
          <meshStandardMaterial color="#2b2e33" roughness={0.6} />
        </mesh>
      </group>

      {/* 2025 — smart speaker with phone on top */}
      <group ref={refs[4]} visible={false}>
        <mesh castShadow position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.19, 0.22, 1.1, 20]} />
          <meshStandardMaterial color="#3a4046" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.16, 0]} rotation={[0.12, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 0.2, 0.02]} />
          <meshStandardMaterial color="#17191c" roughness={0.3} emissive="#ffffff" emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <ringGeometry args={[0.05, 0.07, 20]} />
          <meshStandardMaterial color="#7ce8b8" emissive="#7ce8b8" emissiveIntensity={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 2055 — holographic orb */}
      <group ref={refs[5]} visible={false}>
        <mesh castShadow position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.26, 0.3, 0.12, 22]} />
          <meshStandardMaterial color="#10151f" metalness={0.75} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.32, 0]}>
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshBasicMaterial color="#37e6ff" transparent opacity={0.12} depthWrite={false} />
        </mesh>
        <mesh ref={orbCore} position={[0, 1.32, 0]}>
          <icosahedronGeometry args={[0.16, 1]} />
          <meshStandardMaterial color="#123039" emissive="#37e6ff" emissiveIntensity={1.4} transparent opacity={0.9} />
        </mesh>
        <pointLight color="#37e6ff" intensity={0.7} distance={3} position={[0, 1.32, 0]} />
      </group>

      {/* Corner stool the props sit on */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.56, 16]} />
        <meshStandardMaterial color="#4a3a28" roughness={0.8} />
      </mesh>
    </group>
  );
}
