<script>
  import { cn } from '$lib/utils.js';
  let { label, value, hint = undefined, class: className } = $props();
</script>

<div class={cn('rounded-lg border bg-card px-3 py-2.5', className)}>
  <div class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
  <div class="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
  {#if hint}<div class="text-[11px] text-muted-foreground">{hint}</div>{/if}
</div>
