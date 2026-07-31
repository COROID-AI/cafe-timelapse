/**
 * shellFinishers.ts — registry of per-era shell-surface finishers.
 *
 * Era scene fragments register *Object3D* factories via the AssetRegistry, but
 * the persistent café {@link ArchitectureShell} is a single shared object that
 * lives outside the per-era groups. An era still needs to re-finish the shell's
 * surface slots (floor, walls, ceiling, glass) when it becomes active. This
 * registry pairs an era year with a function that applies those finishes to the
 * shell; {@link SceneManager} invokes the active era's finisher during an era
 * switch.
 *
 * This is the surface-slot companion to the AssetRegistry's fragment factories:
 *   • AssetRegistry   → builds the era's transient Object3D props (added to the
 *                        era group, disposed on switch).
 *   • shellFinishers  → re-finishes the persistent shell surfaces (survive
 *                        every switch, just swap materials).
 */
import type { EraYear } from '../data/EraData.js';
import type { ArchitectureShell } from '../world/ArchitectureShell.js';

/** A function that applies period-specific finishes to the shell's surface slots. */
export type ShellFinisher = (shell: ArchitectureShell) => void;

const finishers = new Map<EraYear, ShellFinisher>();

/**
 * Register a shell-surface finisher for an era. Safe to call during module
 * init (the registry is just a map). Overwriting an existing entry is allowed
 * so downstream era-detail tasks can replace a coarse finisher.
 */
export function registerShellFinisher(era: EraYear, finisher: ShellFinisher): void {
  finishers.set(era, finisher);
}

/** True when a shell finisher has been registered for the era. */
export function hasShellFinisher(era: EraYear): boolean {
  return finishers.has(era);
}

/** Get the shell finisher for an era, or `undefined`. */
export function getShellFinisher(era: EraYear): ShellFinisher | undefined {
  return finishers.get(era);
}

/**
 * Apply the registered shell finishes for an era. A no-op when no finisher is
 * registered (the shell keeps its neutral placeholder materials). Called by
 * {@link SceneManager.setActiveEra}.
 */
export function applyShellFinishes(era: EraYear, shell: ArchitectureShell): void {
  const finisher = finishers.get(era);
  if (finisher) finisher(shell);
}
