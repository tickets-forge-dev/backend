import { Injectable, Logger } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { LinearIntegration } from '../../domain/LinearIntegration';
import { LinearIntegrationRepository } from '../../domain/LinearIntegrationRepository';

interface LinearIntegrationDocument {
  id: string;
  workspaceId: string;
  accessToken: string;
  userName: string;
  teamId: string | null;
  teamName: string | null;
  connectedAt: Timestamp;
  updatedAt: Timestamp;
}

@Injectable()
export class FirestoreLinearIntegrationRepository implements LinearIntegrationRepository {
  private readonly logger = new Logger(FirestoreLinearIntegrationRepository.name);

  constructor(private readonly firestore: Firestore) {}

  async findByWorkspaceId(workspaceId: string): Promise<LinearIntegration | null> {
    try {
      const doc = await this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('integrations')
        .doc('linear')
        .get();

      if (!doc.exists) return null;
      return this.toDomain(doc.data() as LinearIntegrationDocument);
    } catch (error: any) {
      this.logger.error(`Failed to find Linear integration: ${error.message}`);
      throw error;
    }
  }

  async save(integration: LinearIntegration): Promise<void> {
    try {
      const data = this.toDocument(integration);
      await this.firestore
        .collection('workspaces')
        .doc(integration.workspaceId)
        .collection('integrations')
        .doc('linear')
        .set(data, { merge: true });
    } catch (error: any) {
      this.logger.error(`Failed to save Linear integration: ${error.message}`);
      throw error;
    }
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    try {
      await this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('integrations')
        .doc('linear')
        .delete();
    } catch (error: any) {
      this.logger.error(`Failed to delete Linear integration: ${error.message}`);
      throw error;
    }
  }

  private toDocument(integration: LinearIntegration): LinearIntegrationDocument {
    const props = integration.toObject();
    return {
      id: props.id,
      workspaceId: props.workspaceId,
      accessToken: props.accessToken,
      userName: props.userName,
      teamId: props.teamId,
      teamName: props.teamName,
      connectedAt: Timestamp.fromDate(props.connectedAt),
      updatedAt: Timestamp.fromDate(props.updatedAt),
    };
  }

  private toDomain(doc: LinearIntegrationDocument): LinearIntegration {
    return LinearIntegration.reconstitute({
      id: doc.id,
      workspaceId: doc.workspaceId,
      accessToken: doc.accessToken,
      userName: doc.userName,
      teamId: doc.teamId,
      teamName: doc.teamName,
      connectedAt: doc.connectedAt.toDate(),
      updatedAt: doc.updatedAt.toDate(),
    });
  }
}
