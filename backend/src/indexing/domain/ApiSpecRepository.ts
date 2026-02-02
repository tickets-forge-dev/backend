/**
 * ApiSpec Repository Port
 * Persistence abstraction for ApiSpec entities
 * 
 * Part of: Story 4.3 - OpenAPI Spec Sync
 * Layer: Domain
 */

import { ApiSpec } from './entities/ApiSpec';

export const API_SPEC_REPOSITORY = 'API_SPEC_REPOSITORY';

export interface ApiSpecRepository {
  save(apiSpec: ApiSpec): Promise<void>;
  findByRepo(workspaceId: string, repoName: string): Promise<ApiSpec | null>;
  findById(specId: string): Promise<ApiSpec | null>;
  update(specId: string, updates: Partial<ApiSpec>): Promise<void>;
}
