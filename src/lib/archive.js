// Pulls a Reddit account's history from two public archive back-ends at once and
// folds the responses into one de-duplicated stream. Both endpoints send
// permissive CORS headers, so the calls go straight from the browser — no server
// hop, which is what keeps a lookup feeling instant.

const A = 'https://arctic-shift.photon-reddit.com';
const B = 'https://api.pullpush.io';
export const REDDIT = 'https://www.reddit.com';

const BATCH = 100;
const RETRY_PAUSE = 1400;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Accounts here resolve to an empty result with no request sent. Lowercase,
// bare name. Empty by default.
const WITHHELD = new Set([]);

export function isWithheld(name) {
  return WITHHELD.has(String(name || '').trim().toLowerCase());
}

// One shot plus a single delayed retry — but only for conditions that might
// clear on their own. A hard 4xx returns immediately so the caller moves on.
async function pull(url, allowRetry = true) {
  let transient = true;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (r.ok) {
      const body = await r.json();
      return { rows: body?.data ?? [], ok: true };
    }
    transient = r.status === 429 || r.status >= 500;
  } catch {
    /* network blip — worth another try */
  }
  if (allowRetry && transient) {
    await wait(RETRY_PAUSE);
    return pull(url, false);
  }
  return { rows: [], ok: false };
}

function endpoints(name, kind, cursor, filters) {
  const shared = [`limit=${BATCH}`, `sort=desc`, `author=${encodeURIComponent(name)}`];

  if (filters.subreddit) shared.push(`subreddit=${encodeURIComponent(filters.subreddit)}`);
  if (kind === 'posts' && filters.nsfw != null) shared.push(`over_18=${filters.nsfw}`);

  if (cursor.before) shared.push(`before=${cursor.before}`);
  else if (filters.to) shared.push(`before=${filters.to}`);
  if (cursor.after) shared.push(`after=${cursor.after}`);
  else if (filters.from) shared.push(`after=${filters.from}`);

  const q = shared.join('&');
  let aq = q;
  let bq = q;
  if (filters.term) {
    const t = encodeURIComponent(filters.term);
    aq += kind === 'posts' ? `&query=${t}` : `&body=${t}`;
    bq += `&q=${t}`;
  }

  const aPath = kind === 'posts' ? 'posts' : 'comments';
  const bPath = kind === 'posts' ? 'submission' : 'comment';
  return {
    a: `${A}/api/${aPath}/search?${aq}`,
    b: `${B}/reddit/search/${bPath}/?nc&${bq}`
  };
}

export function statusOf(item, kind) {
  const text = kind === 'posts' ? item.selftext : item.body;
  return {
    removed: text === '[removed]' || (kind === 'posts' && !!item.removed_by_category),
    deleted: text === '[deleted]' || item.author === '[deleted]'
  };
}

// Fire both back-ends together, keep the union keyed by id, newest first.
export async function gather(name, kind, cursor = {}, filters = {}) {
  const { a, b } = endpoints(name, kind, cursor, filters);
  const [ra, rb] = await Promise.all([pull(a), pull(b)]);

  const answered = (ra.ok && ra.rows.length ? 1 : 0) + (rb.ok && rb.rows.length ? 1 : 0);

  const byId = new Map();
  for (const row of [...ra.rows, ...rb.rows]) {
    if (row?.id && !byId.has(row.id)) byId.set(row.id, row);
  }
  let out = [...byId.values()];

  // The second back-end ignores over_18 server-side; trim it here (posts only).
  if (kind === 'posts' && filters.nsfw != null) {
    out = out.filter((p) => p.over_18 === filters.nsfw);
  }
  if (filters.strippedOnly) {
    out = out.filter((it) => {
      const s = statusOf(it, kind);
      return s.removed || s.deleted;
    });
  }

  out.sort((x, y) => y.created_utc - x.created_utc);

  return { rows: out, answered, degraded: !ra.ok && !filters.term };
}

// ── small enrichment calls used by individual cards ──────────────────────────

export async function fetchProfileMeta(name) {
  const { rows } = await pull(`${A}/api/users/search?author=${encodeURIComponent(name)}&limit=1`, false);
  return rows?.[0]?._meta ?? null;
}

export async function fetchThread(postId) {
  const { rows } = await pull(`${A}/api/comments/tree?link_id=t3_${postId}&limit=25`);
  const comments = [];
  let hidden = 0;
  for (const node of rows) {
    if (node.kind === 't1') comments.push(node.data);
    else if (node.kind === 'more') hidden += node.data?.count ?? 0;
  }
  return { comments, hidden };
}

export async function fetchPostById(id) {
  const { rows } = await pull(`${A}/api/posts/ids?ids=${id}`, false);
  return rows?.[0] ?? null;
}

export async function fetchCommentById(fullId) {
  const { rows } = await pull(`${A}/api/comments/ids?ids=${fullId}`, false);
  return rows?.[0] ?? null;
}
