/**
 * Deterministic pseudo-random generator so props (posters, patrons,
 * dust-mote positions) are stable per era and across reloads.
 * A small mulberry32 PRNG seeded per era.
 */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
