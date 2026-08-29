const KEY = 'redbun-theme';

export function getTheme() {
  try {
    return localStorage.getItem(KEY) || 'system';
  } catch {
    return 'system';
  }
}

export function setTheme(mode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
  apply(mode);
}

export function apply(mode = getTheme()) {
  const dark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}
