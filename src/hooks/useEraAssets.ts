import { useSceneStore } from '../store/sceneStore';
import { getEraById } from '../data/eras';
import type { Era } from '../data/eras';

/**
 * Selector hook returning the current Era object from the store.
 * Re-renders only when the active era id changes.
 */
export function useEraAssets(): Era {
  const activeEraId = useSceneStore((s) => s.activeEraId);
  const era = getEraById(activeEraId);
  if (!era) {
    throw new Error(`useEraAssets: no era found for id "${activeEraId}"`);
  }
  return era;
}
