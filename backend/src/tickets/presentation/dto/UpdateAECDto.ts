import { IsArray, IsString, IsOptional } from 'class-validator';

export class UpdateAECDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  acceptanceCriteria?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assumptions?: string[];
}
