import { createRequire } from 'module';
import { isEra } from '../src/contracts/PeriodPackage.js';

const require = createRequire(import.meta.url);

const era1945 = require('../src/eras/1945.js');
console.log('era1945:', era1945);
console.log('isEra(era1945):', isEra(era1945));