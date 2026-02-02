/**
 * Index Aggregate Root
 * 
 * Represents a repository code index with its lifecycle.
 * Domain entity - no framework dependencies (Clean Architecture).
 * 
 * Part of: Story 4.2 - Task 2 (Domain Models)
 * Layer: Domain
 */

import { FileMetadata } from './FileMetadata';

export type IndexStatus = 'pending' | 'indexing' | 'completed' | 'failed';

export interface ErrorDetails {
  type: string;
  message: string;
  files?: string[];
  stack?: string;
}

export class Index {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly repositoryId: number,
    public readonly repositoryName: string,
    public readonly commitSha: string,
    public status: IndexStatus,
    public filesIndexed: number,
    public totalFiles: number,
    public filesSkipped: number,
    public parseErrors: number,
    public readonly createdAt: Date,
    public completedAt: Date | null,
    public indexDurationMs: number,
    public repoSizeMB: number,
    public errorDetails: ErrorDetails | null,
    public files: FileMetadata[],
  ) {}

  /**
   * Factory method - Create new pending index
   */
  static create(data: {
    id: string;
    workspaceId: string;
    repositoryId: number;
    repositoryName: string;
    commitSha: string;
  }): Index {
    return new Index(
      data.id,
      data.workspaceId,
      data.repositoryId,
      data.repositoryName,
      data.commitSha,
      'pending',
      0, // filesIndexed
      0, // totalFiles
      0, // filesSkipped
      0, // parseErrors
      new Date(),
      null, // completedAt
      0, // indexDurationMs
      0, // repoSizeMB
      null, // errorDetails
      [], // files
    );
  }

  /**
   * Business Logic: Add successfully parsed file
   */
  addFile(file: FileMetadata): void {
    this.files.push(file);
    this.filesIndexed++;
  }

  /**
   * Business Logic: Mark indexing started
   */
  markIndexing(totalFiles: number): void {
    if (this.status !== 'pending') {
      throw new Error(`Cannot start indexing - current status: ${this.status}`);
    }
    this.status = 'indexing';
    this.totalFiles = totalFiles;
  }

  /**
   * Business Logic: Mark indexing completed successfully
   */
  markComplete(durationMs: number): void {
    if (this.status !== 'indexing') {
      throw new Error(`Cannot complete - current status: ${this.status}`);
    }
    this.status = 'completed';
    this.completedAt = new Date();
    this.indexDurationMs = durationMs;
  }

  /**
   * Business Logic: Mark indexing failed
   */
  markFailed(error: ErrorDetails): void {
    this.status = 'failed';
    this.completedAt = new Date();
    this.errorDetails = error;
  }

  /**
   * Business Logic: Increment skipped file count
   */
  incrementSkipped(): void {
    this.filesSkipped++;
  }

  /**
   * Business Logic: Increment parse error count
   */
  incrementParseErrors(): void {
    this.parseErrors++;
  }

  /**
   * Query: Get completion percentage
   */
  getProgress(): number {
    if (this.totalFiles === 0) return 0;
    return Math.round((this.filesIndexed / this.totalFiles) * 100);
  }

  /**
   * Query: Check if indexing is in progress
   */
  isIndexing(): boolean {
    return this.status === 'indexing';
  }

  /**
   * Query: Check if indexing completed (successfully or failed)
   */
  isComplete(): boolean {
    return this.status === 'completed' || this.status === 'failed';
  }

  /**
   * Query: Get success rate (parsed files / total attempted)
   */
  getSuccessRate(): number {
    const attempted = this.filesIndexed + this.filesSkipped + this.parseErrors;
    if (attempted === 0) return 100;
    return Math.round((this.filesIndexed / attempted) * 100);
  }

  /**
   * Query: Get total files processed (including skipped/errors)
   */
  getTotalProcessed(): number {
    return this.filesIndexed + this.filesSkipped + this.parseErrors;
  }

  /**
   * Validation: Check if ready to mark complete
   */
  canComplete(): boolean {
    return (
      this.status === 'indexing' &&
      this.getTotalProcessed() >= this.totalFiles
    );
  }
}
