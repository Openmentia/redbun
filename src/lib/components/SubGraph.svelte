<script>
  import { Plus, Minus, Maximize } from '@lucide/svelte';

  // layout: output of layoutGraph(). onPick: (node) => void
  let { layout, onPick } = $props();

  const W = layout.W;
  const H = layout.H;

  let k = $state(1);
  let tx = $state(0);
  let ty = $state(0);
  let hovered = $state(null);
  let svgEl = $state(null);
  let drag = null;

  function toView(e) {
    const r = svgEl.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }

  function zoomAt(px, py, factor) {
    const nk = Math.min(6, Math.max(0.3, k * factor));
    tx = px - (px - tx) * (nk / k);
    ty = py - (py - ty) * (nk / k);
    k = nk;
  }

  function wheel(e) {
    e.preventDefault();
    const p = toView(e);
    zoomAt(p.x, p.y, e.deltaY < 0 ? 1.12 : 0.893);
  }

  function down(e) {
    if (e.target.closest?.('[data-node]')) return;
    const p = toView(e);
    drag = { x: p.x, y: p.y, tx, ty };
    svgEl.setPointerCapture?.(e.pointerId);
  }
  function move(e) {
    if (!drag) return;
    const p = toView(e);
    tx = drag.tx + (p.x - drag.x);
    ty = drag.ty + (p.y - drag.y);
  }
  function endDrag() {
    drag = null;
  }
  function reset() {
    k = 1;
    tx = 0;
    ty = 0;
  }

  $effect(() => {
    const el = svgEl;
    if (!el) return;
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  });

  function fill(n) {
    if (n.me) return 'var(--color-primary)';
    if (n.kind === 'domain') return '#8b5cf6';
    return (n.count ? n.posts / n.count : 0.5) >= 0.5 ? '#0ea5e9' : '#f97316';
  }
  function near(id) {
    if (!hovered) return true;
    if (id === hovered) return true;
    return layout.links.some(
      (l) => (l.s === hovered && l.t === id) || (l.t === hovered && l.s === id)
    );
  }
</script>

<div class="relative overflow-hidden rounded-xl border bg-card">
  <div class="flex flex-wrap items-center gap-3 border-b px-3 py-2 text-[11px] text-muted-foreground">
    <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full" style="background:#0ea5e9"></span> posts-leaning</span>
    <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full" style="background:#f97316"></span> comments-leaning</span>
    <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full" style="background:#8b5cf6"></span> domain</span>
    <span class="ml-auto">scroll to zoom, drag to pan, click a node to filter</span>
  </div>

  <svg
    bind:this={svgEl}
    viewBox="0 0 {W} {H}"
    class="w-full select-none"
    style="height:min(70vh,560px);touch-action:none;cursor:{drag ? 'grabbing' : 'grab'}"
    role="presentation"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={endDrag}
    onpointerleave={endDrag}
  >
    <g transform="translate({tx} {ty}) scale({k})">
      {#each layout.links as l}
        {@const on = near(l.s) && near(l.t)}
        <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="var(--color-border)" stroke-width={on ? 1.2 : 0.6} stroke-opacity={on ? 0.85 : 0.2} />
      {/each}
      {#each layout.nodes as n}
        <g
          data-node
          transform="translate({n.x} {n.y})"
          class="cursor-pointer"
          role="button"
          tabindex="-1"
          onmouseenter={() => (hovered = n.id)}
          onmouseleave={() => (hovered = null)}
          onclick={() => !n.me && onPick?.(n)}
        >
          <circle r={n.r} fill={fill(n)} fill-opacity={near(n.id) ? 0.92 : 0.15} />
          <text
            y={n.r + 10}
            text-anchor="middle"
            font-size={(n.me ? 11 : 9.5) / Math.sqrt(k)}
            class="fill-foreground"
            opacity={hovered ? (near(n.id) ? 1 : 0.12) : n.r > 9 || n.me ? 0.95 : 0.5}
          >
            {n.me ? 'u/' + n.label : n.kind === 'domain' ? n.id : 'r/' + n.id}
          </text>
        </g>
      {/each}
    </g>
  </svg>

  <div class="absolute bottom-3 right-3 flex flex-col gap-1">
    <button class="flex h-7 w-7 items-center justify-center rounded-md border bg-background hover:bg-accent" onclick={() => zoomAt(W / 2, H / 2, 1.25)} aria-label="Zoom in"><Plus class="h-3.5 w-3.5" /></button>
    <button class="flex h-7 w-7 items-center justify-center rounded-md border bg-background hover:bg-accent" onclick={() => zoomAt(W / 2, H / 2, 0.8)} aria-label="Zoom out"><Minus class="h-3.5 w-3.5" /></button>
    <button class="flex h-7 w-7 items-center justify-center rounded-md border bg-background hover:bg-accent" onclick={reset} aria-label="Reset view"><Maximize class="h-3.5 w-3.5" /></button>
  </div>
</div>
