import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ERA_CONFIGS, ERA_YEARS } from "../../eras/eraConfig";
import { getCachedTextTexture } from "../../utils/canvasTexture";
import { dominantEraIndex, transitionState } from "../TransitionController";

/**
 * Hanging café sign above the counter. One cached texture per era; the
 * halo/backlight intensity ramps for backlit-panel eras onward.
 */

const SIGN_POS: [number, number, number] = [1.6, 3.15, -5.9];

export default function Signage() {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const haloMat = useRef<THREE.MeshStandardMaterial>(null);
  const appliedEra = useRef(-1);

  const textures = useMemo(
    () =>
      ERA_YEARS.map((year) => {
        const cfg = ERA_CONFIGS[year];
        return getCachedTextTexture(`signage:${year}`, {
          lines: [cfg.signageText],
          bg:
            year <= 1965
              ? "#241c14"
              : year === 1985
                ? "#0d0d18"
                : year === 2005
                  ? "#20242a"
                  : "#101820",
          fg: cfg.palette.accent,
          font: year >= 2005 ? "600 54px Inter, Segoe UI, sans-serif" : "700 58px Georgia, serif",
          glow: cfg.menuBoard.glow,
          width: 768,
          height: 192,
        });
      }),
    [],
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
    if (haloMat.current) {
      const a = ERA_CONFIGS[ERA_YEARS[transitionState.from]].palette.accent;
      const b = ERA_CONFIGS[ERA_YEARS[transitionState.to]].palette.accent;
      haloMat.current.emissive.set(a).lerp(new THREE.Color(b), transitionState.t);
      haloMat.current.emissiveIntensity = active >= 2 ? 0.9 : 0.12;
    }
  });

  return (
    <group position={SIGN_POS}>
      {/* Halo panel behind the lettering */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[3.9, 1.05]} />
        <meshStandardMaterial ref={haloMat} color="#181410" emissive="#e8a04c" emissiveIntensity={0.12} />
      </mesh>
      <mesh>
        <planeGeometry args={[3.8, 0.95]} />
        <meshStandardMaterial ref={material} map={textures[0] ?? undefined} roughness={0.85} />
      </mesh>
      {/* Hanging chains */}
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} position={[x, 3.86, -0.05]}>
          <cylinderGeometry args={[0.012, 0.012, 0.48, 6]} />
          <meshStandardMaterial color="#33363a" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
