/**
 * Estimation Engine Interface
 * Port for calculating effort estimates based on code complexity
 *
 * Part of: Story 4.5 - Effort Estimation
 * Layer: Application
 */

import { Estimate } from '../../domain/value-objects/Estimate';
import { TicketType } from '../../domain/value-objects/AECStatus';

export const ESTIMATION_ENGINE = 'ESTIMATION_ENGINE';

export interface IEstimationEngine {
  estimateEffort(params: EstimationParams): Promise<Estimate>;
}

export interface EstimationParams {
  workspaceId: string;
  repositoryName: string;
  ticketType: TicketType;
  repoPaths: string[];
  hasApiChanges: boolean;
  hasDatabaseChanges: boolean;
  hasAuthChanges: boolean;
}
