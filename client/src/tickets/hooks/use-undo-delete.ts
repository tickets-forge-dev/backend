import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseUndoDeleteOptions<T> {
  items: T[];
  onCommit: (updatedItems: T[]) => Promise<boolean>;
  getLabel?: (item: T) => string;
}

export function useUndoDelete<T>({ items, onCommit, getLabel }: UseUndoDeleteOptions<T>) {
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deleteItem = useCallback(
    (index: number) => {
      const item = items[index];
      const label = getLabel ? getLabel(item) : String(item);
      const truncated = label.length > 60 ? label.slice(0, 57) + '...' : label;
      const updated = items.filter((_, i) => i !== index);

      // Clear any existing pending timer
      if (pendingRef.current) {
        clearTimeout(pendingRef.current);
      }

      // Optimistically commit immediately, show undo toast
      let undone = false;
      const commitPromise = onCommit(updated);

      toast('Item deleted', {
        description: truncated,
        action: {
          label: 'Undo',
          onClick: () => {
            undone = true;
            // Restore original list
            onCommit(items);
          },
        },
        duration: 3000,
      });

      return commitPromise;
    },
    [items, onCommit, getLabel],
  );

  return { deleteItem };
}
