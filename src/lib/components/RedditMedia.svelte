<script>
  import { collectMedia } from '$lib/markdown.js';
  let { item, kind } = $props();
  const media = $derived(collectMedia(item, kind));
</script>

{#if media.length}
  <div class="mt-2 flex flex-wrap gap-2">
    {#each media.slice(0, 8) as m}
      {#if m.type === 'video'}
        <video src={m.url} controls class="max-h-80 max-w-full rounded-lg border">
          <track kind="captions" />
        </video>
      {:else}
        <a href={m.url} target="_blank" rel="noreferrer" class="block">
          <img
            src={m.url}
            alt=""
            loading="lazy"
            class="max-h-80 max-w-[320px] rounded-lg border object-cover"
            onerror={(e) => (e.currentTarget.parentElement.style.display = 'none')}
          />
        </a>
      {/if}
    {/each}
  </div>
{/if}
