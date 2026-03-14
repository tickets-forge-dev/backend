import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';

@Injectable()
export class UnarchiveAECUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(aecId: string, teamId: string): Promise<void> {
    const aec = await this.aecRepository.findByIdInTeam(aecId, teamId);

    if (!aec) {
      throw new NotFoundException('Ticket not found');
    }

    aec.unarchive();
    await this.aecRepository.update(aec);
  }
}
