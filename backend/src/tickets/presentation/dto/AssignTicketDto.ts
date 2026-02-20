import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

/**
 * DTO for assigning/unassigning tickets (Story 3.5-5: AC#3)
 *
 * userId can be:
 * - string: assign to this user (must be active developer on the team)
 * - null: unassign ticket
 */
export class AssignTicketDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId: string | null = null;
}
