/**
 * Design Reference Types - Shared between Backend and Frontend
 */

export type DesignPlatform =
  | 'figma'
  | 'loom'
  | 'miro'
  | 'sketch'
  | 'whimsical'
  | 'other';

export interface FigmaMetadata {
  fileName: string;
  thumbnailUrl: string;
  lastModified: Date;
  fileKey: string;
}

export interface LoomMetadata {
  videoTitle: string;
  duration: number;
  thumbnailUrl: string;
  sharedId: string;
  lastModified?: Date; // Last modified timestamp from Loom API
  transcript?: string; // For LLM context (Phase 3)
}

export interface DesignMetadata {
  figma?: FigmaMetadata;
  loom?: LoomMetadata;
}

export interface DesignReference {
  id: string;
  url: string;
  platform: DesignPlatform;
  title?: string;
  metadata?: DesignMetadata;
  metadataFetchStatus?: 'pending' | 'success' | 'failed'; // Track metadata fetch state
  metadataFetchError?: string; // Error message if fetch failed
  addedAt: Date;
  addedBy: string;
}

/**
 * Platform detection from URL
 */
const PLATFORM_PATTERNS = {
  figma: /figma\.com\/(file|proto|design)\//,
  loom: /loom\.com\/(share|embed)\//,
  miro: /miro\.com\/app\/board\//,
  sketch: /sketch\.com\//,
  whimsical: /whimsical\.com\//,
} as const;

export function detectPlatform(url: string): DesignPlatform {
  if (!url || typeof url !== 'string') return 'other';

  // Normalize URL (lowercase for case-insensitive matching)
  const normalizedUrl = url.toLowerCase();

  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(normalizedUrl)) {
      return platform as DesignPlatform;
    }
  }
  return 'other';
}

/**
 * URL validation
 */
export function validateDesignReferenceUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  // Trim whitespace
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return { valid: false, error: 'URL cannot be empty or whitespace' };
  }

  if (!trimmedUrl.startsWith('https://')) {
    return { valid: false, error: 'URL must use HTTPS (https://)' };
  }

  if (trimmedUrl.length > 2048) {
    return { valid: false, error: 'URL is too long (max 2048 characters)' };
  }

  // Check for invalid characters
  if (/[\s<>"{}|\\^`]/.test(trimmedUrl)) {
    return { valid: false, error: 'URL contains invalid characters' };
  }

  try {
    const urlObj = new URL(trimmedUrl);
    // Verify hostname exists
    if (!urlObj.hostname) {
      return { valid: false, error: 'Invalid URL format' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Extract Figma file key from URL
 * Example: https://www.figma.com/file/abc123/Project-Name → abc123
 */
export function extractFigmaFileKey(url: string): string | null {
  const match = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Extract Loom shared ID from URL
 * Example: https://www.loom.com/share/abc123def456 → abc123def456
 */
export function extractLoomSharedId(url: string): string | null {
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i);
  return match ? match[1] : null;
}
