import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ERA_CONFIGS, ERA_YEARS } from "../../eras/eraConfig";
import { boardLines } from "../../eras/menus";
import { getCachedTextTexture } from "../../utils/canvasTexture";
import { dominantEraIndex } from "../TransitionController";

/**
 * Menu board on the wall behind the counter. Six canvas textures are
 * generated once and cached by spec key; a single mesh swaps its map at
 * the blend midpoint (no remounting), while the backlight glow fades in
 * for backlit-panel eras.
 */

const BOARD_POS: [number, number, number] = [7.9, 2.5, -0.6];

export default function MenuBoard() {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowMat = useRef<THREE.MeshStandardMaterial>(null);
  const appliedEra = useRef(-1);

  const textures = useMemo(
    () =>
      ERA_YEARS.map((year) => {
        const cfg = ERA_CONFIGS[year];
        return getCachedTextTexture(`menu:${year}`, {
          lines: boardLines(cfg.menuItems, year),
          bg: cfg.menuBoard.bg,
          fg: cfg.menuBoard.fg,
          font: cfg.menuBoard.font,
          glow: cfg.menuBoard.glow,
          width: 512,
          height: 384,
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
    if (frameMat.current) {
      // Frame re-colours toward the era accent.
      mixAccent(frameMat.current.color);
    }
    if (glowMat.current) {
      const lit = active >= 2 ? 1 : active === 1 ? 0.35 : 0;
      const target = lit * 0.9;
      glowMat.current.emissiveIntensity +=
        (target - glowMat.current.emissiveIntensity) * 0.12;
    }
    void mesh.current;
  });

  return (
    <group position={BOARD_POS} rotation={[0, -Math.PI / 2, 0]}>
      {/* Backlight panel */}
      <mesh position={[0, 0, -0.035]}>
        <planeGeometry args={[2.3, 1.55]} />
        <meshStandardMaterial ref={glowMat} color="#fff4dd" emissive="#ffedc4" emissiveIntensity={0} />
      </mesh>
      {/* Board face */}
      <mesh ref={mesh}>
        <planeGeometry args={[2.2, 1.45]} />
        <meshStandardMaterial ref={material} map={textures[0] ?? undefined} roughness={0.85} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 0.755, 0]}>
        <boxGeometry args={[2.34, 0.07, 0.06]} />
        <meshStandardMaterial ref={frameMat} color="#4a3728" roughness={0.65} />
      </mesh>
      <mesh position={[0, -0.755, 0]}>
        <boxGeometry args={[2.34, 0.07, 0.06]} />
        <meshStandardMaterial color="#4a3728" roughness={0.65} />
      </mesh>
      <mesh position={[1.17, 0, 0]}>
        <boxGeometry args={[0.07, 1.58, 0.06]} />
        <meshStandardMaterial color="#4a3728" roughness={0.65} />
      </mesh>
      <mesh position={[-1.17, 0, 0]}>
        <boxGeometry args={[0.07, 1.58, 0.06]} />
        <meshStandardMaterial color="#4a3728" roughness={0.65} />
      </mesh>
    </group>
  );
}

import { transitionState } from "../TransitionController";
const accentScratch = new THREE.Color();
function mixAccent(out: THREE.Color): void {
  const a = ERA_CONFIGS[ERA_YEARS[transitionState.from]].palette.accent;
  const b = ERA_CONFIGS[ERA_YEARS[transitionState.to]].palette.accent;
  out.set(a).lerp(accentScratch.set(b), transitionState.t);
}
