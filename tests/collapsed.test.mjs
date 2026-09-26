import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collapsed } from '../src/components/collapsed.js';

test('extends past a decoy word.tld dot to the real sentence end', () => {
  const prefix = 'Check out '.repeat(26); // exactly 260 chars, ends on a space
  const clean = prefix + 'finn.no for jobs. More text follows after the sentence end.';
  const preview = collapsed(clean);
  assert.ok(preview.endsWith('finn.no for jobs.'), `got: ${JSON.stringify(preview.slice(-40))}`);
  assert.ok(preview.length > 260);
});

test('does not return a lone high surrogate when the cut splits an emoji', () => {
  const clean = 'x' + '😀'.repeat(200); // odd offset forces a mid-emoji boundary at 260
  const preview = collapsed(clean);
  assert.ok(preview.length < clean.length, 'expected the emoji run to be truncated');
  assert.ok(!/[\uD800-\uDBFF]$/.test(preview), 'preview ends in a lone high surrogate');
});

test('returns a short string unchanged', () => {
  assert.equal(collapsed('hello world'), 'hello world');
});
