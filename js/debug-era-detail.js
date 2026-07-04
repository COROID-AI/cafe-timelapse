import { isEra } from './src/contracts/PeriodPackage.js';
import era1945 from './src/eras/1945.js';

console.log('era1945:', era1945);
console.log('isEra(era1945):', isEra(era1945));

// Let's check each property step by step
if (typeof era1945 !== 'object' || era1945 === null) {
  console.log('FAIL: not an object or null');
} else {
  console.log('PASS: is object');
}

if (typeof era1945.year !== 'number') {
  console.log('FAIL: year is not number', typeof era1945.year);
} else {
  console.log('PASS: year is number');
}

if (typeof era1945.name !== 'string') {
  console.log('FAIL: name is not string', typeof era1945.name);
} else {
  console.log('PASS: name is string');
}

if (typeof era1945.theme !== 'string') {
  console.log('FAIL: theme is not string', typeof era1945.theme);
} else {
  console.log('PASS: theme is string');
}

if (!Array.isArray(era1945.furniture)) {
  console.log('FAIL: furniture is not array');
} else {
  console.log('PASS: furniture is array');
}

if (!Array.isArray(era1945.decor)) {
  console.log('FAIL: decor is not array');
} else {
  console.log('PASS: decor is array');
}

if (typeof era1945.menu !== 'object' || era1945.menu === null) {
  console.log('FAIL: menu is not object or null');
} else {
  console.log('PASS: menu is object');
  if (!Array.isArray(era1945.menu.items)) {
    console.log('FAIL: menu.items is not array');
  } else {
    console.log('PASS: menu.items is array');
    era1945.menu.items.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        console.log(`FAIL: menu.items[${index}] is not object`);
      } else {
        if (typeof item.name !== 'string') {
          console.log(`FAIL: menu.items[${index}].name is not string`);
        }
        if (typeof item.price !== 'number') {
          console.log(`FAIL: menu.items[${index}].price is not number`);
        }
        if (typeof item.description !== 'string') {
          console.log(`FAIL: menu.items[${index}].description is not string`);
        }
      }
    });
  }
  if (typeof era1945.menu.board !== 'object' || era1945.menu.board === null) {
    console.log('FAIL: menu.board is not object or null');
  } else {
    console.log('PASS: menu.board is object');
  }
}

if (typeof era1945.audio !== 'object' || era1945.audio === null) {
  console.log('FAIL: audio is not object or null');
} else {
  console.log('PASS: audio is object');
  if (typeof era1945.audio.music !== 'object' || era1945.audio.music === null) {
    console.log('FAIL: audio.music is not object or null');
  } else {
    console.log('PASS: audio.music is object');
    if (typeof era1945.audio.music.id === 'undefined') {
      console.log('FAIL: audio.music.id is undefined');
    } else {
      console.log('PASS: audio.music.id is defined');
    }
    if (typeof era1945.audio.music.type !== 'string') {
      console.log('FAIL: audio.music.type is not string');
    } else {
      console.log('PASS: audio.music.type is string');
    }
    if (typeof era1945.audio.music.volume !== 'number') {
      console.log('FAIL: audio.music.volume is not number');
    } else {
      console.log('PASS: audio.music.volume is number');
    }
  }
  if (!Array.isArray(era1945.audio.sfx)) {
    console.log('FAIL: audio.sfx is not array');
  } else {
    console.log('PASS: audio.sfx is array');
    era1945.audio.sfx.forEach((sfx, index) => {
      if (typeof sfx !== 'object' || sfx === null) {
        console.log(`FAIL: audio.sfx[${index}] is not object`);
      } else {
        if (typeof sfx.type !== 'string') {
          console.log(`FAIL: audio.sfx[${index}].type is not string`);
        }
        if (typeof sfx.id === 'undefined') {
          console.log(`FAIL: audio.sfx[${index}].id is undefined`);
        }
      }
    });
  }
  if (typeof era1945.audio.ambientNoise !== 'string') {
    console.log('FAIL: audio.ambientNoise is not string');
  } else {
    console.log('PASS: audio.ambientNoise is string');
  }
}

if (typeof era1945.lighting !== 'object' || era1945.lighting === null) {
  console.log('FAIL: lighting is not object or null');
} else {
  console.log('PASS: lighting is object');
  if (typeof era1945.lighting.color === 'undefined') {
    console.log('FAIL: lighting.color is undefined');
  } else {
    console.log('PASS: lighting.color is defined');
  }
  if (typeof era1945.lighting.intensity !== 'number') {
    console.log('FAIL: lighting.intensity is not number');
  } else {
    console.log('PASS: lighting.intensity is number');
  }
  if (typeof era1945.lighting.fixtureType !== 'string') {
    console.log('FAIL: lighting.fixtureType is not string');
  } else {
    console.log('PASS: lighting.fixtureType is string');
  }
}

if (typeof era1945.signage !== 'object' || era1945.signage === null) {
  console.log('FAIL: signage is not object or null');
} else {
  console.log('PASS: signage is object');
  if (!Array.isArray(era1945.signage.posters)) {
    console.log('FAIL: signage.posters is not array');
  } else {
    console.log('PASS: signage.posters is array');
  }
  if (typeof era1945.signage.menuBoard !== 'object' || era1945.signage.menuBoard === null) {
    console.log('FAIL: signage.menuBoard is not object or null');
  } else {
    console.log('PASS: signage.menuBoard is object');
  }
  if (!Array.isArray(era1945.signage.windowDisplays)) {
    console.log('FAIL: signage.windowDisplays is not array');
  } else {
    console.log('PASS: signage.windowDisplays is array');
  }
}

if (typeof era1945.patrons !== 'object' || era1945.patrons === null) {
  console.log('FAIL: patrons is not object or null');
} else {
  console.log('PASS: patrons is object');
  if (!Array.isArray(era1945.patrons.outfits)) {
    console.log('FAIL: patrons.outfits is not array');
  } else {
    console.log('PASS: patrons.outfits is array');
  }
  if (!Array.isArray(era1945.patrons.hairstyles)) {
    console.log('FAIL: patrons.hairstyles is not array');
  } else {
    console.log('PASS: patrons.hairstyles is array');
  }
  if (!Array.isArray(era1945.patrons.gadgets)) {
    console.log('FAIL: patrons.gadgets is not array');
  } else {
    console.log('PASS: patrons.gadgets is array');
  }
}

if (typeof era1945.counterTech !== 'string') {
  console.log('FAIL: counterTech is not string');
} else {
  console.log('PASS: counterTech is string');
}