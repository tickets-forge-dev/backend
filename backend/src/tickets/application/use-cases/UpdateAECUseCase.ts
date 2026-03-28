import { Injectable, Inject } from '@nestjs/common';
import { AEC } from '../../domain/aec/AEC';
import { AECStatus } from '../../domain/value-objects/AECStatus';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { AECNotFoundError, InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';
import { ValidationResult, ValidatorType } from '../../domain/value-objects/ValidationResult';

export interface UpdateAECCommand {
  aecId: string;
  title?: string;
  description?: string;
  acceptanceCriteria?: string[];
  assumptions?: string[];
  status?: AECStatus;
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
    if (command.title !== undefined) {
      aec.updateTitle(command.title);
    }

    if (command.description !== undefined) {
      aec.updateDescription(command.description);
    }

    if (command.acceptanceCriteria !== undefined) {
      aec.updateAcceptanceCriteria(command.acceptanceCriteria);
    }

    if (command.assumptions !== undefined) {
      aec.updateAssumptions(command.assumptions);
    }

    if (command.techSpec !== undefined) {
      aec.updateTechSpec(command.techSpec);
    }

    if (command.status !== undefined) {
      this.transitionStatus(aec, command.status);
    }

    // Persist changes
    await this.aecRepository.update(aec);

    // TODO: Re-run validation and update readiness score
    // This will be implemented in Epic 3

    return aec;
  }

  private transitionStatus(aec: AEC, targetStatus: AECStatus): void {
    if (aec.status === targetStatus) return;

    // Determine if this is a backward transition
    const lifecycleOrder: Record<string, number> = {
      [AECStatus.DRAFT]: 0,
      [AECStatus.DEFINED]: 1,
      [AECStatus.REFINED]: 2,
      [AECStatus.APPROVED]: 3,
      [AECStatus.EXECUTING]: 4,
      [AECStatus.DELIVERED]: 5,
    };

    const currentLevel = lifecycleOrder[aec.status];
    const targetLevel = lifecycleOrder[targetStatus];

    // If both statuses are in the lifecycle and target is behind current, use sendBack
    if (
      currentLevel !== undefined &&
      targetLevel !== undefined &&
      targetLevel < currentLevel
    ) {
      aec.sendBack(targetStatus);
      return;
    }

    switch (targetStatus) {
      case AECStatus.DRAFT:
        aec.revertToDraft();
        break;
      case AECStatus.EXECUTING:
        // Transition APPROVED → EXECUTING from the web UI (no branch name)
        if (aec.status === AECStatus.APPROVED) {
          aec.startImplementation('manual');
        } else {
          throw new InvalidStateTransitionError(
            `Cannot transition to executing from ${aec.status}. Ticket must be in approved status.`,
          );
        }
        break;
      case AECStatus.DELIVERED:
        // Chain through executing if coming from approved
        if (aec.status === AECStatus.APPROVED) {
          aec.startImplementation('manual');
        }
        aec.markDelivered();
        break;
      case AECStatus.DEFINED:
        aec.startDevRefine(this.createAutoPassValidation());
        break;
      case AECStatus.REFINED:
        // Forward: submit an empty review session to transition
        aec.submitReviewSession([]);
        break;
      case AECStatus.APPROVED:
        // If draft, start dev-refine first then approve
        if (aec.status === AECStatus.DRAFT) {
          aec.startDevRefine(this.createAutoPassValidation());
        }
        if (aec.status === AECStatus.REFINED) {
          aec.approve();
        } else {
          aec.approve({ commitSha: 'manual', indexId: 'manual' });
        }
        break;
      default:
        throw new InvalidStateTransitionError(
          `Cannot transition to ${targetStatus} via PATCH. Use the dedicated endpoint.`,
        );
    }
  }

  private createAutoPassValidation(): ValidationResult[] {
    return [
      ValidationResult.create({
        criterion: ValidatorType.COMPLETENESS,
        passed: true,
        score: 1.0,
        weight: 1.0,
        issues: [],
        blockers: [],
        message: 'Auto-validated via status transition',
      }),
    ];
  }
}
