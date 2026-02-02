# Architecture: Executable Tickets

## Executive Summary

Executable Tickets is a full-stack TypeScript application that transforms minimal product intent into validated, code-aware, execution-ready tickets. The architecture follows **Clean Architecture principles** with **feature-based modules** containing internal presentation/application/domain/infrastructure layers.

The system uses **Next.js 15** (client) and **NestJS 10** (backend) in a **Turborepo monorepo**, with **Firebase** for auth/storage/real-time updates, **Mastra** for LLM-powered content generation (4 specific steps only), and **REST APIs** for all deterministic operations.

**Key Architectural Principle:** Mastra handles LLM content generation (intent extraction, type detection, drafting, question generation) with predictable JSON schemas. Everything else (validation, estimation, indexing, export) uses deterministic REST APIs and domain services.

---

## Project Initialization

### Monorepo Setup

**Create Turborepo monorepo:**
```bash
npx create-turbo@latest executable-tickets
cd executable-tickets
```

**Add Next.js client:**
```bash
cd apps
npx create-next-app@latest client --typescript --tailwind --app --turbopack --no-src-dir
```

**Add NestJS backend:**
```bash
npx @nestjs/cli new backend
```

**Install dependencies:**
```bash
cd ..
pnpm install
```

### Provided by Starters

**Next.js Setup Provides:**
- TypeScript ✓
- App Router ✓
- Tailwind CSS (will replace with shadcn/ui) ✓
- ESLint + Prettier ✓
- Turbopack bundler ✓
- Import alias `@/*` ✓

**NestJS Setup Provides:**
- TypeScript ✓
- Jest testing ✓
- ESLint + Prettier ✓
- Basic folder structure (will refactor to Clean Architecture) ✓

### Manual Setup Required (First Implementation Story)

**Story 1.1 will establish:**
- Clean Architecture folder structure in NestJS
- shadcn/ui in Next.js client
- Firebase SDK integration (Auth, Firestore, Storage)
- Mastra agents setup
- Zustand store structure
- Design tokens (Linear minimalism)
- Shared types package
- Bull queue + Redis for background jobs

---

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| **Project Structure** | Feature-based modules with internal layers | - | All | Self-contained modules, easier navigation, natural feature boundaries |
| **Mastra Integration** | Infrastructure layer with port/adapter | latest | Epic 2, 3 | External dependency behind interface, swappable, testable |
| **Firebase Pattern** | Generic repository base class | latest | All | DRY principle, consistent error handling, easier telemetry |
| **Code Sharing** | Shared types package (`@repo/shared-types`) | - | All | Single source of truth, full-stack type safety |
| **Real-time Updates** | Firestore listeners (direct) | latest | Epic 2, 3, 4 | Already using Firebase, no extra infra, auto-reconnection |
| **State Management** | Zustand with service injection | 4.x | Frontend (All) | Business logic in store actions, lazy services |
| **API Format** | Direct response (no envelope) | - | All | RESTful convention, smaller payloads, standard NestJS errors |
| **Error Handling** | Custom exception filter (domain → HTTP) | - | All | Domain stays framework-agnostic, centralized mapping |
| **Validation** | Layered (Controller + Use Case + Domain) | - | All | Defense in depth, each layer validates its concerns |
| **Authentication** | Firebase Auth Guard + Request Context | latest | All | Token validation + workspace isolation, secure multi-tenancy |
| **Background Jobs** | NestJS Bull Queue (Redis-backed) | latest | Epic 4 | Scalable, built-in retries, better observability |
| **File Upload** | Direct frontend → Firebase Storage | latest | All | Faster, cheaper, Security Rules for isolation |
| **OpenAPI** | Auto-generate with @nestjs/swagger | latest | All (Dev) | Type-safe client, contract testing, Swagger UI |
| **Logging** | Pino with correlation IDs | latest | All | Structured logging, requestId/aecId/workspaceId tracking |
| **Testing** | Test pyramid (lots unit, some integration, few e2e) | - | All | Standard best practice, fast feedback |
| **CI/CD** | Vercel (Next.js) + Cloud Run (NestJS) + GitHub Actions | - | All | Optimized deployments, serverless scale |
| **Environment** | Per-app .env + Secret Manager | - | All | Separation of concerns, production secrets secure |
| **Error Convention** | Throw exceptions (caught by filter) | - | All | Simpler with NestJS filters, cleaner code |
| **Date Handling** | Date objects in domain, ISO at boundaries | - | All | Type safety internally, standard serialization |
| **API Versioning** | No versioning (pre-v1) | - | All | Breaking changes allowed before public release |

---

## Project Structure

```
executable-tickets/
├── apps/
│   ├── client/                          # Next.js 15 App Router
│   │   ├── src/
│   │   │   ├── app/                     # App Router pages
│   │   │   │   ├── (auth)/             # Auth layout group
│   │   │   │   │   └── login/
│   │   │   │   ├── tickets/            # Main app
│   │   │   │   │   ├── page.tsx        # List view
│   │   │   │   │   ├── [id]/           # Detail view
│   │   │   │   │   └── create/         # Create flow
│   │   │   │   ├── settings/
│   │   │   │   └── layout.tsx
│   │   │   ├── core/
│   │   │   │   └── components/
│   │   │   │       └── ui/             # shadcn/ui components
│   │   │   ├── tickets/
│   │   │   │   └── components/         # Feature components
│   │   │   │       ├── CreateTicketForm.tsx
│   │   │   │       ├── GenerationProgress.tsx
│   │   │   │       ├── TicketDetail.tsx
│   │   │   │       └── ValidationResults.tsx
│   │   │   ├── stores/                 # Zustand stores
│   │   │   │   ├── tickets.store.ts
│   │   │   │   ├── auth.store.ts
│   │   │   │   └── settings.store.ts
│   │   │   ├── services/               # API clients
│   │   │   │   ├── index.ts            # useServices() hook
│   │   │   │   ├── ticket.service.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── storage.service.ts
│   │   │   │   └── api-client.ts
│   │   │   ├── hooks/                  # React hooks
│   │   │   │   └── useTicketGeneration.ts
│   │   │   └── lib/
│   │   │       ├── firebase.ts         # Firebase config
│   │   │       └── utils.ts
│   │   ├── public/
│   │   ├── .env.local
│   │   └── package.json
│   │
│   └── backend/                         # NestJS 10
│       ├── src/
│       │   ├── tickets/                 # Feature module
│       │   │   ├── presentation/
│       │   │   │   ├── tickets.controller.ts
│       │   │   │   └── dto/
│       │   │   ├── application/
│       │   │   │   ├── use-cases/
│       │   │   │   │   ├── CreateTicketUseCase.ts
│       │   │   │   │   ├── ValidateTicketUseCase.ts
│       │   │   │   │   └── ExportTicketUseCase.ts
│       │   │   │   └── services/
│       │   │   │       ├── ValidationEngine.ts
│       │   │   │       └── EstimationEngine.ts
│       │   │   ├── domain/
│       │   │   │   ├── aec/
│       │   │   │   │   ├── AEC.ts         # Entity
│       │   │   │   │   └── AECRepository.ts  # Interface
│       │   │   │   ├── validation/
│       │   │   │   │   └── validators/
│       │   │   │   └── exceptions/
│       │   │   └── infrastructure/
│       │   │       └── persistence/
│       │   │           ├── FirestoreAECRepository.ts
│       │   │           └── mappers/
│       │   │
│       │   ├── indexing/                # Feature module
│       │   │   ├── presentation/
│       │   │   ├── application/
│       │   │   │   ├── RepoIndexerService.ts
│       │   │   │   └── ApiSpecResolver.ts
│       │   │   ├── domain/
│       │   │   └── infrastructure/
│       │   │       └── github/
│       │   │
│       │   ├── integrations/            # Feature module
│       │   │   ├── presentation/
│       │   │   │   ├── jira.controller.ts
│       │   │   │   └── linear.controller.ts
│       │   │   ├── application/
│       │   │   │   ├── ExportToJiraUseCase.ts
│       │   │   │   └── ExportTemplateBuilder.ts
│       │   │   └── infrastructure/
│       │   │       ├── jira/
│       │   │       └── linear/
│       │   │
│       │   └── shared/                  # Shared across features
│       │       ├── domain/
│       │       ├── application/
│       │       │   └── ports/
│       │       │       └── ILLMContentGenerator.ts
│       │       ├── infrastructure/
│       │       │   ├── firebase/
│       │       │   ├── persistence/
│       │       │   │   ├── FirestoreRepository.ts
│       │       │   │   └── mappers/
│       │       │   ├── mastra/
│       │       │   │   ├── MastraContentGenerator.ts
│       │       │   │   └── agents/
│       │       │   └── queues/
│       │       │       └── processors/
│       │       └── presentation/
│       │           ├── filters/
│       │           ├── guards/
│       │           ├── decorators/
│       │           └── pipes/
│       ├── .env
│       └── package.json
│
├── packages/
│   ├── shared-types/                   # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── schemas/                # Zod schemas
│   │   │   ├── dto/                    # Request/response DTOs
│   │   │   └── types/                  # Inferred types
│   │   └── package.json
│   ├── eslint-config/
│   └── typescript-config/
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Epic to Architecture Mapping

| Epic | Primary Module | Key Components | Technical Notes |
|------|----------------|----------------|-----------------|
| **Epic 1: Foundation** | All | Project setup, monorepo config, design system | Story 1.1: Use official starters + manual Clean Architecture. Story 1.2: shadcn/ui + design tokens |
| **Epic 2: Ticket Creation & AEC Engine** | `tickets/` | CreateTicketUseCase, AEC entity (domain), MastraContentGenerator (infrastructure), FirestoreAECRepository | AEC is core domain entity with state machine. Mastra handles intent extraction, type detection, drafting. REST API orchestrates 8 steps. |
| **Epic 3: Clarification & Validation** | `tickets/application/services/` | ValidationEngine (deterministic scoring), QuestionGenerator (Mastra-powered), ValidationResults UI | Validation is deterministic (no LLM). Question generation uses Mastra agent. Max 3 questions enforced. |
| **Epic 4: Code Intelligence & Estimation** | `indexing/` | RepoIndexerService, ApiSpecResolver, EstimationEngine, DriftDetector, GitHubWebhookHandler, Bull queues | GitHub webhooks → Bull queue → background indexing. Drift detection compares snapshots. Estimation is deterministic. |
| **Epic 5: Export & Integrations** | `integrations/` | ExportToJiraUseCase, ExportToLinearUseCase, JiraAdapter, LinearAdapter, ExportTemplateBuilder | OAuth flows for Jira/Linear. Adapters implement common export interface. Template builder generates markdown appendices. |

---

## Technology Stack Details

### Core Technologies

| Technology | Version | Purpose | Configuration |
|------------|---------|---------|---------------|
| **Next.js** | 15 | Frontend framework | App Router, TypeScript, Turbopack |
| **React** | 19 | UI library | Server components + client components |
| **NestJS** | 10 | Backend framework | REST API, Clean Architecture, TypeScript |
| **TypeScript** | 5.x | Type safety | Strict mode, shared types via monorepo package |
| **Turborepo** | latest | Monorepo build system | Caches builds, parallel execution |
| **pnpm** | latest | Package manager | Workspace support, fast installs |

### State & Data

| Technology | Version | Purpose | Configuration |
|------------|---------|---------|---------------|
| **Zustand** | 4.x | Frontend state management | Feature stores with service injection via `useServices()` |
| **Firebase Auth** | latest | Authentication | Token-based auth, workspace isolation |
| **Firestore** | latest | Database | NoSQL document store, real-time listeners |
| **Firebase Storage** | latest | File storage | Direct frontend uploads, Security Rules |
| **Bull** | latest | Background job queue | Redis-backed, retry logic, rate limiting |
| **Redis** | latest | Queue backend | Used by Bull for job persistence |

### AI & Content Generation

| Technology | Version | Purpose | Configuration |
|------------|---------|---------|---------------|
| **Mastra** | latest | AI agent orchestration | LLM content generation (4 steps only): intent extraction, type detection, drafting, question generation |
| **OpenAI** | via Mastra | LLM provider | Abstracted via Mastra (supports 40+ providers) |
| **Zod** | latest | Schema validation | Structured outputs from Mastra agents, DTO validation |

### Developer Tools

| Technology | Version | Purpose | Configuration |
|------------|---------|---------|---------------|
| **shadcn/ui** | latest | UI component library | Built on Radix UI + Tailwind, Linear-inspired minimalism |
| **Tailwind CSS** | 3.x | Utility CSS | Design tokens in `globals.css` |
| **ESLint** | latest | Linting | Shared config in monorepo |
| **Prettier** | latest | Code formatting | Shared config in monorepo |
| **Jest** | latest | Testing framework | Unit + integration tests |
| **@nestjs/swagger** | latest | API documentation | Auto-generated OpenAPI spec, Swagger UI at `/api/docs` |

---

### Integration Points

**Frontend ↔ Backend:**
- Protocol: REST API over HTTP/HTTPS
- Authentication: Firebase Auth Bearer token
- Request format: JSON with Zod-validated DTOs
- Response format: Direct JSON (no envelope), HTTP status codes for errors
- Shared types: `@repo/shared-types` package

**Frontend ↔ Firebase:**
- Firestore: Real-time listeners for AEC generation state
- Storage: Direct uploads via Firebase SDK
- Auth: Firebase Auth SDK for login/logout/session management
- Security Rules: Enforce workspace isolation

**Backend ↔ Firebase:**
- Firestore: Via repository pattern (FirestoreRepository base class)
- Admin SDK: Server-side access with service account
- Auth: Token verification via Firebase Admin SDK
- Storage: Metadata storage (URLs) after frontend uploads

**Backend ↔ Mastra:**
- Interface: `ILLMContentGenerator` port in application layer
- Implementation: `MastraContentGenerator` in infrastructure
- 4 agents: intent extraction, type detection, drafting, question generation
- All agents use structured output (Zod schemas)

**Backend ↔ External APIs:**
- GitHub: OAuth + REST API via `@octokit/rest`, webhooks for push events
- Jira: OAuth 2.0 + REST API via `jira-client` or direct HTTP
- Linear: OAuth 2.0 + GraphQL API via `@linear/sdk`
- OpenAPI: Parsing via `@apidevtools/swagger-parser`

**Background Jobs:**
- Producer: Webhook handlers, controllers
- Queue: Bull (Redis-backed)
- Consumer: Processor classes (IndexProcessor, DriftProcessor)
- Patterns: Retry on failure, rate limiting, idempotency

---

## Novel Pattern: Agent Executable Contract (AEC)

### Purpose

The AEC is the core innovation of Executable Tickets. It's not a standard "ticket" - it's a **versioned, snapshot-locked, machine-verifiable contract** that binds:
- Product intent
- Code reality (commit SHA)
- API contracts (OpenAPI hash)
- Validation rules (deterministic scoring)
- QA verification steps
- Effort estimation

### Design Challenge

**Requirements:**
1. **Versioned** - Track changes over time
2. **Snapshot-aware** - Lock to specific code/API versions
3. **State machine compliant** - Enforce valid transitions
4. **Real-time updatable** - Support 8-step generation progress
5. **Executable** - Agents can validate/execute it

### Architecture Solution

**Domain Entity with Embedded State Machine:**

```typescript
// domain/aec/AEC.ts
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
  static createDraft(title: string, description?: string): AEC {
    return new AEC(
      generateId(),
      getCurrentWorkspaceId(),
      AECStatus.DRAFT,
      title,
      description ?? null,
      null, 0, GenerationState.initial(),
      [], [], [], null, null, [], null, [], null, null,
      new Date(), new Date()
    );
  }

  // State machine transitions (enforced)
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

  export(externalIssue: ExternalIssue): void {
    if (this._status !== AECStatus.READY) {
      throw new InvalidStateTransitionError(
        `Cannot export from ${this._status}`
      );
    }
    this._externalIssue = externalIssue;
    this._status = AECStatus.CREATED;
    this._updatedAt = new Date();
  }

  detectDrift(reason: string): void {
    if (![AECStatus.READY, AECStatus.CREATED].includes(this._status)) {
      return;
    }
    this._status = AECStatus.DRIFTED;
    this._driftDetectedAt = new Date();
    this._updatedAt = new Date();
  }

  // Getters (no direct mutation from outside)
  get status(): AECStatus { return this._status; }
  get readinessScore(): number { return this._readinessScore; }
  get codeSnapshot(): CodeSnapshot | null { return this._codeSnapshot; }
  // ... other getters
}
```

**Key Design Decisions:**
1. **Immutable from outside** - All mutations through methods (encapsulation)
2. **State machine enforced** - Can't skip states (draft → ready without validated = error)
3. **Snapshots mandatory for ready** - Can't export without code/API snapshots
4. **Drift detection automatic** - Only affects ready/created tickets
5. **Generation state embedded** - Real-time updates part of entity

**State Machine:**
```
draft → validated → ready → created
                      ↓
                   drifted
```

**Snapshot Locking:**
- Code snapshot: `{ commitSha: string, indexId: string }`
- API snapshot: `{ specUrl: string, hash: string }`
- Locked when status = 'ready'
- Drift detected when snapshots change

---

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents working on the 17 stories.

### Naming Patterns

**REST Endpoints:**
- Plural resource names: `/tickets`, `/indexes`, `/integrations`
- Route parameters: `:id` format (NestJS convention)
- Action suffixes: `/tickets/:id/export`, `/tickets/:id/validate`

**Database (Firestore):**
- Collections: plural - `workspaces`, `aecs`, `indexes`
- Documents: singular identifiers (no plural)
- Subcollections: `workspaces/{id}/aecs/{id}`
- Field names: camelCase - `readinessScore`, `createdAt`

**Frontend Components:**
- Files: PascalCase - `TicketDetail.tsx`, `GenerationProgress.tsx`
- Hooks: `use` prefix - `useTicketGeneration.ts`
- Stores: `.store.ts` suffix - `tickets.store.ts`

**Backend Classes:**
- Entities: PascalCase singular - `AEC.ts`, `Index.ts`
- Use Cases: `VerbNounUseCase` - `CreateTicketUseCase.ts`
- Services: `NounService` - `ValidationEngine.ts`, `RepoIndexerService.ts`
- Controllers: `NounController` - `TicketsController.ts`
- Repositories: `NounRepository` - `AECRepository.ts` (interface), `FirestoreAECRepository.ts` (impl)

---

### File Organization Patterns

**Tests:**
- Co-located: `AEC.ts` → `AEC.spec.ts` (same directory)
- NOT in separate `__tests__/` folder

**Barrel Exports:**
- Each feature module has `index.ts` that exports public API
- Internal files stay private (not exported)

**Import Aliases:**
- Frontend: `@/` = `src/`
- Backend: `@tickets/`, `@indexing/`, `@shared/`
- Shared package: `@repo/shared-types`

**Example:**
```typescript
// Frontend
import { TicketDetail } from '@/tickets/components/TicketDetail';
import { useTicketStore } from '@/stores/tickets.store';

// Backend
import { AEC } from '@tickets/domain/aec/AEC';
import { ILLMContentGenerator } from '@shared/application/ports/ILLMContentGenerator';

// Shared types
import { AECSchema, CreateTicketDTO } from '@repo/shared-types';
```

---

### Data Format Patterns

**API Responses:**
- Dates: ISO 8601 strings - `"2026-01-30T14:53:26.000Z"`
- IDs: UUIDs with type prefix - `"aec_a1b2c3d4..."`, `"ws_12345..."`
- Enums: lowercase strings - `"validated"`, NOT `"VALIDATED"`
- Numbers: No string wrapping - `readinessScore: 85` not `"85"`

**Success Response:**
```json
{
  "id": "aec_abc123",
  "title": "Add user authentication",
  "status": "validated",
  "readinessScore": 85,
  "createdAt": "2026-01-30T14:53:26.000Z"
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title must be 3-500 characters" }
  ],
  "timestamp": "2026-01-30T14:53:26.000Z"
}
```

**Firestore Documents:**
- Store as plain objects (not class instances)
- Dates as Firestore Timestamps (auto-converted)
- Use mappers for domain ↔ Firestore conversion
- Never store functions or methods

---

### Communication Patterns

**Frontend → Backend (REST API):**
```typescript
// Via service layer
const ticket = await ticketService.create({ title, description });
// Internally calls: POST /api/tickets with Bearer token
```

**Backend → Firestore:**
```typescript
// Always via repository interface
const aec = await this.aecRepository.findById(id);
// Never: firestore.collection('aecs').doc(id).get() directly
```

**Frontend → Firestore (Real-time):**
```typescript
// Direct listener for generation progress
useEffect(() => {
  const unsubscribe = firestore
    .collection(`workspaces/${workspaceId}/aecs`)
    .doc(aecId)
    .onSnapshot((snapshot) => {
      setGenerationState(snapshot.data()?.generationState);
    });
  return unsubscribe;
}, [aecId]);
```

**Backend → Mastra (LLM Content):**
```typescript
// Via ILLMContentGenerator interface
const intent = await this.llmGenerator.extractIntent({ title, description });
// Implementation uses Mastra agent with structured output
```

---

### Lifecycle Patterns

**Loading States (Frontend):**
```typescript
type LoadingState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success', data: T }
  | { status: 'error', error: Error };
```

**Error Recovery:**
- Network errors: Retry with exponential backoff (max 3 retries)
- 4xx errors: Show user-friendly message, don't retry
- 5xx errors: Retry once after 1 second
- Timeout: 30 seconds for API calls, 120 seconds for LLM operations

**Authentication Flow:**
1. User logs in via Firebase Auth
2. Frontend receives ID token
3. All API calls include: `Authorization: Bearer <token>`
4. Backend validates token via FirebaseAuthGuard
5. WorkspaceGuard extracts workspaceId from token
6. Request context contains workspaceId automatically

---

### Location Patterns

**Config Files:**
- Monorepo root: `turbo.json`, `pnpm-workspace.yaml`, `package.json`
- Per-app: `.env`, `.env.local`, `tsconfig.json`, `package.json`
- Shared packages: `packages/typescript-config/`, `packages/eslint-config/`

**Environment Variables:**
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_FIREBASE_PROJECT_ID=executable-tickets
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...

# Backend (.env)
PORT=3000
FIREBASE_PROJECT_ID=executable-tickets
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
DATABASE_URL=... (if using PostgreSQL for Bull)

# Production (Secret Manager)
# All sensitive keys stored in Google Secret Manager or Firebase Config
```

---

## Consistency Rules

### Error Handling

**Pattern: Domain Exceptions → HTTP Status Codes**

```typescript
// Domain exceptions (framework-agnostic)
export class AECNotFoundError extends Error {
  constructor(public readonly aecId: string) {
    super(`AEC with id ${aecId} not found`);
  }
}

export class ValidationFailedError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super('Validation failed');
  }
}

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// Exception filter maps to HTTP
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const mapping = {
      AECNotFoundError: 404,
      ValidationFailedError: 400,
      PermissionDeniedError: 403,
      InvalidStateTransitionError: 400,
      InsufficientReadinessError: 400,
    };

    const statusCode = mapping[exception.constructor.name] || 500;

    response.status(statusCode).json({
      statusCode,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

**Validation Layers:**
1. **Controller (Presentation):** DTO structure validation via ZodValidationPipe
2. **Use Case (Application):** Business rule validation (e.g., "max 3 questions")
3. **Domain:** Entity invariant validation (e.g., "title 3-500 chars")

---

### Logging Strategy

**Pino Logger with Correlation IDs:**

```typescript
// Configuration
const logger = new PinoLogger({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    log: (obj) => ({
      ...obj,
      requestId: obj.requestId,
      aecId: obj.aecId,
      workspaceId: obj.workspaceId,
    }),
  },
});

// Usage in use case
this.logger.info({
  requestId: req.id,
  aecId: aec.id,
  workspaceId: aec.workspaceId,
  message: 'Ticket generation started',
});

// Output
{
  "level": "info",
  "timestamp": "2026-01-30T14:53:26.000Z",
  "requestId": "req_abc123",
  "aecId": "aec_456",
  "workspaceId": "ws_789",
  "message": "Ticket generation started"
}
```

**Correlation IDs:**
- `requestId`: Generated per HTTP request
- `aecId`: Domain entity ID
- `workspaceId`: Tenant ID for isolation
- Flow through entire request lifecycle

---

## Data Architecture

### Core Domain Entities

**AEC (Agent Executable Contract):**
```typescript
class AEC {
  id: string;
  workspaceId: string;
  status: 'draft' | 'validated' | 'ready' | 'created' | 'drifted';
  title: string;
  description: string | null;
  type: 'feature' | 'bug' | 'task' | null;
  readinessScore: number; // 0-100
  generationState: GenerationState;
  acceptanceCriteria: string[];
  assumptions: string[];
  repoPaths: string[];
  codeSnapshot: CodeSnapshot | null;
  apiSnapshot: ApiSnapshot | null;
  questions: Question[]; // max 3
  estimate: Estimate | null;
  validationResults: ValidationResult[];
  externalIssue: ExternalIssue | null;
  driftDetectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Index (Code Repository Index):**
```typescript
class Index {
  id: string;
  workspaceId: string;
  repoName: string;
  commitSha: string;
  files: IndexedFile[];
  createdAt: Date;
}

type IndexedFile = {
  path: string;
  language: string;
  exports: string[];
  imports: string[];
  summary: string;
};
```

**APISpec (OpenAPI Specification):**
```typescript
class APISpec {
  id: string;
  workspaceId: string;
  repoName: string;
  specUrl: string;
  hash: string; // SHA-256 of spec content
  endpoints: Endpoint[];
  version: string;
  commitSha: string;
  createdAt: Date;
}
```

### Value Objects

**CodeSnapshot:**
```typescript
type CodeSnapshot = {
  commitSha: string;
  indexId: string;
};
```

**ApiSnapshot:**
```typescript
type ApiSnapshot = {
  specUrl: string;
  hash: string;
};
```

**Estimate:**
```typescript
type Estimate = {
  min: number; // hours
  max: number; // hours
  confidence: 'low' | 'medium' | 'high';
  drivers: string[]; // Top 3 factors
};
```

**ValidationResult:**
```typescript
type ValidationResult = {
  validatorType: 'structural' | 'behavioral' | 'testability' | 'risk' | 'permissions';
  passed: boolean;
  score: number; // 0-100
  weight: number; // multiplier
  issues: ValidationIssue[];
  blockers: ValidationIssue[];
};
```

### Relationships

```
Workspace (Firebase Auth tenant)
    ├── AECs (1:many)
    │   ├── CodeSnapshot → Index (reference)
    │   └── ApiSnapshot → APISpec (reference)
    ├── Indexes (1:many)
    └── APISpecs (1:many)
```

**Firestore Collections:**
```
/workspaces/{workspaceId}
    /aecs/{aecId}
    /indexes/{indexId}
    /apiSpecs/{specId}
    /integrations/
        github: { token, repos[] }
        jira: { token, projectId }
        linear: { token, teamId }
```

### AEC XML Serialization Format

**Purpose:** Machine-readable export format for external systems and AI agents.

**Status:** Specification complete (Story 2.5), implementation pending.

**Design Decision:** TypeScript AEC domain entity remains the **source of truth**. XML is a **projection/export format** for:
- External AI agent execution
- Jira/Linear/GitHub export attachments
- Version control alongside code
- Human-readable documentation archives
- Schema-validated contracts (XSD)

**Schema Location:** `docs/schemas/aec-v1.xsd`

**Serialization Methods:**
```typescript
class AEC {
  // ... existing domain methods ...

  // XML export (Story 2.5)
  toXML(): string;
  static fromXML(xml: string): AEC;
}
```

**XML Structure:**
```xml
<aec id="aec_abc123" version="1.0" xmlns="https://executable-tickets.com/schema/aec/v1">
  <metadata><!-- id, workspace, status, readiness, timestamps --></metadata>
  <intent><!-- title, description, type, user story --></intent>
  <requirements><!-- acceptance criteria (BDD format), assumptions --></requirements>
  <implementation><!-- tasks, interfaces, artifacts, repoPaths --></implementation>
  <validation><!-- results, constraints, questions --></validation>
  <snapshots><!-- repositoryContext, codeSnapshot, apiSnapshot --></snapshots>
  <tracking><!-- generationState, estimate --></tracking>
  <export><!-- externalIssue, dev/QA appendices (if exported) --></export>
</aec>
```

**Integration Points:**
- Export use cases: Attach XML to Jira/Linear issues
- Download button: Ticket detail UI → Firebase Storage URL
- Version control: Optional commit alongside code changes
- External agents: Parse XML for autonomous execution

**Implementation Phase:**
- **v1 (Story 2.5):** On-demand XML generation, export attachments
- **v2:** Optional Firebase Storage persistence at `/aec-exports/{aecId}.xml`
- **v3:** XML-first workflows for distributed agent execution

**Complete Specification:** See `docs/aec-xml-specification.md`

---

## API Contracts

### REST API Endpoints

**Base URL:** `http://localhost:3000/api` (dev), `https://api.executable-tickets.com/api` (prod)

**Authentication:** All endpoints require `Authorization: Bearer <firebase-token>` header

**Tickets:**
```
POST   /tickets                    # Create ticket (starts 8-step generation)
GET    /tickets                    # List tickets (workspace filtered)
GET    /tickets/:id                # Get ticket details
PATCH  /tickets/:id                # Update ticket (acceptance criteria, assumptions)
POST   /tickets/:id/export         # Export to Jira/Linear
POST   /tickets/:id/validate       # Re-run validation
POST   /tickets/:id/answer         # Answer clarification question
```

**Indexing:**
```
POST   /indexes                    # Trigger repo indexing
GET    /indexes                    # List indexes
GET    /indexes/:id                # Get index details
POST   /webhooks/github            # GitHub webhook handler
```

**Integrations:**
```
POST   /integrations/github        # Connect GitHub (OAuth callback)
POST   /integrations/jira          # Connect Jira (OAuth callback)
POST   /integrations/linear        # Connect Linear (OAuth callback)
GET    /integrations               # List connected integrations
```

### Example API Calls

**Create Ticket:**
```http
POST /api/tickets
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json

{
  "title": "Add user authentication",
  "description": "Users should be able to sign up and log in"
}

Response 201:
{
  "id": "aec_abc123",
  "status": "draft",
  "generationState": {
    "currentStep": 1,
    "steps": [
      { "id": 1, "status": "in-progress", "title": "Intent extraction" },
      { "id": 2, "status": "pending", "title": "Type detection" },
      // ... remaining steps
    ]
  },
  "createdAt": "2026-01-30T14:53:26.000Z"
}
```

**Get Ticket:**
```http
GET /api/tickets/aec_abc123
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...

Response 200:
{
  "id": "aec_abc123",
  "status": "validated",
  "title": "Add user authentication",
  "type": "feature",
  "readinessScore": 82,
  "acceptanceCriteria": [
    "Users can sign up with email/password",
    "Users can log in with email/password",
    "Session persists across browser refresh"
  ],
  "estimate": {
    "min": 4,
    "max": 8,
    "confidence": "medium",
    "drivers": ["3 modules touched", "Auth logic change", "DB migration"]
  },
  "codeSnapshot": {
    "commitSha": "a1b2c3d4",
    "indexId": "idx_xyz"
  }
}
```

### OpenAPI Spec

Auto-generated via @nestjs/swagger, available at:
- Interactive docs: `http://localhost:3000/api/docs`
- JSON spec: `http://localhost:3000/api/docs-json`

**Generate TypeScript client:**
```bash
npx openapi-typescript-codegen \
  --input http://localhost:3000/api/docs-json \
  --output client/src/api \
  --client axios
```

---

## Security Architecture

### Authentication & Authorization

**Firebase Auth:**
- Identity provider: Email/password, Google, GitHub
- Token format: JWT with workspace claim
- Token validation: Backend validates on every request via FirebaseAuthGuard
- Session: Frontend stores token in memory (not localStorage for security)

**Workspace Isolation:**
```typescript
// Token contains workspace claim
{
  "sub": "user_123",
  "email": "pm@company.com",
  "workspaceId": "ws_abc",
  "role": "admin"
}

// WorkspaceGuard enforces isolation
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
@Get()
async findAll(@WorkspaceId() workspaceId: string) {
  // Only returns tickets for this workspace
  return this.findTicketsUseCase.execute({ workspaceId });
}
```

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Workspace isolation
    match /workspaces/{workspaceId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.workspaceId == workspaceId;
    }
  }
}
```

**Firebase Storage Security Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /workspaces/{workspaceId}/{allPaths=**} {
      allow read, write: if request.auth != null
        && request.auth.token.workspaceId == workspaceId;
    }
  }
}
```

### Data Protection

**Encryption:**
- In transit: HTTPS/TLS 1.3 for all API calls
- At rest: Firebase encryption (managed)
- Secrets: Google Secret Manager for production, .env for local

**Sensitive Data:**
- OAuth tokens: Encrypted before storing in Firestore
- API keys: Never logged, stored in Secret Manager
- User passwords: Handled by Firebase Auth (bcrypt)

**Input Validation:**
- All inputs validated via Zod schemas (controller layer)
- SQL injection: N/A (NoSQL Firestore)
- XSS: React escapes by default, use dangerouslySetInnerHTML carefully
- CSRF: Not needed for stateless JWT auth

---

## Performance Considerations

### Frontend Optimization

**Code Splitting:**
- Route-based: Next.js automatic code splitting per page
- Component-based: `next/dynamic` for heavy components
- Bundle analysis: `@next/bundle-analyzer`

**Caching:**
- Static assets: Vercel CDN (automatic)
- API responses: React Query with stale-while-revalidate
- Firestore: Local cache enabled by default

**Real-time Updates:**
- Use Firestore listeners only for generation progress (transient)
- Unsubscribe listeners on component unmount
- Batch Firestore reads where possible

### Backend Optimization

**Database Queries:**
- Firestore indexes: Create composite indexes for common queries
- Pagination: Use `startAfter` cursor-based pagination (not offset)
- Denormalization: Store ticket list metadata separately from full ticket

**Background Jobs:**
- Use Bull queues for long-running operations (indexing, drift detection)
- Rate limiting: Limit GitHub API calls to avoid rate limits
- Batch processing: Process drift detection in batches of 100 tickets

**Caching:**
- Redis: Cache frequently accessed data (repo indexes, API specs)
- TTL: 5 minutes for indexes, 1 hour for specs
- Invalidation: On webhook events (push, spec change)

### Mastra Optimization

**Token Usage:**
- Use smallest viable model for each agent (gpt-4o-mini for classification)
- Structured outputs reduce token waste (vs free-form text parsing)
- Prompt caching for repeated system messages

**Latency:**
- Parallel agent calls where possible (intent extraction + type detection)
- Timeout: 30 seconds per agent call
- Fallback: Retry with exponential backoff (max 3 attempts)

---

## Deployment Architecture

### Production Infrastructure

**Frontend (Next.js):**
- Platform: Vercel
- Region: Global edge network
- Build: Automatic on git push to main
- Environment: Production, Preview (per PR)
- CDN: Vercel Edge Network
- SSL: Automatic (Let's Encrypt)

**Backend (NestJS):**
- Platform: Google Cloud Run
- Region: us-central1 (or multi-region)
- Concurrency: 80 requests per instance
- Min instances: 1 (production), 0 (staging)
- Max instances: 100
- Memory: 2GB per instance
- CPU: 2 vCPU per instance
- SSL: Automatic (Google-managed)

**Redis (Bull Queue):**
- Platform: Upstash (serverless Redis) or Google Memorystore
- Region: Same as backend
- Persistence: AOF enabled
- Max memory: 1GB

**Firebase:**
- Project: Production project (separate from dev)
- Auth: Email/password + Google OAuth
- Firestore: Multi-region (nam5)
- Storage: Multi-region (us)
- Security Rules: Enforced

**Secrets:**
- Storage: Google Secret Manager
- Access: Cloud Run service account
- Rotation: Manual (quarterly)

### CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test

  deploy-backend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: executable-tickets-api
          region: us-central1
          source: ./apps/backend

  deploy-frontend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Monitoring & Observability

**Logging:**
- Frontend: Vercel logs
- Backend: Google Cloud Logging
- Format: JSON with correlation IDs

**Metrics:**
- Frontend: Vercel Analytics
- Backend: Cloud Run metrics (latency, error rate, instance count)
- Custom: OpenTelemetry for trace spans

**Alerts:**
- Error rate > 5%: Slack notification
- Latency p99 > 5s: Slack notification
- Cloud Run instance count > 80: Scale alert

---

## Development Environment

### Prerequisites

**Required:**
- Node.js 20.x or later
- pnpm 8.x or later
- Firebase CLI: `npm install -g firebase-tools`
- Redis (local): `brew install redis` or Docker
- Git

**Recommended:**
- VS Code with extensions: ESLint, Prettier, Tailwind CSS IntelliSense
- Postman or Insomnia (API testing)
- Firebase Emulator Suite (local dev): `firebase init emulators`

### Setup Commands

```bash
# Clone repository
git clone https://github.com/your-org/executable-tickets.git
cd executable-tickets

# Install dependencies
pnpm install

# Setup environment variables
cp apps/client/.env.example apps/client/.env.local
cp apps/backend/.env.example apps/backend/.env

# Edit .env files with your Firebase credentials
# Get credentials from Firebase Console

# Start Redis (required for Bull queue)
redis-server

# Start Firebase Emulators (optional, for offline dev)
firebase emulators:start

# Start development servers (from monorepo root)
pnpm dev
# This starts:
# - Frontend: http://localhost:3001
# - Backend: http://localhost:3000
# - Turbopack HMR

# Run tests
pnpm test

# Build for production
pnpm build

# Lint
pnpm lint

# Format
pnpm format
```

### Environment Variables

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_FIREBASE_PROJECT_ID=executable-tickets-dev
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=executable-tickets-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=executable-tickets-dev.appspot.com
```

**Backend (.env):**
```bash
PORT=3000
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=executable-tickets-dev
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@executable-tickets-dev.iam.gserviceaccount.com

# Redis (Bull queue)
REDIS_URL=redis://localhost:6379

# Mastra / LLM
OPENAI_API_KEY=sk-...

# GitHub App (create at github.com/settings/apps)
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# Jira (create at developer.atlassian.com)
JIRA_CLIENT_ID=your-client-id
JIRA_CLIENT_SECRET=your-client-secret

# Linear (create at linear.app/settings/api)
LINEAR_CLIENT_ID=your-client-id
LINEAR_CLIENT_SECRET=your-client-secret
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Feature-Based Modules with Internal Layers

**Context:** Need to organize NestJS backend code following Clean Architecture principles.

**Decision:** Use feature-based modules (`tickets/`, `indexing/`, `integrations/`) with internal Clean Architecture layers (presentation/application/domain/infrastructure).

**Alternatives Considered:**
- Layer-first structure (presentation/ at root, then features inside)

**Rationale:**
- Self-contained modules easier to navigate
- Natural feature boundaries for AI agents implementing stories
- Scales better as features grow

**Consequences:**
- Each module repeats layer structure (more directories)
- Shared code goes in `shared/` module
- Enforcing layer dependencies requires discipline

---

### ADR-002: Mastra for LLM Content Generation Only

**Context:** Need LLM for content generation but want deterministic REST APIs for business logic.

**Decision:** Use Mastra only for 4 LLM-powered steps: intent extraction, type detection, drafting, question generation. All other operations (validation, estimation, indexing, export) use deterministic NestJS services.

**Alternatives Considered:**
- Mastra workflows orchestrating all 8 steps
- Direct OpenAI API calls (no framework)

**Rationale:**
- Separation of concerns: LLM orchestration vs business logic
- Predictable JSON via Zod schemas for controlled UI
- Easier to test deterministic services
- Mastra workflows unnecessary for deterministic operations

**Consequences:**
- Mastra is a smaller part of the system (infrastructure layer only)
- Use cases orchestrate 8 steps (not Mastra workflows)
- Simpler architecture, easier debugging

---

### ADR-003: Firestore Listeners for Real-Time Updates

**Context:** Frontend needs real-time progress updates during 8-step ticket generation.

**Decision:** Use Firestore listeners in frontend to subscribe to AEC generation state. Backend updates Firestore after each step.

**Alternatives Considered:**
- WebSockets
- Server-Sent Events (SSE)
- Polling

**Rationale:**
- Already using Firebase for auth/storage
- No additional infrastructure needed
- Automatic reconnection handling
- Persisted state (survives page refresh)
- Works seamlessly with Firebase Auth

**Consequences:**
- Firestore write after each step (cost consideration)
- Frontend coupled to Firebase (acceptable trade-off)
- No WebSocket infrastructure needed

---

### ADR-004: Zustand with Service Injection

**Context:** Need state management in Next.js frontend following CLAUDE.md mandate.

**Decision:** Use Zustand stores with service injection via `useServices()` hook. Business logic lives in store actions, services are lazily initialized.

**Alternatives Considered:**
- Redux Toolkit
- React Context + useReducer
- TanStack Query only (no state management)

**Rationale:**
- Follows project CLAUDE.md requirements
- Simpler than Redux (less boilerplate)
- Business logic in store actions (not components)
- Service injection pattern enables testing

**Consequences:**
- Services must be mockable for testing
- Store actions are async (handle loading states)
- Components stay simple (UI rendering only)

---

### ADR-005: Bull Queue for Background Jobs

**Context:** Need to process GitHub webhooks, repo indexing, and drift detection asynchronously.

**Decision:** Use NestJS Bull queue (Redis-backed) for background job processing.

**Alternatives Considered:**
- Firebase Functions (separate from NestJS)
- NestJS cron + manual queue
- Google Cloud Tasks

**Rationale:**
- Integrated with NestJS (same codebase)
- Scalable (Redis-backed)
- Built-in retries, rate limiting, prioritization
- Better observability than Firebase Functions
- Keeps all backend logic in one place

**Consequences:**
- Redis required (Upstash for production)
- Queue persistence needed for reliability
- Job failures must be monitored

---

### ADR-006: AEC as Domain Entity with State Machine

**Context:** AEC is the core innovation - need to enforce state transitions and snapshot locking.

**Decision:** Implement AEC as domain entity with embedded state machine. All mutations through methods that enforce valid transitions.

**Alternatives Considered:**
- Simple DTO with no validation
- State machine as separate service

**Rationale:**
- Encapsulation: Can't skip states (draft → ready without validate)
- Type safety: Snapshots mandatory when status = ready
- Domain-driven: Business rules enforced at entity level
- Immutability: Private fields, public getters only

**Consequences:**
- More complex entity class
- State transitions explicitly coded
- Impossible to create invalid AECs
- Repository must use mappers (entity ↔ Firestore)

---

### ADR-007: Direct Frontend Upload to Firebase Storage

**Context:** Need file uploads for PRDs, diagrams, screenshots.

**Decision:** Frontend uploads directly to Firebase Storage. Backend only stores metadata (URLs).

**Alternatives Considered:**
- Backend proxy (frontend → backend → Storage)
- Signed URLs (backend generates, frontend uploads)

**Rationale:**
- Faster (no backend proxy latency)
- Cheaper (no backend bandwidth cost)
- Firebase Security Rules enforce workspace isolation
- Scalable (no backend bottleneck)

**Consequences:**
- Frontend coupled to Firebase Storage
- Must configure Security Rules correctly
- Backend only handles metadata

---

## Summary

This architecture document defines the complete technical foundation for Executable Tickets. Key highlights:

✅ **Monorepo:** Turborepo + pnpm with Next.js + NestJS
✅ **Clean Architecture:** Feature-based modules with internal layers
✅ **Mastra Integration:** LLM content generation only (4 steps), infrastructure layer
✅ **REST-First:** Deterministic APIs for all business logic
✅ **Real-Time:** Firestore listeners for generation progress
✅ **State Management:** Zustand with service injection
✅ **Background Jobs:** Bull queue (Redis-backed)
✅ **Security:** Firebase Auth + workspace isolation + Security Rules
✅ **Novel Pattern:** AEC state machine with snapshot locking
✅ **Implementation Patterns:** Complete consistency rules for AI agents

**Ready for implementation.** All 17 stories have architectural support. No gaps detected.

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2026-01-30_
_For: BMad_
_Architect: Winston (bmad:bmm:agents:architect)_

---

## Epic 6: Quick Document Generation Module

**Added:** 2026-01-31 for v1

### Module Structure

```
backend/src/documents/
├── presentation/
│   ├── documents.controller.ts     # REST endpoints
│   └── dto/
│       ├── GenerateDocsDto.ts
│       ├── UploadDocumentDto.ts
│       └── UpdateDocumentDto.ts
├── application/
│   ├── use-cases/
│   │   ├── GenerateDocsUseCase.ts
│   │   └── UploadDocumentUseCase.ts
│   ├── services/
│   │   ├── RepoAnalyzer.ts         # AI-powered tech stack detection
│   │   └── WorkspaceIndexingService.ts  # Mastra workspace RAG
│   └── ports/
│       └── DocumentRepository.ts
├── domain/
│   ├── Document.ts                 # Entity
│   └── value-objects/
│       └── TechStackAnalysis.ts
├── infrastructure/
│   ├── persistence/
│   │   ├── FirestoreDocumentRepository.ts
│   │   └── mappers/
│   │       └── DocumentMapper.ts
│   └── mastra/
│       └── workflows/
│           ├── generate-prd.workflow.ts
│           └── generate-architecture.workflow.ts
└── documents.module.ts
```

**Frontend Structure:**
```
client/src/documents/
└── components/
    ├── GenerateDocsWizard.tsx   # Auto-generation flow
    ├── UploadDocument.tsx       # Manual upload
    ├── DocumentViewer.tsx       # View/edit docs
    └── ChipQuestion.tsx         # Suspend/resume questions
```

### Technology Integration

**Mastra Workflows:**
- `generateDocsWorkflow` - Orchestrates PRD + Architecture generation
- Uses Mastra `createWorkflow()` with sequential `.then()` chaining
- Suspend/resume for chip questions (human-in-loop)
- Integrates with Mastra workspace for RAG

**Mastra Workspace (Search & Indexing):**
- Indexes: PRD, Architecture, completed AECs, README
- BM25 keyword search (free, fast)
- Vector search with Ollama embeddings (free, semantic)
- Hybrid mode for best results
- Used in PRD/Architecture generation for context

**AI-Powered Analysis:**
- No hardcoded tech stack detection
- LLM analyzes repository files dynamically
- Works for ANY platform (web, mobile, game, desktop, CLI, embedded)
- Two LLM calls: (1) Identify relevant files, (2) Analyze tech stack

### API Endpoints

```
POST   /api/documents/generate          # Start auto-generation workflow
POST   /api/documents/resume            # Resume suspended workflow with answers
GET    /api/documents/:type             # Get PRD or Architecture
POST   /api/documents/upload            # Upload manual document
PATCH  /api/documents/:type             # Edit document
GET    /api/documents/:type/versions    # Get version history
```

### Data Model

**Document Entity:**
```typescript
{
  id: string,
  workspaceId: string,
  type: 'prd' | 'architecture',
  content: string,        // Markdown
  version: number,
  source: 'auto-generated' | 'uploaded' | 'edited',
  createdAt: Date,
  updatedAt: Date
}
```

**Firestore Collections:**
```
/workspaces/{workspaceId}
    /documents/
        prd                # Current PRD document
        architecture       # Current Architecture document
    /document-versions/    # Version history
        prd-v1, prd-v2, architecture-v1, etc.
```

**Mastra Workspace Index:**
```
Indexed documents:
- /documents/prd           → Searchable for similar projects
- /documents/architecture  → Searchable for patterns
- /aecs/aec-{id}          → Searchable for ticket patterns
- /README.md              → Searchable for project context
```

### Integration Points

**Epic 6 → Epic 2 (AEC Generation):**
```typescript
// In CreateTicketUseCase (Step 5: Drafting)
const prd = await this.documentRepository.findByWorkspaceAndType(workspaceId, 'prd');
const architecture = await this.documentRepository.findByWorkspaceAndType(workspaceId, 'architecture');

const draft = await this.llmGenerator.generateDraft({
  intent: extractedIntent,
  type: detectedType,
  prdContext: prd?.content,           // PRD provides business context
  architectureContext: architecture?.content,  // Architecture provides tech constraints
  repoContext: await this.searchWorkspace(intent)  // RAG search
});
```

**Epic 6 → Epic 3 (Validation):**
- Validation engine checks ACs against PRD requirements
- Architecture patterns inform testability validation

**Epic 6 → Epic 4 (Code Intelligence):**
- Architecture document guides which repos to prioritize
- PRD features map to code modules

### Mastra Workflow Architecture

**generateDocsWorkflow:**
```
analyzeRepoStep (AI-powered, no hardcoding)
  ↓
generatePRDStep (Mastra LLM + RAG)
  ↓ [May suspend for chip questions]
  ↓ [Resume with user answers]
  ↓
generateArchitectureStep (Mastra LLM + RAG)
  ↓ [May suspend for chip questions]
  ↓ [Resume with user answers]
  ↓
saveDocumentsStep (Firestore)
  ↓
indexDocumentsStep (Mastra workspace)
```

**State Management:**
```typescript
workflowState: {
  repoAnalysis: TechStackAnalysis,
  generatedSections: string[],
  userAnswers: Record<string, string>,
  confidence: number
}
```

**Suspend Points:**
- After repo analysis (if confidence <0.7): "What platform?"
- During PRD generation (if unclear): "Primary user?"
- During Architecture (if tech choices unclear): "State management?"

### Performance Targets

| Metric | Target | Measured By |
|---|---|---|
| Repository analysis | <5 seconds | LLM response time |
| PRD generation | <30 seconds | Workflow step duration |
| Architecture generation | <30 seconds | Workflow step duration |
| Total with 0 questions | <90 seconds | End-to-end workflow |
| Total with 3 questions | <10 minutes | Including user think time |

### Decision Record: Why Firestore over Firebase Storage

**Context:** Need to store PRD and Architecture documents

**Decision:** Use **Firestore** for text documents, not Firebase Storage

**Rationale:**
- Text documents are small (<100KB)
- Need inline editing (update content field)
- Need to query (check if exists before generation)
- Need version history (store multiple versions)
- Need real-time updates (AEC generation sees edits immediately)
- Firestore is optimized for this use case

**Storage is used for:** Binary attachments (screenshots, PDFs) in future enhancement

### Decision Record: AI-Powered vs Hardcoded Detection

**Context:** Need to detect tech stack from repository

**Decision:** Use **AI-powered dynamic analysis**, not hardcoded heuristics

**Rationale:**
- Works for ANY tech stack (Flutter, Unity, Go, Rust, etc.)
- Future-proof (new frameworks work automatically)
- Understands context (folder structure, patterns)
- Self-documenting (AI provides reasoning)
- No maintenance (no code updates for new tech)

**Hardcoded approach rejected:** Limited to ~20 frameworks, requires updates, fails on rare stacks

### Decision Record: Single Agent vs Multi-Agent Party Mode

**Context:** How to generate PRD/Architecture

**Decision:** Use **single Architecture Agent** with Mastra sequential workflow, not multi-agent conversations

**Rationale:**
- Faster (<10 min vs 30+ min for party mode)
- Simpler UX (chip questions vs chat interface)
- More predictable outputs (template-guided)
- Lower cost (fewer LLM calls)
- User explicitly requested this approach

**Party mode rejected:** Too slow, chat interface not desired, overkill for concise docs

---
