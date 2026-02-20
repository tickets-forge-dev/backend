import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { AECRepository } from '../ports/AECRepository';
import { TeamMemberRepository } from '../../../teams/application/ports/TeamMemberRepository';
import { Role } from '../../../teams/domain/Role';

/**
 * AssignTicketUseCase (Story 3.5-5: AC#3)
 *
 * Assigns a ticket to a developer or unassigns it.
 * Authorization: Only PMs and Admins can assign tickets.
 * Restriction: Only developers can be assigned tickets (business rule).
 */

export interface AssignTicketCommand {
  ticketId: string;
  userId: string | null; // null = unassign
  requestingUserId: string;
  workspaceId: string;
}

@Injectable()
export class AssignTicketUseCase {
  constructor(
    private readonly aecRepository: AECRepository,
    @Inject('TeamMemberRepository')
    private readonly teamMemberRepository: TeamMemberRepository,
  ) {}

  async execute(command: AssignTicketCommand): Promise<void> {
    // 1. Load ticket
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    // 2. Verify workspace ownership
    if (aec.workspaceId !== command.workspaceId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    // 3. Verify requesting user has permission to assign (PM or Admin only)
    // Note: workspaceId maps to teamId in current architecture (Epic 2 deferred)
    const requestingMember = await this.teamMemberRepository.findByUserAndTeam(
      command.requestingUserId,
      command.workspaceId, // workspaceId = teamId
    );

    if (!requestingMember || !requestingMember.isActive()) {
      throw new ForbiddenException('You must be an active team member to assign tickets');
    }

    const requestingRole = requestingMember.role;
    if (requestingRole !== Role.ADMIN && requestingRole !== Role.PM) {
      throw new ForbiddenException('Only Admins and PMs can assign tickets');
    }

    // 4. Assign or unassign
    if (command.userId === null) {
      // Unassign - no further validation needed
      aec.unassign();
    } else {
      // Assign - validate target user
      if (!command.userId.trim()) {
        throw new BadRequestException('userId cannot be empty');
      }

      // Validate assigned user is active team member with developer role
      const assignedMember = await this.teamMemberRepository.findByUserAndTeam(
        command.userId,
        command.workspaceId, // workspaceId = teamId
      );

      if (!assignedMember) {
        throw new BadRequestException(
          `User ${command.userId} is not a member of this team`
        );
      }

      if (!assignedMember.isActive()) {
        throw new BadRequestException(
          'Cannot assign tickets to inactive team members'
        );
      }

      // Business rule: Only developers can be assigned tickets
      const assignedRole = assignedMember.role;
      if (assignedRole !== Role.DEVELOPER) {
        throw new BadRequestException(
          `Can only assign tickets to developers. User has role: ${assignedRole}`
        );
      }

      aec.assign(command.userId);
    }

    // 5. Save
    await this.aecRepository.save(aec);
  }
}
