import { IsString, IsOptional } from 'class-validator';

/**
 * SwitchTeamDto
 *
 * Request payload for switching current team.
 * Pass teamId to switch to a team, or null/undefined to switch to personal workspace.
 */
export class SwitchTeamDto {
  @IsString()
  @IsOptional()
  teamId?: string | null;
}
