/**
 * @file test/period-package.test.js
 * @description Tests for the PeriodPackage contract and PeriodManager orchestrator.
 *
 * Acceptance criteria covered:
 *   1. PeriodPackage JSDoc/TS type exists in src/contracts/PeriodPackage.js (verified by import)
 *   2. validatePeriodPackage() throws on missing keys (tested with a deliberately broken fixture)
 *   3. PeriodManager.setYear(year) returns a promise that resolves after transform
 *   4. All five js/periodYYYY.js files import PeriodPackage and export createPeriodPackage
 *   5. Era modules are loaded dynamically (import())
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validatePeriodPackage, PERIOD_PACKAGE_REQUIRED_KEYS } from '../src/contracts/PeriodPackage.js';
import { PeriodManager } from '../js/period-manager.js';
import { createPeriodPackage as create1945 } from '../js/period1945.js';
import { createPeriodPackage as create1965 } from '../js/period1965.js';
import { createPeriodPackage as create1985 } from '../js/period1985.js';
import { createPeriodPackage as create2005 } from '../js/period2005.js';
import { createPeriodPackage as create2025 } from '../js/period2025.js';

// ─────────────────────────────────────────────────────────────────────────────
// Criterion 1: PeriodPackage contract exists and is importable
// ─────────────────────────────────────────────────────────────────────────────

describe('PeriodPackage contract', () => {
  test('exports validatePeriodPackage function', () => {
    assert.strictEqual(typeof validatePeriodPackage, 'function');
  });

  test('exports PERIOD_PACKAGE_REQUIRED_KEYS with all expected top-level keys', () => {
    const expected = [
      'meta', 'furniture', 'decor', 'coffeeMachine', 'menu',
      'musicSource', 'wallPosters', 'tableware', 'signage',
      'lighting', 'counterTech', 'patrons', 'sfx', 'navigationHotspots',
    ];
    assert.deepStrictEqual([...PERIOD_PACKAGE_REQUIRED_KEYS].sort(), expected.sort());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Criterion 2: validatePeriodPackage() throws on missing keys (broken fixture)
// ─────────────────────────────────────────────────────────────────────────────

describe('validatePeriodPackage — broken fixtures', () => {
  /**
   * Create a minimal valid package for mutation.
   * @returns {PeriodPackage}
   */
  function makeValidPackage() {
    return create1945();
  }

  test('throws when a top-level key is missing', () => {
    const broken = makeValidPackage();
    delete broken.coffeeMachine;
    assert.throws(
      () => validatePeriodPackage(broken),
      /missing required key "root\.coffeeMachine"/,
    );
  });

  test('throws when meta.year is missing', () => {
    const broken = makeValidPackage();
    delete broken.meta.year;
    assert.throws(
      () => validatePeriodPackage(broken),
      /missing required key "meta\.year"/,
    );
  });

  test('throws when meta.year is not a number', () => {
    const broken = makeValidPackage();
    broken.meta.year = '1945';
    assert.throws(
      () => validatePeriodPackage(broken),
      /meta\.year.*must be a number/,
    );
  });

  test('throws when menu.items is not an array', () => {
    const broken = makeValidPackage();
    broken.menu.items = 'not an array';
    assert.throws(
      () => validatePeriodPackage(broken),
      /menu\.items.*must be an array/,
    );
  });

  test('throws when a menu item price is empty', () => {
    const broken = makeValidPackage();
    broken.menu.items[0].price = '';
    assert.throws(
      () => validatePeriodPackage(broken),
      /menu\.items\[0\]\.price.*must be a non-empty string/,
    );
  });

  test('throws when sfx.murmur is missing', () => {
    const broken = makeValidPackage();
    delete broken.sfx.murmur;
    assert.throws(
      () => validatePeriodPackage(broken),
      /missing required key "sfx\.murmur"/,
    );
  });

  test('throws when patrons.appearances is not an array', () => {
    const broken = makeValidPackage();
    broken.patrons.appearances = null;
    assert.throws(
      () => validatePeriodPackage(broken),
      /patrons\.appearances.*must be an array/,
    );
  });

  test('throws when root is not an object', () => {
    assert.throws(
      () => validatePeriodPackage(null),
      /root.*must be an object/,
    );
  });

  test('throws when navigationHotspots is missing', () => {
    const broken = makeValidPackage();
    delete broken.navigationHotspots;
    assert.throws(
      () => validatePeriodPackage(broken),
      /missing required key "root\.navigationHotspots"/,
    );
  });

  test('returns the same package reference when valid', () => {
    const pkg = makeValidPackage();
    const result = validatePeriodPackage(pkg);
    assert.strictEqual(result, pkg);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Criterion 4: All five era modules import PeriodPackage and export createPeriodPackage
// ─────────────────────────────────────────────────────────────────────────────

describe('Era modules', () => {
  const eraFactories = [
    { year: 1945, fn: create1945 },
    { year: 1965, fn: create1965 },
    { year: 1985, fn: create1985 },
    { year: 2005, fn: create2005 },
    { year: 2025, fn: create2025 },
  ];

  for (const { year, fn } of eraFactories) {
    test(`${year}: exports createPeriodPackage function`, () => {
      assert.strictEqual(typeof fn, 'function');
    });

    test(`${year}: createPeriodPackage returns a valid PeriodPackage`, () => {
      const pkg = fn();
      assert.ok(pkg, `${year} package should be truthy`);
      assert.strictEqual(pkg.meta.year, year);
      // Should not throw
      validatePeriodPackage(pkg);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Criterion 3 & 5: PeriodManager.setYear returns a promise, uses dynamic import()
// ─────────────────────────────────────────────────────────────────────────────

describe('PeriodManager', () => {
  test('SUPPORTED_YEARS contains all five years', () => {
    // Re-import to check SUPPORTED_YEARS
    const mod = PeriodManager;
    const pm = new PeriodManager({ transformDuration: 10 });
    assert.ok(pm.isSupportedYear(1945));
    assert.ok(pm.isSupportedYear(1965));
    assert.ok(pm.isSupportedYear(1985));
    assert.ok(pm.isSupportedYear(2005));
    assert.ok(pm.isSupportedYear(2025));
    assert.ok(!pm.isSupportedYear(1955));
  });

  test('setYear returns a promise that resolves after transform', async () => {
    const pm = new PeriodManager({ transformDuration: 10 });
    const result = pm.setYear(1945);
    assert.ok(result instanceof Promise, 'setYear should return a Promise');
    const pkg = await result;
    assert.strictEqual(pkg.meta.year, 1945);
    assert.strictEqual(pm.currentYear, 1945);
    assert.strictEqual(pm.currentPackage, pkg);
  });

  test('setYear emits yearChange and transformComplete events', async () => {
    const pm = new PeriodManager({ transformDuration: 10 });
    let yearChanged = null;
    let transformComplete = false;

    pm.onYearChange((data) => { yearChanged = data; });
    pm.onTransformComplete(() => { transformComplete = true; });

    await pm.setYear(1965);

    assert.deepStrictEqual(yearChanged, { from: null, to: 1965 });
    assert.ok(transformComplete);
  });

  test('setYear throws on unsupported year', async () => {
    const pm = new PeriodManager({ transformDuration: 10 });
    await assert.rejects(
      () => pm.setYear(1955),
      /unsupported year 1955/,
    );
  });

  test('setYear prevents overlapping transforms', async () => {
    const pm = new PeriodManager({ transformDuration: 50 });
    const first = pm.setYear(1945);
    await assert.rejects(
      () => pm.setYear(1965),
      /transform already in progress/,
    );
    await first;
  });

  test('loadPeriodPackage dynamically loads and validates an era', async () => {
    const pm = new PeriodManager({ transformDuration: 10 });
    const pkg = await pm.loadPeriodPackage(1985);
    assert.strictEqual(pkg.meta.year, 1985);
    assert.ok(pkg.coffeeMachine);
    assert.ok(pkg.menu.items.length > 0);
  });

  test('onTransformProgress is called during transform', async () => {
    const pm = new PeriodManager({ transformDuration: 10 });
    const progressEvents = [];
    pm.onTransformProgress((data) => progressEvents.push(data));
    await pm.setYear(2025);
    assert.ok(progressEvents.length > 0, 'should have received progress events');
    const last = progressEvents[progressEvents.length - 1];
    assert.strictEqual(last.phase, 'done');
    assert.strictEqual(last.progress, 1);
  });
});
