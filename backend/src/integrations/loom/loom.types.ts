/**
 * Loom API types and interfaces
 */

export interface LoomVideo {
  id: string;
  name: string;
  duration: number; // seconds
  thumbnail_url: string;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

export interface LoomMetadata {
  videoId: string;
  videoTitle: string;
  duration: number; // seconds
  thumbnailUrl: string;
  lastModified: Date;
}

export interface LoomOAuthToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}
