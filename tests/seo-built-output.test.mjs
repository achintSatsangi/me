import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import config from '../astro.config.mjs';

const root = config.outDir ?? './dist';
const pages = ['index.html', 'journey/index.html', 'feed/index.html', 'articles/index.html', 'privacy/index.html'];
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const metaContent = (html, attr, name) =>
  html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];

test('build output exists', () => {
  assert.ok(existsSync(join(root, 'index.html')), `no build at ${root} — run npm run build first`);
});

for (const page of pages) {
  test(`${page}: title, description, one h1, absolute canonical with trailing slash`, () => {
    const html = read(page);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.ok(metaContent(html, 'name', 'description')?.length > 50);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.ok(canonical?.startsWith(config.site) && canonical.endsWith('/'), `canonical: ${canonical}`);
    assert.equal(metaContent(html, 'property', 'og:url'), canonical);
  });

  test(`${page}: og:image is absolute and exists on disk`, () => {
    const image = metaContent(read(page), 'property', 'og:image');
    assert.ok(image?.startsWith(config.site));
    assert.ok(existsSync(join(root, 'og-default.png')));
    assert.equal(metaContent(read(page), 'name', 'twitter:card'), 'summary_large_image');
  });
}

test('descriptions are unique per page', () => {
  const descriptions = pages.map((p) => metaContent(read(p), 'name', 'description'));
  assert.equal(new Set(descriptions).size, pages.length);
});

test('favicon href resolves to a file in the build', () => {
  const href = read('index.html').match(/<link rel="icon"[^>]*href="([^"]+)"/)?.[1];
  assert.ok(href?.endsWith('/favicon.svg'), `favicon href: ${href}`);
  assert.ok(existsSync(join(root, 'favicon.svg')));
});

test('home carries Person JSON-LD tying the name to LinkedIn and GitHub', () => {
  const raw = read('index.html').match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1];
  const person = JSON.parse(raw)['@graph'].find((n) => n['@type'] === 'Person');
  assert.equal(person.name, 'Achint Satsangi');
  assert.ok(person.sameAs.some((u) => u.includes('linkedin.com/in/')));
  assert.ok(person.sameAs.some((u) => u.includes('github.com/')));
});

test('sitemap lists every page and robots.txt points at it', () => {
  assert.ok(existsSync(join(root, 'sitemap-index.xml')));
  const sitemap = read('sitemap-0.xml');
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, pages.length);
  assert.match(read('robots.txt'), /^Sitemap: https?:\/\/\S+\/sitemap-index\.xml$/m);
});

test('404 page is built', () => {
  assert.ok(existsSync(join(root, '404.html')));
});

test('EXPECT_INDEXABLE=1: no page carries noindex', { skip: !process.env.EXPECT_INDEXABLE }, () => {
  for (const page of [...pages, '404.html']) {
    assert.doesNotMatch(read(page), /<meta name="robots"[^>]*noindex/, page);
  }
});
