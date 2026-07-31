/**
 * Era palette tokens — the canonical colour language of the Café Time Period
 * Timelapse.
 *
 * Every era in the timeline (src/data/eras.ts) gets one token set. Era tasks
 * compose TextureFactory / MaterialFactory / PropPrimitives with these tokens
 * so a café built for 1945 reads as warm ration-era walnut and cream, while a
 * 2055 café reads as reactive glass and bioluminescent teal — without anyone
 * hard-coding a colour per mesh.
 *
 * Tokens are deliberately human-editable hex strings. They are derived from
 * the EraData records in src/data/eras/*.ts (architecture, furniture, machines,
 * signage, lighting).
 */
import type { EraYear } from '../data/eras';

/** One era's palette tokens. Every colour is a CSS hex string. */
export interface EraPaletteTokens {
  /** Interior wall colour. */
  walls: string;
  /** Floor colour. */
  floor: string;
  /** Ceiling colour. */
  ceiling: string;
  /** Trim / frames / skirting. */
  trim: string;
  /** Primary furniture colour. */
  furniture: string;
  /** Secondary furniture / accent colour. */
  accent: string;
  /** Coffee machine / chrome / brass body. */
  machines: string;
  /** Menu board / signage surface. */
  signage: string;
  /** Neon / emissive accent. */
  neon: string;
  /** Tableware colour. */
  tableware: string;
  /** Warm point-light / pendant tint. */
  light: string;
  /** Ambient / fog tone. */
  ambient: string;
}

/** The palette tokens for every canonical era year. */
export const ERA_PALETTES: Record<EraYear, EraPaletteTokens> = {
  1945: {
    walls: '#EDE3CE', // scrubbed cream plaster
    floor: '#E8E0D0', // checkerboard linoleum light square
    ceiling: '#B9B2A2', // pressed tin
    trim: '#4A3726', // dark oak skirting
    furniture: '#5C4432', // walnut counter / bentwood
    accent: '#2E4B3C', // deep green dado rail
    machines: '#B08D57', // brass lever machine fittings
    signage: '#2F3B31', // hand-painted chalkboard green
    neon: '#FFC27A', // warm tungsten glow
    tableware: '#F4EFE6', // bone china
    light: '#FFC27A',
    ambient: '#2A2620',
  },
  1965: {
    walls: '#EFE3B6', // pale yellow plaster
    floor: '#CFC7B8', // terrazzo with brass inlay
    ceiling: '#F0ECE2', // smooth plaster
    trim: '#B8BEC4', // anodised aluminium
    furniture: '#D94F3D', // Formica pop red
    accent: '#C9CDD2', // chrome dado rail
    machines: '#D6D9DC', // chrome Gaggia
    signage: '#1F2428', // neon tube backing
    neon: '#FF5AC8', // pink neon "CAFÉ"
    tableware: '#F2A93B', // melamine tulip cup
    light: '#FFE9C4', // warm fluorescent
    ambient: '#2B2426',
  },
  1985: {
    walls: '#E8B79A', // peach wallpaper
    floor: '#8A8A8E', // grey carpet tiles
    ceiling: '#D9D9D6', // suspended ceiling panels
    trim: '#A9803F', // brass effect
    furniture: '#7A2436', // plush burgundy
    accent: '#B08958', // oak-effect laminate
    machines: '#B7BBC0', // stainless La Cimbali
    signage: '#E8E8EC', // backlit chrome letters
    neon: '#29E6FF', // neon club flyer cyan
    tableware: '#6E4B32', // brown ceramic mug
    light: '#EAF2FF', // cool fluorescent
    ambient: '#26222B',
  },
  2005: {
    walls: '#5A3A2A', // chocolate brown plaster
    floor: '#C9964F', // warm bamboo
    ceiling: '#3A2C22', // exposed rafters
    trim: '#6A4A3A', // painted MDF
    furniture: '#4A3224', // dark wooden tables
    accent: '#A63A2E', // feature red wall
    machines: '#AEB4BA', // silver super-automatic
    signage: '#F2D06B', // illuminated acrylic
    neon: '#FF8A3D', // warm accent glow
    tableware: '#F2EFE8', // white latte bowl
    light: '#FFD9A0', // track spotlights
    ambient: '#221F1D',
  },
  2025: {
    walls: '#EDEAE2', // white plaster + oak slats
    floor: '#9A958C', // polished concrete
    ceiling: '#1C1C1E', // exposed services, matte black
    trim: '#B98A54', // oak reveals
    furniture: '#A97B48', // live-edge oak
    accent: '#E4DCC8', // bouclé cream
    machines: '#C2C6CB', // stainless La Marzocco
    signage: '#D9D9D6', // brushed aluminium "BREW"
    neon: '#FFD9A0', // warm LED strips
    tableware: '#C9B9A6', // speckled stoneware
    light: '#FFE3B8',
    ambient: '#202020',
  },
  2055: {
    walls: '#3D4F5C', // reactive smart glass
    floor: '#2A3338', // photopolymer with light veins
    ceiling: '#8FA38E', // living mycelium canopy
    trim: '#26292B', // recycled carbon fibre
    furniture: '#7C6E8C', // morphing foam
    accent: '#46D9C2', // holographic teal
    machines: '#D6D9DC', // robo-barista arm
    signage: '#63E6FF', // holographic sign
    neon: '#63E6FF', // bioluminescent glow
    tableware: '#3A3F45', // graphene composite
    light: '#9BF0C0', // bioluminescent nodes
    ambient: '#14181E',
  },
};

/** Return the palette tokens for an era. */
export function paletteFor(era: EraYear): EraPaletteTokens {
  return ERA_PALETTES[era];
}
