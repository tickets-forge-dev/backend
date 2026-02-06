import { Injectable, Inject } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { AECNotFoundError } from '../../../shared/domain/exceptions/DomainExceptions';

export interface UpdateAECCommand {
  aecId: string;
  acceptanceCriteria?: string[];
  assumptions?: string[];
  status?: 'draft' | 'complete';
  techSpec?: Record<string, any>;
}

@Injectable()
export class UpdateAECUseCase {
  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
  ) {}

  async execute(command: UpdateAECCommand): Promise<AEC> {
    // Fetch AEC
    const aec = await this.aecRepository.findById(command.aecId);
    if (!aec) {
      throw new AECNotFoundError(command.aecId);
    }

    // Update fields if provided
    if (command.acceptanceCriteria !== undefined) {
      aec.updateAcceptanceCriteria(command.acceptanceCriteria);
    }

    if (command.assumptions !== undefined) {
      aec.updateAssumptions(command.assumptions);
    }

    if (command.techSpec !== undefined) {
      aec.updateTechSpec(command.techSpec);
    }

    if (command.status === 'complete') {
      aec.markComplete();
    } else if (command.status === 'draft') {
      aec.revertToDraft();
    }

    // Persist changes
    await this.aecRepository.update(aec);

    // TODO: Re-run validation and update readiness score
    // This will be implemented in Epic 3

    return aec;
  }
}
