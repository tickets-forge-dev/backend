import { IsString, IsOptional, IsInt, Min, Max, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/, {
    message: 'repositoryFullName must be in format "owner/repo"',
  })
  repositoryFullName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9/_-]+$/, {
    message: 'branchName must contain only alphanumeric, /, -, _',
  })
  branchName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  maxRounds?: number;
}
