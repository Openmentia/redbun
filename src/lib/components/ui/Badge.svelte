<script>
  import { cn } from '$lib/utils.js';
  let { class: className, variant = 'default', children, ...rest } = $props();

  const variants = {
    default: 'border-transparent bg-primary/10 text-primary',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    outline: 'text-foreground',
    warn: 'border-transparent bg-amber-100 text-amber-800',
    mod: 'border-transparent bg-teal-100 text-teal-800',
    ink: 'border-transparent bg-foreground text-background'
  };
</script>

<span
  class={cn(
    'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
    variants[variant],
    className
  )}
  {...rest}
>
  {@render children?.()}
</span>
