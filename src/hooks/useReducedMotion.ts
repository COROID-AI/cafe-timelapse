import { useEffect } from 'react';
import { useEraStore } from '../store/useEraStore';

/**
 * Respect the user's reduced-motion preference:
 * - reads the media query on mount and on change,
 * - pushes it into the era store so transitions snap to the final state,
 * - and drives the `data-reduced-motion` attribute used to disable idle
 *   camera drift, particles and neon flicker.
 */
export function useReducedMotion(): boolean {
  const reducedMotion = useEraStore((s) => s.reducedMotion);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      useEraStore.getState().setReducedMotion(media.matches);
      document.documentElement.dataset.reducedMotion = media.matches ? 'true' : 'false';
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  return reducedMotion;
}
