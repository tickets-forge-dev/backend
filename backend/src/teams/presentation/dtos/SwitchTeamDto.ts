import { IsString } from 'class-validator';

/**
 * SwitchTeamDto
 *
 * Request payload for switching current team.
 */
export class SwitchTeamDto {
  @IsString()
  teamId!: string;
}
