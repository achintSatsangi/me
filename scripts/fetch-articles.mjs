// Fetch theprint.in author page and refresh src/data/articles.json.
// theprint.in is behind Cloudflare — the RSS endpoint requires JS challenge,
// so we scrape the author page HTML with a UA that passes. On any failure
// we PRESERVE the existing JSON rather than overwriting with empty.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'data', 'articles.json');
const URL = 'https://theprint.in/author/achint-satsangi/';

async function main() {
  try {
    const res = await fetch(URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; achintsatsangi.github.io build)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (html.includes('Just a moment') || html.length < 5000) {
      throw new Error('Cloudflare challenge or empty response');
    }
    const fetched = parseArticles(html);
    if (fetched.length === 0) throw new Error('No articles parsed');
    const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : [];
    const merged = fetched.map((f) => {
      const prior = existing.find((e) => e.link === f.link);
      return { ...f, excerpt: prior?.excerpt || f.excerpt || '' };
    });
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, JSON.stringify(merged, null, 2));
    console.log(`✓ Wrote ${merged.length} theprint articles to ${OUT} (excerpts preserved from prior file)`);
  } catch (err) {
    if (existsSync(OUT)) {
      const existing = JSON.parse(readFileSync(OUT, 'utf8'));
      console.warn(`⚠ theprint fetch failed (${err.message}). Preserving existing ${existing.length} articles in ${OUT}.`);
    } else {
      mkdirSync(dirname(OUT), { recursive: true });
      writeFileSync(OUT, '[]');
      console.warn(`⚠ theprint fetch failed (${err.message}). No existing file — wrote empty array.`);
    }
  }
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
