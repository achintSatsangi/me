import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// PREVIEW GATE — at public launch, set base back to '/me', drop outDir, and remove
// the inject-preview-shell step from the build script. See preview/under-construction.html.
const previewSlug = '20f3e6d7ccaf900775';

export default defineConfig({
  site: 'https://achintsatsangi.github.io',
  base: `/me/${previewSlug}`,
  outDir: `./dist/${previewSlug}`,
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  build: {
    format: 'directory',
  },
});
