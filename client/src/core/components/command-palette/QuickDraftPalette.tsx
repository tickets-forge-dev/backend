'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  FileText,
  LayoutGrid,
  Search,
  Loader2,
  ArrowLeft,
  Lightbulb,
  Bug,
  ClipboardList,
  ChevronDown,
  FolderOpen,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { useTicketsStore } from '@/stores/tickets.store';
import { useFoldersStore } from '@/stores/folders.store';

type DraftType = 'feature' | 'bug' | 'task';
type DraftPriority = 'low' | 'medium' | 'high' | 'urgent';

const TYPE_OPTIONS: { value: DraftType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'feature', label: 'Feature', icon: Lightbulb, color: 'text-amber-500' },
  { value: 'bug', label: 'Bug', icon: Bug, color: 'text-red-500' },
  { value: 'task', label: 'Task', icon: ClipboardList, color: 'text-blue-500' },
];

const PRIORITY_OPTIONS: { value: DraftPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500' },
];

interface Command {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string[];
  group: string;
  action: () => void;
}

type PaletteMode = 'commands' | 'create-draft';

export function QuickDraftPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { isQuickCreating, quickCreateError, quickCreateDraft, clearQuickCreateError } =
    useTicketsStore();
  const { folders } = useFoldersStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<PaletteMode>('commands');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftType, setDraftType] = useState<DraftType>('feature');
  const [draftPriority, setDraftPriority] = useState<DraftPriority>('low');
  const [draftFolderId, setDraftFolderId] = useState<string | null>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setCommandPaletteOpen(false);
    setQuery('');
    setSelectedIndex(0);
    setMode('commands');
    setDraftTitle('');
    setDraftType('feature');
    setDraftPriority('low');
    setDraftFolderId(null);
    setShowTypeMenu(false);
    setShowPriorityMenu(false);
    setShowFolderMenu(false);
    clearQuickCreateError();
  }, [setCommandPaletteOpen, clearQuickCreateError]);

  const enterDraftMode = useCallback(() => {
    setMode('create-draft');
    setDraftTitle('');
    setDraftType('feature');
    setDraftPriority('low');
    setDraftFolderId(null);
    clearQuickCreateError();
  }, [clearQuickCreateError]);

  const commands: Command[] = useMemo(() => [
    {
      id: 'create-draft',
      label: 'Create new draft...',
      icon: Plus,
      shortcut: ['C'],
      group: 'Tickets',
      action: enterDraftMode,
    },
    {
      id: 'create-wizard',
      label: 'Create ticket',
      icon: FileText,
      shortcut: ['N'],
      group: 'Tickets',
      action: () => { close(); router.push('/tickets/create'); },
    },
    {
      id: 'go-workspace',
      label: 'Go to Workspace',
      icon: LayoutGrid,
      group: 'Navigation',
      action: () => { close(); router.push('/tickets'); },
    },
  ], [close, router, enterDraftMode]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.group.toLowerCase().includes(q)
    );
  }, [query, commands]);

  const groups = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of filtered) {
      const existing = map.get(cmd.group) || [];
      existing.push(cmd);
      map.set(cmd.group, existing);
    }
    return map;
  }, [filtered]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Auto-focus
  useEffect(() => {
    if (commandPaletteOpen) {
      requestAnimationFrame(() => {
        if (mode === 'create-draft') {
          draftInputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      });
    }
  }, [commandPaletteOpen, mode]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!commandPaletteOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (mode === 'create-draft') {
          if (showTypeMenu || showPriorityMenu || showFolderMenu) {
            setShowTypeMenu(false);
            setShowPriorityMenu(false);
            setShowFolderMenu(false);
            return;
          }
          setMode('commands');
          setDraftTitle('');
          clearQuickCreateError();
          requestAnimationFrame(() => inputRef.current?.focus());
        } else {
          close();
        }
        return;
      }

      if (mode === 'commands') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % filtered.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
        } else if (e.key === 'Enter' && filtered.length > 0) {
          e.preventDefault();
          filtered[selectedIndex]?.action();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, mode, filtered, selectedIndex, close, clearQuickCreateError, showTypeMenu, showPriorityMenu, showFolderMenu]);

  const handleDraftSubmit = async () => {
    if (draftTitle.length < 3 || isQuickCreating) return;

    const aec = await quickCreateDraft(draftTitle, draftType, draftPriority, draftFolderId || undefined);
    if (aec) {
      close();
    }
  };

  if (!commandPaletteOpen) return null;

  let flatIndex = 0;

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-start justify-center pt-[18vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={close} />

      {/* Palette card */}
      <div className="relative w-full max-w-[560px] mx-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] shadow-2xl overflow-hidden">
        {mode === 'commands' ? (
          <>
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 h-12 border-b border-[var(--border-subtle)]">
              <Search className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] outline-none focus-visible:outline-none"
              />
            </div>

            {/* Command list */}
            <div ref={listRef} className="max-h-[320px] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">
                  No results found.
                </div>
              ) : (
                Array.from(groups.entries()).map(([group, cmds]) => (
                  <div key={group}>
                    <div className="px-4 pt-3 pb-1 text-xs font-medium text-[var(--text-tertiary)] select-none">
                      {group}
                    </div>
                    {cmds.map((cmd) => {
                      const thisIndex = flatIndex++;
                      const isSelected = thisIndex === selectedIndex;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          data-selected={isSelected}
                          onClick={() => cmd.action()}
                          onMouseEnter={() => setSelectedIndex(thisIndex)}
                          className={`w-full flex items-center gap-3 px-4 h-10 text-sm transition-colors ${
                            isSelected
                              ? 'bg-[var(--bg-active)] text-[var(--text)]'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                          }`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 text-left truncate">{cmd.label}</span>
                          {cmd.shortcut && (
                            <span className="flex items-center gap-1">
                              {cmd.shortcut.map((key) => (
                                <kbd
                                  key={key}
                                  className="min-w-[20px] h-5 flex items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--bg)] text-[10px] font-medium text-[var(--text-tertiary)] px-1"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Create draft mode */
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => {
                    setMode('commands');
                    setDraftTitle('');
                    setDraftType('feature');
                    setDraftPriority('low');
                    setDraftFolderId(null);
                    clearQuickCreateError();
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-sm font-medium text-[var(--text)]">Quick Draft</h3>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] ml-6">
                Capture an idea fast. You can enrich it later in the full editor.
              </p>
            </div>

            {/* Type & Priority selectors */}
            <div className="px-5 pb-3 flex items-center gap-2">
              {/* Type selector */}
              <div className="relative">
                <button
                  onClick={() => { setShowTypeMenu(!showTypeMenu); setShowPriorityMenu(false); setShowFolderMenu(false); }}
                  className="flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] text-xs text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border)] transition-colors"
                >
                  {(() => { const t = TYPE_OPTIONS.find(o => o.value === draftType)!; const Icon = t.icon; return <Icon className={`h-3.5 w-3.5 ${t.color}`} />; })()}
                  <span>{TYPE_OPTIONS.find(o => o.value === draftType)!.label}</span>
                  <ChevronDown className="h-3 w-3 text-[var(--text-tertiary)]" />
                </button>
                {showTypeMenu && (
                  <div className="absolute top-full left-0 mt-1 w-36 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] shadow-lg overflow-hidden z-10">
                    {TYPE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => { setDraftType(opt.value); setShowTypeMenu(false); }}
                          className={`w-full flex items-center gap-2 px-3 h-8 text-xs transition-colors ${
                            draftType === opt.value
                              ? 'bg-[var(--bg-active)] text-[var(--text)]'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${opt.color}`} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Priority selector */}
              <div className="relative">
                <button
                  onClick={() => { setShowPriorityMenu(!showPriorityMenu); setShowTypeMenu(false); setShowFolderMenu(false); }}
                  className="flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] text-xs text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border)] transition-colors"
                >
                  <span className={`h-2 w-2 rounded-full ${PRIORITY_OPTIONS.find(o => o.value === draftPriority)!.color}`} />
                  <span>{PRIORITY_OPTIONS.find(o => o.value === draftPriority)!.label}</span>
                  <ChevronDown className="h-3 w-3 text-[var(--text-tertiary)]" />
                </button>
                {showPriorityMenu && (
                  <div className="absolute top-full left-0 mt-1 w-36 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] shadow-lg overflow-hidden z-10">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setDraftPriority(opt.value); setShowPriorityMenu(false); }}
                        className={`w-full flex items-center gap-2 px-3 h-8 text-xs transition-colors ${
                          draftPriority === opt.value
                            ? 'bg-[var(--bg-active)] text-[var(--text)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Folder selector */}
              {folders.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => { setShowFolderMenu(!showFolderMenu); setShowTypeMenu(false); setShowPriorityMenu(false); }}
                    className="flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg)] text-xs text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border)] transition-colors"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    <span className="max-w-[100px] truncate">
                      {draftFolderId ? folders.find(f => f.id === draftFolderId)?.name ?? 'Folder' : 'No folder'}
                    </span>
                    <ChevronDown className="h-3 w-3 text-[var(--text-tertiary)]" />
                  </button>
                  {showFolderMenu && (
                    <div className="absolute top-full left-0 mt-1 w-44 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] shadow-lg overflow-hidden z-10 max-h-[200px] overflow-y-auto">
                      <button
                        onClick={() => { setDraftFolderId(null); setShowFolderMenu(false); }}
                        className={`w-full flex items-center gap-2 px-3 h-8 text-xs transition-colors ${
                          !draftFolderId
                            ? 'bg-[var(--bg-active)] text-[var(--text)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        No folder (feed)
                      </button>
                      {folders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => { setDraftFolderId(folder.id); setShowFolderMenu(false); }}
                          className={`w-full flex items-center gap-2 px-3 h-8 text-xs transition-colors ${
                            draftFolderId === folder.id
                              ? 'bg-[var(--bg-active)] text-[var(--text)]'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                          }`}
                        >
                          <FolderOpen className="h-3.5 w-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
                          <span className="truncate">{folder.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)] px-3 h-11">
                <Plus className="h-4 w-4 text-[var(--text-tertiary)] flex-shrink-0" />
                <input
                  ref={draftInputRef}
                  type="text"
                  value={draftTitle}
                  onChange={(e) => {
                    setDraftTitle(e.target.value);
                    if (quickCreateError) clearQuickCreateError();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleDraftSubmit();
                    }
                  }}
                  disabled={isQuickCreating}
                  placeholder="What are you working on?"
                  className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] outline-none focus-visible:outline-none disabled:opacity-50"
                />
                {isQuickCreating && (
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
                )}
              </div>

              {/* Validation / error */}
              {((draftTitle.length > 0 && draftTitle.length < 3) || quickCreateError) && (
                <div className="mt-2 ml-1">
                  {draftTitle.length > 0 && draftTitle.length < 3 && (
                    <p className="text-xs text-[var(--text-tertiary)]">Title needs at least 3 characters</p>
                  )}
                  {quickCreateError && (
                    <p className="text-xs text-red-400">{quickCreateError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-tertiary)]">
                Creates a draft and opens the wizard
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                <kbd className="min-w-[20px] h-5 flex items-center justify-center rounded border border-[var(--border-subtle)] bg-[var(--bg)] text-[10px] font-medium px-1.5">
                  Enter
                </kbd>
                to create
              </span>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
