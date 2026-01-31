import { AEC } from '../../../domain/aec/AEC';
import { AECStatus, TicketType } from '../../../domain/value-objects/AECStatus';
import { Timestamp } from 'firebase-admin/firestore';

export interface AECDocument {
  id: string;
  workspaceId: string;
  status: string;
  title: string;
  description: string | null;
  type: string | null;
  readinessScore: number;
  generationState: any;
  acceptanceCriteria: string[];
  assumptions: string[];
  repoPaths: string[];
  codeSnapshot: any | null;
  apiSnapshot: any | null;
  questions: any[];
  estimate: any | null;
  validationResults: any[];
  externalIssue: any | null;
  driftDetectedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class AECMapper {
  static toDomain(doc: AECDocument): AEC {
    return AEC.reconstitute(
      doc.id,
      doc.workspaceId,
      doc.status as AECStatus,
      doc.title,
      doc.description,
      doc.type as TicketType | null,
      doc.readinessScore,
      doc.generationState,
      doc.acceptanceCriteria,
      doc.assumptions,
      doc.repoPaths,
      doc.codeSnapshot,
      doc.apiSnapshot,
      doc.questions,
      doc.estimate,
      doc.validationResults,
      doc.externalIssue,
      doc.driftDetectedAt?.toDate() ?? null,
      doc.createdAt.toDate(),
      doc.updatedAt.toDate(),
    );
  }

  static toFirestore(aec: AEC): AECDocument {
    return {
      id: aec.id,
      workspaceId: aec.workspaceId,
      status: aec.status,
      title: aec.title,
      description: aec.description,
      type: aec.type,
      readinessScore: aec.readinessScore,
      generationState: aec.generationState,
      acceptanceCriteria: aec.acceptanceCriteria,
      assumptions: aec.assumptions,
      repoPaths: aec.repoPaths,
      codeSnapshot: aec.codeSnapshot,
      apiSnapshot: aec.apiSnapshot,
      questions: aec.questions,
      estimate: aec.estimate,
      validationResults: aec.validationResults,
      externalIssue: aec.externalIssue,
      driftDetectedAt: aec.driftDetectedAt
        ? Timestamp.fromDate(aec.driftDetectedAt)
        : null,
      createdAt: Timestamp.fromDate(aec.createdAt),
      updatedAt: Timestamp.fromDate(aec.updatedAt),
    };
  }
}
