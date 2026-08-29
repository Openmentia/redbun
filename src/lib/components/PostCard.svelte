<script>
  import { REDDIT, statusOf, fetchThread } from '$lib/archive.js';
  import { ago, stamp, compact, thumbOf } from '$lib/format.js';
  import { cn } from '$lib/utils.js';
  import Badges from './Badges.svelte';
  import CommentCard from './CommentCard.svelte';
  import { ArrowUp, MessageSquare, ExternalLink, ChevronDown } from '@lucide/svelte';

  let { post, embedded = false } = $props();

  let bodyOpen = $state(false);
  let thread = $state(null);
  let threadOpen = $state(false);
  let loadingThread = $state(false);

  const st = $derived(statusOf(post, 'posts'));
  const thumb = $derived(thumbOf(post));
  const hasBody = $derived(!!post.selftext && post.selftext !== '[deleted]' && post.selftext !== '[removed]');
  const link = $derived(`${REDDIT}${post.permalink || `/r/${post.subreddit}/comments/${post.id}/`}`);

  async function toggleThread() {
    if (loadingThread) return;
    if (thread) {
      threadOpen = !threadOpen;
      return;
    }
    loadingThread = true;
    thread = await fetchThread(post.id);
    threadOpen = true;
    loadingThread = false;
  }
</script>

<article
  class={cn(
    'overflow-hidden rounded-xl border bg-card shadow-sm transition-colors',
    embedded && 'bg-muted/40',
    st.removed && 'border-l-2 border-l-primary',
    st.deleted && 'border-l-2 border-l-amber-500'
  )}
>
  <div class="flex">
    <div class="flex flex-col items-center gap-0.5 bg-muted/60 px-3 py-3 text-xs font-semibold">
      <ArrowUp class="h-3.5 w-3.5 text-muted-foreground" />
      {compact(post.score)}
    </div>
    <div class="min-w-0 flex-1 p-3.5">
      <div class="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        <span class="font-medium text-foreground">{post.subreddit_name_prefixed || 'r/' + post.subreddit}</span>
        <span>·</span>
        <span title={stamp(post.created_utc)}>{ago(post.created_utc)}</span>
        <Badges item={post} kind="posts" />
        {#if post.link_flair_text}
          <span class="rounded-full bg-muted px-2 py-0.5 text-[10px]">{post.link_flair_text}</span>
        {/if}
      </div>
      <p class="mb-2 text-sm font-semibold leading-snug">{post.title}</p>
      <div class="flex flex-wrap items-center gap-4 text-[11px] font-medium text-muted-foreground">
        {#if !embedded}
          <button class="inline-flex items-center gap-1 hover:text-primary" onclick={toggleThread} disabled={loadingThread}>
            <MessageSquare class="h-3.5 w-3.5" />
            {loadingThread ? 'loading' : threadOpen ? 'hide' : 'show'} {compact(post.num_comments)}
          </button>
        {/if}
        <a class="inline-flex items-center gap-1 hover:text-primary" href={link} target="_blank" rel="noreferrer">
          <ExternalLink class="h-3.5 w-3.5" /> open
        </a>
        {#if post.domain && !post.is_self}<span class="text-teal-700">{post.domain}</span>{/if}
        {#if hasBody}
          <button class="inline-flex items-center gap-1 hover:text-primary" onclick={() => (bodyOpen = !bodyOpen)}>
            <ChevronDown class={cn('h-3.5 w-3.5 transition-transform', bodyOpen && 'rotate-180')} />
            body
          </button>
        {/if}
      </div>
    </div>
    {#if thumb}
      <a class="m-3 h-16 w-20 shrink-0 overflow-hidden rounded-md border bg-muted" href={thumb} target="_blank" rel="noreferrer">
        <img src={thumb} alt="" loading="lazy" class="h-full w-full object-cover" onerror={(e) => (e.currentTarget.style.display = 'none')} />
      </a>
    {/if}
  </div>

  {#if hasBody && bodyOpen}
    <div class="whitespace-pre-wrap break-words border-t px-4 py-3 pl-14 text-[13px] leading-relaxed">{post.selftext}</div>
  {/if}

  {#if threadOpen && thread}
    <div class="space-y-2 border-t bg-muted/30 p-2.5">
      {#if !thread.comments.length}
        <p class="px-1 text-[11px] italic text-muted-foreground">No archived comments.</p>
      {:else}
        <p class="px-1 text-[11px] text-muted-foreground">
          {thread.comments.length} loaded{thread.hidden ? `, +${thread.hidden} not shown` : ''}
        </p>
        {#each thread.comments as c (c.id)}<CommentCard comment={c} nested />{/each}
      {/if}
    </div>
  {/if}
</article>
