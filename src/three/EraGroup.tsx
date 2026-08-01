import { useMemo } from 'react';
import type { EraConfig } from '../types/era';
import { CoffeeMachine } from './CoffeeMachine';
import { CounterStation } from './CounterStation';
import { MenuBoard } from './MenuBoard';
import { MusicDevice } from './MusicDevice';
import { Patrons } from './Patrons';
import { Signage } from './Signage';
import { Tableware } from './Tableware';
import { WallDecor } from './WallDecor';

interface EraGroupProps {
  from: EraConfig;
  to: EraConfig;
  progress: number;
  isTransitioning: boolean;
}

/**
 * Mounts the era-reactive asset groups with bounded resources:
 * - during a transition, exactly two groups are mounted (from + to),
 * - after settling, only the target era's group remains.
 *
 * There is no state snapshot and no opacity cross-fade: the outgoing group
 * unmounts the moment the transition settles, which keeps memory/GPU
 * allocation flat across rapid slider input (the store re-bases from/to so
 * React simply re-keys the outgoing group).
 */
export function EraGroup({ from, to, progress, isTransitioning }: EraGroupProps) {
  return (
    <group>
      {isTransitioning ? <EraAssets key={`from-${from.id}`} era={from} progress={1 - progress} /> : null}
      <EraAssets key={`to-${to.id}`} era={to} progress={progress} />
    </group>
  );
}

interface EraAssetsProps {
  era: EraConfig;
  progress: number;
}

function EraAssets({ era, progress }: EraAssetsProps) {
  const assets = useMemo(
    () => (
      <group>
        <CoffeeMachine era={era} progress={progress} />
        <CounterStation from={era} to={era} progress={1} />
        <MenuBoard era={era} progress={progress} />
        <MusicDevice era={era} />
        <Patrons era={era} />
        <Signage era={era} progress={progress} />
        <Tableware era={era} />
        <WallDecor era={era} />
      </group>
    ),
    [era, progress],
  );
  return <group>{assets}</group>;
}

/** Render a single era's assets at full state (used by tests / static views). */
export function EraAssetsFull({ era }: { era: EraConfig }) {
  return <EraAssets era={era} progress={1} />;
}
