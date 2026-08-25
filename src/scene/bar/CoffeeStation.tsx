import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ERA_CONFIGS, ERA_YEARS } from "../../eras/eraConfig";
import { dominantEraIndex, transitionState } from "../TransitionController";

/**
 * Espresso / brewing station on the counter. The machine body persists
 * and re-skins per era (colour + metalness + emissive), while era-only
 * attachments (lever arm, hopper grinder, pour-over kettle, molecular
 * orb) stay mounted and flip visibility at the blend midpoint.
 */

const BASE = [5.62, 1.09, -2.3] as const;

export default function CoffeeStation() {
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
  const leverRef = useRef<THREE.Group>(null);
  const grinderRef = useRef<THREE.Group>(null);
  const pouroverRef = useRef<THREE.Group>(null);
  const orbRef = useRef<THREE.Group>(null);
  const orbCore = useRef<THREE.MeshStandardMaterial>(null);
  const steamRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  useFrame((state) => {
    const a = ERA_CONFIGS[ERA_YEARS[transitionState.from]].machineParams;
    const b = ERA_CONFIGS[ERA_YEARS[transitionState.to]].machineParams;
    const t = transitionState.t;
    const time = state.clock.elapsedTime;

    if (bodyMat.current) {
      bodyMat.current.color.set(a.bodyColor).lerp(new THREE.Color(b.bodyColor), t);
      bodyMat.current.metalness = THREE.MathUtils.lerp(a.metalness, b.metalness, t);
      bodyMat.current.roughness = THREE.MathUtils.lerp(a.roughness, b.roughness, t);
      bodyMat.current.emissive.set(a.emissive).lerp(new THREE.Color(b.emissive), t);
      bodyMat.current.emissiveIntensity = THREE.MathUtils.lerp(
        a.emissiveIntensity,
        b.emissiveIntensity,
        t,
      );
    }

    const active = dominantEraIndex();
    if (leverRef.current) leverRef.current.visible = active === 0 || active === 1;
    if (grinderRef.current) grinderRef.current.visible = active >= 1 && active <= 4;
    if (pouroverRef.current) pouroverRef.current.visible = active === 4;

    // Molecular brew orb: floats + spins in 2055 only.
    if (orbRef.current) {
      orbRef.current.visible = active === 5;
      orbRef.current.rotation.y = time * 0.9;
      orbRef.current.position.y = 1.75 + Math.sin(time * 1.6) * 0.06;
      if (orbCore.current) {
        orbCore.current.emissiveIntensity = 1.2 + Math.sin(time * 2.4) * 0.5;
      }
    }

    // Steam wisps rise & fade on a loop.
    for (let i = 0; i < steamRefs.length; i++) {
      const mesh = steamRefs[i].current;
      if (!mesh) continue;
      const phase = (time * 0.5 + i / steamRefs.length) % 1;
      mesh.position.y = BASE[1] + 0.42 + phase * 0.55;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.28 * Math.sin(phase * Math.PI);
    }
  });

  return (
    <group position={[BASE[0], 0, BASE[2]]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Persistent machine body */}
      <group position={[0, BASE[1], 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.92, 0.42, 0.55]} />
          <meshStandardMaterial ref={bodyMat} color="#b8862f" metalness={0.65} roughness={0.35} />
        </mesh>
        {/* Group head */}
        <mesh position={[0.22, -0.28, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.055, 0.16, 12]} />
          <meshStandardMaterial color="#8d9096" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* Portafilter handle */}
        <mesh position={[0.38, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.24, 8]} />
          <meshStandardMaterial color="#241f1a" roughness={0.6} />
        </mesh>
        {/* Drip tray */}
        <mesh position={[0.25, -0.37, 0]}>
          <boxGeometry args={[0.5, 0.03, 0.34]} />
          <meshStandardMaterial color="#33363a" metalness={0.7} roughness={0.35} />
        </mesh>
        {/* Steam wand */}
        <mesh position={[0.18, -0.18, 0.2]} rotation={[0.5, 0, 0.35]}>
          <cylinderGeometry args={[0.008, 0.008, 0.26, 6]} />
          <meshStandardMaterial color="#c0c4ca" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Lever arm — 1945/1965 only */}
        <group ref={leverRef} position={[-0.32, 0.24, 0]} visible={false}>
          <mesh rotation={[0.35, 0, 0]}>
            <boxGeometry args={[0.05, 0.5, 0.05]} />
            <meshStandardMaterial color="#b8862f" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.27, 0.08]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#241f1a" roughness={0.55} />
          </mesh>
        </group>
      </group>

      {/* Hopper grinder — mod era onward */}
      <group ref={grinderRef} position={[-0.72, 1.09, 0.1]} visible={false}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.34, 0.26]} />
          <meshStandardMaterial color="#23262b" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <coneGeometry args={[0.13, 0.2, 12]} />
          <meshStandardMaterial color="#3a3e44" transparent opacity={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* Pour-over kettle + dripper — specialty era */}
      <group ref={pouroverRef} position={[-0.72, 1.09, -0.35]} visible={false}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.2, 14]} />
          <meshStandardMaterial color="#c9cdd2" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0.13, 0.14, 0]} rotation={[0, 0, -0.9]}>
          <cylinderGeometry args={[0.012, 0.02, 0.22, 8]} />
          <meshStandardMaterial color="#c9cdd2" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0.3, 0.04, 0]}>
          <coneGeometry args={[0.085, 0.16, 14]} />
          <meshStandardMaterial color="#e8a04c" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Molecular assembler orb — 2055 only */}
      <group ref={orbRef} position={[-0.3, 1.75, 0]} visible={false}>
        <mesh>
          <sphereGeometry args={[0.17, 20, 20]} />
          <meshStandardMaterial ref={orbCore} color="#123039" emissive="#37e6ff" emissiveIntensity={1.2} transparent opacity={0.75} />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0, 0.3]}>
          <torusGeometry args={[0.26, 0.008, 8, 40]} />
          <meshStandardMaterial color="#37e6ff" emissive="#37e6ff" emissiveIntensity={1.6} />
        </mesh>
        <pointLight color="#37e6ff" intensity={0.5} distance={2.2} />
      </group>

      {/* Steam wisps (always alive; opacity animated above) */}
      {steamRefs.map((ref, i) => (
        <mesh key={i} ref={ref} position={[0.2, BASE[1] + 0.5, i * 0.07 - 0.07]}>
          <planeGeometry args={[0.16, 0.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
