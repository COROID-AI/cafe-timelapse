import { useMemo } from 'react';
import type { EraConfig, TillType } from '../types/era';
import { lerpColor } from '../utils/interpolation';

interface CounterStationProps {
  from: EraConfig;
  to: EraConfig;
  progress: number;
}

function css(c: { r: number; g: number; b: number }): string {
  return `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
}

const TILL_LABEL: Record<TillType, string> = {
  register: 'CASH REGISTER',
  cash: 'CASHIER',
  electronic: 'E-POS',
  touchscreen: 'TOUCH POS',
  tablet: 'iPad POS',
  neural: 'NEURAL TILL',
};

/**
 * The service counter along the back wall, with a period-correct till
 * (cash register → neural till) and display text that changes with the era.
 */
export function CounterStation({ from, to, progress }: CounterStationProps) {
  const counterTop = useMemo(() => css(lerpColor(from.furniture.counterTop, to.furniture.counterTop, progress)), [from, to, progress]);
  const counterBody = useMemo(() => css(lerpColor(from.furniture.counterBody, to.furniture.counterBody, progress)), [from, to, progress]);

  const till = to.tillType;
  const tillColor = till === 'register' || till === 'cash' ? '#b98a4e' : till === 'neural' ? '#9fc4ff' : '#2a2a2e';

  return (
    <group position={[0, 0, -2.95]}>
      {/* Counter body */}
      <mesh position={[0, 0.55, 0]} receiveShadow castShadow>
        <boxGeometry args={[7.2, 1.1, 0.75]} />
        <meshStandardMaterial color={counterBody} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, 1.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[7.4, 0.08, 0.85]} />
        <meshStandardMaterial color={counterTop} roughness={0.35} metalness={0.25} />
      </mesh>
      {/* Front fascia */}
      <mesh position={[0, 0.55, 0.41]} receiveShadow>
        <boxGeometry args={[7.2, 0.4, 0.02]} />
        <meshStandardMaterial color={counterBody} roughness={0.6} metalness={0.15} />
      </mesh>

      {/* Till */}
      <group position={[-1.1, 1.2, 0.05]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.28, 0.42]} />
          <meshStandardMaterial color={tillColor} roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.44, 0.04, 0.36]} />
          <meshStandardMaterial color={till === 'neural' ? '#d8ecff' : '#101014'} roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Screen text */}
        <mesh position={[0, 0.19, 0.01]}>
          <planeGeometry args={[0.36, 0.06]} />
          <meshBasicMaterial color={till === 'neural' ? '#0a2a4a' : '#7ef07e'} />
        </mesh>
        {till === 'register' || till === 'cash' ? (
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <mesh key={i} position={[-0.18 + i * 0.07, 0.18, 0.2]}>
                <boxGeometry args={[0.055, 0.05, 0.03]} />
                <meshStandardMaterial color="#e8d9a8" roughness={0.6} />
              </mesh>
            ))}
          </>
        ) : null}
      </group>

      {/* Period label above the counter */}
      <mesh position={[0, 1.62, 0.1]}>
        <planeGeometry args={[4.4, 0.24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.0} />
      </mesh>
      {/* Text via small colored panels to avoid font loading issues */}
      <group position={[0, 1.55, 0.12]}>
        {TILL_LABEL[till].split('').map((_, i) => (
          <mesh key={i} position={[-2.1 + i * 0.16, 0, 0]}>
            <boxGeometry args={[0.14, 0.02, 0.02]} />
            <meshBasicMaterial color={till === 'neural' ? '#bfe0ff' : '#f5e6c8'} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
