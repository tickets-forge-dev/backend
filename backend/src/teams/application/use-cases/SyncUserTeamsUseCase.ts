import { Injectable, Inject } from '@nestjs/common';
import { TeamId } from '../../domain/TeamId';
import { FirestoreTeamRepository } from '../../infrastructure/persistence/FirestoreTeamRepository';
import { FirestoreUserRepository } from '../../../users/infrastructure/persistence/FirestoreUserRepository';
import { TeamMemberRepository } from '../ports/TeamMemberRepository';

export interface SyncUserTeamsCommand {
  userId: string;
}

/**
 * SyncUserTeamsUseCase
 *
 * Syncs user's teamIds array with actual teams they own or are members of.
 * Used to fix data corruption where teamIds array is empty but teams exist.
 */
@Injectable()
export class SyncUserTeamsUseCase {
  constructor(
    private readonly teamRepository: FirestoreTeamRepository,
    private readonly userRepository: FirestoreUserRepository,
    @Inject('TeamMemberRepository')
    private readonly memberRepository: TeamMemberRepository,
  ) {}

  async execute(command: SyncUserTeamsCommand): Promise<{ syncedTeams: string[] }> {
    // Load user
    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      throw new Error(`User ${command.userId} not found`);
    }

    // Find all teams user owns (not deleted)
    const ownedTeams = await this.teamRepository.getByOwnerId(command.userId);
    const ownedTeamIds = ownedTeams
      .filter((team) => !team.isDeleted())
      .map((team) => team.getId());

    // Find all teams user is a member of
    const memberRecords = await this.memberRepository.findByUser(command.userId);
    const memberTeamIds = memberRecords
      .filter((member) => member.status === 'active')
      .map((member) => TeamId.create(member.teamId));

    // Combine and dedupe
    const allTeamIds = [...ownedTeamIds];
    for (const teamId of memberTeamIds) {
      if (!allTeamIds.some((id) => id.equals(teamId))) {
        allTeamIds.push(teamId);
      }
    }

    // Update user with correct teamIds
    let updatedUser = user;
    const currentTeamIds = user.getTeams();

    // Remove teams that shouldn't be there
    for (const currentTeamId of currentTeamIds) {
      if (!allTeamIds.some((id) => id.equals(currentTeamId))) {
        updatedUser = updatedUser.removeTeam(currentTeamId);
      }
    }

    // Add teams that are missing
    for (const teamId of allTeamIds) {
      if (!updatedUser.getTeams().some((id) => id.equals(teamId))) {
        updatedUser = updatedUser.addTeam(teamId);
      }
    }

    // Save updated user
    await this.userRepository.save(updatedUser);

    return {
      syncedTeams: allTeamIds.map((id) => id.getValue()),
    };
  }
}
