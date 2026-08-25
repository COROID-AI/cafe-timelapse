/**
 * 2005 patron cast — flip phones and frosted tips.
 *
 * Spiky bleached tips and long emo fringes, layered tees over low-rise jeans,
 * flip phones flipped open in one hand, white iPod earbud cords snaking down
 * hoodies, and an early laptop lid cracked open on the table.
 */

import type { PatronCastSpec } from '../types';

export const PATRON_CAST_2005: PatronCastSpec = [
  {
    id: 'm-frosted-slate-tee-laptop',
    label: 'man · frosted tips · slate tee, low-rise jeans · laptop open on table',
    skin: '#e8b48c',
    hairstyle: 'frostedTips',
    hairColor: '#6b4a2f',
    outfit: {
      id: 'tee-jeans-slate',
      label: 'layered tee (slate) + low-rise jeans',
      top: '#4a5560',
      bottom: '#3d4c63',
    },
    sleeves: 'short',
    gadget: 'laptop',
    gadgetMount: 'table',
    idle: 'headTurn',
    seat: { kind: 'table', table: 0, chair: 0 },
  },
  {
    id: 'w-emo-dark-flipphone',
    label: 'woman · emo fringe · dark hoodie layers, low-rise jeans · flip phone glance',
    skin: '#c98e63',
    hairstyle: 'emoFringe',
    hairColor: '#14100e',
    outfit: {
      id: 'hoodie-jeans-dark',
      label: 'layered dark hoodie + low-rise jeans',
      top: '#3a3f45',
      bottom: '#2e3644',
    },
    sleeves: 'short',
    gadget: 'flipPhone',
    gadgetMount: 'screen',
    idle: 'phoneGlance',
    seat: { kind: 'table', table: 1, chair: 0 },
  },
  {
    id: 'm-frosted-green-polo',
    label: 'man · frosted tips · green polo, khakis · sipping tea',
    skin: '#f0c8a0',
    hairstyle: 'frostedTips',
    hairColor: '#8a5a32',
    outfit: {
      id: 'polo-khaki',
      label: 'striped polo (green) + khaki trousers',
      top: '#2e5f46',
      bottom: '#7a6a4a',
    },
    sleeves: 'short',
    gadget: 'teacup',
    gadgetMount: 'rightHand',
    idle: 'sip',
    seat: { kind: 'table', table: 2, chair: 0 },
  },
  {
    id: 'w-emo-bandtee-earbuds',
    label: 'woman · emo fringe · band tee, low-rise jeans · white iPod earbud cords',
    skin: '#8d5a3a',
    hairstyle: 'emoFringe',
    hairColor: '#2a1e16',
    outfit: {
      id: 'bandtee-jeans',
      label: 'band tee (maroon) + low-rise jeans',
      top: '#6e2f37',
      bottom: '#39465c',
    },
    sleeves: 'short',
    gadget: 'earbudCord',
    gadgetMount: 'worn',
    idle: 'headTurn',
    seat: { kind: 'table', table: 3, chair: 0 },
  },
  {
    id: 'm-frosted-cream-tee-flipphone',
    label: 'man · frosted tips · cream tee, cargo trousers · flip phone glance',
    skin: '#a86a42',
    hairstyle: 'frostedTips',
    hairColor: '#b98a4a',
    outfit: {
      id: 'tee-cargo-cream',
      label: 'baggy tee (cream) + cargo trousers',
      top: '#c9c2b4',
      bottom: '#4a4a42',
    },
    sleeves: 'short',
    gadget: 'flipPhone',
    gadgetMount: 'screen',
    idle: 'phoneGlance',
    seat: { kind: 'table', table: 4, chair: 0 },
  },
];
