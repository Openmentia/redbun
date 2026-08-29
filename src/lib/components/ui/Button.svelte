<script>
  import { cn } from '$lib/utils.js';

  let {
    class: className,
    variant = 'default',
    size = 'default',
    type = 'button',
    href = undefined,
    children,
    ...rest
  } = $props();

  const variants = {
    default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline'
  };
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-11 rounded-md px-6',
    icon: 'h-9 w-9'
  };

  const classes = $derived(
    cn(
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
      variants[variant],
      sizes[size],
      className
    )
  );
</script>

{#if href}
  <a {href} class={classes} {...rest}>{@render children?.()}</a>
{:else}
  <button {type} class={classes} {...rest}>{@render children?.()}</button>
{/if}
