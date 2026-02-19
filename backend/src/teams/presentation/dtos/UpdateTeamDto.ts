import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TeamSettingsDto {
  @IsOptional()
  @IsString()
  defaultWorkspaceId?: string;

  @IsOptional()
  @IsBoolean()
  allowMemberInvites?: boolean;
}

/**
 * UpdateTeamDto
 *
 * Request payload for updating a team.
 */
export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Team name must be at least 3 characters' })
  @MaxLength(50, { message: 'Team name cannot exceed 50 characters' })
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TeamSettingsDto)
  settings?: TeamSettingsDto;
}
