import { AEC } from '../../../domain/aec/AEC';
import { AECStatus, TicketType, TicketPriority } from '../../../domain/value-objects/AECStatus';
import { ChangeRecordStatus } from '../../../domain/value-objects/ChangeRecord';
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

/**
 * Deserialize repository entries from a Firestore document.
 * Handles lazy migration: old single-repo docs get wrapped into an array.
 *
 * - If `repositories` (new format) exists → use directly, converting timestamps
 * - Else if `repositoryContext` (old format) exists → wrap as single-entry array with isPrimary: true
 * - Else → empty array
 */
export function repositoryEntriesFromFirestore(doc: {
  repositoryContext?: RepositoryContextDocument | null;
  repositories?: RepositoryEntryDocument[];
}): Array<{
  repositoryFullName: string;
  branchName: string;
  commitSha: string;
  isDefaultBranch: boolean;
  isPrimary: boolean;
  role?: string;
  selectedAt: Date;
}> {
  if (Array.isArray(doc.repositories) && doc.repositories.length > 0) {
    return doc.repositories.map((entry) => ({
      repositoryFullName: entry.repositoryFullName,
      branchName: entry.branchName,
      commitSha: entry.commitSha,
      isDefaultBranch: entry.isDefaultBranch,
      isPrimary: entry.isPrimary ?? false,
      role: entry.role,
      selectedAt: toDate(entry.selectedAt),
    }));
  }

  if (doc.repositoryContext) {
    return [
      {
        repositoryFullName: doc.repositoryContext.repositoryFullName,
        branchName: doc.repositoryContext.branchName,
        commitSha: doc.repositoryContext.commitSha,
        isDefaultBranch: doc.repositoryContext.isDefaultBranch,
        isPrimary: true,
        selectedAt: toDate(doc.repositoryContext.selectedAt),
      },
    ];
  }

  return [];
}

/**
 * Serialize repository entries to Firestore format.
 * Returns both `repositories` (new) and `repositoryContext` (backward compat).
 *
 * - `repositories` is always the full array with Firestore Timestamps
 * - `repositoryContext` is set to the primary entry (or first, or null) for old-code compat
 */
export function repositoryEntriesToFirestore(entries: Array<{
  repositoryFullName: string;
  branchName: string;
  commitSha: string;
  isDefaultBranch: boolean;
  isPrimary: boolean;
  role?: string;
  selectedAt: Date;
}>): {
  repositories: RepositoryEntryDocument[];
  repositoryContext: RepositoryContextDocument | null;
} {
  const repositories: RepositoryEntryDocument[] = entries.map((entry) => ({
    repositoryFullName: entry.repositoryFullName,
    branchName: entry.branchName,
    commitSha: entry.commitSha,
    isDefaultBranch: entry.isDefaultBranch,
    isPrimary: entry.isPrimary,
    ...(entry.role ? { role: entry.role } : {}),
    selectedAt: Timestamp.fromDate(entry.selectedAt),
  }));

  // Backward compat: write the primary entry as repositoryContext
  const primary = entries.find((e) => e.isPrimary) ?? entries[0] ?? null;
  const repositoryContext: RepositoryContextDocument | null = primary
    ? {
        repositoryFullName: primary.repositoryFullName,
        branchName: primary.branchName,
        commitSha: primary.commitSha,
        isDefaultBranch: primary.isDefaultBranch,
        selectedAt: Timestamp.fromDate(primary.selectedAt),
      }
    : null;

  return { repositories, repositoryContext };
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

export interface RepositoryEntryDocument {
  repositoryFullName: string;
  branchName: string;
  commitSha: string;
  isDefaultBranch: boolean;
  isPrimary: boolean;
  role?: string;
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
  repositories?: RepositoryEntryDocument[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Simplified question refinement workflow
  clarificationQuestions?: any[];
  questionAnswers?: Record<string, string | string[]>;
  questionsAnsweredAt?: Timestamp | null;
  techSpec?: TechSpec | null;
  taskAnalysis?: any;
  cachedCodebaseContext?: any;
  attachments?: any[];
  designReferences?: any[];
  assignedTo?: string | null; // Story 3.5-5: userId of assigned team member
  reviewSession?: { qaItems: { question: string; answer: string }[]; submittedAt: Timestamp } | null; // Story 6-12
  reproductionSteps?: any[]; // User-provided bug reproduction steps
  implementationBranch?: string | null; // Story 10-1: forge develop branch
  implementationSession?: { qaItems: { question: string; answer: string }[]; branchName: string; startedAt: Timestamp } | null; // Story 10-1
  folderId?: string | null; // Story 12-2: ticket folder organization
  tagIds?: string[]; // Ticket tags
  // Story 14-3: Generation preferences
  includeWireframes?: boolean;
  includeHtmlWireframes?: boolean;
  includeApiSpec?: boolean;
  apiSpecDeferred?: boolean;
  wireframeContext?: string | null;
  wireframeImageAttachmentIds?: string[];
  apiContext?: string | null;
  slug?: string | null;
  previousStatus?: string | null;
  generationJobId?: string | null;
  approvedAt?: Timestamp | null;
  executionEvents?: any[];
  changeRecord?: {
    executionSummary: string;
    decisions: any[];
    risks: any[];
    scopeChanges: any[];
    filesChanged: any[];
    divergences: any[];
    hasDivergence: boolean;
    status: string;
    reviewNote: string | null;
    reviewedAt: Timestamp | null;
    submittedAt: Timestamp;
  } | null;
  // Legacy fields (kept for backward compatibility, deprecated)
  questionRounds?: QuestionRoundDocument[];
  currentRound?: number;
  maxRounds?: number;
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

    return AEC.reconstitute(
      doc.id,
      doc.teamId,
      doc.createdBy || 'unknown',
      doc.status as AECStatus,
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
      doc.cachedCodebaseContext ?? null,
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
      doc.implementationBranch ?? null, // Story 10-1
      doc.implementationSession
        ? {
            qaItems: doc.implementationSession.qaItems,
            branchName: doc.implementationSession.branchName,
            startedAt: toDate(doc.implementationSession.startedAt),
          }
        : null, // Story 10-1
      doc.folderId ?? null, // Story 12-2
      doc.tagIds ?? [], // Ticket tags
      // Story 14-3: Generation preferences (default true for backward compat)
      doc.includeWireframes ?? true,
      doc.includeHtmlWireframes ?? false,
      doc.includeApiSpec ?? true,
      doc.apiSpecDeferred ?? false,
      doc.wireframeContext ?? null,
      doc.wireframeImageAttachmentIds ?? [],
      doc.apiContext ?? null,
      doc.slug ?? null,
      (doc.previousStatus as AECStatus) ?? null,
      doc.generationJobId ?? null,
      doc.approvedAt ? toDate(doc.approvedAt) : null,
      // Execution events — stored as plain objects, dates need conversion
      (doc.executionEvents || []).map((e: any) => ({
        ...e,
        createdAt: toDate(e.createdAt),
      })),
      // Change Record
      doc.changeRecord
        ? {
            ...doc.changeRecord,
            status: doc.changeRecord.status as ChangeRecordStatus,
            reviewedAt: doc.changeRecord.reviewedAt ? toDate(doc.changeRecord.reviewedAt) : null,
            submittedAt: toDate(doc.changeRecord.submittedAt),
            // Convert event dates within the record
            decisions: (doc.changeRecord.decisions || []).map((e: any) => ({ ...e, createdAt: toDate(e.createdAt) })),
            risks: (doc.changeRecord.risks || []).map((e: any) => ({ ...e, createdAt: toDate(e.createdAt) })),
            scopeChanges: (doc.changeRecord.scopeChanges || []).map((e: any) => ({ ...e, createdAt: toDate(e.createdAt) })),
          }
        : null,
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
      techSpec: aec.techSpec ? JSON.parse(JSON.stringify(aec.techSpec)) : null,
      taskAnalysis: aec.taskAnalysis ?? null,
      cachedCodebaseContext: aec.cachedCodebaseContext ?? null,
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
      implementationBranch: aec.implementationBranch ?? null, // Story 10-1
      implementationSession: aec.implementationSession
        ? {
            qaItems: aec.implementationSession.qaItems,
            branchName: aec.implementationSession.branchName,
            startedAt: Timestamp.fromDate(aec.implementationSession.startedAt),
          }
        : null, // Story 10-1
      folderId: aec.folderId ?? null, // Story 12-2
      tagIds: aec.tagIds ?? [], // Ticket tags
      // Story 14-3: Generation preferences
      includeWireframes: aec.includeWireframes,
      includeHtmlWireframes: aec.includeHtmlWireframes,
      includeApiSpec: aec.includeApiSpec,
      apiSpecDeferred: aec.apiSpecDeferred,
      wireframeContext: aec.wireframeContext ?? null,
      wireframeImageAttachmentIds: aec.wireframeImageAttachmentIds.length > 0 ? aec.wireframeImageAttachmentIds : undefined,
      apiContext: aec.apiContext ?? null,
      slug: aec.slug ?? null,
      previousStatus: aec.previousStatus ?? null,
      generationJobId: aec.generationJobId ?? null,
      approvedAt: aec.approvedAt ? Timestamp.fromDate(aec.approvedAt) : null,
      executionEvents: aec.executionEvents.map((e) => ({
        ...e,
        createdAt: Timestamp.fromDate(e.createdAt),
      })),
      changeRecord: aec.changeRecord
        ? {
            executionSummary: aec.changeRecord.executionSummary,
            filesChanged: aec.changeRecord.filesChanged,
            divergences: aec.changeRecord.divergences,
            hasDivergence: aec.changeRecord.hasDivergence,
            status: aec.changeRecord.status,
            reviewNote: aec.changeRecord.reviewNote,
            reviewedAt: aec.changeRecord.reviewedAt
              ? Timestamp.fromDate(aec.changeRecord.reviewedAt)
              : null,
            submittedAt: Timestamp.fromDate(aec.changeRecord.submittedAt),
            decisions: aec.changeRecord.decisions.map((e) => ({
              ...e,
              createdAt: Timestamp.fromDate(e.createdAt),
            })),
            risks: aec.changeRecord.risks.map((e) => ({
              ...e,
              createdAt: Timestamp.fromDate(e.createdAt),
            })),
            scopeChanges: aec.changeRecord.scopeChanges.map((e) => ({
              ...e,
              createdAt: Timestamp.fromDate(e.createdAt),
            })),
          }
        : null,
    };
  }
}
