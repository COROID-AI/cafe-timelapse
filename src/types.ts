export type EraId = 'e1945' | 'e1965' | 'e1985' | 'e2005' | 'e2025' | 'e2055';

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface EraPalette {
  /** Ceiling / upper wall wash color. */
  ceiling: string;
  /** Wall color. */
  wall: string;
  /** Floor color. */
  floor: string;
  /** Trim / wainscot / wood accent color. */
  trim: string;
  /** Ambient light color. */
  ambient: string;
  /** Key (main) light color. */
  key: string;
  /** Point light color(s). */
  point: string;
  /** Scene fog color. */
  fog: string;
  /** Bloom strength for the era. */
  bloom: number;
  /** Fog density. */
  fogDensity: number;
  /** Key light intensity. */
  keyIntensity: number;
  /** Ambient light intensity. */
  ambientIntensity: number;
  /** Point light intensity. */
  pointIntensity: number;
}

export interface MenuItem {
  item: string;
  price: string;
}

export interface MenuSpec {
  title: string;
  items: MenuItem[];
}

export interface PosterSpec {
  /** Slot key on the wall; content varies per era. */
  slot: string;
  title: string;
  caption: string;
  /** Accent color used when rendering the poster. */
  accent: string;
}

export interface FurnitureSpec {
  tableStyle: string;
  chairStyle: string;
  /** Accent color for chairs / tableware. */
  accent: string;
}

export interface MusicSpec {
  device: string;
  genre: string;
  tempo: number;
  /** Descriptive flavor, used for the UI. */
  note: string;
}

export interface Era {
  id: EraId;
  year: number;
  label: string;
  tagline: string;
  palette: EraPalette;
  menu: MenuSpec;
  posters: PosterSpec[];
  furniture: FurnitureSpec;
  music: MusicSpec;
  /** Key light direction (normalized by consumer). */
  keyLight: Vec3Tuple;
  /** Point light position. */
  pointLight: Vec3Tuple;
  /** Camera preset positions. */
  presets: {
    overview: Vec3Tuple;
    counter: Vec3Tuple;
    table: Vec3Tuple;
  };
  /** Index of the music device variant (see MusicDevice). */
  musicDeviceIndex: number;
}

export type TransitionPhase = 'idle' | 'fading';

export interface TransitionState {
  /** Current display value 0..1 across the full fade. */
  progress: number;
  /** Era that is currently fully shown (or being revealed). */
  fromEra: EraId;
  /** Era being faded in. */
  toEra: EraId;
  /** Blend weight 0..1 toward toEra. */
  weight: number;
  phase: TransitionPhase;
  /** True when the previous cross-fade finished cleanly. */
  settled: boolean;
}

export interface CameraPresetName {
  name: string;
  position: Vec3Tuple;
  target: Vec3Tuple;
}
