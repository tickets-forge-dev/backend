import { IsInt, Min, Max, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class SubmitAnswersDto {
  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  roundNumber?: number;

  @IsObject()
  @IsOptional()
  answers?: Record<string, string | string[]>;

  /** If true, only save answers without triggering spec finalization */
  @IsBoolean()
  @IsOptional()
  saveOnly?: boolean;
}
