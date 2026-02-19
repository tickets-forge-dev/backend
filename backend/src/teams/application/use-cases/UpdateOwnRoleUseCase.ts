import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { FirestoreTeamMemberRepository } from '../../infrastructure/persistence/FirestoreTeamMemberRepository';
import { GetUserTeamsUseCase } from './GetUserTeamsUseCase';
import { Role } from '../../domain/Role';

export interface UpdateOwnRoleCommand {
  userId: string;
  newRole: string;
}

export interface UpdateOwnRoleResult {
  id: string;
  userId: string;
  teamId: string;
  role: string;
}

/**
 * UpdateOwnRoleUseCase
 *
 * Allow users to change their own role within their current team.
 * Restrictions:
 * - Cannot change role if you're an admin (must transfer ownership first)
 * - Cannot promote yourself to admin
 */
@Injectable()
export class UpdateOwnRoleUseCase {
  constructor(
    private readonly teamMemberRepository: FirestoreTeamMemberRepository,
    private readonly getUserTeamsUseCase: GetUserTeamsUseCase,
  ) {}

  async execute(command: UpdateOwnRoleCommand): Promise<UpdateOwnRoleResult> {
    const { userId, newRole } = command;

    // Validate role
    if (!Object.values(Role).includes(newRole as Role)) {
      throw new BadRequestException(`Invalid role: ${newRole}`);
    }

    // Get user's current team
    const teamsResult = await this.getUserTeamsUseCase.execute({ userId });

    if (!teamsResult.currentTeamId) {
      throw new NotFoundException('No active team found for user');
    }

    // Get team member record
    const member = await this.teamMemberRepository.findByUserAndTeam(
      userId,
      teamsResult.currentTeamId,
    );

    if (!member) {
      throw new NotFoundException('Team member record not found');
    }

    // Use domain method to change role (includes validation)
    const updatedMember = member.changeRole(newRole as Role);

    // Save updated member
    await this.teamMemberRepository.save(updatedMember);

    return {
      id: updatedMember.id,
      userId: updatedMember.userId,
      teamId: updatedMember.teamId,
      role: updatedMember.role,
    };
  }
}
