import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ERA_CONFIGS, ERA_YEARS } from "../../eras/eraConfig";
import { transitionState } from "../TransitionController";

/**
 * Café tables + chairs. One shared set of materials is retargeted every
 * frame between era furniture params — chrome tubes morph into bentwood,
 * cushions re-colour — without remounting a single mesh.
 */

interface TableSpot {
  x: number;
  z: number;
  chairs: Array<{ x: number; z: number; rot: number }>;
}

const TABLES: TableSpot[] = [
  {
    x: -3.2,
    z: 1.6,
    chairs: [
      { x: -3.2, z: 2.6, rot: Math.PI },
      { x: -2.2, z: 1.6, rot: -Math.PI / 2 },
      { x: -4.2, z: 1.6, rot: Math.PI / 2 },
    ],
  },
  {
    x: -0.4,
    z: 2.6,
    chairs: [
      { x: -0.4, z: 3.6, rot: Math.PI },
      { x: 0.6, z: 2.6, rot: -Math.PI / 2 },
      { x: -1.4, z: 2.6, rot: Math.PI / 2 },
    ],
  },
  {
    x: -2.4,
    z: -1.9,
    chairs: [
      { x: -2.4, z: -0.9, rot: 0 },
      { x: -1.4, z: -1.9, rot: Math.PI / 2 },
      { x: -3.4, z: -1.9, rot: -Math.PI / 2 },
    ],
  },
];

export default function Furniture() {
  const legMat = useRef<THREE.MeshStandardMaterial>(null);
  const cushionMat = useRef<THREE.MeshStandardMaterial>(null);
  const topMat = useRef<THREE.MeshStandardMaterial>(null);

  const chairSpots = useMemo(() => TABLES.flatMap((t) => t.chairs), []);

  useFrame(() => {
    const a = ERA_CONFIGS[ERA_YEARS[transitionState.from]].furnitureParams;
    const b = ERA_CONFIGS[ERA_YEARS[transitionState.to]].furnitureParams;
    const t = transitionState.t;

    if (legMat.current) {
      legMat.current.metalness = THREE.MathUtils.lerp(a.legMetalness, b.legMetalness, t);
      legMat.current.color.set(a.legColor).lerp(new THREE.Color(b.legColor), t);
      legMat.current.roughness = THREE.MathUtils.lerp(1 - a.legMetalness * 0.7, 1 - b.legMetalness * 0.7, t);
    }
    if (cushionMat.current) {
      cushionMat.current.color.set(a.cushionColor).lerp(new THREE.Color(b.cushionColor), t);
    }
    if (topMat.current) {
      topMat.current.color.set(a.tabletopColor).lerp(new THREE.Color(b.tabletopColor), t);
    }
  });

  return (
    <group>
      {/* Tables */}
      {TABLES.map((table) => (
        <group key={`${table.x}:${table.z}`} position={[table.x, 0, table.z]}>
          <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.05, 22]} />
            <meshStandardMaterial ref={topMat} color="#d9d2c5" roughness={0.35} metalness={0.08} />
          </mesh>
          <mesh position={[0, 0.37, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.09, 0.72, 10]} />
            <meshStandardMaterial ref={legMat} color="#3c2f22" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.3, 0.33, 0.04, 16]} />
            <meshStandardMaterial color="#2e241a" roughness={0.75} />
          </mesh>
        </group>
      ))}

      {/* Chairs */}
      {chairSpots.map((chair, i) => (
        <group key={i} position={[chair.x, 0, chair.z]} rotation={[0, chair.rot, 0]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[0.42, 0.05, 0.42]} />
            <meshStandardMaterial ref={i === 0 ? cushionMat : undefined} color="#7a4a3a" roughness={0.85} />
          </mesh>
          {/* Backrest hoop */}
          <mesh position={[0, 0.78, -0.19]} rotation={[0.18, 0, 0]}>
            <torusGeometry args={[0.17, 0.02, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#5a4632" roughness={0.7} />
          </mesh>
          {[[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].map(([lx, lz]) => (
            <mesh key={`${lx}:${lz}`} position={[lx, 0.225, lz]} castShadow>
              <cylinderGeometry args={[0.018, 0.022, 0.45, 8]} />
              <meshStandardMaterial color="#4a3a28" roughness={0.75} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
