'use client';

import { useState } from 'react';
import { Textarea } from '@/core/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Pencil, Eye } from 'lucide-react';

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

  return (
    <div className="space-y-2">
      {/* Toggle tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border)]">
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

      {/* Content */}
      {mode === 'write' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          autoFocus={autoFocus}
          className="w-full resize-none font-mono text-sm"
        />
      ) : (
        <div className="min-h-[100px] rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm prose prose-sm dark:prose-invert max-w-none">
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
