import { AECStatus, TicketType } from '../value-objects/AECStatus';
import { GenerationState } from '../value-objects/GenerationState';
import { Estimate } from '../value-objects/Estimate';
import { CodeSnapshot, ApiSnapshot } from '../value-objects/Snapshot';
import { Question } from '../value-objects/Question';
import { ValidationResult } from '../value-objects/ValidationResult';
import { ExternalIssue } from '../value-objects/ExternalIssue';
import { RepositoryContext } from '../value-objects/RepositoryContext';
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
    private _repositoryContext: RepositoryContext | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

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
      null,
      null,
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
    externalIssue: ExternalIssue | null,
    driftDetectedAt: Date | null,
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
      externalIssue,
      driftDetectedAt,
      repositoryContext,
      createdAt,
      updatedAt,
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

  addQuestions(questions: Question[]): void {
    if (questions.length > 3) {
      throw new Error('Maximum 3 questions allowed');
    }
    this._questions = questions;
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

  // Private helper
  private calculateReadinessScore(results: ValidationResult[]): number {
    if (results.length === 0) return 0;

    const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
    const weightedScore = results.reduce(
      (sum, r) => sum + r.score * r.weight,
      0,
    );

    return Math.round(weightedScore / totalWeight);
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
  get repositoryContext(): RepositoryContext | null {
    return this._repositoryContext;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
