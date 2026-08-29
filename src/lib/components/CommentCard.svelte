<script>
  import { REDDIT, statusOf, fetchPostById } from '$lib/archive.js';
  import { ago, stamp, compact } from '$lib/format.js';
  import { cn } from '$lib/utils.js';
  import Badges from './Badges.svelte';
  import ParentComment from './ParentComment.svelte';
  import PostCard from './PostCard.svelte';
  import { ArrowUp, ExternalLink } from '@lucide/svelte';

  let { comment, nested = false } = $props();

  let collapsed = $state(false);
  let parentPost = $state(null);
  let showContext = $state(false);

  const st = $derived(statusOf(comment, 'comments'));
  const threadId = $derived(comment.link_id?.replace(/^t3_/, ''));
  const url = $derived(`${REDDIT}${comment.permalink || ''}`);

  async function loadContext() {
    showContext = true;
    if (!parentPost && threadId) parentPost = await fetchPostById(threadId);
  }
</script>

<article
  class={cn(
    'overflow-hidden rounded-xl border bg-card shadow-sm',
    nested && 'bg-muted/40',
    st.removed && 'border-l-2 border-l-primary',
    st.deleted && 'border-l-2 border-l-amber-500'
  )}
>
  {#if showContext && parentPost}
    <div class="border-b"><PostCard post={parentPost} embedded /></div>
  {/if}
  {#if showContext && comment.parent_id?.startsWith?.('t1_')}
    <ParentComment parentId={comment.parent_id} />
  {/if}

  <div class="flex">
    <button class="w-3.5 shrink-0 border-r bg-muted/60 transition-colors hover:bg-muted" aria-label="collapse" onclick={() => (collapsed = !collapsed)}></button>
    <div class="flex flex-col items-center gap-0.5 bg-muted/60 px-3 py-3 text-xs font-semibold">
      <ArrowUp class="h-3.5 w-3.5 text-muted-foreground" />
      {compact(comment.score)}
    </div>
    <div class="min-w-0 flex-1 p-3.5">
      <div class="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        <a class="font-medium text-foreground hover:text-primary" href={`${REDDIT}/r/${comment.subreddit}`} target="_blank" rel="noreferrer">
          {comment.subreddit_name_prefixed || 'r/' + comment.subreddit}
        </a>
        <span>by</span>
        <a class="hover:text-primary" href={`${REDDIT}/u/${comment.author}`} target="_blank" rel="noreferrer">u/{comment.author}</a>
        <span>·</span>
        <span title={stamp(comment.created_utc)}>{ago(comment.created_utc)}</span>
        <Badges item={comment} kind="comments" />
        <span>·</span>
        <a class="inline-flex items-center gap-1 hover:text-primary" href={url} target="_blank" rel="noreferrer">
          <ExternalLink class="h-3.5 w-3.5" /> context
        </a>
        {#if !nested}
          <button class="font-medium hover:text-primary" onclick={loadContext}>load context</button>
        {/if}
      </div>
      {#if !collapsed}
        {#if st.removed || st.deleted}
          <p class="text-[13px] italic text-muted-foreground">
            {st.removed ? 'Removed by a moderator, no text archived.' : 'Deleted by its author, no text archived.'}
          </p>
        {:else}
          <p class="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed">{comment.body || '(no content)'}</p>
        {/if}
      {/if}
    </div>
  </div>
</article>
