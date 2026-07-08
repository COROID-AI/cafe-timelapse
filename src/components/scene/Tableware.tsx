import { useMemo } from 'react';
import * as THREE from 'three';
import { useEraAssets } from '../../hooks/useEraAssets';

/**
 * Cups, saucers, plates, glasses, sugar bowls, cutlery per era.
 * Built from primitives — sits on tables.
 */
export function Tableware() {
  const era = useEraAssets();
  const kind = era.tableware;

  const config = useMemo(() => {
    switch (kind) {
      case 'china-silver':
        return {
          cupColor: '#f8f4ec',
          plateColor: '#f0ece4',
          saucerColor: '#f8f4ec',
          metalness: 0.8,
          roughness: 0.15,
          cutleryColor: '#c0c0c0',
          glass: false,
        };
      case 'thick-ceramic':
        return {
          cupColor: '#e8e0d0',
          plateColor: '#d8d0c0',
          saucerColor: '#e8e0d0',
          metalness: 0.5,
          roughness: 0.5,
          cutleryColor: '#a0a0a0',
          glass: false,
        };
      case 'stoneware-bright':
        return {
          cupColor: '#FF2D95',
          plateColor: '#00D9FF',
          saucerColor: '#9D4EDD',
          metalness: 0.1,
          roughness: 0.7,
          cutleryColor: '#c0c0c0',
          glass: false,
        };
      case 'white-porcelain':
        return {
          cupColor: '#ffffff',
          plateColor: '#ffffff',
          saucerColor: '#ffffff',
          metalness: 0.1,
          roughness: 0.2,
          cutleryColor: '#a0a0a0',
          glass: false,
        };
      case 'matte-black':
        return {
          cupColor: '#1a1a1a',
          plateColor: '#2a2a2a',
          saucerColor: '#1a1a1a',
          metalness: 0.2,
          roughness: 0.8,
          cutleryColor: '#404040',
          glass: false,
        };
      case 'crystal-glass':
        return {
          cupColor: '#e0f7fa',
          plateColor: '#e0f7fa',
          saucerColor: '#e0f7fa',
          metalness: 0.3,
          roughness: 0.02,
          cutleryColor: '#00E5FF',
          glass: true,
        };
      default:
        return {
          cupColor: '#ffffff',
          plateColor: '#ffffff',
          saucerColor: '#ffffff',
          metalness: 0.1,
          roughness: 0.3,
          cutleryColor: '#c0c0c0',
          glass: false,
        };
    }
  }, [kind]);

  return (
    <group position={[0, 0.77, 0]}>
      {/* Saucer */}
      <mesh position={[0, 0.005, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.09, 0.012, 24]} />
        <meshStandardMaterial
          color={config.saucerColor}
          metalness={config.metalness}
          roughness={config.roughness}
          transparent={config.glass}
          opacity={config.glass ? 0.4 : 1}
          transmission={config.glass ? 0.8 : 0}
        />
      </mesh>
      {/* Cup */}
      <mesh position={[0, 0.045, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.06, 16]} />
        <meshStandardMaterial
          color={config.cupColor}
          metalness={config.metalness}
          roughness={config.roughness}
          transparent={config.glass}
          opacity={config.glass ? 0.4 : 1}
          transmission={config.glass ? 0.8 : 0}
        />
      </mesh>
      {/* Coffee liquid */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.01, 16]} />
        <meshStandardMaterial
          color={kind === 'crystal-glass' ? '#4a2a1a' : '#2a1a08'}
          roughness={0.1}
        />
      </mesh>
      {/* Cup handle */}
      <mesh position={[0.05, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.025, 0.008, 8, 16, Math.PI]} />
        <meshStandardMaterial
          color={config.cupColor}
          metalness={config.metalness}
          roughness={config.roughness}
          transparent={config.glass}
          opacity={config.glass ? 0.4 : 1}
        />
      </mesh>

      {/* Small plate */}
      <mesh position={[0.15, 0.008, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.07, 0.01, 24]} />
        <meshStandardMaterial
          color={config.plateColor}
          metalness={config.metalness}
          roughness={config.roughness}
          transparent={config.glass}
          opacity={config.glass ? 0.4 : 1}
          transmission={config.glass ? 0.8 : 0}
        />
      </mesh>

      {/* Cutlery — fork and knife */}
      <mesh position={[-0.12, 0.008, 0.05]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.015, 0.005, 0.12]} />
        <meshStandardMaterial color={config.cutleryColor} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.15, 0.008, -0.05]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.012, 0.005, 0.12]} />
        <meshStandardMaterial color={config.cutleryColor} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Sugar bowl (only for earlier eras) */}
      {(kind === 'china-silver' || kind === 'thick-ceramic') && (
        <mesh position={[0.18, 0.04, 0.12]} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.06, 16]} />
          <meshStandardMaterial color={config.cupColor} roughness={config.roughness} />
        </mesh>
      )}
    </group>
  );
}

/** Expose for potential reuse. */
export const _tablewareHelpers = { THREE };
