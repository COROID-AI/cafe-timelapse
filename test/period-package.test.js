import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// We need to import the contract module without a DOM.
// The PeriodPackage module is pure JS (no Three.js dependency at import time).
// PeriodManager imports the contract, so it can be imported in Node too.
import {
  SUPPORTED_YEARS,
  validatePeriodPackage,
} from '../src/contracts/PeriodPackage.js';
import * as PeriodManager from '../js/period-manager.js';

import period1945 from '../js/period1945.js';
import period1965 from '../js/period1965.js';
import period1985 from '../js/period1985.js';
import period2005 from '../js/period2005.js';
import period2025 from '../js/period2025.js';

const ALL_PACKS = { 1945: period1945, 1965: period1965, 1985: period1985, 2005: period2005, 2025: period2025 };

describe('SUPPORTED_YEARS', () => {
  it('has exactly 5 stops: 1945, 1965, 1985, 2005, 2025', () => {
    assert.deepEqual([...SUPPORTED_YEARS], [1945, 1965, 1985, 2005, 2025]);
    assert.equal(SUPPORTED_YEARS.length, 5);
  });

  it('is frozen', () => {
    assert.ok(Object.isFrozen(SUPPORTED_YEARS));
  });
});

describe('validatePeriodPackage', () => {
  it('accepts a valid package', () => {
    const result = validatePeriodPackage({
      year: 1945,
      name: 'Test Era',
      palette: '#aabbcc',
    });
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it('rejects non-objects', () => {
    const result = validatePeriodPackage(null);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it('rejects unsupported years', () => {
    const result = validatePeriodPackage({
      year: 1955,
      name: 'Bad Year',
      palette: '#aabbcc',
    });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('1955')));
  });

  it('rejects bad palette format', () => {
    const result = validatePeriodPackage({
      year: 1945,
      name: 'Test',
      palette: 'red',
    });
    assert.equal(result.valid, false);
  });

  it('rejects empty name', () => {
    const result = validatePeriodPackage({
      year: 1945,
      name: '',
      palette: '#aabbcc',
    });
    assert.equal(result.valid, false);
  });
});

describe('Era pack stubs', () => {
  for (const [yearStr, pkg] of Object.entries(ALL_PACKS)) {
    const year = Number(yearStr);
    it(`${year} pack validates against contract`, () => {
      const result = validatePeriodPackage(pkg);
      assert.equal(result.valid, true, `Errors: ${result.errors.join('; ')}`);
    });

    it(`${year} pack has correct year`, () => {
      assert.equal(pkg.year, year);
    });

    it(`${year} pack has a non-empty name`, () => {
      assert.ok(typeof pkg.name === 'string' && pkg.name.length > 0);
    });

    it(`${year} pack has valid palette hex`, () => {
      assert.match(pkg.palette, /^#[0-9a-fA-F]{6}$/);
    });

    it(`${year} pack has build and dispose functions`, () => {
      assert.equal(typeof pkg.build, 'function');
      assert.equal(typeof pkg.dispose, 'function');
    });

    it(`${year} pack has lighting config`, () => {
      assert.ok(pkg.lighting, 'Missing lighting config');
      assert.ok(typeof pkg.lighting === 'object');
    });

    it(`${year} pack has audio config`, () => {
      assert.ok(pkg.audio, 'Missing audio config');
      assert.ok(typeof pkg.audio === 'object');
    });
  }
});

describe('PeriodManager', () => {
  beforeEach(() => {
    PeriodManager._reset();
  });

  afterEach(() => {
    PeriodManager._reset();
  });

  it('register accepts valid packs', () => {
    assert.doesNotThrow(() => PeriodManager.register(1945, period1945));
    assert.doesNotThrow(() => PeriodManager.register(2025, period2025));
  });

  it('register rejects unsupported years', () => {
    assert.throws(() =>
      PeriodManager.register(1955, { year: 1955, name: 'X', palette: '#000000' }),
    );
  });

  it('register rejects invalid packages', () => {
    assert.throws(() =>
      PeriodManager.register(1945, { year: 1945, name: '', palette: '#000000' }),
    );
  });

  it('register rejects year mismatch', () => {
    assert.throws(() =>
      PeriodManager.register(1945, { year: 1965, name: 'X', palette: '#000000' }),
    );
  });

  it('setYear returns false for unsupported years', () => {
    assert.equal(PeriodManager.setYear(1955), false);
  });

  it('setYear returns true for registered years', () => {
    PeriodManager.register(1945, period1945);
    assert.equal(PeriodManager.setYear(1945), true);
    assert.equal(PeriodManager.getYear(), 1945);
  });

  it('setYear is a no-op when already on that year', () => {
    PeriodManager.register(1945, period1945);
    PeriodManager.setYear(1945);
    assert.equal(PeriodManager.setYear(1945), true);
  });

  it('fires yearchange event on switch', () => {
    PeriodManager.register(1945, period1945);
    PeriodManager.register(1965, period1965);

    let event = null;
    PeriodManager.on('yearchange', (data) => {
      event = data;
    });

    PeriodManager.setYear(1945);
    event = null; // Reset after initial set
    PeriodManager.setYear(1965);

    assert.ok(event);
    assert.equal(event.year, 1965);
    assert.equal(event.previousYear, 1945);
    assert.ok(event.package);
    assert.equal(event.package.year, 1965);
  });

  it('getRegisteredYears returns sorted list', () => {
    PeriodManager.register(2025, period2025);
    PeriodManager.register(1945, period1945);
    PeriodManager.register(1985, period1985);

    const years = PeriodManager.getRegisteredYears();
    assert.deepEqual(years, [1945, 1985, 2025]);
  });

  it('getCurrentPackage returns the active package', () => {
    PeriodManager.register(1945, period1945);
    PeriodManager.setYear(1945);

    const pkg = PeriodManager.getCurrentPackage();
    assert.ok(pkg);
    assert.equal(pkg.year, 1945);
  });

  it('getCurrentPackage returns null when no year set', () => {
    assert.equal(PeriodManager.getCurrentPackage(), null);
  });

  it('on returns an unsubscribe function', () => {
    const unsub = PeriodManager.on('yearchange', () => {});
    assert.equal(typeof unsub, 'function');
  });

  it('all 5 era packs can be registered together', () => {
    assert.doesNotThrow(() => {
      PeriodManager.register(1945, period1945);
      PeriodManager.register(1965, period1965);
      PeriodManager.register(1985, period1985);
      PeriodManager.register(2005, period2005);
      PeriodManager.register(2025, period2025);
    });
    assert.equal(PeriodManager.getRegisteredYears().length, 5);
  });
});
