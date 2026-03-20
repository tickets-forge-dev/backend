import { Injectable, Inject } from '@nestjs/common';
import {
  ProjectProfileRepository,
  PROJECT_PROFILE_REPOSITORY,
} from '../ports/ProjectProfileRepository.port';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(PROJECT_PROFILE_REPOSITORY)
    private readonly profileRepository: ProjectProfileRepository,
  ) {}

  async executeById(
    profileId: string,
    teamId: string,
  ): Promise<Record<string, unknown> | null> {
    const profile = await this.profileRepository.findById(profileId, teamId);
    return profile?.toPlainObject() ?? null;
  }

  async executeByRepo(
    teamId: string,
    repoOwner: string,
    repoName: string,
  ): Promise<Record<string, unknown> | null> {
    const profile = await this.profileRepository.findByRepo(
      teamId,
      repoOwner,
      repoName,
    );
    return profile?.toPlainObject() ?? null;
  }

  async executeAllByTeam(
    teamId: string,
  ): Promise<Record<string, unknown>[]> {
    const profiles = await this.profileRepository.findAllByTeam(teamId);
    // Exclude profileContent from list responses (can be 50KB per profile)
    return profiles.map((p) => {
      const plain = p.toPlainObject();
      delete plain.profileContent;
      return plain;
    });
  }
}
