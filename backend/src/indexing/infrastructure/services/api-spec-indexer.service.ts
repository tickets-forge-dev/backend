/**
 * ApiSpec Indexer Implementation
 * Detects, parses, validates, and indexes OpenAPI specs from repositories
 * 
 * Part of: Story 4.3 - OpenAPI Spec Sync
 * Layer: Infrastructure
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SwaggerParser from '@apidevtools/swagger-parser';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { IApiSpecIndexer } from '../../application/services/api-spec-indexer.interface';
import {
  ApiSpecRepository,
  API_SPEC_REPOSITORY,
} from '../../domain/ApiSpecRepository';
import { ApiSpec } from '../../domain/entities/ApiSpec';
import { ApiEndpoint } from '../../domain/entities/ApiEndpoint';

@Injectable()
export class ApiSpecIndexerImpl implements IApiSpecIndexer {
  private readonly logger = new Logger(ApiSpecIndexerImpl.name);

  private readonly SPEC_FILE_NAMES = [
    'openapi.yaml',
    'openapi.yml',
    'openapi.json',
    'swagger.yaml',
    'swagger.yml',
    'swagger.json',
  ];

  private readonly SPEC_SEARCH_DIRS = ['', 'docs', 'api-docs', 'specifications'];

  constructor(
    @Inject(API_SPEC_REPOSITORY)
    private readonly repository: ApiSpecRepository,
    private readonly configService: ConfigService,
  ) {}

  async indexApiSpecs(
    workspaceId: string,
    repoName: string,
    commitSha: string,
  ): Promise<void> {
    const specId = this.generateSpecId(workspaceId, repoName);
    this.logger.log(`Indexing API specs for ${repoName}@${commitSha.substring(0, 7)}`);

    const tempDir = this.getTempRepoPath(repoName, commitSha);
    const specFile = await this.detectSpecFile(tempDir);

    if (!specFile) {
      this.logger.log(`No OpenAPI spec found in ${repoName} - graceful degradation`);
      
      const apiSpec = ApiSpec.create({
        id: specId,
        workspaceId,
        repoName,
        commitSha,
        hasSpec: false,
        isValid: true,
        endpoints: [],
      });

      await this.repository.save(apiSpec);
      return;
    }

    this.logger.log(`Found OpenAPI spec: ${specFile}`);

    try {
      const api = await SwaggerParser.validate(specFile);
      
      const specContent = await fs.readFile(specFile, 'utf-8');
      const hash = this.computeHash(specContent);
      const endpoints = this.extractEndpoints(api);
      const version = (api as any).openapi || (api as any).swagger || 'unknown';

      const apiSpec = ApiSpec.create({
        id: specId,
        workspaceId,
        repoName,
        commitSha,
        specUrl: path.relative(tempDir, specFile),
        hash,
        endpoints,
        version,
        hasSpec: true,
        isValid: true,
      });

      await this.repository.save(apiSpec);
      this.logger.log(
        `Successfully indexed API spec: ${endpoints.length} endpoints`,
      );
    } catch (error) {
      this.logger.warn(
        `OpenAPI spec validation failed for ${repoName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      const specContent = await fs.readFile(specFile, 'utf-8');
      const hash = this.computeHash(specContent);

      const apiSpec = ApiSpec.create({
        id: specId,
        workspaceId,
        repoName,
        commitSha,
        specUrl: path.relative(tempDir, specFile),
        hash,
        hasSpec: true,
        isValid: false,
        validationErrors: [error instanceof Error ? error.message : 'Unknown error'],
        endpoints: [],
      });

      await this.repository.save(apiSpec);
    }
  }

  async findEndpointsByIntent(
    intent: string,
    specId: string,
  ): Promise<ApiEndpoint[]> {
    const spec = await this.repository.findById(specId);
    
    if (!spec || !spec.hasSpec) {
      return [];
    }

    const keywords = intent.toLowerCase().split(/\s+/);
    
    return spec.endpoints.filter((endpoint) => {
      const searchText = `${endpoint.path} ${endpoint.method} ${endpoint.summary || ''} ${endpoint.operationId || ''}`.toLowerCase();
      return keywords.some((keyword) => searchText.includes(keyword));
    });
  }

  async getSpecByRepo(
    workspaceId: string,
    repoName: string,
  ): Promise<ApiSpec | null> {
    return this.repository.findByRepo(workspaceId, repoName);
  }

  private async detectSpecFile(repoPath: string): Promise<string | null> {
    for (const dir of this.SPEC_SEARCH_DIRS) {
      const searchPath = path.join(repoPath, dir);
      
      try {
        await fs.access(searchPath);
      } catch {
        continue;
      }

      for (const fileName of this.SPEC_FILE_NAMES) {
        const filePath = path.join(searchPath, fileName);
        
        try {
          await fs.access(filePath);
          return filePath;
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  private extractEndpoints(api: any): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];

    if (!api.paths) {
      return endpoints;
    }

    for (const [path, pathItem] of Object.entries(api.paths)) {
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
      
      for (const method of methods) {
        const operation = (pathItem as any)[method];
        
        if (operation) {
          endpoints.push({
            path,
            method: method.toUpperCase(),
            operationId: operation.operationId,
            summary: operation.summary,
            requestSchema: operation.requestBody?.content,
            responseSchema: operation.responses,
          });
        }
      }
    }

    return endpoints;
  }

  private computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private generateSpecId(workspaceId: string, repoName: string): string {
    const combined = `${workspaceId}-${repoName}`;
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
  }

  private getTempRepoPath(repoName: string, commitSha: string): string {
    const tempBase = this.configService.get<string>('TEMP_REPOS_PATH') || '/tmp/forge-repos';
    return path.join(tempBase, `${repoName}-${commitSha.substring(0, 7)}`);
  }
}
