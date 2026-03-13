'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui.store';

export function useCommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setCommandPaletteOpen(!useUIStore.getState().commandPaletteOpen);
      }
    }

    // Use capture phase so we intercept before the browser's
    // built-in Ctrl+K (address-bar focus on Windows) can fire.
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [setCommandPaletteOpen]);

  return {
    isOpen: commandPaletteOpen,
    open: () => setCommandPaletteOpen(true),
    close: () => setCommandPaletteOpen(false),
  };
}
