import { useMemo } from 'react';
import { useEraTransition } from '../hooks/useEraTransition';
import { useEraStore } from '../store/useEraStore';
import { Atmosphere } from './Atmosphere';
import { EraGroup } from './EraGroup';
import { Furniture } from './Furniture';
import { Lighting } from './Lighting';
import { Room } from './Room';
import { WindowView } from './WindowView';

/**
 * The full café scene. Continuous attributes (lighting, fog, finishes,
 * exterior light) interpolate during transitions; era-specific asset groups
 * are mounted via EraGroup.
 */
export function SceneRoot() {
  const { from, to, progress } = useEraTransition();
  const isTransitioning = useEraStore((s) => s.isTransitioning);

  const assets = useMemo(
    () => ({ from, to, progress, isTransitioning }),
    [from, to, progress, isTransitioning],
  );

  return (
    <group>
      <Room from={from} to={to} progress={progress} />
      <WindowView from={from} to={to} progress={progress} />
      <Lighting from={from} to={to} progress={progress} />
      <Atmosphere from={from} to={to} progress={progress} />
      <Furniture from={from} to={to} progress={progress} />
      <EraGroup
        from={assets.from}
        to={assets.to}
        progress={assets.progress}
        isTransitioning={assets.isTransitioning}
      />
    </group>
  );
}
