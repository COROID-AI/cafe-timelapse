import { useMemo } from 'react';
import { useEraAssets } from '../../hooks/useEraAssets';
import { Tableware } from './Tableware';

/**
 * Tables whose base, top, and chairs differ per era.
 * Uses InstancedMesh-friendly structure for performance.
 */
export function Tables() {
  const era = useEraAssets();
  const style = era.furniture.tableStyle;

  // Table positions in the café
  const positions: Array<[number, number, number]> = useMemo(
    () => [
      [-4, 0, 2],
      [-4, 0, -1.5],
      [-1, 0, 3.5],
      [3.5, 0, 2],
    ],
    [],
  );

  return (
    <group>
      {positions.map((pos, i) => (
        <TableSet key={`${style}-${i}`} position={pos} style={style} index={i} />
      ))}
    </group>
  );
}

function TableSet({
  position,
  style,
  index,
}: {
  position: [number, number, number];
  style: string;
  index: number;
}) {
  const era = useEraAssets();
  const f = era.furniture;

  return (
    <group position={position}>
      <TableTop style={style} accentColor={f.accentColor} />
      <Chairs style={era.furniture.chairStyle} accentColor={f.accentColor} />
      {/* Tableware on some tables */}
      {index < 2 && <Tableware />}
    </group>
  );
}

function TableTop({
  style,
  accentColor,
}: {
  style: string;
  accentColor: string;
}) {
  const config = useMemo(() => {
    switch (style) {
      case 'bentwood-marble':
        return {
          topColor: '#E8E4DE',
          topMat: 'marble' as const,
          baseColor: '#6B4423',
          topRoughness: 0.2,
          topMetalness: 0.1,
        };
      case 'formica-vinyl':
        return {
          topColor: '#e8e8e0',
          topMat: 'solid' as const,
          baseColor: '#c0c0c0',
          topRoughness: 0.3,
          topMetalness: 0.2,
        };
      case 'smoked-glass-chrome':
        return {
          topColor: '#2a2a35',
          topMat: 'glass' as const,
          baseColor: '#c0c0c0',
          topRoughness: 0.05,
          topMetalness: 0.3,
        };
      case 'light-wood-ikea':
        return {
          topColor: '#d4a874',
          topMat: 'wood' as const,
          baseColor: '#b89868',
          topRoughness: 0.6,
          topMetalness: 0.05,
        };
      case 'terrazzo-oak':
        return {
          topColor: '#c8c0b8',
          topMat: 'terrazzo' as const,
          baseColor: '#8B7355',
          topRoughness: 0.4,
          topMetalness: 0.1,
        };
      case 'maglev':
        return {
          topColor: '#1a2a3a',
          topMat: 'glass' as const,
          baseColor: '#00E5FF',
          topRoughness: 0.02,
          topMetalness: 0.5,
        };
      default:
        return {
          topColor: '#8B6B4A',
          topMat: 'wood' as const,
          baseColor: '#5A3A1A',
          topRoughness: 0.6,
          topMetalness: 0.1,
        };
    }
  }, [style]);

  const isMaglev = style === 'maglev';

  return (
    <group>
      {isMaglev ? (
        <>
          {/* Magnetic levitation disk — floating */}
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.5, 0.04, 32]} />
            <meshPhysicalMaterial
              color={config.topColor}
              roughness={config.topRoughness}
              metalness={config.topMetalness}
              transmission={0.5}
              transparent
              opacity={0.6}
            />
          </mesh>
          {/* Magnetic ring base */}
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.4, 0.03, 8, 32]} />
            <meshStandardMaterial color={config.baseColor} emissive={config.baseColor} emissiveIntensity={1.5} />
          </mesh>
          {/* Levitation glow */}
          <pointLight position={[0, 0.5, 0]} color={config.baseColor} intensity={0.3} distance={2} />
        </>
      ) : config.topMat === 'glass' ? (
        <>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.5, 0.03, 32]} />
            <meshPhysicalMaterial
              color={config.topColor}
              roughness={config.topRoughness}
              metalness={config.topMetalness}
              transmission={0.7}
              transparent
              opacity={0.5}
            />
          </mesh>
          {/* Pedestal base */}
          <mesh position={[0, 0.37, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.74, 12]} />
            <meshStandardMaterial color={config.baseColor} metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.22, 0.04, 16]} />
            <meshStandardMaterial color={config.baseColor} metalness={0.7} roughness={0.25} />
          </mesh>
        </>
      ) : (
        <>
          {/* Solid / wood / marble top */}
          <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.04, 32]} />
            <meshStandardMaterial
              color={config.topColor}
              roughness={config.topRoughness}
              metalness={config.topMetalness}
            />
          </mesh>
          {/* Pedestal base */}
          <mesh position={[0, 0.37, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.74, 12]} />
            <meshStandardMaterial color={config.baseColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.03, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.25, 0.05, 16]} />
            <meshStandardMaterial color={config.baseColor} roughness={0.6} />
          </mesh>
        </>
      )}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.001, 4, 4]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>
    </group>
  );
}

function Chairs({
  style,
  accentColor,
}: {
  style: string;
  accentColor: string;
}) {
  // Place 2 chairs around the table
  const chairPositions: Array<[number, number, number, number]> = [
    [0, 0, 0.85, 0],
    [0, 0, -0.85, Math.PI],
  ];

  return (
    <group>
      {chairPositions.map(([x, y, z, rot], i) => (
        <Chair key={i} position={[x, y, z]} rotation={[0, rot, 0]} style={style} accentColor={accentColor} />
      ))}
    </group>
  );
}

function Chair({
  position,
  rotation,
  style,
  accentColor,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  style: string;
  accentColor: string;
}) {
  const config = useMemo(() => {
    switch (style) {
      case 'bentwood':
        return { seatColor: '#8B6B4A', legColor: '#6B4423', backColor: '#6B4423', metalness: 0.1, roughness: 0.7 };
      case 'vinyl':
        return { seatColor: '#c0392b', legColor: '#c0c0c0', backColor: '#c0392b', metalness: 0.5, roughness: 0.4 };
      case 'chrome':
        return { seatColor: '#2a2a35', legColor: '#d0d0d0', backColor: '#2a2a35', metalness: 0.8, roughness: 0.2 };
      case 'plywood':
        return { seatColor: '#d4a874', legColor: '#b89868', backColor: '#d4a874', metalness: 0.1, roughness: 0.6 };
      case 'oak-minimal':
        return { seatColor: '#c8b898', legColor: '#a89878', backColor: '#c8b898', metalness: 0.05, roughness: 0.5 };
      case 'acrylic':
        return { seatColor: '#e0f7fa', legColor: '#e0f7fa', backColor: '#e0f7fa', metalness: 0.2, roughness: 0.05 };
      default:
        return { seatColor: '#8B6B4A', legColor: '#6B4423', backColor: '#6B4423', metalness: 0.1, roughness: 0.7 };
    }
  }, [style]);

  const isAcrylic = style === 'acrylic';

  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.4, 0.04, 0.4]} />
        <meshStandardMaterial
          color={config.seatColor}
          metalness={config.metalness}
          roughness={config.roughness}
          transparent={isAcrylic}
          opacity={isAcrylic ? 0.5 : 1}
        />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.65, -0.18]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.03]} />
        <meshStandardMaterial
          color={config.backColor}
          metalness={config.metalness}
          roughness={config.roughness}
          transparent={isAcrylic}
          opacity={isAcrylic ? 0.5 : 1}
        />
      </mesh>
      {/* Legs */}
      {[
        [-0.17, -0.17],
        [0.17, -0.17],
        [-0.17, 0.17],
        [0.17, 0.17],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.22, lz]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.45, 8]} />
          <meshStandardMaterial
            color={config.legColor}
            metalness={config.metalness}
            roughness={config.roughness}
          />
        </mesh>
      ))}
      {/* Accent detail */}
      <mesh position={[0, 0.85, -0.18]}>
        <boxGeometry args={[0.38, 0.03, 0.02]} />
        <meshBasicMaterial color={accentColor} visible={false} />
      </mesh>
    </group>
  );
}
