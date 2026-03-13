'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Input } from '@/core/components/ui/input';
import { Button } from '@/core/components/ui/button';
import Link from 'next/link';
import { useTicketsStore } from '@/stores/tickets.store';
import { useFoldersStore } from '@/stores/folders.store';
import type { FolderResponse } from '@/services/folder.service';
import { TicketSkeletonRow } from '@/tickets/components/TicketSkeletonRow';
import { CreationMenu } from '@/tickets/components/CreationMenu';
import { useTeamStore } from '@/teams/stores/team.store';
import { Loader2, SlidersHorizontal, Lightbulb, Bug, ClipboardList, Ban, X, ChevronDown, Search, FileText, Plus, MoreVertical, ExternalLink, Archive, Trash2, UserPlus, FolderOpen, FolderPlus, Pencil, FolderInput } from 'lucide-react';
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
import { TicketLifecycleInfo } from '@/tickets/components/detail/TicketLifecycleInfo';
import { TICKET_STATUS_CONFIG } from '@/tickets/config/ticketStatusConfig';

type SortBy = 'updated' | 'created' | 'priority' | 'progress';
type SortDirection = 'desc' | 'asc';

// Helper function to get type icon
function getTypeIcon(type: string | null) {
  switch (type) {
    case 'bug':
      return <Bug className="h-3.5 w-3.5 text-red-500" />;
    case 'task':
      return <ClipboardList className="h-3.5 w-3.5 text-blue-500" />;
    case 'feature':
    default:
      return <Lightbulb className="h-3.5 w-3.5 text-amber-500" />;
  }
}

export default function TicketsListPage() {
  const { tickets, isLoading, isInitialLoad, loadError, loadTickets, quota, fetchQuota, listPreferences, setListPreferences } = useTicketsStore();
  const { currentTeam, loadTeamMembers } = useTeamStore();
  const { folders, loadFolders, createFolder, renameFolder, deleteFolder, moveTicket, expandedFolders, toggleFolder } = useFoldersStore();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isSubmittingFolder, setIsSubmittingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>(listPreferences?.priorityFilter || 'all');
  const [typeFilter, setTypeFilter] = useState<string>(listPreferences?.typeFilter || 'all');
  const [showFilter, setShowFilter] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>((listPreferences?.sortBy as any) || 'updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);

  const handleDragStart = useCallback((ticketId: string) => {
    setDraggingTicketId(ticketId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingTicketId(null);
  }, []);

  const handleTicketDrop = useCallback(async (ticketId: string, folderId: string | null) => {
    if (!currentTeam?.id) return;
    const ok = await moveTicket(currentTeam.id, ticketId, folderId);
    if (ok) {
      loadTickets();
      toast.success(folderId ? `Moved to folder` : 'Moved to unfiled');
    } else {
      toast.error('Failed to move ticket');
    }
  }, [currentTeam?.id, moveTicket, loadTickets]);

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
    }
  }, [loadTickets, fetchQuota, loadTeamMembers, loadFolders, currentTeam?.id]);

  const allTickets = tickets;

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

        return matchesSearch && matchesPriority && matchesType;
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
  }, [allTickets, debouncedSearch, priorityFilter, typeFilter, sortBy, sortDirection]);

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
    });
  }, [sortBy, priorityFilter, typeFilter, setListPreferences]);

  const sortLabel = {
      updated: 'Recently updated',
      created: 'Recently created',
      priority: 'Priority',
      progress: 'Progress',
    }[sortBy];

    return (
      <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto px-3 sm:px-6">
      {/* Filter, Sort & Actions bar */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input
            placeholder="Search tickets..."
            className="pl-9 pr-8 text-xs sm:text-sm"
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

        {/* Sort dropdown */}
        <div className="relative flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="hidden sm:flex text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            <span>{sortLabel}</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="sm:hidden text-[var(--text-tertiary)]"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
              <div className="absolute left-0 sm:right-0 right-0 top-full mt-1 z-50 min-w-[180px] rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]/40 p-1.5 shadow-lg">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilter((v) => !v)}
            className={`${priorityFilter !== 'all' || typeFilter !== 'all' ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {showFilter && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-56 sm:w-auto sm:min-w-[160px] rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]/40 p-1.5 shadow-lg space-y-2">
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
                <div className="border-t border-[var(--border)]/30 pt-2">
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
              </div>
            </>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* New Folder & Create */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreatingFolder(true)}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text)] flex-shrink-0"
        >
          <FolderPlus className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">New Folder</span>
        </Button>
        {quota && !quota.canCreate ? (
          <div className="relative group flex-shrink-0">
            <CreationMenu disabled={true} />
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 whitespace-nowrap rounded-md bg-[var(--bg-subtle)] border border-[var(--border)]/40 px-3 py-1.5 text-[10px] sm:text-[11px] text-[var(--text-secondary)] shadow-lg">
              Ticket limit reached ({quota.used}/{quota.limit})
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0">
            <CreationMenu disabled={false} />
          </div>
        )}
      </div>

      {/* Loading state: Show skeletons when loading (including team switches) */}
      {isLoading && (
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
      {!isLoading && !loadError && filteredTickets.length === 0 && folders.length === 0 && (
        <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          <TicketGridHeader />
          {isCreatingFolder && (
            <form
              className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)]"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newFolderName.trim() || !currentTeam?.id || isSubmittingFolder) return;
                const name = newFolderName.trim();
                setIsSubmittingFolder(true);
                try {
                  const result = await createFolder(currentTeam.id, name);
                  if (result) toast.success('Folder created');
                  setNewFolderName('');
                  setIsCreatingFolder(false);
                } catch {
                  toast.error('Failed to create folder');
                } finally {
                  setIsSubmittingFolder(false);
                }
              }}
            >
              <FolderOpen className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
              <input
                autoFocus
                placeholder="Folder name..."
                className="flex-1 text-sm bg-transparent outline-none text-[var(--text)] placeholder:text-[var(--text-tertiary)]"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setNewFolderName('');
                    setIsCreatingFolder(false);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!newFolderName.trim() || isSubmittingFolder}
                className="p-1 rounded hover:bg-[var(--bg-hover)] text-green-500 hover:text-green-400 disabled:opacity-30 transition-colors"
                aria-label="Create folder"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => { setNewFolderName(''); setIsCreatingFolder(false); }}
                className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}
          <div className="flex min-h-[300px] sm:min-h-[400px] items-center justify-center">
            <div className="text-center px-4">
              {searchQuery || priorityFilter !== 'all' || typeFilter !== 'all' ? (
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

      {!isLoading && !loadError && (filteredTickets.length > 0 || folders.length > 0) && (
        <div className="rounded-lg overflow-hidden  border border-[var(--border-subtle)]">
          {/* Column headers */}
          <TicketGridHeader />

          {/* Inline folder creation */}
          {isCreatingFolder && (
            <form
              className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)]"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newFolderName.trim() || !currentTeam?.id || isSubmittingFolder) return;
                const name = newFolderName.trim();
                setIsSubmittingFolder(true);
                try {
                  const result = await createFolder(currentTeam.id, name);
                  if (result) toast.success('Folder created');
                  setNewFolderName('');
                  setIsCreatingFolder(false);
                } catch {
                  toast.error('Failed to create folder');
                } finally {
                  setIsSubmittingFolder(false);
                }
              }}
            >
              <FolderOpen className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
              <input
                autoFocus
                placeholder="Folder name..."
                className="flex-1 text-sm bg-transparent outline-none text-[var(--text)] placeholder:text-[var(--text-tertiary)]"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setNewFolderName('');
                    setIsCreatingFolder(false);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!newFolderName.trim() || isSubmittingFolder}
                className="p-1 rounded hover:bg-[var(--bg-hover)] text-green-500 hover:text-green-400 disabled:opacity-30 transition-colors"
                aria-label="Create folder"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewFolderName('');
                  setIsCreatingFolder(false);
                }}
                className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                aria-label="Cancel"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </form>
          )}

          {/* Folder sections (always on top, alphabetical) */}
          {folders.map((folder) => {
            const folderTickets = folderTicketsMap[folder.id] || [];
            const isExpanded = expandedFolders.has(folder.id);
            return (
              <div key={folder.id}>
                <FolderHeader
                  folder={folder}
                  ticketCount={folderTickets.length}
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
                    if (confirm(`Delete folder "${folder.name}"? Tickets inside will move to root.`)) {
                      if (currentTeam?.id) {
                        const ok = await deleteFolder(currentTeam.id, folder.id);
                        if (ok) { toast.success('Folder deleted'); loadTickets(); }
                        else toast.error('Failed to delete folder');
                      }
                    }
                  }}
                  isDragActive={!!draggingTicketId}
                  draggingTicketId={draggingTicketId}
                  onTicketDrop={(ticketId) => handleTicketDrop(ticketId, folder.id)}
                />
                {isExpanded && (
                  folderTickets.length > 0 ? (
                    <div>
                      {folderTickets.map((ticket) => (
                        <TicketRow key={ticket.id} ticket={ticket} folders={folders} onDragStart={handleDragStart} onDragEnd={handleDragEnd} nested />
                      ))}
                    </div>
                  ) : (
                    <div className="pl-10 py-3 text-xs text-[var(--text-tertiary)] bg-[var(--bg-subtle)]/30 border-b border-[var(--border-subtle)]">
                      No tickets in this folder
                    </div>
                  )
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
                <TicketRow key={ticket.id} ticket={ticket} folders={folders} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Drop zone for removing tickets from folders
function UnfiledDropZone({ draggingTicketId, onTicketDrop }: { draggingTicketId: string | null; onTicketDrop: (ticketId: string) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`flex items-center justify-center px-4 py-2.5 border-b border-dashed border-[var(--border-subtle)] transition-all text-xs ${
        isDragOver
          ? 'border-[var(--blue)] bg-[var(--bg-active)] text-[var(--text-secondary)]'
          : 'text-[var(--text-tertiary)]'
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

// Grid column header row
function TicketGridHeader() {
  return (
    <div className="ticket-grid items-center px-3 sm:px-4 py-2 bg-[var(--bg-subtle)]/40 border-b border-[var(--border-subtle)] text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider select-none">
      <span className="pl-6">Title</span>
      <span className="hidden sm:block">Status</span>
      <span className="hidden sm:block">Priority</span>
      <span className="hidden md:block">Assignee</span>
      <span className="hidden md:block">Updated</span>
      <span className="text-center">Score</span>
      <span />
    </div>
  );
}

// Folder section header with collapse, rename, delete + drop target
function FolderHeader({ folder, ticketCount, isExpanded, onToggle, onRename, onDelete, isDragActive, draggingTicketId, onTicketDrop }: {
  folder: FolderResponse;
  ticketCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  isDragActive?: boolean;
  draggingTicketId?: string | null;
  onTicketDrop?: (ticketId: string) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [isDragOver, setIsDragOver] = useState(false);
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

  return (
    <div
      className={`group/folder sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] transition-all border-b border-[var(--border-subtle)] ${
        isDragOver ? 'ring-2 ring-[var(--blue)] ring-inset bg-[var(--bg-active)]' : ''
      }`}
      onDragOver={(e) => {
        if (!isDragActive) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const ticketId = e.dataTransfer.getData('text/plain') || draggingTicketId;
        if (ticketId && onTicketDrop) onTicketDrop(ticketId);
      }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
        <ChevronDown
          className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform flex-shrink-0 ${
            !isExpanded ? '-rotate-90' : ''
          }`}
        />
        <FolderOpen className="h-4 w-4 text-amber-500/70 flex-shrink-0" />
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
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => { setRenameValue(folder.name); setIsRenaming(true); }}>
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Shared helpers
function getTicketStatusKey(ticket: any): 'needs-input' | 'complete' | 'draft' | 'in-progress' | 'needs-resume' {
  if (ticket.status === 'complete') return 'complete';
  const isPartial = ticket.status === 'draft' && ticket.techSpec &&
    (ticket.techSpec.qualityScore === 0 || ticket.techSpec.qualityScore === undefined);
  if (isPartial) return 'needs-resume';
  if (ticket.status === 'draft' && !ticket.techSpec && ticket.currentRound !== undefined) return 'in-progress';
  if (ticket.status === 'draft' && !ticket.techSpec) return 'draft';
  if (ticket.questions && ticket.questions.length > 0) return 'needs-input';
  return 'draft';
}

function isTicketInProgress(ticket: any) {
  return ticket.status === 'draft' && !ticket.techSpec;
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
    <span className="inline-flex items-center gap-1.5 text-[11px] text-red-500 truncate">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />Needs Resume
    </span>
  );
  if (isTicketInProgress(ticket)) return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-500 truncate">
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
  const map: Record<string, { dot: string; label: string }> = {
    low:    { dot: 'bg-green-500',  label: 'Low'    },
    medium: { dot: 'bg-yellow-500', label: 'Medium' },
    high:   { dot: 'bg-orange-500', label: 'High'   },
    urgent: { dot: 'bg-red-500',    label: 'Urgent' },
  };
  const c = map[priority];
  if (!c) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] truncate">
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${c.dot}`} />{c.label}
    </span>
  );
}

// Grid-based ticket row
function TicketRow({ ticket, folders = [], onDragStart, onDragEnd, nested }: {
  ticket: any;
  folders?: FolderResponse[];
  onDragStart?: (ticketId: string) => void;
  onDragEnd?: () => void;
  nested?: boolean;
}) {
  const router = useRouter();
  const { deleteTicket, loadTickets } = useTicketsStore();
  const { teamMembers, currentTeam } = useTeamStore();
  const { moveTicket } = useFoldersStore();
  const ticketStatus = getTicketStatusKey(ticket);
  const inProgress = isTicketInProgress(ticket);
  const href = inProgress ? `/tickets/create?resume=${ticket.id}` : `/tickets/${ticket.id}`;
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const handleOpen = () => router.push(href);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this ticket?')) {
      const success = await deleteTicket(ticket.id);
      if (success) toast.success('Ticket deleted');
      else toast.error('Failed to delete ticket');
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
      className={`group ticket-grid items-center px-3 sm:px-4 py-0 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors cursor-grab active:cursor-grabbing ${
        ticketStatus === 'needs-resume' ? 'bg-red-500/5' : ''
      } ${isDragging ? 'opacity-50' : ''} ${nested ? 'bg-white/[0.02] dark:bg-white/[0.02]' : ''}`}
    >
      {/* Title cell */}
      <Link href={href} className={`flex items-center gap-2 py-3 min-w-0 pr-3 ${nested ? 'pl-6' : ''}`}>
        {nested && <span className="w-3 h-px bg-[var(--border-subtle)] flex-shrink-0 -ml-3" />}
        <span className="flex-shrink-0">{getTypeIcon(ticket.type)}</span>
        <span className={`text-[var(--text-sm)] truncate group-hover:text-[var(--text)] transition-colors ${
          ticketStatus === 'needs-input' || ticketStatus === 'needs-resume'
            ? 'font-semibold text-[var(--text)]'
            : 'font-medium text-[var(--text-secondary)]'
        }`}>
          {ticket.title}
        </span>
        {ticketStatus === 'needs-resume' && <span className="flex-shrink-0 text-red-500 text-xs">❌</span>}
      </Link>

      {/* Status */}
      <Link href={href} className="hidden sm:flex items-center py-3">
        <TicketLifecycleInfo currentStatus={ticket.status} trigger="hover">
          <StatusCell ticket={ticket} />
        </TicketLifecycleInfo>
      </Link>

      {/* Priority */}
      <Link href={href} className="hidden sm:flex items-center py-3">
        <PriorityCell priority={ticket.priority} />
      </Link>

      {/* Assignee */}
      <div className="hidden md:flex items-center py-3">
        <AssigneeCell ticket={ticket} teamMembers={teamMembers} />
      </div>

      {/* Updated */}
      <Link href={href} className="hidden md:flex items-center py-3">
        <span className="text-[11px] text-[var(--text-tertiary)]">{getRelativeTime(ticket.updatedAt)}</span>
      </Link>

      {/* Progress ring */}
      <Link href={href} className="flex items-center justify-center py-3">
        <ProgressRing ticket={ticket} />
      </Link>

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
            {folders.length > 0 && (
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
                  {folders
                    .filter((f) => f.id !== ticket.folderId)
                    .map((folder) => (
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
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info('Archive feature coming soon')}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-500 focus:text-red-500">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
    complete:              { label: 'Done',              colorClass: 'text-green-500',              dot: 'bg-green-500',              next: 'Ready to ship' },
    forged:                { label: 'Forged',            colorClass: 'text-amber-500',              dot: 'bg-amber-500',              next: 'Run forge execute to implement' },
    review:                { label: 'Review (PM)',       colorClass: 'text-amber-500',              dot: 'bg-amber-500',              next: 'PM needs to review and approve' },
    executing:             { label: 'Executing',         colorClass: 'text-blue-500',               dot: 'bg-blue-500',               next: 'Review and merge the implementation' },
    'dev-refining':        { label: 'Dev-Refine',        colorClass: 'text-purple-500',             dot: 'bg-purple-500',             next: 'Developer reviews and refines the spec' },
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

// Extract progress ring to a separate component
function ProgressRing({ ticket }: { ticket: any }) {
  const readinessScore = ticket.techSpec?.qualityScore ?? ticket.readinessScore ?? 0;

  // Get progress color based on score
  const getProgressColor = () => {
    if (readinessScore === 0) return 'var(--text-tertiary)';
    if (readinessScore < 65) return '#3b82f6'; // blue
    if (readinessScore < 85) return '#f59e0b'; // amber
    return '#22c55e'; // green
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
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover/progress:block whitespace-nowrap rounded-md bg-[var(--bg-subtle)] border border-[var(--border)]/40 px-2 py-1 text-[10px] sm:text-[11px] text-[var(--text-secondary)] shadow-lg z-50">
        {getProgressTooltip()}
      </div>
    </div>
  );
}
