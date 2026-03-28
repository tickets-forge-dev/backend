import { IsArray, IsString, IsOptional, IsIn, IsObject } from 'class-validator';
import { AECStatus } from '../../domain/value-objects/AECStatus';

export class UpdateAECDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  acceptanceCriteria?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assumptions?: string[];

  @IsIn(Object.values(AECStatus))
  @IsOptional()
  status?: AECStatus;

  @IsObject()
  @IsOptional()
  techSpec?: Record<string, any>;
}
