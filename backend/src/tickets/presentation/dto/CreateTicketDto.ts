import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsArray,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RepositoryEntryDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/, {
    message: 'repositoryFullName must be in format "owner/repo"',
  })
  repositoryFullName!: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9/_-]+$/, {
    message: 'branchName must contain only alphanumeric, /, -, _',
  })
  branchName!: string;

  @IsBoolean()
  isPrimary!: boolean;

  @IsOptional()
  @IsString()
  role?: string;
}

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

  // Multi-repo support (max 2)
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => RepositoryEntryDto)
  repositories?: RepositoryEntryDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  maxRounds?: number;

  @IsIn(['feature', 'bug', 'task'])
  @IsOptional()
  type?: 'feature' | 'bug' | 'task';

  @IsIn(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  taskAnalysis?: any;

  @IsOptional()
  @IsArray()
  reproductionSteps?: any[];

  // Story 14-3: Generation preferences
  @IsOptional()
  @IsBoolean()
  includeWireframes?: boolean;

  @IsOptional()
  @IsBoolean()
  includeHtmlWireframes?: boolean;

  @IsOptional()
  @IsBoolean()
  includeApiSpec?: boolean;

  @IsOptional()
  @IsBoolean()
  apiSpecDeferred?: boolean;

  @IsOptional()
  @IsString()
  wireframeContext?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  wireframeImageAttachmentIds?: string[];

  @IsOptional()
  @IsString()
  apiContext?: string;

  @IsOptional()
  @IsString()
  folderId?: string;
}
