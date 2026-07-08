import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useEraAssets } from '../../hooks/useEraAssets';

/**
 * Era-specific menu board with Drei Text showing era typography and prices.
 * Chalkboard (1945/1965) → printed board (1985) → backlit (2005) → digital (2025) → holographic (2055).
 */
export function MenuBoard() {
  const era = useEraAssets();
  const id = era.id;

  // Board position — on the wall behind the counter
  const pos: [number, number, number] = [2, 3, -6.95];

  // Generate the menu board texture/look per era type
  const variant = useMemo(() => {
    if (id === '1945' || id === '1965') return 'chalkboard';
    if (id === '1985') return 'printed';
    if (id === '2005') return 'backlit';
    if (id === '2025') return 'digital';
    return 'holographic';
  }, [id]);

  return (
    <group position={pos}>
      <BoardSurface variant={variant} />
    </group>
  );
}

function BoardSurface({
  variant,
}: {
  variant: 'chalkboard' | 'printed' | 'backlit' | 'digital' | 'holographic';
}) {
  const era = useEraAssets();

  // Colour and material per variant
  const boardConfig = useMemo(() => {
    switch (variant) {
      case 'chalkboard':
        return {
          bg: '#1a2018',
          frame: '#5A3A1A',
          textColor: '#f5f0e0',
          titleColor: '#f5f0e0',
          emissive: '#000000',
          emissiveIntensity: 0,
        };
      case 'printed':
        return {
          bg: '#f5f0e0',
          frame: '#8B4513',
          textColor: '#1a1a1a',
          titleColor: '#c0392b',
          emissive: '#000000',
          emissiveIntensity: 0,
        };
      case 'backlit':
        return {
          bg: '#fff8e8',
          frame: '#2D6A4F',
          textColor: '#1a1a1a',
          titleColor: '#2D6A4F',
          emissive: '#fff8e8',
          emissiveIntensity: 0.3,
        };
      case 'digital':
        return {
          bg: '#0a0a0a',
          frame: '#1a1a1a',
          textColor: '#ffffff',
          titleColor: '#E0A458',
          emissive: '#111111',
          emissiveIntensity: 0.5,
        };
      case 'holographic':
        return {
          bg: '#050510',
          frame: '#00E5FF',
          textColor: '#E0F7FA',
          titleColor: '#00E5FF',
          emissive: '#001a2a',
          emissiveIntensity: 1,
        };
    }
  }, [variant]);

  const w = 2.2;
  const h = 1.5;

  return (
    <group>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[w + 0.15, h + 0.15, 0.06]} />
        <meshStandardMaterial color={boardConfig.frame} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Board surface */}
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          color={boardConfig.bg}
          emissive={boardConfig.emissive}
          emissiveIntensity={boardConfig.emissiveIntensity}
          roughness={variant === 'holographic' ? 0.1 : 0.7}
          metalness={variant === 'digital' || variant === 'holographic' ? 0.5 : 0.1}
        />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 0.5, 0.06]}
        fontSize={0.18}
        color={boardConfig.titleColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={variant === 'chalkboard' ? 0 : 0.002}
        outlineColor="#000"
      >
        MENU
      </Text>

      {/* Divider line */}
      <mesh position={[0, 0.35, 0.055]}>
        <boxGeometry args={[w * 0.8, 0.008, 0.002]} />
        <meshStandardMaterial
          color={boardConfig.titleColor}
          emissive={variant === 'digital' || variant === 'holographic' ? boardConfig.titleColor : '#000'}
          emissiveIntensity={variant === 'digital' || variant === 'holographic' ? 1 : 0}
        />
      </mesh>

      {/* Menu items */}
      {era.menu.map((item, i) => {
        const y = 0.15 - i * 0.28;
        const priceStr =
          item.price < 1
            ? `${Math.round(item.price * 100)}¢`
            : `$${item.price.toFixed(2)}`;
        return (
          <group key={item.name}>
            <Text
              position={[-0.5, y, 0.06]}
              fontSize={0.11}
              color={boardConfig.textColor}
              anchorX="left"
              anchorY="middle"
              maxWidth={1.2}
            >
              {item.name}
            </Text>
            <Text
              position={[0.7, y, 0.06]}
              fontSize={0.11}
              color={boardConfig.titleColor}
              anchorX="right"
              anchorY="middle"
            >
              {priceStr}
            </Text>
          </group>
        );
      })}

      {/* Decorative elements per era */}
      {variant === 'holographic' && (
        <>
          {/* Holographic glow border */}
          <mesh position={[0, 0, 0.03]}>
            <ringGeometry args={[1.1, 1.15, 4]} />
            <meshStandardMaterial
              color="#00E5FF"
              emissive="#00E5FF"
              emissiveIntensity={2}
              transparent
              opacity={0.5}
            />
          </mesh>
          <pointLight position={[0, 0, 0.5]} color="#00E5FF" intensity={0.5} distance={3} />
        </>
      )}

      {variant === 'digital' && (
        <mesh position={[1.0, 0.65, 0.06]}>
          <circleGeometry args={[0.02, 8]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={3} />
        </mesh>
      )}
    </group>
  );
}

/** Helper export for potential reuse. */
export function makeMenuTexture(eraId: string): THREE.CanvasTexture | null {
  void eraId;
  return null;
}
