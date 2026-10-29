import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per article in src/content/articles/. The file name is the URL: hot-flashes.md -> /article/hot-flashes
const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    draft: z.boolean().default(false), // drafts are kept but not published
    topic: z.string().optional(), // symptoms | treatment | resources (see src/data/topics.json)
    author: z.string().optional(), // staff-editor | alison-armstrong (see src/data/authors.json)
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    trend: z.boolean().default(false),
    createdAt: z.coerce.date(), // drives "newest first" ordering
    updatedAt: z.coerce.date(), // shown on most article cards; bump it when you edit
    publishedAt: z.coerce.date().optional(),
    image: z.string().optional(),
    image2: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    color: z.string().optional(),
    descShort: z.string().default(''), // card teaser / hero subtitle
    descLong: z.string().default(''), // meta description
    summary: z.string().default(''), // "TLDR" box, Markdown
    webflowId: z.string().optional(), // tie-breaker for items imported in the same second
  }),
});

export const collections = { articles };
