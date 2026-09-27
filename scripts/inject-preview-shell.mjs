// PREVIEW GATE — copies the under-construction page to the public site root (and 404),
// so github.io/me/ shows the placeholder while the real site lives under the slug in
// astro.config.mjs. Remove this step from the build script at public launch.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shell = join(root, 'preview', 'under-construction.html');
const dist = join(root, 'dist');

if (!existsSync(shell)) {
  console.error('inject-preview-shell: missing preview/under-construction.html');
  process.exit(1);
}

mkdirSync(dist, { recursive: true });
for (const name of ['index.html', '404.html']) {
  copyFileSync(shell, join(dist, name));
  console.log(`inject-preview-shell: wrote dist/${name}`);
}
