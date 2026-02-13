'use client';

import React, { useState, useRef, useEffect } from 'react';
import { detectPlatform, validateDesignReferenceUrl } from '@repo/shared-types';
import { X } from 'lucide-react';

interface AddDesignLinkDialogProps {
  onAdd: (url: string, title?: string) => Promise<void>;
  onClose: () => void;
}

export function AddDesignLinkDialog({ onAdd, onClose }: AddDesignLinkDialogProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus URL input on mount
  useEffect(() => {
    urlInputRef.current?.focus();
  }, []);

  // Validate URL for visual feedback
  const validation = validateDesignReferenceUrl(url);
  const isUrlValid = validation.valid;

  const handleAdd = async () => {
    setError(null);

    // Validate URL
    const validation = validateDesignReferenceUrl(url);
    if (!validation.valid) {
      setError(validation.error || 'Invalid URL');
      return;
    }

    setLoading(true);
    try {
      await onAdd(url, title || undefined);
    } catch (err: any) {
      // Extract error message from axios error
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to add design link';
      setError(errorMessage);
      console.error('Add design link error:', err);
    } finally {
      setLoading(false);
    }
  };

  const platform = detectPlatform(url);
  const PLATFORM_ICONS: Record<string, string> = {
    figma: '🎨',
    loom: '📹',
    miro: '🎯',
    sketch: '✏️',
    whimsical: '🌈',
    other: '🔗',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Design Link
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL *
            </label>
            <input
              ref={urlInputRef}
              type="text"
              placeholder="https://figma.com/file/... or https://loom.com/share/..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              disabled={loading}
              className={`w-full px-3 py-2 border rounded-md text-sm
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                disabled:opacity-50
                focus:outline-none focus:ring-2
                ${
                  url && !isUrlValid
                    ? 'border-red-500 focus:ring-red-500'
                    : url && isUrlValid
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
            />
            {url && !isUrlValid && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{validation.error}</p>
            )}
            {url && isUrlValid && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {PLATFORM_ICONS[platform]} {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Dashboard Mockups"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                disabled:opacity-50
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Auto-generated from URL if left blank
            </p>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
              rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={loading || !isUrlValid}
            title={isUrlValid ? 'Add this design link' : 'Enter a valid HTTPS URL'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Adding...' : 'Add Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
