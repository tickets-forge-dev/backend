/**
 * Index Query Service
 * 
 * Provides search and query capabilities over indexed repositories.
 * Used by ticket generation to find relevant code modules.
 * 
 * Part of: Story 4.2 - Task 6 (Query Service)
 * Layer: Application
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { IndexRepository, INDEX_REPOSITORY } from '../../domain/IndexRepository';
import { FileMetadata } from '../../domain/FileMetadata';

export interface Module {
  path: string;
  language: string;
  exports: string[];
  imports: string[];
  functions: string[];
  classes: string[];
  summary: string;
  relevanceScore: number;
}

export interface IndexStats {
  totalFiles: number;
  filesIndexed: number;
  filesSkipped: number;
  parseErrors: number;
  languages: Record<string, number>;
  successRate: number;
}

@Injectable()
export class IndexQueryService {
  private readonly logger = new Logger(IndexQueryService.name);

  constructor(
    @Inject(INDEX_REPOSITORY)
    private readonly indexRepository: IndexRepository,
  ) {}

  /**
   * Find modules by intent/keywords
   * Main query method for ticket generation
   */
  async findModulesByIntent(
    intent: string,
    indexId: string,
    limit: number = 10,
  ): Promise<Module[]> {
    // Handle edge case: limit=0 returns empty
    if (limit === 0) {
      return [];
    }

    const index = await this.indexRepository.findById(indexId);

    if (!index) {
      throw new Error(`Index not found: ${indexId}`);
    }

    if (index.status !== 'completed') {
      throw new Error(`Index not ready: ${index.status}`);
    }

    // Extract keywords from intent
    const keywords = this.extractKeywords(intent);

    // Score and rank files
    const scoredFiles = index.files
      .map((file) => ({
        ...file,
        relevanceScore: this.calculateRelevance(file, keywords),
      }))
      .filter((file) => file.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return scoredFiles.map((file) => ({
      path: file.path,
      language: file.language,
      exports: file.exports,
      imports: file.imports,
      functions: file.functions,
      classes: file.classes,
      summary: file.summary,
      relevanceScore: file.relevanceScore,
    }));
  }

  /**
   * Find files by path pattern
   */
  async findFilesByPath(
    pattern: string,
    indexId: string,
  ): Promise<FileMetadata[]> {
    const index = await this.indexRepository.findById(indexId);

    if (!index) {
      throw new Error(`Index not found: ${indexId}`);
    }

    const regex = new RegExp(pattern, 'i');
    return index.files.filter((file) => regex.test(file.path));
  }

  /**
   * Phase B Fix #8: Check if index is ready for querying
   * Returns status information about the index
   */
  async getIndexStatus(indexId: string): Promise<{
    exists: boolean;
    status: 'completed' | 'in-progress' | 'failed' | 'unknown';
    ready: boolean;
    message: string;
  }> {
    try {
      const index = await this.indexRepository.findById(indexId);

      if (!index) {
        return {
          exists: false,
          status: 'unknown',
          ready: false,
          message: 'Index not found',
        };
      }

      const ready = index.status === 'completed';
      let message = '';

      switch (index.status) {
        case 'completed':
          message = `Index ready (${index.filesIndexed} files indexed)`;
          break;
        case 'in-progress':
          message = `Indexing in progress (${index.filesIndexed}/${index.totalFiles} files)`;
          break;
        case 'failed':
          message = 'Indexing failed';
          break;
        default:
          message = `Index status: ${index.status}`;
      }

      return {
        exists: true,
        status: index.status as any,
        ready,
        message,
      };
    } catch (error) {
      this.logger.error(`Failed to get index status: ${error.message}`, error.stack);
      return {
        exists: false,
        status: 'unknown',
        ready: false,
        message: `Error checking index: ${error.message}`,
      };
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(indexId: string): Promise<IndexStats> {
    const index = await this.indexRepository.findById(indexId);

    if (!index) {
      throw new Error(`Index not found: ${indexId}`);
    }

    // Count files by language
    const languages: Record<string, number> = {};
    for (const file of index.files) {
      languages[file.language] = (languages[file.language] || 0) + 1;
    }

    return {
      totalFiles: index.totalFiles,
      filesIndexed: index.filesIndexed,
      filesSkipped: index.filesSkipped,
      parseErrors: index.parseErrors,
      languages,
      successRate: index.getSuccessRate(),
    };
  }

  /**
   * Extract keywords from intent string
   */
  private extractKeywords(intent: string): string[] {
    // Convert to lowercase and split on non-alphanumeric
    const words = intent
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2); // Skip short words

    // Remove common stop words
    const stopWords = new Set([
      'the',
      'and',
      'for',
      'are',
      'but',
      'not',
      'you',
      'all',
      'can',
      'her',
      'was',
      'one',
      'our',
      'out',
      'from',
      'this',
      'that',
      'with',
      'have',
      'will',
      'been',
    ]);

    return words.filter((word) => !stopWords.has(word));
  }

  /**
   * Calculate relevance score for a file against keywords
   */
  private calculateRelevance(
    file: FileMetadata,
    keywords: string[],
  ): number {
    let score = 0;

    const lowerPath = file.path.toLowerCase();
    const lowerSummary = file.summary.toLowerCase();

    for (const keyword of keywords) {
      // Path matches (high value)
      if (lowerPath.includes(keyword)) {
        score += 5;
      }

      // Export matches (high value)
      for (const exp of file.exports) {
        if (exp.toLowerCase().includes(keyword)) {
          score += 4;
        }
      }

      // Function/class matches (medium value)
      for (const func of file.functions) {
        if (func.toLowerCase().includes(keyword)) {
          score += 3;
        }
      }

      for (const cls of file.classes) {
        if (cls.toLowerCase().includes(keyword)) {
          score += 3;
        }
      }

      // Summary matches (low value)
      if (lowerSummary.includes(keyword)) {
        score += 1;
      }
    }

    // Boost files with more symbols (indicates utility/importance)
    score += Math.min(file.getSymbolCount() / 10, 2);

    return score;
  }
}
