/**
 * Drift Detector Interface
 * Port for detecting drift in AECs when code/API snapshots change
 *
 * Part of: Story 4.4 - Drift Detection
 * Layer: Application
 */

export const DRIFT_DETECTOR = 'DRIFT_DETECTOR';

export interface IDriftDetector {
  detectDrift(workspaceId: string, repositoryName: string, commitSha: string): Promise<void>;

  detectApiDrift(workspaceId: string, repositoryName: string, specHash: string): Promise<void>;
}

export interface DriftDetectionResult {
  driftedCount: number;
  checkedCount: number;
}
