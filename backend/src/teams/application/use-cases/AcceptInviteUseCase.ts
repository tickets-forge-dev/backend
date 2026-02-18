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

import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { TeamMemberRepository } from '../ports/TeamMemberRepository';

export interface AcceptInviteCommand {
  userId: string;
  teamId: string;
  displayName: string;
}

@Injectable()
export class AcceptInviteUseCase {
  constructor(
    @Inject('TeamMemberRepository')
    private readonly memberRepository: TeamMemberRepository
  ) {}

  async execute(command: AcceptInviteCommand): Promise<void> {
    const { userId, teamId, displayName } = command;

    // 1. Validate displayName
    if (!displayName || !displayName.trim()) {
      throw new BadRequestException('Display name is required');
    }

    // 2. Find member
    const member = await this.memberRepository.findByUserAndTeam(userId, teamId);

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

    // 4. Activate member
    const activatedMember = member.activate(displayName.trim());

    // 5. Update repository
    await this.memberRepository.update(activatedMember);
  }
}
