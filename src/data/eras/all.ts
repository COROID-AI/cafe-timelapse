/**
 * Barrel re-exporting every per-era EraData record, so QA gates and runtime
 * systems can import all eras from one module without triggering registry
 * side-effects (which live in src/registry/eras/*).
 */
export { era1945 } from './1945';
export { era1965 } from './1965';
export { era1985 } from './1985';
export { era2005 } from './2005';
export { era2025 } from './2025';
export { era2055 } from './2055';
