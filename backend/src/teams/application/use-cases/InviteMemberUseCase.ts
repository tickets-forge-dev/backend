/**
 * InviteMemberUseCase
 *
 * Invites a new member to join a team.
 * - Validates inviter permissions (owner or member with allowMemberInvites)
 * - Validates email format and role
 * - Creates TeamMember in INVITED status
 * - Returns memberId for invite token generation (Story 3.4)
 *
 * Part of: Story 3.3 - Member Management Use Cases
 * Layer: Application (Use Case)
 */

import { Injectable, BadRequestException, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { TeamMember } from '../../domain/TeamMember';
import { Role, RoleHelper } from '../../domain/Role';
import { TeamId } from '../../domain/TeamId';
import { TeamMemberRepository } from '../ports/TeamMemberRepository';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';

export interface InviteMemberCommand {
  teamId: string;
  email: string;
  role: Role;
  invitedBy: string; // userId of inviter
}

export interface InviteMemberResult {
  memberId: string;
  teamId: string;
  email: string;
  role: Role;
}

@Injectable()
export class InviteMemberUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly memberRepository: TeamMemberRepository
  ) {}

  async execute(command: InviteMemberCommand): Promise<InviteMemberResult> {
    const { teamId, email, role, invitedBy } = command;

    // 1. Validate team exists
    const team = await this.teamRepository.getById(TeamId.create(teamId));
    if (!team) {
      throw new NotFoundException(`Team not found: ${teamId}`);
    }

    // 2. Validate inviter permissions
    const isOwner = team.isOwnedBy(invitedBy);
    
    if (!isOwner) {
      // Check if inviter is a member with permission to invite
      const inviterMember = await this.memberRepository.findByUserAndTeam(
        invitedBy,
        teamId
      );

      if (!inviterMember) {
        throw new ForbiddenException('You are not a member of this team');
      }

      if (!inviterMember.isActive()) {
        throw new ForbiddenException('Your membership is not active');
      }

      if (!team.getSettings().allowMemberInvites) {
        throw new ForbiddenException('Only team owners can invite members');
      }
    }

    // 3. Validate role (cannot invite as Admin)
    if (role === Role.ADMIN) {
      throw new BadRequestException('Cannot invite members as Admin. Admins must be team owners.');
    }

    // 4. Validate email format
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }

    // 5. Check if user is already a member
    // Note: We don't have userId yet (user hasn't signed up), so we check by email
    // This requires querying all team members and checking emails
    const existingMembers = await this.memberRepository.findByTeam(teamId);
    const existingMember = existingMembers.find(
      (m) => m.email.toLowerCase() === email.toLowerCase()
    );

    if (existingMember) {
      if (existingMember.isActive()) {
        throw new ConflictException('User is already an active member of this team');
      }
      if (existingMember.isPending()) {
        throw new ConflictException('User already has a pending invitation');
      }
      // If removed, allow re-inviting (will create new invite)
    }

    // 6. Create TeamMember invite
    // Note: We use email as temporary userId until user accepts invite
    // Story 3.4 will handle invite tokens and user creation
    const tempUserId = `invite_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const member = TeamMember.createInvite(
      tempUserId,
      teamId,
      email.toLowerCase(),
      role,
      invitedBy
    );

    // 7. Save to repository
    await this.memberRepository.save(member);

    // 8. Return result for invite token generation
    return {
      memberId: member.id,
      teamId: member.teamId,
      email: member.email,
      role: member.role,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
