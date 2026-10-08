// Fetch theprint.in author pages and merge into src/data/articles.json.
// ThePrint created two author accounts for the same person (one misspelled "Satasangi"), so both are read.
// theprint.in is behind Cloudflare — the RSS endpoint requires JS challenge,
// so we scrape the author page HTML with a UA that passes. On any failure
// we PRESERVE the existing JSON rather than overwriting with empty.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'data', 'articles.json');
const AUTHOR_PAGES = [
  'https://theprint.in/author/achint-satsangi/',
  'https://theprint.in/author/achint-satasangi/',
];

async function fetchAuthorPage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; achintsatsangi.github.io build)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (html.includes('Just a moment') || html.length < 5000) {
    throw new Error('Cloudflare challenge or empty response');
  }
  return parseArticles(html);
}

async function main() {
  const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
  const fetched = [];
  for (const url of AUTHOR_PAGES) {
    try {
      fetched.push(...(await fetchAuthorPage(url)));
    } catch (err) {
      console.warn(`⚠ theprint fetch failed for ${url} (${err.message}).`);
    }
  }
  const merged = [...existing];
  for (const f of fetched) {
    if (!merged.some((e) => e.link === f.link)) merged.push(f);
  }
  merged.sort((a, b) => b.date.localeCompare(a.date));
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(merged, null, 2));
  console.log(`✓ ${merged.length} articles in ${OUT} (${merged.length - existing.length} new from theprint)`);
}

function parseArticles(html) {
  const articles = [];
  const linkRe = /<h3 class="entry-title[^"]*">\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const dateRe = /<time[^>]*datetime="([^"]+)"/g;
  const links = [...html.matchAll(linkRe)];
  const dates = [...html.matchAll(dateRe)];
  for (let i = 0; i < links.length; i++) {
    articles.push({
      title: decodeHtml(links[i][2].trim()).replace(/^SubscriberWrites:\s*/i, '').replace(/^Subscriber Writes:\s*/i, ''),
      link: links[i][1],
      date: dates[i]?.[1]?.slice(0, 10) || '',
      excerpt: '',
    });
  }
  return articles;
}

function decodeHtml(s) {
  return s
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&').replace(/&amp;/g, '&');
}

main();
