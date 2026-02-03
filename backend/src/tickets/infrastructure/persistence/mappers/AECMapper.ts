import { AEC } from '../../../domain/aec/AEC';
import { AECStatus, TicketType } from '../../../domain/value-objects/AECStatus';
import { RepositoryContext } from '../../../domain/value-objects/RepositoryContext';
import { ValidationResult, ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { Timestamp } from 'firebase-admin/firestore';

export interface ValidationResultDocument {
  criterion: string;
  passed: boolean;
  score: number;
  weight: number;
  issues: string[];
  blockers: string[];
  message: string;
}

export interface RepositoryContextDocument {
  repositoryFullName: string;
  branchName: string;
  commitSha: string;
  isDefaultBranch: boolean;
  selectedAt: Timestamp;
}

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
  validationResults: ValidationResultDocument[];
  externalIssue: any | null;
  driftDetectedAt?: Timestamp | null;
  driftReason?: string | null;
  repositoryContext: RepositoryContextDocument | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class AECMapper {
  static toDomain(doc: AECDocument): AEC {
    // Reconstitute repository context if present
    const repositoryContext = doc.repositoryContext
      ? RepositoryContext.create({
          repositoryFullName: doc.repositoryContext.repositoryFullName,
          branchName: doc.repositoryContext.branchName,
          commitSha: doc.repositoryContext.commitSha,
          isDefaultBranch: doc.repositoryContext.isDefaultBranch,
          selectedAt: doc.repositoryContext.selectedAt.toDate(),
        })
      : null;

    // Reconstitute validation results
    const validationResults = doc.validationResults
      .filter((vr) => {
        // Skip invalid validation results
        const hasValidMessage = vr.message && vr.message.trim().length > 0;
        const hasValidScore = typeof vr.score === 'number' && !isNaN(vr.score);
        const hasValidWeight = typeof vr.weight === 'number' && !isNaN(vr.weight);
        return hasValidMessage && hasValidScore && hasValidWeight;
      })
      .map((vr) => {
        // Handle legacy data where scores might be stored as percentages (0-100)
        let normalizedScore = vr.score;
        let normalizedWeight = vr.weight;
        
        // Normalize scores if they're > 1 (likely percentages)
        if (normalizedScore > 1) {
          normalizedScore = Math.min(normalizedScore / 100, 1.0);
        }
        if (normalizedWeight > 1) {
          normalizedWeight = Math.min(normalizedWeight / 100, 1.0);
        }
        
        // Clamp to valid range [0, 1]
        normalizedScore = Math.max(0, Math.min(1, normalizedScore));
        normalizedWeight = Math.max(0, Math.min(1, normalizedWeight));
        
        return ValidationResult.create({
          criterion: vr.criterion as ValidatorType,
          passed: vr.passed,
          score: normalizedScore,
          weight: normalizedWeight,
          issues: vr.issues || [],
          blockers: vr.blockers || [],
          message: vr.message,
        });
      });

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
      validationResults,
      doc.externalIssue,
      doc.driftDetectedAt?.toDate() ?? null,
      doc.driftReason ?? null,
      repositoryContext,
      doc.createdAt.toDate(),
      doc.updatedAt.toDate(),
    );
  }

  static toFirestore(aec: AEC): AECDocument {
    // Map repository context if present
    const repositoryContext: RepositoryContextDocument | null = aec.repositoryContext
      ? {
          repositoryFullName: aec.repositoryContext.repositoryFullName,
          branchName: aec.repositoryContext.branchName,
          commitSha: aec.repositoryContext.commitSha,
          isDefaultBranch: aec.repositoryContext.isDefaultBranch,
          selectedAt: Timestamp.fromDate(aec.repositoryContext.selectedAt),
        }
      : null;

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
      validationResults: aec.validationResults.map((vr) => vr.toPlainObject()),
      externalIssue: aec.externalIssue,
      driftDetectedAt: aec.driftDetectedAt
        ? Timestamp.fromDate(aec.driftDetectedAt)
        : null,
      repositoryContext,
      createdAt: Timestamp.fromDate(aec.createdAt),
      updatedAt: Timestamp.fromDate(aec.updatedAt),
    };
  }
}
