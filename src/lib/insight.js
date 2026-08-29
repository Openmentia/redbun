// Reads a loaded sample of an account's posts and comments and returns a set of
// conclusions about it, grouped into sections the Insights panel can page
// through. Pure and synchronous, so it never holds up the results.

import { statusOf } from './archive.js';

const STOP = new Set(
  `the a an and or but if then so of to in on at by for with from as into about over under is are was were be been being have has had do does did will would can could may might must just not no nor more most other some such only own same too very i you he she it we they me my your our their this that these those im dont its got get like one there here what when where who how why gt amp really actually even also because thing things people know think want going make said say says now new time year day good bad`.split(
    /\s+/
  )
);

const HOURS = Array.from({ length: 24 }, (_, i) => `${((i + 11) % 12) + 1}${i < 12 ? 'a' : 'p'}`);
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const roll = (list, pick) => {
  const m = new Map();
  for (const x of list) {
    const k = pick(x);
    if (k == null || k === '') continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
};
const top = (map, n) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));

function humanGap(s) {
  if (!s) return 'n/a';
  if (s < 3600) return `${Math.round(s / 60)} min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} hr`;
  return `${(s / 86400).toFixed(1)} days`;
}
const iso = (s) => (s ? new Date(s * 1000).toISOString().slice(0, 10) : 'n/a');
const big = (n) => {
  if (n == null) return 'n/a';
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
};

export function readAccount(posts = [], comments = [], meta = null) {
  const P = posts.map((x) => ({ ...x, _kind: 'posts' }));
  const C = comments.map((x) => ({ ...x, _kind: 'comments' }));
  const all = [...P, ...C];
  if (!all.length) return null;

  const times = all.map((x) => x.created_utc).filter(Boolean).sort((a, b) => a - b);
  const first = times[0];
  const last = times[times.length - 1];
  const spanDays = Math.max(1, (last - first) / 86400);
  const accountAgeDays = (Date.now() / 1000 - first) / 86400;

  // timing
  const hours = new Array(24).fill(0);
  const weekdays = new Array(7).fill(0);
  const months = new Map();
  const dayset = new Set();
  for (const t of times) {
    const d = new Date(t * 1000);
    hours[d.getUTCHours()]++;
    weekdays[d.getUTCDay()]++;
    const mk = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    months.set(mk, (months.get(mk) || 0) + 1);
    dayset.add(d.toISOString().slice(0, 10));
  }
  let windowAt = 0;
  let windowSum = -1;
  for (let s = 0; s < 24; s++) {
    let sum = 0;
    for (let k = 0; k < 6; k++) sum += hours[(s + k) % 24];
    if (sum > windowSum) {
      windowSum = sum;
      windowAt = s;
    }
  }
  const busiestHour = hours.indexOf(Math.max(...hours));
  const busiestDay = weekdays.indexOf(Math.max(...weekdays));
  const monthList = [...months.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const peakMonth = [...months.entries()].sort((a, b) => b[1] - a[1])[0];
  // longest consecutive-day run within the sample
  const sortedDays = [...dayset].sort();
  let streak = 1;
  let bestStreak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const gap = (Date.parse(sortedDays[i]) - Date.parse(sortedDays[i - 1])) / 86400000;
    if (gap === 1) bestStreak = Math.max(bestStreak, ++streak);
    else streak = 1;
  }
  const gaps = [];
  for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
  gaps.sort((a, b) => a - b);
  const medGap = gaps[Math.floor(gaps.length / 2)] || 0;

  // communities
  const subMap = roll(all, (x) => x.subreddit);
  const subScores = new Map();
  for (const x of all) {
    if (!subScores.has(x.subreddit)) subScores.set(x.subreddit, []);
    subScores.get(x.subreddit).push(x.score || 0);
  }
  const subs = top(subMap, 40).map((s) => ({
    ...s,
    avg: Math.round(
      (subScores.get(s.label) || [0]).reduce((a, b) => a + b, 0) / (subScores.get(s.label).length || 1)
    )
  }));

  // content
  const stripped = all.filter((x) => {
    const st = statusOf(x, x._kind);
    return st.removed || st.deleted;
  }).length;
  const nsfw = all.filter((x) => x.over_18).length;
  const edited = all.filter((x) => x.edited).length;
  const selfPosts = P.filter((x) => x.is_self).length;
  const domains = roll(
    P.filter((x) => !x.is_self && x.domain),
    (x) => x.domain
  );
  const scores = all.map((x) => x.score || 0).sort((a, b) => a - b);
  const scoreBuckets = [
    ['<= 0', (s) => s <= 0],
    ['1 to 9', (s) => s >= 1 && s < 10],
    ['10 to 99', (s) => s >= 10 && s < 100],
    ['100 to 999', (s) => s >= 100 && s < 1000],
    ['1000+', (s) => s >= 1000]
  ].map(([label, fn]) => ({ label, value: all.filter((x) => fn(x.score || 0)).length }));
  const highlights = [...all]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 6)
    .map((x) => ({
      text: (x.title || x.body || '(no text)').slice(0, 120),
      score: x.score || 0,
      sub: x.subreddit,
      kind: x._kind,
      href: x.permalink ? `https://www.reddit.com${x.permalink}` : ''
    }));

  // language
  const words = new Map();
  const bigrams = new Map();
  let charTotal = 0;
  let questions = 0;
  for (const x of all) {
    const raw = `${x.title || ''} ${x._kind === 'posts' ? x.selftext || '' : x.body || ''}`.trim();
    charTotal += raw.length;
    if (/\?\s*$/.test(raw)) questions++;
    const toks = raw
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[^a-z0-9'\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && w.length <= 20 && !STOP.has(w) && !/^\d+$/.test(w));
    for (let i = 0; i < toks.length; i++) {
      words.set(toks[i], (words.get(toks[i]) || 0) + 1);
      if (i < toks.length - 1) {
        const g = `${toks[i]} ${toks[i + 1]}`;
        bigrams.set(g, (bigrams.get(g) || 0) + 1);
      }
    }
  }

  const pctOf = (n) => `${Math.round((n / all.length) * 100)}%`;

  const headline = [];
  if (subs[0]) {
    headline.push(
      `Concentrated in r/${subs[0].label}: ${pctOf(subs[0].value)} of sampled activity, spread across ${subMap.size} subreddits.`
    );
  }
  headline.push(
    `About ${Math.round((windowSum / all.length) * 100)}% of activity lands between ${HOURS[windowAt]} and ${HOURS[(windowAt + 6) % 24]} UTC, peaking around ${HOURS[busiestHour]} on ${DOW[busiestDay]}.`
  );
  headline.push(
    `Roughly one item every ${humanGap(medGap)} across the window (${iso(first)} to ${iso(last)}); longest daily run in the sample was ${bestStreak} days.`
  );
  if (stripped) headline.push(`${pctOf(stripped)} of sampled items were later removed or deleted.`);
  if (meta?.total_karma != null) {
    headline.push(
      `Lifetime on record: ${big(meta.num_posts)} posts, ${big(meta.num_comments)} comments, ${big(meta.total_karma)} karma, active since ${iso(Math.min(meta.earliest_post_at || Infinity, meta.earliest_comment_at || Infinity))}.`
    );
  }

  return {
    counts: { total: all.length, posts: P.length, comments: C.length },
    headline,
    overview: [
      { label: 'Sampled', value: all.length },
      { label: 'Posts / comments', value: `${P.length} / ${C.length}` },
      { label: 'Subreddits', value: subMap.size },
      { label: 'Per day', value: (all.length / spanDays).toFixed(1) },
      { label: 'Median score', value: scores[Math.floor(scores.length / 2)] || 0 },
      { label: 'Removed', value: pctOf(stripped) },
      { label: 'NSFW', value: pctOf(nsfw) },
      { label: 'Edited', value: pctOf(edited) },
      { label: 'Account age', value: `${(accountAgeDays / 365).toFixed(1)} yr` },
      { label: 'Typical gap', value: humanGap(medGap) },
      { label: 'Longest streak', value: `${bestStreak} d` },
      {
        label: 'Peak month',
        value: peakMonth ? `${MONTH[+peakMonth[0].slice(5, 7) - 1]} ${peakMonth[0].slice(0, 4)}` : 'n/a'
      }
    ],
    timing: {
      hour: hours.map((v, i) => ({ label: HOURS[i], value: v })),
      weekday: weekdays.map((v, i) => ({ label: DOW[i], value: v })),
      month: monthList.map(([k, v]) => ({ label: `${k.slice(2)}`, value: v })),
      note: `Busiest hour ${HOURS[busiestHour]} UTC, busiest day ${DOW[busiestDay]}. Active window ${HOURS[windowAt]} to ${HOURS[(windowAt + 6) % 24]} UTC.`
    },
    communities: {
      subs,
      note: `${subMap.size} subreddits in the sample. Click a bar to filter results to that subreddit.`
    },
    content: {
      buckets: scoreBuckets,
      domains: top(domains, 10),
      highlights,
      note: `${P.length ? Math.round((selfPosts / P.length) * 100) : 0}% of posts are self / text. ${pctOf(questions)} of items end on a question.`
    },
    language: {
      words: top(words, 16),
      phrases: top(new Map([...bigrams].filter(([, v]) => v > 1)), 12),
      avgLen: Math.round(charTotal / all.length),
      questionRate: pctOf(questions)
    }
  };
}
