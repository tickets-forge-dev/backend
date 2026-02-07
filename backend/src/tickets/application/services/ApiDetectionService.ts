import { Injectable } from '@nestjs/common';
import { GitHubApiClient } from '../ports/GitHubApiClient';
import { TechSpec } from '../../domain/tech-spec/TechSpec';
import { AEC } from '../../domain/aec/AEC';

export interface DetectedApi {
  id: string;
  status: 'existing' | 'new' | 'modified' | 'delete';
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  request: {
    shape: string;
    example?: Record<string, unknown>;
  };
  response: {
    shape: string;
    example?: Record<string, unknown>;
  };
  description: string;
  sourceFile?: string;
  curlCommand: string;
  confidence: 'high' | 'medium' | 'low';
  createdAt: Date;
  confirmedAt?: Date;
}

export interface ApiDetectionResult {
  apis: DetectedApi[];
  fromCodebase: DetectedApi[];
  fromSpec: DetectedApi[];
  conflicts: DetectedApi[]; // APIs that exist in codebase but spec says to create new
}

@Injectable()
export class ApiDetectionService {
  constructor(private gitHubApi: GitHubApiClient) {}

  /**
   * Detect all APIs from the codebase by scanning controller files
   */
  async detectApisFromCodebase(
    owner: string,
    repo: string,
    branch: string = 'main',
  ): Promise<DetectedApi[]> {
    const controllerFiles = await this.findControllerFiles(owner, repo, branch);
    const detectedApis: DetectedApi[] = [];

    for (const file of controllerFiles) {
      const content = await this.gitHubApi.getFileContent(
        owner,
        repo,
        file.path,
        branch,
      );
      const apis = this.parseControllerFile(content, file.path);
      detectedApis.push(...apis);
    }

    return detectedApis;
  }

  /**
   * Detect APIs from spec analysis (via LLM during deep analysis)
   * This is called from DeepAnalysisServiceImpl with parsed LLM response
   */
  async detectApisFromSpec(
    spec: TechSpec,
    aec: AEC,
    llmResponse: any,
  ): Promise<DetectedApi[]> {
    // LLM response format (from DeepAnalysisServiceImpl):
    // {
    //   apis: [
    //     {
    //       method: "POST",
    //       path: "/api/feature",
    //       status: "new|modified|delete",
    //       request: { example: {...} },
    //       response: { example: {...} },
    //       description: "...",
    //       confidence: "high|medium|low"
    //     }
    //   ]
    // }

    if (!llmResponse?.apis || !Array.isArray(llmResponse.apis)) {
      return [];
    }

    return llmResponse.apis.map((api: any, index: number) => ({
      id: `spec-${Date.now()}-${index}`,
      status: api.status || 'new',
      method: api.method.toUpperCase(),
      path: api.path,
      request: {
        shape: this.jsonToSchema(api.request?.example),
        example: api.request?.example,
      },
      response: {
        shape: this.jsonToSchema(api.response?.example),
        example: api.response?.example,
      },
      description: api.description || '',
      confidence: api.confidence || 'medium',
      curlCommand: this.generateCurlCommand(
        api.method,
        api.path,
        api.request?.example,
      ),
      createdAt: new Date(),
    }));
  }

  /**
   * Merge detected APIs from codebase and spec
   * Mark conflicts where spec says "create new" but API exists
   */
  async mergeApiLists(
    coedbaseApis: DetectedApi[],
    specApis: DetectedApi[],
  ): Promise<ApiDetectionResult> {
    const conflicts: DetectedApi[] = [];
    const merged: DetectedApi[] = [];
    const codebasePathSet = new Set(coedbaseApis.map((a) => `${a.method}:${a.path}`));

    // Add codebase APIs (existing)
    for (const api of coedbaseApis) {
      merged.push({
        ...api,
        status: 'existing',
      });
    }

    // Add spec APIs, checking for conflicts
    for (const api of specApis) {
      const pathKey = `${api.method}:${api.path}`;

      if (api.status === 'new' && codebasePathSet.has(pathKey)) {
        // Conflict: spec says create new but exists
        conflicts.push({
          ...api,
          status: 'existing', // Override: it exists
        });
      } else if (api.status === 'modified' && !codebasePathSet.has(pathKey)) {
        // Spec says modify but doesn't exist → treat as new
        merged.push({
          ...api,
          status: 'new',
        });
      } else if (api.status === 'delete' && codebasePathSet.has(pathKey)) {
        // Mark existing API for deletion
        merged.push({
          ...api,
          status: 'delete',
        });
      } else {
        // No conflict
        merged.push(api);
      }
    }

    return {
      apis: merged,
      fromCodebase: coedbaseApis,
      fromSpec: specApis,
      conflicts,
    };
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  /**
   * Find all controller files in the backend
   */
  private async findControllerFiles(
    owner: string,
    repo: string,
    branch: string,
  ): Promise<Array<{ path: string; name: string }>> {
    // Scan: backend/src/**/*.controller.ts
    const treeData = await this.gitHubApi.getRepositoryTree(
      owner,
      repo,
      branch,
    );

    const controllerFiles: Array<{ path: string; name: string }> = [];

    // Recursive search for .controller.ts files
    const search = (items: any[], prefix: string = '') => {
      for (const item of items) {
        const fullPath = prefix ? `${prefix}/${item.path}` : item.path;

        if (item.type === 'blob' && fullPath.includes('.controller.ts')) {
          if (fullPath.startsWith('backend/src/')) {
            controllerFiles.push({
              path: fullPath,
              name: item.path,
            });
          }
        } else if (item.type === 'tree' && fullPath.startsWith('backend/src/')) {
          // Could recurse, but for now just collect top-level search results
        }
      }
    };

    search(treeData.tree || []);
    return controllerFiles;
  }

  /**
   * Parse a single controller file to extract API endpoints
   * Looks for @Get, @Post, @Put, @Patch, @Delete decorators
   */
  private parseControllerFile(content: string, filePath: string): DetectedApi[] {
    const apis: DetectedApi[] = [];

    // Regex to find NestJS route decorators
    // Matches: @Get('path'), @Post('path'), etc.
    const decoratorRegex =
      /@(Get|Post|Put|Patch|Delete)\(['"]([^'"]+)['"]\)/g;

    let match;
    const basePathMatch = content.match(/@Controller\(['"]([^'"]+)['"]\)/);
    const basePath = basePathMatch ? basePathMatch[1] : '';

    while ((match = decoratorRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const path = match[2];
      const fullPath = basePath ? `/${basePath}/${path}`.replace(/\/+/g, '/') : `/${path}`;

      apis.push({
        id: `codebase-${filePath}-${fullPath}`,
        status: 'existing',
        method: method as any,
        path: fullPath,
        request: {
          shape: 'unknown (auto-detected from codebase)',
        },
        response: {
          shape: 'unknown (auto-detected from codebase)',
        },
        description: `Found in ${filePath}`,
        sourceFile: filePath,
        confidence: 'high',
        curlCommand: this.generateCurlCommand(method, fullPath, undefined),
        createdAt: new Date(),
      });
    }

    return apis;
  }

  /**
   * Convert JSON object to schema string
   */
  private jsonToSchema(obj: any): string {
    if (!obj) return '{}';
    if (typeof obj !== 'object') return typeof obj;

    const schemaObj: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      schemaObj[key] = typeof value;
    }

    return JSON.stringify(schemaObj);
  }

  /**
   * Generate a cURL command for testing
   */
  private generateCurlCommand(
    method: string,
    path: string,
    example?: Record<string, unknown>,
  ): string {
    const url = `http://localhost:3000${path}`;
    let cmd = `curl -X ${method} '${url}'`;

    if (example && method !== 'GET' && method !== 'DELETE') {
      const jsonStr = JSON.stringify(example);
      cmd += ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${jsonStr}'`;
    }

    return cmd;
  }
}
