/**
 * QA gate: `npm run check:eras`
 *
 * Asserts that every era in the canonical timeline (src/data/eras.ts) is
 * registered in the AssetRegistry with every required EraData category, that
 * every registered era is one of the canonical eras, and that composed eras
 * supply their era audio config (Phase 4).
 *
 * Exits non-zero on any missing category, duplicate category, unknown era, or
 * missing audio config.
 */
import { ERAS, type EraYear } from '../data/eras';
import {
  getAllEraRegistrations,
  getRegisteredEraYears,
} from '../registry/AssetRegistry';
import { validateRegistration, summarizeCoverage } from '../registry/coverage';
import { ERA_AUDIO_1965 } from '../audio/eras/1965';
// Static side-effect imports register every era into the registry.
import '../registry/eras/1945';
import '../registry/eras/1965';
import '../registry/eras/1985';
import '../registry/eras/2005';
import '../registry/eras/2025';
import '../registry/eras/2055';

const REQUIRED_CATEGORY_COUNT = 10;

/** Every composed era must also supply an era audio config (Phase 4). */
const ERA_AUDIO_CONFIGS: Record<number, unknown> = {
  1965: ERA_AUDIO_1965,
};

function missing<T>(list: T[], expected: T[]): T[] {
  return expected.filter((item) => !list.includes(item));
}

function run(): void {
  const registeredYears = getRegisteredEraYears();
  const registrations = getAllEraRegistrations();
  const errors: string[] = [];

  // 1. Every canonical era must be registered.
  const unregisteredEras = missing<EraYear>(registeredYears, [...ERAS]);
  if (unregisteredEras.length > 0) {
    errors.push(`Unregistered canonical eras: ${unregisteredEras.join(', ')}`);
  }

  // 2. No era outside the canonical timeline may be registered.
  const extraEras = registeredYears.filter((year) => !(ERAS as readonly number[]).includes(year));
  if (extraEras.length > 0) {
    errors.push(`Registered eras outside the canonical timeline: ${extraEras.join(', ')}`);
  }

  // 3. Every registration must supply all required fragment categories.
  for (const registration of registrations) {
    errors.push(...validateRegistration(registration));
  }

  // 3b. Composed eras must supply their era audio config (generative bed,
  //     jukebox character, urn hiss) per the Phase 4 brief.
  for (const [year, config] of Object.entries(ERA_AUDIO_CONFIGS)) {
    const audio = config as {
      era?: number;
      generativeBed?: unknown[];
      jukeboxCharacter?: unknown;
      urnHiss?: unknown;
    };
    if (!audio || audio.era !== Number(year)) {
      errors.push(`Era ${year}: era audio config is missing or has the wrong era.`);
    } else if (
      !Array.isArray(audio.generativeBed) ||
      audio.generativeBed.length === 0 ||
      !audio.jukeboxCharacter ||
      !audio.urnHiss
    ) {
      errors.push(
        `Era ${year}: era audio config must supply a generative bed, jukebox character and urn hiss.`,
      );
    }
  }

  // 4. Report the coverage summary.
  const coverage = summarizeCoverage(registrations);
  for (const year of [...ERAS]) {
    const categories = coverage[year] ?? [];
    const ok = categories.length === REQUIRED_CATEGORY_COUNT;
    console.log(
      `[${ok ? 'OK' : 'MISSING'}] Era ${year}: ${categories.length}/${REQUIRED_CATEGORY_COUNT} categories`,
    );
    if (categories.length !== REQUIRED_CATEGORY_COUNT) {
      const missingCategories = missing(categories, [
        'architecture',
        'furnitureDecor',
        'coffeeMachines',
        'menuBoard',
        'musicSource',
        'posters',
        'tableware',
        'signageLighting',
        'counterTechnology',
        'patrons',
      ]);
      console.log(`      missing: ${missingCategories.join(', ') || 'none'}`);
    }
  }

  if (errors.length > 0) {
    console.error('\nEra registry check FAILED:');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exitCode = 1;
  } else {
    console.log('\nAll eras registered with all required categories.');
    console.log(`Era audio configs present: ${Object.keys(ERA_AUDIO_CONFIGS).join(', ')}`);
  }
}

void run();
