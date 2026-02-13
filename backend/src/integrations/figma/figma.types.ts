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

/**
 * Response from Figma OAuth token endpoint (uses snake_case from API)
 */
export interface FigmaOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  user_id?: number;
  user_id_string?: string;
}

/**
 * Normalized token stored in database (uses camelCase)
 */
export interface FigmaOAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  userId?: string;
  savedAt?: number; // Timestamp when token was saved (milliseconds)
}
