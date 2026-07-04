const { isEra } = require('./src/contracts/PeriodPackage.js');
const era1945 = require('./src/eras/1945.js');

console.log('isEra(era1945):', isEra(era1945));
console.log('era1945:', JSON.stringify(era1945, null, 2));