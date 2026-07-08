import { useEffect, useRef } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { getEraById } from '../data/eras';
import { AudioManager, toAudioProfile, type EraAudioProfile } from '../lib/audio';

/**
 * Bridges the Zustand store with the AudioManager.
 * Subscribes to the active era and audio settings, and triggers crossfades.
 */
export function useAudio(): void {
  const activeEraId = useSceneStore((s) => s.activeEraId);
  const audioEnabled = useSceneStore((s) => s.audioEnabled);
  const musicVolume = useSceneStore((s) => s.musicVolume);
  const sfxVolume = useSceneStore((s) => s.sfxVolume);
  const entered = useSceneStore((s) => s.entered);

  const prevProfileRef = useRef<EraAudioProfile | null>(null);
  const startedRef = useRef(false);

  // When the user enters, unlock audio + start initial playback.
  useEffect(() => {
    if (!entered) return;

    AudioManager.unlock();
    AudioManager.setEnabled(audioEnabled);
    AudioManager.setChannelVolume('music', musicVolume);
    AudioManager.setChannelVolume('ambient', sfxVolume * 0.5);
    AudioManager.setChannelVolume('machine', sfxVolume);

    if (!startedRef.current) {
      const era = getEraById(activeEraId);
      if (era) {
        const profile = toAudioProfile(era.audio);
        AudioManager.start(profile, activeEraId);
        prevProfileRef.current = profile;
        startedRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered]);

  // React to era changes → crossfade.
  useEffect(() => {
    if (!entered || !startedRef.current) return;
    const era = getEraById(activeEraId);
    if (!era) return;
    const profile = toAudioProfile(era.audio);
    AudioManager.crossfade(prevProfileRef.current, profile, 1200);
    prevProfileRef.current = profile;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEraId, entered]);

  // React to enable/disable.
  useEffect(() => {
    AudioManager.setEnabled(audioEnabled);
  }, [audioEnabled]);

  // React to volume changes.
  useEffect(() => {
    AudioManager.setChannelVolume('music', musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    AudioManager.setChannelVolume('ambient', sfxVolume * 0.5);
    AudioManager.setChannelVolume('machine', sfxVolume);
  }, [sfxVolume]);
}
