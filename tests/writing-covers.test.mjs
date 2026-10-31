import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import config from '../astro.config.mjs';
import { BASE } from '../base.mjs';

const root = config.outDir ?? './dist';
const list = readFileSync(join(root, 'writing/index.html'), 'utf8');
const engineering = list.slice(list.indexOf('id="panel-engineering"'), list.indexOf('id="panel-theprint"'));
const items = engineering.split('<article').slice(1);
const essays = readdirSync('src/content/writing')
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ id: f.replace(/\.md$/, ''), ...(() => { const fm = readFileSync(join('src/content/writing', f), 'utf8'); return { cover: fm.match(/^cover: (.+)$/m)?.[1], coverDark: fm.match(/^coverDark: (.+)$/m)?.[1] }; })() }));
const itemFor = (id) => items.find((html) => html.includes(`href="${BASE}/writing/${id}/"`));

test('every essay appears once in the Engineering list', () => {
  assert.equal(items.length, essays.length);
  for (const { id } of essays) assert.ok(itemFor(id), id);
});

for (const { id, cover, coverDark } of essays.filter((e) => e.cover)) {
  test(`${id}: cover srcs sit under the base path, exist in the build, and have size and empty alt`, () => {
    const imgs = itemFor(id).match(/<img [^>]*>/g) ?? [];
    const expected = [cover, coverDark].filter(Boolean);
    assert.equal(imgs.length, expected.length);
    imgs.forEach((img, i) => {
      assert.equal(img.match(/ src="([^"]+)"/)?.[1], `${BASE}/${expected[i]}`);
      assert.ok(existsSync(join(root, expected[i])));
      assert.match(img, / width="960"/);
      assert.match(img, / height="640"/);
      assert.match(img, / alt=""/);
      assert.match(img, / loading="lazy"/);
    });
    if (coverDark) {
      assert.match(imgs[0], /chart-light/);
      assert.match(imgs[1], /chart-dark/);
    } else {
      assert.doesNotMatch(imgs[0], /chart-(light|dark)/);
    }
  });
}

for (const { id } of essays.filter((e) => !e.cover)) {
  test(`${id}: without a cover the entry has no img and no grid wrapper`, () => {
    const html = itemFor(id);
    assert.doesNotMatch(html, /<img /);
    assert.doesNotMatch(html, /md:grid/);
  });
}

test('the ThePrint list carries no cover images', () => {
  assert.doesNotMatch(list.slice(list.indexOf('id="panel-theprint"')), /data-testid="essay-cover"/);
});
