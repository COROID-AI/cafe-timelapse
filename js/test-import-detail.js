import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Test what we get when requiring the era file
const era1945 = require('../src/eras/1945.js');
console.log('Required era1945:', era1945);
console.log('Type of required era1945:', typeof era1945);

// Test what we get when importing as ES module
import('../src/eras/1945.js').then(module => {
  console.log('Imported era1945 module object:', module);
  console.log('Default export:', module.default);
  console.log('All exports:', Object.keys(module));
}).catch(err => {
  console.log('Error importing as ES module:', err.message);
});