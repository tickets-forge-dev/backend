import { Injectable, NotFoundException } from '@nestjs/common';
import { FirestoreTeamMemberRepository } from '../../infrastructure/persistence/FirestoreTeamMemberRepository';
import { GetUserTeamsUseCase } from './GetUserTeamsUseCase';

export interface GetCurrentMemberCommand {
  userId: string;
}

export interface GetCurrentMemberResult {
  id: string;
  userId: string;
  teamId: string;
  teamName: string;
  email: string;
  displayName?: string;
  role: string;
  status: string;
  joinedAt?: Date;
}

/**
 * GetCurrentMemberUseCase
 *
 * Get the current user's team member info for their currently active team.
 */
@Injectable()
export class GetCurrentMemberUseCase {
  constructor(
    private readonly teamMemberRepository: FirestoreTeamMemberRepository,
    private readonly getUserTeamsUseCase: GetUserTeamsUseCase,
  ) {}

  async execute(command: GetCurrentMemberCommand): Promise<GetCurrentMemberResult> {
    const { userId } = command;

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

    // Get team name from the teams result
    const currentTeam = teamsResult.teams.find(
      (team) => team.id === teamsResult.currentTeamId,
    );

    if (!currentTeam) {
      throw new NotFoundException('Current team not found');
    }

    return {
      id: member.id,
      userId: member.userId,
      teamId: member.teamId,
      teamName: currentTeam.name,
      email: member.email,
      displayName: member.displayName,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
    };
  }
}
