'use client';

import { Pencil, Trash2 } from 'lucide-react';

interface EditableItemProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

export function EditableItem({ children, onEdit, onDelete }: EditableItemProps) {
  return (
    <div className="group relative flex items-start gap-2">
      <div className="flex-1 min-w-0">{children}</div>
      <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-[var(--red)]/10 text-[var(--text-tertiary)] hover:text-[var(--red)]"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
