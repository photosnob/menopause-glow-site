// Cloudflare Worker for themenopauseglow.com. The site is static (dist/); this only handles
// Webflow's pagination URLs, which carry the page number in the query string:
//   /articles-1?7a69ba69_page=3   -> serves the static page built at /articles-1/page/3
//   /tag/hot-flashes?034f679d_page=2 -> serves /tag/hot-flashes/page/2
// The internal /page/N paths redirect to the public query-string URLs, so each page has one address.
const PAGINATION = [
  { path: /^\/articles-1$/, key: '7a69ba69_page' },
  { path: /^\/tag\/[^/]+$/, key: '034f679d_page' },
];
const INTERNAL = /^(\/articles-1|\/tag\/[^/]+)\/page\/(\d+)$/;
const KEYS = { '/articles-1': '7a69ba69_page' };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const internal = url.pathname.match(INTERNAL);
    if (internal) {
      const base = internal[1];
      const key = KEYS[base] ?? '034f679d_page';
      return Response.redirect(new URL(`${base}?${key}=${internal[2]}`, url.origin), 301);
    }
    for (const p of PAGINATION) {
      if (!p.path.test(url.pathname)) continue;
      const n = Number(url.searchParams.get(p.key));
      if (Number.isInteger(n) && n > 1) {
        const target = new URL(`${url.pathname}/page/${n}`, url.origin);
        const res = await env.ASSETS.fetch(new Request(target, request));
        if (res.status !== 404) return res;
        return env.ASSETS.fetch(new Request(new URL('/404', url.origin), request)).then((r) => new Response(r.body, { status: 404, headers: r.headers }));
      }
    }
    return env.ASSETS.fetch(request);
  },
};
