import { IsArray, IsString, IsOptional, IsIn, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { AECStatus } from '../../domain/value-objects/AECStatus';

/** Migrate old status strings sent by CLI/MCP clients */
const STATUS_COMPAT: Record<string, string> = {
  'dev-refining': 'defined',
  'review': 'refined',
  'forged': 'approved',
  'complete': 'delivered',
};

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

  @Transform(({ value }) => STATUS_COMPAT[value] ?? value)
  @IsIn(Object.values(AECStatus))
  @IsOptional()
  status?: AECStatus;

  @IsObject()
  @IsOptional()
  techSpec?: Record<string, any>;
}
