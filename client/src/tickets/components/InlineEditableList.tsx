'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/core/components/ui/button';
import { Textarea } from '@/core/components/ui/textarea';
import { Pencil, Check, X, Plus, Trash2 } from 'lucide-react';

interface InlineEditableListProps {
  items: string[];
  type: 'numbered' | 'bulleted';
  onSave: (items: string[]) => Promise<void>;
  emptyMessage?: string;
}

export function InlineEditableList({
  items,
  type,
  onSave,
  emptyMessage = 'No items yet',
}: InlineEditableListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<string[]>(items);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Update local state when props change
  useEffect(() => {
    if (!isEditing) {
      setEditedItems(items);
    }
  }, [items, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedItems([...items]);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedItems([...items]);
  };

  const handleSave = async () => {
    // Filter out empty items
    const filteredItems = editedItems.filter((item) => item.trim().length > 0);

    setIsSaving(true);
    try {
      await onSave(filteredItems);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...editedItems];
    newItems[index] = value;
    setEditedItems(newItems);
  };

  const handleAddItem = () => {
    setEditedItems([...editedItems, '']);
    // Focus the new textarea after render
    setTimeout(() => {
      const lastIndex = editedItems.length;
      textareaRefs.current[lastIndex]?.focus();
    }, 0);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = editedItems.filter((_, i) => i !== index);
    setEditedItems(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Save on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Display mode
  if (!isEditing) {
    if (items.length === 0) {
      return (
        <div className="flex items-center justify-between p-4 border border-dashed border-[var(--border)] rounded-lg">
          <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] italic">
            {emptyMessage}
          </p>
          <Button
            onClick={handleEdit}
            variant="ghost"
            size="sm"
            className="text-[var(--text-tertiary)]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      );
    }

    const ListTag = type === 'numbered' ? 'ol' : 'ul';
    const listClass =
      type === 'numbered'
        ? 'space-y-2 text-[var(--text-base)] text-[var(--text-secondary)]'
        : 'space-y-2 text-[var(--text-base)] text-[var(--text-secondary)]';

    return (
      <div className="group relative">
        <ListTag className={listClass}>
          {items.map((item, index) => (
            <li key={index}>
              {type === 'numbered' ? `${index + 1}. ` : '• '}
              {item}
            </li>
          ))}
        </ListTag>
        <Button
          onClick={handleEdit}
          variant="ghost"
          size="sm"
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-3">
      {editedItems.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <span className="text-[var(--text-sm)] text-[var(--text-tertiary)] mt-2 min-w-[24px]">
            {type === 'numbered' ? `${index + 1}.` : '•'}
          </span>
          <Textarea
            ref={(el) => { textareaRefs.current[index] = el; }}
            value={item}
            onChange={(e) => handleItemChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            placeholder={`Item ${index + 1}`}
            className="flex-1 min-h-[60px]"
            autoFocus={index === 0}
          />
          <Button
            onClick={() => handleRemoveItem(index)}
            variant="ghost"
            size="sm"
            className="mt-1 text-[var(--red)] hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <Button onClick={handleAddItem} variant="ghost" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>

        <div className="flex items-center gap-2">
          <Button onClick={handleCancel} variant="ghost" size="sm" disabled={isSaving}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave} size="sm" disabled={isSaving}>
            <Check className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <p className="text-[var(--text-xs)] text-[var(--text-tertiary)]">
        Tip: Press Cmd/Ctrl + Enter to save, Escape to cancel
      </p>
    </div>
  );
}
