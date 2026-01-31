import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
