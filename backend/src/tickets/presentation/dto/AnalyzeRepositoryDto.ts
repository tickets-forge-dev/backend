import { IsString, Matches } from 'class-validator';

/**
 * DTO for repository analysis request
 *
 * Used in Stage 2 of the 4-stage wizard to analyze GitHub repository
 * and return stack, patterns, and files for user review
 */
export class AnalyzeRepositoryDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'owner must be alphanumeric, underscore, or hyphen',
  })
  owner!: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'repo must be alphanumeric, underscore, dot, or hyphen',
  })
  repo!: string;
}
