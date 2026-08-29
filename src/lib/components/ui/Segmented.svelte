<script>
  import { cn } from '$lib/utils.js';
  // options: [{ value, label, count? }]
  let {
    options = [],
    value = $bindable(),
    onChange = undefined,
    class: className,
    size = 'default'
  } = $props();

  function pick(v) {
    if (onChange) onChange(v);
    else value = v;
  }
</script>

<div
  class={cn(
    'inline-flex items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground',
    className
  )}
>
  {#each options as o (o.value)}
    <button
      type="button"
      onclick={() => pick(o.value)}
      class={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        value === o.value ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground'
      )}
    >
      {o.label}{#if o.count != null}<span class="text-[11px] opacity-60">{o.count}</span>{/if}
    </button>
  {/each}
</div>
