import { Volume2, VolumeX, Music, Coffee } from 'lucide-react';
import { useSceneStore } from '../../store/sceneStore';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';

/**
 * Bottom-right control cluster: music on/off, music volume, SFX volume, master mute.
 */
export function AudioControls() {
  const audioEnabled = useSceneStore((s) => s.audioEnabled);
  const toggleAudio = useSceneStore((s) => s.toggleAudio);
  const musicVolume = useSceneStore((s) => s.musicVolume);
  const setMusicVolume = useSceneStore((s) => s.setMusicVolume);
  const sfxVolume = useSceneStore((s) => s.sfxVolume);
  const setSfxVolume = useSceneStore((s) => s.setSfxVolume);

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-30 w-64 animate-slide-in-up">
      <div className="glass-panel rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Audio
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
            aria-label={audioEnabled ? 'Mute all audio' : 'Unmute audio'}
            aria-pressed={!audioEnabled}
          >
            {audioEnabled ? (
              <Volume2 className="h-4 w-4 text-[var(--era-accent)]" />
            ) : (
              <VolumeX className="h-4 w-4 text-white/50" />
            )}
          </Button>
        </div>

        <div className={cn('space-y-3 transition-opacity', audioEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none')}>
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Music className="h-3 w-3 text-white/50" />
              <span className="text-[10px] uppercase tracking-wider text-white/50">Music</span>
            </div>
            <Slider
              value={musicVolume}
              onValueChange={setMusicVolume}
              aria-label="Music volume"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <Coffee className="h-3 w-3 text-white/50" />
              <span className="text-[10px] uppercase tracking-wider text-white/50">Ambient &amp; SFX</span>
            </div>
            <Slider
              value={sfxVolume}
              onValueChange={setSfxVolume}
              aria-label="SFX volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
