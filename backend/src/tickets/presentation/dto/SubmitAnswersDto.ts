import { IsEnum, IsObject, IsOptional } from 'class-validator';

export class SubmitAnswersDto {
  @IsEnum([1, 2, 3], { message: 'Round number must be 1, 2, or 3' })
  roundNumber!: 1 | 2 | 3;

  @IsObject()
  @IsOptional()
  answers?: Record<string, string | string[]>;
}
