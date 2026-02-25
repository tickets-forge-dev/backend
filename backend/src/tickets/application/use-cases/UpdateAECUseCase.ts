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
      [AECStatus.VALIDATED]: 1,
      [AECStatus.WAITING_FOR_APPROVAL]: 2,
      [AECStatus.READY]: 3,
      [AECStatus.CREATED]: 3,
      [AECStatus.DRIFTED]: 3,
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
      case AECStatus.COMPLETE:
        aec.markComplete();
        break;
      case AECStatus.VALIDATED:
        aec.validate(this.createAutoPassValidation());
        break;
      case AECStatus.WAITING_FOR_APPROVAL:
        // Forward: submit an empty review session to transition
        aec.submitReviewSession([]);
        break;
      case AECStatus.READY:
        // If draft, validate first then mark ready
        if (aec.status === AECStatus.DRAFT) {
          aec.validate(this.createAutoPassValidation());
        }
        if (aec.status === AECStatus.WAITING_FOR_APPROVAL) {
          aec.approve();
        } else {
          aec.markReady({ commitSha: 'manual', indexId: 'manual' });
        }
        break;
      case AECStatus.DRIFTED:
        aec.detectDrift('Manual status change');
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
