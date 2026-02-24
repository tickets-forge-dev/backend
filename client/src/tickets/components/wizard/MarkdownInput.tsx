'use client';

import { useState } from 'react';
import { Textarea } from '@/core/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pencil, Eye, Maximize2, Minimize2 } from 'lucide-react';

interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  autoFocus?: boolean;
}

export function MarkdownInput({
  value,
  onChange,
  placeholder = 'Describe what you want to build or change...',
  maxLength = 2000,
  rows = 4,
  autoFocus = false,
}: MarkdownInputProps) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [expanded, setExpanded] = useState(false);

  const expandedRows = Math.max(rows * 3, 10);

  return (
    <div className="space-y-2">
      {/* Toggle tabs + expand button */}
      <div className="flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              mode === 'write'
                ? 'border-[var(--purple)] text-[var(--text)]'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Pencil className="h-3 w-3" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              mode === 'preview'
                ? 'border-[var(--purple)] text-[var(--text)]'
                : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors rounded"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Content */}
      {mode === 'write' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={expanded ? expandedRows : rows}
          autoFocus={autoFocus}
          className="w-full resize-none font-mono text-sm transition-[height] duration-300 ease-in-out"
          style={{ height: expanded ? `${expandedRows * 1.5}em` : `${rows * 1.5}em` }}
        />
      ) : (
        <div
          className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm prose prose-sm dark:prose-invert max-w-none overflow-y-auto transition-[min-height,max-height] duration-300 ease-in-out"
          style={{ minHeight: expanded ? `${expandedRows * 1.5}em` : '100px', maxHeight: expanded ? `${expandedRows * 1.5}em` : '150px' }}
        >
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-[var(--text-tertiary)] italic">Nothing to preview</p>
          )}
        </div>
      )}

      {/* Character count */}
      <span className="text-xs text-[var(--text-tertiary)] block text-right">
        {value.length}/{maxLength}
      </span>
    </div>
  );
}
