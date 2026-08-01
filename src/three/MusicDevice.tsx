import { useMemo } from 'react';
import type { EraConfig } from '../types/era';

interface MusicDeviceProps {
  era: EraConfig;
}

/**
 * The music playback device of the era:
 * - 1945: valve radio
 * - 1965: turntable
 * - 1985: boombox
 * - 2005: CD player / MP3 dock
 * - 2025: smart speaker
 * - 2055: holographic emitter
 */
export function MusicDevice({ era }: MusicDeviceProps) {
  const device = era.deviceType;

  const config = useMemo(() => {
    switch (device) {
      case 'radio':
        return { color: '#7a4a2a', detail: '#e8d9a8', w: 0.7, h: 0.5, d: 0.3, label: 'RADIO' };
      case 'turntable':
        return { color: '#4a3426', detail: '#c0b8a8', w: 0.62, h: 0.3, d: 0.45, label: 'TURNTABLE' };
      case 'boombox':
        return { color: '#2a2a30', detail: '#9aa0a8', w: 0.6, h: 0.3, d: 0.22, label: 'BOOMBOX' };
      case 'cd-player':
        return { color: '#33373d', detail: '#7ef07e', w: 0.5, h: 0.3, d: 0.28, label: 'CD' };
      case 'smart-speaker':
        return { color: '#20242a', detail: '#9fe8ff', w: 0.4, h: 0.42, d: 0.4, label: 'SMART' };
      case 'hologram':
        return { color: '#10141c', detail: '#7fd4ff', w: 0.4, h: 0.5, d: 0.4, label: 'HOLO' };
    }
  }, [device]);

  const isHolo = device === 'hologram';

  return (
    <group position={[2.6, 1.0, -2.78]}>
      {isHolo ? (
        <>
          {/* Holo emitter base */}
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.26, 0.24, 16]} />
            <meshStandardMaterial color={config.color} roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Projected disc */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.5, 16]} />
            <meshBasicMaterial color={config.detail} transparent opacity={0.35} />
          </mesh>
          <pointLight position={[0, 0.5, 0]} intensity={0.9} color={config.detail} distance={2} decay={2} />
        </>
      ) : (
        <group>
          {/* Body */}
          <mesh position={[0, config.h / 2, 0]} castShadow>
            <boxGeometry args={[config.w, config.h, config.d]} />
            <meshStandardMaterial color={config.color} roughness={0.5} metalness={0.3} />
          </mesh>
          {/* Detail panel */}
          <mesh position={[0, config.h / 2, config.d / 2 + 0.005]}>
            <planeGeometry args={[config.w * 0.8, config.h * 0.45]} />
            <meshBasicMaterial color={config.detail} transparent opacity={device === 'cd-player' ? 0.9 : 0.6} />
          </mesh>
          {/* Knobs / buttons */}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[-config.w * 0.3 + i * config.w * 0.2, config.h * 0.22, config.d / 2 + 0.01]}>
              <cylinderGeometry args={[0.025, 0.025, 0.02, 10]} />
              <meshStandardMaterial color="#d8d8dc" roughness={0.3} metalness={0.6} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
