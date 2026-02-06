import { IsArray, IsString, IsOptional, IsIn, IsObject } from 'class-validator';

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

  @IsObject()
  @IsOptional()
  techSpec?: Record<string, any>;
}
