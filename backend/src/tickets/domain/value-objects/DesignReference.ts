/**
 * DesignReference Value Object
 *
 * Represents external design links (Figma, Loom, etc.) added to tickets.
 * Separate from Attachment (which are uploaded files in Firebase Storage).
 *
 * Platform-specific metadata (thumbnails, titles) is fetched in Phase 2 (Metadata Enrichment).
 */

export type DesignPlatform =
  | 'figma'
  | 'loom'
  | 'miro'
  | 'sketch'
  | 'whimsical'
  | 'other';

export interface DesignToken {
  name: string;
  value: string;
  type: 'color' | 'typography' | 'spacing' | 'radius' | 'shadow';
  description?: string;
}

export interface ExtractedDesignTokens {
  colors: DesignToken[];
  typography: DesignToken[];
  spacing: DesignToken[];
  radius: DesignToken[];
  shadows: DesignToken[];
}

export interface FigmaMetadata {
  fileName: string;
  thumbnailUrl: string;
  lastModified: Date;
  fileKey: string; // Extracted from URL
  tokens?: ExtractedDesignTokens; // Design tokens extracted from Figma (Phase 3)
}

export interface LoomMetadata {
  videoTitle: string;
  duration: number; // Seconds
  thumbnailUrl: string;
  transcript?: string; // For LLM context (Phase 3)
  sharedId: string; // Extracted from URL
}

export interface DesignMetadata {
  figma?: FigmaMetadata;
  loom?: LoomMetadata;
}

export interface DesignReference {
  id: string; // UUID
  url: string; // Validated HTTPS URL
  platform: DesignPlatform; // Auto-detected from URL
  title?: string; // User-provided or fetched from API
  metadata?: DesignMetadata; // Platform-specific (Phase 2)
  metadataFetchStatus?: 'pending' | 'success' | 'failed'; // Track metadata fetch state
  metadataFetchError?: string; // Error message if fetch failed
  addedAt: Date;
  addedBy: string; // User email
}

/**
 * Constants for design reference validation and limits
 */
export const MAX_DESIGN_LINKS = 5;
export const MAX_URL_LENGTH = 2048;

/**
 * Platform URL patterns for auto-detection
 */
export const PLATFORM_PATTERNS = {
  figma: /figma\.com\/(file|proto|design)\//,
  loom: /loom\.com\/(share|embed)\//,
  miro: /miro\.com\/app\/board\//,
  sketch: /sketch\.com\//,
  whimsical: /whimsical\.com\//,
} as const;

/**
 * Detect platform from URL
 * @param url - The design link URL
 * @returns Detected platform or 'other'
 */
export function detectPlatform(url: string): DesignPlatform {
  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(url)) {
      return platform as DesignPlatform;
    }
  }
  return 'other';
}

/**
 * Validate design reference URL
 * @param url - The URL to validate
 * @throws Error if URL is invalid
 */
export function validateDesignReferenceUrl(url: string): void {
  // Must be HTTPS
  if (!url.startsWith('https://')) {
    throw new Error('Design reference URL must use HTTPS');
  }

  // Must be reasonable length
  if (url.length > MAX_URL_LENGTH) {
    throw new Error(`Design reference URL must be ${MAX_URL_LENGTH} characters or less`);
  }

  // Try to parse as URL
  try {
    new URL(url);
  } catch {
    throw new Error('Design reference URL is not a valid URL');
  }
}

/**
 * Extract file key from Figma URL
 * Supports both old and new Figma URL formats:
 * @example "https://figma.com/file/abc123/project-name" → "abc123"
 * @example "https://figma.com/design/abc123/project-name" → "abc123"
 */
export function extractFigmaFileKey(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Match /file/{fileKey} or /design/{fileKey} patterns
    // Pathname looks like: /design/rwLSeEfU8hUmahi1qYEKYT/Core-App
    const matches = pathname.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
    if (matches && matches[2]) {
      return matches[2];
    }

    return null;
  } catch {
    // If URL parsing fails, return null
    return null;
  }
}

/**
 * Extract shared ID from Loom URL
 * Supports both share and embed paths
 * @example "https://loom.com/share/abc123" → "abc123"
 * @example "https://loom.com/embed/abc123" → "abc123"
 */
export function extractLoomSharedId(url: string): string | null {
  // Try share path first, then fall back to embed path
  let match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i);
  if (match) return match[1];

  // Fall back to embed path
  match = url.match(/loom\.com\/embed\/([a-zA-Z0-9]+)/i);
  return match ? match[1] : null;
}
