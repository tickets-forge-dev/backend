import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ProjectProfileRepository,
  PROJECT_PROFILE_REPOSITORY,
} from '../ports/ProjectProfileRepository.port';

@Injectable()
export class DeleteProfileUseCase {
  private readonly logger = new Logger(DeleteProfileUseCase.name);

  constructor(
    @Inject(PROJECT_PROFILE_REPOSITORY)
    private readonly profileRepository: ProjectProfileRepository,
  ) {}

  async execute(profileId: string, teamId: string): Promise<void> {
    this.logger.log(`Deleting profile ${profileId}`);
    await this.profileRepository.delete(profileId, teamId);
  }
}
