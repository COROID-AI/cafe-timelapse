// Test the PeriodManager
import PeriodManager from './period-manager.js';

async function testPeriodManager() {
  console.log('Creating PeriodManager...');
  const pm = new PeriodManager();
  
  console.log('Waiting for eras to load...');
  const initialState = await pm.getState();
  console.log('Initial era:', initialState.name);
  console.log('Initial year:', await pm.getCurrentYear());
  
  console.log('\\nSetting era to 1965...');
  await pm.setEra(1965);
  const era1965State = await pm.getState();
  console.log('Current era:', era1965State.name);
  console.log('Current year:', await pm.getCurrentYear());
  
  console.log('\\nSetting era to 2025...');
  await pm.setEra(2025);
  const era2025State = await pm.getState();
  console.log('Current era:', era2025State.name);
  console.log('Current year:', await pm.getCurrentYear());
  
  console.log('\\nTest completed successfully!');
}

testPeriodManager().catch(error => {
  console.error('Test failed:', error);
});