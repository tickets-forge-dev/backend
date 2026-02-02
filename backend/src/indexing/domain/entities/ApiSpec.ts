/**
 * ApiSpec Domain Entity
 * Represents OpenAPI specification metadata for a repository
 * 
 * Part of: Story 4.3 - OpenAPI Spec Sync
 * Layer: Domain
 */

import { ApiEndpoint } from './ApiEndpoint';

export interface ApiSpec {
  id: string;
  workspaceId: string;
  repoName: string;
  specUrl: string;
  hash: string;
  endpoints: ApiEndpoint[];
  version: string;
  commitSha: string;
  hasSpec: boolean;
  isValid: boolean;
  validationErrors?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ApiSpec {
  static create(params: {
    id: string;
    workspaceId: string;
    repoName: string;
    commitSha: string;
    specUrl?: string;
    hash?: string;
    endpoints?: ApiEndpoint[];
    version?: string;
    hasSpec?: boolean;
    isValid?: boolean;
    validationErrors?: string[];
  }): ApiSpec {
    return {
      id: params.id,
      workspaceId: params.workspaceId,
      repoName: params.repoName,
      specUrl: params.specUrl || '',
      hash: params.hash || '',
      endpoints: params.endpoints || [],
      version: params.version || '',
      commitSha: params.commitSha,
      hasSpec: params.hasSpec ?? false,
      isValid: params.isValid ?? true,
      validationErrors: params.validationErrors,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
