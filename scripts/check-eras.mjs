/**
 * check-eras.mjs — lint/QA gate for era completeness.
 *
 * Statically validates src/data/eras.ts without executing TypeScript:
 *   1. Exactly the six canonical eras [1945,1965,1985,2005,2025,2055] are present.
 *   2. Each era supplies all 11 required EraData categories.
 *   3. No duplicate or extra era years exist.
 *
 * Exits non-zero (with a clear message) on any violation so this can be wired
 * into CI / npm scripts. Run via `npm run check:eras`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// The canonical expected eras and categories — kept in sync with EraData.ts.
// (EraData.ts is TypeScript; this gate is a plain Node script, so we mirror
//  the canonical lists here. They change only when the brief itself changes.)
const EXPECTED_ERAS = [1945, 1965, 1985, 2005, 2025, 2055];
const REQUIRED_CATEGORIES = [
  'architecture',
  'furnitureDecor',
  'coffeeMachines',
  'menuBoard',
  'musicSource',
  'posters',
  'tableware',
  'signage',
  'lighting',
  'counterTechnology',
  'patrons',
];

/** Split the ERAS array body into balanced top-level objects. */
function splitEraObjects(src) {
  const arrayStart = src.indexOf('ERAS');
  if (arrayStart === -1) {
    throw new Error('Could not locate the ERAS export in eras.ts.');
  }
  const openBracket = src.indexOf('[', arrayStart);
  const closeBracket = src.lastIndexOf(']');
  if (openBracket === -1 || closeBracket === -1 || closeBracket < openBracket) {
    throw new Error('Could not locate the ERAS array bounds [ ... ] in eras.ts.');
  }
  const body = src.slice(openBracket + 1, closeBracket);

  const objects = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        objects.push(body.slice(start, i + 1));
        start = -1;
      }
    }
  }
  if (depth !== 0) {
    throw new Error('Unbalanced braces while parsing era objects in eras.ts.');
  }
  return objects;
}

/** Extract the era year from an era object block. */
function extractYear(block) {
  const match = block.match(/year:\s*(\d{4})/);
  if (!match) return null;
  return Number(match[1]);
}

/**
 * Collect the top-level property keys of an era object block (keys at brace
 * depth 1). This avoids matching nested keys inside category sub-objects.
 */
function topLevelKeys(block) {
  const keys = [];
  let depth = 0;
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    // Only capture keys at the object's top level (depth === 1).
    if (depth === 1 && /[A-Za-z]/.test(ch)) {
      // Walk back to confirm this char starts a property name (preceded by
      // whitespace, `{`, or `,` — not `.` or `:`).
      const prev = block[i - 1];
      if (prev === undefined || /[\s{,]/.test(prev)) {
        const keyMatch = block.slice(i).match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*:/);
        if (keyMatch) {
          keys.push(keyMatch[1]);
          i += keyMatch[0].length - 1;
        }
      }
    }
  }
  return keys;
}

function main() {
  const erasPath = resolve(ROOT, 'src/data/eras.ts');
  const src = readFileSync(erasPath, 'utf8');

  const eraBlocks = splitEraObjects(src);
  const foundYears = eraBlocks.map(extractYear);

  const errors = [];

  // --- Check 1: correct era years present in order -------------------------
  if (foundYears.length !== EXPECTED_ERAS.length) {
    errors.push(
      `Expected ${EXPECTED_ERAS.length} eras but found ${foundYears.length} ` +
        `(years: ${JSON.stringify(foundYears)}).`,
    );
  }
  for (let i = 0; i < EXPECTED_ERAS.length; i++) {
    if (foundYears[i] !== EXPECTED_ERAS[i]) {
      errors.push(
        `Era #${i + 1}: expected year ${EXPECTED_ERAS[i]} but found ${foundYears[i]}.`,
      );
    }
  }

  // --- Check 2: duplicates --------------------------------------------------
  const seen = new Set();
  for (const year of foundYears) {
    if (year !== null && seen.has(year)) {
      errors.push(`Duplicate era year: ${year}.`);
    }
    seen.add(year);
  }

  // --- Check 3: each era has all required categories -----------------------
  for (let i = 0; i < eraBlocks.length; i++) {
    const year = foundYears[i];
    const keys = new Set(topLevelKeys(eraBlocks[i]));
    const missing = REQUIRED_CATEGORIES.filter((c) => !keys.has(c));
    if (missing.length > 0) {
      errors.push(
        `Era ${year ?? `#${i + 1}`} is missing categories: ${missing.join(', ')}.`,
      );
    }
  }

  // --- Report ---------------------------------------------------------------
  if (errors.length > 0) {
    console.error('✗ check:eras FAILED — era data is incomplete or incorrect:\n');
    for (const e of errors) console.error(`  • ${e}`);
    console.error(
      `\nExpected ${EXPECTED_ERAS.length} eras × ${REQUIRED_CATEGORIES.length} categories.`,
    );
    process.exit(1);
  }

  const total = eraBlocks.length * REQUIRED_CATEGORIES.length;
  console.log(
    `✓ check:eras passed — ${eraBlocks.length} eras × ${REQUIRED_CATEGORIES.length} ` +
      `categories (${total} era/category pairs) all present.`,
  );
  console.log(`  Eras: ${EXPECTED_ERAS.join(', ')}`);
}

main();
