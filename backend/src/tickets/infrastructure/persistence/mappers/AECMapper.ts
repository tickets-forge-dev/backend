import { AEC } from '../../../domain/aec/AEC';
import { AECStatus, TicketType } from '../../../domain/value-objects/AECStatus';
import { RepositoryContext } from '../../../domain/value-objects/RepositoryContext';
import { QuestionRound } from '../../../domain/value-objects/QuestionRound';
import { ValidationResult, ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { TechSpec } from '../../../domain/tech-spec/TechSpecGenerator';
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

export interface QuestionRoundDocument {
  roundNumber: 1 | 2 | 3;
  questions: any[];
  answers: Record<string, string | string[]>;
  generatedAt: Timestamp;
  answeredAt: Timestamp | null;
  codebaseContext: string;
  skippedByUser: boolean;
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
  // New fields for iterative refinement workflow
  questionRounds?: QuestionRoundDocument[];
  currentRound?: number;
  techSpec?: TechSpec | null;
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

    // Reconstitute question rounds if present
    const questionRounds: QuestionRound[] = (doc.questionRounds || [])
      .map((round) => ({
        roundNumber: round.roundNumber,
        questions: round.questions || [],
        answers: round.answers || {},
        generatedAt: round.generatedAt?.toDate() ?? new Date(),
        answeredAt: round.answeredAt?.toDate() ?? null,
        codebaseContext: round.codebaseContext || '{}',
        skippedByUser: round.skippedByUser ?? false,
      }));

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
      questionRounds,
      doc.currentRound ?? 0,
      doc.techSpec ?? null,
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

    // Map question rounds to Firestore format
    const questionRounds: QuestionRoundDocument[] = aec.questionRounds.map(
      (round) => ({
        roundNumber: round.roundNumber,
        questions: round.questions,
        answers: round.answers,
        generatedAt: Timestamp.fromDate(round.generatedAt),
        answeredAt: round.answeredAt ? Timestamp.fromDate(round.answeredAt) : null,
        codebaseContext: round.codebaseContext,
        skippedByUser: round.skippedByUser,
      }),
    );

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
      driftReason: aec.driftReason,
      repositoryContext,
      createdAt: Timestamp.fromDate(aec.createdAt),
      updatedAt: Timestamp.fromDate(aec.updatedAt),
      questionRounds,
      currentRound: aec.currentRound,
      techSpec: aec.techSpec,
    };
  }
}
