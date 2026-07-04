// Test file to check era imports
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('Testing era imports...');
try {
  const era1945 = require('../src/eras/1945.js');
  console.log('era1945 type:', typeof era1945);
  console.log('era1945 keys:', Object.keys(era1945));
  console.log('era1945:', era1945);
} catch (e) {
  console.log('Error requiring era1945:', e.message);
}

try {
  const eraModule = await import('../src/eras/1945.js');
  console.log('ES module era1945:', eraModule);
} catch (e) {
  console.log('Error importing era1945 as ES module:', e.message);
}