/**
 * Figma API types and interfaces
 */

export interface FigmaFile {
  key: string;
  name: string;
  lastModified: string; // ISO 8601 datetime
  thumbnailUrl: string;
  version: string;
  documentationLinks: string[];
}

export interface FigmaMetadata {
  fileKey: string;
  fileName: string;
  thumbnailUrl: string;
  lastModified: Date;
}

export interface FigmaOAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  scope?: string;
}
