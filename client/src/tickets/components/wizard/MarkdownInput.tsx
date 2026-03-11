'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Textarea } from '@/core/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PenLine, Bold, Italic, List, ListOrdered, Code, Link2, Heading2, X, FileUp } from 'lucide-react';

interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  autoFocus?: boolean;
  /** Hide the built-in "Open Editor" button (caller renders their own) */
  externalEditorButton?: boolean;
  /** Controlled fullscreen state from parent */
  fullscreenOpen?: boolean;
  onFullscreenClose?: () => void;
}

/** Insert markdown syntax around the current selection or at cursor */
function insertMarkdown(
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  onChange: (v: string) => void,
) {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  const replacement = `${prefix}${selected || 'text'}${suffix}`;
  const next = value.slice(0, selectionStart) + replacement + value.slice(selectionEnd);
  onChange(next);
  // Restore cursor after React re-render
  requestAnimationFrame(() => {
    const cursorPos = selectionStart + prefix.length + (selected ? selected.length : 4);
    textarea.setSelectionRange(
      selected ? selectionStart + prefix.length : selectionStart + prefix.length,
      selected ? selectionStart + prefix.length + selected.length : selectionStart + prefix.length + 4,
    );
    textarea.focus();
  });
}

// ── Toolbar button ──
function ToolbarBtn({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-1.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
    >
      {icon}
    </button>
  );
}

// ── Markdown toolbar ──
function MarkdownToolbar({ textareaRef, onChange }: { textareaRef: React.RefObject<HTMLTextAreaElement | null>; onChange: (v: string) => void }) {
  const ins = (prefix: string, suffix: string) => {
    if (textareaRef.current) insertMarkdown(textareaRef.current, prefix, suffix, onChange);
  };

  return (
    <div className="flex items-center gap-0.5 px-1">
      <ToolbarBtn icon={<Bold className="h-3.5 w-3.5" />} title="Bold" onClick={() => ins('**', '**')} />
      <ToolbarBtn icon={<Italic className="h-3.5 w-3.5" />} title="Italic" onClick={() => ins('_', '_')} />
      <ToolbarBtn icon={<Code className="h-3.5 w-3.5" />} title="Code" onClick={() => ins('`', '`')} />
      <div className="w-px h-4 bg-[var(--border)] mx-1" />
      <ToolbarBtn icon={<Heading2 className="h-3.5 w-3.5" />} title="Heading" onClick={() => ins('## ', '')} />
      <ToolbarBtn icon={<List className="h-3.5 w-3.5" />} title="Bullet list" onClick={() => ins('- ', '')} />
      <ToolbarBtn icon={<ListOrdered className="h-3.5 w-3.5" />} title="Numbered list" onClick={() => ins('1. ', '')} />
      <ToolbarBtn icon={<Link2 className="h-3.5 w-3.5" />} title="Link" onClick={() => ins('[', '](url)')} />
    </div>
  );
}

// ── Fullscreen overlay editor ──
function FullscreenEditor({
  value,
  onChange,
  placeholder,
  maxLength,
  onClose,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'write' | 'preview' | 'split'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      // Append to existing content (or replace if empty)
      onChange(value ? `${value}\n\n${content}` : content);
    };
    reader.readAsText(file);
    // Reset so same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [value, onChange]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Auto-focus textarea
  useEffect(() => {
    if (mode !== 'preview') textareaRef.current?.focus();
  }, [mode]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Panel */}
      <div className="relative w-full sm:w-[80%] bg-[var(--bg)] flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2 bg-[var(--bg-subtle)]">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">Ticket Description</h3>
          <div className="flex items-center gap-1 bg-[var(--bg)] rounded-md border border-[var(--border)] p-0.5">
            <button
              type="button"
              onClick={() => setMode('write')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                mode === 'write' ? 'bg-[var(--bg-hover)] text-[var(--text)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setMode('split')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors hidden sm:block ${
                mode === 'split' ? 'bg-[var(--bg-hover)] text-[var(--text)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                mode === 'preview' ? 'bg-[var(--bg-hover)] text-[var(--text)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-colors"
            title="Import text file"
          >
            <FileUp className="h-3.5 w-3.5" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.markdown,.text,.csv,.json,.xml,.yaml,.yml"
            onChange={handleImportFile}
            className="hidden"
          />
          <span className="text-xs text-[var(--text-tertiary)]">{value.length}/{maxLength}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Toolbar — shown when write or split */}
      {mode !== 'preview' && (
        <div className="border-b border-[var(--border)] px-3 py-1.5 bg-[var(--bg-subtle)]">
          <MarkdownToolbar textareaRef={textareaRef} onChange={onChange} />
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 flex min-h-0">
        {/* Write pane */}
        {mode !== 'preview' && (
          <div className={`flex-1 flex flex-col min-w-0 ${mode === 'split' ? 'border-r border-[var(--border)]' : ''}`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              className="flex-1 w-full resize-none font-mono text-sm p-4 bg-transparent text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
            />
          </div>
        )}

        {/* Preview pane */}
        {(mode === 'preview' || mode === 'split') && (
          <div className="flex-1 overflow-y-auto p-4 min-w-0">
            {mode === 'split' && (
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-3 font-medium">Preview</p>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {value ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
              ) : (
                <p className="text-[var(--text-tertiary)] italic">Nothing to preview</p>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ── Main component ──

export function MarkdownInput({
  value,
  onChange,
  placeholder = 'Describe what you want to build or change...',
  maxLength = 2000,
  rows = 4,
  autoFocus = false,
  externalEditorButton = false,
  fullscreenOpen,
  onFullscreenClose,
}: MarkdownInputProps) {
  const [internalFullscreen, setInternalFullscreen] = useState(false);

  const isFullscreen = fullscreenOpen ?? internalFullscreen;
  const handleClose = useCallback(() => {
    setInternalFullscreen(false);
    onFullscreenClose?.();
  }, [onFullscreenClose]);

  if (isFullscreen) {
    return (
      <FullscreenEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* Open Editor button — only when not externally controlled */}
      {!externalEditorButton && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setInternalFullscreen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--purple)] hover:text-[var(--text)] border border-[var(--purple)]/40 hover:border-[var(--purple)] rounded-md transition-colors hover:bg-[var(--purple)]/10"
            title="Open full markdown editor"
          >
            <PenLine className="h-3.5 w-3.5" />
            Open Editor
          </button>
        </div>
      )}

      {/* Textarea */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        autoFocus={autoFocus}
        className="w-full resize-none font-mono text-sm min-h-[40vh] sm:min-h-[200px]"
      />

      {/* Character count */}
      <span className="text-xs text-[var(--text-tertiary)] block text-right">
        {value.length}/{maxLength}
      </span>
    </div>
  );
}
