import { IsArray, IsString, IsNotEmpty, ValidateNested, ArrayMaxSize, ArrayMinSize, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class QuestionAnswerDto {
  @IsString()
  @IsNotEmpty()
  ticketId!: string;

  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Answer cannot exceed 5000 characters' })
  answer!: string;
}

export class BulkFinalizeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  @ArrayMinSize(1, { message: 'At least one answer is required' })
  @ArrayMaxSize(500, { message: 'Cannot finalize more than 500 answers at a time' })
  answers!: QuestionAnswerDto[];
}
