import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

/**
 * AcceptInviteDto
 *
 * Request body for accepting a team invitation.
 */
export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty({ message: 'Invite token is required' })
  token!: string;

  @IsString()
  @IsNotEmpty({ message: 'Display name is required' })
  @MinLength(2, { message: 'Display name must be at least 2 characters' })
  @MaxLength(100, { message: 'Display name must be at most 100 characters' })
  displayName!: string;
}
