import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readingMinutes } from '../src/lib/reading-time.js';

const words = (n) => Array(n).fill('word').join(' ');

test('an empty body still reads as one minute', () => {
  assert.equal(readingMinutes(''), 1);
});

test('rounds up at the 230 words per minute boundary', () => {
  assert.equal(readingMinutes(words(230)), 1);
  assert.equal(readingMinutes(words(231)), 2);
});

test('figure blocks and inline tags do not count as words', () => {
  const figure = `<figure class="chart">\n<p class="chart-title">${words(500)}</p>\n</figure>`;
  assert.equal(readingMinutes(`${words(100)}\n\n${figure}\n\n${words(100)}`), 1);
  assert.equal(readingMinutes('<picture class="x"><img src="a.svg" alt="b"></picture>'), 1);
});
