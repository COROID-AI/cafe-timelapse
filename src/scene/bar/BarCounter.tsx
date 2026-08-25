import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dominantEraIndex, mixPaletteSlot, transitionState } from "../TransitionController";

/**
 * Bar counter along the right wall. Body colours blend continuously;
 * era-specific trim (brass rail vs neon strip vs holo edge) stays
 * mounted permanently and flips visibility at the blend midpoint.
 */

const COUNTER_X = 5.6;
const COUNTER_Z = -0.6;

export default function BarCounter() {
  const frontMat = useRef<THREE.MeshStandardMaterial>(null);
  const topMat = useRef<THREE.MeshStandardMaterial>(null);
  const brassRailRef = useRef<THREE.Group>(null);
  const neonStripRef = useRef<THREE.Mesh>(null);
  const neonMat = useRef<THREE.MeshStandardMaterial>(null);
  const holoEdgeRef = useRef<THREE.Mesh>(null);
  const holoMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (frontMat.current) {
      mixPaletteSlot("wood", frontMat.current.color);
      frontMat.current.color.multiplyScalar(1.15);
    }
    if (topMat.current) mixPaletteSlot("wallSecondary", topMat.current.color);

    const active = dominantEraIndex();
    if (brassRailRef.current) {
      brassRailRef.current.visible = active <= 1; // 1945 & 1965
    }
    if (neonStripRef.current) {
      neonStripRef.current.visible = active >= 2 && active !== 3;
      if (neonMat.current) {
        const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 3.1) * 0.25;
        neonMat.current.emissiveIntensity = pulse * 1.6;
      }
    }
    if (holoEdgeRef.current) {
      holoEdgeRef.current.visible = active === 5;
      if (holoMat.current) {
        holoMat.current.emissiveIntensity =
          0.9 + Math.sin(state.clock.elapsedTime * 1.7) * 0.35;
      }
    }

    // Counter accent glow follows era palette during blends.
    void transitionState.t;
  });

  return (
    <group>
      {/* Counter body */}
      <mesh position={[COUNTER_X, 0.52, COUNTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 1.04, 6.4]} />
        <meshStandardMaterial ref={frontMat} color="#4a3728" roughness={0.6} metalness={0.08} />
      </mesh>
      {/* Counter top slab */}
      <mesh position={[COUNTER_X - 0.06, 1.06, COUNTER_Z]} castShadow>
        <boxGeometry args={[1.35, 0.06, 6.7]} />
        <meshStandardMaterial ref={topMat} color="#6e6248" roughness={0.35} metalness={0.15} />
      </mesh>

      {/* Brass foot rail — wartime & mod eras */}
      <group ref={brassRailRef} position={[COUNTER_X - 0.75, 0.18, COUNTER_Z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 6.2, 10]} />
          <meshStandardMaterial color="#c8a24a" metalness={0.9} roughness={0.25} />
        </mesh>
        {[-2.8, -0.9, 0.9, 2.8].map((z) => (
          <mesh key={z} position={[0, -0.09, z]}>
            <cylinderGeometry args={[0.022, 0.022, 0.18, 8]} />
            <meshStandardMaterial color="#c8a24a" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* Neon under-counter strip — synth & later decades */}
      <mesh ref={neonStripRef} position={[COUNTER_X - 0.62, 0.1, COUNTER_Z]} visible={false}>
        <boxGeometry args={[0.05, 0.05, 6.2]} />
        <meshStandardMaterial ref={neonMat} color="#ff6ec7" emissive="#ff6ec7" emissiveIntensity={1.4} />
      </mesh>

      {/* Holographic edge — 2055 only */}
      <mesh ref={holoEdgeRef} position={[COUNTER_X - 0.62, 1.12, COUNTER_Z]} visible={false}>
        <boxGeometry args={[0.07, 0.02, 6.5]} />
        <meshStandardMaterial
          ref={holoMat}
          color="#37e6ff"
          emissive="#37e6ff"
          emissiveIntensity={1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Backbar shelf against right wall */}
      <group position={[7.55, 0, COUNTER_Z]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[0.72, 0.06, 5.6]} />
          <meshStandardMaterial color="#4a3728" roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.35, 0]} castShadow>
          <boxGeometry args={[0.72, 0.06, 5.6]} />
          <meshStandardMaterial color="#4a3728" roughness={0.6} />
        </mesh>
        {/* Bottles on both shelves */}
        {Array.from({ length: 10 }, (_, i) => {
          const z = -2.4 + i * 0.52;
          const h = 0.34 + ((i * 37) % 17) / 100;
          return (
            <mesh key={z} position={[0, 1.53 + h / 2, z]} castShadow>
              <cylinderGeometry args={[0.05, 0.06, h, 10]} />
              <meshStandardMaterial
                color={["#2e4a2f", "#4a2e2e", "#2e3b4a", "#5a4a2a"][i % 4]}
                roughness={0.25}
                metalness={0.1}
              />
            </mesh>
          );
        })}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={`g${i}`} position={[0.05, 2.48, -2.1 + i * 0.58]}>
            <cylinderGeometry args={[0.055, 0.055, 0.22, 10]} />
            <meshStandardMaterial color="#dfe9ea" transparent opacity={0.55} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Stools along the counter */}
      {[-2.6, -1.2, 0.2, 1.6].map((z) => (
        <group key={z} position={[COUNTER_X - 1.35, 0, z]}>
          <mesh position={[0, 0.62, 0]} castShadow>
            <cylinderGeometry args={[0.21, 0.21, 0.06, 14]} />
            <meshStandardMaterial color="#8c3b2e" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.31, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 0.62, 8]} />
            <meshStandardMaterial color="#9aa0a6" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.04, 14]} />
            <meshStandardMaterial color="#33363a" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
