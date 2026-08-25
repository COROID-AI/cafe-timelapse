// Canonical era identifiers and shared type definitions.
// Six eras are authoritative per the task brief option list.

export const ERA_YEARS = [1945, 1965, 1985, 2005, 2025, 2055] as const;
export type EraYear = (typeof ERA_YEARS)[number];

export interface Menu_item {
  name: string;
  price: number;
}

export interface Poster {
  title: string;
  artist: string;
  color: string;
}

export interface PatronOutfit {
  label: string;
  color: string;
}

export interface Patron {
  name: string;
  role: string;
  outfit: PatronOutfit;
  hairstyle: string;
  gadget: string;
}

export interface EraConfig {
  year: EraYear;
  label: string;
  palette: {
    wall: string;
    wallSecondary: string;
    wood: string;
    accent: string;
    floor: string;
    ceiling: string;
  };
  lighting: {
    style: string;
    intensity: number;
    color: string;
    bulbColor: string;
  };
  furnitureStyle: string;
  coffeeMachineKind: string;
  menuItems: Menu_item[];
  musicSourcePropId: string;
  musicProgramId: string;
  posters: Poster[];
  tablewareSet: string;
  signageStyle: string;
  counterTechKind: string;
  patrons: Patron[];
}