import { IsArray, IsString, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewQAItemDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;
}

/**
 * DTO for POST /tickets/:id/review-session (Story 6-12)
 */
export class SubmitReviewSessionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReviewQAItemDto)
  qaItems: ReviewQAItemDto[];
}
