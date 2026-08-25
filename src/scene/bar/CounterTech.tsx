import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dominantEraIndex } from "../TransitionController";

/**
 * Counter technology lineage: mechanical till → NCR register →
 * electronic POS → touchscreen + chip&PIN → tablet + contactless →
 * biometric holographic pad. All six stay mounted; visibility flips at
 * the blend midpoint so React never remounts a subtree.
 */

const BASE: [number, number, number] = [5.6, 1.09, 0.9];

export default function CounterTech() {
  const groups = [
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
  ];
  const holoBeam = useRef<THREE.Mesh>(null);
  const vfdMat = useRef<THREE.MeshStandardMaterial>(null);
  const tabletScreen = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const active = dominantEraIndex();
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i].current;
      if (g) g.visible = i === active;
    }
    if (holoBeam.current) {
      holoBeam.current.rotation.y = state.clock.elapsedTime * 1.4;
    }
    if (vfdMat.current) {
      vfdMat.current.emissiveIntensity =
        active === 2 ? 1.1 + Math.sin(state.clock.elapsedTime * 7) * 0.08 : 1;
    }
    if (tabletScreen.current && active === 4) {
      tabletScreen.current.emissiveIntensity = 0.85;
    }
  });

  return (
    <group position={BASE} rotation={[0, -Math.PI / 2, 0]}>
      {/* 1945 — brass-key mechanical cash till */}
      <group ref={groups[0]} visible>
        <mesh castShadow position={[0, 0.16, 0]}>
          <boxGeometry args={[0.42, 0.32, 0.4]} />
          <meshStandardMaterial color="#3d3225" roughness={0.55} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-0.13 + (i % 3) * 0.13, 0.33, -0.06 + Math.floor(i / 3) * 0.12]}>
            <cylinderGeometry args={[0.032, 0.032, 0.03, 10]} />
            <meshStandardMaterial color="#c8a24a" metalness={0.9} roughness={0.28} />
          </mesh>
        ))}
        <mesh position={[0.14, 0.36, 0.12]} rotation={[0.6, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
          <meshStandardMaterial color="#e8dcc0" metalness={0.3} roughness={0.5} />
        </mesh>
      </group>

      {/* 1965 — chrome NCR punch register */}
      <group ref={groups[1]} visible={false}>
        <mesh castShadow position={[0, 0.2, 0]}>
          <boxGeometry args={[0.46, 0.4, 0.42]} />
          <meshStandardMaterial color="#b9bec4" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.44, -0.04]} rotation={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.34, 0.18, 0.12]} />
          <meshStandardMaterial color="#8f959b" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh position={[0.24, 0.2, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} />
          <meshStandardMaterial color="#33363a" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* 1985 — electronic POS with green VFD */}
      <group ref={groups[2]} visible={false}>
        <mesh castShadow position={[0, 0.15, 0]}>
          <boxGeometry args={[0.44, 0.3, 0.38]} />
          <meshStandardMaterial color="#2b2b31" roughness={0.45} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.33, -0.05]} rotation={[0.5, 0, 0]}>
          <planeGeometry args={[0.26, 0.1]} />
          <meshStandardMaterial ref={vfdMat} color="#03140a" emissive="#39ff88" emissiveIntensity={1.1} />
        </mesh>
        <mesh position={[0, 0.31, 0.09]}>
          <boxGeometry args={[0.3, 0.02, 0.1]} />
          <meshStandardMaterial color="#17171c" roughness={0.6} />
        </mesh>
      </group>

      {/* 2005 — touchscreen POS + chip&PIN reader */}
      <group ref={groups[3]} visible={false}>
        <mesh castShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[0.4, 0.2, 0.3]} />
          <meshStandardMaterial color="#3a3f46" metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.3, -0.02]} rotation={[-0.45, 0, 0]} castShadow>
          <boxGeometry args={[0.36, 0.26, 0.03]} />
          <meshStandardMaterial color="#14161a" roughness={0.25} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.305, -0.005]} rotation={[-0.45, 0, 0]}>
          <planeGeometry args={[0.32, 0.22]} />
          <meshStandardMaterial color="#0a1420" emissive="#3f8cff" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0.26, 0.09, 0.05]} rotation={[0.25, -0.3, 0]}>
          <boxGeometry args={[0.1, 0.16, 0.05]} />
          <meshStandardMaterial color="#23262b" roughness={0.5} />
        </mesh>
      </group>

      {/* 2025 — tablet POS + contactless puck */}
      <group ref={groups[4]} visible={false}>
        <mesh castShadow position={[0, 0.22, -0.02]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.34, 0.24, 0.018]} />
          <meshStandardMaterial color="#1d2126" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.225, -0.01]} rotation={[-0.5, 0, 0]}>
          <planeGeometry args={[0.31, 0.21]} />
          <meshStandardMaterial ref={tabletScreen} color="#101820" emissive="#ffb35c" emissiveIntensity={0.85} />
        </mesh>
        <mesh position={[0.24, 0.035, 0.06]}>
          <cylinderGeometry args={[0.055, 0.06, 0.07, 16]} />
          <meshStandardMaterial color="#2c3038" roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[0.24, 0.072, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.02, 0.034, 20]} />
          <meshStandardMaterial color="#57d8ff" emissive="#57d8ff" emissiveIntensity={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 2055 — biometric holographic payment pad */}
      <group ref={groups[5]} visible={false}>
        <mesh castShadow position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.17, 0.2, 0.08, 20]} />
          <meshStandardMaterial color="#161d29" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh ref={holoBeam} position={[0, 0.3, 0]}>
          <coneGeometry args={[0.13, 0.44, 20, 1, true]} />
          <meshBasicMaterial color="#37e6ff" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.34, 0]} rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.055]} />
          <meshStandardMaterial color="#37e6ff" emissive="#37e6ff" emissiveIntensity={1.5} transparent opacity={0.9} />
        </mesh>
        <pointLight color="#37e6ff" intensity={0.4} distance={1.6} />
      </group>
    </group>
  );
}
