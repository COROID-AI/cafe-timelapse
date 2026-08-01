import { useMemo } from 'react';
import type { EraConfig } from '../types/era';

interface MenuBoardProps {
  era: EraConfig;
  progress: number;
}

/**
 * The café's menu board, showing era-specific items with period-correct
 * prices. Text is rendered as simple glyph panels so it stays sharp without
 * font loading dependencies.
 */
export function MenuBoard({ era, progress }: MenuBoardProps) {
  const menu = era.menu;
  const boardColor = era.decorTheme === 'holo' ? '#0a1420' : era.decorTheme === 'wartime' ? '#241a10' : '#1c1a16';
  const textColor = era.decorTheme === 'holo' ? '#8fd4ff' : era.decorTheme === 'neon' ? '#ffd27f' : '#f2e3c0';

  // Placeholder glyph rectangles (no external font assets).
  const glyphs = useMemo(() => {
    const out: { x: number; y: number; w: number; h: number; color: string }[] = [];
    menu.forEach((item, r) => {
      const cols = Math.min(item.name.length, 12);
      const priceCols = Math.min(item.price.length, 8);
      for (let c = 0; c < cols; c++) {
        out.push({ x: -1.5 + c * 0.13, y: 0.7 - r * 0.34, w: 0.1, h: 0.16, color: textColor });
      }
      for (let c = 0; c < priceCols; c++) {
        out.push({ x: 1.35 - priceCols * 0.07 + c * 0.13, y: 0.7 - r * 0.34, w: 0.1, h: 0.16, color: '#ffd27f' });
      }
    });
    return out;
  }, [menu, textColor]);

  void progress;

  return (
    <group position={[-1.2, 2.1, -2.82]}>
      {/* Board frame */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[3.4, 2.0, 0.08]} />
        <meshStandardMaterial color={boardColor} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Board face */}
      <mesh position={[0, 0.4, 0.05]}>
        <planeGeometry args={[3.2, 1.8]} />
        <meshStandardMaterial color={boardColor} roughness={0.9} />
      </mesh>
      {/* Title */}
      <mesh position={[0, 1.15, 0.06]}>
        <planeGeometry args={[2.6, 0.22]} />
        <meshBasicMaterial color={textColor} transparent opacity={0.0} />
      </mesh>
      {/* Glyph text */}
      {glyphs.map((g, i) => (
        <mesh key={i} position={[g.x, g.y, 0.06]}>
          <boxGeometry args={[g.w, g.h, 0.01]} />
          <meshBasicMaterial color={g.color} />
        </mesh>
      ))}
      {/* Hanging chains */}
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 1.45, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
          <meshStandardMaterial color="#6a6a6e" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
