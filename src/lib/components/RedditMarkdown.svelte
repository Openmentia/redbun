<script>
  import { renderMarkdown } from '$lib/markdown.js';
  let { source, class: className = '' } = $props();
  const html = $derived(renderMarkdown(source));

  function reveal(e) {
    const s = e.target.closest?.('.spoiler');
    if (s) s.classList.toggle('revealed');
  }
</script>

{#if html}
  <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
  <div class="rmd {className}" onclick={reveal}>{@html html}</div>
{/if}
