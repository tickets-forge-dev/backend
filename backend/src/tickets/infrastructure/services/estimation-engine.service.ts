/**
 * Estimation Engine Service
 * Calculates effort estimates based on multiple factors
 * 
 * Part of: Story 4.5 - Effort Estimation
 * Layer: Infrastructure
 */

import { Injectable, Logger } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import { IEstimationEngine, EstimationParams } from '../../application/services/estimation-engine.interface';
import { Estimate } from '../../domain/value-objects/Estimate';

@Injectable()
export class EstimationEngineService implements IEstimationEngine {
  private readonly logger = new Logger(EstimationEngineService.name);
  private readonly firestore: Firestore;

  constructor() {
    this.firestore = new Firestore();
  }

  async estimateEffort(params: EstimationParams): Promise<Estimate> {
    this.logger.log(
      `Estimating effort for ${params.repositoryName} (${params.ticketType}), ${params.repoPaths.length} modules`,
    );

    // Base effort: 2 hours minimum
    let minHours = 2;
    let maxHours = 2;
    const drivers: string[] = [];

    // Factor 1: Modules touched
    const moduleCount = params.repoPaths.length;
    if (moduleCount > 0) {
      minHours += moduleCount * 1;
      maxHours += moduleCount * 2;
      drivers.push(`${moduleCount} ${moduleCount === 1 ? 'module' : 'modules'} touched`);
    }

    // Factor 2: API changes
    if (params.hasApiChanges) {
      minHours += 2;
      maxHours += 4;
      drivers.push('API changes detected');
    }

    // Factor 3: Database migrations
    if (params.hasDatabaseChanges) {
      minHours += 3;
      maxHours += 6;
      drivers.push('Database migrations required');
    }

    // Factor 4: Auth changes
    if (params.hasAuthChanges) {
      minHours += 2;
      maxHours += 3;
      drivers.push('Auth logic changes');
    }

    // Query historical tickets for confidence
    const historicalTickets = await this.findSimilarTickets(
      params.workspaceId,
      params.repositoryName,
      params.ticketType,
    );

    let confidence: 'low' | 'medium' | 'high';

    if (historicalTickets.length >= 5) {
      confidence = 'high';
      // Narrow range for high confidence
      const avg = (minHours + maxHours) / 2;
      minHours = Math.round(avg * 0.8);
      maxHours = Math.round(avg * 1.2);
      drivers.push(`${historicalTickets.length} similar tickets for reference`);
    } else if (historicalTickets.length >= 2) {
      confidence = 'medium';
      drivers.push(`${historicalTickets.length} similar tickets for reference`);
    } else {
      confidence = 'low';
      // Widen range for low confidence
      minHours = Math.max(4, Math.round(minHours * 0.7));
      maxHours = Math.min(12, Math.round(maxHours * 1.3));
      drivers.push('Limited historical data');
    }

    // Top 3 drivers only
    const topDrivers = drivers.slice(0, 3);

    const estimate: Estimate = {
      min: minHours,
      max: maxHours,
      confidence,
      drivers: topDrivers,
    };

    this.logger.log(
      `Estimated: ${estimate.min}-${estimate.max}h (${estimate.confidence} confidence)`,
    );

    return estimate;
  }

  private async findSimilarTickets(
    workspaceId: string,
    repositoryName: string,
    ticketType: string,
  ): Promise<any[]> {
    try {
      const snapshot = await this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('aecs')
        .where('repositoryContext.repositoryName', '==', repositoryName)
        .where('type', '==', ticketType)
        .where('status', 'in', ['created', 'validated'])
        .limit(10)
        .get();

      return snapshot.docs;
    } catch (error) {
      this.logger.warn(
        `Failed to query historical tickets: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }
}
