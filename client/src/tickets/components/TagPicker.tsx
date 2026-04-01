'use client';

import { useState, useEffect, useMemo } from 'react';
import { Lock, Globe, Check, Search, X } from 'lucide-react';
import { useTagsStore } from '@/stores/tags.store';
import { useTeamStore } from '@/teams/stores/team.store';
import { useAuthStore } from '@/stores/auth.store';
import { TAG_COLORS, getTagColor } from '@/tickets/config/tagColors';

interface TagPickerProps {
  ticketId: string;
  currentTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function TagPicker({ ticketId, currentTagIds, onTagsChange }: TagPickerProps) {
  const { tags, createTag, deleteTag } = useTagsStore();
  const { currentTeam } = useTeamStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagColor, setNewTagColor] = useState<string>('blue');
  const [newTagScope, setNewTagScope] = useState<'team' | 'private'>('team');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optimistic local state so checkmarks update immediately on click
  const [selectedIds, setSelectedIds] = useState<string[]>(currentTagIds);

  // Sync local state when the authoritative prop catches up
  useEffect(() => {
    setSelectedIds(currentTagIds);
  }, [currentTagIds]);

  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags;
    const lower = search.toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(lower));
  }, [tags, search]);

  const exactMatch = useMemo(() => {
    if (!search.trim()) return true;
    return tags.some(t => t.name.toLowerCase() === search.trim().toLowerCase());
  }, [tags, search]);

  const handleToggleTag = (tagId: string) => {
    const next = selectedIds.includes(tagId)
      ? selectedIds.filter(id => id !== tagId)
      : [...selectedIds, tagId];
    setSelectedIds(next);
    onTagsChange(next);
  };

  const handleDeleteTag = async (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation();
    if (!currentTeam?.id) return;
    const removed = await deleteTag(currentTeam.id, tagId);
    if (removed && selectedIds.includes(tagId)) {
      const next = selectedIds.filter(id => id !== tagId);
      setSelectedIds(next);
      onTagsChange(next);
    }
  };

  const handleCreate = async () => {
    if (!currentTeam?.id || !search.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const tag = await createTag(currentTeam.id, search.trim(), newTagColor, newTagScope);
      if (tag) {
        const next = [...selectedIds, tag.id];
        setSelectedIds(next);
        onTagsChange(next);
        setSearch('');
        setIsCreating(false);
        setNewTagColor('blue');
        setNewTagScope('team');
      }
    } catch {
      // Error handling via toast at the store level if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-56 p-2" onClick={(e) => e.stopPropagation()}>
      {/* Search input */}
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          autoFocus
          placeholder="Search or create tag..."
          className="w-full pl-7 pr-2 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-md outline-none text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)]/50"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsCreating(false);
          }}
        />
      </div>

      {/* Tag list */}
      <div className="max-h-48 overflow-y-auto space-y-0.5">
        {filteredTags.map(tag => {
          const color = getTagColor(tag.color);
          const isSelected = selectedIds.includes(tag.id);
          const canDelete = tag.createdBy === user?.uid;
          return (
            <div
              key={tag.id}
              className="group flex items-center gap-1 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
            >
              <button
                onClick={() => handleToggleTag(tag.id)}
                className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--text-secondary)]"
              >
                <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${color.dot}`} />
                <span className="flex-1 text-left truncate">{tag.name}</span>
                {tag.scope === 'private' && <Lock className="h-3 w-3 text-[var(--text-tertiary)] flex-shrink-0" />}
                <span className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border)]'}`}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </span>
              </button>
              {canDelete && (
                <button
                  onClick={(e) => handleDeleteTag(e, tag.id)}
                  className="hidden group-hover:flex items-center justify-center h-5 w-5 mr-1 rounded text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0"
                  title="Delete tag"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create new tag */}
      {search.trim() && !exactMatch && !isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full mt-1 px-2 py-1.5 text-xs text-[var(--primary)] hover:bg-[var(--bg-hover)] rounded-md transition-colors text-left"
        >
          Create &ldquo;{search.trim()}&rdquo;...
        </button>
      )}

      {/* Inline create form */}
      {isCreating && (
        <div className="mt-1 pt-1 border-t border-[var(--border-subtle)] space-y-2">
          {/* Color palette */}
          <div className="flex items-center gap-1 px-1">
            {TAG_COLORS.map(c => (
              <button
                key={c.key}
                onClick={() => setNewTagColor(c.key)}
                className={`h-5 w-5 rounded-full flex items-center justify-center transition-all ${c.dot} ${newTagColor === c.key ? 'ring-2 ring-offset-1 ring-[var(--primary)] ring-offset-[var(--bg-subtle)]' : 'hover:scale-110'}`}
              >
                {newTagColor === c.key && <Check className="h-3 w-3 text-white" />}
              </button>
            ))}
          </div>

          {/* Scope toggle + confirm */}
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={() => setNewTagScope(s => s === 'team' ? 'private' : 'team')}
              className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] transition-colors"
              title={newTagScope === 'team' ? 'Team tag — visible to all members' : 'Private tag — only visible to you'}
            >
              {newTagScope === 'team' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {newTagScope === 'team' ? 'Team' : 'Private'}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="p-1 rounded hover:bg-[var(--bg-hover)] text-green-500 hover:text-green-400 disabled:opacity-30 transition-colors"
              aria-label="Create tag"
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
