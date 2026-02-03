import { IsString, MinLength } from 'class-validator';

export class ValidateInputDto {
  @IsString()
  @MinLength(1)
  input!: string;
}
