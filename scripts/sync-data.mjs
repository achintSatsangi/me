// Run all data sync steps sequentially before build.
import { spawnSync } from 'node:child_process';

const scripts = ['export-linkedin.mjs', 'fetch-articles.mjs'];
for (const s of scripts) {
  const r = spawnSync('node', [`scripts/${s}`], { stdio: 'inherit' });
  if (r.status !== 0) console.warn(`⚠ ${s} exited non-zero (${r.status}) — continuing`);
}
