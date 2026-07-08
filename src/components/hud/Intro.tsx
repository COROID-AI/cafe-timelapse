import { useState, useEffect } from 'react';
import { Coffee, ChevronRight } from 'lucide-react';
import { useSceneStore } from '../../store/sceneStore';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';

/**
 * One-time intro overlay: title, short copy, and an "Enter" button that
 * triggers the audio unlock + first user gesture.
 */
export function Intro() {
  const entered = useSceneStore((s) => s.entered);
  const enter = useSceneStore((s) => s.enter);
  const [exiting, setExiting] = useState(false);

  // After fade-out animation, the component returns null.
  useEffect(() => {
    if (exiting) {
      const timer = setTimeout(() => enter(), 500);
      return () => clearTimeout(timer);
    }
  }, [exiting, enter]);

  if (entered) return null;

  const handleEnter = (): void => {
    setExiting(true);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl',
        exiting ? 'animate-fade-out' : 'animate-fade-in',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome"
    >
      <div className="mx-4 max-w-md text-center">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="relative">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, var(--era-accent), var(--era-primary))',
                boxShadow: '0 8px 32px color-mix(in srgb, var(--era-accent) 40%, transparent)',
              }}
            >
              <Coffee className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <h1 className="font-display mb-2 text-4xl font-bold text-white sm:text-5xl">
          Café Timelapse
        </h1>
        <p className="mb-1 text-sm font-medium" style={{ color: 'var(--era-accent)' }}>
          1945 → 2055
        </p>
        <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-white/60">
          Step inside a single corner café and watch eight decades of coffee culture transform
          around you — the furniture, the machines, the music, the people, and everything in between.
        </p>

        <Button
          variant="primary"
          size="lg"
          onClick={handleEnter}
          autoFocus
          className="group"
          aria-label="Enter the café and enable sound"
        >
          Enter the Café
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>

        <p className="mt-4 text-[11px] text-white/30">
          Best experienced with sound on · Use the timeline to travel through time
        </p>
      </div>
    </div>
  );
}
