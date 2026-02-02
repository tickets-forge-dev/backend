/**
 * Indexing DTOs
 * 
 * Data Transfer Objects for indexing API endpoints.
 * Validation and serialization schemas.
 * 
 * Part of: Story 4.2 - Task 7 (Controllers & DTOs)
 * Layer: Presentation
 */

import { IsString, IsNumber, IsOptional, Min, Max, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartIndexingDto {
  @ApiProperty({
    description: 'Repository ID from GitHub',
    example: 123456789,
  })
  @IsNumber()
  repositoryId!: number;

  @ApiProperty({
    description: 'Repository full name (owner/repo)',
    example: 'facebook/react',
  })
  @IsString()
  @IsNotEmpty()
  repositoryName!: string;

  @ApiProperty({
    description: 'Commit SHA to index',
    example: 'abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  commitSha!: string;
}

export class QueryIndexDto {
  @ApiProperty({
    description: 'Intent or keywords to search for',
    example: 'authentication service user login',
  })
  @IsString()
  intent!: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class IndexStatusResponseDto {
  @ApiProperty({ description: 'Index ID' })
  indexId!: string;

  @ApiProperty({ description: 'Repository ID from GitHub' })
  repositoryId!: number;

  @ApiProperty({ description: 'Repository name' })
  repositoryName!: string;

  @ApiProperty({
    description: 'Index status',
    enum: ['pending', 'indexing', 'completed', 'failed'],
  })
  status!: string;

  @ApiProperty({ description: 'Files indexed so far' })
  filesIndexed!: number;

  @ApiProperty({ description: 'Total files to index' })
  totalFiles!: number;

  @ApiProperty({ description: 'Files skipped' })
  filesSkipped!: number;

  @ApiProperty({ description: 'Parse errors encountered' })
  parseErrors!: number;

  @ApiProperty({ description: 'Progress percentage (0-100)' })
  progress!: number;

  @ApiProperty({ description: 'Repository size in MB' })
  repoSizeMB!: number;

  @ApiProperty({ description: 'Index creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Index completion timestamp', required: false })
  completedAt?: Date;

  @ApiProperty({ description: 'Indexing duration in milliseconds' })
  indexDurationMs!: number;

  @ApiProperty({ description: 'Indexing summary with detected features', required: false })
  summary?: {
    languagesDetected: string[];
    hasDocumentation: boolean;
    hasTests: boolean;
    hasApiSpec: boolean;
    documentationFiles: string[];
    testFiles: string[];
    configFiles: string[];
  };

  @ApiProperty({ description: 'Error details if failed', required: false })
  errorDetails?: {
    type: string;
    message: string;
  };
}

export class ModuleResponseDto {
  @ApiProperty({ description: 'File path' })
  path!: string;

  @ApiProperty({ description: 'Programming language' })
  language!: string;

  @ApiProperty({ description: 'Exported symbols', type: [String] })
  exports!: string[];

  @ApiProperty({ description: 'Imported modules', type: [String] })
  imports!: string[];

  @ApiProperty({ description: 'Function names', type: [String] })
  functions!: string[];

  @ApiProperty({ description: 'Class names', type: [String] })
  classes!: string[];

  @ApiProperty({ description: 'File summary/description' })
  summary!: string;

  @ApiProperty({ description: 'Relevance score (0-100)' })
  relevanceScore!: number;
}

export class IndexStatsResponseDto {
  @ApiProperty({ description: 'Total files in repository' })
  totalFiles!: number;

  @ApiProperty({ description: 'Successfully indexed files' })
  filesIndexed!: number;

  @ApiProperty({ description: 'Files skipped (binary, etc)' })
  filesSkipped!: number;

  @ApiProperty({ description: 'Files with parse errors' })
  parseErrors!: number;

  @ApiProperty({
    description: 'File count by language',
    example: { typescript: 150, javascript: 30, python: 10 },
  })
  languages!: Record<string, number>;

  @ApiProperty({ description: 'Success rate percentage (0-100)' })
  successRate!: number;
}
