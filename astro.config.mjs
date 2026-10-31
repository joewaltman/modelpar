import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { site } from './src/config.ts';

export default defineConfig({
  site: site.url,
  trailingSlash: 'never',
  build: { format: 'file' },
  // Astro 7 defaults to 'jsx', which can drop spaces between inline elements.
  compressHTML: true,
  devToolbar: { enabled: false },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  vite: { plugins: [tailwindcss()] },
});
