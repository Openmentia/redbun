<script>
  import { statusOf } from '$lib/archive.js';
  import Badge from './ui/Badge.svelte';
  let { item, kind } = $props();
  const st = $derived(statusOf(item, kind));
</script>

{#if st.removed}<Badge variant="default">removed</Badge>{/if}
{#if st.deleted}<Badge variant="warn">deleted</Badge>{/if}
{#if item.over_18}<Badge variant="default">nsfw</Badge>{/if}
{#if item.spoiler}<Badge variant="secondary">spoiler</Badge>{/if}
{#if item.distinguished === 'admin'}<Badge variant="ink">admin</Badge>{/if}
{#if item.distinguished === 'moderator'}<Badge variant="mod">mod</Badge>{/if}
