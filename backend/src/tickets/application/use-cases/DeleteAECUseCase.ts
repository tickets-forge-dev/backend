import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';

@Injectable()
export class DeleteAECUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(aecId: string, teamId: string): Promise<void> {
    console.log(`🗑️ [DeleteAECUseCase] Deleting AEC: ${aecId} for workspace: ${teamId}`);

    const aec = await this.aecRepository.findByIdInTeam(aecId, teamId);

    if (!aec) {
      console.log(`❌ [DeleteAECUseCase] AEC not found: ${aecId}`);
      throw new NotFoundException('Ticket not found');
    }

    await this.aecRepository.delete(aecId, teamId);

    console.log(`✅ [DeleteAECUseCase] AEC deleted: ${aecId}`);
  }
}
