/**
 * 1965 patron cast — mod optimism.
 *
 * Sleek bowl cuts and tight crops, block-colour mini-dress silhouettes for
 * the women, slim suits with skinny ties for the men, and the era's wonder
 * gadget: a pocket transistor radio humming on the Formica.
 */

import type { PatronCastSpec } from '../types';

export const PATRON_CAST_1965: PatronCastSpec = [
  {
    id: 'w-mod-white-minidress',
    label: 'woman · mod bowl cut · white mini-dress with orange trim · sipping tea',
    skin: '#e8b48c',
    hairstyle: 'modBowl',
    hairColor: '#17141a',
    outfit: {
      id: 'mini-dress-white-orange',
      label: 'mini-dress silhouette (white/orange)',
      top: '#f2ede2',
      bottom: '#e5dfd0',
      accent: '#ff6a3d',
    },
    gadget: 'teacup',
    gadgetMount: 'rightHand',
    idle: 'sip',
    seat: { kind: 'table', table: 0, chair: 0 },
  },
  {
    id: 'w-mod-teal-shift-radio',
    label: 'woman · mod bowl cut · teal shift dress · transistor radio on table',
    skin: '#c98e63',
    hairstyle: 'modBowl',
    hairColor: '#c9a35a',
    outfit: { id: 'shift-dress-teal', label: 'block-shift mini-dress (teal)', top: '#2fa8a0', bottom: '#26877f' },
    gadget: 'transistorRadio',
    gadgetMount: 'table',
    idle: 'headTurn',
    seat: { kind: 'table', table: 1, chair: 0 },
  },
  {
    id: 'm-mod-navy-slimsuit-paper',
    label: 'man · mod crop · navy slim suit, skinny tie · broadsheet',
    skin: '#e8b48c',
    hairstyle: 'modCrop',
    hairColor: '#2c2118',
    outfit: {
      id: 'slim-suit-navy',
      label: 'slim suit (navy)',
      top: '#33415c',
      bottom: '#2a3648',
      accent: '#b3392f',
    },
    gadget: 'newspaper',
    gadgetMount: 'table',
    idle: 'headTurn',
    seat: { kind: 'table', table: 2, chair: 0 },
  },
  {
    id: 'm-mod-burgundy-slimsuit-cup',
    label: 'man · mod crop · burgundy slim suit · sipping tea',
    skin: '#c98e63',
    hairstyle: 'modCrop',
    hairColor: '#191512',
    outfit: {
      id: 'slim-suit-burgundy',
      label: 'slim suit (burgundy)',
      top: '#6e2f37',
      bottom: '#57242b',
      accent: '#efeae2',
    },
    gadget: 'teacup',
    gadgetMount: 'rightHand',
    idle: 'sip',
    seat: { kind: 'table', table: 3, chair: 0 },
  },
  {
    id: 'w-mod-pink-minidress',
    label: 'woman · mod bowl cut · pink mini-dress',
    skin: '#8d5a3a',
    hairstyle: 'modBowl',
    hairColor: '#7a3b24',
    outfit: { id: 'mini-dress-pink', label: 'mini-dress silhouette (pink)', top: '#e07a9a', bottom: '#c05f80' },
    gadget: 'teacup',
    gadgetMount: 'rightHand',
    idle: 'headTurn',
    seat: { kind: 'table', table: 4, chair: 0 },
  },
];
