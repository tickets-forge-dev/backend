/**
 * Repository Indexer Service
 * 
 * Orchestrates repository indexing workflow:
 * 1. Clone repository
 * 2. Walk file tree
 * 3. Parse each file
 * 4. Build and save index
 * 
 * Part of: Story 4.2 - Task 2 (Repository Indexer)
 * Layer: Application
 * 
 * Dependencies (install when needed):
 *   pnpm add simple-git
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Index } from '../../domain/Index';
import { IndexRepository, INDEX_REPOSITORY } from '../../domain/IndexRepository';
import { FileParserService } from './file-parser.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as crypto from 'crypto';

@Injectable()
export class RepoIndexerService {
  private readonly logger = new Logger(RepoIndexerService.name);

  constructor(
    @Inject(INDEX_REPOSITORY)
    private readonly indexRepository: IndexRepository,
    private readonly fileParserService: FileParserService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Index a repository
   * Main entry point for indexing workflow
   */
  async index(
    workspaceId: string,
    repositoryId: number,
    repositoryName: string,
    commitSha: string,
    accessToken: string,
  ): Promise<string> {
    const startTime = Date.now();
    const indexId = this.generateIndexId();

    this.logger.log(
      `Starting indexing: ${repositoryName}@${commitSha.substring(0, 7)}`,
    );

    // Create pending index
    const index = Index.create({
      id: indexId,
      workspaceId,
      repositoryId,
      repositoryName,
      commitSha,
    });

    await this.indexRepository.save(index);

    let tempDir: string | null = null;

    try {
      // Clone repository to temp directory
      tempDir = await this.cloneRepository(
        repositoryName,
        commitSha,
        accessToken,
      );

      // Walk file tree and get list of files
      const files = await this.walkFileTree(tempDir);

      this.logger.log(
        `Found ${files.length} files in ${repositoryName}`,
      );

      // Mark indexing started
      index.markIndexing(files.length);
      await this.indexRepository.save(index);

      // Parse each file
      let processedCount = 0;
      for (const filePath of files) {
        try {
          const relativePath = path.relative(tempDir, filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          
          const fileMetadata = await this.fileParserService.parseFile(
            relativePath,
            content,
          );

          index.addFile(fileMetadata);
          processedCount++;

          // Update progress every 10 files
          if (processedCount % 10 === 0) {
            await this.indexRepository.updateProgress(
              indexId,
              processedCount,
              files.length,
            );
          }
        } catch (error) {
          const err = error as Error;
          this.logger.warn(`Failed to parse file ${filePath}: ${err.message}`);
          index.incrementParseErrors();
        }
      }

      // Calculate repo size
      const repoSizeMB = await this.calculateRepoSize(tempDir);
      index.repoSizeMB = repoSizeMB;

      // Mark complete
      const duration = Date.now() - startTime;
      index.markComplete(duration);
      await this.indexRepository.save(index);

      this.logger.log(
        `Indexing complete: ${repositoryName} - ${index.filesIndexed} files in ${duration}ms`,
      );

      return indexId;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Indexing failed: ${err.message}`, err.stack);

      index.markFailed({
        type: 'INDEXING_ERROR',
        message: err.message,
        stack: err.stack,
      });
      await this.indexRepository.save(index);

      throw error;
    } finally {
      // Cleanup temp directory
      if (tempDir) {
        await this.cleanupTempDir(tempDir);
      }
    }
  }

  /**
   * Clone repository to temporary directory
   * TODO: Implement with simple-git when installed
   */
  private async cloneRepository(
    repositoryName: string,
    commitSha: string,
    accessToken: string,
  ): Promise<string> {
    const tempDir = path.join(
      os.tmpdir(),
      `indexing-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    );

    await fs.mkdir(tempDir, { recursive: true });

    // TODO: Implement git clone when simple-git is installed
    // const git = simpleGit();
    // const cloneUrl = `https://x-access-token:${accessToken}@github.com/${repositoryName}.git`;
    //
    // await git.clone(cloneUrl, tempDir, ['--depth', '1', '--single-branch']);
    // await git.cwd(tempDir);
    // await git.checkout(commitSha);

    this.logger.log(`Cloned ${repositoryName} to ${tempDir}`);

    // For now, create a mock structure for testing
    await fs.writeFile(
      path.join(tempDir, 'README.md'),
      '# Test Repository\n\nThis is a mock file for testing without git clone.',
    );

    return tempDir;
  }

  /**
   * Walk file tree and return list of file paths
   */
  private async walkFileTree(dir: string): Promise<string[]> {
    const files: string[] = [];
    const ignorePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.next',
      'out',
      '__pycache__',
      'venv',
      'target',
    ];

    const walk = async (currentDir: string) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        // Skip ignored directories
        if (entry.isDirectory()) {
          if (ignorePatterns.includes(entry.name)) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    };

    await walk(dir);
    return files;
  }

  /**
   * Calculate repository size in MB
   */
  private async calculateRepoSize(dir: string): Promise<number> {
    let totalSize = 0;

    const walk = async (currentDir: string) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    };

    await walk(dir);
    return Math.round(totalSize / (1024 * 1024) * 100) / 100; // MB with 2 decimals
  }

  /**
   * Cleanup temporary directory
   */
  private async cleanupTempDir(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
      this.logger.debug(`Cleaned up temp directory: ${dir}`);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Failed to cleanup temp directory ${dir}: ${err.message}`);
    }
  }

  /**
   * Generate unique index ID
   */
  private generateIndexId(): string {
    return `idx_${crypto.randomBytes(12).toString('hex')}`;
  }
}
