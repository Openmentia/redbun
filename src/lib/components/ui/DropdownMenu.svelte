<script>
  import { cn } from '$lib/utils.js';

  let { trigger, children, align = 'end', class: triggerClass } = $props();
  let open = $state(false);
  let root = $state(null);

  function onDoc(e) {
    if (root && !root.contains(e.target)) open = false;
  }
  function onKey(e) {
    if (e.key === 'Escape') open = false;
  }

  $effect(() => {
    if (open) {
      document.addEventListener('click', onDoc, true);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.removeEventListener('click', onDoc, true);
      document.removeEventListener('keydown', onKey);
    };
  });
</script>

<div class="relative inline-flex" bind:this={root}>
  <button
    type="button"
    class={triggerClass}
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={() => (open = !open)}
  >
    {@render trigger()}
  </button>

  {#if open}
    <div
      role="menu"
      class={cn(
        'absolute top-full z-50 mt-1 min-w-[9rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        align === 'end' ? 'right-0' : 'left-0'
      )}
    >
      {@render children({ close: () => (open = false) })}
    </div>
  {/if}
</div>
