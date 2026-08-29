import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: true });

const IMG_HOST = /^https?:\/\/(preview|i)\.redd\.it\//i;
const IMG_EXT = /\.(png|jpe?g|gif|webp|avif)(\?[^"']*)?$/i;

// Reddit's markdown differs from CommonMark in a few places. Handle the ones
// that actually show up in bodies before handing the rest to marked.
function pre(src) {
  let s = String(src);
  // spoilers  >!hidden!<
  s = s.replace(/&gt;!([\s\S]+?)!&lt;/g, (_, t) => `<span class="spoiler">${t}</span>`);
  s = s.replace(/>!([\s\S]+?)!</g, (_, t) => `<span class="spoiler">${t}</span>`);
  // superscript  ^(group)  and  ^word
  s = s.replace(/\^\(([^)]+)\)/g, '<sup>$1</sup>');
  s = s.replace(/\^(\S+)/g, '<sup>$1</sup>');
  // bare u/name and r/name mentions
  s = s.replace(
    /(^|[\s(>])\/?(u|user|r)\/([A-Za-z0-9][A-Za-z0-9_-]{1,23})\b/g,
    (_, lead, kind, name) => {
      const k = kind === 'user' ? 'u' : kind;
      return `${lead}[${k}/${name}](https://www.reddit.com/${k}/${name}/)`;
    }
  );
  return s;
}

// Turn links that point straight at an image into inline images, the way the
// Reddit web client does.
function inlineImages(html) {
  return html.replace(/<a href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, (m, href) => {
    if (IMG_HOST.test(href) || IMG_EXT.test(href)) {
      const clean = href.replace(/&amp;/g, '&');
      return `<img src="${clean}" alt="" loading="lazy" />`;
    }
    return m;
  });
}

export function renderMarkdown(src) {
  if (!src || src === '[removed]' || src === '[deleted]') return '';
  let html = marked.parse(pre(src), { async: false });
  html = inlineImages(html);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'a', 'em', 'strong', 'del', 'sup', 'sub', 'code', 'pre',
      'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'hr', 'span',
      'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'loading'],
    ADD_ATTR: ['target', 'rel']
  });
}

// Collect displayable media attached to a post or comment record.
export function collectMedia(item, kind) {
  const out = [];
  const seen = new Set();
  const add = (url, type = 'image') => {
    if (!url) return;
    const u = url.replace(/&amp;/g, '&');
    if (seen.has(u)) return;
    seen.add(u);
    out.push({ url: u, type });
  };

  // reddit-hosted video
  const rv = item.media?.reddit_video || item.secure_media?.reddit_video;
  if (rv?.fallback_url) add(rv.fallback_url, 'video');

  // gallery
  if (item.media_metadata) {
    for (const m of Object.values(item.media_metadata)) {
      if (m?.status && m.status !== 'valid') continue;
      if (m?.e === 'AnimatedImage' && m?.s?.gif) add(m.s.gif, 'image');
      else if (m?.s?.u) add(m.s.u, 'image');
      else if (m?.s?.mp4) add(m.s.mp4, 'video');
    }
  }

  if (kind === 'posts') {
    const prev = item.preview?.images?.[0]?.source?.url;
    if (prev && !out.length) add(prev, 'image');
    const url = item.url || '';
    if (IMG_EXT.test(url) || IMG_HOST.test(url) || /^https?:\/\/i\.imgur\.com\//i.test(url)) {
      add(url, 'image');
    }
    if (/\.(mp4|webm)(\?|$)/i.test(url)) add(url, 'video');
  }

  return out;
}
