'use client';

import React, { useState } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';
import { detectPlatform, type DesignPlatform } from '@repo/shared-types';

interface DesignLink {
  url: string;
  title?: string;
  platform: DesignPlatform;
  tempId: string; // For local tracking before server persistence
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
  other: 'Other',
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
  const [urlError, setUrlError] = useState<string | null>(null);

  const validateUrl = (inputUrl: string): boolean => {
    if (!inputUrl.trim()) {
      setUrlError('URL is required');
      return false;
    }

    if (!inputUrl.startsWith('https://')) {
      setUrlError('URL must use HTTPS (https://)');
      return false;
    }

    try {
      new URL(inputUrl);
      setUrlError(null);
      return true;
    } catch {
      setUrlError('Invalid URL format');
      return false;
    }
  };

  const handleAddLink = () => {
    setError(null);

    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();

    // Validate
    if (!validateUrl(trimmedUrl)) {
      return;
    }

    // Check max limit
    if (links.length >= maxLinks) {
      setError(`Maximum ${maxLinks} design links allowed per ticket`);
      return;
    }

    // Check for duplicates
    if (links.some((link) => link.url === trimmedUrl)) {
      setError('This URL has already been added');
      return;
    }

    // Add link
    onAdd({
      url: trimmedUrl,
      title: trimmedTitle || undefined,
    });

    // Reset form
    setUrl('');
    setTitle('');
    setUrlError(null);
  };

  const handleRemoveLink = (tempId: string | number) => {
    onRemove(tempId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddLink();
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Design Links (Optional)
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Paste Figma, Loom, or Miro links to provide visual context
        </p>

        {/* Add Link Form */}
        <div className="space-y-2 mb-4">
          <div>
            <input
              type="url"
              placeholder="https://figma.com/file/... or https://loom.com/share/..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError(null);
              }}
              onKeyPress={handleKeyPress}
              disabled={disabled || links.length >= maxLinks}
              className={`w-full px-3 py-2 border rounded-md text-sm font-mono
                ${urlError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}
          </div>

          <input
            type="text"
            placeholder="Title (optional, auto-generated from URL if blank)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || links.length >= maxLinks}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex gap-2">
            <button
              onClick={handleAddLink}
              disabled={disabled || links.length >= maxLinks || !url.trim()}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
                transition-colors"
            >
              Add Link
            </button>
            {links.length > 0 && (
              <button
                onClick={() => {
                  setUrl('');
                  setTitle('');
                  setError(null);
                  setUrlError(null);
                }}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
                  text-gray-900 dark:text-gray-100 rounded-md text-sm font-medium
                  transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Links List */}
        {links.length > 0 && (
          <div className="space-y-2">
            {links.map((link, idx) => (
              <div
                key={link.tempId ?? idx}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
              >
                <div className="text-xl flex-shrink-0">
                  {PLATFORM_ICONS[link.platform]}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {link.title || PLATFORM_NAMES[link.platform]}
                  </p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block"
                  >
                    {link.url}
                  </a>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in new tab"
                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={() => handleRemoveLink(link.tempId ?? idx)}
                    disabled={disabled}
                    title="Remove link"
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {/* Counter */}
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
              {links.length} of {maxLinks} design links added
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
