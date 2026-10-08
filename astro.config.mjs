import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

const SITE_URL = 'https://achintsatsangi.github.io';

// PREVIEW GATE — at public launch, set base back to '/me', drop outDir, and remove
// the inject-preview-shell step from the build script. See LAUNCH-CHECKLIST.md.
const previewSlug = '20f3e6d7ccaf900775';

export default defineConfig({
  site: SITE_URL,
  base: `/me/${previewSlug}`,
  outDir: `./dist/${previewSlug}`,
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
  build: {
    format: 'directory',
  },
});
