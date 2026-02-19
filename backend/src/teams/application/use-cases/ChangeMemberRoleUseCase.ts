/**
 * ChangeMemberRoleUseCase
 *
 * Changes a team member's role.
 * - Only team owners can change roles
 * - Cannot change owner's role
 * - Cannot promote to Admin (use ownership transfer)
 * - Member must be ACTIVE
 *
 * Part of: Story 3.3 - Member Management Use Cases
 * Layer: Application (Use Case)
 */

import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { Role } from '../../domain/Role';
import { TeamId } from '../../domain/TeamId';
import { TeamMemberRepository } from '../ports/TeamMemberRepository';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';

export interface ChangeMemberRoleCommand {
  teamId: string;
  memberUserId: string; // User whose role to change
  newRole: Role;
  requesterId: string; // User performing change
}

@Injectable()
export class ChangeMemberRoleUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    @Inject('TeamMemberRepository')
    private readonly memberRepository: TeamMemberRepository
  ) {}

  async execute(command: ChangeMemberRoleCommand): Promise<void> {
    const { teamId, memberUserId, newRole, requesterId } = command;

    // 1. Validate team exists
    const team = await this.teamRepository.getById(TeamId.create(teamId));
    if (!team) {
      throw new NotFoundException(`Team not found: ${teamId}`);
    }

    // 2. Validate requester is team owner
    if (!team.isOwnedBy(requesterId)) {
      throw new ForbiddenException('Only team owners can change member roles');
    }

    // 3. Validate not trying to change own role (owner)
    if (memberUserId === requesterId) {
      throw new ForbiddenException('Cannot change your own role. Transfer ownership first.');
    }

    // 4. Validate new role is not Admin
    if (newRole === Role.ADMIN) {
      throw new BadRequestException('Cannot promote members to Admin. Use ownership transfer.');
    }

    // 5. Find member
    const member = await this.memberRepository.findByUserAndTeam(
      memberUserId,
      teamId
    );

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // 6. Validate member is active
    if (!member.isActive()) {
      throw new BadRequestException('Can only change role for active members');
    }

    // 7. Validate member is not owner (double check)
    if (member.isAdmin()) {
      throw new ForbiddenException('Cannot change role of team owner');
    }

    // 8. Change role
    const updatedMember = member.changeRole(newRole);

    // 9. Update repository (only if role actually changed)
    if (updatedMember !== member) {
      await this.memberRepository.update(updatedMember);
    }
  }
}
