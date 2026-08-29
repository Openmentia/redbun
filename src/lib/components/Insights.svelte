<script>
  import { readAccount } from '$lib/insight.js';
  import { cn } from '$lib/utils.js';
  import Segmented from './ui/Segmented.svelte';
  import Stat from './ui/Stat.svelte';
  import Card from './ui/Card.svelte';

  let { posts = [], comments = [], meta = null, onPickSubreddit } = $props();

  let scope = $state('all');
  let section = $state('overview');

  const scoped = $derived({
    posts: scope === 'comments' ? [] : posts,
    comments: scope === 'posts' ? [] : comments
  });
  const r = $derived(readAccount(scoped.posts, scoped.comments, meta));

  const sections = [
    { value: 'overview', label: 'Overview' },
    { value: 'timing', label: 'Timing' },
    { value: 'communities', label: 'Communities' },
    { value: 'content', label: 'Content' },
    { value: 'language', label: 'Language' }
  ];

  function maxOf(rows) {
    return Math.max(1, ...rows.map((x) => x.value));
  }
</script>

{#if r}
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <Segmented bind:value={section} options={sections} size="sm" />
      <Segmented
        bind:value={scope}
        size="sm"
        options={[
          { value: 'all', label: 'All', count: r.counts.total },
          { value: 'posts', label: 'Posts', count: posts.length },
          { value: 'comments', label: 'Comments', count: comments.length }
        ]}
      />
    </div>

    {#if section === 'overview'}
      <ul class="space-y-1.5 text-sm leading-relaxed">
        {#each r.headline as line}
          <li class="flex gap-2">
            <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary"></span>{line}
          </li>
        {/each}
      </ul>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {#each r.overview as s}<Stat label={s.label} value={s.value} />{/each}
      </div>
    {:else if section === 'timing'}
      <p class="text-sm text-muted-foreground">{r.timing.note}</p>
      <div class="grid gap-3 md:grid-cols-2">
        <Card class="p-4">
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">By hour (UTC)</h4>
          <div class="flex h-28 items-end gap-1">
            {#each r.timing.hour as b}
              {@const m = maxOf(r.timing.hour)}
              <div class="group relative flex-1" title="{b.label}: {b.value}">
                <div class="w-full rounded-sm bg-primary/80 transition-all group-hover:bg-primary" style="height:{(b.value / m) * 100}%"></div>
              </div>
            {/each}
          </div>
          <div class="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>12a</span><span>12p</span><span>11p</span></div>
        </Card>
        <Card class="p-4">
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">By weekday (UTC)</h4>
          <div class="flex h-28 items-end gap-2">
            {#each r.timing.weekday as b}
              {@const m = maxOf(r.timing.weekday)}
              <div class="flex flex-1 flex-col items-center gap-1" title="{b.label}: {b.value}">
                <div class="w-full rounded-sm bg-primary/80" style="height:{(b.value / m) * 100}%"></div>
                <span class="text-[10px] text-muted-foreground">{b.label}</span>
              </div>
            {/each}
          </div>
        </Card>
      </div>
      {#if r.timing.month.length > 1}
        <Card class="p-4">
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">By month</h4>
          <div class="flex h-24 items-end gap-0.5 overflow-x-auto">
            {#each r.timing.month as b}
              {@const m = maxOf(r.timing.month)}
              <div class="w-2 shrink-0 rounded-sm bg-primary/70" style="height:{(b.value / m) * 100}%" title="{b.label}: {b.value}"></div>
            {/each}
          </div>
        </Card>
      {/if}
    {:else if section === 'communities'}
      <p class="text-sm text-muted-foreground">{r.communities.note}</p>
      <div class="space-y-1">
        {#each r.communities.subs.slice(0, 18) as s}
          {@const m = maxOf(r.communities.subs)}
          <button
            type="button"
            onclick={() => onPickSubreddit?.(s.label)}
            class="flex w-full items-center gap-3 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-accent"
          >
            <span class="w-36 shrink-0 truncate text-xs">r/{s.label}</span>
            <span class="h-3 flex-1 overflow-hidden rounded-sm bg-muted">
              <span class="block h-full bg-primary" style="width:{(s.value / m) * 100}%"></span>
            </span>
            <span class="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{s.value}</span>
            <span class="w-16 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">avg {s.avg}</span>
          </button>
        {/each}
      </div>
    {:else if section === 'content'}
      <p class="text-sm text-muted-foreground">{r.content.note}</p>
      <div class="grid gap-3 md:grid-cols-2">
        <Card class="p-4">
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Score distribution</h4>
          {#each r.content.buckets as b}
            {@const m = maxOf(r.content.buckets)}
            <div class="mb-1 flex items-center gap-3 text-xs">
              <span class="w-20 shrink-0 text-muted-foreground">{b.label}</span>
              <span class="h-3 flex-1 overflow-hidden rounded-sm bg-muted"><span class="block h-full bg-primary" style="width:{(b.value / m) * 100}%"></span></span>
              <span class="w-8 text-right tabular-nums text-muted-foreground">{b.value}</span>
            </div>
          {/each}
        </Card>
        <Card class="p-4">
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top linked domains</h4>
          {#if r.content.domains.length}
            {#each r.content.domains as d}
              {@const m = maxOf(r.content.domains)}
              <div class="mb-1 flex items-center gap-3 text-xs">
                <span class="w-32 shrink-0 truncate text-muted-foreground" title={d.label}>{d.label}</span>
                <span class="h-3 flex-1 overflow-hidden rounded-sm bg-muted"><span class="block h-full bg-primary" style="width:{(d.value / m) * 100}%"></span></span>
                <span class="w-8 text-right tabular-nums text-muted-foreground">{d.value}</span>
              </div>
            {/each}
          {:else}
            <p class="text-xs text-muted-foreground">No external links in this sample.</p>
          {/if}
        </Card>
      </div>
      <Card class="p-4">
        <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highest scoring</h4>
        <ul class="space-y-2">
          {#each r.content.highlights as h}
            <li class="flex items-baseline justify-between gap-3 border-b pb-2 text-sm last:border-0 last:pb-0">
              <a class="truncate hover:text-primary" href={h.href} target="_blank" rel="noreferrer">{h.text}</a>
              <span class="shrink-0 text-xs tabular-nums text-muted-foreground">{h.score} · r/{h.sub}</span>
            </li>
          {/each}
        </ul>
      </Card>
    {:else if section === 'language'}
      <div class="flex gap-2">
        <Stat class="flex-1" label="Avg length" value="{r.language.avgLen} ch" />
        <Stat class="flex-1" label="Ends on a question" value={r.language.questionRate} />
      </div>
      <div class="grid gap-3 md:grid-cols-2">
        <Card class="p-4">
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recurring words</h4>
          <div class="flex flex-wrap gap-1.5">
            {#each r.language.words as w}
              {@const m = maxOf(r.language.words)}
              <span
                class="rounded-md bg-muted px-2 py-0.5 text-xs"
                style="font-size:{0.7 + (w.value / m) * 0.6}rem"
                title="{w.value}x"
              >{w.label}</span>
            {/each}
          </div>
        </Card>
        <Card class="p-4">
          <h4 class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recurring phrases</h4>
          {#if r.language.phrases.length}
            {#each r.language.phrases as p}
              {@const m = maxOf(r.language.phrases)}
              <div class="mb-1 flex items-center gap-3 text-xs">
                <span class="w-40 shrink-0 truncate">{p.label}</span>
                <span class="h-3 flex-1 overflow-hidden rounded-sm bg-muted"><span class="block h-full bg-primary" style="width:{(p.value / m) * 100}%"></span></span>
                <span class="w-6 text-right tabular-nums text-muted-foreground">{p.value}</span>
              </div>
            {/each}
          {:else}
            <p class="text-xs text-muted-foreground">Not enough repeated phrases in this sample.</p>
          {/if}
        </Card>
      </div>
    {/if}
  </div>
{:else}
  <p class="py-10 text-center text-sm text-muted-foreground">Nothing to summarise yet.</p>
{/if}
