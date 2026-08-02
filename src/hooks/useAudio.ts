import { useEffect, useRef } from 'react';
import { createAudioBus, resumeBus, suspendBus, type AudioBus } from '../audio/audioEngine';
import { createAmbientScheduler } from '../audio/ambientScheduler';
import { useStore } from '../store/useStore';

/**
 * Owns the Web Audio graph for the whole session. The bus is created lazily
 * on the first user gesture (browser autoplay policy), then the ambient
 * scheduler loops era-aware music and café SFX.
 */
export function useAudio() {
  const audioEnabled = useStore((s) => s.audioEnabled);
  const setAudioStarted = useStore((s) => s.setAudioStarted);
  const era = useStore((s) => s.era);
  const targetEra = useStore((s) => s.targetEra);
  const transition = useStore((s) => s.transition);

  const busRef = useRef<AudioBus | null>(null);
  const schedulerRef = useRef<ReturnType<typeof createAmbientScheduler> | null>(null);

  // Create the bus + scheduler lazily on the first toggle-on gesture.
  useEffect(() => {
    if (!audioEnabled) return;
    if (!busRef.current) {
      try {
        const bus = createAudioBus();
        busRef.current = bus;
        const scheduler = createAmbientScheduler(bus);
        schedulerRef.current = scheduler;
        scheduler.setVolume(0.8);
      } catch {
        // Web Audio unsupported — ambient audio simply stays silent.
        return;
      }
    }
    if (busRef.current) {
      resumeBus(busRef.current);
      setAudioStarted();
      schedulerRef.current?.start();
    }
    return () => {
      schedulerRef.current?.stop();
      if (busRef.current) suspendBus(busRef.current);
    };
  }, [audioEnabled, setAudioStarted]);

  // Keep the era in sync for the ambient scheduler.
  useEffect(() => {
    const eraId = transition.phase === 'fading' ? transition.toEra : era;
    schedulerRef.current?.setEra(eraId);
  }, [era, targetEra, transition]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      schedulerRef.current?.stop();
      const bus = busRef.current;
      if (bus) {
        void bus.ctx.close();
        busRef.current = null;
      }
    };
  }, []);

  return { bus: busRef.current, scheduler: schedulerRef.current };
}
