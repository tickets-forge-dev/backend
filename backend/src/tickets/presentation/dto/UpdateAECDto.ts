import { IsArray, IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateAECDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  acceptanceCriteria?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assumptions?: string[];

  @IsIn(['draft', 'complete'])
  @IsOptional()
  status?: 'draft' | 'complete';
}
