import type { EraYear, Poster } from "../state/types";

/**
 * Wall posters/advertisements per era. Source of truth consumed by
 * eraConfig.ts and the Posters scene component.
 */

const POSTERS_1945: Poster[] = [
  { title: "War Bonds", artist: "Gov. Poster Office", color: "#c0392b" },
  { title: "Victory Garden", artist: "USDA", color: "#27ae60" },
  { title: "Loose Lips Sink Ships", artist: "OWI", color: "#2c3e50" },
];

const POSTERS_1965: Poster[] = [
  { title: "The Beatles - Help!", artist: "Parlophone", color: "#e74c3c" },
  { title: "Rolling Stones Tour", artist: "Decca", color: "#8e44ad" },
  { title: "Summer of Love", artist: "Psychedelic Press", color: "#f39c12" },
];

const POSTERS_1985: Poster[] = [
  { title: "MTV Music Television", artist: "Viacom", color: "#e91e63" },
  { title: "Back to the Future", artist: "Universal", color: "#3498db" },
  { title: "New Taste Coke", artist: "Coca-Cola", color: "#c0392b" },
];

const POSTERS_2005: Poster[] = [
  { title: "iPod + iTunes", artist: "Apple", color: "#ecf0f1" },
  { title: "Broadcast Yourself", artist: "YouTube", color: "#e74c3c" },
  { title: "The Social Network", artist: "Meta", color: "#3b5998" },
];

const POSTERS_2025: Poster[] = [
  { title: "AI Art Gallery", artist: "Midjourney", color: "#8b5cf6" },
  { title: "Colony Recruitment", artist: "SpaceX", color: "#ef4444" },
  { title: "Quantum Summit", artist: "IBM", color: "#06b6d4" },
];

const POSTERS_2055: Poster[] = [
  { title: "Neural Link v9", artist: "Neuralink", color: "#22d3ee" },
  { title: "Terraformed Venus", artist: "Planetary Corp", color: "#f472b6" },
  { title: "Chrono Tourism", artist: "Chronos Inc", color: "#a855f7" },
];

export const POSTERS: Record<EraYear, Poster[]> = {
  1945: POSTERS_1945,
  1965: POSTERS_1965,
  1985: POSTERS_1985,
  2005: POSTERS_2005,
  2025: POSTERS_2025,
  2055: POSTERS_2055,
};

/** Layout slots (x, y on the back wall, local units) for up to three posters. */
export const POSTER_SLOTS: ReadonlyArray<{ x: number; y: number }> = [
  { x: -2.6, y: 2.1 },
  { x: -0.9, y: 2.1 },
  { x: 0.8, y: 2.1 },
];
