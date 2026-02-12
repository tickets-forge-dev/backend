import { Injectable, Logger } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { JiraIntegration } from '../../domain/JiraIntegration';
import { JiraIntegrationRepository } from '../../domain/JiraIntegrationRepository';

interface JiraIntegrationDocument {
  id: string;
  workspaceId: string;
  userId: string;
  jiraUrl: string;
  username: string;
  apiToken: string;
  connectedAt: Timestamp;
  updatedAt: Timestamp;
}

@Injectable()
export class FirestoreJiraIntegrationRepository implements JiraIntegrationRepository {
  private readonly logger = new Logger(FirestoreJiraIntegrationRepository.name);

  constructor(private readonly firestore: Firestore) {}

  async findByUserAndWorkspace(userId: string, workspaceId: string): Promise<JiraIntegration | null> {
    try {
      const doc = await this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('integrations')
        .doc(`jira_${userId}`)
        .get();

      if (!doc.exists) return null;
      return this.toDomain(doc.data() as JiraIntegrationDocument);
    } catch (error: any) {
      this.logger.error(`Failed to find Jira integration: ${error.message}`);
      throw error;
    }
  }

  async save(integration: JiraIntegration): Promise<void> {
    try {
      const data = this.toDocument(integration);
      await this.firestore
        .collection('workspaces')
        .doc(integration.workspaceId)
        .collection('integrations')
        .doc(`jira_${integration.userId}`)
        .set(data, { merge: true });
    } catch (error: any) {
      this.logger.error(`Failed to save Jira integration: ${error.message}`);
      throw error;
    }
  }

  async deleteByUserAndWorkspace(userId: string, workspaceId: string): Promise<void> {
    try {
      await this.firestore
        .collection('workspaces')
        .doc(workspaceId)
        .collection('integrations')
        .doc(`jira_${userId}`)
        .delete();
    } catch (error: any) {
      this.logger.error(`Failed to delete Jira integration: ${error.message}`);
      throw error;
    }
  }

  private toDocument(integration: JiraIntegration): JiraIntegrationDocument {
    const props = integration.toObject();
    return {
      id: props.id,
      workspaceId: props.workspaceId,
      userId: props.userId,
      jiraUrl: props.jiraUrl,
      username: props.username,
      apiToken: props.apiToken,
      connectedAt: Timestamp.fromDate(props.connectedAt),
      updatedAt: Timestamp.fromDate(props.updatedAt),
    };
  }

  private toDomain(doc: JiraIntegrationDocument): JiraIntegration {
    return JiraIntegration.reconstitute({
      id: doc.id,
      workspaceId: doc.workspaceId,
      userId: doc.userId,
      jiraUrl: doc.jiraUrl,
      username: doc.username,
      apiToken: doc.apiToken,
      connectedAt: doc.connectedAt.toDate(),
      updatedAt: doc.updatedAt.toDate(),
    });
  }
}
