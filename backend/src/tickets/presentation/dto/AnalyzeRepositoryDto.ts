import { IsString, Matches, IsOptional, ValidateIf } from 'class-validator';

/**
 * DTO for repository analysis request
 *
 * Used in Stage 2 of the 4-stage wizard to analyze GitHub repository
 * and return stack, patterns, and files for user review
 *
 * Story 3.5-2: Repository is now optional - users can create tickets without repo
 */
export class AnalyzeRepositoryDto {
  @IsOptional()
  @ValidateIf((o) => o.owner && o.owner !== '')
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'owner must be alphanumeric, underscore, or hyphen',
  })
  owner?: string;

  @IsOptional()
  @ValidateIf((o) => o.repo && o.repo !== '')
  @IsString()
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'repo must be alphanumeric, underscore, dot, or hyphen',
  })
  repo?: string;

  @IsString()
  @IsOptional()
  branch?: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
