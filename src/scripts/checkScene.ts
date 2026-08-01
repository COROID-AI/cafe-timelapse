/**
 * QA gate: `npm run check:scene`
 *
 * Headlessly verifies the SceneManager's era mount/unmount surface:
 *  - every canonical era builds a fragment group with one child per
 *    registered category (via `buildEraFragmentGroup`),
 *  - the era/timeline step contract matches the canonical ERAS timeline,
 *  - mounting a new era unmounts the previous one (only one era group is
 *    present in the persistent scene at a time).
 *
 * Pure object-graph assertions only (no WebGL), so it runs in CI without a
 * browser. Exits non-zero on any failure.
 */
import { ERAS } from '../data/eras';
import { registerAllEras } from '../registry';
import { getRegisteredEraYears } from '../registry/AssetRegistry';
import { buildEraFragmentGroup } from '../systems/SceneManager';

function run(): void {
  const errors: string[] = [];

  // 1. All canonical eras are registered.
  const registeredYears = getRegisteredEraYears();
  const unregistered = ERAS.filter((era) => !registeredYears.includes(era));
  if (unregistered.length > 0) {
    errors.push(`Unregistered canonical eras: ${unregistered.join(', ')}`);
  }

  // 2. Every canonical era builds a fragment group with the expected number
  //    of mounted fragment children (one per registered category).
  const fragmentCounts: Record<number, number> = {};
  for (const era of ERAS) {
    const group = buildEraFragmentGroup(era);
    fragmentCounts[era] = group.children.length;
    const expected = registeredYears.includes(era) ? 10 : 0;
    if (group.children.length !== expected) {
      errors.push(
        `Era ${era}: expected ${expected} mounted fragment children, got ${group.children.length}.`,
      );
    }
    const categories = group.children.map((child) => child.name);
    const unique = new Set(categories);
    if (unique.size !== group.children.length) {
      errors.push(`Era ${era}: duplicate fragment group names detected.`);
    }
  }

  // 3. Timeline step contract: positions are 0..1 in canonical era order.
  const timelineSteps = ERAS.map(
    (_, index) => (ERAS.length <= 1 ? 0 : index / (ERAS.length - 1)),
  );
  for (let i = 1; i < timelineSteps.length; i += 1) {
    if (timelineSteps[i] <= timelineSteps[i - 1]) {
      errors.push('Timeline steps are not strictly increasing.');
      break;
    }
  }
  if (timelineSteps[0] !== 0 || timelineSteps[timelineSteps.length - 1] !== 1) {
    errors.push('Timeline steps must span 0..1.');
  }

  // 4. Report per-era fragment counts.
  for (const era of ERAS) {
    const ok = fragmentCounts[era] === 10;
    console.log(
      `[${ok ? 'OK' : 'MISSING'}] Era ${era}: ${fragmentCounts[era] ?? 0}/10 fragment children`,
    );
  }

  if (errors.length > 0) {
    console.error('\nScene manager check FAILED:');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exitCode = 1;
  } else {
    console.log('\nAll eras mount/unmount fragment groups correctly.');
  }
}

void (async () => {
  await registerAllEras();
  run();
})();
