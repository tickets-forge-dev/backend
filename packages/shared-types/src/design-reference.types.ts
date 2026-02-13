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
  transcript?: string;
  sharedId: string;
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
  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(url)) {
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

  if (!url.startsWith('https://')) {
    return { valid: false, error: 'URL must use HTTPS' };
  }

  if (url.length > 2048) {
    return { valid: false, error: 'URL is too long (max 2048 characters)' };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
