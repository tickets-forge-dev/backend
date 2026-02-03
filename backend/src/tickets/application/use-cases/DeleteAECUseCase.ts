import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';

@Injectable()
export class DeleteAECUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(aecId: string, workspaceId: string): Promise<void> {
    console.log(`🗑️ [DeleteAECUseCase] Deleting AEC: ${aecId} for workspace: ${workspaceId}`);

    const aec = await this.aecRepository.findById(aecId);

    if (!aec) {
      console.log(`❌ [DeleteAECUseCase] AEC not found: ${aecId}`);
      throw new NotFoundException('Ticket not found');
    }

    if (aec.workspaceId !== workspaceId) {
      console.log(`❌ [DeleteAECUseCase] Workspace mismatch for AEC: ${aecId}`);
      throw new ForbiddenException('You do not have permission to delete this ticket');
    }

    await this.aecRepository.delete(aecId, workspaceId);

    console.log(`✅ [DeleteAECUseCase] AEC deleted: ${aecId}`);
  }
}
