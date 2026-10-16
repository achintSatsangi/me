import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import config from '../astro.config.mjs';

const html = readFileSync(join(config.outDir ?? './dist', 'index.html'), 'utf8');
const hasBar = html.includes('id="consent-bar"');
const skip = hasBar ? false : 'no GA measurement id in this build, so no consent bar';

test('consent bar is a hidden-by-default non-modal region, not a dialog', { skip }, () => {
  assert.doesNotMatch(html, /<dialog/);
  assert.match(html, /<section[^>]*id="consent-bar"[^>]*aria-label="Analytics consent"[^>]*hidden/);
  assert.doesNotMatch(html, /showModal|backdrop:/);
});

test('consent bar is fixed to the bottom and safe-area aware', { skip }, () => {
  const tag = html.match(/<section[^>]*id="consent-bar"[^>]*>/)[0];
  assert.match(tag, /\bfixed\b/);
  assert.match(tag, /bottom-0/);
  assert.match(tag, /safe-area-inset-bottom/);
});

test('both choices are present with 44px minimum tap targets', { skip }, () => {
  const buttons = html.match(/<button[^>]*data-consent="(?:granted|denied)"[^>]*>/g) ?? [];
  assert.equal(buttons.length, 2);
  for (const b of buttons) assert.match(b, /min-h-11/);
});

test('analytics script is not injected before consent', { skip }, () => {
  assert.doesNotMatch(html, /<script[^>]+src="[^"]*googletagmanager/);
});
