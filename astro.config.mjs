import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://achintsatsangi.github.io',
  base: '/me',
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  build: {
    format: 'directory',
  },
});
