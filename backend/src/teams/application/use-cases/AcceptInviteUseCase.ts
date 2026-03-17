/**
 * AcceptInviteUseCase
 *
 * Accepts a team invitation and activates membership.
 * - Validates member exists and is in INVITED status
 * - Activates member with displayName
 * - Transitions status: INVITED → ACTIVE
 *
 * Part of: Story 3.3 - Member Management Use Cases
 * Layer: Application (Use Case)
 */

import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { TeamMemberRepository } from '../ports/TeamMemberRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { User } from '../../../users/domain/User';
import { TeamId } from '../../domain/TeamId';

export interface AcceptInviteCommand {
  memberId: string;
  userId: string;
  displayName: string;
}

@Injectable()
export class AcceptInviteUseCase {
  private readonly logger = new Logger(AcceptInviteUseCase.name);

  constructor(
    @Inject('TeamMemberRepository')
    private readonly memberRepository: TeamMemberRepository,
    private readonly userRepository: FirestoreUserRepository,
  ) {}

  async execute(command: AcceptInviteCommand): Promise<void> {
    const { memberId, userId, displayName } = command;

    // 1. Validate displayName
    if (!displayName || !displayName.trim()) {
      throw new BadRequestException('Display name is required');
    }

    // 2. Find member by memberId (from invite token)
    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      throw new NotFoundException('Invitation not found');
    }

    // 3. Validate member is in INVITED status
    if (!member.isPending()) {
      if (member.isActive()) {
        throw new BadRequestException('You are already an active member of this team');
      }
      if (member.isRemoved()) {
        throw new BadRequestException('Your membership has been removed');
      }
      throw new BadRequestException('Invalid invitation status');
    }

    // 4. Activate member (update userId from temporary to real Firebase UID)
    const activatedMember = member.activate(displayName.trim(), userId);

    // 5. Delete old member document (with temporary userId) and save new one (with real userId)
    // This is necessary because the userId changed, so the document path changed
    const oldUserId = member.userId; // temporary userId like "invite_bar_idan_gmail_com"
    const teamId = member.teamId;

    // Delete the old document at /teams/{teamId}/members/{oldUserId}
    await this.memberRepository.delete(teamId, oldUserId);

    // Save the new document at /teams/{teamId}/members/{newUserId}
    await this.memberRepository.save(activatedMember);

    // Add team to user's teamIds array (so GET /teams returns this team)
    let user = await this.userRepository.getById(userId);
    if (!user) {
      // User document doesn't exist yet (new user who signed up via invite link)
      this.logger.log(`Creating user document for ${activatedMember.email} (${userId}) during invite acceptance`);
      user = User.create(userId, activatedMember.email, displayName.trim());
    }
    const updatedUser = user.addTeam(TeamId.create(teamId));
    await this.userRepository.save(updatedUser);
  }
}
