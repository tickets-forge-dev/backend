'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import Link from 'next/link';
import { useTicketsStore } from '@/stores/tickets.store';
import { useFoldersStore } from '@/stores/folders.store';
import { useTagsStore } from '@/stores/tags.store';
import type { FolderResponse } from '@/services/folder.service';
import { TicketSkeletonRow } from '@/tickets/components/TicketSkeletonRow';
import { CreationMenu } from '@/tickets/components/CreationMenu';
import { useTeamStore } from '@/teams/stores/team.store';
import { Loader2, SlidersHorizontal, Lightbulb, Bug, ClipboardList, Ban, X, ChevronDown, ChevronRight, ChevronUp, Search, FileText, Plus, MoreVertical, ExternalLink, Archive, ArchiveRestore, Trash2, UserPlus, FolderOpen, FolderPlus, Pencil, FolderInput, Globe, Lock, Columns3, GripVertical, Tag } from 'lucide-react';
import { TagPicker } from '@/tickets/components/TagPicker';
import { getTagColor } from '@/tickets/config/tagColors';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/core/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/core/components/ui/alert-dialog';
import { TicketLifecycleInfo } from '@/tickets/components/detail/TicketLifecycleInfo';
import { TICKET_STATUS_CONFIG } from '@/tickets/config/ticketStatusConfig';
import { JobsPanel } from '@/tickets/components/JobsPanel';
import { useAuthStore } from '@/stores/auth.store';
import { useColumnConfigStore, type ColumnId } from '@/stores/column-config.store';
import { useServices } from '@/services/index';

type SortBy = 'updated' | 'created' | 'priority' | 'progress';
type SortDirection = 'desc' | 'asc';

// Helper function to get type icon
function getTypeIcon(type: string | null) {
  switch (type) {
    case 'bug':
      return <Bug className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />;
    case 'task':
      return <ClipboardList className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />;
    case 'feature':
    default:
      return <Lightbulb className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />;
  }
}

export default function TicketsListPage() {
  const { tickets, isLoading, isInitialLoad, loadError, loadTickets, quota, fetchQuota, listPreferences, setListPreferences, archivedTickets, isLoadingArchived, showArchived, toggleShowArchived, unarchiveTicket } = useTicketsStore();
  const { currentTeam, loadTeamMembers, teamMembers } = useTeamStore();
  const { folders, loadFolders, createFolder, renameFolder, deleteFolder, moveTicket, expandedFolders, toggleFolder, updateFolderScope, reorderFolders } = useFoldersStore();
  const { tags, loadTags } = useTagsStore();
  const { user } = useAuthStore();
  const currentUserId = user?.uid ?? null;
  const { config: columnConfig, toggleColumn, reorderColumns, resetToDefaults, loadColumnConfig } = useColumnConfigStore();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isSubmittingFolder, setIsSubmittingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderScope, setNewFolderScope] = useState<'team' | 'private'>('team');
  const [searchQuery, setSearchQuery] = useState('');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [scopeChangeDialog, setScopeChangeDialog] = useState<{ folderId: string; folderName: string; newScope: 'team' | 'private'; affectedTickets: any[] } | null>(null);
  const [headerContextMenu, setHeaderContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>(listPreferences?.priorityFilter || 'all');
  const [typeFilter, setTypeFilter] = useState<string>(listPreferences?.typeFilter || 'all');
  const [tagFilter, setTagFilter] = useState<string[]>(listPreferences?.tagFilter || []);
  const [showFilter, setShowFilter] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>((listPreferences?.sortBy as any) || 'updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [folderDropTargetId, setFolderDropTargetId] = useState<string | null>(null);
  const [folderDropPosition, setFolderDropPosition] = useState<'above' | 'below' | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<ColumnId | null>(null);

  const handleFolderDragStart = useCallback((folderId: string) => {
    setDraggingFolderId(folderId);
  }, []);

  const handleFolderDragEnd = useCallback(() => {
    setDraggingFolderId(null);
    setFolderDropTargetId(null);
    setFolderDropPosition(null);
  }, []);

  const handleFolderDrop = useCallback((targetFolderId: string, position: 'above' | 'below') => {
    if (!currentTeam?.id || !draggingFolderId || draggingFolderId === targetFolderId) return;

    const draggedFolder = folders.find(f => f.id === draggingFolderId);
    const targetFolder = folders.find(f => f.id === targetFolderId);
    if (!draggedFolder || !targetFolder) return;

    // Prevent dragging between sections
    if (draggedFolder.scope !== targetFolder.scope) return;

    const scopeFolders = folders.filter(f => f.scope === draggedFolder.scope);
    const newOrder = scopeFolders.map(f => f.id).filter(id => id !== draggingFolderId);
    const targetIdx = newOrder.indexOf(targetFolderId);
    const insertIdx = position === 'above' ? targetIdx : targetIdx + 1;
    newOrder.splice(insertIdx, 0, draggingFolderId);

    reorderFolders(currentTeam.id, draggedFolder.scope, newOrder);
    setDraggingFolderId(null);
    setFolderDropTargetId(null);
    setFolderDropPosition(null);
  }, [currentTeam?.id, draggingFolderId, folders, reorderFolders]);

  const handleDragStart = useCallback((ticketId: string) => {
    setDraggingTicketId(ticketId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingTicketId(null);
  }, []);

  const handleTicketDrop = useCallback(async (ticketId: string, folderId: string | null) => {
    if (!currentTeam?.id) return;

    // Scope check: if dropping into a private folder, ensure ticket belongs to folder owner
    if (folderId) {
      const targetFolder = folders.find(f => f.id === folderId);
      if (targetFolder?.scope === 'private') {
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket && ticket.createdBy !== currentUserId) {
          toast.error('Cannot move another user\'s ticket to a private folder');
          return;
        }
      }
    }

    const ok = await moveTicket(currentTeam.id, ticketId, folderId);
    if (ok) {
      loadTickets();
      toast.success(folderId ? `Moved to folder` : 'Moved to unfiled');
    } else {
      toast.error('Failed to move ticket');
    }
  }, [currentTeam?.id, moveTicket, loadTickets, folders, tickets, currentUserId]);

  const handleChangeVisibility = useCallback(async (folderId: string) => {
    if (!currentTeam?.id) return;
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    const newScope = folder.scope === 'private' ? 'team' : 'private';

    try {
      const result = await updateFolderScope(currentTeam.id, folderId, newScope);
      if (result.affectedTickets && result.affectedTickets.length > 0) {
        // Need confirmation — show dialog
        setScopeChangeDialog({ folderId, folderName: folder.name, newScope, affectedTickets: result.affectedTickets });
      } else {
        toast.success(newScope === 'private' ? 'Folder is now private' : 'Folder is now visible to team');
        loadTickets();
      }
    } catch {
      toast.error('Failed to change folder visibility');
    }
  }, [currentTeam?.id, folders, updateFolderScope, loadTickets]);

  const handleConfirmScopeChange = useCallback(async () => {
    if (!scopeChangeDialog || !currentTeam?.id) return;
    try {
      await updateFolderScope(currentTeam.id, scopeChangeDialog.folderId, scopeChangeDialog.newScope, true);
      toast.success(scopeChangeDialog.newScope === 'private' ? 'Folder is now private' : 'Folder is now visible to team');
      setScopeChangeDialog(null);
      loadTickets();
    } catch {
      toast.error('Failed to change folder visibility');
    }
  }, [scopeChangeDialog, currentTeam?.id, updateFolderScope, loadTickets]);

  const handleMoveFolder = useCallback((folderId: string, direction: 'up' | 'down') => {
    if (!currentTeam?.id) return;
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const scopeFolders = folders.filter(f => f.scope === folder.scope);
    const idx = scopeFolders.findIndex(f => f.id === folderId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === scopeFolders.length - 1) return;

    const newOrder = scopeFolders.map(f => f.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    reorderFolders(currentTeam.id, folder.scope, newOrder);
  }, [currentTeam?.id, folders, reorderFolders]);

  // Compute visible columns and grid template
  const visibleColumns = useMemo(() => columnConfig.order.filter(c => !columnConfig.hidden.has(c)), [columnConfig]);
  const columnWidths: Record<ColumnId, string> = { status: '120px', priority: '72px', assignee: '100px', creator: '80px', updated: '64px', score: '44px' };
  const mdGridTemplate = useMemo(() => `minmax(0, 1fr) ${visibleColumns.map(c => columnWidths[c]).join(' ')} 32px`, [visibleColumns]);

  // Split folders into private and team sections
  const privateFolders = useMemo(() => folders.filter(f => f.scope === 'private'), [folders]);
  const teamFolders = useMemo(() => folders.filter(f => f.scope === 'team'), [folders]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reload tickets, folders, and members when team changes
  useEffect(() => {
    loadTickets();
    fetchQuota();
    if (currentTeam?.id) {
      loadTeamMembers(currentTeam.id);
      loadFolders(currentTeam.id);
      loadTags(currentTeam.id);
      loadColumnConfig(currentTeam.id);
    }
  }, [loadTickets, fetchQuota, loadTeamMembers, loadFolders, loadTags, loadColumnConfig, currentTeam?.id]);

  const allTickets = tickets;

  // Filter out stale tag IDs that no longer exist in loaded tags
  useEffect(() => {
    if (tags.length > 0 && tagFilter.length > 0) {
      const validTagIds = new Set(tags.map(t => t.id));
      const cleaned = tagFilter.filter(id => validTagIds.has(id));
      if (cleaned.length !== tagFilter.length) {
        setTagFilter(cleaned);
      }
    }
  }, [tags]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter and sort tickets
  const filteredTickets = useMemo(() => {
    const lowercaseSearch = debouncedSearch.toLowerCase();

    return allTickets
      .filter((ticket) => {
        const matchesSearch =
          debouncedSearch === '' ||
          ticket.title.toLowerCase().includes(lowercaseSearch) ||
          ticket.description?.toLowerCase().includes(lowercaseSearch);

        const matchesPriority =
          priorityFilter === 'all' || ticket.priority === priorityFilter;

        const matchesType =
          typeFilter === 'all' || ticket.type === typeFilter;

        const matchesTags =
          tagFilter.length === 0 || tagFilter.every(tagId => (ticket.tagIds ?? []).includes(tagId));

        return matchesSearch && matchesPriority && matchesType && matchesTags;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'updated':
            comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            break;
          case 'created':
            comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            break;
          case 'priority': {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            comparison = bPriority - aPriority;
            break;
          }
          case 'progress': {
            const aProgress = a.techSpec?.qualityScore ?? a.readinessScore ?? 0;
            const bProgress = b.techSpec?.qualityScore ?? b.readinessScore ?? 0;
            comparison = bProgress - aProgress;
            break;
          }
        }

        return sortDirection === 'desc' ? comparison : -comparison;
      });
  }, [allTickets, debouncedSearch, priorityFilter, typeFilter, tagFilter, sortBy, sortDirection]);

  // Separate tickets into folder-grouped and unfiled
  const { folderTicketsMap, unfiledTickets } = useMemo(() => {
    const map: Record<string, typeof filteredTickets> = {};
    const unfiled: typeof filteredTickets = [];

    for (const ticket of filteredTickets) {
      if (ticket.folderId) {
        if (!map[ticket.folderId]) map[ticket.folderId] = [];
        map[ticket.folderId].push(ticket);
      } else {
        unfiled.push(ticket);
      }
    }

    return { folderTicketsMap: map, unfiledTickets: unfiled };
  }, [filteredTickets]);

  // Save preferences when they change
  useEffect(() => {
    setListPreferences({
      sortBy,
      priorityFilter,
      typeFilter,
      tagFilter,
    });
  }, [sortBy, priorityFilter, typeFilter, tagFilter, setListPreferences]);

  const sortLabel = {
      updated: 'Recently updated',
      created: 'Recently created',
      priority: 'Priority',
      progress: 'Progress',
    }[sortBy];

    return (
      <div className="flex flex-1 min-h-0">
      <div className="flex-1 flex flex-col min-h-0">
      {/* Filter, Sort & Actions bar — outside scroll container so dropdowns aren't clipped */}
      <div className="w-full px-3 sm:px-6 pt-4 sm:pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {/* Search — full width on mobile */}
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search tickets..."
            className="pl-9 pr-8 text-xs sm:text-sm border-[var(--border-subtle)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
            >
              <X className="h-4 w-4 text-[var(--text-tertiary)]" />
            </button>
          )}
        </div>

        {/* Sort, filter & actions row — pushed right */}
        <div className="flex items-center gap-1.5 ml-auto">
        {/* Sort dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
            title={sortLabel}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-1.5 shadow-lg">
                {[
                  { value: 'updated' as SortBy, label: 'Recently updated' },
                  { value: 'created' as SortBy, label: 'Recently created' },
                  { value: 'priority' as SortBy, label: 'Priority' },
                  { value: 'progress' as SortBy, label: 'Progress' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs sm:text-[var(--text-sm)] transition-colors ${sortBy === opt.value ? 'bg-[var(--bg-hover)] text-[var(--text)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* More filters button */}
        <div className="relative">
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`h-7 w-7 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)] transition-colors ${priorityFilter !== 'all' || typeFilter !== 'all' || tagFilter.length > 0 ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
            title="Filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          {showFilter && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 z-50 w-56 sm:w-auto sm:min-w-[160px] rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-1.5 shadow-lg space-y-2">
                {/* Priority */}
                <div>
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-2 mb-0.5">Priority</p>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'urgent', label: 'Urgent', dot: 'bg-red-500' },
                    { value: 'high', label: 'High', dot: 'bg-orange-500' },
                    { value: 'medium', label: 'Medium', dot: 'bg-yellow-500' },
                    { value: 'low', label: 'Low', dot: 'bg-green-500' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setPriorityFilter(opt.value); }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-[var(--text-sm)] transition-colors flex items-center gap-2 ${priorityFilter === opt.value ? 'bg-[var(--bg-hover)] text-[var(--text)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                    >
                      {opt.dot && <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Type */}
                <div className="border-t border-[var(--border-subtle)] pt-2">
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-2 mb-0.5">Type</p>
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'feature', label: 'Feature' },
                    { value: 'bug', label: 'Bug' },
                    { value: 'task', label: 'Task' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setTypeFilter(opt.value); }}
                      className={`w-full text-left px-3 py-1.5 rounded-md text-[var(--text-sm)] transition-colors flex items-center gap-2 ${typeFilter === opt.value ? 'bg-[var(--bg-hover)] text-[var(--text)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                    >
                      {opt.value !== 'all' && getTypeIcon(opt.value)}
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Tags */}
                {tags.length > 0 && (
                  <div className="border-t border-[var(--border-subtle)] pt-2">
                    <div className="flex items-center justify-between px-2 mb-0.5">
                      <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Tags</p>
                      {tagFilter.length > 0 && (
                        <button onClick={() => setTagFilter([])} className="text-[10px] text-[var(--primary)] hover:underline">Clear</button>
                      )}
                    </div>
                    {tags.map(tag => {
                      const color = getTagColor(tag.color);
                      const isActive = tagFilter.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => {
                            setTagFilter(prev =>
                              isActive ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                            );
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-md text-[var(--text-sm)] transition-colors flex items-center gap-2 ${isActive ? 'bg-[var(--bg-hover)] text-[var(--text)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                        >
                          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${color.dot}`} />
                          <span className="truncate flex-1">{tag.name}</span>
                          {tag.scope === 'private' && <Lock className="h-3 w-3 text-[var(--text-tertiary)]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Column management */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
            title="Manage columns"
          >
            <Columns3 className="h-3.5 w-3.5" />
          </button>
          {showColumnMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColumnMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-1.5 shadow-lg">
                <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-2 mb-1">Columns</p>
                <div className="px-2 py-1 text-xs text-[var(--text-tertiary)]/50 flex items-center gap-2">
                  <GripVertical className="h-3 w-3 opacity-0" />
                  <input type="checkbox" checked disabled className="accent-[var(--primary)] opacity-40" />
                  Title
                </div>
                {columnConfig.order.map((col) => (
                  <div
                    key={col}
                    className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors ${draggedColumnId === col ? 'opacity-40' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/column-reorder', col);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedColumnId(col);
                    }}
                    onDragOver={(e) => {
                      if (!draggedColumnId || draggedColumnId === col) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      // Swap positions on drag over
                      const currentOrder = [...columnConfig.order];
                      const fromIdx = currentOrder.indexOf(draggedColumnId);
                      const toIdx = currentOrder.indexOf(col);
                      if (fromIdx === -1 || toIdx === -1) return;
                      currentOrder.splice(fromIdx, 1);
                      currentOrder.splice(toIdx, 0, draggedColumnId);
                      if (currentTeam?.id) reorderColumns(currentTeam.id, currentOrder);
                    }}
                    onDragEnd={() => {
                      setDraggedColumnId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggedColumnId(null);
                    }}
                  >
                    <GripVertical className="h-3 w-3 text-[var(--text-tertiary)] cursor-grab flex-shrink-0" />
                    <button
                      onClick={() => currentTeam?.id && toggleColumn(currentTeam.id, col)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <input
                        type="checkbox"
                        checked={!columnConfig.hidden.has(col)}
                        readOnly
                        className="accent-[var(--primary)] pointer-events-none"
                      />
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                    </button>
                  </div>
                ))}
                <div className="px-2 py-1 text-xs text-[var(--text-tertiary)]/50 flex items-center gap-2">
                  <GripVertical className="h-3 w-3 opacity-0" />
                  <input type="checkbox" checked disabled className="accent-[var(--primary)] opacity-40" />
                  Actions
                </div>
                <div className="border-t border-[var(--border-subtle)] mt-1 pt-1">
                  <button
                    onClick={() => { if (currentTeam?.id) resetToDefaults(currentTeam.id); }}
                    className="w-full text-left px-2 py-1 rounded-md text-xs text-[var(--primary)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    Reset to defaults
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* New Folder & Create */}
        <button
          onClick={() => setIsCreatingFolder(true)}
          className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors flex-shrink-0"
          title="New Folder"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
        {quota && !quota.canCreate ? (
          <div className="relative group flex-shrink-0">
            <CreationMenu disabled={true} />
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 whitespace-nowrap rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-3 py-1.5 text-[10px] sm:text-[11px] text-[var(--text-secondary)] shadow-lg">
              Ticket limit reached ({quota.ticketsCreatedToday}/{quota.dailyTicketLimit})
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0">
            <CreationMenu disabled={false} />
          </div>
        )}
        </div>
      </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 w-full px-3 sm:px-6 pt-4 sm:pt-6">
      {/* Loading state: Show skeletons on initial load or when loading */}
      {(isLoading || isInitialLoad) && (
        <div className="space-y-1.5">
          {[...Array(5)].map((_, i) => (
            <TicketSkeletonRow key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-600">{loadError}</p>
        </div>
      )}

      {/* Tickets list */}
      {!isLoading && !isInitialLoad && !loadError && filteredTickets.length === 0 && folders.length === 0 && (
        <div>
          <TicketGridHeader visibleColumns={visibleColumns} mdGridTemplate={mdGridTemplate} />
          {isCreatingFolder && (
            <form
              className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-subtle)]"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newFolderName.trim() || !currentTeam?.id || isSubmittingFolder) return;
                const name = newFolderName.trim();
                setIsSubmittingFolder(true);
                try {
                  const result = await createFolder(currentTeam.id, name, newFolderScope);
                  if (result) toast.success('Folder created');
                  setNewFolderName('');
                  setNewFolderScope('team');
                  setIsCreatingFolder(false);
                } catch {
                  toast.error('Failed to create folder');
                } finally {
                  setIsSubmittingFolder(false);
                }
              }}
            >
              <FolderOpen className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
              <button
                type="button"
                onClick={() => setNewFolderScope(s => s === 'team' ? 'private' : 'team')}
                className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors flex-shrink-0"
                title={newFolderScope === 'team' ? 'Team — visible to all members' : 'Private — only visible to you'}
              >
                {newFolderScope === 'team' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              </button>
              <input
                autoFocus
                placeholder="Folder name..."
                className="flex-1 text-sm bg-transparent outline-none text-[var(--text)] placeholder:text-[var(--text-tertiary)]"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setNewFolderName('');
                    setNewFolderScope('team');
                    setIsCreatingFolder(false);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!newFolderName.trim() || isSubmittingFolder}
                className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-30 transition-colors"
                aria-label="Create folder"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => { setNewFolderName(''); setNewFolderScope('team'); setIsCreatingFolder(false); }}
                className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}
          <div className="flex min-h-[300px] sm:min-h-[400px] items-center justify-center">
            <div className="text-center px-4">
              {searchQuery || priorityFilter !== 'all' || typeFilter !== 'all' || tagFilter.length > 0 ? (
                <>
                  <Search className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                  <p className="text-sm text-[var(--text-secondary)]">No tickets found</p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    Try adjusting your filters
                  </p>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                  <p className="text-base font-medium text-[var(--text)]">No tickets yet</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
                    Create your first executable ticket and let AI generate the technical spec
                  </p>
                  <Link href="/tickets/create">
                    <Button className="mt-4" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Ticket
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isInitialLoad && !loadError && (filteredTickets.length > 0 || folders.length > 0) && (
        <div>
          {/* Column headers */}
          <TicketGridHeader visibleColumns={visibleColumns} mdGridTemplate={mdGridTemplate} onContextMenu={(e) => { e.preventDefault(); setHeaderContextMenu({ x: e.clientX, y: e.clientY }); }} />

          {/* Inline folder creation */}
          {isCreatingFolder && (
            <form
              className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-subtle)]"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newFolderName.trim() || !currentTeam?.id || isSubmittingFolder) return;
                const name = newFolderName.trim();
                setIsSubmittingFolder(true);
                try {
                  const result = await createFolder(currentTeam.id, name, newFolderScope);
                  if (result) toast.success('Folder created');
                  setNewFolderName('');
                  setNewFolderScope('team');
                  setIsCreatingFolder(false);
                } catch {
                  toast.error('Failed to create folder');
                } finally {
                  setIsSubmittingFolder(false);
                }
              }}
            >
              <FolderOpen className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
              <button
                type="button"
                onClick={() => setNewFolderScope(s => s === 'team' ? 'private' : 'team')}
                className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors flex-shrink-0"
                title={newFolderScope === 'team' ? 'Team — visible to all members' : 'Private — only visible to you'}
              >
                {newFolderScope === 'team' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              </button>
              <input
                autoFocus
                placeholder="Folder name..."
                className="flex-1 text-sm bg-transparent outline-none text-[var(--text)] placeholder:text-[var(--text-tertiary)]"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setNewFolderName('');
                    setNewFolderScope('team');
                    setIsCreatingFolder(false);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!newFolderName.trim() || isSubmittingFolder}
                className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text)] disabled:opacity-30 transition-colors"
                aria-label="Create folder"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewFolderName('');
                  setNewFolderScope('team');
                  setIsCreatingFolder(false);
                }}
                className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                aria-label="Cancel"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </form>
          )}

          {/* MY FOLDERS section — only if user has private folders */}
          {privateFolders.length > 0 && (
            <>
              {teamFolders.length > 0 && (
                <div className="px-4 py-1.5 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                  My Folders
                </div>
              )}
              {privateFolders.map((folder, folderIdx) => {
                const folderTickets = folderTicketsMap[folder.id] || [];
                const isExpanded = expandedFolders.has(folder.id);
                return (
                  <div key={folder.id}>
                    <FolderHeader
                      folder={folder}
                      ticketCount={folderTickets.length}
                      ticketNames={folderTickets.map((t) => t.title)}
                      isExpanded={isExpanded}
                      onToggle={() => toggleFolder(folder.id)}
                      onRename={async (name) => {
                        if (currentTeam?.id) {
                          const ok = await renameFolder(currentTeam.id, folder.id, name);
                          if (ok) toast.success('Folder renamed');
                          else toast.error('Failed to rename folder');
                        }
                      }}
                      onDelete={async () => {
                        if (currentTeam?.id) {
                          const ok = await deleteFolder(currentTeam.id, folder.id);
                          if (ok) { toast.success('Folder deleted'); loadTickets(); }
                          else toast.error('Failed to delete folder');
                        }
                      }}
                      onChangeVisibility={() => handleChangeVisibility(folder.id)}
                      onMoveUp={folderIdx > 0 ? () => handleMoveFolder(folder.id, 'up') : undefined}
                      onMoveDown={folderIdx < privateFolders.length - 1 ? () => handleMoveFolder(folder.id, 'down') : undefined}
                      isDragActive={!!draggingTicketId}
                      draggingTicketId={draggingTicketId}
                      onTicketDrop={(ticketId) => handleTicketDrop(ticketId, folder.id)}
                      currentUserId={currentUserId}
                      tickets={tickets}
                      onFolderDragStart={() => handleFolderDragStart(folder.id)}
                      onFolderDragEnd={handleFolderDragEnd}
                      draggingFolderId={draggingFolderId}
                      onFolderDrop={handleFolderDrop}
                      folderDropTargetId={folderDropTargetId}
                      folderDropPosition={folderDropPosition}
                      setFolderDropTargetId={setFolderDropTargetId}
                      setFolderDropPosition={setFolderDropPosition}
                    />
                    {isExpanded && (
                      <FolderBody
                        isDragActive={!!draggingTicketId}
                        draggingTicketId={draggingTicketId}
                        onTicketDrop={(ticketId) => handleTicketDrop(ticketId, folder.id)}
                        folder={folder}
                        currentUserId={currentUserId}
                        tickets={tickets}
                      >
                        {folderTickets.length > 0 && (
                          <div>
                            {folderTickets.map((ticket) => (
                              <TicketRow key={ticket.id} ticket={ticket} folders={folders} onDragStart={handleDragStart} onDragEnd={handleDragEnd} nested currentUserId={currentUserId} visibleColumns={visibleColumns} mdGridTemplate={mdGridTemplate} />
                            ))}
                          </div>
                        )}
                        <InlineFolderAdd folderId={folder.id} />
                      </FolderBody>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* FOLDERS section header — only when both sections exist */}
          {privateFolders.length > 0 && teamFolders.length > 0 && (
            <div className="px-4 py-1.5 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider border-b border-[var(--border-subtle)]">
              Folders
            </div>
          )}
          {teamFolders.map((folder, folderIdx) => {
            const folderTickets = folderTicketsMap[folder.id] || [];
            const isExpanded = expandedFolders.has(folder.id);
            return (
              <div key={folder.id}>
                <FolderHeader
                  folder={folder}
                  ticketCount={folderTickets.length}
                  ticketNames={folderTickets.map((t) => t.title)}
                  isExpanded={isExpanded}
                  onToggle={() => toggleFolder(folder.id)}
                  onRename={async (name) => {
                    if (currentTeam?.id) {
                      const ok = await renameFolder(currentTeam.id, folder.id, name);
                      if (ok) toast.success('Folder renamed');
                      else toast.error('Failed to rename folder');
                    }
                  }}
                  onDelete={async () => {
                    if (currentTeam?.id) {
                      const ok = await deleteFolder(currentTeam.id, folder.id);
                      if (ok) { toast.success('Folder deleted'); loadTickets(); }
                      else toast.error('Failed to delete folder');
                    }
                  }}
                  onChangeVisibility={() => handleChangeVisibility(folder.id)}
                  onMoveUp={folderIdx > 0 ? () => handleMoveFolder(folder.id, 'up') : undefined}
                  onMoveDown={folderIdx < teamFolders.length - 1 ? () => handleMoveFolder(folder.id, 'down') : undefined}
                  isDragActive={!!draggingTicketId}
                  draggingTicketId={draggingTicketId}
                  onTicketDrop={(ticketId) => handleTicketDrop(ticketId, folder.id)}
                  currentUserId={currentUserId}
                  tickets={tickets}
                  onFolderDragStart={() => handleFolderDragStart(folder.id)}
                  onFolderDragEnd={handleFolderDragEnd}
                  draggingFolderId={draggingFolderId}
                  onFolderDrop={handleFolderDrop}
                  folderDropTargetId={folderDropTargetId}
                  folderDropPosition={folderDropPosition}
                  setFolderDropTargetId={setFolderDropTargetId}
                  setFolderDropPosition={setFolderDropPosition}
                />
                {isExpanded && (
                  <FolderBody
                    isDragActive={!!draggingTicketId}
                    draggingTicketId={draggingTicketId}
                    onTicketDrop={(ticketId) => handleTicketDrop(ticketId, folder.id)}
                    folder={folder}
                    currentUserId={currentUserId}
                    tickets={tickets}
                  >
                    {folderTickets.length > 0 && (
                      <div>
                        {folderTickets.map((ticket) => (
                          <TicketRow key={ticket.id} ticket={ticket} folders={folders} onDragStart={handleDragStart} onDragEnd={handleDragEnd} nested currentUserId={currentUserId} visibleColumns={visibleColumns} mdGridTemplate={mdGridTemplate} />
                        ))}
                      </div>
                    )}
                    <InlineFolderAdd folderId={folder.id} />
                  </FolderBody>
                )}
              </div>
            );
          })}

          {/* Unfiled drop zone — only visible during active drag */}
          {draggingTicketId && folders.length > 0 && (
            <UnfiledDropZone draggingTicketId={draggingTicketId} onTicketDrop={(ticketId) => handleTicketDrop(ticketId, null)} />
          )}

          {/* Unfiled tickets below folders */}
          {unfiledTickets.length > 0 && (
            <div>
              {unfiledTickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} folders={folders} onDragStart={handleDragStart} onDragEnd={handleDragEnd} currentUserId={currentUserId} visibleColumns={visibleColumns} mdGridTemplate={mdGridTemplate} />
              ))}
            </div>
          )}

          {/* Root-level quick add */}
          <InlineRootAdd />
        </div>
      )}

      {/* Header context menu for column management */}
      {headerContextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setHeaderContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setHeaderContextMenu(null); }} />
          <div
            className="fixed z-50 w-48 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] p-1.5 shadow-lg"
            style={{ left: headerContextMenu.x, top: headerContextMenu.y }}
          >
            <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider px-2 mb-1">Show/Hide Columns</p>
            {columnConfig.order.map((col) => (
              <button
                key={col}
                onClick={() => { if (currentTeam?.id) toggleColumn(currentTeam.id, col); }}
                className="w-full text-left px-2 py-1 rounded-md text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={!columnConfig.hidden.has(col)}
                  readOnly
                  className="accent-[var(--primary)] pointer-events-none"
                />
                {col.charAt(0).toUpperCase() + col.slice(1)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Scope change confirmation dialog */}
      <AlertDialog open={!!scopeChangeDialog} onOpenChange={(open) => { if (!open) setScopeChangeDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change folder visibility</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <span>Making <span className="font-medium text-[var(--text)]">{scopeChangeDialog?.folderName}</span> {scopeChangeDialog?.newScope === 'private' ? 'private' : 'team visible'} will affect these tickets:</span>
                {scopeChangeDialog?.affectedTickets && (
                  <ul className="mt-1.5 space-y-0.5 text-sm">
                    {scopeChangeDialog.affectedTickets.slice(0, 10).map((t: any, i: number) => (
                      <li key={i} className="truncate text-[var(--text-secondary)]">{'\u2022'} {t.title || t.id}</li>
                    ))}
                    {scopeChangeDialog.affectedTickets.length > 10 && (
                      <li className="text-[var(--text-tertiary)]">and {scopeChangeDialog.affectedTickets.length - 10} more...</li>
                    )}
                  </ul>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmScopeChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archived tickets section */}
      {!isLoading && !isInitialLoad && !loadError && (
        <ArchivedSection
          archivedTickets={archivedTickets}
          isLoading={isLoadingArchived}
          showArchived={showArchived}
          onToggle={toggleShowArchived}
          onUnarchive={unarchiveTicket}
        />
      )}
    </div>
    </div>
    <JobsPanel />
    </div>
  );
}

// Folder body wrapper — also a drop target so users can drop anywhere in the folder area
function FolderBody({ isDragActive, draggingTicketId, onTicketDrop, children, folder, currentUserId, tickets }: {
  isDragActive: boolean;
  draggingTicketId: string | null;
  onTicketDrop: (ticketId: string) => void;
  children: React.ReactNode;
  folder?: FolderResponse;
  currentUserId?: string | null;
  tickets?: any[];
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Check if drop is allowed (scope-aware)
  const isDropBlocked = folder?.scope === 'private' && draggingTicketId && tickets
    ? (() => {
        const ticket = tickets.find((t: any) => t.id === draggingTicketId);
        return ticket && ticket.createdBy !== currentUserId;
      })()
    : false;

  return (
    <div
      className={`transition-colors ${
        isDropBlocked
          ? 'bg-red-500/5 opacity-60'
          : isDragOver ? 'bg-blue-500/5' : isDragActive ? 'bg-blue-500/[0.02]' : ''
      }`}
      onDragOver={(e) => {
        if (!isDragActive) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = isDropBlocked ? 'none' : 'move';
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        // Only reset if we're leaving the container, not entering a child
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (isDropBlocked) return;
        const ticketId = e.dataTransfer.getData('text/plain') || draggingTicketId;
        if (ticketId) onTicketDrop(ticketId);
      }}
    >
      {children}
    </div>
  );
}

// Drop zone for removing tickets from folders
function UnfiledDropZone({ draggingTicketId, onTicketDrop }: { draggingTicketId: string | null; onTicketDrop: (ticketId: string) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`flex items-center justify-center px-4 py-3 border-2 border-dashed transition-all text-xs ${
        isDragOver
          ? 'border-[var(--blue)] bg-blue-500/10 text-[var(--text-secondary)]'
          : 'border-[var(--blue)]/40 bg-blue-500/5 text-[var(--text-tertiary)]'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const ticketId = e.dataTransfer.getData('text/plain') || draggingTicketId;
        if (ticketId) onTicketDrop(ticketId);
      }}
    >
      <FileText className="h-3.5 w-3.5 mr-1.5" />
      Drop here to unfile
    </div>
  );
}

// Column label map
const COLUMN_LABELS: Record<ColumnId, string> = {
  status: 'Status',
  priority: 'Priority',
  assignee: 'Assignee',
  creator: 'Creator',
  updated: 'Updated',
  score: 'Score',
};

// Breakpoint visibility: sm columns vs md columns
const SM_COLUMNS: Set<ColumnId> = new Set(['status', 'priority']);
const MD_COLUMNS: Set<ColumnId> = new Set(['assignee', 'creator', 'updated']);

// Grid column header row
function TicketGridHeader({ visibleColumns, mdGridTemplate, onContextMenu }: { visibleColumns?: ColumnId[]; mdGridTemplate?: string; onContextMenu?: (e: React.MouseEvent) => void }) {
  const cols = visibleColumns || ['status', 'priority', 'assignee', 'creator', 'updated', 'score'] as ColumnId[];

  return (
    <div
      className="ticket-grid items-center px-3 sm:px-4 py-2 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider select-none"
      style={mdGridTemplate ? { '--grid-cols': mdGridTemplate } as React.CSSProperties : undefined}
      onContextMenu={onContextMenu}
    >
      <span className="pl-6">Title</span>
      {cols.map((col) => {
        if (col === 'score') return <span key={col} className="text-center">{COLUMN_LABELS[col]}</span>;
        const hiddenClass = SM_COLUMNS.has(col) ? 'hidden sm:block' : MD_COLUMNS.has(col) ? 'hidden md:block' : '';
        return <span key={col} className={hiddenClass}>{COLUMN_LABELS[col]}</span>;
      })}
      <span />
    </div>
  );
}

// Folder section header with collapse, rename, delete + drop target
function FolderHeader({ folder, ticketCount, ticketNames, isExpanded, onToggle, onRename, onDelete, onChangeVisibility, onMoveUp, onMoveDown, isDragActive, draggingTicketId, onTicketDrop, currentUserId, tickets, onFolderDragStart, onFolderDragEnd, draggingFolderId, onFolderDrop, folderDropTargetId, folderDropPosition, setFolderDropTargetId, setFolderDropPosition }: {
  folder: FolderResponse;
  ticketCount: number;
  ticketNames: string[];
  isExpanded: boolean;
  onToggle: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onChangeVisibility?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isDragActive?: boolean;
  draggingTicketId?: string | null;
  onTicketDrop?: (ticketId: string) => void;
  currentUserId?: string | null;
  tickets?: any[];
  onFolderDragStart?: () => void;
  onFolderDragEnd?: () => void;
  draggingFolderId?: string | null;
  onFolderDrop?: (targetFolderId: string, position: 'above' | 'below') => void;
  folderDropTargetId?: string | null;
  folderDropPosition?: 'above' | 'below' | null;
  setFolderDropTargetId?: (id: string | null) => void;
  setFolderDropPosition?: (pos: 'above' | 'below' | null) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const blurEnabledRef = useRef(false);

  // Focus and select text when rename mode activates (after dropdown closes)
  useEffect(() => {
    if (isRenaming) {
      blurEnabledRef.current = false;
      // Delay focus to let the dropdown fully close
      const timer = setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
        blurEnabledRef.current = true;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== folder.name) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  };

  const handleRenameCancel = () => {
    if (!blurEnabledRef.current) return;
    setRenameValue(folder.name);
    setIsRenaming(false);
  };

  // Check if drop is allowed (scope-aware)
  const isDropBlocked = folder.scope === 'private' && draggingTicketId && tickets
    ? (() => {
        const ticket = tickets.find((t: any) => t.id === draggingTicketId);
        return ticket && ticket.createdBy !== currentUserId;
      })()
    : false;

  const isFolderDragTarget = folderDropTargetId === folder.id;
  const showDropAbove = isFolderDragTarget && folderDropPosition === 'above';
  const showDropBelow = isFolderDragTarget && folderDropPosition === 'below';

  return (
    <div
      className={`group/folder sticky top-0 z-10 flex items-center gap-0 px-1 sm:px-2 py-2 hover:bg-[var(--bg-hover)] transition-all border-b border-[var(--border-subtle)] relative ${
        showDropAbove ? 'border-t-2 border-t-[var(--blue)]' : ''
      } ${
        showDropBelow ? 'border-b-2 border-b-[var(--blue)]' : ''
      } ${
        draggingFolderId === folder.id ? 'opacity-40' : ''
      } ${
        isDropBlocked
          ? 'ring-1 ring-red-500/40 ring-inset bg-red-500/5 opacity-60'
          : isDragOver
            ? 'ring-2 ring-[var(--blue)] ring-inset bg-blue-500/10'
            : isDragActive
              ? 'ring-1 ring-[var(--blue)]/40 ring-inset bg-blue-500/5'
              : ''
      }`}
      onDragOver={(e) => {
        // Handle folder reorder drags
        if (e.dataTransfer.types.includes('application/folder-reorder')) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const rect = e.currentTarget.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const pos = e.clientY < midY ? 'above' : 'below';
          setFolderDropTargetId?.(folder.id);
          setFolderDropPosition?.(pos);
          return;
        }
        // Handle ticket drags (existing behavior)
        if (!isDragActive) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = isDropBlocked ? 'none' : 'move';
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setFolderDropTargetId?.(null);
          setFolderDropPosition?.(null);
        }
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        // Handle folder reorder drops
        if (e.dataTransfer.types.includes('application/folder-reorder')) {
          const pos = folderDropPosition || 'below';
          onFolderDrop?.(folder.id, pos);
          setFolderDropTargetId?.(null);
          setFolderDropPosition?.(null);
          return;
        }
        // Handle ticket drops (existing behavior)
        setIsDragOver(false);
        if (isDropBlocked) return;
        const ticketId = e.dataTransfer.getData('text/plain') || draggingTicketId;
        if (ticketId && onTicketDrop) onTicketDrop(ticketId);
      }}
    >
      {/* Drag handle for folder reorder */}
      <div
        className="flex-shrink-0 p-1 rounded cursor-grab opacity-0 group-hover/folder:opacity-100 hover:bg-[var(--bg-hover)] transition-all text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/folder-reorder', folder.id);
          e.dataTransfer.effectAllowed = 'move';
          e.stopPropagation();
          onFolderDragStart?.();
        }}
        onDragEnd={() => {
          onFolderDragEnd?.();
        }}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer px-1" onClick={onToggle}>
        <ChevronDown
          className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${
            !isExpanded ? '-rotate-90' : ''
          }`}
        />
        <FolderOpen className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
        {folder.scope === 'private' && <Lock className="h-3 w-3 text-[var(--text-tertiary)] flex-shrink-0" />}
        {isRenaming ? (
          <input
            ref={renameInputRef}
            className="text-sm font-medium bg-transparent border-b border-[var(--primary)] outline-none text-[var(--text)] px-0 py-0"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameCancel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleRenameSubmit(); }
              if (e.key === 'Escape') handleRenameCancel();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className="text-sm font-medium text-[var(--text-secondary)] truncate">{folder.name}</h3>
        )}
      </div>
      <span className="text-xs font-medium text-[var(--text-tertiary)] flex-shrink-0 tabular-nums">
        {ticketCount}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1 rounded-md sm:opacity-0 sm:group-hover/folder:opacity-100 hover:bg-[var(--bg-hover)] transition-all focus:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => { setRenameValue(folder.name); setIsRenaming(true); }}>
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChangeVisibility?.()}>
            {folder.scope === 'private' ? <Globe className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
            {folder.scope === 'private' ? 'Make team visible' : 'Make private'}
          </DropdownMenuItem>
          {onMoveUp && (
            <DropdownMenuItem onClick={() => onMoveUp()}>
              <ChevronUp className="h-4 w-4 mr-2" />
              Move up
            </DropdownMenuItem>
          )}
          {onMoveDown && (
            <DropdownMenuItem onClick={() => onMoveDown()}>
              <ChevronDown className="h-4 w-4 mr-2" />
              Move down
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-500 focus:text-red-500">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <span>Are you sure you want to delete <span className="font-medium text-[var(--text)]">{folder.name}</span>?</span>
                {ticketCount > 0 ? (
                  <>
                    <span className="block mt-2">
                      {ticketCount === 1 ? '1 ticket' : `${ticketCount} tickets`} inside will be moved to root:
                    </span>
                    <ul className="mt-1.5 space-y-0.5 text-sm">
                      {ticketNames.slice(0, 10).map((name, i) => (
                        <li key={i} className="truncate text-[var(--text-secondary)]">• {name}</li>
                      ))}
                      {ticketNames.length > 10 && (
                        <li className="text-[var(--text-tertiary)]">and {ticketNames.length - 10} more…</li>
                      )}
                    </ul>
                  </>
                ) : (
                  <span className="block mt-2">This folder is empty.</span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Shared helpers
function getTicketStatusKey(ticket: any): 'needs-input' | 'complete' | 'executing' | 'draft' | 'in-progress' | 'needs-resume' {
  if (ticket.status === 'delivered') return 'complete';
  if (ticket.status === 'executing') return 'executing';
  const isPartial = ticket.status === 'draft' && ticket.techSpec &&
    (ticket.techSpec.qualityScore === 0 || ticket.techSpec.qualityScore === undefined);
  if (isPartial) return 'needs-resume';
  if (ticket.status === 'draft' && !ticket.techSpec && ticket.currentRound !== undefined) return 'in-progress';
  if (ticket.status === 'draft' && !ticket.techSpec) return 'draft';
  if (ticket.questions && ticket.questions.length > 0) return 'needs-input';
  return 'draft';
}

function isTicketInProgress(ticket: any) {
  return ticket.status === 'draft' && !ticket.techSpec && ticket.currentRound !== undefined;
}

/** Inline ghost row for quick-adding a ticket inside a folder */
function InlineFolderAdd({ folderId }: { folderId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (trimmed.length < 3 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { quickCreateDraft } = useTicketsStore.getState();
      const aec = await quickCreateDraft(trimmed, undefined, undefined, folderId);
      if (aec) {
        setTitle('');
        setIsEditing(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setTitle('');
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full flex items-center gap-2 pl-10 pr-4 py-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
      >
        <Plus className="h-3 w-3" />
        <span>New ticket</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 pl-10 pr-4 py-1.5 border border-[var(--border-subtle)] rounded-lg mx-2 my-1 bg-[var(--bg-subtle)]/30">
      <Plus className="h-3 w-3 text-[var(--text-tertiary)] flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (!title.trim()) { setTitle(''); setIsEditing(false); } }}
        placeholder="Ticket title… (Enter to create)"
        disabled={isSubmitting}
        className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:outline-none focus-visible:outline-none disabled:opacity-50"
      />
      {isSubmitting && <Loader2 className="h-3 w-3 animate-spin text-[var(--text-tertiary)]" />}
    </div>
  );
}

/** Inline ghost row for quick-adding a ticket at the root level (no folder) */
function InlineRootAdd() {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (trimmed.length < 3 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { quickCreateDraft } = useTicketsStore.getState();
      const aec = await quickCreateDraft(trimmed);
      if (aec) {
        setTitle('');
        setIsEditing(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setTitle('');
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
      >
        <Plus className="h-3 w-3" />
        <span>New ticket</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border border-[var(--border-subtle)] rounded-lg mx-2 my-1 bg-[var(--bg-subtle)]/30">
      <Plus className="h-3 w-3 text-[var(--text-tertiary)] flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (!title.trim()) { setTitle(''); setIsEditing(false); } }}
        placeholder="Ticket title… (Enter to create)"
        disabled={isSubmitting}
        className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:outline-none focus-visible:outline-none disabled:opacity-50"
      />
      {isSubmitting && <Loader2 className="h-3 w-3 animate-spin text-[var(--text-tertiary)]" />}
    </div>
  );
}

function getRelativeTime(date: string | Date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StatusCell({ ticket }: { ticket: any }) {
  const ticketStatus = getTicketStatusKey(ticket);
  if (ticketStatus === 'needs-resume') return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] truncate">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />Needs Resume
    </span>
  );
  if (isTicketInProgress(ticket)) return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] truncate">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />In Progress
    </span>
  );
  const statusCfg = TICKET_STATUS_CONFIG[ticket.status] ?? TICKET_STATUS_CONFIG.draft;
  const cfg = { dot: statusCfg.dotClass, label: statusCfg.label, text: statusCfg.textClass };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] truncate ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />{cfg.label}
    </span>
  );
}

function PriorityCell({ priority }: { priority: string | null }) {
  if (!priority) return <span className="text-[11px] text-[var(--text-tertiary)]">—</span>;
  const map: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  const label = map[priority];
  if (!label) return null;
  return (
    <span className="text-[11px] text-[var(--text-tertiary)] truncate">
      {label}
    </span>
  );
}

function WaitBadge({ approvedAt }: { approvedAt: string | null }) {
  if (!approvedAt) return null;

  const days = Math.floor((Date.now() - new Date(approvedAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return null; // approved today, no badge

  const color = days <= 1
    ? 'text-emerald-400/70'
    : days <= 3
      ? 'text-amber-400/70'
      : 'text-red-400/70';

  const label = days === 1 ? '1 day' : `${days} days`;

  return (
    <span className={`text-[10px] ${color}`}>
      {label}
    </span>
  );
}

// Archived tickets collapsible section
function ArchivedSection({
  archivedTickets,
  isLoading,
  showArchived,
  onToggle,
  onUnarchive,
}: {
  archivedTickets: any[];
  isLoading: boolean;
  showArchived: boolean;
  onToggle: () => void;
  onUnarchive: (id: string) => Promise<boolean>;
}) {
  const router = useRouter();

  // Don't render anything until we know there are archived tickets (or section is open)
  if (!showArchived && archivedTickets.length === 0 && !isLoading) {
    // Render a clickable probe that fetches count on first click
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <Archive className="h-3.5 w-3.5" />
        View archived tickets
      </button>
    );
  }

  // After fetching, if truly empty, show nothing
  if (!showArchived && !isLoading && archivedTickets.length === 0) {
    return null;
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 py-3 px-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        {showArchived ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <Archive className="h-3.5 w-3.5" />
        <span>
          {isLoading
            ? 'Loading archived tickets...'
            : `${archivedTickets.length} archived ticket${archivedTickets.length !== 1 ? 's' : ''}`}
        </span>
      </button>

      {showArchived && (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
            </div>
          ) : archivedTickets.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-xs text-[var(--text-tertiary)]">
              No archived tickets
            </div>
          ) : (
            archivedTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="group flex items-center gap-3 px-3 sm:px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex-shrink-0 opacity-40">
                  {getTypeIcon(ticket.type)}
                </div>
                <button
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                  className="flex-1 text-left text-sm text-[var(--text-secondary)] truncate hover:text-[var(--text)] transition-colors"
                >
                  {ticket.title}
                </button>
                <span className="hidden sm:block text-[10px] text-[var(--text-tertiary)] tabular-nums flex-shrink-0">
                  {new Date(ticket.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={async () => {
                    const success = await onUnarchive(ticket.id);
                    if (success) toast.success('Ticket restored');
                    else toast.error('Failed to restore ticket');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Restore</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Grid-based ticket row
function TicketRow({ ticket, folders = [], onDragStart, onDragEnd, nested, currentUserId, visibleColumns, mdGridTemplate }: {
  ticket: any;
  folders?: FolderResponse[];
  onDragStart?: (ticketId: string) => void;
  onDragEnd?: () => void;
  nested?: boolean;
  currentUserId?: string | null;
  visibleColumns?: ColumnId[];
  mdGridTemplate?: string;
}) {
  const router = useRouter();
  const { deleteTicket, archiveTicket, loadTickets } = useTicketsStore();
  const { teamMembers, currentTeam } = useTeamStore();
  const { moveTicket } = useFoldersStore();
  const { tags } = useTagsStore();
  const { ticketService } = useServices();
  const ticketStatus = getTicketStatusKey(ticket);
  const isDraft = ticketStatus === 'draft' || ticketStatus === 'in-progress' || ticketStatus === 'needs-resume';
  const href = isDraft ? `/tickets/create?resume=${ticket.id}` : `/tickets/${ticket.slug || ticket.id}`;
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // Resolve tag IDs to tag objects
  const visibleTicketTags = useMemo(() => {
    const ticketTagIds = ticket.tagIds ?? [];
    if (ticketTagIds.length === 0) return [];
    return tags.filter(t => ticketTagIds.includes(t.id));
  }, [ticket.tagIds, tags]);

  const handleTagsChange = useCallback(async (tagIds: string[]) => {
    try {
      await ticketService.updateTicketTags(ticket.id, tagIds);
      loadTickets();
    } catch {
      toast.error('Failed to update tags');
    }
  }, [ticket.id, ticketService, loadTickets]);

  const handleOpen = () => router.push(href);

  const handleDelete = async () => {
    const success = await deleteTicket(ticket.id);
    if (success) toast.success('Ticket deleted');
    else toast.error('Failed to delete ticket');
  };

  // Filter out private folders when the ticket doesn't belong to current user
  const movableFolders = folders.filter((f) => {
    if (f.id === ticket.folderId) return false;
    if (f.scope === 'private' && ticket.createdBy !== currentUserId) return false;
    return true;
  });

  const cols = visibleColumns || ['status', 'priority', 'assignee', 'creator', 'updated', 'score'] as ColumnId[];

  // Column rendering map
  const renderColumn = (col: ColumnId) => {
    switch (col) {
      case 'status':
        return (
          <Link key={col} href={href} className="hidden sm:flex items-center gap-1.5 py-3">
            <TicketLifecycleInfo currentStatus={ticket.status} trigger="hover">
              <StatusCell ticket={ticket} />
            </TicketLifecycleInfo>
            {ticket.status === 'approved' && <WaitBadge approvedAt={ticket.approvedAt} />}
          </Link>
        );
      case 'priority':
        return (
          <Link key={col} href={href} className="hidden sm:flex items-center py-3">
            <PriorityCell priority={ticket.priority} />
          </Link>
        );
      case 'assignee':
        return (
          <div key={col} className="hidden md:flex items-center py-3">
            <AssigneeCell ticket={ticket} teamMembers={teamMembers} />
          </div>
        );
      case 'creator':
        return (
          <div key={col} className="hidden md:flex items-center py-3">
            <CreatorCell ticket={ticket} teamMembers={teamMembers} />
          </div>
        );
      case 'updated':
        return (
          <Link key={col} href={href} className="hidden md:flex items-center py-3">
            <span className="text-[11px] text-[var(--text-tertiary)]">{getRelativeTime(ticket.updatedAt)}</span>
          </Link>
        );
      case 'score':
        return (
          <Link key={col} href={href} className="flex items-center justify-center py-3">
            <ProgressRing ticket={ticket} />
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <div
      draggable={!isMobile}
      onDragStart={(e) => {
        // Create a semi-transparent ghost of the row
        const row = e.currentTarget;
        const ghost = row.cloneNode(true) as HTMLElement;
        ghost.style.width = `${row.offsetWidth}px`;
        ghost.style.opacity = '0.35';
        ghost.style.position = 'absolute';
        ghost.style.top = '-9999px';
        ghost.style.left = '-9999px';
        ghost.style.pointerEvents = 'none';
        document.body.appendChild(ghost);
        const rect = row.getBoundingClientRect();
        e.dataTransfer.setDragImage(ghost, e.clientX - rect.left, e.clientY - rect.top);
        requestAnimationFrame(() => document.body.removeChild(ghost));

        e.dataTransfer.setData('text/plain', ticket.id);
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
        onDragStart?.(ticket.id);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd?.();
      }}
      className={`group ticket-grid items-center px-3 sm:px-4 py-0 hover:bg-[var(--bg-hover)] transition-colors cursor-grab active:cursor-grabbing [&_a]:cursor-pointer ${
        ticketStatus === 'needs-resume' ? 'bg-red-500/5' : ''
      } ${isDragging ? 'opacity-50' : ''} ${nested ? 'bg-white/[0.02] dark:bg-white/[0.02]' : ''}`}
      style={mdGridTemplate ? { '--grid-cols': mdGridTemplate } as React.CSSProperties : undefined}
    >
      {/* Title cell */}
      <Link href={href} className={`flex items-center gap-2 py-3 min-w-0 pr-3 ${nested ? 'pl-6' : ''}`}>
        {nested && <span className="w-3 h-px bg-[var(--border-subtle)] flex-shrink-0 -ml-3" />}
        <span className="flex-shrink-0">{getTypeIcon(ticket.type)}</span>
        <span className={`text-[var(--text-sm)] truncate group-hover:text-[var(--text)] transition-colors ${
          ticketStatus === 'needs-input' || ticketStatus === 'needs-resume'
            ? 'font-medium text-[var(--text)]'
            : 'font-normal text-[var(--text-secondary)]'
        }`}>
          {ticket.title}
        </span>
        {ticketStatus === 'needs-resume' && <span className="flex-shrink-0 text-red-500 text-xs">{'\u274C'}</span>}
        {/* Tag pills */}
        {visibleTicketTags.length > 0 && (
          <span className="flex items-center gap-1 flex-shrink-0 ml-1">
            {visibleTicketTags.slice(0, 3).map(tag => (
              <span key={tag.id} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getTagColor(tag.color).pill}`}>
                {tag.scope === 'private' && <Lock className="h-2 w-2" />}
                {tag.name}
              </span>
            ))}
            {visibleTicketTags.length > 3 && (
              <span className="text-[10px] text-[var(--text-tertiary)]">+{visibleTicketTags.length - 3}</span>
            )}
          </span>
        )}
      </Link>

      {/* Dynamic columns */}
      {cols.map(renderColumn)}

      {/* Actions */}
      <div className="flex items-center justify-center py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 rounded-md sm:opacity-0 sm:group-hover:opacity-100 hover:bg-[var(--bg-subtle)] transition-all focus:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handleOpen}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/tickets/${ticket.id}`)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Tag className="h-4 w-4 mr-2" />
                Tags...
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56 p-0">
                <TagPicker ticketId={ticket.id} currentTagIds={ticket.tagIds ?? []} onTagsChange={handleTagsChange} />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {(movableFolders.length > 0 || ticket.folderId) && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderInput className="h-4 w-4 mr-2" />
                  Move to...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40">
                  {ticket.folderId && (
                    <DropdownMenuItem onSelect={() => {
                      if (currentTeam?.id) {
                        moveTicket(currentTeam.id, ticket.id, null).then((ok) => {
                          if (ok) { loadTickets(); toast.success('Moved to root'); }
                          else toast.error('Failed to move ticket');
                        });
                      }
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Unfiled
                    </DropdownMenuItem>
                  )}
                  {movableFolders.map((folder) => (
                      <DropdownMenuItem key={folder.id} onSelect={() => {
                        const targetFolderId = folder.id;
                        const targetFolderName = folder.name;
                        if (currentTeam?.id) {
                          moveTicket(currentTeam.id, ticket.id, targetFolderId).then((ok) => {
                            if (ok) { loadTickets(); toast.success(`Moved to ${targetFolderName}`); }
                            else toast.error('Failed to move ticket');
                          });
                        }
                      }}>
                        <FolderOpen className="h-4 w-4 mr-2" />
                        {folder.scope === 'private' && <Lock className="h-3 w-3 mr-1 text-[var(--text-tertiary)]" />}
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => {
              const success = await archiveTicket(ticket.id);
              if (success) toast.success('Ticket archived');
              else toast.error('Failed to archive ticket');
            }}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-500 focus:text-red-500">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete ticket</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <span className="font-medium text-[var(--text)]">{ticket.title}</span>. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Lifecycle state info for tooltip
function getLifecycleInfo(ticket: any): { label: string; colorClass: string; dot: string; next: string } {
  const key = getTicketStatusKey(ticket);
  if (key === 'needs-resume') return { label: 'Broken Spec', colorClass: 'text-red-500', dot: 'bg-red-500', next: 'Resume ticket creation to fix the spec' };
  if (key === 'in-progress') return { label: 'Being Enriched', colorClass: 'text-blue-500', dot: 'bg-blue-500', next: 'AI is generating the technical spec' };
  if (key === 'needs-input') return { label: 'Needs Input', colorClass: 'text-amber-500', dot: 'bg-amber-500', next: 'Answer the questions to continue' };
  const map: Record<string, { label: string; colorClass: string; dot: string; next: string }> = {
    delivered:             { label: 'Done',               colorClass: 'text-green-500',              dot: 'bg-green-500',              next: 'Implementation is complete' },
    approved:              { label: 'Ready',              colorClass: 'text-amber-500',              dot: 'bg-amber-500',              next: 'Run forge execute to implement' },
    refined:               { label: 'PM Review',          colorClass: 'text-amber-500',              dot: 'bg-amber-500',              next: 'PM reviews and approves the spec' },
    executing:             { label: 'Executing',          colorClass: 'text-blue-500',               dot: 'bg-blue-500',               next: 'Review and merge the implementation' },
    defined:               { label: 'Dev Review',         colorClass: 'text-purple-500',             dot: 'bg-purple-500',             next: 'Developer reviews and refines the spec' },
    draft:                 { label: 'Define',            colorClass: 'text-[var(--text-tertiary)]', dot: 'bg-[var(--text-tertiary)]', next: 'Complete the ticket enrichment flow' },
  };
  return map[ticket.status] ?? { label: 'Unknown', colorClass: 'text-[var(--text-tertiary)]', dot: 'bg-[var(--text-tertiary)]', next: '' };
}

function AssigneeCell({ ticket, teamMembers }: { ticket: any; teamMembers: any[] }) {
  const info = getLifecycleInfo(ticket);
  const member = ticket.assignedTo ? teamMembers.find((m) => m.userId === ticket.assignedTo) : null;
  const name = member ? (member.displayName || member.email || null) : null;

  return (
    <div className="relative group/assignee w-full">
      {name ? (
        <span className="text-[11px] text-[var(--text-secondary)] truncate block max-w-full cursor-default">
          {name}
        </span>
      ) : (
        <span className="text-[11px] text-[var(--text-tertiary)]/40 cursor-default">—</span>
      )}

      {/* Lifecycle tooltip */}
      <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden group-hover/assignee:block z-50 w-48 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-2 shadow-xl">
        <div className={`flex items-center gap-1.5 text-[11px] font-medium ${info.colorClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${info.dot}`} />
          {info.label}
        </div>
        {info.next && (
          <p className="mt-1 text-[10px] text-[var(--text-tertiary)] leading-tight">{info.next}</p>
        )}
      </div>
    </div>
  );
}

function CreatorCell({ ticket, teamMembers }: { ticket: any; teamMembers: any[] }) {
  const member = ticket.createdBy ? teamMembers.find((m) => m.userId === ticket.createdBy) : null;
  const name = member ? (member.displayName || member.email || null) : null;
  return name ? (
    <span className="text-[11px] text-[var(--text-secondary)] truncate block max-w-full cursor-default">{name}</span>
  ) : (
    <span className="text-[11px] text-[var(--text-tertiary)]/40 cursor-default">{'\u2014'}</span>
  );
}

// Extract progress ring to a separate component
function ProgressRing({ ticket }: { ticket: any }) {
  const readinessScore = ticket.techSpec?.qualityScore ?? ticket.readinessScore ?? 0;

  // Get progress color based on score
  const getProgressColor = () => {
    return 'var(--text-tertiary)';
  };

  const progressColor = getProgressColor();

  // Get progress tooltip
  const getProgressTooltip = () => {
    if (readinessScore === 0) return 'Not started';
    if (ticket.questions && ticket.questions.length > 0) {
      return "";
    }
    return `${readinessScore}% complete`;
  };

  return (
    <div className="flex-shrink-0 relative h-6 w-6 sm:h-8 sm:w-8 group/progress" title={getProgressTooltip()}>
      <svg className="h-6 w-6 sm:h-8 sm:w-8 -rotate-90" viewBox="0 0 32 32">
        <circle
          cx="16" cy="16" r="13"
          fill="none"
          stroke="var(--border)"
          strokeWidth="2.5"
          opacity="0.3"
        />
        <circle
          cx="16" cy="16" r="13"
          fill="none"
          stroke={progressColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${(readinessScore / 100) * 81.68} 81.68`}
          opacity={readinessScore > 0 ? 1 : 0.2}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[7px] sm:text-[9px] font-medium ${
        readinessScore === 0 ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'
      }`}>
        {readinessScore}
      </span>
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover/progress:block whitespace-nowrap rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-2 py-1 text-[10px] sm:text-[11px] text-[var(--text-secondary)] shadow-lg z-50">
        {getProgressTooltip()}
      </div>
    </div>
  );
}
