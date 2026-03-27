import { IsString, IsNotEmpty, IsArray, ValidateNested, IsInt, IsOptional, Min, MaxLength, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class FileChangeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  path!: string;

  @IsInt()
  @Min(0)
  additions!: number;

  @IsInt()
  @Min(0)
  deletions!: number;
}

export class DivergenceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  area!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  intended!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  actual!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  justification!: string;
}

export class SubmitSettlementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  executionSummary!: string;

  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => FileChangeDto)
  filesChanged!: FileChangeDto[];

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DivergenceDto)
  @IsOptional()
  divergences?: DivergenceDto[];
}
