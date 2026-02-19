/**
 * InviteMemberUseCase
 *
 * Invites a new member to join a team.
 * - Validates inviter permissions (owner or member with allowMemberInvites)
 * - Validates email format and role
 * - Creates TeamMember in INVITED status
 * - Generates invite token and sends email invitation
 *
 * Part of: Story 3.4 - Email Invitation System
 * Layer: Application (Use Case)
 */

import { Injectable, BadRequestException, ForbiddenException, NotFoundException, ConflictException, Logger, Inject } from '@nestjs/common';
import { TeamMember } from '../../domain/TeamMember';
import { Role } from '../../domain/Role';
import { TeamId } from '../../domain/TeamId';
import { TeamMemberRepository } from '../ports/TeamMemberRepository';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { EmailService } from '../../../shared/infrastructure/email/EmailService';
import { InviteTokenService } from '../services/InviteTokenService';

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
  // SECURITY: inviteToken removed - tokens should only be sent via email, not API response
}

@Injectable()
export class InviteMemberUseCase {
  private readonly logger = new Logger(InviteMemberUseCase.name);

  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    @Inject('TeamMemberRepository')
    private readonly memberRepository: TeamMemberRepository,
    private readonly emailService: EmailService,
    private readonly inviteTokenService: InviteTokenService
  ) {}

  async execute(command: InviteMemberCommand): Promise<InviteMemberResult> {
    const { teamId, email, role, invitedBy } = command;

    // 0. Validate inputs
    if (!teamId || !teamId.trim()) {
      throw new BadRequestException('Team ID is required');
    }
    if (!email || !email.trim()) {
      throw new BadRequestException('Email is required');
    }
    if (!invitedBy || !invitedBy.trim()) {
      throw new BadRequestException('Inviter ID is required');
    }

    // 1. Validate team exists
    const team = await this.teamRepository.getById(TeamId.create(teamId));
    if (!team) {
      throw new NotFoundException(`Team not found: ${teamId}`);
    }

    // 1.5. Rate limiting check - prevent DOS via excessive invites
    const pendingInvites = await this.memberRepository.findByTeam(teamId);
    const pendingCount = pendingInvites.filter((m) => m.isPending()).length;
    const MAX_PENDING_INVITES = 50; // Configurable limit

    if (pendingCount >= MAX_PENDING_INVITES) {
      throw new BadRequestException(
        `Team has reached maximum pending invitations (${MAX_PENDING_INVITES}). ` +
        'Please wait for existing invitations to be accepted or cancel them.'
      );
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
      // If removed, delete old record before creating new invite
      if (existingMember.isRemoved()) {
        this.logger.log(`Deleting old REMOVED member record for ${email} before re-inviting`);
        await this.memberRepository.delete(teamId, existingMember.userId);
      }
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

    // 8. Generate invite token
    const inviteToken = this.inviteTokenService.generateInviteToken({
      memberId: member.id,
      teamId: member.teamId,
      email: member.email,
    });

    // 9. Send invite email (non-blocking - log errors but don't fail)
    try {
      await this.emailService.sendInviteEmail(
        member.email,
        team.getName(),
        inviteToken
      );
      this.logger.log(`Invite email sent to ${member.email} for team ${teamId}`);
    } catch (error) {
      // Log error but don't fail the invite creation
      // The invite is still valid, user can be manually notified
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to send invite email to ${member.email}: ${errorMessage}`,
        errorStack
      );
    }

    // 10. Return result (WITHOUT invite token for security)
    return {
      memberId: member.id,
      teamId: member.teamId,
      email: member.email,
      role: member.role,
    };
  }

  /**
   * Validate email format (RFC 5322 compliant, simplified)
   */
  private isValidEmail(email: string): boolean {
    if (!email || email.length > 254) {
      return false; // Max email length per RFC 5321
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }
}
