import { AEC } from '../../../domain/aec/AEC';
import { AECStatus, TicketType, TicketPriority } from '../../../domain/value-objects/AECStatus';
import { RepositoryContext } from '../../../domain/value-objects/RepositoryContext';
import { ValidationResult, ValidatorType } from '../../../domain/value-objects/ValidationResult';
import { Attachment } from '../../../domain/value-objects/Attachment';
import { DesignReference } from '../../../domain/value-objects/DesignReference';
import { TechSpec } from '../../../domain/tech-spec/TechSpecGenerator';
import { Timestamp } from 'firebase-admin/firestore';

/** Safely convert Firestore Timestamp, {_seconds,_nanoseconds}, or ISO string to Date */
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value._seconds === 'number') return new Date(value._seconds * 1000);
  return new Date(value);
}

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
  roundNumber: number;
  questions: any[];
  answers: Record<string, string | string[]>;
  generatedAt: Timestamp;
  answeredAt: Timestamp | null;
  codebaseContext: string;
  skippedByUser: boolean;
}

export interface AECDocument {
  id: string;
  teamId: string;
  createdBy: string; // userId of ticket creator
  status: string;
  title: string;
  description: string | null;
  type: string | null;
  priority: string | null;
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
  // Simplified question refinement workflow
  clarificationQuestions?: any[];
  questionAnswers?: Record<string, string | string[]>;
  questionsAnsweredAt?: Timestamp | null;
  techSpec?: TechSpec | null;
  taskAnalysis?: any;
  attachments?: any[];
  designReferences?: any[];
  assignedTo?: string | null; // Story 3.5-5: userId of assigned team member
  reviewSession?: { qaItems: { question: string; answer: string }[]; submittedAt: Timestamp } | null; // Story 6-12
  reproductionSteps?: any[]; // User-provided bug reproduction steps
  // Legacy fields (kept for backward compatibility, deprecated)
  questionRounds?: QuestionRoundDocument[];
  currentRound?: number;
  maxRounds?: number;
}

/** Migration map: old Firestore status values → new AECStatus values */
const STATUS_MIGRATION: Record<string, string> = {
  'validated': 'dev-refining',
  'waiting-for-approval': 'review',
  'ready': 'forged',
  'created': 'executing',
  // 'drifted' handled separately below (depends on externalIssue)
};

export class AECMapper {
  static toDomain(doc: AECDocument): AEC {
    // Reconstitute repository context if present
    const repositoryContext = doc.repositoryContext
      ? RepositoryContext.create({
          repositoryFullName: doc.repositoryContext.repositoryFullName,
          branchName: doc.repositoryContext.branchName,
          commitSha: doc.repositoryContext.commitSha,
          isDefaultBranch: doc.repositoryContext.isDefaultBranch,
          selectedAt: toDate(doc.repositoryContext.selectedAt),
        })
      : null;

    // Reconstitute validation results with comprehensive safety checks
    const validationResults = (doc.validationResults || [])
      .filter((vr) => {
        // Skip invalid validation results
        if (!vr || typeof vr !== 'object') return false;

        const hasValidScore =
          typeof vr.score === 'number' && !isNaN(vr.score) && isFinite(vr.score);
        const hasValidWeight =
          typeof vr.weight === 'number' && !isNaN(vr.weight) && isFinite(vr.weight);
        const hasCriterion =
          vr.criterion && typeof vr.criterion === 'string' && vr.criterion.trim().length > 0;
        const hasMessage =
          vr.message && typeof vr.message === 'string' && vr.message.trim().length > 0;

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
          const message =
            vr.message && vr.message.trim().length > 0
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

    // Map design references, converting timestamps to dates and handling null/undefined safely
    const designReferences = (doc.designReferences || [])
      .filter((ref: any) => ref && typeof ref === 'object')
      .map((ref: any) => ({
        ...ref,
        addedAt: toDate(ref.addedAt),
        // Safely handle metadata that might be null/undefined
        metadata: ref.metadata ? { ...ref.metadata } : undefined,
      })) as DesignReference[];

    // Migrate old status values to new AECStatus enum
    let migratedStatus: string;
    if (doc.status === 'drifted') {
      migratedStatus = doc.externalIssue ? 'executing' : 'forged';
    } else {
      migratedStatus = STATUS_MIGRATION[doc.status] ?? doc.status;
    }

    return AEC.reconstitute(
      doc.id,
      doc.teamId,
      doc.createdBy || 'unknown', // Backward compatibility: fallback for old documents
      migratedStatus as AECStatus,
      doc.title,
      doc.description,
      doc.type as TicketType | null,
      (doc.priority as TicketPriority) ?? null,
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
      doc.driftDetectedAt ? toDate(doc.driftDetectedAt) : null,
      doc.driftReason ?? null,
      repositoryContext,
      toDate(doc.createdAt),
      toDate(doc.updatedAt),
      doc.clarificationQuestions ?? [],
      doc.questionAnswers ?? {},
      doc.questionsAnsweredAt ? toDate(doc.questionsAnsweredAt) : null,
      doc.techSpec ?? null,
      doc.taskAnalysis ?? null,
      (doc.attachments || []).map((a: any) => ({
        ...a,
        uploadedAt: toDate(a.uploadedAt),
      })) as Attachment[],
      designReferences,
      doc.assignedTo ?? null, // Story 3.5-5: backward compatible (null for old tickets)
      doc.reviewSession
        ? {
            qaItems: doc.reviewSession.qaItems,
            submittedAt: toDate(doc.reviewSession.submittedAt),
          }
        : null, // Story 6-12: backward compatible (null for old tickets)
      doc.reproductionSteps ?? [],
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
      teamId: aec.teamId,
      createdBy: aec.createdBy,
      status: aec.status,
      title: aec.title,
      description: aec.description,
      type: aec.type,
      priority: aec.priority,
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
      driftDetectedAt: aec.driftDetectedAt ? Timestamp.fromDate(aec.driftDetectedAt) : null,
      driftReason: aec.driftReason,
      repositoryContext,
      createdAt: Timestamp.fromDate(aec.createdAt),
      updatedAt: Timestamp.fromDate(aec.updatedAt),
      clarificationQuestions: aec.questions,
      questionAnswers: aec.questionAnswers,
      questionsAnsweredAt: aec.questionsAnsweredAt
        ? Timestamp.fromDate(aec.questionsAnsweredAt)
        : null,
      techSpec: aec.techSpec,
      taskAnalysis: aec.taskAnalysis ?? null,
      attachments: aec.attachments.map((a) => ({
        ...a,
        uploadedAt: Timestamp.fromDate(a.uploadedAt),
      })),
      designReferences: aec.designReferences.map((ref) => ({
        ...ref,
        addedAt: Timestamp.fromDate(ref.addedAt),
      })),
      assignedTo: aec.assignedTo ?? null, // Story 3.5-5: AC#2
      reviewSession: aec.reviewSession
        ? {
            qaItems: aec.reviewSession.qaItems,
            submittedAt: Timestamp.fromDate(aec.reviewSession.submittedAt),
          }
        : null, // Story 6-12
      reproductionSteps: aec.reproductionSteps.length > 0 ? aec.reproductionSteps : undefined,
    };
  }
}
