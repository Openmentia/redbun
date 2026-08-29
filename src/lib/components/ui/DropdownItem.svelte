<script>
  import { cn } from '$lib/utils.js';
  import { Check } from '@lucide/svelte';
  let { onSelect, active = false, class: className, children } = $props();
</script>

<button
  type="button"
  role="menuitem"
  class={cn(
    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
    className
  )}
  onclick={onSelect}
>
  <span class="flex h-3.5 w-3.5 items-center justify-center">
    {#if active}<Check class="h-3.5 w-3.5" />{/if}
  </span>
  {@render children?.()}
</button>
