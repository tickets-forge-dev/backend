import { IsString, MinLength, MaxLength, IsBoolean, IsOptional } from 'class-validator';

/**
 * CreateTeamDto
 *
 * Request payload for creating a team.
 */
export class CreateTeamDto {
  @IsString()
  @MinLength(3, { message: 'Team name must be at least 3 characters' })
  @MaxLength(50, { message: 'Team name cannot exceed 50 characters' })
  name!: string;

  @IsOptional()
  @IsBoolean()
  allowMemberInvites?: boolean;
}
