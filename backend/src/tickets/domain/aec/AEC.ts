import { AECStatus, TicketType } from '../value-objects/AECStatus';
import { GenerationState } from '../value-objects/GenerationState';
import { Estimate } from '../value-objects/Estimate';
import { CodeSnapshot, ApiSnapshot } from '../value-objects/Snapshot';
import { Question } from '../value-objects/Question';
import { QuestionRound } from '../value-objects/QuestionRound';
import { ValidationResult } from '../value-objects/ValidationResult';
import { ExternalIssue } from '../value-objects/ExternalIssue';
import { RepositoryContext } from '../value-objects/RepositoryContext';
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
    // New fields for iterative refinement workflow
    private _questionRounds: QuestionRound[] = [],
    private _currentRound: number = 0,
    private _techSpec: TechSpec | null = null,
    private _maxRounds: number = 3,
  ) {}

  // Factory method for creating new draft
  static createDraft(
    workspaceId: string,
    title: string,
    description?: string,
    repositoryContext?: RepositoryContext,
    maxRounds: number = 3,
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
      null,
      null,
      null,
      repositoryContext ?? null,
      new Date(),
      new Date(),
      [], // _questionRounds
      0, // _currentRound
      null, // _techSpec
      maxRounds, // _maxRounds
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
    externalIssue: ExternalIssue | null,
    driftDetectedAt: Date | null,
    driftReason: string | null,
    repositoryContext: RepositoryContext | null,
    createdAt: Date,
    updatedAt: Date,
    questionRounds?: QuestionRound[],
    currentRound?: number,
    techSpec?: TechSpec | null,
    maxRounds?: number,
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
      externalIssue,
      driftDetectedAt,
      driftReason,
      repositoryContext,
      createdAt,
      updatedAt,
      questionRounds ?? [],
      currentRound ?? 0,
      techSpec ?? null,
      maxRounds ?? 3,
    );
  }

  // State machine transitions
  validate(validationResults: ValidationResult[]): void {
    if (this._status !== AECStatus.DRAFT) {
      throw new InvalidStateTransitionError(
        `Cannot validate from ${this._status}`,
      );
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
    if (this._status !== AECStatus.VALIDATED) {
      throw new InvalidStateTransitionError(
        `Cannot mark ready from ${this._status}`,
      );
    }
    if (this._readinessScore < 75) {
      throw new InsufficientReadinessError(
        `Score ${this._readinessScore} < 75`,
      );
    }
    this._codeSnapshot = codeSnapshot;
    this._apiSnapshot = apiSnapshot ?? null;
    this._status = AECStatus.READY;
    this._updatedAt = new Date();
  }

  export(externalIssue: ExternalIssue): void {
    if (this._status !== AECStatus.READY) {
      throw new InvalidStateTransitionError(
        `Cannot export from ${this._status}`,
      );
    }
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
   * Deprecated: Use startQuestionRound() for iterative refinement workflow
   * Kept for backward compatibility but no longer enforces 3-question limit
   */
  addQuestions(questions: Question[]): void {
    this._questions = questions;
    this._updatedAt = new Date();
  }

  /**
   * Start a new question round in the iterative refinement workflow
   *
   * Guards:
   * - Must complete previous round before starting next
   * - Maximum 3 rounds total
   * - Can only be called from DRAFT or IN_QUESTION_ROUND_N status
   */
  startQuestionRound(
    roundNumber: number,
    questions: ClarificationQuestion[],
    codebaseContext: string,
  ): void {
    // Guard: Sequential rounds only
    if (roundNumber > 1 && !this.isRoundComplete(roundNumber - 1)) {
      throw new InvalidStateTransitionError(
        `Cannot start round ${roundNumber}. Previous round not completed.`,
      );
    }

    // Guard: Max rounds (adaptive)
    if (roundNumber > this._maxRounds) {
      throw new Error(`Maximum ${this._maxRounds} rounds allowed`);
    }

    const round: QuestionRound = {
      roundNumber,
      questions,
      answers: {},
      generatedAt: new Date(),
      answeredAt: null,
      codebaseContext,
      skippedByUser: false,
    };

    this._questionRounds.push(round);
    this._currentRound = roundNumber;

    // Update status to reflect current round
    this._status = `in-question-round-${roundNumber}` as AECStatus;
    this._updatedAt = new Date();
  }

  /**
   * Complete a question round with user answers
   *
   * Records answers and marks round as completed
   */
  completeQuestionRound(
    roundNumber: number,
    answers: Record<string, string | string[]>,
  ): void {
    const round = this._questionRounds.find((r) => r.roundNumber === roundNumber);
    if (!round) {
      throw new Error(`Round ${roundNumber} not found`);
    }

    round.answers = answers;
    round.answeredAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Check if a question round is complete
   */
  private isRoundComplete(roundNumber: number): boolean {
    const round = this._questionRounds.find((r) => r.roundNumber === roundNumber);
    return round ? round.answeredAt !== null : false;
  }

  /**
   * User manually skips remaining rounds
   *
   * Marks current round as skipped and transitions to questions complete state
   */
  skipToFinalize(): void {
    if (this._currentRound > 0) {
      const currentRound = this._questionRounds[this._currentRound - 1];
      if (currentRound) {
        currentRound.skippedByUser = true;
      }
    }
    this._status = AECStatus.QUESTIONS_COMPLETE;
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

  // New getters for iterative refinement workflow
  get questionRounds(): QuestionRound[] {
    return [...this._questionRounds];
  }
  get currentRound(): number {
    return this._currentRound;
  }
  get techSpec(): TechSpec | null {
    return this._techSpec;
  }
  get maxRounds(): number {
    return this._maxRounds;
  }
}
