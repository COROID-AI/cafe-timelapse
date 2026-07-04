// Test to see what the era file exports as an ES module
import era1945Module from '../src/eras/1945.js';
console.log('era1945Module:', era1945Module);
console.log('type of era1945Module:', typeof era1945Module);
if (era1945Module !== null && typeof era1945Module === 'object') {
  console.log('year:', era1945Module.year);
}