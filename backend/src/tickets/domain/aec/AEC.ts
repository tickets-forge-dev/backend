import { AECStatus, TicketType, TicketPriority } from '../value-objects/AECStatus';
import { GenerationState } from '../value-objects/GenerationState';
import { Estimate } from '../value-objects/Estimate';
import { CodeSnapshot, ApiSnapshot } from '../value-objects/Snapshot';
import { Question } from '../value-objects/Question';
import { ValidationResult } from '../value-objects/ValidationResult';
import { ExternalIssue } from '../value-objects/ExternalIssue';
import { RepositoryContext } from '../value-objects/RepositoryContext';
import { Attachment, MAX_ATTACHMENTS } from '../value-objects/Attachment';
import {
  DesignReference,
  DesignMetadata,
  MAX_DESIGN_LINKS,
  validateDesignReferenceUrl,
  detectPlatform,
} from '../value-objects/DesignReference';
import { TechSpec, ClarificationQuestion } from '../tech-spec/TechSpecGenerator';
import {
  InvalidStateTransitionError,
  InsufficientReadinessError,
} from '../../../shared/domain/exceptions/DomainExceptions';
import { randomUUID } from 'crypto';

export class AEC {
  private constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    private _status: AECStatus,
    private _title: string,
    private _description: string | null,
    private _type: TicketType | null,
    private _priority: TicketPriority | null,
    private _readinessScore: number,
    private _generationState: GenerationState,
    private _acceptanceCriteria: string[],
    private _assumptions: string[],
    private _repoPaths: string[],
    private _codeSnapshot: CodeSnapshot | null,
    private _apiSnapshot: ApiSnapshot | null,
    private _questions: Question[],
    private _estimate: Estimate | null,
    private _validationResults: ValidationResult[],
    private _externalIssue: ExternalIssue | null,
    private _driftDetectedAt: Date | null,
    private _driftReason: string | null,
    private _repositoryContext: RepositoryContext | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    // Simple question tracking (no rounds)
    private _clarificationQuestions: ClarificationQuestion[] = [],
    private _questionAnswers: Record<string, string | string[]> = {},
    private _questionsAnsweredAt: Date | null = null,
    private _techSpec: TechSpec | null = null,
    private _taskAnalysis: any = null,
    private _attachments: Attachment[] = [],
    private _designReferences: DesignReference[] = [],
  ) {}

  // Factory method for creating new draft
  static createDraft(
    workspaceId: string,
    title: string,
    description?: string,
    repositoryContext?: RepositoryContext,
    type?: TicketType,
    priority?: TicketPriority,
  ): AEC {
    // Domain validation
    if (title.length < 3 || title.length > 500) {
      throw new Error('Title must be 3-500 characters');
    }

    return new AEC(
      `aec_${randomUUID()}`,
      workspaceId,
      AECStatus.DRAFT,
      title,
      description ?? null,
      type ?? null,
      priority ?? null,
      0,
      { currentStep: 0, steps: [] }, // Will be initialized by use case
      [],
      [],
      [],
      null,
      null,
      [],
      null,
      [],
      null,
      null,
      null,
      repositoryContext ?? null,
      new Date(),
      new Date(),
      [], // _clarificationQuestions
      {}, // _questionAnswers
      null, // _questionsAnsweredAt
      null, // _techSpec
      null, // _taskAnalysis
      [], // _attachments
      [], // _designReferences
    );
  }

  // Factory method for reconstitution from persistence
  static reconstitute(
    id: string,
    workspaceId: string,
    status: AECStatus,
    title: string,
    description: string | null,
    type: TicketType | null,
    priority: TicketPriority | null,
    readinessScore: number,
    generationState: GenerationState,
    acceptanceCriteria: string[],
    assumptions: string[],
    repoPaths: string[],
    codeSnapshot: CodeSnapshot | null,
    apiSnapshot: ApiSnapshot | null,
    questions: Question[],
    estimate: Estimate | null,
    validationResults: ValidationResult[],
    externalIssue: ExternalIssue | null,
    driftDetectedAt: Date | null,
    driftReason: string | null,
    repositoryContext: RepositoryContext | null,
    createdAt: Date,
    updatedAt: Date,
    clarificationQuestions?: ClarificationQuestion[],
    questionAnswers?: Record<string, string | string[]>,
    questionsAnsweredAt?: Date | null,
    techSpec?: TechSpec | null,
    taskAnalysis?: any,
    attachments?: Attachment[],
    designReferences?: DesignReference[],
  ): AEC {
    return new AEC(
      id,
      workspaceId,
      status,
      title,
      description,
      type,
      priority,
      readinessScore,
      generationState,
      acceptanceCriteria,
      assumptions,
      repoPaths,
      codeSnapshot,
      apiSnapshot,
      questions,
      estimate,
      validationResults,
      externalIssue,
      driftDetectedAt,
      driftReason,
      repositoryContext,
      createdAt,
      updatedAt,
      clarificationQuestions ?? [],
      questionAnswers ?? {},
      questionsAnsweredAt ?? null,
      techSpec ?? null,
      taskAnalysis ?? null,
      attachments ?? [],
      designReferences ?? [],
    );
  }

  // State machine transitions
  validate(validationResults: ValidationResult[]): void {
    if (this._status !== AECStatus.DRAFT) {
      throw new InvalidStateTransitionError(`Cannot validate from ${this._status}`);
    }
    this._validationResults = validationResults;
    this._readinessScore = this.calculateReadinessScore(validationResults);
    this._status = AECStatus.VALIDATED;
    this._updatedAt = new Date();
  }

  /**
   * Get overall validation score (weighted average 0.0-1.0)
   */
  get overallValidationScore(): number {
    if (this._validationResults.length === 0) return 0;

    const totalWeight = this._validationResults.reduce((sum, r) => sum + r.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = this._validationResults.reduce((sum, r) => sum + r.weightedScore, 0);

    return weightedSum / totalWeight;
  }

  /**
   * Check if validation passed (score >= 0.7 threshold)
   */
  get validationPassed(): boolean {
    return this.overallValidationScore >= 0.7;
  }

  /**
   * Check if there are any critical blockers
   */
  get hasCriticalBlockers(): boolean {
    return this._validationResults.some((r) => r.hasCriticalIssues());
  }

  markReady(codeSnapshot: CodeSnapshot, apiSnapshot?: ApiSnapshot): void {
    if (this._status !== AECStatus.VALIDATED) {
      throw new InvalidStateTransitionError(`Cannot mark ready from ${this._status}`);
    }
    if (this._readinessScore < 75) {
      throw new InsufficientReadinessError(`Score ${this._readinessScore} < 75`);
    }
    this._codeSnapshot = codeSnapshot;
    this._apiSnapshot = apiSnapshot ?? null;
    this._status = AECStatus.READY;
    this._updatedAt = new Date();
  }

  export(externalIssue: ExternalIssue): void {
    if (this._status !== AECStatus.READY) {
      throw new InvalidStateTransitionError(`Cannot export from ${this._status}`);
    }
    this._externalIssue = externalIssue;
    this._status = AECStatus.CREATED;
    this._updatedAt = new Date();
  }

  /**
   * Set external issue link without status transition.
   * Works from any status that has a techSpec (draft, complete, etc).
   */
  setExternalIssue(externalIssue: ExternalIssue): void {
    if (!this._techSpec) {
      throw new InvalidStateTransitionError('Cannot set external issue without a tech spec');
    }
    this._externalIssue = externalIssue;
    this._updatedAt = new Date();
  }

  /**
   * Set import source metadata on draft ticket.
   * Unlike setExternalIssue(), this works without requiring a tech spec.
   * Used when importing from Jira/Linear to draft tickets.
   */
  setImportedFrom(externalIssue: ExternalIssue): void {
    this._externalIssue = externalIssue;
    this._updatedAt = new Date();
  }

  markComplete(): void {
    if (this._status !== AECStatus.DRAFT) {
      throw new InvalidStateTransitionError(
        `Cannot mark complete from ${this._status}. Only draft tickets can be marked complete.`,
      );
    }
    this._status = AECStatus.COMPLETE;
    this._updatedAt = new Date();
  }

  revertToDraft(): void {
    if (this._status !== AECStatus.COMPLETE) {
      throw new InvalidStateTransitionError(
        `Cannot revert to draft from ${this._status}. Only complete tickets can be reverted.`,
      );
    }
    this._status = AECStatus.DRAFT;
    // Clear tech spec when reverting to draft so user can modify and regenerate
    this._techSpec = null;
    this._updatedAt = new Date();
  }

  detectDrift(_reason: string): void {
    if (![AECStatus.READY, AECStatus.CREATED].includes(this._status)) {
      return;
    }
    this._status = AECStatus.DRIFTED;
    this._driftDetectedAt = new Date();
    this._updatedAt = new Date();
  }

  // Domain logic
  updateGenerationState(generationState: GenerationState): void {
    this._generationState = generationState;
    this._updatedAt = new Date();
  }

  updateContent(
    type: TicketType,
    acceptanceCriteria: string[],
    assumptions: string[],
    repoPaths: string[],
  ): void {
    this._type = type;
    this._acceptanceCriteria = acceptanceCriteria;
    this._assumptions = assumptions;
    this._repoPaths = repoPaths;
    this._updatedAt = new Date();
  }

  /**
   * Set clarification questions (simple, single-set)
   *
   * Stores up to 5 clarification questions generated from the task.
   * No rounds, no iterations - just one set of questions.
   */
  setQuestions(questions: ClarificationQuestion[]): void {
    this._clarificationQuestions = questions;
    this._updatedAt = new Date();
  }

  /**
   * Record user answers to clarification questions
   *
   * Called after user submits all question answers.
   * Marks the time questions were answered for audit trail.
   */
  recordQuestionAnswers(answers: Record<string, string | string[]>): void {
    this._questionAnswers = answers;
    this._questionsAnsweredAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Deprecated: Use setQuestions() instead
   * Kept for backward compatibility with old API
   */
  addQuestions(questions: Question[]): void {
    this._questions = questions;
    this._updatedAt = new Date();
  }

  /**
   * Set the final technical specification
   *
   * Called after question refinement is complete and spec is finalized
   */
  setTechSpec(spec: TechSpec): void {
    this._techSpec = spec;
    this._updatedAt = new Date();
  }

  // Import ClarificationQuestion for type safety
  // Note: This is typed in QuestionRound import

  setEstimate(estimate: Estimate): void {
    this._estimate = estimate;
    this._updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  updateAcceptanceCriteria(acceptanceCriteria: string[]): void {
    this._acceptanceCriteria = acceptanceCriteria;
    this._updatedAt = new Date();
  }

  updateAssumptions(assumptions: string[]): void {
    this._assumptions = assumptions;
    this._updatedAt = new Date();
  }

  updateTechSpec(partial: Record<string, any>): void {
    if (!this._techSpec) return;
    for (const key of Object.keys(partial)) {
      if (partial[key] !== undefined) {
        (this._techSpec as any)[key] = partial[key];
      }
    }
    this._updatedAt = new Date();
  }

  setRepositoryContext(repositoryContext: RepositoryContext): void {
    this._repositoryContext = repositoryContext;
    this._updatedAt = new Date();
  }

  markDrifted(reason: string): void {
    if (this._status !== AECStatus.READY && this._status !== AECStatus.CREATED) {
      // Only mark open tickets as drifted
      return;
    }
    this._status = AECStatus.DRIFTED;
    this._driftDetectedAt = new Date();
    this._driftReason = reason;
    this._updatedAt = new Date();
  }

  // Private helper
  private calculateReadinessScore(results: ValidationResult[]): number {
    if (results.length === 0) return 0;

    const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
    const weightedScore = results.reduce((sum, r) => sum + r.score * r.weight, 0);

    // Return as percentage (0-100) rounded to nearest integer
    return Math.round((weightedScore / totalWeight) * 100);
  }

  // Getters (immutable from outside)
  get status(): AECStatus {
    return this._status;
  }
  get title(): string {
    return this._title;
  }
  get description(): string | null {
    return this._description;
  }
  get type(): TicketType | null {
    return this._type;
  }
  get priority(): TicketPriority | null {
    return this._priority;
  }
  get readinessScore(): number {
    return this._readinessScore;
  }
  get generationState(): GenerationState {
    return this._generationState;
  }
  get acceptanceCriteria(): string[] {
    return [...this._acceptanceCriteria];
  }
  get assumptions(): string[] {
    return [...this._assumptions];
  }
  get repoPaths(): string[] {
    return [...this._repoPaths];
  }
  get codeSnapshot(): CodeSnapshot | null {
    return this._codeSnapshot;
  }
  get apiSnapshot(): ApiSnapshot | null {
    return this._apiSnapshot;
  }
  get estimate(): Estimate | null {
    return this._estimate;
  }
  get validationResults(): ValidationResult[] {
    return [...this._validationResults];
  }
  get externalIssue(): ExternalIssue | null {
    return this._externalIssue;
  }
  get driftDetectedAt(): Date | null {
    return this._driftDetectedAt;
  }
  get driftReason(): string | null {
    return this._driftReason;
  }
  get repositoryContext(): RepositoryContext | null {
    return this._repositoryContext;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Getters for clarification questions (simple, single-set)
  get questions(): ClarificationQuestion[] {
    return [...this._clarificationQuestions];
  }

  get questionAnswers(): Record<string, string | string[]> {
    return { ...this._questionAnswers };
  }

  get questionsAnsweredAt(): Date | null {
    return this._questionsAnsweredAt;
  }

  get hasAnsweredQuestions(): boolean {
    return this._questionsAnsweredAt !== null;
  }

  get techSpec(): TechSpec | null {
    return this._techSpec;
  }

  get taskAnalysis(): any {
    return this._taskAnalysis;
  }

  setTaskAnalysis(taskAnalysis: any): void {
    this._taskAnalysis = taskAnalysis;
    this._updatedAt = new Date();
  }

  get attachments(): Attachment[] {
    return [...this._attachments];
  }

  addAttachment(attachment: Attachment): void {
    if (this._attachments.length >= MAX_ATTACHMENTS) {
      throw new Error(`Maximum of ${MAX_ATTACHMENTS} attachments per ticket`);
    }
    this._attachments.push(attachment);
    this._updatedAt = new Date();
  }

  removeAttachment(attachmentId: string): void {
    this._attachments = this._attachments.filter((a) => a.id !== attachmentId);
    this._updatedAt = new Date();
  }

  get designReferences(): DesignReference[] {
    return [...this._designReferences];
  }

  /**
   * Add a design reference (Figma, Loom, etc.) to the ticket
   *
   * @param url - The design link URL (must be HTTPS)
   * @param title - Optional custom title
   * @param userEmail - Email of user adding the reference
   * @throws Error if URL is invalid or max links reached
   */
  addDesignReference(url: string, userEmail: string, title?: string): DesignReference {
    // Validate URL
    validateDesignReferenceUrl(url);

    // Check max limit
    if (this._designReferences.length >= MAX_DESIGN_LINKS) {
      throw new Error(`Maximum of ${MAX_DESIGN_LINKS} design links per ticket`);
    }

    // Detect platform and create reference
    const platform = detectPlatform(url);
    const reference: DesignReference = {
      id: `ref_${randomUUID()}`,
      url,
      platform,
      title: title,
      metadataFetchStatus: 'pending', // Metadata will be fetched asynchronously in background
      addedAt: new Date(),
      addedBy: userEmail,
    };

    this._designReferences.push(reference);
    this._updatedAt = new Date();

    return reference;
  }

  /**
   * Remove a design reference by ID
   *
   * @param referenceId - The design reference ID to remove
   */
  removeDesignReference(referenceId: string): void {
    this._designReferences = this._designReferences.filter((r) => r.id !== referenceId);
    this._updatedAt = new Date();
  }

  /**
   * Update design reference metadata (called after fetching from Figma/Loom APIs)
   * Phase 2: Metadata Enrichment
   *
   * @param referenceId - The design reference ID
   * @param metadata - The metadata to set (Figma or Loom metadata)
   */
  updateDesignReferenceMetadata(
    referenceId: string,
    metadata: DesignMetadata,
  ): void {
    const reference = this._designReferences.find((r) => r.id === referenceId);
    if (reference) {
      reference.metadata = metadata;
      this._updatedAt = new Date();
    }
  }

  /**
   * Update design reference metadata fetch status and error
   * Called after metadata fetch completes (success, pending, or failed)
   *
   * @param referenceId - The design reference ID
   * @param status - Object with metadataFetchStatus, metadataFetchError, and optional metadata
   */
  updateDesignReferenceStatus(
    referenceId: string,
    status: {
      metadataFetchStatus?: 'pending' | 'success' | 'failed';
      metadataFetchError?: string;
      metadata?: DesignMetadata;
    },
  ): void {
    const reference = this._designReferences.find((r) => r.id === referenceId);
    if (reference) {
      if (status.metadataFetchStatus !== undefined) {
        reference.metadataFetchStatus = status.metadataFetchStatus;
      }
      if (status.metadataFetchError !== undefined) {
        reference.metadataFetchError = status.metadataFetchError;
      }
      if (status.metadata !== undefined) {
        reference.metadata = status.metadata;
      }
      this._updatedAt = new Date();
    }
  }
}
