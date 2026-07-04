import { isEra } from '../src/contracts/PeriodPackage.js';
import era1945 from '../src/eras/1945.js';
import era1965 from '../src/eras/1965.js';
import era1985 from '../src/eras/1985.js';
import era2005 from '../src/eras/2005.js';
import era2025 from '../src/eras/2025.js';

console.log('Testing isEra function:');
console.log('1945:', isEra(era1945));
console.log('1965:', isEra(era1965));
console.log('1985:', isEra(era1985));
console.log('2005:', isEra(era2005));
console.log('2025:', isEra(era2025));