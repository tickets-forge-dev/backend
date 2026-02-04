import {
  AECStatus,
  TicketType,
  VALID_TRANSITIONS,
  REQUIRED_FIELDS,
} from '../value-objects/AECStatus';
import { GenerationState } from '../value-objects/GenerationState';
import { Estimate } from '../value-objects/Estimate';
import { CodeSnapshot, ApiSnapshot } from '../value-objects/Snapshot';
import { Question } from '../value-objects/Question';
import { ValidationResult } from '../value-objects/ValidationResult';
import { ExternalIssue } from '../value-objects/ExternalIssue';
import { RepositoryContext } from '../value-objects/RepositoryContext';
import { Finding } from '../../../validation/domain/Finding';
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
    private _preImplementationFindings: Finding[], // NEW: Epic 7.3
    private _externalIssue: ExternalIssue | null,
    private _driftDetectedAt: Date | null,
    private _driftReason: string | null,
    private _failureReason: string | null, // NEW: Phase B Fix #9
    private _lockedBy: string | null, // NEW: Phase B Fix #6 - workflow run ID
    private _lockedAt: Date | null, // NEW: Phase B Fix #6
    private _repositoryContext: RepositoryContext | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {
    // Validate findings limit
    if (_preImplementationFindings && _preImplementationFindings.length > 10) {
      throw new Error('Maximum 10 pre-implementation findings allowed');
    }
  }

  // Factory method for creating new draft
  static createDraft(
    workspaceId: string,
    title: string,
    description?: string,
    repositoryContext?: RepositoryContext,
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
      null,
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
      [], // preImplementationFindings - empty initially
      null,
      null,
      null,
      null, // failureReason
      null, // lockedBy
      null, // lockedAt
      repositoryContext ?? null,
      new Date(),
      new Date(),
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
    preImplementationFindings: Finding[], // NEW: Epic 7.3
    externalIssue: ExternalIssue | null,
    driftDetectedAt: Date | null,
    driftReason: string | null,
    failureReason: string | null,
    lockedBy: string | null,
    lockedAt: Date | null,
    repositoryContext: RepositoryContext | null,
    createdAt: Date,
    updatedAt: Date,
  ): AEC {
    return new AEC(
      id,
      workspaceId,
      status,
      title,
      description,
      type,
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
      preImplementationFindings,
      externalIssue,
      driftDetectedAt,
      driftReason,
      failureReason,
      lockedBy,
      lockedAt,
      repositoryContext,
      createdAt,
      updatedAt,
    );
  }

  // State machine transitions
  /**
   * Phase B Fix #7: State machine with transition validation
   * Validates that the transition from current status to target status is allowed
   */
  private validateTransition(targetStatus: AECStatus): void {
    const allowedTransitions = VALID_TRANSITIONS[this._status];
    if (!allowedTransitions.includes(targetStatus)) {
      throw new InvalidStateTransitionError(
        `Invalid transition from ${this._status} to ${targetStatus}. Allowed: ${allowedTransitions.join(', ')}`,
      );
    }
  }

  /**
   * Phase B Fix #7: Validate required fields for target status
   */
  private validateRequiredFields(targetStatus: AECStatus): void {
    const required = REQUIRED_FIELDS[targetStatus];
    const missing: string[] = [];

    for (const field of required) {
      switch (field) {
        case 'title':
          if (!this._title) missing.push('title');
          break;
        case 'type':
          if (!this._type) missing.push('type');
          break;
        case 'acceptanceCriteria':
          if (this._acceptanceCriteria.length === 0)
            missing.push('acceptanceCriteria');
          break;
        case 'codeSnapshot':
          if (!this._codeSnapshot) missing.push('codeSnapshot');
          break;
        case 'externalIssue':
          if (!this._externalIssue) missing.push('externalIssue');
          break;
        case 'preImplementationFindings':
          if (this._preImplementationFindings.length === 0)
            missing.push('preImplementationFindings');
          break;
        case 'questions':
          if (this._questions.length === 0) missing.push('questions');
          break;
        case 'driftReason':
          if (!this._driftReason) missing.push('driftReason');
          break;
        case 'failureReason':
          if (!this._failureReason) missing.push('failureReason');
          break;
      }
    }

    if (missing.length > 0) {
      throw new InvalidStateTransitionError(
        `Cannot transition to ${targetStatus}. Missing required fields: ${missing.join(', ')}`,
      );
    }
  }

  /**
   * Phase B Fix #6: Lock AEC for workflow execution
   */
  lock(workflowRunId: string): void {
    if (this._lockedBy) {
      throw new Error(
        `AEC is already locked by workflow ${this._lockedBy}. Cannot start new workflow.`,
      );
    }
    this._lockedBy = workflowRunId;
    this._lockedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Phase B Fix #6: Unlock AEC after workflow completion
   */
  unlock(): void {
    this._lockedBy = null;
    this._lockedAt = null;
    this._updatedAt = new Date();
  }

  /**
   * Phase B Fix #6: Check if AEC is locked
   */
  get isLocked(): boolean {
    return this._lockedBy !== null;
  }

  /**
   * Phase B Fix #6: Check if locked by specific workflow
   */
  isLockedBy(workflowRunId: string): boolean {
    return this._lockedBy === workflowRunId;
  }

  /**
   * Phase B Fix #6: Force unlock (for error recovery)
   */
  forceUnlock(): void {
    this._lockedBy = null;
    this._lockedAt = null;
    this._updatedAt = new Date();
  }

  /**
   * Phase B Fix #9: Mark AEC as failed with reason
   */
  markAsFailed(reason: string): void {
    this.validateTransition(AECStatus.FAILED);
    this._status = AECStatus.FAILED;
    this._failureReason = reason;
    this._updatedAt = new Date();
    // Auto-unlock on failure
    this.unlock();
  }

  /**
   * Transition to GENERATING status (workflow started)
   */
  startGenerating(workflowRunId: string): void {
    this.validateTransition(AECStatus.GENERATING);
    this.lock(workflowRunId);
    this._status = AECStatus.GENERATING;
    this._updatedAt = new Date();
  }

  /**
   * Suspend workflow at findings review checkpoint
   */
  suspendForFindingsReview(findings: Finding[]): void {
    this.validateTransition(AECStatus.SUSPENDED_FINDINGS);
    this._preImplementationFindings = findings;
    this._status = AECStatus.SUSPENDED_FINDINGS;
    this._updatedAt = new Date();
  }

  /**
   * Suspend workflow at questions checkpoint
   */
  suspendForQuestions(questions: Question[]): void {
    this.validateTransition(AECStatus.SUSPENDED_QUESTIONS);
    this._questions = questions;
    this._status = AECStatus.SUSPENDED_QUESTIONS;
    this._updatedAt = new Date();
  }

  /**
   * Resume workflow from suspension (user chose to proceed)
   */
  resumeGenerating(): void {
    this.validateTransition(AECStatus.GENERATING);
    this._status = AECStatus.GENERATING;
    this._updatedAt = new Date();
  }

  /**
   * User chose to edit - revert to draft and unlock
   */
  revertToDraft(): void {
    this.validateTransition(AECStatus.DRAFT);
    this._status = AECStatus.DRAFT;
    this._updatedAt = new Date();
    this.unlock();
  }

  validate(validationResults: ValidationResult[]): void {
    this.validateTransition(AECStatus.VALIDATED);
    this.validateRequiredFields(AECStatus.VALIDATED);
    this._validationResults = validationResults;
    this._readinessScore = this.calculateReadinessScore(validationResults);
    this._status = AECStatus.VALIDATED;
    this._updatedAt = new Date();
    // Unlock after successful generation
    this.unlock();
  }

  /**
   * Get overall validation score (weighted average 0.0-1.0)
   */
  get overallValidationScore(): number {
    if (this._validationResults.length === 0) return 0;

    const totalWeight = this._validationResults.reduce((sum, r) => sum + r.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = this._validationResults.reduce(
      (sum, r) => sum + r.weightedScore,
      0,
    );

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
    return this._validationResults.some(r => r.hasCriticalIssues());
  }

  markReady(codeSnapshot: CodeSnapshot, apiSnapshot?: ApiSnapshot): void {
    this.validateTransition(AECStatus.READY);
    // Set snapshot before validation (validation checks if it exists)
    this._codeSnapshot = codeSnapshot;
    this._apiSnapshot = apiSnapshot ?? null;
    this.validateRequiredFields(AECStatus.READY);
    if (this._readinessScore < 75) {
      throw new InsufficientReadinessError(
        `Score ${this._readinessScore} < 75`,
      );
    }
    this._status = AECStatus.READY;
    this._updatedAt = new Date();
  }

  export(externalIssue: ExternalIssue): void {
    this.validateTransition(AECStatus.CREATED);
    this.validateRequiredFields(AECStatus.CREATED);
    this._externalIssue = externalIssue;
    this._status = AECStatus.CREATED;
    this._updatedAt = new Date();
  }

  detectDrift(reason: string): void {
    if (
      ![AECStatus.READY, AECStatus.CREATED].includes(this._status)
    ) {
      return;
    }
    this.validateTransition(AECStatus.DRIFTED);
    this._status = AECStatus.DRIFTED;
    this._driftDetectedAt = new Date();
    this._driftReason = reason;
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

  addQuestions(questions: Question[]): void {
    if (questions.length > 3) {
      throw new Error('Maximum 3 questions allowed');
    }
    this._questions = questions;
    this._updatedAt = new Date();
  }

  /**
   * Store user's answers to questions
   * Called when user submits answers at questions suspension point
   */
  setQuestionAnswers(answers: Record<string, string>): void {
    // Update questions with user answers
    this._questions = this._questions.map((q) => ({
      ...q,
      answer: answers[q.id] || q.defaultAnswer,
    }));
    this._updatedAt = new Date();
  }

  setEstimate(estimate: Estimate): void {
    this._estimate = estimate;
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
    const weightedScore = results.reduce(
      (sum, r) => sum + r.score * r.weight,
      0,
    );

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
  get questions(): Question[] {
    return [...this._questions];
  }
  get estimate(): Estimate | null {
    return this._estimate;
  }
  get validationResults(): ValidationResult[] {
    return [...this._validationResults];
  }

  get preImplementationFindings(): Finding[] {
    return [...this._preImplementationFindings];
  }

  /**
   * Update preflight validation findings
   * Called by ValidateAECWithPreflightUseCase
   */
  updatePreImplementationFindings(findings: Finding[]): void {
    if (findings.length > 10) {
      throw new Error('Maximum 10 pre-implementation findings allowed');
    }
    this._preImplementationFindings = findings;
    this._updatedAt = new Date();
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
  get failureReason(): string | null {
    return this._failureReason;
  }
  get lockedBy(): string | null {
    return this._lockedBy;
  }
  get lockedAt(): Date | null {
    return this._lockedAt;
  }
}
