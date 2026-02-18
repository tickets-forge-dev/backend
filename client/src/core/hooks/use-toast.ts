// Simplified toast hook for team management dialogs
// TODO: Replace with full shadcn/ui toast implementation later

import { useState } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, variant = 'default' }: Toast) => {
    // For now, just use console.log
    // In production, this would trigger actual toast UI
    if (variant === 'destructive') {
      console.error(`[Toast Error] ${title}:`, description);
    } else {
      console.log(`[Toast] ${title}:`, description);
    }

    // Add to state for future UI implementation
    setToasts((prev) => [...prev, { title, description, variant }]);
  };

  return { toast };
}
