// Test to see what we get when importing era files as ES modules
import era1945 from '../src/eras/1945.js';
import { isEra } from '../src/contracts/PeriodPackage.js';

console.log('era1945:', era1945);
console.log('typeof era1945:', typeof era1945);
console.log('isEra(era1945):', isEra(era1945));

// Let's also check the properties that isEra checks
if (era1945 !== null && typeof era1945 === 'object') {
  console.log('year:', era1945.year, typeof era1945.year);
  console.log('name:', era1945.name, typeof era1945.name);
  console.log('theme:', era1945.theme, typeof era1945.theme);
  console.log('furniture:', Array.isArray(era1945.furniture), era1945.furniture);
  console.log('decor:', Array.isArray(era1945.decor), era1945.decor);
  console.log('menu:', era1945.menu, typeof era1945.menu);
  if (era1945.menu) {
    console.log('menu.items:', Array.isArray(era1945.menu.items), era1945.menu.items);
    console.log('menu.board:', era1945.menu.board, typeof era1945.menu.board);
  }
  console.log('audio:', era1945.audio, typeof era1945.audio);
  if (era1945.audio) {
    console.log('audio.music:', era1945.audio.music, typeof era1945.audio.music);
    if (era1945.audio.music) {
      console.log('audio.music.id:', era1945.audio.music.id, typeof era1945.audio.music.id);
      console.log('audio.music.type:', era1945.audio.music.type, typeof era1945.audio.music.type);
      console.log('audio.music.volume:', era1945.audio.music.volume, typeof era1945.audio.music.volume);
    }
    console.log('audio.sfx:', Array.isArray(era1945.audio.sfx), era1945.audio.sfx);
    console.log('audio.ambientNoise:', era1945.audio.ambientNoise, typeof era1945.audio.ambientNoise);
  }
  console.log('lighting:', era1945.lighting, typeof era1945.lighting);
  if (era1945.lighting) {
    console.log('lighting.color:', era1945.lighting.color, typeof era1945.lighting.color);
    console.log('lighting.intensity:', era1945.lighting.intensity, typeof era1945.lighting.intensity);
    console.log('lighting.fixtureType:', era1945.lighting.fixtureType, typeof era1945.lighting.fixtureType);
  }
  console.log('signage:', era1945.signage, typeof era1945.signage);
  if (era1945.signage) {
    console.log('signage.posters:', Array.isArray(era1945.signage.posters), era1945.signage.posters);
    console.log('signage.menuBoard:', era1945.signage.menuBoard, typeof era1945.signage.menuBoard);
    console.log('signage.windowDisplays:', Array.isArray(era1945.signage.windowDisplays), era1945.signage.windowDisplays);
  }
  console.log('patrons:', era1945.patrons, typeof era1945.patrons);
  if (era1945.patrons) {
    console.log('patrons.outfits:', Array.isArray(era1945.patrons.outfits), era1945.patrons.outfits);
    console.log('patrons.hairstyles:', Array.isArray(era1945.patrons.hairstyles), era1945.patrons.hairstyles);
    console.log('patrons.gadgets:', Array.isArray(era1945.patrons.gadgets), era1945.patrons.gadgets);
  }
  console.log('counterTech:', era1945.counterTech, typeof era1945.counterTech);
}