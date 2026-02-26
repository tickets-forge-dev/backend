/**
 * Drift Detector Service
 * Detects when code/API snapshots have changed for open AECs
 *
 * Part of: Story 4.4 - Drift Detection
 * Layer: Infrastructure
 */

import { Injectable, Logger } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';
import {
  IDriftDetector,
} from '../../application/services/drift-detector.interface';
import { AEC } from '../../domain/aec/AEC';
import { AECStatus } from '../../domain/value-objects/AECStatus';
import { AECMapper } from '../persistence/mappers/AECMapper';

@Injectable()
export class DriftDetectorService implements IDriftDetector {
  private readonly logger = new Logger(DriftDetectorService.name);
  private readonly firestore: Firestore;

  constructor() {
    this.firestore = new Firestore();
  }

  async detectDrift(workspaceId: string, repositoryName: string, commitSha: string): Promise<void> {
    this.logger.log(
      `Detecting code drift for ${repositoryName}@${commitSha.substring(0, 7)} in workspace ${workspaceId}`,
    );

    // Query open AECs with matching repo
    const aecs = await this.findOpenAECs(workspaceId, repositoryName);

    let driftedCount = 0;

    for (const aec of aecs) {
      if (!aec.codeSnapshot) {
        continue; // Skip AECs without code snapshot
      }

      if (aec.codeSnapshot.commitSha !== commitSha) {
        const reason = `Code snapshot changed: ${aec.codeSnapshot.commitSha.substring(0, 7)} → ${commitSha.substring(0, 7)}`;

        aec.markDrifted(reason);
        await this.saveAEC(workspaceId, aec);

        driftedCount++;
        this.logger.log(`Marked AEC ${aec.id} as drifted: ${reason}`);
      }
    }

    this.logger.log(`Drift detection complete: ${driftedCount} drifted, ${aecs.length} checked`);
  }

  async detectApiDrift(
    workspaceId: string,
    repositoryName: string,
    specHash: string,
  ): Promise<void> {
    this.logger.log(
      `Detecting API drift for ${repositoryName} (hash: ${specHash.substring(0, 7)}) in workspace ${workspaceId}`,
    );

    const aecs = await this.findOpenAECs(workspaceId, repositoryName);

    let driftedCount = 0;

    for (const aec of aecs) {
      if (!aec.apiSnapshot) {
        continue; // Skip AECs without API snapshot
      }

      if (aec.apiSnapshot.hash !== specHash) {
        const reason = `API spec changed: ${aec.apiSnapshot.hash.substring(0, 7)} → ${specHash.substring(0, 7)}`;

        aec.markDrifted(reason);
        await this.saveAEC(workspaceId, aec);

        driftedCount++;
        this.logger.log(`Marked AEC ${aec.id} as drifted: ${reason}`);
      }
    }

    this.logger.log(
      `API drift detection complete: ${driftedCount} drifted, ${aecs.length} checked`,
    );
  }

  private async findOpenAECs(workspaceId: string, repositoryName: string): Promise<AEC[]> {
    const snapshot = await this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection('aecs')
      .where('status', 'in', [AECStatus.FORGED, AECStatus.EXECUTING, 'ready', 'created'])
      .where('repositoryContext.repositoryName', '==', repositoryName)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      return AECMapper.toDomain({
        ...data,
        id: doc.id,
      });
    });
  }

  private async saveAEC(workspaceId: string, aec: AEC): Promise<void> {
    const docRef = this.firestore
      .collection('workspaces')
      .doc(workspaceId)
      .collection('aecs')
      .doc(aec.id);

    // Update only the drift-related fields
    await docRef.update({
      status: aec.status,
      driftDetectedAt: aec.driftDetectedAt,
      driftReason: aec.driftReason,
      updatedAt: new Date(),
    });
  }
}
