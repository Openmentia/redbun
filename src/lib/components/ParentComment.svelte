<script>
  import { REDDIT, fetchCommentById } from '$lib/archive.js';
  import { ago, stamp, compact } from '$lib/format.js';
  import Self from './ParentComment.svelte';

  let { parentId } = $props();

  let comment = $state(null);
  let loading = $state(false);
  const valid = $derived(typeof parentId === 'string' && parentId.startsWith('t1_'));

  async function load() {
    if (loading || comment) return;
    loading = true;
    comment = await fetchCommentById(parentId);
    loading = false;
  }
</script>

{#if valid}
  <div class="border-b bg-muted/40 px-3 py-1.5">
    {#if comment}
      {#if comment.parent_id?.startsWith?.('t1_')}<Self parentId={comment.parent_id} />{/if}
      <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
        <span class="font-semibold">▲ {compact(comment.score)}</span>
        <a class="font-medium text-foreground hover:text-primary" href={`${REDDIT}/u/${comment.author}`} target="_blank" rel="noreferrer">u/{comment.author}</a>
        <span title={stamp(comment.created_utc)}>{ago(comment.created_utc)}</span>
        <span class="line-clamp-3 basis-full whitespace-pre-wrap break-words text-muted-foreground/90">{comment.body || '(no content)'}</span>
      </div>
    {:else}
      <button class="text-[11px] font-medium text-muted-foreground hover:text-primary" onclick={load} disabled={loading}>
        {loading ? 'loading' : '↑ load parent'}
      </button>
    {/if}
  </div>
{/if}
