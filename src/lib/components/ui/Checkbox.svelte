<script>
  import { cn } from '$lib/utils.js';
  import { Check } from '@lucide/svelte';
  let { class: className, checked = $bindable(false), children, ...rest } = $props();
</script>

<label class={cn('flex cursor-pointer items-center gap-2 text-sm', className)}>
  <span
    class={cn(
      'flex h-4 w-4 items-center justify-center rounded-[4px] border shadow-sm transition-colors',
      checked ? 'border-primary bg-primary text-primary-foreground' : 'bg-background'
    )}
  >
    {#if checked}<Check class="h-3 w-3" />{/if}
  </span>
  <input type="checkbox" class="sr-only" bind:checked {...rest} />
  {@render children?.()}
</label>
