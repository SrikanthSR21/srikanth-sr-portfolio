import { useSyncExternalStore } from 'react';

// The visitor's personal light/dark choice. It lives only in this browser (localStorage) and
// never touches the site-wide settings that the admin controls (which supply the *default*).

export type ColorMode = 'light' | 'dark';
export type DefaultMode = 'light' | 'dark' | 'system' | undefined;
const KEY = 'site_color_mode';

const read = (): ColorMode | null => {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch { return null; }
};
let stored: ColorMode | null = read();
const listeners = new Set<() => void>();

export function resolveMode(def: DefaultMode): ColorMode {
  if (stored) return stored;
  if (def === 'light') return 'light';
  if (def === 'system' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export function setColorMode(mode: ColorMode) {
  stored = mode;
  try { localStorage.setItem(KEY, mode); } catch { /* private mode: still works for this session */ }
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  if (!reduce) { root.classList.add('theme-switching'); window.setTimeout(() => root.classList.remove('theme-switching'), 400); }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { stored = read(); cb(); } };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(cb); window.removeEventListener('storage', onStorage); };
}

export function useColorMode(def: DefaultMode) {
  const mode = useSyncExternalStore(subscribe, () => resolveMode(def), () => 'dark' as ColorMode);
  return { mode, setMode: setColorMode, toggle: () => setColorMode(mode === 'dark' ? 'light' : 'dark') };
}
