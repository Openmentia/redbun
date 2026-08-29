<script>
  import { cn } from '$lib/utils.js';
  let { class: className, value = $bindable(), ...rest } = $props();
</script>

<input
  bind:value
  class={cn(
    'flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {...rest}
/>
