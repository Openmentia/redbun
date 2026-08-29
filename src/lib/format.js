export function ago(utc) {
  const s = Math.floor(Date.now() / 1000 - utc);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 365) return `${d}d ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function stamp(utc) {
  return new Date(utc * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function compact(n) {
  if (n == null) return '0';
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}m`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

export function thumbOf(post) {
  try {
    const src = post.preview?.images?.[0]?.source?.url;
    if (src) return src.replace(/&amp;/g, '&');
  } catch { /* ignore */ }
  try {
    const first = post.media_metadata && Object.values(post.media_metadata)[0];
    if (first?.s?.u) return first.s.u.replace(/&amp;/g, '&');
  } catch { /* ignore */ }
  if (post.url && ['jpg', 'jpeg', 'png', 'gif'].includes(post.url.split('.').pop()?.toLowerCase())) {
    return post.url;
  }
  return null;
}
