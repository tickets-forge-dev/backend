import { IsString, IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';

/** GitHub owner/repo names: alphanumeric, hyphens, underscores, dots. Max 100 chars. */
const GITHUB_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;

/** Git branch names: no control chars, no spaces, no "..", no ending in ".lock" */
const GIT_BRANCH_REGEX = /^[a-zA-Z0-9._/-]+$/;

export class TriggerScanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(GITHUB_NAME_REGEX, {
    message: 'repoOwner must be a valid GitHub username (alphanumeric, hyphens, underscores, dots)',
  })
  repoOwner!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(GITHUB_NAME_REGEX, {
    message: 'repoName must be a valid GitHub repository name (alphanumeric, hyphens, underscores, dots)',
  })
  repoName!: string;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  @Matches(GIT_BRANCH_REGEX, {
    message: 'branch must be a valid Git branch name',
  })
  branch?: string;
}
