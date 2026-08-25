/**
 * 2025 patron cast — always-on.
 *
 * Slick top buns and defined natural curls, oversized knits and technical
 * shells, smartphones in one hand, white wireless earbuds, a laptop-plus-
 * tablet combo on the table and a matte e-reader held in both hands.
 */

import type { PatronCastSpec } from '../types';

export const PATRON_CAST_2025: PatronCastSpec = [
  {
    id: 'w-bun-oatmeal-knit-phone',
    label: 'woman · slick top bun · oversized oatmeal knit · smartphone glance',
    skin: '#e8b48c',
    hairstyle: 'topBun',
    hairColor: '#1c161a',
    outfit: {
      id: 'oversized-knit-oatmeal',
      label: 'oversized knit (oatmeal) + wide-leg trousers',
      top: '#d8cbb2',
      bottom: '#6a705f',
    },
    sleeves: 'short',
    gadget: 'smartphone',
    gadgetMount: 'screen',
    idle: 'phoneGlance',
    seat: { kind: 'table', table: 0, chair: 0 },
  },
  {
    id: 'm-curls-techwear-laptop-tablet',
    label: 'man · natural curls · dark tech-wear shell · laptop + tablet combo on table',
    skin: '#c98e63',
    hairstyle: 'naturalCurls',
    hairColor: '#33241a',
    outfit: {
      id: 'techwear-shell-dark',
      label: 'tech-wear shell (graphite) with strap accents',
      top: '#2e3238',
      bottom: '#23262b',
      accent: '#8f9aa6',
    },
    gadget: 'laptopTablet',
    gadgetMount: 'table',
    idle: 'headTurn',
    seat: { kind: 'table', table: 1, chair: 0 },
  },
  {
    id: 'w-curls-techwear-ereader',
    label: 'woman · natural curls · olive tech-wear jacket · e-reader in both hands',
    skin: '#8d5a3a',
    hairstyle: 'naturalCurls',
    hairColor: '#4a3020',
    outfit: {
      id: 'techwear-jacket-olive',
      label: 'tech-wear jacket (olive)',
      top: '#5a6148',
      bottom: '#2c2f33',
    },
    gadget: 'eReader',
    gadgetMount: 'bothHands',
    idle: 'headTurn',
    seat: { kind: 'table', table: 2, chair: 0 },
  },
  {
    id: 'm-manbun-hoodie-earbuds',
    label: 'man · man bun · grey hoodie, joggers · white wireless earbuds',
    skin: '#f0c8a0',
    hairstyle: 'topBun',
    hairColor: '#20161a',
    outfit: {
      id: 'hoodie-jogger-grey',
      label: 'oversized hoodie (grey) + joggers',
      top: '#7d8a94',
      bottom: '#4a4f46',
    },
    sleeves: 'short',
    gadget: 'wirelessEarbuds',
    gadgetMount: 'worn',
    idle: 'headTurn',
    seat: { kind: 'table', table: 3, chair: 0 },
  },
  {
    id: 'w-curls-cardigan-cup',
    label: 'woman · natural curls · oversized cardigan (camel) · sipping tea',
    skin: '#a86a42',
    hairstyle: 'naturalCurls',
    hairColor: '#6e3d24',
    outfit: {
      id: 'cardigan-camel',
      label: 'oversized cardigan (camel)',
      top: '#b99f7f',
      bottom: '#57504a',
    },
    sleeves: 'short',
    gadget: 'teacup',
    gadgetMount: 'rightHand',
    idle: 'sip',
    seat: { kind: 'table', table: 4, chair: 0 },
  },
];
