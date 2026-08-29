// Reduce whatever someone pastes — a profile URL, an @mention, a "u/" prefix —
// down to the bare account name.
export function cleanHandle(raw) {
  let s = String(raw ?? '').trim();
  s = s.replace(/^https?:\/\/(?:www\.|old\.|new\.|np\.)?reddit\.com/i, '');
  s = s.replace(/^\/+/, '').replace(/^(?:u|user)\//i, '').replace(/^@/, '');
  s = s.replace(/[/?#].*$/, '').trim();
  return s;
}
