# themenopauseglow.com

The Menopause Glow, rebuilt from Webflow as a static [Astro](https://astro.build) site, hosted on Cloudflare Workers. Every push to `main` rebuilds and deploys.

The markup, styles, scripts and interactions are Webflow's own (exported from the live site), so pages look and behave exactly as they did. What changed is where the content lives: in files in this repo instead of Webflow's CMS.

## Where things live

| What | Where |
|---|---|
| Articles (published and drafts) | `src/content/articles/<slug>.md`, the file name is the URL: `hot-flashes.md` → `/article/hot-flashes` |
| Article fields (topic, tags, featured, dates…) | frontmatter at the top of each article, described in `src/content.config.ts` |
| Topics, authors, tags | `src/data/topics.json`, `authors.json`, `tags.json` |
| Which articles each list shows (latest, featured, trending, related, per topic/tag) | `src/lib/cms.ts` and the queries in each page's frontmatter |
| Page templates | `src/pages/` (home, articles index, topics, about, search, topic/tag/author/article pages) |
| Article cards used by the lists | `src/components/cards/` |
| Paginated pages (Articles index, tag pages) | `src/components/pages/ArticlesIndex.astro`, `TagPage.astro` |
| Webflow stylesheet, scripts, images, video | `public/css`, `public/js`, `public/images`, `public/video` |
| Pagination URLs (`?7a69ba69_page=N`, `?034f679d_page=N`) | `worker/index.js` |
| Redirects | `public/_redirects` |

## Writing an article

Copy an existing file in `src/content/articles/`, rename it to the URL slug you want, and edit the frontmatter and the Markdown body. Put its image in `public/images/` and set `image:` to `/images/<file>`. Set `draft: true` to keep it off the live site.

- `createdAt` decides "newest first" order in the lists.
- `updatedAt` is the date most cards display, and it drives the "related" picks; bump it when you make a real edit.
- `featured` / `trend` put it in the Featured and Trending lists.
- `descLong` is the meta description; `descShort` shows under the title on cards and the article hero.
- `summary` is the "TLDR" box at the top of the article.

Tables, embedded videos, quotes and a few unusual lists from Webflow are stored as HTML inside the Markdown so they render exactly as before; that's fine to leave as is.

## Search

`npm run build` runs Astro and then [Pagefind](https://pagefind.app), which indexes the article text into `dist/pagefind/`. The search page (`/search?query=…`) and the search box in the nav use that index in the browser.

## Commands

```
npm install
npm run dev      # local preview at http://localhost:4321 (no search index in dev)
npm run build    # site + search index into dist/
npx wrangler dev # run the built site with the Worker, the way Cloudflare serves it
```

## Analytics

Google Analytics (`G-DF6KERZJSP`) and the Google Search Console verification tag are in each page's `<head>`, as on Webflow.
