<script>
  import { onMount } from 'svelte';
  import { cleanHandle } from '$lib/handle.js';
  import { gather, isWithheld, fetchProfileMeta } from '$lib/archive.js';
  import { getTheme, setTheme, apply } from '$lib/theme.js';
  import { readAccount } from '$lib/insight.js';
  import { layoutGraph } from '$lib/graph.js';
  import PostCard from '$lib/components/PostCard.svelte';
  import CommentCard from '$lib/components/CommentCard.svelte';
  import Insights from '$lib/components/Insights.svelte';
  import SubGraph from '$lib/components/SubGraph.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';
  import Segmented from '$lib/components/ui/Segmented.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte';
  import DropdownItem from '$lib/components/ui/DropdownItem.svelte';
  import {
    ArrowRight,
    SlidersHorizontal,
    Download,
    Link2,
    RotateCw,
    Sun,
    Moon,
    Monitor
  } from '@lucide/svelte';

  let ready = $state(false);
  let input = $state('');
  let handle = $state('');
  let searched = $state(false);
  let busy = $state(false);
  let degraded = $state(false);
  let tab = $state('posts');
  let view = $state('feed');
  let sortBy = $state('new');
  let theme = $state('system');
  let copied = $state(false);

  let meta = $state(null);
  let report = $state(null); // { all, posts, comments } computed once per dataset
  let graphLayout = $state(null);
  const blank = () => ({
    posts: { rows: [], page: 0, cursors: [] },
    comments: { rows: [], page: 0, cursors: [] }
  });
  let feeds = $state(blank());

  let fOpen = $state(false);
  let fSub = $state('');
  let fFrom = $state('');
  let fTo = $state('');
  let fTerm = $state('');
  let fNsfw = $state(false);
  let fStripped = $state(false);

  const current = $derived(feeds[tab]);
  const sortedRows = $derived(sortRows(current.rows, sortBy));

  function sortRows(rows, mode) {
    const copy = [...rows];
    if (mode === 'old') return copy.sort((a, b) => a.created_utc - b.created_utc);
    if (mode === 'top') return copy.sort((a, b) => (b.score || 0) - (a.score || 0));
    if (mode === 'discussed') return copy.sort((a, b) => (b.num_comments || 0) - (a.num_comments || 0));
    return copy.sort((a, b) => b.created_utc - a.created_utc);
  }

  function writeUrl() {
    if (!ready) return;
    const p = [];
    if (view !== 'feed') p.push(['view', view]);
    if (tab !== 'posts') p.push(['tab', tab]);
    if (sortBy !== 'new') p.push(['sort', sortBy]);
    if (fSub.trim()) p.push(['sub', fSub.trim()]);
    if (fTerm.trim()) p.push(['q', fTerm.trim()]);
    if (fFrom) p.push(['from', fFrom]);
    if (fTo) p.push(['to', fTo]);
    if (fNsfw) p.push(['nsfw', '1']);
    if (fStripped) p.push(['removed', '1']);
    if (handle) p.push(['u', handle]);
    const qs = p.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    history.replaceState({}, '', qs ? `/?${qs}` : '/');
  }

  $effect(() => {
    void [view, tab, sortBy, fSub, fTerm, fFrom, fTo, fNsfw, fStripped, handle, searched];
    writeUrl();
  });

  function readUrl() {
    const s = new URLSearchParams(location.search);
    view = ['insights', 'graph'].includes(s.get('view')) ? s.get('view') : 'feed';
    tab = s.get('tab') === 'comments' ? 'comments' : 'posts';
    sortBy = ['old', 'top', 'discussed'].includes(s.get('sort')) ? s.get('sort') : 'new';
    fSub = s.get('sub') ?? '';
    fTerm = s.get('q') ?? '';
    fFrom = s.get('from') ?? '';
    fTo = s.get('to') ?? '';
    fNsfw = s.get('nsfw') === '1';
    fStripped = s.get('removed') === '1';
    if (fSub || fTerm || fFrom || fTo || fNsfw || fStripped) fOpen = true;
    return cleanHandle(s.get('u'));
  }

  function buildFilters() {
    const f = {};
    if (fSub.trim()) f.subreddit = fSub.trim();
    if (fFrom) f.from = Math.floor(new Date(fFrom).getTime() / 1000);
    if (fTo) f.to = Math.floor(new Date(fTo).getTime() / 1000);
    if (fTerm.trim()) f.term = fTerm.trim();
    if (fNsfw) f.nsfw = true;
    if (fStripped) f.strippedOnly = true;
    return f;
  }

  async function loadKind(kind, cursor) {
    const res = await gather(handle, kind, cursor, buildFilters());
    if (res.degraded) degraded = true;
    return res;
  }

  function seed(res) {
    const cursors = res.rows.length
      ? [{ first: res.rows[0].created_utc, last: res.rows.at(-1).created_utc }]
      : [];
    return { rows: res.rows, page: res.rows.length ? 1 : 0, cursors };
  }

  async function run(name) {
    const h = cleanHandle(name);
    if (!h) return;
    handle = h;
    input = h;
    searched = true;
    busy = true;
    degraded = false;
    meta = null;
    feeds = blank();
    writeUrl();

    if (isWithheld(h)) {
      await new Promise((r) => setTimeout(r, 700));
      busy = false;
      return;
    }

    const [p, c, m] = await Promise.all([
      loadKind('posts', {}),
      loadKind('comments', {}),
      fetchProfileMeta(h)
    ]);
    meta = m;
    feeds = { posts: seed(p), comments: seed(c) };
    if (!p.rows.length && c.rows.length) tab = 'comments';
    recompute();
    busy = false;
  }

  // Heavy read + force layout: run once whenever the loaded rows change, never
  // on a tab or view click.
  function recompute() {
    const P = feeds.posts.rows;
    const C = feeds.comments.rows;
    if (!P.length && !C.length) {
      report = null;
      graphLayout = null;
      return;
    }
    report = {
      all: readAccount(P, C, meta),
      posts: readAccount(P, [], meta),
      comments: readAccount([], C, meta)
    };
    graphLayout = report.all ? layoutGraph({ ...report.all.graph, user: handle }) : null;
  }

  async function page(dir) {
    if (busy) return;
    const f = feeds[tab];
    if (dir > 0) {
      const tail = f.cursors.at(-1);
      if (!tail) return;
      busy = true;
      const res = await loadKind(tab, { before: tail.last });
      if (res.rows.length) {
        feeds[tab] = {
          rows: res.rows,
          page: f.page + 1,
          cursors: [...f.cursors, { first: res.rows[0].created_utc, last: res.rows.at(-1).created_utc }]
        };
      }
      recompute();
      busy = false;
    } else {
      if (f.cursors.length <= 1) return;
      const stack = f.cursors.slice(0, -1);
      const prev = stack.at(-2);
      busy = true;
      const res = await loadKind(tab, prev ? { after: prev.first } : {});
      feeds[tab] = { rows: res.rows, page: f.page - 1, cursors: stack };
      recompute();
      busy = false;
    }
    window.scrollTo({ top: 0 });
  }

  async function applyFilters() {
    if (handle) await run(handle);
  }
  function clearFilters() {
    fSub = fFrom = fTo = fTerm = '';
    fNsfw = fStripped = false;
    if (handle) run(handle);
  }
  function pickSubreddit(name) {
    fSub = name;
    fOpen = true;
    view = 'feed';
    if (handle) run(handle);
  }

  function reset() {
    searched = false;
    handle = input = '';
    meta = null;
    report = null;
    graphLayout = null;
    feeds = blank();
    fOpen = false;
    fSub = fFrom = fTo = fTerm = '';
    fNsfw = fStripped = false;
    view = 'feed';
    tab = 'posts';
    sortBy = 'new';
    history.replaceState({}, '', '/');
  }

  function changeTheme(mode) {
    theme = mode;
    setTheme(mode);
  }

  function exportJson() {
    const rows = sortedRows;
    const blob = new Blob([JSON.stringify({ user: handle, tab, count: rows.length, rows }, null, 2)], {
      type: 'application/json'
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `redbun-${handle}-${tab}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      copied = true;
      setTimeout(() => (copied = false), 1200);
    } catch {
      /* ignore */
    }
  }

  onMount(() => {
    theme = getTheme();
    apply(theme);
    const u = readUrl();
    ready = true;
    if (u) run(u);
    else writeUrl();

    const onKey = (e) => {
      if (e.key === '/' && !searched && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        document.querySelector('input')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const tabOptions = $derived([
    {
      value: 'posts',
      label: 'Posts',
      count: feeds.posts.rows.length ? `${feeds.posts.rows.length}${feeds.posts.page > 1 ? '+' : ''}` : null
    },
    {
      value: 'comments',
      label: 'Comments',
      count: feeds.comments.rows.length
        ? `${feeds.comments.rows.length}${feeds.comments.page > 1 ? '+' : ''}`
        : null
    },
    { value: 'graph', label: 'Graph' },
    { value: 'insights', label: 'Insights' }
  ]);
  let nav = $derived(view === 'feed' ? tab : view);
  function setNav(v) {
    if (v === 'insights' || v === 'graph') view = v;
    else {
      view = 'feed';
      tab = v;
    }
  }

  const sortOptions = [
    { value: 'new', label: 'New' },
    { value: 'old', label: 'Old' },
    { value: 'top', label: 'Top' },
    { value: 'discussed', label: 'Discussed' }
  ];
</script>

<header class="sticky top-0 z-20 border-b bg-background">
  <div class="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
    <button class="flex items-center gap-2.5" onclick={reset}>
      <img src="/icon.svg" alt="" width="30" height="30" class="h-[30px] w-[30px] rounded-full" />
      <span class="text-lg font-semibold tracking-tight">redbun</span>
    </button>
    <div class="flex items-center gap-3 text-xs text-muted-foreground">
      <a class="hidden hover:text-foreground sm:inline" href="https://github.com/Openmentia/" target="_blank" rel="noreferrer">
        A product by <span class="font-medium text-foreground">Openmentia</span>
      </a>
      <DropdownMenu triggerClass="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent">
        {#snippet trigger()}
          {#if theme === 'light'}<Sun class="h-4 w-4" />
          {:else if theme === 'dark'}<Moon class="h-4 w-4" />
          {:else}<Monitor class="h-4 w-4" />{/if}
        {/snippet}
        {#snippet children({ close })}
          <DropdownItem active={theme === 'system'} onSelect={() => { changeTheme('system'); close(); }}>
            <Monitor class="h-3.5 w-3.5" /> System
          </DropdownItem>
          <DropdownItem active={theme === 'light'} onSelect={() => { changeTheme('light'); close(); }}>
            <Sun class="h-3.5 w-3.5" /> Light
          </DropdownItem>
          <DropdownItem active={theme === 'dark'} onSelect={() => { changeTheme('dark'); close(); }}>
            <Moon class="h-3.5 w-3.5" /> Dark
          </DropdownItem>
        {/snippet}
      </DropdownMenu>
      <a class="hover:text-foreground" href="https://github.com/Openmentia/redbun" target="_blank" rel="noreferrer" aria-label="Source on GitHub">
        <svg viewBox="0 0 16 16" class="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg>
      </a>
    </div>
  </div>
</header>

{#if !searched}
  <section class="mx-auto max-w-2xl px-5 pt-[12vh]">
    <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Reddit account lookup</p>
    <h1 class="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
      Every archived post and comment a Reddit account ever made.
    </h1>
    <p class="mt-3 max-w-lg text-muted-foreground">
      Removed and deleted items included. Pulled the moment you ask, from public archives,
      and read back as a summary.
    </p>
    <form class="mt-7 flex gap-2" onsubmit={(e) => { e.preventDefault(); run(input); }}>
      <Input placeholder="username, @handle, or profile URL  ( / to focus )" bind:value={input} class="h-11 flex-1 text-base" autofocus />
      <Button type="submit" size="lg" class="gap-1.5">Look up <ArrowRight class="h-4 w-4" /></Button>
    </form>
  </section>
{:else}
  <main class="mx-auto max-w-3xl px-5 py-6">
    <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="text-lg font-semibold">
        <a href="https://www.reddit.com/user/{handle}" target="_blank" rel="noreferrer" class="hover:text-primary">u/{handle}</a>
      </h2>
      {#if meta}
        <div class="flex gap-4 text-xs text-muted-foreground">
          <span><span class="font-medium text-foreground">{meta.num_posts?.toLocaleString() ?? '0'}</span> posts</span>
          <span><span class="font-medium text-foreground">{meta.num_comments?.toLocaleString() ?? '0'}</span> comments</span>
          {#if meta.total_karma != null}
            <span><span class="font-medium text-foreground">{meta.total_karma.toLocaleString()}</span> karma</span>
          {/if}
        </div>
      {/if}
    </div>

    {#if degraded}
      <p class="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
        A back-end is slow right now, results may be partial. Retrying usually helps.
      </p>
    {/if}

    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <Segmented value={nav} options={tabOptions} onChange={setNav} />
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="sm" class="gap-1.5 text-muted-foreground" onclick={() => (fOpen = !fOpen)}>
          <SlidersHorizontal class="h-3.5 w-3.5" /> Filters
        </Button>
        <Button variant="ghost" size="icon" class="text-muted-foreground" onclick={copyLink} aria-label="Copy link" title={copied ? 'Copied' : 'Copy shareable link'}>
          <Link2 class="h-4 w-4" />
        </Button>
        {#if view === 'feed' && current.rows.length}
          <Button variant="ghost" size="icon" class="text-muted-foreground" onclick={exportJson} aria-label="Export JSON" title="Export this tab as JSON">
            <Download class="h-4 w-4" />
          </Button>
        {/if}
        <Button variant="ghost" size="icon" class="text-muted-foreground" onclick={() => run(handle)} aria-label="Refresh" title="Re-run lookup">
          <RotateCw class="h-4 w-4" />
        </Button>
      </div>
    </div>

    {#if view === 'feed' && current.rows.length}
      <div class="mb-4">
        <Segmented bind:value={sortBy} options={sortOptions} size="sm" />
      </div>
    {/if}

    {#if fOpen}
      <div class="mb-4 grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
        <label class="text-xs font-medium text-muted-foreground">Subreddit
          <Input bind:value={fSub} placeholder="askreddit" class="mt-1" />
        </label>
        <label class="text-xs font-medium text-muted-foreground">Keyword
          <Input bind:value={fTerm} placeholder="term" class="mt-1" />
        </label>
        <label class="text-xs font-medium text-muted-foreground">From
          <Input type="date" bind:value={fFrom} class="mt-1" />
        </label>
        <label class="text-xs font-medium text-muted-foreground">To
          <Input type="date" bind:value={fTo} class="mt-1" />
        </label>
        <Checkbox bind:checked={fNsfw}>NSFW only</Checkbox>
        <Checkbox bind:checked={fStripped}>Removed or deleted only</Checkbox>
        <div class="flex gap-2 sm:col-span-2">
          <Button size="sm" onclick={applyFilters}>Apply</Button>
          <Button size="sm" variant="outline" onclick={clearFilters}>Clear</Button>
        </div>
      </div>
    {/if}

    {#if busy}
      <div class="flex flex-col items-center gap-3 py-20 text-sm text-muted-foreground">
        <Spinner size={32} />
        Pulling u/{handle}
      </div>
    {:else if view === 'graph'}
      {#if graphLayout}
        <SubGraph layout={graphLayout} onPick={(n) => n.kind !== 'domain' && pickSubreddit(n.id)} />
      {:else}
        <p class="py-16 text-center text-sm text-muted-foreground">Not enough activity to map.</p>
      {/if}
    {:else if view === 'insights'}
      <Insights reports={report} {meta} user={handle} onPickSubreddit={pickSubreddit} />
    {:else if !current.rows.length}
      <div class="py-16 text-center text-muted-foreground">
        <p class="text-sm">No {tab} found for u/{handle}.</p>
        <p class="mt-1 text-xs">Not indexed yet, filtered out, or withheld at the account holder's request.</p>
        <Button variant="link" class="mt-2" onclick={() => (tab = tab === 'posts' ? 'comments' : 'posts')}>
          Try {tab === 'posts' ? 'comments' : 'posts'}
        </Button>
      </div>
    {:else}
      <div class="grid gap-2.5">
        {#each sortedRows as row (row.id)}
          {#if tab === 'posts'}<PostCard post={row} />{:else}<CommentCard comment={row} />{/if}
        {/each}
      </div>
      <div class="mt-5 flex items-center justify-center gap-4 text-xs font-medium">
        <Button variant="outline" size="sm" onclick={() => page(-1)} disabled={current.cursors.length <= 1}>Newer</Button>
        <span class="tabular-nums text-muted-foreground">page {current.page}</span>
        <Button variant="outline" size="sm" onclick={() => page(1)} disabled={current.rows.length < 100}>Older</Button>
      </div>
    {/if}
  </main>
{/if}
