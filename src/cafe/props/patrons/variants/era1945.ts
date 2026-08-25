/**
 * 1945 patron cast — post-war austerity.
 *
 * Women in victory-roll hair and floral/wool tea dresses; men in RAF-style
 * side parts with neat mustaches and heavy wool suits. Table gadgets stay
 * analogue: broadsheet newspapers, a pipe, china teacups.
 */

import type { PatronCastSpec } from '../types';

export const PATRON_CAST_1945: PatronCastSpec = [
  {
    id: 'w-victoryrolls-rose-teadress',
    label: 'woman · victory rolls · rose floral tea dress · sipping tea',
    skin: '#e8b48c',
    hairstyle: 'victoryRolls',
    hairColor: '#4a3220',
    outfit: { id: 'tea-dress-rose', label: 'floral tea dress (rose)', top: '#b76983', bottom: '#96516a' },
    gadget: 'teacup',
    gadgetMount: 'rightHand',
    idle: 'sip',
    seat: { kind: 'table', table: 0, chair: 0 },
  },
  {
    id: 'w-victoryrolls-sage-teadress',
    label: 'woman · victory rolls · sage wool tea dress · reading the paper',
    skin: '#c98e63',
    hairstyle: 'victoryRolls',
    hairColor: '#2e241c',
    outfit: { id: 'tea-dress-sage', label: 'wool tea dress (sage)', top: '#7d8f6a', bottom: '#5f7150' },
    gadget: 'newspaper',
    gadgetMount: 'bothHands',
    idle: 'headTurn',
    seat: { kind: 'table', table: 0, chair: 1 },
  },
  {
    id: 'm-raf-brown-woolsuit-pipe',
    label: 'man · RAF side part · mustache · brown wool suit · smoking a pipe',
    skin: '#e8b48c',
    hairstyle: 'rafSidePart',
    hairColor: '#3a2c1e',
    facialHair: 'rafMustache',
    outfit: {
      id: 'wool-suit-brown',
      label: 'heavy wool suit (brown)',
      top: '#6b5843',
      bottom: '#57462f',
      accent: '#3d3428',
    },
    gadget: 'pipe',
    gadgetMount: 'rightHand',
    idle: 'headTurn',
    seat: { kind: 'table', table: 1, chair: 0 },
  },
  {
    id: 'm-raf-charcoal-woolsuit-paper',
    label: 'man · RAF side part · mustache · charcoal wool suit · broadsheet',
    skin: '#c98e63',
    hairstyle: 'rafSidePart',
    hairColor: '#241c14',
    facialHair: 'rafMustache',
    outfit: {
      id: 'wool-suit-charcoal',
      label: 'heavy wool suit (charcoal)',
      top: '#4a4a52',
      bottom: '#3a3a40',
      accent: '#33333a',
    },
    gadget: 'newspaper',
    gadgetMount: 'table',
    idle: 'headTurn',
    seat: { kind: 'table', table: 2, chair: 0 },
  },
  {
    id: 'w-victoryrolls-plum-teadress',
    label: 'woman · victory rolls · plum tea dress · sipping tea',
    skin: '#8d5a3a',
    hairstyle: 'victoryRolls',
    hairColor: '#171310',
    outfit: { id: 'tea-dress-plum', label: 'tea dress (plum)', top: '#7a5570', bottom: '#5c4055' },
    gadget: 'teacup',
    gadgetMount: 'rightHand',
    idle: 'sip',
    seat: { kind: 'table', table: 3, chair: 0 },
  },
];
