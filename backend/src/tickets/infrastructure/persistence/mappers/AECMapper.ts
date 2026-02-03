import { AEC } from '../../../domain/aec/AEC';
import { AECStatus, TicketType } from '../../../domain/value-objects/AECStatus';
import { RepositoryContext } from '../../../domain/value-objects/RepositoryContext';
import { ValidationResult, ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { Finding } from '../../../validation/domain/Finding';
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
  indexId: string;
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
  preImplementationFindings: any[];
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
          indexId: doc.repositoryContext.indexId,
        })
      : null;

    // Reconstitute validation results with comprehensive safety checks
    const validationResults = (doc.validationResults || [])
      .filter((vr) => {
        // Skip invalid validation results
        if (!vr || typeof vr !== 'object') return false;
        
        const hasValidScore = typeof vr.score === 'number' && !isNaN(vr.score) && isFinite(vr.score);
        const hasValidWeight = typeof vr.weight === 'number' && !isNaN(vr.weight) && isFinite(vr.weight);
        const hasCriterion = vr.criterion && typeof vr.criterion === 'string' && vr.criterion.trim().length > 0;
        const hasMessage = vr.message && typeof vr.message === 'string' && vr.message.trim().length > 0;
        
        return hasCriterion && hasValidScore && hasValidWeight && hasMessage;
      })
      .map((vr) => {
        try {
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
          
          // Ensure message exists (fallback for legacy data)
          const message = vr.message && vr.message.trim().length > 0 
            ? vr.message 
            : `Validation check for ${vr.criterion}`;
          
          return ValidationResult.create({
            criterion: vr.criterion as ValidatorType,
            passed: vr.passed === true,
            score: normalizedScore,
            weight: normalizedWeight,
            issues: Array.isArray(vr.issues) ? vr.issues : [],
            blockers: Array.isArray(vr.blockers) ? vr.blockers : [],
            message: message,
          });
        } catch (error) {
          console.error(`Failed to create ValidationResult for ${vr.criterion}:`, error);
          return null;
        }
      })
      .filter((vr): vr is ValidationResult => vr !== null);

    // Map preImplementationFindings (Epic 7.3)
    const preImplementationFindings = Array.isArray(doc.preImplementationFindings)
      ? doc.preImplementationFindings.map((f: any) => ({
          id: f.id,
          category: f.category,
          severity: f.severity,
          description: f.description,
          codeLocation: f.codeLocation,
          suggestion: f.suggestion,
          confidence: f.confidence,
          evidence: f.evidence,
          createdAt: f.createdAt?.toDate ? f.createdAt.toDate() : new Date(f.createdAt),
        }))
      : [];

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
      preImplementationFindings,
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
          indexId: aec.repositoryContext.indexId,
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
      preImplementationFindings: aec.preImplementationFindings.map((f) => ({
        id: f.id,
        category: f.category,
        severity: f.severity,
        description: f.description,
        codeLocation: f.codeLocation,
        suggestion: f.suggestion,
        confidence: f.confidence,
        evidence: f.evidence,
        createdAt: Timestamp.fromDate(f.createdAt),
      })),
      externalIssue: aec.externalIssue,
      driftDetectedAt: aec.driftDetectedAt
        ? Timestamp.fromDate(aec.driftDetectedAt)
        : null,
      driftReason: aec.driftReason,
      repositoryContext,
      createdAt: Timestamp.fromDate(aec.createdAt),
      updatedAt: Timestamp.fromDate(aec.updatedAt),
    };
  }
}
