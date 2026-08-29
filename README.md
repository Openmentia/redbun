# redbun

A product by [Openmentia](https://github.com/Openmentia/). Source: [Openmentia/redbun](https://github.com/Openmentia/redbun).

Look up any Reddit account's archived trail. Every post and comment it ever
made, removed and deleted ones included, pulled the moment you ask and read back
as a summary.

```bash
npm install
npm run dev
```

## How it works

- **Two back-ends, one stream.** `src/lib/archive.js` queries two public Reddit
  archives in parallel straight from the browser (both send CORS headers, so
  there is no server hop and lookups feel instant), takes the union keyed by
  `id` so nothing shows twice, and sorts newest first. One delayed retry, only
  for transient failures. Full parameter set: subreddit, date range, keyword,
  NSFW, removed or deleted only. Cursor pagination on `created_utc`.
- **Shareable URLs.** Every click (tab, filter, insights view, the account name
  itself) is written into the query string, so any view can be linked,
  bookmarked and reopened exactly as it was. The account name is always the last
  parameter.
- **Interactive insights.** `src/lib/insight.js` reads whatever page is loaded
  and `Insights.svelte` pages through Overview, Timing, Communities, Content and
  Language sections, with an All / Posts / Comments scope toggle and clickable
  subreddit bars that push a filter into the feed. Synchronous, so it never
  delays results.
- **UI.** Local shadcn-style components in `src/lib/components/ui/` on Tailwind
  v4 tokens. Cards, buttons, inputs, badges, segmented controls.

Public archive content only. Keep request volume reasonable. Accounts listed in
`WITHHELD` (`src/lib/archive.js`, empty by default) resolve to no results with no
request sent.
