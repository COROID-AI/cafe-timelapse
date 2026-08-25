import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ERA_CONFIGS, ERA_YEARS } from "../../eras/eraConfig";
import { POSTER_SLOTS } from "../../eras/posters";
import { getCachedTextTexture } from "../../utils/canvasTexture";
import { dominantEraIndex } from "../TransitionController";

/**
 * Framed posters on the back wall — three slots, one cached canvas
 * texture per (era × slot). Maps swap at the blend midpoint; frames
 * stay mounted.
 */

const WALL_Z = -5.94;

function PosterFrame({ slot }: { slot: number }) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const appliedEra = useRef(-1);
  const spot = POSTER_SLOTS[slot];

  const textures = useMemo(
    () =>
      ERA_YEARS.map((year) => {
        const cfg = ERA_CONFIGS[year];
        const poster = cfg.posters[slot % cfg.posters.length];
        return getCachedTextTexture(`poster:${year}:${slot}`, {
          lines: [`“${poster.title}”`, "", poster.artist],
          bg: poster.color,
          fg: cfg.posterBoard.fg,
          font: cfg.posterBoard.font,
          width: 256,
          height: 384,
        });
      }),
    [slot],
  );

  useFrame(() => {
    const active = dominantEraIndex();
    if (material.current && active !== appliedEra.current) {
      const tex = textures[active];
      if (tex) {
        material.current.map = tex;
        material.current.needsUpdate = true;
      }
      appliedEra.current = active;
    }
  });

  return (
    <group position={[spot.x, spot.y, WALL_Z]}>
      <mesh>
        <planeGeometry args={[1.15, 1.7]} />
        <meshStandardMaterial ref={material} map={textures[0] ?? undefined} roughness={0.9} />
      </mesh>
      {/* Frame border */}
      <mesh position={[0, 0.89, -0.01]}>
        <boxGeometry args={[1.27, 0.07, 0.05]} />
        <meshStandardMaterial color="#2e241a" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.89, -0.01]}>
        <boxGeometry args={[1.27, 0.07, 0.05]} />
        <meshStandardMaterial color="#2e241a" roughness={0.6} />
      </mesh>
      <mesh position={[0.62, 0, -0.01]}>
        <boxGeometry args={[0.06, 1.84, 0.05]} />
        <meshStandardMaterial color="#2e241a" roughness={0.6} />
      </mesh>
      <mesh position={[-0.62, 0, -0.01]}>
        <boxGeometry args={[0.06, 1.84, 0.05]} />
        <meshStandardMaterial color="#2e241a" roughness={0.6} />
      </mesh>
    </group>
  );
}

export default function Posters() {
  return (
    <group>
      {[0, 1, 2].map((slot) => (
        <PosterFrame key={slot} slot={slot} />
      ))}
    </group>
  );
}
