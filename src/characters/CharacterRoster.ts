/**
 * CharacterRoster.ts — era-scoped registry of café patron configurations.
 *
 * The roster is the single source of truth for *which patrons exist and which
 * era they belong to*. Patron configs are registered per era and can only be
 * retrieved for the era they were registered against — this is what enforces
 * era-scoped visibility (a 1965 patron is never visible in 1945, 1985, …).
 *
 * Downstream consumers (the era fragment builders, the scene controller, the
 * slider transition wiring) ask the roster for the active era's configs and
 * hand them to {@link CharacterAvatar} to build the visible Object3D figures.
 *
 * The roster is deliberately data-only: it holds {@link PatronConfig} objects
 * (plain data), not Three.js objects. This keeps era-scoped visibility a pure
 * data question and lets the avatar builder be swapped independently.
 */
import type { EraYear } from '../data/EraData.js';
import type { PatronConfig } from './PatronConfig.js';

/**
 * A process-wide, era-scoped patron registry. Patrons are grouped by era so a
 * `getPatrons(1965)` call returns only the 1965 population and nothing else.
 */
class CharacterRosterImpl {
  /** era → ordered list of patron configs registered for that era. */
  private readonly byEra = new Map<EraYear, PatronConfig[]>();
  /** Flat set of all registered patron ids (catches duplicate ids). */
  private readonly ids = new Set<string>();

  /**
   * Register one or more patrons for an era. Each patron's `era` field MUST
   * match the era argument (a mismatch throws — it catches accidental
   * cross-era registration). Duplicate ids throw.
   */
  register(era: EraYear, ...configs: PatronConfig[]): void {
    const list = this.byEra.get(era) ?? [];
    for (const c of configs) {
      if (c.era !== era) {
        throw new Error(
          `CharacterRoster: patron "${c.id}" has era ${c.era} but was registered under era ${era}.`,
        );
      }
      if (this.ids.has(c.id)) {
        throw new Error(
          `CharacterRoster: duplicate patron id "${c.id}".`,
        );
      }
      this.ids.add(c.id);
      list.push(c);
    }
    this.byEra.set(era, list);
  }

  /**
   * Return the ordered, readonly list of patrons registered for `era`.
   * Returns an empty array for an era with no patrons (never undefined) so
   * callers can iterate without a guard. The returned array is a defensive
   * copy — mutating it does not affect the roster.
   */
  getPatrons(era: EraYear): readonly PatronConfig[] {
    return [...(this.byEra.get(era) ?? [])];
  }

  /** True when at least one patron is registered for `era`. */
  hasEra(era: EraYear): boolean {
    return (this.byEra.get(era)?.length ?? 0) > 0;
  }

  /**
   * Assert era-scoped visibility: `era` has at least `minCount` patrons and
   * no *other* era shares any of `era`'s patron ids. Used by tests to prove
   * a population is era-exclusive.
   */
  assertEraExclusive(era: EraYear, minCount: number): boolean {
    const mine = this.byEra.get(era) ?? [];
    if (mine.length < minCount) return false;
    const myIds = new Set(mine.map((c) => c.id));
    for (const [otherEra, others] of this.byEra) {
      if (otherEra === era) continue;
      for (const c of others) {
        if (myIds.has(c.id)) return false;
      }
    }
    return true;
  }

  /** Total number of registered patrons across all eras. */
  get size(): number {
    let n = 0;
    for (const list of this.byEra.values()) n += list.length;
    return n;
  }

  /** Reset the roster (test helper; not for production use). */
  clear(): void {
    this.byEra.clear();
    this.ids.clear();
  }
}

/** Shared process-wide roster instance. */
export const characterRoster = new CharacterRosterImpl();
