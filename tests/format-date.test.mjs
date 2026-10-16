import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from '../src/lib/format-date.js';

test('a UTC-midnight date keeps its day in any timezone', () => {
  const previous = process.env.TZ;
  try {
    for (const tz of ['Pacific/Honolulu', 'UTC', 'Pacific/Auckland']) {
      process.env.TZ = tz;
      assert.equal(formatDate(new Date('2026-01-01')), '1 January 2026', tz);
      assert.equal(formatDate('2025-08-17'), '17 August 2025', tz);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('an empty value formats as an empty string', () => {
  assert.equal(formatDate(''), '');
});
