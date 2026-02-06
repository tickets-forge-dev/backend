import { IsInt, Min, Max, IsObject, IsOptional } from 'class-validator';

export class SubmitAnswersDto {
  @IsInt()
  @Min(1)
  @Max(3)
  roundNumber!: number;

  @IsObject()
  @IsOptional()
  answers?: Record<string, string | string[]>;
}
