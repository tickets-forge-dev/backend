import { IsArray, IsString, IsOptional, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewQAItemDto } from './SubmitReviewSessionDto';

/**
 * DTO for POST /tickets/:id/start-implementation (Story 10-2)
 */
export class StartImplementationDto {
  @IsString()
  @Matches(/^forge\//, { message: 'Branch name must start with forge/' })
  branchName!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewQAItemDto)
  qaItems?: ReviewQAItemDto[];
}
