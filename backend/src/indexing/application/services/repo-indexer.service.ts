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
import { IApiSpecIndexer, API_SPEC_INDEXER } from './api-spec-indexer.interface';
import { FileParserService } from './file-parser.service';
import simpleGit from 'simple-git';
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
    @Inject(API_SPEC_INDEXER)
    private readonly apiSpecIndexer: IApiSpecIndexer,
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
    const indexingSummary = {
      filesIndexed: 0,
      languagesDetected: new Set<string>(),
      hasDocumentation: false,
      hasTests: false,
      hasApiSpec: false,
      documentationFiles: [] as string[],
      testFiles: [] as string[],
      configFiles: [] as string[],
    };

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

      // Parse files in batches to reduce memory pressure
      const BATCH_SIZE = 50;
      let processedCount = 0;
      
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, Math.min(i + BATCH_SIZE, files.length));
        
        // Process batch
        for (const filePath of batch) {
          try {
            const relativePath = path.relative(tempDir, filePath);
            
            // Read file content with size limit
            const content = await this.readFileSafely(filePath);
            if (!content) {
              continue; // Skip if file is too large or unreadable
            }
            
            const fileMetadata = await this.fileParserService.parseFile(
              relativePath,
              content,
            );

            index.addFile(fileMetadata);
            processedCount++;

            // Collect summary information
            if (fileMetadata.language) {
              indexingSummary.languagesDetected.add(fileMetadata.language);
            }
            
            // Detect documentation files
            if (this.isDocumentationFile(relativePath)) {
              indexingSummary.hasDocumentation = true;
              indexingSummary.documentationFiles.push(relativePath);
            }
            
            // Detect test files
            if (this.isTestFile(relativePath)) {
              indexingSummary.hasTests = true;
              indexingSummary.testFiles.push(relativePath);
            }
            
            // Detect config files
            if (this.isConfigFile(relativePath)) {
              indexingSummary.configFiles.push(relativePath);
            }

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
        
        // Force garbage collection between batches if available
        if (global.gc) {
          global.gc();
        }
        
        this.logger.debug(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)}`);
      }

      indexingSummary.filesIndexed = processedCount;

      // Calculate repo size
      const repoSizeMB = await this.calculateRepoSize(tempDir);
      index.repoSizeMB = repoSizeMB;

      // Index API specs (Story 4.3)
      this.logger.log('Indexing API specifications...');
      try {
        await this.apiSpecIndexer.indexApiSpecs(
          workspaceId,
          repositoryName,
          commitSha,
        );
        indexingSummary.hasApiSpec = true;
      } catch (error) {
        const err = error as Error;
        this.logger.warn(`API spec indexing failed: ${err.message}`);
      }

      // Mark complete
      const duration = Date.now() - startTime;
      index.markComplete(duration);
      
      // Set summary
      index.summary = {
        languagesDetected: Array.from(indexingSummary.languagesDetected),
        hasDocumentation: indexingSummary.hasDocumentation,
        hasTests: indexingSummary.hasTests,
        hasApiSpec: indexingSummary.hasApiSpec,
        documentationFiles: indexingSummary.documentationFiles,
        testFiles: indexingSummary.testFiles,
        configFiles: indexingSummary.configFiles,
      };
      
      await this.indexRepository.save(index);

      // Log detailed summary
      this.logIndexingSummary(repositoryName, duration, repoSizeMB, indexingSummary);

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

    try {
      const git = simpleGit();
      const cloneUrl = `https://x-access-token:${accessToken}@github.com/${repositoryName}.git`;

      this.logger.log(`Cloning ${repositoryName} from GitHub...`);

      // Clone with depth 1 for faster cloning
      await git.clone(cloneUrl, tempDir, ['--depth', '1', '--single-branch', '--no-tags']);

      this.logger.log(`Cloned ${repositoryName} to ${tempDir}`);

      // Checkout specific commit if needed (might require fetching more history)
      const repoGit = simpleGit(tempDir);
      const currentSha = await repoGit.revparse(['HEAD']);
      
      if (currentSha.trim() !== commitSha) {
        this.logger.log(`Checking out specific commit ${commitSha.substring(0, 7)}...`);
        try {
          await repoGit.fetch(['origin', commitSha]);
          await repoGit.checkout(commitSha);
        } catch (error) {
          this.logger.warn(`Could not checkout specific commit, using HEAD: ${(error as Error).message}`);
        }
      }

      return tempDir;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to clone repository: ${err.message}`);
      throw new Error(`Failed to clone repository: ${err.message}`);
    }
  }

  /**
   * Walk file tree and return list of file paths
   * Only includes files we should index (skips large files, binaries, etc.)
   */
  private async walkFileTree(dir: string): Promise<string[]> {
    const files: string[] = [];
    const MAX_FILE_SIZE_MB = 5; // Skip files larger than 5MB
    const MAX_FILES = 10000; // Safety limit to prevent excessive memory usage
    
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
      '.turbo',
      'tmp',
      'temp',
    ];

    const binaryExtensions = new Set([
      '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
      '.woff', '.woff2', '.ttf', '.eot',
      '.mp4', '.webm', '.ogg',
      '.zip', '.tar', '.gz',
      '.exe', '.dll', '.so', '.dylib',
    ]);

    const walk = async (currentDir: string) => {
      if (files.length >= MAX_FILES) {
        this.logger.warn(`Reached maximum file limit (${MAX_FILES}), stopping walk`);
        return;
      }

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
          // Skip binary files
          const ext = path.extname(entry.name).toLowerCase();
          if (binaryExtensions.has(ext)) {
            continue;
          }

          // Check file size
          try {
            const stats = await fs.stat(fullPath);
            const sizeMB = stats.size / (1024 * 1024);
            
            if (sizeMB > MAX_FILE_SIZE_MB) {
              this.logger.debug(`Skipping large file (${sizeMB.toFixed(2)}MB): ${fullPath}`);
              continue;
            }
            
            files.push(fullPath);
          } catch (error) {
            this.logger.warn(`Failed to stat file ${fullPath}: ${(error as Error).message}`);
          }
        }
      }
    };

    await walk(dir);
    return files;
  }

  /**
   * Read file safely with size limit and UTF-8 check
   */
  private async readFileSafely(filePath: string): Promise<string | null> {
    const MAX_CONTENT_SIZE_MB = 2; // Skip file content if larger than 2MB
    
    try {
      const stats = await fs.stat(filePath);
      const sizeMB = stats.size / (1024 * 1024);
      
      if (sizeMB > MAX_CONTENT_SIZE_MB) {
        this.logger.debug(`Skipping file content (${sizeMB.toFixed(2)}MB): ${filePath}`);
        return null;
      }
      
      // Try to read as UTF-8
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Basic check for binary content (null bytes)
      if (content.includes('\0')) {
        this.logger.debug(`Skipping binary file: ${filePath}`);
        return null;
      }
      
      return content;
    } catch (error) {
      const err = error as Error;
      // Probably a binary file or encoding issue
      this.logger.debug(`Cannot read file as UTF-8: ${filePath} - ${err.message}`);
      return null;
    }
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

  /**
   * Check if file is documentation
   */
  private isDocumentationFile(filePath: string): boolean {
    const fileName = path.basename(filePath).toLowerCase();
    const dirName = path.dirname(filePath).toLowerCase();
    
    return (
      fileName.startsWith('readme') ||
      fileName === 'contributing.md' ||
      fileName === 'changelog.md' ||
      fileName === 'license' ||
      fileName === 'license.md' ||
      dirName.includes('docs') ||
      dirName.includes('documentation') ||
      filePath.toLowerCase().endsWith('.mdx')
    );
  }

  /**
   * Check if file is a test file
   */
  private isTestFile(filePath: string): boolean {
    const fileName = path.basename(filePath).toLowerCase();
    const dirName = path.dirname(filePath).toLowerCase();
    
    return (
      fileName.includes('.test.') ||
      fileName.includes('.spec.') ||
      fileName.endsWith('_test.py') ||
      fileName.endsWith('_test.go') ||
      dirName.includes('__tests__') ||
      dirName.includes('test') ||
      dirName.includes('tests') ||
      dirName.includes('spec')
    );
  }

  /**
   * Check if file is a configuration file
   */
  private isConfigFile(filePath: string): boolean {
    const fileName = path.basename(filePath).toLowerCase();
    
    return (
      fileName === 'package.json' ||
      fileName === 'tsconfig.json' ||
      fileName === 'webpack.config.js' ||
      fileName === 'jest.config.js' ||
      fileName === '.eslintrc' ||
      fileName === '.eslintrc.json' ||
      fileName === '.prettierrc' ||
      fileName === 'dockerfile' ||
      fileName === 'docker-compose.yml' ||
      fileName === '.env.example' ||
      fileName === 'makefile' ||
      fileName.endsWith('.config.js') ||
      fileName.endsWith('.config.ts') ||
      fileName.endsWith('.yml') ||
      fileName.endsWith('.yaml')
    );
  }

  /**
   * Log detailed indexing summary
   */
  private logIndexingSummary(
    repositoryName: string,
    duration: number,
    repoSizeMB: number,
    summary: {
      filesIndexed: number;
      languagesDetected: Set<string>;
      hasDocumentation: boolean;
      hasTests: boolean;
      hasApiSpec: boolean;
      documentationFiles: string[];
      testFiles: string[];
      configFiles: string[];
    },
  ): void {
    const languages = Array.from(summary.languagesDetected).join(', ') || 'none detected';
    
    this.logger.log(`
╔════════════════════════════════════════════════════════════════╗
║  Indexing Complete: ${repositoryName.padEnd(43)}║
╠════════════════════════════════════════════════════════════════╣
║  📊 Summary:                                                   ║
║    • Files indexed: ${String(summary.filesIndexed).padEnd(46)}║
║    • Repository size: ${String(repoSizeMB).padEnd(44)} MB    ║
║    • Duration: ${String((duration / 1000).toFixed(2)).padEnd(49)} sec  ║
║    • Languages: ${languages.padEnd(47)}║
║                                                                ║
║  📚 Documentation:                                             ║
║    • Has docs: ${(summary.hasDocumentation ? '✓ Yes' : '✗ No').padEnd(49)}║
${summary.documentationFiles.length > 0 ? `║    • Found: ${summary.documentationFiles.slice(0, 2).join(', ').padEnd(50)}║` : ''}
║                                                                ║
║  🧪 Tests:                                                     ║
║    • Has tests: ${(summary.hasTests ? '✓ Yes' : '✗ No').padEnd(48)}║
${summary.testFiles.length > 0 ? `║    • Test files: ${String(summary.testFiles.length).padEnd(45)}║` : ''}
║                                                                ║
║  🔌 API Specifications:                                        ║
║    • Has API spec: ${(summary.hasApiSpec ? '✓ Yes' : '✗ No').padEnd(45)}║
║                                                                ║
║  ⚙️  Configuration:                                            ║
║    • Config files: ${String(summary.configFiles.length).padEnd(45)}║
╚════════════════════════════════════════════════════════════════╝
    `.trim());
  }
}
