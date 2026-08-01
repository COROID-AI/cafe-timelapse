/**
 * Shared types for the Café Time Period Timelapse scene.
 *
 * An EraConfig fully describes every era-reactive element in the café:
 * lighting & atmosphere, furniture & decor, coffee machine, menu board,
 * music device, wall posters, tableware, signage, counter/till technology,
 * patrons, and exterior light.
 */

export type EraId = '1945' | '1965' | '1985' | '2005' | '2025' | '2055';

export interface Color3 {
  r: number;
  g: number;
  b: number;
}

export interface LightingConfig {
  /** Warm/cool balance of the interior lights (Kelvin-like feel, 1600–7000). */
  temperature: number;
  /** Base interior light intensity (lux-like scale, 0.6–3.0). */
  intensity: number;
  /** Ambient fill color tint. */
  ambient: Color3;
  /** Key light color tint. */
  key: Color3;
  /** Ceiling pendant / chandelier color. */
  pendant: Color3;
  /** Fog color that blends with the room tone. */
  fog: Color3;
  /** Exterior light coming through the window. */
  exterior: Color3;
  /** Soft shadow darkness 0..1. */
  shadow: number;
}

export interface AtmosphereConfig {
  /** Postprocessing mood: overall warmth offset, 0=cold … 1=warm. */
  warmth: number;
  /** Film grain / haze amount 0..1. */
  haze: number;
  /** Bloom intensity 0..2. */
  bloom: number;
  /** Vignette strength 0..1. */
  vignette: number;
  /** Depth of field blur amount 0..1. */
  depthOfField: number;
  /** Chromatic aberration amount 0..1. */
  aberration: number;
}

export interface FurnitureConfig {
  /** Table finish color. */
  table: Color3;
  /** Chair finish color. */
  chair: Color3;
  /** Counter top finish color. */
  counterTop: Color3;
  /** Counter body finish color. */
  counterBody: Color3;
  /** Floor tone. */
  floor: Color3;
  /** Wall tone. */
  wall: Color3;
  /** Accent trim tone (baseboards, molding, ceiling band). */
  trim: Color3;
}

export type MachineVariant = 'lever' | 'piston' | 'automatic' | 'espresso' | 'bean-to-cup' | 'molecular';
export type DeviceType = 'radio' | 'turntable' | 'boombox' | 'cd-player' | 'smart-speaker' | 'hologram';
export type TillType = 'register' | 'cash' | 'electronic' | 'touchscreen' | 'tablet' | 'neural';
export type PosterTheme = 'war' | 'coffee' | 'soda' | 'digital' | 'minimal' | 'holographic';
export type SignageType = 'neon' | 'painted' | 'plastic' | 'led' | 'backlit' | 'holo';
export type PatronStyle = 'uniform' | 'midcentury' | 'retro' | 'casual' | 'modern' | 'augmented';
export type TablewareStyle = 'porcelain' | 'stoneware' | 'melamine' | 'ceramic' | 'matte' | 'biogel';
export type DecorTheme = 'wartime' | 'midcentury' | 'neon' | 'minimal' | 'industrial' | 'holo';

export interface EraConfig {
  id: EraId;
  label: string;
  tagline: string;
  /** Menu board items with period-correct prices. */
  menu: { name: string; price: string }[];
  lighting: LightingConfig;
  atmosphere: AtmosphereConfig;
  furniture: FurnitureConfig;
  machineVariant: MachineVariant;
  deviceType: DeviceType;
  tillType: TillType;
  posterTheme: PosterTheme;
  signageType: SignageType;
  patronStyle: PatronStyle;
  tablewareStyle: TablewareStyle;
  decorTheme: DecorTheme;
  /** Seed used to scatter deterministic props (posters, patrons, particles). */
  seed: number;
  /** True when the era is the "today" reference period. */
  isPresent?: boolean;
}

export interface EraSnapshot {
  id: EraId;
  progress: number;
  from: EraConfig;
  to: EraConfig;
}
