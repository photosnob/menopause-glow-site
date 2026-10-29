import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.themenopauseglow.com',
  trailingSlash: 'never',
  build: { format: 'file' }, // /about -> about.html, matching Webflow's URLs (no trailing slash)
  compressHTML: false,
  // Plain Markdown, no GitHub extensions or smart quotes: Webflow kept quotes and bare URLs as typed.
  // Tables, figures and blockquotes in articles are stored as HTML inside the Markdown.
  markdown: { smartypants: false, gfm: false },
  // Paginated pages are served at Webflow's ?..._page=N URLs, not their internal /page/N paths, so they stay out of the sitemap.
  integrations: [sitemap({ filter: (page) => !/\/page\/\d+$/.test(page) && !/\/404$/.test(page) })],
});
