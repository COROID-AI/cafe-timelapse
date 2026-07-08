import { Orbit, Walk, Camera } from 'lucide-react';
import { useSceneStore, type CameraMode } from '../../store/sceneStore';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';

/**
 * Top-right button toggling between Orbit mode (free look around)
 * and Walk mode (first-person, WASD + mouse-look).
 */
export function CameraControls() {
  const cameraMode = useSceneStore((s) => s.cameraMode);
  const setCameraMode = useSceneStore((s) => s.setCameraMode);

  return (
    <div className="pointer-events-auto fixed top-24 right-4 z-30 animate-slide-in-up">
      <div className="glass-panel flex flex-col gap-1 rounded-2xl p-2">
        <Button
          variant={cameraMode === 'orbit' ? 'primary' : 'ghost'}
          size="icon"
          onClick={() => setCameraMode('orbit')}
          aria-label="Orbit camera mode"
          aria-pressed={cameraMode === 'orbit'}
          title="Orbit — drag to look around"
          className="rounded-xl"
        >
          <Orbit className="h-5 w-5" />
        </Button>
        <Button
          variant={cameraMode === 'walk' ? 'primary' : 'ghost'}
          size="icon"
          onClick={() => setCameraMode('walk')}
          aria-label="Walk camera mode"
          aria-pressed={cameraMode === 'walk'}
          title="Walk — WASD to move, click to look"
          className="rounded-xl"
        >
          <Walk className="h-5 w-5" />
        </Button>
      </div>
      <p
        className={cn(
          'mt-2 text-center text-[10px] text-white/40 transition-opacity',
          cameraMode === 'walk' ? 'opacity-100' : 'opacity-0',
        )}
      >
        WASD to move · ESC to exit
      </p>
    </div>
  );
}

/** Placeholder to satisfy the Camera icon import — kept for future "reset view" feature. */
export function CameraResetButton(): React.ReactNode {
  return <Camera className="h-4 w-4" />;
}

export type { CameraMode };
