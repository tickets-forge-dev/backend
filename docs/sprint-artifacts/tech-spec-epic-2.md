# Epic Technical Specification: Epic 2 - Ticket Creation & AEC Engine

Date: 2026-01-31
Author: Development Team
Epic ID: Epic 2
Status: Draft

---

## Overview

Epic 2 delivers the core product experience of Executable Tickets: enabling PMs to create tickets with minimal input (title + optional description) and receive validated, code-aware, execution-ready tickets through a transparent 8-step generation process. The Agent Executable Contract (AEC) serves as the single source of truth, binding product intent to code reality through snapshot locking and deterministic validation.

This epic introduces the foundational generation pipeline that transforms user input into structured, machine-verifiable contracts. Users gain transparency into each generation step through real-time progress UI, building trust in the system's output. The AEC domain model enforces state transitions and ensures tickets cannot be exported without proper validation and snapshot locking.

---

## Objectives and Scope

### In-Scope

This epic covers **4 stories** (2.1-2.4) implementing:

- **Story 2.1:** Minimal ticket creation UI with title/description input
- **Story 2.2:** Real-time 8-step generation progress visualization with retry capability
- **Story 2.3:** AEC domain entity with state machine, repository pattern, and Firestore persistence
- **Story 2.4:** Ticket detail view rendering all AEC fields with inline editing

**Functional Requirements Covered:**
- **FR1:** Users can create executable tickets with title and optional description
- **FR2:** System shows real-time progress through 8 generation steps
- **FR4:** System maintains AEC as single source of truth

### Out-of-Scope

The following features are delivered in subsequent epics:

- **Validation engine scoring** (Epic 3, Story 3.1)
- **Question generation and clarification UI** (Epic 3, Story 3.2-3.3)
- **Code intelligence and indexing** (Epic 4, Stories 4.1-4.5)
- **Export integrations** (Epic 5, Stories 5.1-5.3)

**Note:** Story 2.2 references validation and estimation steps, but Epic 2 implements placeholder/stub implementations. Full functionality arrives in Epics 3-4.

---

## System Architecture Alignment

### Feature Module Organization

Epic 2 follows the **feature-based module pattern** with internal Clean Architecture layers:

```
backend/src/tickets/
├── presentation/          # REST controllers, DTOs
│   ├── tickets.controller.ts
│   └── dto/
│       ├── CreateTicketDto.ts
│       └── UpdateTicketDto.ts
├── application/           # Use cases, services
│   ├── use-cases/
│   │   ├── CreateTicketUseCase.ts
│   │   └── UpdateAECUseCase.ts
│   └── services/
│       └── GenerationOrchestrator.ts
├── domain/                # Entities, value objects, ports
│   ├── aec/
│   │   ├── AEC.ts         # Entity with state machine
│   │   └── AECRepository.ts  # Port (interface)
│   ├── value-objects/
│   │   ├── GenerationState.ts
│   │   ├── Estimate.ts
│   │   └── Question.ts
│   └── exceptions/
│       └── AECExceptions.ts
└── infrastructure/        # Adapters, persistence
    └── persistence/
        ├── FirestoreAECRepository.ts
        └── mappers/
            └── AECMapper.ts
```

**Frontend Structure:**
```
client/src/
├── tickets/
│   └── components/
│       ├── CreateTicketForm.tsx
│       ├── GenerationProgress.tsx
│       ├── TicketDetail.tsx
│       └── InlineEditableList.tsx
└── stores/
    └── tickets.store.ts   # Zustand store
```

### Technology Alignment

**Backend Stack:**
- NestJS controllers orchestrate use cases
- Domain layer has **no framework dependencies** (Pure TypeScript)
- Firestore repository implements domain port
- Mastra agents called via `ILLMContentGenerator` interface (4 steps only)

**Frontend Stack:**
- Next.js App Router with React Server Components for pages
- Client Components for interactive forms and real-time updates
- Zustand stores with `useServices()` hook for dependency injection
- shadcn/ui components from Epic 1 (button, input, textarea, badge, accordion)

**Real-Time Communication:**
- Backend updates AEC in Firestore after each generation step
- Frontend subscribes via Firestore listener (`onSnapshot`)
- No WebSockets or polling needed

---

## Detailed Design

### Services and Modules

#### Backend Services

**1. CreateTicketUseCase**
- **Purpose:** Orchestrates entire ticket creation and 8-step generation
- **Location:** `backend/src/tickets/application/use-cases/CreateTicketUseCase.ts`
- **Dependencies:**
  - `AECRepository` (domain port)
  - `ILLMContentGenerator` (Mastra wrapper)
  - `GenerationOrchestrator` (service)
- **Flow:**
  1. Validate input (title 3-500 chars)
  2. Create draft AEC via factory method
  3. Persist to repository
  4. Trigger GenerationOrchestrator
  5. Return AEC ID to frontend

**2. GenerationOrchestrator**
- **Purpose:** Executes 8 generation steps sequentially, updating Firestore after each
- **Location:** `backend/src/tickets/application/services/GenerationOrchestrator.ts`
- **Responsibilities:**
  - Step 1: Intent extraction (Mastra agent)
  - Step 2: Type detection (Mastra agent)
  - Step 3: Repo query (stub in Epic 2, real in Epic 4)
  - Step 4: API snapshot (stub in Epic 2, real in Epic 4)
  - Step 5: Drafting (Mastra agent)
  - Step 6: Validation (stub in Epic 2, real in Epic 3)
  - Step 7: Question generation (Mastra agent)
  - Step 8: Estimation (stub in Epic 2, real in Epic 4)
- **Error Handling:**
  - Each step wrapped in try-catch
  - Timeout: 30 seconds per step
  - On failure: Mark step as failed, store error message, allow retry
- **State Updates:**
  - Update `generationState.steps[i].status` after each step
  - Persist to Firestore via repository

**3. UpdateAECUseCase**
- **Purpose:** Handles inline edits to acceptance criteria and assumptions
- **Location:** `backend/src/tickets/application/use-cases/UpdateAECUseCase.ts`
- **Validation:**
  - Acceptance criteria: array of strings, max 10 items
  - Assumptions: array of strings, max 5 items
  - Triggers re-validation (stub in Epic 2)

**4. FirestoreAECRepository**
- **Purpose:** Implements AECRepository port, handles Firestore persistence
- **Location:** `backend/src/tickets/infrastructure/persistence/FirestoreAECRepository.ts`
- **Methods:**
  - `save(aec: AEC): Promise<void>` - Creates new document
  - `findById(id: string): Promise<AEC | null>` - Fetches and maps to domain entity
  - `findByWorkspace(workspaceId: string): Promise<AEC[]>` - Lists tickets
  - `update(aec: AEC): Promise<void>` - Updates existing document
- **Firestore Path:** `/workspaces/{workspaceId}/aecs/{aecId}`
- **Mapper:** Uses `AECMapper` for domain ↔ Firestore conversion

**5. MastraContentGenerator**
- **Purpose:** Infrastructure adapter wrapping Mastra agents for LLM operations
- **Location:** `backend/src/shared/infrastructure/mastra/MastraContentGenerator.ts`
- **Interface:** Implements `ILLMContentGenerator` port
- **Agents:**
  - `extractIntent(input)` → Returns extracted user intent
  - `detectType(intent)` → Returns 'feature' | 'bug' | 'task'
  - `draftTicket(context)` → Returns acceptance criteria, assumptions, repoPaths
  - `generateQuestions(validationIssues)` → Returns Question[] (max 3)

#### Frontend Components

**1. CreateTicketForm**
- **Purpose:** Minimal input form for ticket creation
- **Location:** `client/src/tickets/components/CreateTicketForm.tsx`
- **Props:** None (self-contained)
- **State:**
  - `title: string` (required, min 3 chars)
  - `description: string` (optional)
  - `loading: boolean`
- **Behavior:**
  - "Generate Ticket" disabled until title ≥ 3 chars
  - On submit: Call `ticketStore.createTicket(title, description)`
  - On success: Navigate to generation progress view
  - On error: Show error toast

**2. GenerationProgress**
- **Purpose:** Real-time visualization of 8-step generation
- **Location:** `client/src/tickets/components/GenerationProgress.tsx`
- **Props:** `aecId: string`
- **Data:** Subscribes to Firestore `/workspaces/{workspaceId}/aecs/{aecId}`
- **Display:**
  - 8 steps in vertical list
  - Each step: number, title, status icon (pending/in-progress/complete/failed)
  - Expandable details (shadcn Accordion)
  - Retry button for failed steps
- **Status Icons:**
  - Pending: Gray circle
  - In-progress: Animated blue spinner
  - Complete: Green checkmark
  - Failed: Red X with retry button

**3. TicketDetail**
- **Purpose:** Renders complete AEC with inline editing
- **Location:** `client/src/tickets/components/TicketDetail.tsx`
- **Props:** `aecId: string`
- **Sections:**
  - Header: Title + readiness badge (Green ≥75 / Amber 50-74 / Red <50)
  - Acceptance Criteria (editable list)
  - Assumptions (editable list)
  - Affected Code (read-only list of repoPaths)
  - Estimate (if available)
  - Questions (if readiness < 75) - stub in Epic 2
  - Footer: Export button (disabled until Epic 5)
- **Inline Editing:**
  - Click-to-edit for acceptance criteria and assumptions
  - Debounced save (500ms)
  - Calls `ticketStore.updateAEC(aecId, updates)`

**4. InlineEditableList**
- **Purpose:** Reusable component for editable string arrays
- **Location:** `client/src/tickets/components/InlineEditableList.tsx`
- **Props:**
  - `items: string[]`
  - `onChange: (items: string[]) => void`
  - `placeholder: string`
- **Features:**
  - Add item button
  - Delete item button
  - Inline text editing
  - Drag-to-reorder (optional, nice-to-have)

---

### Data Models and Contracts

#### AEC Domain Entity

```typescript
// backend/src/tickets/domain/aec/AEC.ts
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
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // Factory method
  static createDraft(
    workspaceId: string,
    title: string,
    description?: string
  ): AEC {
    return new AEC(
      generateUUID(), // id
      workspaceId,
      AECStatus.DRAFT,
      title,
      description ?? null,
      null, // type
      0, // readinessScore
      GenerationState.initial(),
      [], // acceptanceCriteria
      [], // assumptions
      [], // repoPaths
      null, // codeSnapshot
      null, // apiSnapshot
      [], // questions
      null, // estimate
      [], // validationResults
      null, // externalIssue
      null, // driftDetectedAt
      new Date(), // createdAt
      new Date() // updatedAt
    );
  }

  // State machine transitions
  validate(validationResults: ValidationResult[]): void {
    if (this._status !== AECStatus.DRAFT) {
      throw new InvalidStateTransitionError(
        `Cannot validate from ${this._status}`
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
        `Cannot mark ready from ${this._status}`
      );
    }
    if (this._readinessScore < 75) {
      throw new InsufficientReadinessError(
        `Score ${this._readinessScore} < 75`
      );
    }
    this._codeSnapshot = codeSnapshot;
    this._apiSnapshot = apiSnapshot ?? null;
    this._status = AECStatus.READY;
    this._updatedAt = new Date();
  }

  // Getters (no direct mutation)
  get status(): AECStatus { return this._status; }
  get title(): string { return this._title; }
  get readinessScore(): number { return this._readinessScore; }
  get generationState(): GenerationState { return this._generationState; }
  get acceptanceCriteria(): string[] { return [...this._acceptanceCriteria]; }
  // ... other getters

  // Update methods
  updateAcceptanceCriteria(criteria: string[]): void {
    if (criteria.length > 10) {
      throw new ValidationError('Max 10 acceptance criteria');
    }
    this._acceptanceCriteria = criteria;
    this._updatedAt = new Date();
  }

  updateAssumptions(assumptions: string[]): void {
    if (assumptions.length > 5) {
      throw new ValidationError('Max 5 assumptions');
    }
    this._assumptions = assumptions;
    this._updatedAt = new Date();
  }

  updateGenerationState(state: GenerationState): void {
    this._generationState = state;
    this._updatedAt = new Date();
  }
}
```

#### Value Objects

**GenerationState**
```typescript
// backend/src/tickets/domain/value-objects/GenerationState.ts
export class GenerationState {
  constructor(
    public readonly currentStep: number,
    public readonly steps: GenerationStep[]
  ) {}

  static initial(): GenerationState {
    const steps = [
      { id: 1, title: 'Intent extraction', status: 'pending', details: null },
      { id: 2, title: 'Type detection', status: 'pending', details: null },
      { id: 3, title: 'Repo index query', status: 'pending', details: null },
      { id: 4, title: 'API snapshot resolution', status: 'pending', details: null },
      { id: 5, title: 'Ticket drafting', status: 'pending', details: null },
      { id: 6, title: 'Validation', status: 'pending', details: null },
      { id: 7, title: 'Question prep', status: 'pending', details: null },
      { id: 8, title: 'Estimation', status: 'pending', details: null },
    ];
    return new GenerationState(1, steps);
  }
}

export type GenerationStep = {
  id: number;
  title: string;
  status: 'pending' | 'in-progress' | 'complete' | 'failed';
  details: string | null;
  error?: string;
};
```

**Question**
```typescript
// backend/src/tickets/domain/value-objects/Question.ts
export class Question {
  constructor(
    public readonly id: string,
    public readonly text: string,
    public readonly type: 'binary' | 'multi-choice',
    public readonly options: string[],
    public readonly answer: string | null,
    public readonly defaultAssumption: string
  ) {
    if (options.length < 2 || options.length > 4) {
      throw new ValidationError('Question must have 2-4 options');
    }
  }
}
```

**Estimate**
```typescript
// backend/src/tickets/domain/value-objects/Estimate.ts
export class Estimate {
  constructor(
    public readonly min: number, // hours
    public readonly max: number, // hours
    public readonly confidence: 'low' | 'medium' | 'high',
    public readonly drivers: string[] // Top 3 factors
  ) {
    if (min < 0 || max < min) {
      throw new ValidationError('Invalid estimate range');
    }
    if (drivers.length > 3) {
      throw new ValidationError('Max 3 drivers');
    }
  }
}
```

**CodeSnapshot**
```typescript
// backend/src/tickets/domain/value-objects/CodeSnapshot.ts
export type CodeSnapshot = {
  commitSha: string;
  indexId: string;
};
```

**ApiSnapshot**
```typescript
// backend/src/tickets/domain/value-objects/ApiSnapshot.ts
export type ApiSnapshot = {
  specUrl: string;
  hash: string; // SHA-256 of spec content
};
```

#### Enums

```typescript
// backend/src/tickets/domain/aec/AECStatus.ts
export enum AECStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  READY = 'ready',
  CREATED = 'created',
  DRIFTED = 'drifted',
}

// backend/src/tickets/domain/aec/TicketType.ts
export enum TicketType {
  FEATURE = 'feature',
  BUG = 'bug',
  TASK = 'task',
}
```

---

### APIs and Interfaces

#### REST API Endpoints

**Base URL:** `http://localhost:3000/api` (dev)

**Authentication:** All endpoints require `Authorization: Bearer <firebase-token>`

| Method | Endpoint | Request Body | Response | Description |
|--------|----------|-------------|----------|-------------|
| POST | `/tickets` | `CreateTicketDto` | `AEC` (status 201) | Create ticket and start generation |
| GET | `/tickets` | Query: `workspaceId` | `AEC[]` (status 200) | List tickets in workspace |
| GET | `/tickets/:id` | None | `AEC` (status 200) | Get ticket details |
| PATCH | `/tickets/:id` | `UpdateTicketDto` | `AEC` (status 200) | Update acceptance criteria/assumptions |

**DTOs:**

```typescript
// CreateTicketDto
{
  "title": "Add user authentication",  // required, 3-500 chars
  "description": "Users should be able to sign up" // optional
}

// UpdateTicketDto
{
  "acceptanceCriteria": [
    "Users can sign up with email/password",
    "Users can log in"
  ],
  "assumptions": [
    "Using Firebase Auth",
    "Email verification required"
  ]
}

// AEC Response (serialized)
{
  "id": "aec_abc123",
  "workspaceId": "ws_xyz",
  "status": "draft",
  "title": "Add user authentication",
  "description": "Users should be able to sign up",
  "type": null,
  "readinessScore": 0,
  "generationState": {
    "currentStep": 1,
    "steps": [
      { "id": 1, "title": "Intent extraction", "status": "in-progress", "details": null },
      { "id": 2, "title": "Type detection", "status": "pending", "details": null },
      // ... remaining steps
    ]
  },
  "acceptanceCriteria": [],
  "assumptions": [],
  "repoPaths": [],
  "codeSnapshot": null,
  "apiSnapshot": null,
  "questions": [],
  "estimate": null,
  "validationResults": [],
  "externalIssue": null,
  "driftDetectedAt": null,
  "createdAt": "2026-01-31T10:00:00.000Z",
  "updatedAt": "2026-01-31T10:00:00.000Z"
}
```

**Error Responses:**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title must be 3-500 characters" }
  ],
  "timestamp": "2026-01-31T10:00:00.000Z"
}
```

#### Repository Interface (Port)

```typescript
// backend/src/tickets/domain/aec/AECRepository.ts
export interface AECRepository {
  save(aec: AEC): Promise<void>;
  findById(id: string): Promise<AEC | null>;
  findByWorkspace(workspaceId: string): Promise<AEC[]>;
  update(aec: AEC): Promise<void>;
}
```

#### LLM Content Generator Interface (Port)

```typescript
// backend/src/shared/application/ports/ILLMContentGenerator.ts
export interface ILLMContentGenerator {
  extractIntent(input: { title: string; description?: string }): Promise<string>;
  detectType(intent: string): Promise<TicketType>;
  draftTicket(context: DraftContext): Promise<DraftOutput>;
  generateQuestions(validationIssues: ValidationIssue[]): Promise<Question[]>;
}

type DraftContext = {
  intent: string;
  type: TicketType;
  repoPaths: string[]; // stub: [] in Epic 2
  apiEndpoints: string[]; // stub: [] in Epic 2
};

type DraftOutput = {
  acceptanceCriteria: string[];
  assumptions: string[];
  repoPaths: string[];
};
```

---

### Workflows and Sequencing

#### 8-Step Generation Sequence

**Trigger:** POST `/tickets` endpoint receives title + description

**Orchestrator:** `GenerationOrchestrator.execute(aec: AEC)`

**Execution Flow:**

```typescript
// Pseudocode
async execute(aec: AEC): Promise<void> {
  try {
    // Step 1: Intent extraction (LLM)
    updateStep(aec, 1, 'in-progress');
    const intent = await llmGenerator.extractIntent({
      title: aec.title,
      description: aec.description
    });
    updateStep(aec, 1, 'complete', intent);

    // Step 2: Type detection (LLM)
    updateStep(aec, 2, 'in-progress');
    const type = await llmGenerator.detectType(intent);
    aec.setType(type);
    updateStep(aec, 2, 'complete', type);

    // Step 3: Repo query (STUB - Epic 4)
    updateStep(aec, 3, 'in-progress');
    const repoPaths: string[] = []; // stub
    updateStep(aec, 3, 'complete', 'No repos indexed yet');

    // Step 4: API snapshot (STUB - Epic 4)
    updateStep(aec, 4, 'in-progress');
    const apiEndpoints: string[] = []; // stub
    updateStep(aec, 4, 'complete', 'No APIs indexed yet');

    // Step 5: Drafting (LLM)
    updateStep(aec, 5, 'in-progress');
    const draft = await llmGenerator.draftTicket({
      intent,
      type,
      repoPaths,
      apiEndpoints
    });
    aec.updateAcceptanceCriteria(draft.acceptanceCriteria);
    aec.updateAssumptions(draft.assumptions);
    aec.setRepoPaths(draft.repoPaths);
    updateStep(aec, 5, 'complete',
      `Generated ${draft.acceptanceCriteria.length} ACs`);

    // Step 6: Validation (STUB - Epic 3)
    updateStep(aec, 6, 'in-progress');
    const validationResults: ValidationResult[] = [
      {
        validatorType: 'structural',
        passed: true,
        score: 75,
        weight: 1.0,
        issues: [],
        blockers: []
      }
    ];
    aec.validate(validationResults);
    updateStep(aec, 6, 'complete', 'Readiness: 75/100');

    // Step 7: Question prep (LLM - conditional)
    updateStep(aec, 7, 'in-progress');
    if (aec.readinessScore < 75) {
      const questions = await llmGenerator.generateQuestions(
        validationResults.flatMap(r => r.issues)
      );
      aec.setQuestions(questions);
      updateStep(aec, 7, 'complete', `Generated ${questions.length} questions`);
    } else {
      updateStep(aec, 7, 'complete', 'No questions needed');
    }

    // Step 8: Estimation (STUB - Epic 4)
    updateStep(aec, 8, 'in-progress');
    const estimate = new Estimate(4, 8, 'low', ['Limited data']);
    aec.setEstimate(estimate);
    updateStep(aec, 8, 'complete', '4-8 hours (low confidence)');

    // Persist final state
    await repository.update(aec);

  } catch (error) {
    // Mark current step as failed
    markStepFailed(aec, error);
    await repository.update(aec);
    throw error;
  }
}

async updateStep(
  aec: AEC,
  stepId: number,
  status: StepStatus,
  details?: string
): Promise<void> {
  const state = aec.generationState;
  state.steps[stepId - 1].status = status;
  state.steps[stepId - 1].details = details ?? null;
  state.currentStep = stepId;
  aec.updateGenerationState(state);

  // Persist to Firestore for real-time updates
  await repository.update(aec);
}
```

**Step Timeout Handling:**

Each LLM call wrapped with timeout:
```typescript
const result = await Promise.race([
  llmGenerator.extractIntent(input),
  timeout(30000) // 30 seconds
]);
```

On timeout:
- Mark step as `'failed'`
- Store error: `"Step timed out after 30 seconds"`
- Allow retry via UI

**Frontend Real-Time Updates:**

```typescript
// client/src/tickets/components/GenerationProgress.tsx
useEffect(() => {
  const unsubscribe = firestore
    .collection(`workspaces/${workspaceId}/aecs`)
    .doc(aecId)
    .onSnapshot((snapshot) => {
      const data = snapshot.data();
      setGenerationState(data?.generationState);
    });
  return unsubscribe;
}, [aecId]);
```

---

## Non-Functional Requirements

### Performance

**Generation Latency:**
- **Target:** Total generation completes in <60 seconds (UX North Star)
- **Per-Step Target:** <10 seconds typical, 30 seconds max (timeout)
- **Measurement:** Log timestamps for each step start/complete

**Step Breakdown (Expected):**
| Step | Operation | Expected Time | Notes |
|------|-----------|---------------|-------|
| 1 | Intent extraction | 2-5s | LLM call, simple prompt |
| 2 | Type detection | 1-3s | LLM call, classification |
| 3 | Repo query | <1s | Stub in Epic 2 |
| 4 | API snapshot | <1s | Stub in Epic 2 |
| 5 | Drafting | 5-10s | LLM call, complex output |
| 6 | Validation | <1s | Stub in Epic 2 |
| 7 | Question prep | 3-5s | LLM call, conditional |
| 8 | Estimation | <1s | Stub in Epic 2 |
| **Total** | | **13-27s** | Well under 60s target |

**Firestore Operations:**
- Writes per generation: 8 updates (1 per step) + 1 final
- Read latency: <100ms (same region)
- Listener latency: ~200-500ms for UI updates

**Frontend Performance:**
- Initial page load: <1s (SSR)
- Form interaction: <100ms response time
- Firestore listener updates: <500ms from backend write

### Security

**Authentication:**
- All API endpoints protected by `FirebaseAuthGuard`
- Token validation on every request via Firebase Admin SDK
- Tokens expire after 1 hour (Firebase default)

**Authorization:**
- `WorkspaceGuard` extracts `workspaceId` from token claims
- All queries scoped to workspace: `WHERE workspaceId = :workspaceId`
- Users can only access tickets in their workspace

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId}/aecs/{aecId} {
      allow read, write: if request.auth != null
        && request.auth.token.workspaceId == workspaceId;
    }
  }
}
```

**Input Validation:**
- **Controller Layer:** Zod schema validation via `ZodValidationPipe`
- **Use Case Layer:** Business rule validation (title length, array limits)
- **Domain Layer:** Invariant validation (state transitions)

**Secrets Management:**
- Development: `.env` files (not committed to git)
- Production: Google Secret Manager
- Firebase Admin SDK credentials: Service account JSON (encrypted)

### Reliability/Availability

**Error Handling:**
- Each generation step wrapped in try-catch
- Step failures don't crash entire generation
- User can retry individual failed steps

**Retry Strategy:**
- LLM calls: Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- Firestore writes: Retry once on transient failures
- Frontend API calls: Retry once after 1 second

**State Persistence:**
- Generation progress persisted after each step
- User can navigate away and return (progress preserved)
- Page refresh doesn't lose generation state

**Graceful Degradation:**
- If LLM step fails, user sees error message and retry button
- If Firestore listener disconnects, UI shows "Reconnecting..." message
- Backend continues processing even if frontend disconnects

**SLA Targets:**
- API availability: 99.9% uptime
- Firestore availability: 99.99% (Firebase SLA)
- Generation success rate: >95%

### Observability

**Structured Logging (Pino):**

```typescript
logger.info({
  requestId: req.id,
  aecId: aec.id,
  workspaceId: aec.workspaceId,
  step: stepId,
  status: 'complete',
  duration: Date.now() - startTime,
  message: 'Generation step completed'
});
```

**Correlation IDs:**
- `requestId`: Generated per HTTP request (UUID)
- `aecId`: Domain entity ID (tracks ticket lifecycle)
- `workspaceId`: Tenant ID (for multi-tenant debugging)

**Log Levels:**
- `info`: Step start/complete, API calls
- `warn`: Retries, slow operations (>5s)
- `error`: Step failures, exceptions
- `debug`: LLM prompts/responses (dev only)

**Metrics to Track:**
- Generation success rate (% completed without failures)
- Average generation time per step
- 95th/99th percentile latencies
- Error rate by step
- Retry rate by step

**Monitoring Alerts:**
- Error rate > 5%: Slack notification
- Average generation time > 60s: Slack notification
- Step timeout rate > 10%: Investigation needed

---

## Dependencies and Integrations

### Frontend Dependencies

**Core Libraries:**
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.x | React framework, App Router |
| `react` | 19.x | UI library |
| `zustand` | 4.x | State management |
| `firebase` | 10.x | Client SDK (Auth, Firestore) |
| `axios` | 1.x | HTTP client for REST API |

**UI Components (from Epic 1):**
| Component | Source | Usage in Epic 2 |
|-----------|--------|-----------------|
| `Button` | shadcn/ui | Create form, retry buttons |
| `Input` | shadcn/ui | Title field |
| `Textarea` | shadcn/ui | Description field |
| `Badge` | shadcn/ui | Readiness score badge |
| `Accordion` | shadcn/ui | Step details expansion |
| `Card` | shadcn/ui | Ticket detail sections |

**Design Tokens (from Epic 1):**
- CSS variables in `globals.css`
- Color palette: neutral grays, semantic colors (green/amber/red)
- Typography: system fonts, Linear-inspired sizing
- Spacing: 8px grid
- Border radius: subtle (4-8px)

### Backend Dependencies

**Core Libraries:**
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/common` | 10.x | NestJS framework |
| `@nestjs/config` | 3.x | Environment config |
| `firebase-admin` | 12.x | Server-side Firebase SDK |
| `pino` | 8.x | Structured logging |
| `zod` | 3.x | Schema validation |

**AI/LLM:**
| Package | Version | Purpose |
|---------|---------|---------|
| `mastra` | latest | LLM orchestration, structured outputs |
| `openai` | 4.x | LLM provider (via Mastra) |

**Utilities:**
| Package | Version | Purpose |
|---------|---------|---------|
| `uuid` | 9.x | Generate AEC IDs |
| `date-fns` | 2.x | Date manipulation |

### Shared Types Package

**Package:** `@repo/shared-types`
**Location:** `/packages/shared-types/src/`

**Exports:**
```typescript
// schemas/ - Zod schemas for validation
export { CreateTicketSchema, UpdateTicketSchema } from './schemas';

// dto/ - Request/response DTOs
export { CreateTicketDto, UpdateTicketDto, AECDto } from './dto';

// types/ - Inferred TypeScript types
export type { AEC, Question, Estimate, GenerationState } from './types';
```

**Usage:**
- Frontend: Import DTOs for API calls
- Backend: Import schemas for validation
- Shared types ensure full-stack type safety

### External Integrations

**None in Epic 2.**

Epic 2 is self-contained. External integrations arrive in:
- **Epic 4:** GitHub App (repo indexing)
- **Epic 5:** Jira/Linear (export)

---

## Acceptance Criteria (Authoritative)

### Story 2.1: Ticket Creation UI - Minimal Input Form

**AC-2.1.1:** Form displays with title field, description field, "Generate Ticket" button, and "Cancel" button when user clicks "New Ticket" on tickets list page.

**AC-2.1.2:** "Generate Ticket" button is disabled when title is empty or <3 characters, enabled when title ≥3 characters.

**AC-2.1.3:** When user clicks "Generate Ticket", form calls `ticketStore.createTicket(title, description)` and navigates to generation progress view.

**AC-2.1.4:** When user clicks "Cancel", form closes and returns to tickets list page.

**AC-2.1.5:** Form follows Linear minimalism: no borders/containers, clean inputs, generous whitespace, subtle focus states.

**AC-2.1.6:** Backend receives POST `/tickets` with title and description, creates draft AEC, returns AEC ID with status 201.

### Story 2.2: Generation Progress - Transparent 8-Step UI

**AC-2.2.1:** UI displays 8 steps vertically with step number, title, status indicator, expandable details section (collapsed by default), and retry button (if failed).

**AC-2.2.2:** 8 steps shown are: (1) Intent extraction, (2) Type detection, (3) Repo index query, (4) API snapshot resolution, (5) Ticket drafting, (6) Validation, (7) Question prep, (8) Estimation.

**AC-2.2.3:** As each step completes, step status changes from pending → in-progress → complete, details section populates with human-readable summary, and next step automatically starts.

**AC-2.2.4:** When all steps complete, UI transitions to ticket detail view with readiness badge, and AEC status updates to 'validated' in Firestore.

**AC-2.2.5:** If any step fails, step shows error status, error message displayed in expandable details, retry button appears, and user can retry individual step or cancel.

**AC-2.2.6:** Progress persists in Firestore: if user navigates away and returns, they see current generation progress state.

**AC-2.2.7:** Each step completes in <10 seconds typically, timeout after 30 seconds triggers [failed] state with retry option, total generation target <60 seconds, and timeout errors are user-friendly.

**AC-2.2.8:** Backend `GenerationOrchestrator` executes 8 steps sequentially, updating `generationState` in Firestore after each step completes.

### Story 2.3: AEC Domain Model - Schema and Persistence

**AC-2.3.1:** AEC domain entity exists with all specified fields: id, workspaceId, title, description, type, status, readinessScore, generationState, acceptanceCriteria, assumptions, repoPaths, codeSnapshot, apiSnapshot, questions, estimate, validationResults, createdAt, updatedAt.

**AC-2.3.2:** Domain validation rules enforced: title 3-500 chars, status transitions validated (draft → validated → ready → created), readinessScore 0-100 only, max 3 questions, snapshots mandatory when status = 'ready'.

**AC-2.3.3:** AECRepository interface defined with methods: save(aec), findById(id), findByWorkspace(workspaceId), update(aec).

**AC-2.3.4:** FirestoreAECRepository implements repository interface, maps domain AEC ↔ Firestore document, uses subcollection `/workspaces/{workspaceId}/aecs/{aecId}`, and handles timestamps/serialization.

**AC-2.3.5:** AEC is the write source: UI never writes directly to Firestore, all mutations go through use cases → domain → repository, and UI subscribes to AEC changes via Firestore listeners.

### Story 2.4: Ticket Detail View - AEC Rendering

**AC-2.4.1:** UI displays header with title and readiness badge (Green ≥75 / Amber 50-74 / Red <50).

**AC-2.4.2:** UI displays sections: Acceptance Criteria (numbered list, editable inline), Assumptions (bulleted list, editable inline), Affected Code (list of repo paths), Estimate (effort range, confidence, drivers if available), Questions (max 3, with chip options if readiness < 75), and Footer (Export button, disabled until Epic 5).

**AC-2.4.3:** All sections use full-width layout with generous vertical spacing, section headers (14-16px) with subtle dividers, and body text (13-14px) for content.

**AC-2.4.4:** Readiness badge shows: Green "Ready 85" if score ≥75, Amber "Needs Input 62" if 50-74, Red "Blocked 32" if <50.

**AC-2.4.5:** When user edits acceptance criteria or assumptions, changes are debounced (500ms), backend use case updates AEC, readiness score recalculated, and badge updates live.

**AC-2.4.6:** UI follows Linear minimalism: no cards inside cards (flat surfaces), left-aligned text with max 840px width, and whitespace over dividers.

---

## Traceability Mapping

| AC ID | Component(s) | Test Ideas |
|-------|-------------|------------|
| **AC-2.1.1** | `CreateTicketForm.tsx` | Unit: Render form elements. E2E: Click "New Ticket", verify form appears. |
| **AC-2.1.2** | `CreateTicketForm.tsx` | Unit: Test button disabled state based on title length. |
| **AC-2.1.3** | `CreateTicketForm.tsx`, `tickets.store.ts`, `TicketsController` | Integration: Mock store, verify `createTicket` called. E2E: Submit form, verify navigation. |
| **AC-2.1.4** | `CreateTicketForm.tsx` | Unit: Test cancel button handler. E2E: Click cancel, verify return to list. |
| **AC-2.1.5** | `CreateTicketForm.tsx`, `globals.css` | Visual: Screenshot comparison. Manual: Verify design tokens applied. |
| **AC-2.1.6** | `TicketsController`, `CreateTicketUseCase`, `AEC.createDraft()` | Integration: POST /tickets with valid payload, verify 201 response and AEC created. |
| **AC-2.2.1** | `GenerationProgress.tsx` | Unit: Render 8 steps with correct props. E2E: Verify step UI elements present. |
| **AC-2.2.2** | `GenerationProgress.tsx`, `GenerationState.initial()` | Unit: Verify step titles match spec. |
| **AC-2.2.3** | `GenerationProgress.tsx`, Firestore listener | E2E: Mock Firestore updates, verify status changes and auto-advance. |
| **AC-2.2.4** | `GenerationProgress.tsx`, navigation | E2E: Complete all steps, verify transition to detail view. |
| **AC-2.2.5** | `GenerationProgress.tsx`, retry handler | Unit: Test retry button appears on failure. Integration: Mock failed step, verify retry calls use case. |
| **AC-2.2.6** | Firestore persistence, `GenerationOrchestrator` | E2E: Start generation, refresh page, verify progress restored. |
| **AC-2.2.7** | `GenerationOrchestrator`, LLM timeout wrapper | Integration: Mock LLM timeout, verify 30s timeout triggers failure. Performance: Time each step in staging. |
| **AC-2.2.8** | `GenerationOrchestrator`, `FirestoreAECRepository` | Integration: Mock each step, verify Firestore writes after each. |
| **AC-2.3.1** | `AEC.ts` entity | Unit: Instantiate AEC, verify all fields present and typed. |
| **AC-2.3.2** | `AEC.ts` validation methods | Unit: Test validation rules (title length, state transitions, score bounds). |
| **AC-2.3.3** | `AECRepository.ts` interface | Type check: Verify interface methods defined. |
| **AC-2.3.4** | `FirestoreAECRepository.ts`, `AECMapper.ts` | Integration: Save/find AEC, verify Firestore document structure. Unit: Test mapper bidirectional conversion. |
| **AC-2.3.5** | Architecture enforcement | Code review: Verify UI components don't import Firestore directly. |
| **AC-2.4.1** | `TicketDetail.tsx`, readiness badge logic | Unit: Test badge rendering based on score. |
| **AC-2.4.2** | `TicketDetail.tsx`, `InlineEditableList.tsx` | Unit: Render each section. Integration: Mock AEC data, verify all sections display. |
| **AC-2.4.3** | `TicketDetail.tsx`, CSS | Visual: Screenshot comparison. Manual: Verify spacing and typography. |
| **AC-2.4.4** | `TicketDetail.tsx`, badge component | Unit: Test badge text/color for each score range. |
| **AC-2.4.5** | `TicketDetail.tsx`, `UpdateAECUseCase`, debounce logic | Integration: Edit criteria, verify debounced API call. E2E: Edit and verify badge updates. |
| **AC-2.4.6** | `TicketDetail.tsx`, `globals.css` | Visual: Screenshot comparison. Manual: Verify Linear minimalism principles. |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Mastra LLM latency exceeds 60s target** | High (poor UX) | Medium | Parallel agent calls where possible (intent + type), use faster models (gpt-4o-mini), implement aggressive timeouts (30s per step) |
| **Firebase listener connection drops during generation** | Medium (stale UI) | Low | Auto-reconnect via Firebase SDK, show "Reconnecting..." banner, persist progress server-side |
| **Generation step failure rate >5%** | High (user frustration) | Medium | Retry logic with exponential backoff, clear error messages, individual step retry buttons |
| **Domain entity state machine too rigid** | Medium (dev friction) | Low | Add `forceTransition()` method for admin/debugging (not exposed to UI) |
| **Firestore write costs for 8 updates per ticket** | Low (cost) | High | Acceptable for MVP (<10k tickets/month = ~$1-2/month), optimize in Epic 3 (batch writes) |

### Assumptions

| Assumption | Validation Plan |
|------------|-----------------|
| Users will accept 60-second generation time | Monitor analytics for abandonment rate, gather user feedback in beta |
| Firestore listeners provide acceptable latency (<500ms) | Performance testing in staging with production Firebase project |
| Stub validation/estimation (Epic 2) won't confuse users | Add "Coming soon" badges to stub features, clear in-app messaging |
| LLM content generation (4 steps) produces acceptable quality | Human review of 100 generated tickets in staging, iterate prompts |
| Domain entity approach (vs anemic DTOs) is worth complexity | Code review after Story 2.3, validate testability and maintainability |

### Open Questions

| Question | Answer By | Decision Impact |
|----------|-----------|-----------------|
| Should generation progress be cancellable mid-flow? | Story 2.2 implementation | Adds complexity (cleanup, partial state) vs user control |
| Should failed steps auto-retry or require manual retry? | UX testing | Tradeoff: convenience vs user awareness of failures |
| Max concurrent generations per user? | Story 2.1 implementation | Rate limiting needed to prevent abuse/cost overruns |
| Should AEC updates (inline edits) trigger re-generation? | Story 2.4 implementation | Epic 3 feature or manual "Regenerate" button? |
| Store generation step details in Firestore or just final result? | Story 2.3 implementation | Tradeoff: debugging visibility vs Firestore write costs |

---

## Test Strategy Summary

### Unit Tests (Jest)

**Domain Layer:**
- `AEC.ts`: Test factory methods, state transitions, validation rules, getters
- `GenerationState.ts`: Test initial state, step updates
- `Question.ts`, `Estimate.ts`: Test value object validation

**Application Layer:**
- `CreateTicketUseCase.ts`: Mock repository, verify AEC creation flow
- `UpdateAECUseCase.ts`: Mock repository, verify update logic
- `GenerationOrchestrator.ts`: Mock LLM generator and repository, test each step in isolation

**Infrastructure Layer:**
- `AECMapper.ts`: Test bidirectional mapping (domain ↔ Firestore)
- `FirestoreAECRepository.ts`: Use Firestore emulator, test CRUD operations

**Frontend Components:**
- `CreateTicketForm.tsx`: Test form validation, button states, submit handler
- `GenerationProgress.tsx`: Test step rendering, status changes, retry button
- `TicketDetail.tsx`: Test section rendering, inline editing, badge display
- `InlineEditableList.tsx`: Test add/edit/delete items

**Coverage Target:** 80% for domain/application layers, 60% for infrastructure/UI

### Integration Tests (Jest + Firestore Emulator)

**Backend API:**
- POST `/tickets`: Create ticket, verify 201 response and Firestore document created
- GET `/tickets/:id`: Fetch ticket, verify correct data returned
- PATCH `/tickets/:id`: Update ticket, verify changes persisted to Firestore

**Generation Flow:**
- Full 8-step generation with mocked LLM (fast responses)
- Verify Firestore updates after each step
- Test step failure and retry logic

**Repository + Mapper:**
- Save AEC → Verify Firestore document structure
- Find AEC → Verify domain entity reconstructed correctly
- Update AEC → Verify changes persisted

### End-to-End Tests (Playwright)

**Critical Paths:**
1. **Happy Path:** Create ticket → Watch progress → View detail → Edit criteria → Verify badge updates
2. **Step Failure:** Create ticket → Simulate step 5 failure → Retry step → Complete generation
3. **Navigation Persistence:** Create ticket → Navigate away during generation → Return → Verify progress restored

**Scenarios:**
- User creates ticket with title only (no description)
- User creates ticket with title + long description (500 chars)
- User cancels ticket creation form
- All 8 steps complete successfully (<60s)
- Step times out (30s), user retries successfully
- User edits acceptance criteria, sees readiness score update

**Test Environment:**
- Staging Firebase project
- Mocked LLM responses (via MSW or test Mastra config)
- Real Firestore + Auth

### Performance Tests

**Load Testing:**
- 10 concurrent ticket creations → Measure generation time distribution
- 100 concurrent Firestore listeners → Verify no degradation

**Latency Benchmarks:**
- Each generation step: Measure p50, p95, p99 latencies
- Firestore write latency: <100ms (same region)
- Firestore listener latency: <500ms

**Tools:** Artillery (load testing), Lighthouse (frontend), Firestore performance monitoring

### Manual Testing

**UX Validation:**
- Design tokens applied correctly (colors, spacing, typography)
- Linear minimalism principles followed (no extra containers)
- Real-time updates feel responsive (<500ms perceived latency)
- Error messages are user-friendly (no stack traces)

**Cross-Browser:**
- Chrome, Firefox, Safari (latest versions)
- Mobile: iOS Safari, Chrome Android

---

## Implementation Notes

### Story Execution Order

**Recommended Sequence:**
1. **Story 2.3** (AEC domain model) - Foundation for all other stories
2. **Story 2.1** (ticket creation form) - Basic UI + API endpoint
3. **Story 2.2** (generation progress) - Orchestrator + real-time updates
4. **Story 2.4** (ticket detail view) - Final rendering + inline editing

**Rationale:** Domain-first approach ensures business logic is correct before building UI.

### Development Environment Setup

**Backend:**
1. Install dependencies: `pnpm install` (from monorepo root)
2. Start Firestore emulator: `firebase emulators:start --only firestore`
3. Configure `.env`: Firebase Admin SDK credentials, OpenAI API key
4. Start NestJS dev server: `pnpm --filter backend dev`

**Frontend:**
1. Configure `.env.local`: Firebase client config, API URL
2. Start Next.js dev server: `pnpm --filter client dev`
3. Open `http://localhost:3001`

**Testing:**
1. Run unit tests: `pnpm test`
2. Run E2E tests: `pnpm test:e2e` (requires backend + emulator running)

### Architecture Compliance Checklist

**Before merging any story:**
- [ ] Domain layer has no framework imports (no NestJS, no Firebase)
- [ ] All mutations go through use cases (no direct repository calls from controllers)
- [ ] UI components have no business logic (only rendering + event handlers)
- [ ] Firestore writes go through repository pattern
- [ ] LLM calls go through `ILLMContentGenerator` interface
- [ ] All DTOs validated with Zod schemas
- [ ] Errors thrown as domain exceptions (not HTTP exceptions)
- [ ] Logging includes correlation IDs (requestId, aecId, workspaceId)

---

## Related Documents

- **PRD:** `/Users/Idana/Documents/GitHub/forge/docs/Executable_Tickets_PRD_FULL.md`
- **Architecture:** `/Users/Idana/Documents/GitHub/forge/docs/architecture.md`
- **Epics:** `/Users/Idana/Documents/GitHub/forge/docs/epics.md`
- **CLAUDE.md:** `/Users/Idana/Documents/GitHub/forge/CLAUDE.md` (project rules)
- **Epic 1 (Foundation):** Design system, shadcn/ui components, design tokens (completed)
- **Epic 3 (Validation):** Validation engine, question generation (next)
- **Epic 4 (Code Intelligence):** GitHub indexing, API sync, estimation (next)
- **Epic 5 (Export):** Jira/Linear integrations (future)

---

**Document Status:** Draft - Ready for technical review and story breakdown

**Next Steps:**
1. Technical review by architect and senior engineers
2. Create individual story markdown files in `/docs/sprint-artifacts/stories/`
3. Begin Story 2.3 (AEC domain model) implementation
4. Set up CI/CD pipeline for automated testing

---

*Generated with comprehensive synthesis from PRD, Architecture, and Epic documents*
*Following BMad Method technical specification template*
*Date: 2026-01-31*

---

## Story 2.5: Advanced Context Input (Enhancement)

**Added:** 2026-01-31 (Post Epic 2 core completion)

### Purpose
Enhance ticket creation with repository selection and rich context input (Slack conversations, meeting notes, file attachments).

### Acceptance Criteria

1. **Repository Selector**
   - Dropdown showing all connected/indexed repositories
   - Default repository from workspace settings
   - Optional (can leave blank for auto-detect)

2. **Rich Context Input**
   - Larger textarea (10+ rows) or rich text editor
   - Placeholder: "Paste Slack conversations, meeting notes, Jira links..."
   - Support for markdown formatting
   - Character limit: 10,000

3. **Context Source Tracking**
   - Track where context came from (manual, slack-paste, jira-link)
   - Store in AEC for audit trail

4. **File Attachments (Optional)**
   - Upload screenshots, diagrams, mockups
   - Store in Firebase Storage
   - Reference URLs in AEC

### Implementation Notes

- Requires Settings → Repositories (configure connected repos)
- Repository field added to CreateTicketDto and AEC entity
- contextSource field added to AEC
- Larger description field in UI
- File upload integration with Firebase Storage

### Dependencies

- Epic 4 Stories 4.1-4.2 (GitHub integration and repo indexing) for full repo dropdown
- For v1: Can implement with manual text input for repo name

### Deferred Until

- After Stories 2.1-2.4 complete (Epic 2 core)
- Before Epic 3 or in parallel with Epic 3

