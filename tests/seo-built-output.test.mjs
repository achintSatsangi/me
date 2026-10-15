import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import config from '../astro.config.mjs';

const root = config.outDir ?? './dist';
const essaySlugs = readdirSync('src/content/writing').filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
const staticPages = ['index.html', 'journey/index.html', 'feed/index.html', 'writing/index.html', 'privacy/index.html'];
const pages = [...staticPages, ...essaySlugs.map((slug) => `writing/${slug}/index.html`)];
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

test('Person carries image and knowsAbout; home has a ProfilePage whose mainEntity is the Person', () => {
  const raw = read('index.html').match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1];
  const graph = JSON.parse(raw)['@graph'];
  const person = graph.find((n) => n['@type'] === 'Person');
  assert.ok(person.image?.startsWith(config.site));
  assert.ok(person.knowsAbout.length > 0);
  const profile = graph.find((n) => n['@type'] === 'ProfilePage');
  assert.equal(profile.mainEntity['@id'], person['@id']);
  for (const page of pages.filter((p) => p !== 'index.html')) assert.doesNotMatch(read(page), /ProfilePage/, page);
});

test('feed dates are server-rendered in time elements', () => {
  assert.match(read('feed/index.html'), /<time datetime="\d{4}-\d{2}-\d{2}T/);
});

test('sitemap lists every page and robots.txt points at it', () => {
  assert.ok(existsSync(join(root, 'sitemap-index.xml')));
  const sitemap = read('sitemap-0.xml');
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, pages.length);
  assert.equal((sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}/g) ?? []).length, pages.length);
  assert.match(read('robots.txt'), /^Sitemap: https?:\/\/\S+\/sitemap-index\.xml$/m);
});

test('every page advertises the RSS feed and the feed carries every post in full', () => {
  for (const page of pages) assert.match(read(page), /<link rel="alternate" type="application\/rss\+xml"[^>]*href="\/me\/rss\.xml"/, page);
  const xml = read('rss.xml');
  const posts = JSON.parse(readFileSync('src/data/linkedin-posts.json', 'utf8'));
  assert.equal((xml.match(/<item>/g) ?? []).length, posts.length + essaySlugs.length);
  assert.match(xml, /<link>https:\/\/[^<]+\/me\/<\/link>/);
});

test('excluded posts are in neither the data, the feed page nor the RSS feed', () => {
  const excluded = JSON.parse(readFileSync('scripts/excluded-posts.json', 'utf8'));
  assert.ok(excluded.length > 0);
  const posts = JSON.parse(readFileSync('src/data/linkedin-posts.json', 'utf8'));
  for (const link of excluded) {
    assert.ok(!posts.some((p) => p.link === link), link);
    assert.ok(!read('rss.xml').includes(link), link);
    assert.ok(!read('feed/index.html').includes(link), link);
  }
});

test('home page carries the Search Console verification tag', () => {
  const config = readFileSync('src/config.ts', 'utf8');
  const token = config.match(/GOOGLE_SITE_VERIFICATION = '([^']+)'/)?.[1];
  assert.ok(token);
  assert.ok(read('index.html').includes(`<meta name="google-site-verification" content="${token}"`));
});

test('writing index has both lists in the static HTML', () => {
  const html = read('writing/index.html');
  assert.match(html, /data-testid="panel-engineering"/);
  assert.match(html, /data-testid="panel-theprint"/);
  assert.equal((html.match(/data-testid="essay-item"/g) ?? []).length, essaySlugs.length);
  const articles = JSON.parse(readFileSync('src/data/articles.json', 'utf8'));
  assert.equal((html.match(/data-testid="(articles-featured|article-item)"/g) ?? []).length, articles.length);
});

test('every essay has BlogPosting JSON-LD authored by the Person, and is in the sitemap and RSS', () => {
  assert.ok(essaySlugs.length > 0);
  const personId = `${config.site}${config.base}/#person`;
  for (const slug of essaySlugs) {
    const html = read(`writing/${slug}/index.html`);
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(ld['@type'], 'BlogPosting');
    assert.equal(ld.author['@id'], personId);
    assert.ok(ld.headline && ld.description && ld.datePublished && ld.dateModified && ld.mainEntityOfPage);
    const url = `${config.site}${config.base}/writing/${slug}/`;
    assert.ok(read('sitemap-0.xml').includes(`<loc>${url}</loc>`), url);
    assert.ok(read('rss.xml').includes(url), url);
  }
});

test('essay images have alt text', () => {
  for (const slug of essaySlugs) {
    const imgs = read(`writing/${slug}/index.html`).match(/<img\b[^>]*>/g) ?? [];
    for (const img of imgs) assert.match(img, /\balt="[^"]+"/, img);
  }
});

test('/articles/ is a redirect page to /writing/ and stays out of the sitemap', () => {
  const html = read('articles/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/[^"]+\/me\/writing\/">/);
  assert.match(html, /<meta http-equiv="refresh" content="0; url=\/me\/writing\/[^"]*">/);
  assert.ok(!read('sitemap-0.xml').includes('/articles/'));
});

test('home title carries the name and the role', () => {
  assert.match(read('index.html'), /<title>Achint Satsangi - Senior Software Engineer, Oslo<\/title>/);
});

test('404 page is built', () => {
  assert.ok(existsSync(join(root, '404.html')));
});

test('EXPECT_INDEXABLE=1: no page carries noindex', { skip: !process.env.EXPECT_INDEXABLE }, () => {
  for (const page of [...pages, '404.html']) {
    assert.doesNotMatch(read(page), /<meta name="robots"[^>]*noindex/, page);
  }
});
