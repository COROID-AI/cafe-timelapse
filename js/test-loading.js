import { isEra } from '../src/contracts/PeriodPackage.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Test loading with import (ESM)
import era1945ESM from '../src/eras/1945.js';
console.log('ESM import - era1945:', era1945ESM);
console.log('ESM import - isEra(era1945):', isEra(era1945ESM));

// Test loading with require (CommonJS)
const era1945CJS = require('../src/eras/1945.js');
console.log('CJS require - era1945:', era1945CJS);
console.log('CJS require - isEra(era1945):', isEra(era1945CJS));

// Check if they're the same object
console.log('Are they the same?', era1945ESM === era1945CJS);
console.log('ESM type:', typeof era1945ESM);
console.log('CJS type:', typeof era1945CJS);