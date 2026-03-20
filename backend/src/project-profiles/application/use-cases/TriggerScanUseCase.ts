import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ProjectProfileRepository,
  PROJECT_PROFILE_REPOSITORY,
} from '../ports/ProjectProfileRepository.port';
import { ProjectProfile } from '../../domain/ProjectProfile';
import { BackgroundScanService } from '../services/BackgroundScanService';

interface TriggerScanInput {
  teamId: string;
  workspaceId: string;
  userId: string;
  repoOwner: string;
  repoName: string;
  branch: string;
}

@Injectable()
export class TriggerScanUseCase {
  private readonly logger = new Logger(TriggerScanUseCase.name);

  constructor(
    @Inject(PROJECT_PROFILE_REPOSITORY)
    private readonly profileRepository: ProjectProfileRepository,
    private readonly backgroundScanService: BackgroundScanService,
  ) {}

  async execute(
    input: TriggerScanInput,
  ): Promise<{ profileId: string; status: string }> {
    // Check if profile already exists for this repo
    const existing = await this.profileRepository.findByRepo(
      input.teamId,
      input.repoOwner,
      input.repoName,
    );

    let profile: ProjectProfile;

    if (existing) {
      // Re-scan: if already scanning, return current state
      if (existing.isScanning()) {
        this.logger.log(
          `Profile ${existing.id} already scanning ${input.repoOwner}/${input.repoName}`,
        );
        return { profileId: existing.id, status: existing.status };
      }
      // Re-use existing profile record for re-scan
      profile = existing;
      if (existing.branch !== input.branch) {
        this.logger.warn(
          `Profile ${existing.id} branch mismatch: stored="${existing.branch}" requested="${input.branch}". Using stored branch.`,
        );
      }
    } else {
      // Create new profile
      profile = ProjectProfile.createNew(
        input.teamId,
        input.repoOwner,
        input.repoName,
        input.branch,
        input.userId,
      );
      await this.profileRepository.save(profile);
    }

    this.logger.log(
      `Triggering scan for ${input.repoOwner}/${input.repoName} (profile: ${profile.id})`,
    );

    // Fire-and-forget: spawn background scan
    void this.backgroundScanService
      .run(profile.id, input.teamId, input.workspaceId, input.userId)
      .catch((err) => {
        this.logger.error(`Background scan failed: ${err.message}`);
      });

    return { profileId: profile.id, status: 'pending' };
  }
}
