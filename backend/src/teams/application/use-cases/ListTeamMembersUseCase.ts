/**
 * ListTeamMembersUseCase
 *
 * Lists all members of a team.
 * - Any team member can list members
 * - Optional filter by status (active, invited, removed)
 * - Returns all statuses by default
 *
 * Part of: Story 3.3 - Member Management Use Cases
 * Layer: Application (Use Case)
 */

import { Injectable, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { TeamMember } from '../../domain/TeamMember';
import { MemberStatus } from '../../domain/MemberStatus';
import { TeamId } from '../../domain/TeamId';
import { TeamMemberRepository } from '../ports/TeamMemberRepository';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';

export interface ListTeamMembersCommand {
  teamId: string;
  requesterId: string; // User requesting list
  statusFilter?: MemberStatus; // Optional filter
}

@Injectable()
export class ListTeamMembersUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    @Inject('TeamMemberRepository')
    private readonly memberRepository: TeamMemberRepository
  ) {}

  async execute(command: ListTeamMembersCommand): Promise<TeamMember[]> {
    const { teamId, requesterId, statusFilter } = command;

    // 1. Validate team exists
    const team = await this.teamRepository.getById(TeamId.create(teamId));
    if (!team) {
      throw new NotFoundException(`Team not found: ${teamId}`);
    }

    // 2. Validate requester is team member (or owner)
    const isOwner = team.isOwnedBy(requesterId);
    
    if (!isOwner) {
      const requesterMember = await this.memberRepository.findByUserAndTeam(
        requesterId,
        teamId
      );

      if (!requesterMember || !requesterMember.isActive()) {
        throw new ForbiddenException('You must be a team member to view members');
      }
    }

    // 3. Get all team members
    const members = await this.memberRepository.findByTeam(teamId);

    // 4. Apply status filter if provided
    if (statusFilter) {
      return members.filter((m) => m.status === statusFilter);
    }

    // 5. Return all members
    return members;
  }
}
