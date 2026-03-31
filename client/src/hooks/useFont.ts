'use client';

import { useEffect, useState } from 'react';

export type FontFamily = 'inter' | 'dm-sans' | 'space-grotesk' | 'sora' | 'plus-jakarta' | 'system' | 'mono';

const FONT_MAP: Record<FontFamily, string> = {
  inter: 'var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif',
  'dm-sans': 'var(--font-dm-sans), -apple-system, BlinkMacSystemFont, sans-serif',
  'space-grotesk': 'var(--font-space-grotesk), -apple-system, BlinkMacSystemFont, sans-serif',
  sora: 'var(--font-sora), -apple-system, BlinkMacSystemFont, sans-serif',
  'plus-jakarta': 'var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, sans-serif',
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  mono: 'var(--font-jetbrains), ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
};

export const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: 'inter', label: 'Inter' },
  { value: 'dm-sans', label: 'DM Sans' },
  { value: 'space-grotesk', label: 'Space Grotesk' },
  { value: 'sora', label: 'Sora' },
  { value: 'plus-jakarta', label: 'Jakarta' },
  { value: 'system', label: 'System' },
  { value: 'mono', label: 'Mono' },
];

const STORAGE_KEY = 'forge-font';

export function useFont() {
  const [font, setFontState] = useState<FontFamily>('inter');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as FontFamily | null;
    if (saved && FONT_MAP[saved]) {
      setFontState(saved);
      applyFont(saved);
    }
  }, []);

  const applyFont = (f: FontFamily) => {
    document.documentElement.style.setProperty('--font-sans', FONT_MAP[f]);
    document.body.style.fontFamily = FONT_MAP[f];
  };

  const setFont = (f: FontFamily) => {
    setFontState(f);
    applyFont(f);
    localStorage.setItem(STORAGE_KEY, f);
  };

  return { font, setFont };
}
