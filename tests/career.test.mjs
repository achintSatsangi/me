import { test } from 'node:test';
import assert from 'node:assert/strict';
import { careerYears, careerYearsInWords } from '../src/lib/career.js';

test('career years tick over on 1 September', () => {
  assert.equal(careerYears(new Date('2026-08-31')), 18);
  assert.equal(careerYears(new Date('2026-09-01')), 19);
  assert.equal(careerYears(new Date('2027-08-31')), 19);
  assert.equal(careerYears(new Date('2027-09-01')), 20);
});

test('career years spelled out, capitalised', () => {
  assert.equal(careerYearsInWords(new Date('2026-10-21')), 'Nineteen');
  assert.equal(careerYearsInWords(new Date('2027-09-01')), 'Twenty');
  assert.equal(careerYearsInWords(new Date('2028-09-01')), 'Twenty-one');
});
