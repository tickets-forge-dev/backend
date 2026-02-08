/**
 * Estimate Effort Use Case
 * Calculates and stores effort estimate for an AEC
 *
 * Part of: Story 4.5 - Effort Estimation
 * Layer: Application
 */

import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { IEstimationEngine, ESTIMATION_ENGINE } from '../services/estimation-engine.interface';
import { AEC_REPOSITORY } from '../ports/AECRepository';
import { Estimate } from '../../domain/value-objects/Estimate';

@Injectable()
export class EstimateEffortUseCase {
  private readonly logger = new Logger(EstimateEffortUseCase.name);

  constructor(
    @Inject(ESTIMATION_ENGINE)
    private readonly estimationEngine: IEstimationEngine,
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: any, // AECRepository interface
  ) {}

  async execute(aecId: string, workspaceId: string): Promise<Estimate> {
    this.logger.log(`Estimating effort for AEC: ${aecId}`);

    // Load AEC
    const aec = await this.aecRepository.findById(workspaceId, aecId);
    if (!aec) {
      throw new NotFoundException(`AEC not found: ${aecId}`);
    }

    // Detect factors from AEC
    const hasApiChanges = this.detectApiChanges(aec);
    const hasDatabaseChanges = this.detectDatabaseChanges(aec);
    const hasAuthChanges = this.detectAuthChanges(aec);

    // Calculate estimate
    const estimate = await this.estimationEngine.estimateEffort({
      workspaceId,
      repositoryName: aec.repositoryContext?.repositoryName || '',
      ticketType: aec.type || 'task',
      repoPaths: aec.repoPaths || [],
      hasApiChanges,
      hasDatabaseChanges,
      hasAuthChanges,
    });

    // Store estimate in AEC
    aec.setEstimate(estimate);
    await this.aecRepository.save(aec);

    this.logger.log(`Estimate saved: ${estimate.min}-${estimate.max}h (${estimate.confidence})`);

    return estimate;
  }

  private detectApiChanges(aec: any): boolean {
    // Check if API snapshot exists (indicates API-related ticket)
    return !!aec.apiSnapshot;
  }

  private detectDatabaseChanges(aec: any): boolean {
    // Check for migration-related files in repoPaths
    const repoPaths = aec.repoPaths || [];
    return repoPaths.some(
      (path: string) =>
        path.toLowerCase().includes('migration') ||
        path.toLowerCase().includes('schema') ||
        path.toLowerCase().includes('database'),
    );
  }

  private detectAuthChanges(aec: any): boolean {
    // Check for auth-related files in repoPaths
    const repoPaths = aec.repoPaths || [];
    return repoPaths.some(
      (path: string) =>
        path.toLowerCase().includes('auth') ||
        path.toLowerCase().includes('permission') ||
        path.toLowerCase().includes('role'),
    );
  }
}
