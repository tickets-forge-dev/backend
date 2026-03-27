import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FileChangeDto {
  @IsString()
  @IsNotEmpty()
  path: string;

  @IsNumber()
  additions: number;

  @IsNumber()
  deletions: number;
}

export class DivergenceDto {
  @IsString()
  @IsNotEmpty()
  area: string;

  @IsString()
  @IsNotEmpty()
  intended: string;

  @IsString()
  @IsNotEmpty()
  actual: string;

  @IsString()
  @IsNotEmpty()
  justification: string;
}

export class SubmitSettlementDto {
  @IsString()
  @IsNotEmpty()
  executionSummary: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileChangeDto)
  filesChanged: FileChangeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DivergenceDto)
  @IsOptional()
  divergences?: DivergenceDto[];
}
