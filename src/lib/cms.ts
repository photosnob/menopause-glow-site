// Data layer for the site: loads articles, topics, authors and tags, and gives each
// page the same lists (filters, sort order, limits) the Webflow site used.
import { getCollection, type CollectionEntry } from 'astro:content';
import { marked } from 'marked';
import topicsData from '../data/topics.json';
import authorsData from '../data/authors.json';
import tagsData from '../data/tags.json';

export const PLACEHOLDER = '/images/placeholder.60f9b1840c.svg';
const TZ = 'Europe/Paris'; // the Webflow site's display timezone

type Topic = (typeof topicsData)[number];
type Author = (typeof authorsData)[number];
type Tag = (typeof tagsData)[number];

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, ...opts }).format(d);
const md = (d: Date) => fmt(d, { month: 'short', day: 'numeric' }); // "Jan 14"
const yy = (d: Date) => fmt(d, { year: '2-digit' }); // "26"

export const topics = topicsData;
export const authors = authorsData;
export const tags = tagsData;
export const topicBySlug = Object.fromEntries(topics.map((t) => [t.slug, t])) as Record<string, Topic>;
export const authorBySlug = Object.fromEntries(authors.map((a) => [a.slug, a])) as Record<string, Author>;
export const tagBySlug = Object.fromEntries(tags.map((t) => [t.slug, t])) as Record<string, Tag>;

export function topicView(t: Topic) {
  return { slug: t.slug, url: `/topic/${t.slug}`, name: t.name, descShort: t.descShort, desc: t.description, num: t.numberText, color: t.color, image: t.image };
}
export function authorView(u: Author) {
  return { slug: u.slug, url: `/author/${u.slug}`, name: u.name, role: u.role, descShort: u.descShort, descLong: u.descLong, photo: u.photo, topicImage: u.topicImage, bio: u.bio };
}
export function tagView(g: Tag) {
  return { slug: g.slug, url: `/tag/${g.slug}`, name: g.name };
}

export function articleView(e: CollectionEntry<'articles'>) {
  const x = e.data;
  const t = x.topic ? topicBySlug[x.topic] : undefined;
  const u = x.author ? authorBySlug[x.author] : undefined;
  return {
    entry: e,
    slug: e.id,
    url: `/article/${e.id}`,
    name: x.title,
    descShort: x.descShort,
    descLong: x.descLong,
    creMD: md(x.createdAt),
    creYY: yy(x.createdAt),
    updMD: md(x.updatedAt),
    updYY: yy(x.updatedAt),
    color: x.color ?? '',
    image: x.image ?? '',
    imagePH: x.image ?? PLACEHOLDER, // cards that show Webflow's placeholder when there's no image
    image2: x.image2 ?? '',
    image2PH: x.image2 ?? PLACEHOLDER,
    topicUrl: t ? `/topic/${t.slug}` : '#',
    topicName: t?.name ?? '',
    topicColor: t?.color ?? '',
    topicImage: t?.image ?? '',
    authorUrl: u ? `/author/${u.slug}` : '#',
    authorName: u?.name ?? '',
    authorRole: u?.role ?? '',
    authorPhoto: u?.photo ?? '',
    authorDescShort: u?.descShort ?? '',
    tags: x.tags.filter((s) => tagBySlug[s]).map((s) => tagView(tagBySlug[s])),
    summaryHtml: x.summary ? (marked.parse(x.summary) as string) : '',
    hasBody: !!e.body?.trim(),
    featured: x.featured,
    trend: x.trend,
    hasTopic: !!t,
    hasImage: !!x.image,
    hasDescShort: !!x.descShort.trim(),
    hasDescLong: !!x.descLong.trim(),
    hasColor: !!x.color,
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
    topic: x.topic,
    author: x.author,
    webflowId: x.webflowId ?? '',
  };
}
export type ArticleView = ReturnType<typeof articleView>;

// Items created/updated in the same second fall back to Webflow's item id (oldest first).
const tie = (a: ArticleView, b: ArticleView) => (a.webflowId < b.webflowId ? -1 : a.webflowId > b.webflowId ? 1 : 0);
export const newestCreated = (a: ArticleView, b: ArticleView) => b.createdAt.valueOf() - a.createdAt.valueOf() || tie(a, b);
export const newestUpdated = (a: ArticleView, b: ArticleView) => b.updatedAt.valueOf() - a.updatedAt.valueOf() || b.createdAt.valueOf() - a.createdAt.valueOf() || tie(a, b);

let cache: ArticleView[] | undefined;
/** All published articles, newest first. */
export async function allArticles(): Promise<ArticleView[]> {
  if (!cache) {
    const entries = await getCollection('articles', ({ data }) => !data.draft);
    cache = entries.map(articleView).sort(newestCreated);
  }
  return cache;
}

export const take = (list: ArticleView[], n: number) => list.slice(0, n);
export const featured = (l: ArticleView[]) => l.filter((a) => a.featured);
export const trending = (l: ArticleView[]) => l.filter((a) => a.trend);
export const inTopic = (l: ArticleView[], slug: string) => l.filter((a) => a.topic === slug);
export const withTag = (l: ArticleView[], slug: string) => l.filter((a) => a.tags.some((t) => t.slug === slug));
export const byAuthor = (l: ArticleView[], slug: string) => l.filter((a) => a.author === slug);

/** Topics in their "Sorting" order (Resources, Treatment, Symptoms). */
export const topicsSorted = () => [...topics].sort((a, b) => a.sorting - b.sorting).map(topicView);
/** Authors, newest first (Alison Armstrong, then The Glow Staff). */
export const authorsSorted = () => [...authors].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(authorView);

/** Markdown summary (used by the "TLDR" box). */
export const renderMarkdown = (s: string) => (s ? (marked.parse(s) as string) : '');

/** Is `href` the page being rendered? (Webflow's "current" link state.) */
export function isCurrent(href: string | undefined, pathname: string) {
  if (!href || href.startsWith('#') || /^https?:/.test(href)) return false;
  const clean = (p: string) => p.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';
  return clean(href.split('?')[0]) === clean(pathname);
}

/** Webflow pagination markup. Page N lives at `?<key>_page=N`; the Worker serves the matching static page. */
export function paginationHtml(o: { page: number; pages: number; key: string; wrapper: string; buttons: string; button: string; count: string; countFirst: boolean }) {
  const q = (n: number) => `?${o.key}_page=${n}`;
  const prev = '<svg class="w-pagination-previous-icon" height="12px" width="12px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" transform="translate(0, 1)"><path fill="none" stroke="currentColor" fill-rule="evenodd" d="M8 10L4 6l4-4"></path></svg>';
  const next = '<svg class="w-pagination-next-icon" height="12px" width="12px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" transform="translate(0, 1)"><path fill="none" stroke="currentColor" fill-rule="evenodd" d="M4 2l4 4-4 4"></path></svg>';
  const buttons =
    `<div class="${o.buttons}">` +
    (o.page > 1 ? `<a href="${q(o.page - 1)}" aria-label="Previous Page" class="w-pagination-previous ${o.button}">${prev}<div class="w-inline-block">Previous</div></a>` : '') +
    (o.page < o.pages ? `<a href="${q(o.page + 1)}" aria-label="Next Page" class="w-pagination-next ${o.button}"><div class="w-inline-block">Next</div>${next}</a><link rel="prerender" href="${q(o.page + 1)}"/>` : '') +
    `</div>`;
  const count = o.pages > 1 ? `<div aria-label="Page ${o.page} of ${o.pages}" role="heading" class="w-page-count ${o.count}">${o.page} / ${o.pages}</div>` : '';
  return `<div role="navigation" aria-label="List" class="w-pagination-wrapper ${o.wrapper}">${o.countFirst ? count + buttons : buttons + count}</div>`;
}
