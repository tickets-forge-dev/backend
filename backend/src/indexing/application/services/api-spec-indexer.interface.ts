/**
 * ApiSpec Indexer Service Interface
 * Port for indexing OpenAPI specifications from repositories
 * 
 * Part of: Story 4.3 - OpenAPI Spec Sync
 * Layer: Application
 */

import { ApiEndpoint } from '../../domain/entities/ApiEndpoint';
import { ApiSpec } from '../../domain/entities/ApiSpec';

export const API_SPEC_INDEXER = 'API_SPEC_INDEXER';

export interface IApiSpecIndexer {
  indexApiSpecs(
    workspaceId: string,
    repoName: string,
    commitSha: string,
  ): Promise<void>;

  findEndpointsByIntent(
    intent: string,
    specId: string,
  ): Promise<ApiEndpoint[]>;

  getSpecByRepo(
    workspaceId: string,
    repoName: string,
  ): Promise<ApiSpec | null>;
}
