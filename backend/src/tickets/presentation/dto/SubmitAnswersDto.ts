import { IsNumber, IsObject, IsOptional } from 'class-validator';

export class SubmitAnswersDto {
  @IsNumber()
  roundNumber!: number;

  @IsObject()
  @IsOptional()
  answers?: Record<string, string | string[]>;
}
