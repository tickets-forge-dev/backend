'use client';

import React, { useState } from 'react';
import { Trash2, ExternalLink, Plus } from 'lucide-react';
import { detectPlatform, type DesignPlatform } from '@repo/shared-types';

interface DesignLink {
  url: string;
  title?: string;
  platform: DesignPlatform;
  tempId: string;
}

interface DesignLinkInputProps {
  links: DesignLink[];
  onAdd: (link: { url: string; title?: string }) => void;
  onRemove: (tempId: string | number) => void;
  maxLinks?: number;
  disabled?: boolean;
}

const PLATFORM_ICONS: Record<DesignPlatform, string> = {
  figma: '🎨',
  loom: '📹',
  miro: '🎯',
  sketch: '✏️',
  whimsical: '🌈',
  other: '🔗',
};

const PLATFORM_NAMES: Record<DesignPlatform, string> = {
  figma: 'Figma',
  loom: 'Loom',
  miro: 'Miro',
  sketch: 'Sketch',
  whimsical: 'Whimsical',
  other: 'Link',
};

export function DesignLinkInput({
  links,
  onAdd,
  onRemove,
  maxLinks = 5,
  disabled = false,
}: DesignLinkInputProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    setError(null);
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    if (!trimmedUrl.startsWith('https://')) {
      setError('URL must use HTTPS');
      return;
    }
    try { new URL(trimmedUrl); } catch {
      setError('Invalid URL');
      return;
    }
    if (links.length >= maxLinks) {
      setError(`Maximum ${maxLinks} links`);
      return;
    }
    if (links.some((l) => l.url === trimmedUrl)) {
      setError('Already added');
      return;
    }

    onAdd({ url: trimmedUrl, title: title.trim() || undefined });
    setUrl('');
    setTitle('');
  };

  return (
    <div className="space-y-2">
      {/* Inline add form */}
      <div className="flex gap-1.5">
        <input
          type="url"
          placeholder="https://figma.com/..."
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); }}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          disabled={disabled || links.length >= maxLinks}
          className="flex-1 h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)]/40 px-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)] disabled:opacity-40"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !url.trim() || links.length >= maxLinks}
          className="h-8 px-2 rounded-md border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Optional label — only show when URL has content */}
      {url.trim() && (
        <input
          type="text"
          placeholder="Label (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          className="w-full h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-hover)]/40 px-2.5 text-xs text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--blue)]"
        />
      )}

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      {/* Links list */}
      {links.length > 0 && (
        <ul className="space-y-1">
          {links.map((link, idx) => (
            <li
              key={link.tempId ?? idx}
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5 bg-[var(--bg-subtle)] group"
            >
              <span className="text-sm flex-shrink-0">{PLATFORM_ICONS[link.platform]}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[var(--text)] block truncate">
                  {link.title || PLATFORM_NAMES[link.platform]}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--blue)] truncate block"
                >
                  {link.url}
                </a>
              </div>
              <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-[var(--text-tertiary)] hover:text-[var(--blue)] transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  onClick={() => onRemove(link.tempId ?? idx)}
                  disabled={disabled}
                  className="p-1 text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
