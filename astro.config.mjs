import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { BASE } from './base.mjs';

const SITE_URL = 'https://achintsatsangi.github.io';

export default defineConfig({
  site: SITE_URL,
  base: BASE,
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({ lastmod: new Date() }),
  ],
  build: {
    format: 'directory',
  },
});
