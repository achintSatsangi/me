// Export the latest N LinkedIn posts from social.sqlite to src/data/linkedin-posts.json.
// Source DB lives in ~/dev/ultra-personal/social-dump — private, not committed.
// Re-run this locally before shipping to refresh the feed.
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB = join(homedir(), 'dev/ultra-personal/social-dump/data/social.sqlite');
const OUT = join(__dirname, '..', 'src', 'data', 'linkedin-posts.json');
const LIMIT = 20;

const sql = `SELECT date, share_commentary, share_link FROM li_shares
             WHERE share_commentary IS NOT NULL AND share_commentary != ''
             ORDER BY date DESC LIMIT ${LIMIT};`;

// LinkedIn's data export wraps every line in CSV-style quotes:
//   "line one"
//   ""              ← blank line
//   "line two"
// Strip the wrapping per line and collapse standalone "" into empty lines.
function cleanCommentary(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => {
      let s = line.trimEnd();
      if (s === '""') return '';
      // Strip a leading `"` and trailing `"` regardless of pairing — the export wraps
      // every visual line with quotes, so any orphan at a line boundary is noise.
      if (s.startsWith('"')) s = s.slice(1);
      if (s.endsWith('"')) s = s.slice(0, -1);
      return s;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

try {
  const raw = execSync(`sqlite3 -json "${DB}" "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
  const rows = JSON.parse(raw || '[]');
  const posts = rows.map((r) => ({
    date: r.date,
    text: cleanCommentary(r.share_commentary),
    link: r.share_link,
  }));
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(posts, null, 2));
  console.log(`✓ Wrote ${posts.length} LinkedIn posts to ${OUT}`);
} catch (err) {
  if (existsSync(OUT)) {
    const existing = JSON.parse(readFileSync(OUT, 'utf8'));
    console.warn(`⚠ Could not export LinkedIn posts (${err.message}). Preserving existing ${existing.length} posts in ${OUT}.`);
  } else {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, '[]');
    console.warn(`⚠ Could not export LinkedIn posts (${err.message}). No existing file — wrote empty array.`);
  }
}
