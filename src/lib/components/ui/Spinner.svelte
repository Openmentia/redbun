<script>
  import { cn } from '$lib/utils.js';
  let { class: className, size = 20 } = $props();
</script>

<svg
  class={cn('spinner text-primary', className)}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  aria-hidden="true"
>
  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.2" stroke-width="3" />
  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
</svg>

<style>
  .spinner {
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spinner {
      animation-duration: 2s;
    }
  }
</style>
