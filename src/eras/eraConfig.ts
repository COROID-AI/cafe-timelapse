import type { Menu_item, Poster } from "../state/types";
import { MENUS } from "./menus";
import { POSTERS } from "./posters";

/** Canonical era year values, ordered chronologically (task brief list). */
export const ERA_YEARS = [1945, 1965, 1985, 2005, 2025, 2055] as const;
export type EraYear = (typeof ERA_YEARS)[number];

export interface Palette {
  wall: string;
  wallSecondary: string;
  wood: string;
  accent: string;
  floor: string;
  ceiling: string;
}

export interface LightingSpec {
  style: string;
  intensity: number;
  color: string;
  bulbColor: string;
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
  tagline: string;
  palette: Palette;
  lighting: LightingSpec;
  furnitureStyle: string;
  furnitureParams: {
    /** 0 = timber legs … 1 = polished chrome. */
    legMetalness: number;
    legColor: string;
    cushionColor: string;
    tabletopColor: string;
  };
  coffeeMachineKind: string;
  machineParams: {
    bodyColor: string;
    metalness: number;
    roughness: number;
    emissive: string;
    emissiveIntensity: number;
  };
  menuItems: Menu_item[];
  /** Board styling for MenuBoard canvas textures. */
  menuBoard: { bg: string; fg: string; font: string; glow: string | null };
  musicSourcePropId: string;
  musicProgramId: string;
  posters: Poster[];
  posterBoard: { bg: string; fg: string; font: string };
  tablewareSet: string;
  tablewareColors: { cup: string; saucer: string; plate: string; rimGlow: string | null };
  signageStyle: string;
  signageText: string;
  counterTechKind: string;
  patrons: Patron[];
}

// ---------------------------------------------------------------------------
// Patron rosters — outfits, hairstyles and gadgets are era-critical detail.
// ---------------------------------------------------------------------------

const PATRONS_1945: Patron[] = [
  { name: "Arthur", role: "Factory worker", outfit: { label: "Wool suit, suspenders", color: "#3d2b1f" }, hairstyle: "Slicked back, side part", gadget: "Pocket watch" },
  { name: "Margaret", role: "Nurse", outfit: { label: "Navy uniform, white collar", color: "#1a3a5c" }, hairstyle: "Victory rolls", gadget: "Fountain pen" },
  { name: "James", role: "Veteran", outfit: { label: "Tweed jacket, flat cap", color: "#5d4e37" }, hairstyle: "Short, neat", gadget: "Cigarette case" },
];

const PATRONS_1965: Patron[] = [
  { name: "Johnny", role: "Art student", outfit: { label: "Mod suit, Chelsea boots", color: "#1a1a2e" }, hairstyle: "Mop top", gadget: "Transistor radio" },
  { name: "Susan", role: "Secretary", outfit: { label: "Shift dress, kitten heels", color: "#e91e63" }, hairstyle: "Beehive", gadget: "Compact mirror" },
  { name: "Bob", role: "Folk musician", outfit: { label: "Corduroy jacket, turtleneck", color: "#8e44ad" }, hairstyle: "Long shag", gadget: "Harmonica" },
];

const PATRONS_1985: Patron[] = [
  { name: "Chad", role: "Yuppie broker", outfit: { label: "Power suit, rolled sleeves", color: "#2c3e50" }, hairstyle: "Mullet", gadget: "Brick mobile phone" },
  { name: "Tiffany", role: "Aerobics instructor", outfit: { label: "Neon windbreaker, leggings", color: "#ff69b4" }, hairstyle: "Crimped side pony", gadget: "Walkman" },
  { name: "Marcus", role: "Night programmer", outfit: { label: "Polo shirt, khakis", color: "#34495e" }, hairstyle: "Short flat-top", gadget: "Calculator watch" },
];

const PATRONS_2005: Patron[] = [
  { name: "Alex", role: "Barista-poet", outfit: { label: "Apron over thrift flannel", color: "#2c2c2c" }, hairstyle: "Scene fringe", gadget: "iPod Nano" },
  { name: "Jordan", role: "Startup freelancer", outfit: { label: "Hoodie, bootcut jeans", color: "#34495e" }, hairstyle: "Faux hawk", gadget: "BlackBerry" },
  { name: "Casey", role: "Grad student", outfit: { label: "Band tee, cardigan", color: "#8b4513" }, hairstyle: "Side-swept bangs", gadget: "Nintendo DS" },
];

const PATRONS_2025: Patron[] = [
  { name: "Riley", role: "Remote developer", outfit: { label: "Merino tee, technical pants", color: "#1e293b" }, hairstyle: "Curtain bangs", gadget: "Smartphone + earbuds" },
  { name: "Morgan", role: "Product designer", outfit: { label: "Oversized blazer, loafers", color: "#78716c" }, hairstyle: "Wolf cut", gadget: "Tablet stylus" },
  { name: "Taylor", role: "Content creator", outfit: { label: "Crop hoodie, cargos", color: "#44403c" }, hairstyle: "Curly shag", gadget: "Mirrorless camera" },
];

const PATRONS_2055: Patron[] = [
  { name: "Axiom-7", role: "Synthetic regular", outfit: { label: "Adaptive smart-fabric suit", color: "#0f172a" }, hairstyle: "Photonic fibre crest", gadget: "Neural interface crown" },
  { name: "Nova", role: "Terraform engineer", outfit: { label: "Bio-luminescent weave coat", color: "#1e1b4b" }, hairstyle: "Floating light filaments", gadget: "Holo-tablet implant" },
  { name: "Kai", role: "Chrono-tourist", outfit: { label: "Temporal field poncho", color: "#18181b" }, hairstyle: "Zero-g drift locks", gadget: "Quantum compass" },
];

// Hair silhouettes drive the low-poly figure variants (see PatronFigure).
type HairShape = "slick" | "rolls" | "crop" | "moptop" | "beehive" | "shag" | "mullet" | "pony" | "flattop" | "fringe" | "fauxhawk" | "curly" | "crest" | "filaments" | "drift";

interface PatronVisual extends Patron {
  hairShape: HairShape;
}

function withHair(patrons: Patron[], shapes: HairShape[]): PatronVisual[] {
  return patrons.map((p, i) => ({ ...p, hairShape: shapes[i % shapes.length] }));
}

const PATRON_VISUALS: Record<EraYear, PatronVisual[]> = {
  1945: withHair(PATRONS_1945, ["slick", "rolls", "crop"]),
  1965: withHair(PATRONS_1965, ["moptop", "beehive", "shag"]),
  1985: withHair(PATRONS_1985, ["mullet", "pony", "flattop"]),
  2005: withHair(PATRONS_2005, ["fringe", "fauxhawk", "fringe"]),
  2025: withHair(PATRONS_2025, ["curly", "shag", "curly"]),
  2055: withHair(PATRONS_2055, ["crest", "filaments", "drift"]),
};

// ---------------------------------------------------------------------------
// The six era configurations.
// ---------------------------------------------------------------------------

export const ERA_CONFIGS: Record<EraYear, EraConfig> = {
  1945: {
    year: 1945,
    label: "Wartime austerity",
    tagline: "Ration books on the counter, blackout curtains half-drawn.",
    palette: { wall: "#8a7a5c", wallSecondary: "#6e6248", wood: "#4a3728", accent: "#b03a2e", floor: "#3a2d20", ceiling: "#efe6cf" },
    lighting: { style: "Bare filament bulbs on cloth-wrapped cord", intensity: 0.55, color: "#ffd28a", bulbColor: "#ffe9b8" },
    furnitureStyle: "Bentwood Thonet chairs, marble-top café tables",
    furnitureParams: { legMetalness: 0.05, legColor: "#3c2f22", cushionColor: "#7a4a3a", tabletopColor: "#d9d2c5" },
    coffeeMachineKind: "Manual lever espresso (La Pavoni-style)",
    machineParams: { bodyColor: "#b8862f", metalness: 0.65, roughness: 0.35, emissive: "#000000", emissiveIntensity: 0 },
    menuItems: MENUS[1945],
    menuBoard: { bg: "#26221c", fg: "#e8dcc0", font: "600 30px Georgia, serif", glow: null },
    musicSourcePropId: "wireless-radio",
    musicProgramId: "swing-jazz",
    posters: POSTERS[1945],
    posterBoard: { bg: "#c0392b", fg: "#f7ecd9", font: "700 40px Georgia, serif" },
    tablewareSet: "Heavy ceramic cups, saucers, silver spoons",
    tablewareColors: { cup: "#e8e0d0", saucer: "#ddd3bd", plate: "#e8e0d0", rimGlow: null },
    signageStyle: "Hand-painted chalkboard",
    signageText: "CAFÉ  ·  EST. 1921",
    counterTechKind: "Mechanical cash till (brass keys, hand-crank)",
    patrons: PATRON_VISUALS[1945],
  },
  1965: {
    year: 1965,
    label: "Mod & beat",
    tagline: "Vinyl 45s spinning, Formica gleaming, transistor buzz.",
    palette: { wall: "#e7d8b8", wallSecondary: "#d4c39c", wood: "#8b5a2b", accent: "#e05a7a", floor: "#c9b891", ceiling: "#fdf6e8" },
    lighting: { style: "Glass globe pendants on brass stems", intensity: 0.75, color: "#ffe8c4", bulbColor: "#fff3d6" },
    furnitureStyle: "Chrome-tubular chairs, tulip tables",
    furnitureParams: { legMetalness: 0.9, legColor: "#cfd2d6", cushionColor: "#e05a7a", tabletopColor: "#f2ede2" },
    coffeeMachineKind: "Faema E61 heat-exchanger lever",
    machineParams: { bodyColor: "#c2372f", metalness: 0.55, roughness: 0.3, emissive: "#000000", emissiveIntensity: 0 },
    menuItems: MENUS[1965],
    menuBoard: { bg: "#f4ead2", fg: "#33302a", font: "700 30px Futura, Verdana, sans-serif", glow: null },
    musicSourcePropId: "jukebox",
    musicProgramId: "rock-n-roll",
    posters: POSTERS[1965],
    posterBoard: { bg: "#e74c3c", fg: "#fff4dc", font: "700 42px Impact, Haettenschweiler, sans-serif" },
    tablewareSet: "Melamine cups, geometric-print saucers",
    tablewareColors: { cup: "#f6e9d4", saucer: "#e05a7a", plate: "#f6e9d4", rimGlow: null },
    signageStyle: "Plastic letter board (cinema marquee)",
    signageText: "THE BEAT CAFÉ",
    counterTechKind: "Mechanical NCR register with punch keys",
    patrons: PATRON_VISUALS[1965],
  },
  1985: {
    year: 1985,
    label: "Neon & synth",
    tagline: "Laser-backdrops, cassette decks, cherry cola nights.",
    palette: { wall: "#232339", wallSecondary: "#191927", wood: "#2d1b4e", accent: "#22e0e0", floor: "#15151f", ceiling: "#232339" },
    lighting: { style: "Magenta/cyan neon tubes + track spots", intensity: 0.9, color: "#ff6ec7", bulbColor: "#ffd9fb" },
    furnitureStyle: "Glass-top tables, Memphis-postmodern chairs",
    furnitureParams: { legMetalness: 0.4, legColor: "#22242e", cushionColor: "#22e0e0", tabletopColor: "#31344a" },
    coffeeMachineKind: "Volumetric automatic (Rancilio-class)",
    machineParams: { bodyColor: "#2b2b31", metalness: 0.7, roughness: 0.28, emissive: "#ff6ec7", emissiveIntensity: 0.35 },
    menuItems: MENUS[1985],
    menuBoard: { bg: "#101020", fg: "#22e0e0", font: "700 32px 'Courier New', monospace", glow: "#ff6ec7" },
    musicSourcePropId: "boombox",
    musicProgramId: "synth-pop",
    posters: POSTERS[1985],
    posterBoard: { bg: "#e91e63", fg: "#0e0e18", font: "800 44px Impact, sans-serif" },
    tablewareSet: "Thick logo mugs, ashtray-era saucers",
    tablewareColors: { cup: "#2f2f3a", saucer: "#23232e", plate: "#2f2f3a", rimGlow: null },
    signageStyle: "Backlit fluorescent panel",
    signageText: "NEON GROUND",
    counterTechKind: "Electronic POS with green VFD display",
    patrons: PATRON_VISUALS[1985],
  },
  2005: {
    year: 2005,
    label: "Flat white & Wi-Fi",
    tagline: "Tangled headphone wires, laptop stickers, indie playlists.",
    palette: { wall: "#e9dfc8", wallSecondary: "#d8cbae", wood: "#6b4423", accent: "#3f5f8f", floor: "#b9a888", ceiling: "#fbf7ee" },
    lighting: { style: "Recessed cans + Edison pendants", intensity: 0.85, color: "#ffedd0", bulbColor: "#ffe8bd" },
    furnitureStyle: "Reclaimed plank tables, Tolix stools",
    furnitureParams: { legMetalness: 0.8, legColor: "#8f9296", cushionColor: "#3f5f8f", tabletopColor: "#7a5230" },
    coffeeMachineKind: "La Marzocco Linea dual-boiler",
    machineParams: { bodyColor: "#d8452b", metalness: 0.6, roughness: 0.3, emissive: "#000000", emissiveIntensity: 0 },
    menuItems: MENUS[2005],
    menuBoard: { bg: "#2c2620", fg: "#efe6d2", font: "600 30px 'Trebuchet MS', sans-serif", glow: null },
    musicSourcePropId: "ipod-dock",
    musicProgramId: "pop-dance",
    posters: POSTERS[2005],
    posterBoard: { bg: "#3b5998", fg: "#ffffff", font: "700 38px Helvetica, Arial, sans-serif" },
    tablewareSet: "Double-wall glasses, latte-art pitchers",
    tablewareColors: { cup: "#f8f8f6", saucer: "#e9e4da", plate: "#f8f8f6", rimGlow: null },
    signageStyle: "Backlit digital menu screens",
    signageText: "WI-FI INSIDE",
    counterTechKind: "Touchscreen POS + chip-&-PIN reader",
    patrons: PATRON_VISUALS[2005],
  },
  2025: {
    year: 2025,
    label: "Specialty & contactless",
    tagline: "Single-origin pour-overs, oat defaults, tap-to-pay.",
    palette: { wall: "#2a3038", wallSecondary: "#21262d", wood: "#292524", accent: "#e8a04c", floor: "#1b1d20", ceiling: "#2a3038" },
    lighting: { style: "Tunable-white track + warm pendant pools", intensity: 1.0, color: "#ffe9c9", bulbColor: "#fff2da" },
    furnitureStyle: "Modular plywood benches, ergonomic stools",
    furnitureParams: { legMetalness: 0.2, legColor: "#1c1c1c", cushionColor: "#e8a04c", tabletopColor: "#a9825f" },
    coffeeMachineKind: "Modbar AV under-counter volumetric",
    machineParams: { bodyColor: "#3a3f46", metalness: 0.75, roughness: 0.25, emissive: "#e8a04c", emissiveIntensity: 0.12 },
    menuItems: MENUS[2025],
    menuBoard: { bg: "#20242a", fg: "#f2ede4", font: "600 30px Inter, Segoe UI, sans-serif", glow: null },
    musicSourcePropId: "smartphone-speaker",
    musicProgramId: "lofi-house",
    posters: POSTERS[2025],
    posterBoard: { bg: "#8b5cf6", fg: "#f8f7ff", font: "700 36px Inter, sans-serif" },
    tablewareSet: "Hand-thrown ceramics, notNeutral LINO",
    tablewareColors: { cup: "#d9cfc2", saucer: "#cabfab", plate: "#d9cfc2", rimGlow: null },
    signageStyle: "E-ink price tags + QR menu codes",
    signageText: "SLOW BREW BAR",
    counterTechKind: "Tablet POS + contactless terminal",
    patrons: PATRON_VISUALS[2025],
  },
  2055: {
    year: 2055,
    label: "Post-material synthesis",
    tagline: "Molecular brews, grown furniture, ambient neural radio.",
    palette: { wall: "#131b2e", wallSecondary: "#101627", wood: "#0a0f1c", accent: "#37e6ff", floor: "#080b14", ceiling: "#131b2e" },
    lighting: { style: "Bioluminescent panels + hard-light projectors", intensity: 1.15, color: "#9fdcff", bulbColor: "#eafaff" },
    furnitureStyle: "Grown mycelium forms, morphing topology",
    furnitureParams: { legMetalness: 0.1, legColor: "#dfe9ef", cushionColor: "#37e6ff", tabletopColor: "#cfdde4" },
    coffeeMachineKind: "Molecular assembler (atom-precise brewing)",
    machineParams: { bodyColor: "#1b2436", metalness: 0.85, roughness: 0.18, emissive: "#37e6ff", emissiveIntensity: 0.5 },
    menuItems: MENUS[2055],
    menuBoard: { bg: "#0b1220", fg: "#9fdcff", font: "500 30px 'Segoe UI', system-ui, sans-serif", glow: "#37e6ff" },
    musicSourcePropId: "holographic-orb",
    musicProgramId: "ambient-scifi",
    posters: POSTERS[2055],
    posterBoard: { bg: "#22d3ee", fg: "#07121c", font: "600 38px 'Segoe UI', system-ui, sans-serif" },
    tablewareSet: "Self-sanitising smart ceramic, haptic rims",
    tablewareColors: { cup: "#cfe9f2", saucer: "#bcd8e4", plate: "#cfe9f2", rimGlow: "#37e6ff" },
    signageStyle: "Volumetric holo-display",
    signageText: "SYNTHESIS HOUSE",
    counterTechKind: "Biometric holographic payment pad",
    patrons: PATRON_VISUALS[2055],
  },
};

export function getEraConfig(year: EraYear): EraConfig {
  return ERA_CONFIGS[year];
}

export function getAllEraConfigs(): EraConfig[] {
  return ERA_YEARS.map((y) => ERA_CONFIGS[y]);
}
