/**
 * 1985 patron cast — big hair, bigger shoulders.
 *
 * Voluminous perms, power blazers with exaggerated shoulder pads, neon
 * colour-blocked windbreakers, a Walkman with orange foam headphones — and
 * the room's sound system: a chrome-stereo boombox parked on a counter stool
 * beside a patron perched at the back-bar.
 */

import type { PatronCastSpec } from '../types';

export const PATRON_CAST_1985: PatronCastSpec = [
  {
    id: 'w-perm-teal-blazer',
    label: 'woman · big perm · teal shoulder-pad blazer, pastel skirt · sipping tea',
    skin: '#e8b48c',
    hairstyle: 'bigPerm',
    hairColor: '#6e2a3a',
    outfit: {
      id: 'power-blazer-teal',
      label: 'shoulder-pad blazer (teal) + pastel skirt',
      top: '#3aa8a0',
      bottom: '#f2cfd4',
    },
    shoulderPads: true,
    gadget: 'teacup',
    gadgetMount: 'rightHand',
    idle: 'sip',
    seat: { kind: 'table', table: 0, chair: 0 },
  },
  {
    id: 'w-perm-magenta-walkman',
    label: 'woman · big perm · magenta shoulder-pad jacket · Walkman + orange foam headphones',
    skin: '#c98e63',
    hairstyle: 'bigPerm',
    hairColor: '#d9b45f',
    outfit: {
      id: 'power-jacket-magenta',
      label: 'shoulder-pad jacket (magenta)',
      top: '#c74f8f',
      bottom: '#f6d8bd',
    },
    shoulderPads: true,
    gadget: 'walkman',
    gadgetMount: 'worn',
    idle: 'headTurn',
    seat: { kind: 'table', table: 1, chair: 0 },
  },
  {
    id: 'm-shortperm-cyan-windbreaker',
    label: 'man · short perm · cyan neon windbreaker with yellow chest stripe',
    skin: '#8d5a3a',
    hairstyle: 'shortPerm',
    hairColor: '#201a16',
    outfit: {
      id: 'windbreaker-cyan',
      label: 'neon windbreaker (cyan/yellow)',
      top: '#29b6c5',
      bottom: '#8f9aa6',
      accent: '#ffd23e',
    },
    accentStripe: true,
    gadget: 'teacup',
    gadgetMount: 'rightHand',
    idle: 'headTurn',
    seat: { kind: 'table', table: 2, chair: 0 },
  },
  {
    id: 'm-perm-orange-windbreaker-paper',
    label: 'man · big perm · orange/magenta neon windbreaker · broadsheet',
    skin: '#f0c8a0',
    hairstyle: 'bigPerm',
    hairColor: '#2e2020',
    outfit: {
      id: 'windbreaker-orange',
      label: 'neon windbreaker (orange/magenta)',
      top: '#ff5f8f',
      bottom: '#5a6472',
      accent: '#ffb03a',
    },
    accentStripe: true,
    gadget: 'newspaper',
    gadgetMount: 'table',
    idle: 'headTurn',
    seat: { kind: 'table', table: 3, chair: 0 },
  },
  {
    id: 'w-shortperm-purple-jacket',
    label: 'woman · short perm · purple shoulder-pad jacket',
    skin: '#a86a42',
    hairstyle: 'shortPerm',
    hairColor: '#1c1c20',
    outfit: {
      id: 'power-jacket-purple',
      label: 'shoulder-pad jacket (purple)',
      top: '#7a5fb0',
      bottom: '#efeae2',
    },
    shoulderPads: true,
    gadget: 'teacup',
    gadgetMount: 'rightHand',
    idle: 'sip',
    seat: { kind: 'table', table: 4, chair: 0 },
  },
  {
    id: 'm-counter-boombox',
    label: 'man · short perm · denim jacket · boombox on counter stool beside him',
    skin: '#8d5a3a',
    hairstyle: 'shortPerm',
    hairColor: '#26201a',
    outfit: {
      id: 'denim-jacket-1985',
      label: 'stone-wash denim jacket',
      top: '#4a648a',
      bottom: '#33383f',
    },
    gadget: 'boombox',
    gadgetMount: 'stool',
    idle: 'headTurn',
    seat: { kind: 'counterStool' },
  },
];
