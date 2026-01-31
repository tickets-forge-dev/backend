'use client';

import { useEffect, useState } from 'react';

export type Theme = 'system' | 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('forge-theme') as Theme | null;
    if (saved) {
      setThemeState(saved);
      applyActualTheme(saved);
    } else {
      applyActualTheme('system');
    }

    // Listen for OS theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const currentTheme = localStorage.getItem('forge-theme') as Theme | null;
      if (currentTheme === 'system' || !currentTheme) {
        document.documentElement.setAttribute(
          'data-theme',
          e.matches ? 'dark' : 'light'
        );
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const applyActualTheme = (newTheme: Theme) => {
    // Resolve actual theme (system -> light/dark)
    const actualTheme =
      newTheme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : newTheme;

    document.documentElement.setAttribute('data-theme', actualTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyActualTheme(newTheme);

    // Persist to localStorage
    localStorage.setItem('forge-theme', newTheme);

    // TODO: Sync to Firestore in Story 2.x+ (user preferences)
    // firestore.collection('workspaces/{id}/users/{uid}/preferences').set({ theme: newTheme })
  };

  return { theme, setTheme };
}
