import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCollide,
  forceX,
  forceY
} from 'd3-force';

// Run the force layout once and return frozen node/link positions. Doing this
// here (rather than inside the component) means the simulation never re-runs
// when the graph view is shown again.
export function layoutGraph(data, W = 700, H = 500) {
  if (!data?.nodes?.length) return null;

  const center = { id: '__me', label: data.user || '', r: 18, fx: W / 2, fy: H / 2, me: true, kind: 'me' };
  const others = data.nodes.map((n) => ({ ...n, r: 5 + Math.sqrt(n.count) * 3.4 }));
  const ns = [center, ...others];
  const ls = data.links.map((l) => ({ source: l.source, target: l.target }));

  forceSimulation(ns)
    .force('charge', forceManyBody().strength(-240))
    .force(
      'link',
      forceLink(ls)
        .id((d) => d.id)
        .distance((l) => 70 + (l.target.r || 8) * 1.5)
        .strength(0.35)
    )
    .force('collide', forceCollide((d) => d.r + 5))
    .force('x', forceX(W / 2).strength(0.04))
    .force('y', forceY(H / 2).strength(0.06))
    .stop()
    .tick(320);

  return {
    W,
    H,
    nodes: ns.map((n) => ({
      id: n.id,
      x: n.x,
      y: n.y,
      r: n.r,
      me: !!n.me,
      kind: n.kind,
      label: n.label,
      count: n.count ?? 0,
      posts: n.posts ?? 0
    })),
    links: ls.map((l) => ({
      s: l.source.id,
      t: l.target.id,
      x1: l.source.x,
      y1: l.source.y,
      x2: l.target.x,
      y2: l.target.y
    }))
  };
}
