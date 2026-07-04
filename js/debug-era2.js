import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { isEra } from '../src/contracts/PeriodPackage.js';

const era1945 = require('../src/eras/1945.js');
console.log('era1945:', era1945);
console.log('typeof era1945:', typeof era1945);
console.log('isEra(era1945):', isEra(era1945));

// Let's also check the properties
console.log('year:', era1945.year);
console.log('name:', era1945.name);
console.log('theme:', era1945.theme);
console.log('furniture:', era1945.furniture);
console.log('decor:', era1945.decor);
console.log('menu:', era1945.menu);
console.log('audio:', era1945.audio);
console.log('lighting:', era1945.lighting);
console.log('signage:', era1945.signage);
console.log('patrons:', era1945.patrons);
console.log('counterTech:', era1945.counterTech);