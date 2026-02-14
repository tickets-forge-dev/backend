'use client';

import React from 'react';
import { ExternalLink, Trash2, ChevronDown } from 'lucide-react';
import { type DesignReference, type FigmaMetadata, type LoomMetadata, type ExtractedDesignTokens } from '@repo/shared-types';

interface DesignReferenceCardProps {
  reference: DesignReference;
  onRemove: (referenceId: string) => Promise<void>;
  readOnly?: boolean;
}

const PLATFORM_ICONS: Record<string, string> = {
  figma: '🎨',
  loom: '📹',
  miro: '🎯',
  sketch: '✏️',
  whimsical: '🌈',
  other: '🔗',
};

const PLATFORM_NAMES: Record<string, string> = {
  figma: 'Figma',
  loom: 'Loom',
  miro: 'Miro',
  sketch: 'Sketch',
  whimsical: 'Whimsical',
  other: 'Other',
};

/**
 * DesignReferenceCard - Display a single design reference with optional rich preview
 *
 * Renders different states:
 * - Rich preview card (if metadata available): Thumbnail, title, metadata
 * - Loading card (if pending): Loading spinner
 * - Error card (if failed): Error message
 * - Simple link card (fallback): Icon, URL, external link
 */
export function DesignReferenceCard({
  reference,
  onRemove,
  readOnly = false,
}: DesignReferenceCardProps) {
  const [removing, setRemoving] = React.useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(reference.id);
    } finally {
      setRemoving(false);
    }
  };

  // Show loading state while metadata is being fetched
  if (reference.metadataFetchStatus === 'pending') {
    return (
      <LoadingCard
        reference={reference}
        onRemove={handleRemove}
        removing={removing}
        readOnly={readOnly}
      />
    );
  }

  // Show error state if metadata fetch failed
  if (reference.metadataFetchStatus === 'failed') {
    return (
      <ErrorCard
        reference={reference}
        error={reference.metadataFetchError}
        onRemove={handleRemove}
        removing={removing}
        readOnly={readOnly}
      />
    );
  }

  // Render rich preview if metadata available
  if (reference.metadata?.figma) {
    return (
      <FigmaPreviewCard
        reference={reference}
        metadata={reference.metadata.figma}
        onRemove={handleRemove}
        removing={removing}
        readOnly={readOnly}
      />
    );
  }

  if (reference.metadata?.loom) {
    return (
      <LoomPreviewCard
        reference={reference}
        metadata={reference.metadata.loom}
        onRemove={handleRemove}
        removing={removing}
        readOnly={readOnly}
      />
    );
  }

  // Fallback: Simple link card (unsupported platform or no metadata yet)
  return (
    <SimpleLinkCard
      reference={reference}
      onRemove={handleRemove}
      removing={removing}
      readOnly={readOnly}
    />
  );
}

/**
 * Figma Rich Preview Card
 */
function FigmaPreviewCard({
  reference,
  metadata,
  onRemove,
  removing,
  readOnly,
}: {
  reference: DesignReference;
  metadata: FigmaMetadata;
  onRemove: () => Promise<void>;
  removing: boolean;
  readOnly: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
      {/* Thumbnail */}
      {metadata.thumbnailUrl && (
        <div className="flex-shrink-0 w-16 h-16 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <img
            src={metadata.thumbnailUrl}
            alt={metadata.fileName}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{PLATFORM_ICONS.figma}</span>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {reference.title || metadata.fileName}
          </h4>
        </div>

        <p className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 truncate">
          <a href={reference.url} target="_blank" rel="noopener noreferrer">
            {reference.url}
          </a>
        </p>

        {metadata.lastModified && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Last modified: {new Date(metadata.lastModified).toLocaleDateString()}
          </p>
        )}

        {reference.addedBy && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Added by {reference.addedBy}
          </p>
        )}

        {/* Design Tokens Display */}
        {metadata.tokens && (
          <DesignTokensDisplay tokens={metadata.tokens} />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <a
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ExternalLink size={16} />
        </a>
        {!readOnly && (
          <button
            onClick={onRemove}
            disabled={removing}
            title="Remove reference"
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Loom Rich Preview Card
 */
function LoomPreviewCard({
  reference,
  metadata,
  onRemove,
  removing,
  readOnly,
}: {
  reference: DesignReference;
  metadata: LoomMetadata;
  onRemove: () => Promise<void>;
  removing: boolean;
  readOnly: boolean;
}) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
      {/* Thumbnail */}
      {metadata.thumbnailUrl && (
        <div className="flex-shrink-0 w-16 h-16 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
          <img
            src={metadata.thumbnailUrl}
            alt={metadata.videoTitle}
            className="w-full h-full object-cover"
          />
          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="text-white text-xl">▶</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{PLATFORM_ICONS.loom}</span>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {reference.title || metadata.videoTitle}
          </h4>
        </div>

        <p className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 truncate">
          <a href={reference.url} target="_blank" rel="noopener noreferrer">
            {reference.url}
          </a>
        </p>

        <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
          {metadata.duration && (
            <span>Duration: {formatDuration(metadata.duration)}</span>
          )}
          {metadata.lastModified && (
            <span>Updated: {new Date(metadata.lastModified).toLocaleDateString()}</span>
          )}
        </div>

        {reference.addedBy && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Added by {reference.addedBy}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <a
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ExternalLink size={16} />
        </a>
        {!readOnly && (
          <button
            onClick={onRemove}
            disabled={removing}
            title="Remove reference"
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Loading Card - Shown while metadata is being fetched
 */
function LoadingCard({
  reference,
  onRemove,
  removing,
  readOnly,
}: {
  reference: DesignReference;
  onRemove: () => Promise<void>;
  removing: boolean;
  readOnly: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
      {/* Spinner */}
      <div className="text-lg flex-shrink-0">
        <span className="inline-block animate-spin">⏳</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {reference.title || PLATFORM_NAMES[reference.platform] || PLATFORM_NAMES.other}
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
          Fetching preview...
        </p>
        <a
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
          title={reference.url}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block mt-1"
        >
          {reference.url}
        </a>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <a
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ExternalLink size={16} />
        </a>
        {!readOnly && (
          <button
            onClick={onRemove}
            disabled={removing}
            title="Remove reference"
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Error Card - Shown when metadata fetch fails
 */
function ErrorCard({
  reference,
  error,
  onRemove,
  removing,
  readOnly,
}: {
  reference: DesignReference;
  error?: string;
  onRemove: () => Promise<void>;
  removing: boolean;
  readOnly: boolean;
}) {
  const errorMessage =
    error || `Could not fetch preview for ${PLATFORM_NAMES[reference.platform] || 'this platform'}`;

  return (
    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
      {/* Error icon */}
      <div className="text-lg flex-shrink-0">⚠️</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {reference.title || PLATFORM_NAMES[reference.platform] || PLATFORM_NAMES.other}
        </p>
        <p className="text-xs text-red-700 dark:text-red-300 mt-1">{errorMessage}</p>
        <a
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
          title={reference.url}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block mt-1"
        >
          {reference.url}
        </a>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <a
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ExternalLink size={16} />
        </a>
        {!readOnly && (
          <button
            onClick={onRemove}
            disabled={removing}
            title="Remove reference"
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Design Tokens Display - Shows extracted colors, typography, spacing, etc.
 */
function DesignTokensDisplay({ tokens }: { tokens: ExtractedDesignTokens }) {
  const [expanded, setExpanded] = React.useState(false);

  // Early return if no tokens to display
  const hasTokens =
    (tokens.colors && tokens.colors.length > 0) ||
    (tokens.typography && tokens.typography.length > 0) ||
    (tokens.spacing && tokens.spacing.length > 0) ||
    (tokens.radius && tokens.radius.length > 0) ||
    (tokens.shadows && tokens.shadows.length > 0);

  if (!hasTokens) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ChevronDown
          size={14}
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
        Design Tokens ({tokens.colors?.length || 0} colors, {tokens.typography?.length || 0} typography)
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 text-xs">
          {/* Colors */}
          {tokens.colors && tokens.colors.length > 0 && (
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Colors:</p>
              <div className="flex flex-wrap gap-2">
                {tokens.colors.slice(0, 6).map((color) => (
                  <div
                    key={color.name}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                  >
                    <div
                      className="w-3 h-3 rounded border border-gray-300 dark:border-gray-500"
                      style={{ backgroundColor: color.value }}
                      title={color.description}
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-mono text-[10px]">
                      {color.value}
                    </span>
                  </div>
                ))}
                {tokens.colors.length > 6 && (
                  <span className="text-gray-500 dark:text-gray-400">
                    +{tokens.colors.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Typography */}
          {tokens.typography && tokens.typography.length > 0 && (
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Typography:</p>
              <div className="space-y-0.5">
                {tokens.typography.slice(0, 3).map((typo) => (
                  <div
                    key={typo.name}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                    title={typo.description}
                  >
                    <span className="font-mono text-[10px]">{typo.value}</span>
                  </div>
                ))}
                {tokens.typography.length > 3 && (
                  <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                    +{tokens.typography.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Spacing */}
          {tokens.spacing && tokens.spacing.length > 0 && (
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Spacing:</p>
              <div className="flex flex-wrap gap-1">
                {tokens.spacing.slice(0, 5).map((space) => (
                  <div
                    key={space.name}
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-mono text-[10px]"
                    title={space.description}
                  >
                    {space.value}
                  </div>
                ))}
                {tokens.spacing.length > 5 && (
                  <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                    +{tokens.spacing.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Border Radius */}
          {tokens.radius && tokens.radius.length > 0 && (
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Border Radius:</p>
              <div className="flex flex-wrap gap-1">
                {tokens.radius.slice(0, 4).map((rad) => (
                  <div
                    key={rad.name}
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-mono text-[10px]"
                    title={rad.description}
                  >
                    {rad.value}
                  </div>
                ))}
                {tokens.radius.length > 4 && (
                  <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                    +{tokens.radius.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Shadows */}
          {tokens.shadows && tokens.shadows.length > 0 && (
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Shadows:</p>
              <div className="space-y-0.5">
                {tokens.shadows.slice(0, 2).map((shadow) => (
                  <div
                    key={shadow.name}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                    title={shadow.description}
                  >
                    <span className="font-mono text-[10px]">{shadow.value}</span>
                  </div>
                ))}
                {tokens.shadows.length > 2 && (
                  <span className="text-gray-500 dark:text-gray-400 text-[10px]">
                    +{tokens.shadows.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Simple Link Card (Fallback)
 */
function SimpleLinkCard({
  reference,
  onRemove,
  removing,
  readOnly,
}: {
  reference: DesignReference;
  onRemove: () => Promise<void>;
  removing: boolean;
  readOnly: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
      {/* Icon */}
      <div className="text-lg flex-shrink-0">
        {PLATFORM_ICONS[reference.platform] || PLATFORM_ICONS.other}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {reference.title || PLATFORM_NAMES[reference.platform] || PLATFORM_NAMES.other}
        </p>
        <a
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
          title={reference.url}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block"
        >
          {reference.url}
        </a>
        {reference.addedBy && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Added by {reference.addedBy}
          </p>
        )}
        {reference.addedAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {new Date(reference.addedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <a
          href={reference.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ExternalLink size={16} />
        </a>
        {!readOnly && (
          <button
            onClick={onRemove}
            disabled={removing}
            title="Remove reference"
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
