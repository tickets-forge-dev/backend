/**
 * RemoveMemberUseCase
 *
 * Removes a member from a team (soft delete).
 * - Only team owners can remove members
 * - Cannot remove owner (must transfer ownership first)
 * - Transitions status: ACTIVE → REMOVED
 *
 * Part of: Story 3.3 - Member Management Use Cases
 * Layer: Application (Use Case)
 */

import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { TeamId } from '../../domain/TeamId';
import { TeamMemberRepository } from '../ports/TeamMemberRepository';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';

export interface RemoveMemberCommand {
  teamId: string;
  memberUserId: string; // User to remove
  requesterId: string; // User performing removal
}

@Injectable()
export class RemoveMemberUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    @Inject('TeamMemberRepository')
    private readonly memberRepository: TeamMemberRepository
  ) {}

  async execute(command: RemoveMemberCommand): Promise<void> {
    const { teamId, memberUserId, requesterId } = command;

    // 1. Validate team exists
    const team = await this.teamRepository.getById(TeamId.create(teamId));
    if (!team) {
      throw new NotFoundException(`Team not found: ${teamId}`);
    }

    // 2. Validate requester is team owner
    if (!team.isOwnedBy(requesterId)) {
      throw new ForbiddenException('Only team owners can remove members');
    }

    // 3. Validate not trying to remove self (owner)
    if (memberUserId === requesterId) {
      throw new ForbiddenException('Cannot remove yourself. Transfer ownership first.');
    }

    // 4. Find member to remove
    const member = await this.memberRepository.findByUserAndTeam(
      memberUserId,
      teamId
    );

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // 5. Validate member is not owner (double check)
    if (member.isAdmin()) {
      throw new ForbiddenException('Cannot remove team owner. Transfer ownership first.');
    }

    // 6. Remove member (soft delete)
    const removedMember = member.remove();

    // 7. Update repository
    await this.memberRepository.update(removedMember);
  }
}
