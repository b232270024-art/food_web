import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'velofoods_theme';

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Same resolution logic as the inline script in index.html: explicit choice
// wins, otherwise fall back to the OS preference.
export function resolveInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* localStorage unavailable (private mode, etc.) */ }
  return systemPrefersDark() ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || resolveInitialTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
