# Epic 18 — Cloud Develop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable PMs to click "Develop" on an approved ticket and have real Claude Code CLI implement it in a cloud sandbox, auto-flight (no questions), producing a PR + Change Record.

**Architecture:** New `sessions` module (Clean Architecture) with SSE streaming. E2B sandbox runs Claude Code CLI with `--output-format stream-json`. EventTranslator maps CLI events to UI components. Frontend adds Execute tab with monitoring view. Billing module tracks usage quotas.

**Tech Stack:** NestJS, Firestore, E2B SDK, SSE (Server-Sent Events), React/Next.js, Zustand, Tailwind CSS

**Key constraint:** This EXPANDS the existing product. Never modify existing modules unless adding an interface they export. All new code in isolated modules. Follow existing Clean Architecture patterns exactly (see jobs module as template).

---

## File Structure

### Backend — New `sessions` module

```
backend/src/sessions/
├── domain/
│   ├── Session.ts                         # Domain entity with state machine
│   ├── SessionStatus.ts                   # Status enum + transition map
│   └── InvalidSessionTransitionError.ts   # Domain error
├── application/
│   ├── ports/
│   │   ├── SessionRepository.port.ts      # Firestore persistence port
│   │   ├── SandboxPort.ts                 # Container runtime abstraction
│   │   └── index.ts                       # Re-exports + symbols
│   ├── services/
│   │   ├── EventTranslator.ts             # CLI JSON → UI events (pure function)
│   │   ├── SessionOrchestrator.ts         # Lifecycle: provision → run → cleanup
│   │   └── ComplexityAnalyzer.ts          # Determines cloud eligibility
│   └── use-cases/
│       ├── StartSessionUseCase.ts         # Budget check → provision → start
│       ├── CancelSessionUseCase.ts        # Cancel running session
│       └── __tests__/
│           ├── StartSessionUseCase.spec.ts
│           └── CancelSessionUseCase.spec.ts
├── infrastructure/
│   ├── persistence/
│   │   └── FirestoreSessionRepository.ts  # Implements SessionRepository port
│   ├── sandbox/
│   │   └── E2BSandboxAdapter.ts           # Implements SandboxPort (stub for MVP)
│   └── mappers/
│       └── SessionMapper.ts               # Domain <-> Firestore serialization
├── presentation/
│   ├── controllers/
│   │   └── sessions.controller.ts         # SSE endpoint + REST endpoints
│   └── dto/
│       ├── StartSessionDto.ts
│       └── SessionEventDto.ts
└── sessions.module.ts                     # NestJS module registration
```

### Backend — New `billing` module

```
backend/src/billing/
├── domain/
│   └── UsageQuota.ts                      # Quota entity (remaining, limit, period)
├── application/
│   ├── ports/
│   │   ├── UsageQuotaRepository.port.ts
│   │   └── index.ts
│   └── use-cases/
│       ├── CheckQuotaUseCase.ts
│       ├── DeductQuotaUseCase.ts
│       └── __tests__/
│           └── CheckQuotaUseCase.spec.ts
├── infrastructure/
│   ├── persistence/
│   │   └── FirestoreUsageQuotaRepository.ts
│   └── mappers/
│       └── UsageQuotaMapper.ts
└── billing.module.ts
```

### Frontend — New `sessions` feature

```
client/src/sessions/
├── stores/
│   └── session.store.ts                   # SSE connection + event stream state
├── components/
│   ├── SessionMonitorView.tsx             # Main monitoring view (Execute tab content)
│   ├── SessionMessage.tsx                 # Claude's message blocks (markdown)
│   ├── SessionToolCard.tsx                # Collapsible tool card (read, edit, bash)
│   ├── SessionToolGroup.tsx               # Grouped consecutive tools
│   ├── SessionDiffViewer.tsx              # Inline diff display
│   ├── SessionSummary.tsx                 # Completion card with PR link
│   ├── SessionProvisioningView.tsx        # Three-step setup checklist
│   └── DevelopButton.tsx                  # CTA with quota check + complexity gate
└── types/
    └── session.types.ts                   # Shared types for session events
```

---

## Task Breakdown (Parallel-Friendly)

Tasks are organized into **waves**. All tasks within a wave can run in parallel. A wave must complete before the next wave starts.

### WAVE 1 — Foundation (all parallel, no dependencies between tasks)

These tasks define shared types, domain entities, and pure functions. They have zero dependencies on each other or existing code.

---

### Task 1: Session Domain Entity + Status

**Files:**
- Create: `backend/src/sessions/domain/SessionStatus.ts`
- Create: `backend/src/sessions/domain/Session.ts`
- Create: `backend/src/sessions/domain/InvalidSessionTransitionError.ts`
- Test: `backend/src/sessions/domain/__tests__/Session.spec.ts`

- [ ] **Step 1: Create SessionStatus enum and transitions**

```typescript
// backend/src/sessions/domain/SessionStatus.ts
export enum SessionStatus {
  PROVISIONING = 'provisioning',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export const VALID_SESSION_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  [SessionStatus.PROVISIONING]: [SessionStatus.RUNNING, SessionStatus.FAILED, SessionStatus.CANCELLED],
  [SessionStatus.RUNNING]: [SessionStatus.COMPLETED, SessionStatus.FAILED, SessionStatus.CANCELLED],
  [SessionStatus.COMPLETED]: [],
  [SessionStatus.FAILED]: [],
  [SessionStatus.CANCELLED]: [],
};

export const TERMINAL_SESSION_STATUSES: ReadonlySet<SessionStatus> = new Set([
  SessionStatus.COMPLETED,
  SessionStatus.FAILED,
  SessionStatus.CANCELLED,
]);

export const ACTIVE_SESSION_STATUSES: ReadonlySet<SessionStatus> = new Set([
  SessionStatus.PROVISIONING,
  SessionStatus.RUNNING,
]);
```

- [ ] **Step 2: Create InvalidSessionTransitionError**

```typescript
// backend/src/sessions/domain/InvalidSessionTransitionError.ts
export class InvalidSessionTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid session transition: ${from} → ${to}`);
    this.name = 'InvalidSessionTransitionError';
  }
}
```

- [ ] **Step 3: Write failing test for Session entity**

```typescript
// backend/src/sessions/domain/__tests__/Session.spec.ts
import { Session } from '../Session';
import { SessionStatus } from '../SessionStatus';
import { InvalidSessionTransitionError } from '../InvalidSessionTransitionError';

describe('Session', () => {
  const validProps = {
    ticketId: 'aec-123',
    teamId: 'team-1',
    userId: 'user-1',
    ticketTitle: 'Add webhook retry',
    repoOwner: 'acme',
    repoName: 'api-backend',
    branch: 'feat/aec-123-webhook-retry',
  };

  describe('createNew', () => {
    it('should create a session in PROVISIONING status', () => {
      const session = Session.createNew(validProps);
      expect(session.status).toBe(SessionStatus.PROVISIONING);
      expect(session.ticketId).toBe('aec-123');
      expect(session.id).toMatch(/^session_/);
    });
  });

  describe('state transitions', () => {
    it('should transition PROVISIONING → RUNNING', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      expect(session.status).toBe(SessionStatus.RUNNING);
      expect(session.sandboxId).toBe('sandbox-123');
    });

    it('should transition RUNNING → COMPLETED', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      session.markCompleted(0.47, 'https://github.com/acme/api/pull/42', 42);
      expect(session.status).toBe(SessionStatus.COMPLETED);
      expect(session.costUsd).toBe(0.47);
      expect(session.prUrl).toBe('https://github.com/acme/api/pull/42');
    });

    it('should transition RUNNING → FAILED', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      session.markFailed('Sandbox timeout');
      expect(session.status).toBe(SessionStatus.FAILED);
      expect(session.error).toBe('Sandbox timeout');
    });

    it('should transition any active → CANCELLED', () => {
      const session = Session.createNew(validProps);
      session.markCancelled();
      expect(session.status).toBe(SessionStatus.CANCELLED);
    });

    it('should throw on invalid transition', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      session.markCompleted(0.5, 'url', 1);
      expect(() => session.markRunning('new-sandbox')).toThrow(InvalidSessionTransitionError);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from plain object', () => {
      const session = Session.createNew(validProps);
      session.markRunning('sandbox-123');
      const plain = session.toPlainObject();
      const restored = Session.reconstitute(plain as any);
      expect(restored.id).toBe(session.id);
      expect(restored.status).toBe(SessionStatus.RUNNING);
      expect(restored.sandboxId).toBe('sandbox-123');
    });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd backend && npx jest src/sessions/domain/__tests__/Session.spec.ts --no-coverage`
Expected: FAIL — `Cannot find module '../Session'`

- [ ] **Step 5: Implement Session entity**

```typescript
// backend/src/sessions/domain/Session.ts
import { randomUUID } from 'crypto';
import { SessionStatus, VALID_SESSION_TRANSITIONS, TERMINAL_SESSION_STATUSES, ACTIVE_SESSION_STATUSES } from './SessionStatus';
import { InvalidSessionTransitionError } from './InvalidSessionTransitionError';

interface CreateSessionProps {
  ticketId: string;
  teamId: string;
  userId: string;
  ticketTitle: string;
  repoOwner: string;
  repoName: string;
  branch: string;
}

export class Session {
  private constructor(
    private readonly _id: string,
    private readonly _ticketId: string,
    private readonly _teamId: string,
    private readonly _userId: string,
    private readonly _ticketTitle: string,
    private readonly _repoOwner: string,
    private readonly _repoName: string,
    private readonly _branch: string,
    private _status: SessionStatus,
    private _sandboxId: string | null,
    private _error: string | null,
    private _costUsd: number | null,
    private _prUrl: string | null,
    private _prNumber: number | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private _completedAt: Date | null,
  ) {}

  static createNew(props: CreateSessionProps): Session {
    const now = new Date();
    return new Session(
      `session_${randomUUID()}`,
      props.ticketId,
      props.teamId,
      props.userId,
      props.ticketTitle,
      props.repoOwner,
      props.repoName,
      props.branch,
      SessionStatus.PROVISIONING,
      null,
      null,
      null,
      null,
      null,
      now,
      now,
      null,
    );
  }

  static reconstitute(props: {
    id: string;
    ticketId: string;
    teamId: string;
    userId: string;
    ticketTitle: string;
    repoOwner: string;
    repoName: string;
    branch: string;
    status: SessionStatus;
    sandboxId: string | null;
    error: string | null;
    costUsd: number | null;
    prUrl: string | null;
    prNumber: number | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
  }): Session {
    return new Session(
      props.id,
      props.ticketId,
      props.teamId,
      props.userId,
      props.ticketTitle,
      props.repoOwner,
      props.repoName,
      props.branch,
      props.status,
      props.sandboxId,
      props.error,
      props.costUsd,
      props.prUrl,
      props.prNumber,
      props.createdAt,
      props.updatedAt,
      props.completedAt,
    );
  }

  markRunning(sandboxId: string): void {
    this.transitionTo(SessionStatus.RUNNING);
    this._sandboxId = sandboxId;
    this._updatedAt = new Date();
  }

  markCompleted(costUsd: number, prUrl: string, prNumber: number): void {
    if (this._status === SessionStatus.CANCELLED) return;
    this.transitionTo(SessionStatus.COMPLETED);
    this._costUsd = costUsd;
    this._prUrl = prUrl;
    this._prNumber = prNumber;
    const now = new Date();
    this._updatedAt = now;
    this._completedAt = now;
  }

  markFailed(error: string): void {
    if (this._status === SessionStatus.CANCELLED) return;
    this.transitionTo(SessionStatus.FAILED);
    this._error = error;
    const now = new Date();
    this._updatedAt = now;
    this._completedAt = now;
  }

  markCancelled(): void {
    this.transitionTo(SessionStatus.CANCELLED);
    const now = new Date();
    this._updatedAt = now;
    this._completedAt = now;
  }

  isActive(): boolean {
    return ACTIVE_SESSION_STATUSES.has(this._status);
  }

  isTerminal(): boolean {
    return TERMINAL_SESSION_STATUSES.has(this._status);
  }

  private transitionTo(target: SessionStatus): void {
    const allowed = VALID_SESSION_TRANSITIONS[this._status];
    if (!allowed.includes(target)) {
      throw new InvalidSessionTransitionError(this._status, target);
    }
    this._status = target;
  }

  get id(): string { return this._id; }
  get ticketId(): string { return this._ticketId; }
  get teamId(): string { return this._teamId; }
  get userId(): string { return this._userId; }
  get ticketTitle(): string { return this._ticketTitle; }
  get repoOwner(): string { return this._repoOwner; }
  get repoName(): string { return this._repoName; }
  get branch(): string { return this._branch; }
  get status(): SessionStatus { return this._status; }
  get sandboxId(): string | null { return this._sandboxId; }
  get error(): string | null { return this._error; }
  get costUsd(): number | null { return this._costUsd; }
  get prUrl(): string | null { return this._prUrl; }
  get prNumber(): number | null { return this._prNumber; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get completedAt(): Date | null { return this._completedAt; }

  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      ticketId: this._ticketId,
      teamId: this._teamId,
      userId: this._userId,
      ticketTitle: this._ticketTitle,
      repoOwner: this._repoOwner,
      repoName: this._repoName,
      branch: this._branch,
      status: this._status,
      sandboxId: this._sandboxId,
      error: this._error,
      costUsd: this._costUsd,
      prUrl: this._prUrl,
      prNumber: this._prNumber,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      completedAt: this._completedAt?.toISOString() ?? null,
    };
  }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && npx jest src/sessions/domain/__tests__/Session.spec.ts --no-coverage`
Expected: All 6 tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/sessions/domain/
git commit -m "feat(sessions): add Session domain entity with state machine"
```

---

### Task 2: EventTranslator (Pure Function)

**Files:**
- Create: `backend/src/sessions/application/services/EventTranslator.ts`
- Test: `backend/src/sessions/application/services/__tests__/EventTranslator.spec.ts`

This is a pure function with zero dependencies. It parses Claude Code's `stream-json` NDJSON output and maps it to UI events.

- [ ] **Step 1: Define UI event types**

```typescript
// backend/src/sessions/application/services/EventTranslator.ts

// --- Input: Raw CLI stream-json event ---
export interface RawCliEvent {
  type: 'system' | 'assistant' | 'tool_use' | 'tool_result' | 'result';
  subtype?: string;
  message?: {
    role: string;
    content: Array<{
      type: 'thinking' | 'text' | 'tool_use';
      text?: string;
      thinking?: string;
      id?: string;
      name?: string;
      input?: Record<string, unknown>;
    }>;
  };
  tool_use_id?: string;
  content?: string;
  cost_usd?: number;
  duration_ms?: number;
  num_turns?: number;
  session_id?: string;
}

// --- Output: UI events sent to browser ---
export type UiEventType =
  | 'session.status'
  | 'event.message'
  | 'event.thinking'
  | 'event.tool_use'
  | 'event.file_diff'
  | 'event.file_create'
  | 'event.bash'
  | 'event.search'
  | 'event.tool_result'
  | 'event.summary'
  | 'event.unknown_tool';

export interface UiEvent {
  type: UiEventType;
  toolUseId?: string;
  content?: string;
  tool?: string;
  path?: string;
  command?: string;
  oldString?: string;
  newString?: string;
  output?: string;
  truncated?: boolean;
  costUsd?: number;
  durationMs?: number;
  numTurns?: number;
  params?: Record<string, unknown>;
}
```

- [ ] **Step 2: Write failing tests**

```typescript
// backend/src/sessions/application/services/__tests__/EventTranslator.spec.ts
import { translateEvent, RawCliEvent } from '../EventTranslator';

describe('EventTranslator', () => {
  describe('system events', () => {
    it('should return empty array for system events', () => {
      const raw: RawCliEvent = { type: 'system', subtype: 'init' };
      expect(translateEvent(raw)).toEqual([]);
    });
  });

  describe('assistant events', () => {
    it('should decompose text content blocks into message events', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'I will implement the webhook retry.' },
          ],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.message');
      expect(events[0].content).toBe('I will implement the webhook retry.');
    });

    it('should convert thinking blocks to thinking events', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'Let me read the file...' },
            { type: 'text', text: 'I see the issue.' },
          ],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('event.thinking');
      expect(events[1].type).toBe('event.message');
    });

    it('should translate Edit tool_use to file_diff event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tu_01',
              name: 'Edit',
              input: {
                file_path: '/workspace/src/service.ts',
                old_string: 'async fire(url)',
                new_string: 'async fire(url, retries = 3)',
              },
            },
          ],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.file_diff');
      expect(events[0].toolUseId).toBe('tu_01');
      expect(events[0].path).toBe('src/service.ts');
      expect(events[0].oldString).toBe('async fire(url)');
      expect(events[0].newString).toBe('async fire(url, retries = 3)');
    });

    it('should translate Bash tool_use to bash event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tu_02',
              name: 'Bash',
              input: { command: 'npm test' },
            },
          ],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.bash');
      expect(events[0].command).toBe('npm test');
    });

    it('should translate Read tool_use to tool_use event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tu_03',
              name: 'Read',
              input: { file_path: '/workspace/src/service.ts' },
            },
          ],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.tool_use');
      expect(events[0].tool).toBe('Read');
      expect(events[0].path).toBe('src/service.ts');
    });

    it('should translate Write tool_use to file_create event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tu_04',
              name: 'Write',
              input: { file_path: '/workspace/src/new-file.ts', content: 'export class Foo {}' },
            },
          ],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.file_create');
      expect(events[0].path).toBe('src/new-file.ts');
    });

    it('should translate unknown tools to unknown_tool event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tu_05',
              name: 'SomeFutureTool',
              input: { foo: 'bar' },
            },
          ],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.unknown_tool');
      expect(events[0].tool).toBe('SomeFutureTool');
    });
  });

  describe('tool_result events', () => {
    it('should map tool_result to tool_result event with truncation', () => {
      const longOutput = 'x'.repeat(6000);
      const raw: RawCliEvent = {
        type: 'tool_result',
        tool_use_id: 'tu_01',
        content: longOutput,
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.tool_result');
      expect(events[0].toolUseId).toBe('tu_01');
      expect(events[0].output!.length).toBe(5000);
      expect(events[0].truncated).toBe(true);
    });

    it('should not truncate short output', () => {
      const raw: RawCliEvent = {
        type: 'tool_result',
        tool_use_id: 'tu_01',
        content: 'short output',
      };
      const events = translateEvent(raw);
      expect(events[0].truncated).toBe(false);
    });
  });

  describe('result events', () => {
    it('should map result to summary event', () => {
      const raw: RawCliEvent = {
        type: 'result',
        subtype: 'success',
        cost_usd: 0.47,
        duration_ms: 34000,
        num_turns: 5,
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.summary');
      expect(events[0].costUsd).toBe(0.47);
      expect(events[0].durationMs).toBe(34000);
    });
  });

  describe('path stripping', () => {
    it('should strip /workspace/ prefix from file paths', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'tu_01',
              name: 'Read',
              input: { file_path: '/workspace/src/deep/path/file.ts' },
            },
          ],
        },
      };
      const events = translateEvent(raw);
      expect(events[0].path).toBe('src/deep/path/file.ts');
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && npx jest src/sessions/application/services/__tests__/EventTranslator.spec.ts --no-coverage`
Expected: FAIL — `Cannot find module '../EventTranslator'`

- [ ] **Step 4: Implement EventTranslator**

Add the `translateEvent` function to the file created in Step 1:

```typescript
// Append to backend/src/sessions/application/services/EventTranslator.ts

const MAX_OUTPUT_LENGTH = 5000;

function stripWorkspacePath(filePath: string): string {
  return filePath.replace(/^\/workspace\//, '');
}

function translateToolUse(block: { id?: string; name?: string; input?: Record<string, unknown> }): UiEvent {
  const toolUseId = block.id;
  const toolName = block.name ?? 'unknown';
  const input = block.input ?? {};

  switch (toolName) {
    case 'Edit':
      return {
        type: 'event.file_diff',
        toolUseId,
        tool: 'Edit',
        path: stripWorkspacePath((input.file_path as string) ?? ''),
        oldString: (input.old_string as string) ?? '',
        newString: (input.new_string as string) ?? '',
      };

    case 'Write':
      return {
        type: 'event.file_create',
        toolUseId,
        tool: 'Write',
        path: stripWorkspacePath((input.file_path as string) ?? ''),
        content: (input.content as string) ?? '',
      };

    case 'Bash':
      return {
        type: 'event.bash',
        toolUseId,
        tool: 'Bash',
        command: (input.command as string) ?? '',
      };

    case 'Read':
      return {
        type: 'event.tool_use',
        toolUseId,
        tool: 'Read',
        path: stripWorkspacePath((input.file_path as string) ?? ''),
      };

    case 'Glob':
    case 'Grep':
      return {
        type: 'event.search',
        toolUseId,
        tool: toolName,
        params: input,
      };

    default:
      return {
        type: 'event.unknown_tool',
        toolUseId,
        tool: toolName,
        params: input,
      };
  }
}

export function translateEvent(raw: RawCliEvent): UiEvent[] {
  switch (raw.type) {
    case 'system':
      return [];

    case 'assistant': {
      if (!raw.message?.content) return [];
      return raw.message.content.flatMap((block): UiEvent[] => {
        switch (block.type) {
          case 'thinking':
            return [{ type: 'event.thinking' }];
          case 'text':
            if (!block.text?.trim()) return [];
            return [{ type: 'event.message', content: block.text }];
          case 'tool_use':
            return [translateToolUse(block)];
          default:
            return [];
        }
      });
    }

    case 'tool_result': {
      const output = raw.content ?? '';
      const truncated = output.length > MAX_OUTPUT_LENGTH;
      return [{
        type: 'event.tool_result',
        toolUseId: raw.tool_use_id,
        output: truncated ? output.slice(0, MAX_OUTPUT_LENGTH) : output,
        truncated,
      }];
    }

    case 'result':
      return [{
        type: 'event.summary',
        costUsd: raw.cost_usd,
        durationMs: raw.duration_ms,
        numTurns: raw.num_turns,
      }];

    default:
      return [];
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && npx jest src/sessions/application/services/__tests__/EventTranslator.spec.ts --no-coverage`
Expected: All 11 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/sessions/application/services/EventTranslator.ts backend/src/sessions/application/services/__tests__/EventTranslator.spec.ts
git commit -m "feat(sessions): add EventTranslator for stream-json parsing"
```

---

### Task 3: Billing Domain — UsageQuota Entity

**Files:**
- Create: `backend/src/billing/domain/UsageQuota.ts`
- Test: `backend/src/billing/domain/__tests__/UsageQuota.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
// backend/src/billing/domain/__tests__/UsageQuota.spec.ts
import { UsageQuota } from '../UsageQuota';

describe('UsageQuota', () => {
  describe('createDefault', () => {
    it('should create a free tier quota with 2 developments', () => {
      const quota = UsageQuota.createDefault('team-1', '2026-03');
      expect(quota.limit).toBe(2);
      expect(quota.used).toBe(0);
      expect(quota.remaining).toBe(2);
      expect(quota.period).toBe('2026-03');
    });
  });

  describe('canStartSession', () => {
    it('should return true when quota is available', () => {
      const quota = UsageQuota.createForPlan('team-1', '2026-03', 'pro');
      expect(quota.canStartSession()).toBe(true);
    });

    it('should return false when quota is exhausted', () => {
      const quota = UsageQuota.createDefault('team-1', '2026-03');
      quota.deduct();
      quota.deduct();
      expect(quota.canStartSession()).toBe(false);
    });
  });

  describe('deduct', () => {
    it('should decrement remaining count', () => {
      const quota = UsageQuota.createForPlan('team-1', '2026-03', 'pro');
      expect(quota.remaining).toBe(20);
      quota.deduct();
      expect(quota.remaining).toBe(19);
      expect(quota.used).toBe(1);
    });

    it('should throw when no quota remaining', () => {
      const quota = UsageQuota.createDefault('team-1', '2026-03');
      quota.deduct();
      quota.deduct();
      expect(() => quota.deduct()).toThrow('No development quota remaining');
    });
  });

  describe('plan limits', () => {
    it('free: 2 developments', () => {
      expect(UsageQuota.createForPlan('t', '2026-03', 'free').limit).toBe(2);
    });
    it('pro: 20 developments', () => {
      expect(UsageQuota.createForPlan('t', '2026-03', 'pro').limit).toBe(20);
    });
    it('team: 50 developments', () => {
      expect(UsageQuota.createForPlan('t', '2026-03', 'team').limit).toBe(50);
    });
    it('scale: 100 developments (fair use)', () => {
      expect(UsageQuota.createForPlan('t', '2026-03', 'scale').limit).toBe(100);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/billing/domain/__tests__/UsageQuota.spec.ts --no-coverage`
Expected: FAIL

- [ ] **Step 3: Implement UsageQuota**

```typescript
// backend/src/billing/domain/UsageQuota.ts

export type PlanTier = 'free' | 'pro' | 'team' | 'scale';

const PLAN_LIMITS: Record<PlanTier, number> = {
  free: 2,
  pro: 20,
  team: 50,
  scale: 100,
};

export class UsageQuota {
  private constructor(
    private readonly _teamId: string,
    private readonly _period: string,
    private readonly _limit: number,
    private _used: number,
  ) {}

  static createDefault(teamId: string, period: string): UsageQuota {
    return new UsageQuota(teamId, period, PLAN_LIMITS.free, 0);
  }

  static createForPlan(teamId: string, period: string, plan: PlanTier): UsageQuota {
    return new UsageQuota(teamId, period, PLAN_LIMITS[plan], 0);
  }

  static reconstitute(props: {
    teamId: string;
    period: string;
    limit: number;
    used: number;
  }): UsageQuota {
    return new UsageQuota(props.teamId, props.period, props.limit, props.used);
  }

  canStartSession(): boolean {
    return this._used < this._limit;
  }

  deduct(): void {
    if (!this.canStartSession()) {
      throw new Error('No development quota remaining');
    }
    this._used += 1;
  }

  get teamId(): string { return this._teamId; }
  get period(): string { return this._period; }
  get limit(): number { return this._limit; }
  get used(): number { return this._used; }
  get remaining(): number { return Math.max(0, this._limit - this._used); }

  toPlainObject(): Record<string, unknown> {
    return {
      teamId: this._teamId,
      period: this._period,
      limit: this._limit,
      used: this._used,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest src/billing/domain/__tests__/UsageQuota.spec.ts --no-coverage`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/billing/
git commit -m "feat(billing): add UsageQuota domain entity with plan limits"
```

---

### Task 4: ComplexityAnalyzer (Pure Function)

**Files:**
- Create: `backend/src/sessions/application/services/ComplexityAnalyzer.ts`
- Test: `backend/src/sessions/application/services/__tests__/ComplexityAnalyzer.spec.ts`

- [ ] **Step 1: Write failing test**

```typescript
// backend/src/sessions/application/services/__tests__/ComplexityAnalyzer.spec.ts
import { analyzeComplexity, ComplexityResult } from '../ComplexityAnalyzer';

describe('ComplexityAnalyzer', () => {
  it('should recommend cloud for small tickets (few file changes)', () => {
    const result = analyzeComplexity({
      fileChangeCount: 3,
      acceptanceCriteriaCount: 2,
      scopeEstimate: 'small',
      specText: 'Add a button to the settings page',
    });
    expect(result.recommendation).toBe('cloud');
    expect(result.eligible).toBe(true);
  });

  it('should recommend developer for many file changes', () => {
    const result = analyzeComplexity({
      fileChangeCount: 15,
      acceptanceCriteriaCount: 4,
      scopeEstimate: 'medium',
      specText: 'Refactor the auth module',
    });
    expect(result.recommendation).toBe('developer');
    expect(result.eligible).toBe(false);
  });

  it('should recommend developer for architectural keywords', () => {
    const result = analyzeComplexity({
      fileChangeCount: 5,
      acceptanceCriteriaCount: 3,
      scopeEstimate: 'medium',
      specText: 'Migrate the database schema to support multi-tenancy',
    });
    expect(result.recommendation).toBe('developer');
    expect(result.reason).toContain('architectural');
  });

  it('should recommend developer for large scope estimate', () => {
    const result = analyzeComplexity({
      fileChangeCount: 8,
      acceptanceCriteriaCount: 10,
      scopeEstimate: 'large',
      specText: 'Add reporting dashboard',
    });
    expect(result.recommendation).toBe('developer');
  });

  it('should recommend cloud for medium scope with few files', () => {
    const result = analyzeComplexity({
      fileChangeCount: 6,
      acceptanceCriteriaCount: 5,
      scopeEstimate: 'medium',
      specText: 'Add rate limiting to API endpoints',
    });
    expect(result.recommendation).toBe('cloud');
    expect(result.eligible).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/sessions/application/services/__tests__/ComplexityAnalyzer.spec.ts --no-coverage`
Expected: FAIL

- [ ] **Step 3: Implement ComplexityAnalyzer**

```typescript
// backend/src/sessions/application/services/ComplexityAnalyzer.ts

const ARCHITECTURAL_KEYWORDS = [
  'migration', 'migrate', 'schema', 'refactor', 'redesign',
  'rewrite', 'overhaul', 'restructure', 'multi-tenancy',
  'breaking change', 'database change',
];

const FILE_CHANGE_THRESHOLD = 12;
const ACCEPTANCE_CRITERIA_THRESHOLD = 8;

export interface ComplexityInput {
  fileChangeCount: number;
  acceptanceCriteriaCount: number;
  scopeEstimate: 'small' | 'medium' | 'large';
  specText: string;
}

export interface ComplexityResult {
  recommendation: 'cloud' | 'developer';
  eligible: boolean;
  reason: string;
}

export function analyzeComplexity(input: ComplexityInput): ComplexityResult {
  const specLower = input.specText.toLowerCase();

  if (input.fileChangeCount > FILE_CHANGE_THRESHOLD) {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: `High file count (${input.fileChangeCount} files). Assign a developer for best results.`,
    };
  }

  const hasArchitecturalKeywords = ARCHITECTURAL_KEYWORDS.some(kw => specLower.includes(kw));
  if (hasArchitecturalKeywords) {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: 'This ticket involves architectural changes. Assign a developer for best results.',
    };
  }

  if (input.acceptanceCriteriaCount > ACCEPTANCE_CRITERIA_THRESHOLD) {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: `High acceptance criteria count (${input.acceptanceCriteriaCount}). Assign a developer for best results.`,
    };
  }

  if (input.scopeEstimate === 'large') {
    return {
      recommendation: 'developer',
      eligible: false,
      reason: 'Large scope estimate. Assign a developer for best results.',
    };
  }

  return {
    recommendation: 'cloud',
    eligible: true,
    reason: 'This ticket is a good fit for Cloud Develop.',
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest src/sessions/application/services/__tests__/ComplexityAnalyzer.spec.ts --no-coverage`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/sessions/application/services/ComplexityAnalyzer.ts backend/src/sessions/application/services/__tests__/ComplexityAnalyzer.spec.ts
git commit -m "feat(sessions): add ComplexityAnalyzer for cloud eligibility gating"
```

---

### Task 5: Frontend Session Types + Store Shell

**Files:**
- Create: `client/src/sessions/types/session.types.ts`
- Create: `client/src/sessions/stores/session.store.ts`

This task creates the shared types and an SSE-consuming Zustand store. No backend needed — works with any SSE endpoint that emits the defined event types.

- [ ] **Step 1: Create session types**

```typescript
// client/src/sessions/types/session.types.ts

export type SessionStatus = 'idle' | 'provisioning' | 'running' | 'completed' | 'failed' | 'cancelled';

export type SessionEventType =
  | 'session.status'
  | 'event.message'
  | 'event.thinking'
  | 'event.tool_use'
  | 'event.file_diff'
  | 'event.file_create'
  | 'event.bash'
  | 'event.search'
  | 'event.tool_result'
  | 'event.summary'
  | 'event.unknown_tool';

export interface SessionEvent {
  id: string;
  type: SessionEventType;
  timestamp: string;
  content?: string;
  tool?: string;
  toolUseId?: string;
  path?: string;
  command?: string;
  oldString?: string;
  newString?: string;
  output?: string;
  truncated?: boolean;
  costUsd?: number;
  durationMs?: number;
  numTurns?: number;
  params?: Record<string, unknown>;
  completed?: boolean;
}

export interface SessionSummary {
  prUrl: string | null;
  prNumber: number | null;
  filesChanged: number;
  costUsd: number;
  durationMs: number;
}

export interface QuotaInfo {
  remaining: number;
  limit: number;
  plan: string;
}
```

- [ ] **Step 2: Create session store**

```typescript
// client/src/sessions/stores/session.store.ts
import { create } from 'zustand';
import { auth } from '@/lib/firebase';
import { useTeamStore } from '@/teams/stores/team.store';
import type { SessionStatus, SessionEvent, SessionSummary, QuotaInfo } from '../types/session.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

let _sessionAbortController: AbortController | undefined;

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const user = auth.currentUser;
  const incomingHeaders = (init?.headers as Record<string, string>) || {};
  const headers: Record<string, string> = { ...incomingHeaders };

  if (!('Content-Type' in headers) && !('content-type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const teamId = useTeamStore.getState().currentTeam?.id;
  if (teamId) {
    headers['x-team-id'] = teamId;
  }

  return fetch(`${API_URL}${path}`, { ...init, headers });
}

let _eventCounter = 0;

interface SessionState {
  sessionId: string | null;
  ticketId: string | null;
  status: SessionStatus;
  events: SessionEvent[];
  pendingTools: Map<string, number>;
  summary: SessionSummary | null;
  error: string | null;
  elapsedSeconds: number;
  quota: QuotaInfo | null;

  startSession: (ticketId: string) => Promise<void>;
  cancelSession: () => Promise<void>;
  fetchQuota: () => Promise<void>;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: null,
  ticketId: null,
  status: 'idle',
  events: [],
  pendingTools: new Map(),
  summary: null,
  error: null,
  elapsedSeconds: 0,
  quota: null,

  startSession: async (ticketId: string) => {
    const state = get();
    if (state.status === 'running' || state.status === 'provisioning') return;

    const abortController = new AbortController();
    _sessionAbortController = abortController;
    _eventCounter = 0;

    set({
      ticketId,
      status: 'provisioning',
      events: [],
      pendingTools: new Map(),
      summary: null,
      error: null,
      elapsedSeconds: 0,
    });

    // Start elapsed timer
    const timerInterval = setInterval(() => {
      const s = get();
      if (s.status === 'running' || s.status === 'provisioning') {
        set({ elapsedSeconds: s.elapsedSeconds + 1 });
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);

    try {
      const response = await authFetch(`/sessions/${ticketId}/start`, {
        method: 'POST',
        signal: abortController.signal,
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error((body as Record<string, string>).message || `Failed to start session`);
        }
        return;
      }

      set({ status: 'running' });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const dataLine = part.split('\n').find(line => line.startsWith('data: '));
          if (!dataLine) continue;

          let event: SessionEvent;
          try {
            const parsed = JSON.parse(dataLine.slice(6));
            event = { ...parsed, id: `evt_${++_eventCounter}`, timestamp: new Date().toISOString() };
          } catch {
            continue;
          }

          const currentState = get();

          if (event.type === 'session.status') {
            const newStatus = (event.content as unknown as SessionStatus) || currentState.status;
            set({ status: newStatus, sessionId: event.toolUseId || currentState.sessionId });
            continue;
          }

          if (event.type === 'event.summary') {
            set({
              status: 'completed',
              summary: {
                prUrl: null,
                prNumber: null,
                filesChanged: event.numTurns ?? 0,
                costUsd: event.costUsd ?? 0,
                durationMs: event.durationMs ?? 0,
              },
            });
            clearInterval(timerInterval);
            continue;
          }

          if (event.type === 'event.tool_result' && event.toolUseId) {
            const toolIndex = currentState.pendingTools.get(event.toolUseId);
            if (toolIndex !== undefined) {
              const updatedEvents = [...currentState.events];
              updatedEvents[toolIndex] = {
                ...updatedEvents[toolIndex],
                output: event.output,
                truncated: event.truncated,
                completed: true,
              };
              const newPending = new Map(currentState.pendingTools);
              newPending.delete(event.toolUseId);
              set({ events: updatedEvents, pendingTools: newPending });
              continue;
            }
          }

          // Regular event — append to list
          const newEvents = [...currentState.events, event];
          const newPending = new Map(currentState.pendingTools);
          if (event.toolUseId && event.type !== 'event.tool_result') {
            newPending.set(event.toolUseId, newEvents.length - 1);
          }
          set({ events: newEvents, pendingTools: newPending });
        }
      }

      // Stream ended
      _sessionAbortController = undefined;
      const finalState = get();
      if (finalState.status === 'running') {
        set({ status: 'completed' });
      }
      clearInterval(timerInterval);
    } catch (error) {
      _sessionAbortController = undefined;
      clearInterval(timerInterval);

      if (error instanceof DOMException && error.name === 'AbortError') {
        set({ status: 'cancelled', error: null });
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ status: 'failed', error: errorMessage });
    }
  },

  cancelSession: async () => {
    if (_sessionAbortController) {
      _sessionAbortController.abort();
      _sessionAbortController = undefined;
    }

    const { sessionId } = get();
    if (sessionId) {
      try {
        await authFetch(`/sessions/${sessionId}/cancel`, { method: 'POST' });
      } catch {
        // Best-effort cancellation
      }
    }

    set({ status: 'cancelled', error: null });
  },

  fetchQuota: async () => {
    try {
      const res = await authFetch('/billing/quota');
      if (!res.ok) return;
      const data = await res.json();
      set({ quota: data as QuotaInfo });
    } catch {
      // Silently fail
    }
  },

  reset: () => {
    if (_sessionAbortController) {
      _sessionAbortController.abort();
      _sessionAbortController = undefined;
    }
    set({
      sessionId: null,
      ticketId: null,
      status: 'idle',
      events: [],
      pendingTools: new Map(),
      summary: null,
      error: null,
      elapsedSeconds: 0,
    });
  },
}));
```

- [ ] **Step 3: Commit**

```bash
git add client/src/sessions/
git commit -m "feat(sessions): add session types and SSE-consuming Zustand store"
```

---

### WAVE 2 — Infrastructure (depends on Wave 1 types)

These tasks implement ports, repositories, and the NestJS module wiring. They depend on Wave 1 domain entities being defined.

---

### Task 6: Session Ports + Repository + Mapper + Module

**Files:**
- Create: `backend/src/sessions/application/ports/SessionRepository.port.ts`
- Create: `backend/src/sessions/application/ports/SandboxPort.ts`
- Create: `backend/src/sessions/application/ports/index.ts`
- Create: `backend/src/sessions/infrastructure/mappers/SessionMapper.ts`
- Create: `backend/src/sessions/infrastructure/persistence/FirestoreSessionRepository.ts`
- Create: `backend/src/sessions/sessions.module.ts`

- [ ] **Step 1: Create ports**

```typescript
// backend/src/sessions/application/ports/SessionRepository.port.ts
import { Session } from '../../domain/Session';

export interface SessionRepository {
  save(session: Session): Promise<void>;
  findById(sessionId: string, teamId: string): Promise<Session | null>;
  findActiveByTicket(ticketId: string, teamId: string): Promise<Session | null>;
  findActiveByUser(userId: string, teamId: string): Promise<Session[]>;
}

export const SESSION_REPOSITORY = Symbol('SessionRepository');
```

```typescript
// backend/src/sessions/application/ports/SandboxPort.ts
export interface SandboxConfig {
  anthropicApiKey: string;
  githubToken: string;
  forgeApiUrl: string;
  forgeSessionJwt: string;
  ticketId: string;
  repoUrl: string;
  branch: string;
  systemPrompt: string;
  maxDurationMs: number;
}

export interface SandboxHandle {
  id: string;
  onStdout(handler: (line: string) => void): void;
  onStderr(handler: (line: string) => void): void;
  onExit(handler: (code: number) => void): void;
  destroy(): Promise<void>;
}

export interface SandboxPort {
  create(config: SandboxConfig): Promise<SandboxHandle>;
}

export const SANDBOX_PORT = Symbol('SandboxPort');
```

```typescript
// backend/src/sessions/application/ports/index.ts
export { SessionRepository, SESSION_REPOSITORY } from './SessionRepository.port';
export { SandboxPort, SandboxHandle, SandboxConfig, SANDBOX_PORT } from './SandboxPort';
```

- [ ] **Step 2: Create SessionMapper**

```typescript
// backend/src/sessions/infrastructure/mappers/SessionMapper.ts
import { Timestamp } from 'firebase-admin/firestore';
import { Session } from '../../domain/Session';
import { SessionStatus } from '../../domain/SessionStatus';

function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value && typeof (value as { _seconds: number })._seconds === 'number') {
    return new Date((value as { _seconds: number })._seconds * 1000);
  }
  return new Date(value as string | number);
}

export interface SessionDocument {
  id: string;
  ticketId: string;
  teamId: string;
  userId: string;
  ticketTitle: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  status: string;
  sandboxId: string | null;
  error: string | null;
  costUsd: number | null;
  prUrl: string | null;
  prNumber: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}

export class SessionMapper {
  static toDomain(doc: SessionDocument): Session {
    return Session.reconstitute({
      id: doc.id,
      ticketId: doc.ticketId,
      teamId: doc.teamId,
      userId: doc.userId,
      ticketTitle: doc.ticketTitle,
      repoOwner: doc.repoOwner,
      repoName: doc.repoName,
      branch: doc.branch,
      status: doc.status as SessionStatus,
      sandboxId: doc.sandboxId ?? null,
      error: doc.error ?? null,
      costUsd: doc.costUsd ?? null,
      prUrl: doc.prUrl ?? null,
      prNumber: doc.prNumber ?? null,
      createdAt: toDate(doc.createdAt),
      updatedAt: toDate(doc.updatedAt),
      completedAt: doc.completedAt ? toDate(doc.completedAt) : null,
    });
  }

  static toFirestore(session: Session): SessionDocument {
    return {
      id: session.id,
      ticketId: session.ticketId,
      teamId: session.teamId,
      userId: session.userId,
      ticketTitle: session.ticketTitle,
      repoOwner: session.repoOwner,
      repoName: session.repoName,
      branch: session.branch,
      status: session.status,
      sandboxId: session.sandboxId,
      error: session.error,
      costUsd: session.costUsd,
      prUrl: session.prUrl,
      prNumber: session.prNumber,
      createdAt: Timestamp.fromDate(session.createdAt),
      updatedAt: Timestamp.fromDate(session.updatedAt),
      completedAt: session.completedAt ? Timestamp.fromDate(session.completedAt) : null,
    };
  }
}
```

- [ ] **Step 3: Create FirestoreSessionRepository**

Follow the exact pattern from `FirestoreJobRepository.ts`. Collection path: `teams/{teamId}/sessions/{sessionId}`.

```typescript
// backend/src/sessions/infrastructure/persistence/FirestoreSessionRepository.ts
import { Injectable } from '@nestjs/common';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { SessionRepository } from '../../application/ports/SessionRepository.port';
import { Session } from '../../domain/Session';
import { SessionMapper, SessionDocument } from '../mappers/SessionMapper';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

@Injectable()
export class FirestoreSessionRepository implements SessionRepository {
  private firestore: Firestore | null = null;

  constructor(private readonly firebaseService: FirebaseService) {}

  private getFirestore(): Firestore {
    if (!this.firestore) {
      this.firestore = this.firebaseService.getFirestore();
    }
    return this.firestore;
  }

  async save(session: Session): Promise<void> {
    const firestore = this.getFirestore();
    const doc = SessionMapper.toFirestore(session);

    try {
      await firestore
        .collection('teams')
        .doc(session.teamId)
        .collection('sessions')
        .doc(session.id)
        .set(doc as FirebaseFirestore.DocumentData, { merge: true });
    } catch (error) {
      console.error(`[FirestoreSessionRepository] save error for ${session.id}:`, error);
      throw error;
    }
  }

  async findById(sessionId: string, teamId: string): Promise<Session | null> {
    const firestore = this.getFirestore();

    try {
      const snap = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('sessions')
        .doc(sessionId)
        .get();

      if (!snap.exists) return null;
      return SessionMapper.toDomain(snap.data() as SessionDocument);
    } catch (error) {
      console.error(`[FirestoreSessionRepository] findById error for ${sessionId}:`, error);
      return null;
    }
  }

  async findActiveByTicket(ticketId: string, teamId: string): Promise<Session | null> {
    const firestore = this.getFirestore();

    try {
      const snapshot = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('sessions')
        .where('ticketId', '==', ticketId)
        .get();

      const activeStatuses = new Set(['provisioning', 'running']);
      const match = snapshot.docs
        .map(doc => SessionMapper.toDomain(doc.data() as SessionDocument))
        .find(session => activeStatuses.has(session.status));

      return match ?? null;
    } catch (error) {
      console.error(`[FirestoreSessionRepository] findActiveByTicket error for ${ticketId}:`, error);
      return null;
    }
  }

  async findActiveByUser(userId: string, teamId: string): Promise<Session[]> {
    const firestore = this.getFirestore();

    try {
      const snapshot = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('sessions')
        .where('userId', '==', userId)
        .get();

      const activeStatuses = new Set(['provisioning', 'running']);
      return snapshot.docs
        .map(doc => SessionMapper.toDomain(doc.data() as SessionDocument))
        .filter(session => activeStatuses.has(session.status));
    } catch (error) {
      console.error(`[FirestoreSessionRepository] findActiveByUser error for ${userId}:`, error);
      return [];
    }
  }
}
```

- [ ] **Step 4: Create sessions.module.ts (shell — use cases added in Wave 3)**

```typescript
// backend/src/sessions/sessions.module.ts
import { Module } from '@nestjs/common';
import { SESSION_REPOSITORY } from './application/ports';
import { FirestoreSessionRepository } from './infrastructure/persistence/FirestoreSessionRepository';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: SESSION_REPOSITORY,
      useClass: FirestoreSessionRepository,
    },
  ],
  exports: [SESSION_REPOSITORY],
})
export class SessionsModule {}
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/sessions/application/ports/ backend/src/sessions/infrastructure/ backend/src/sessions/sessions.module.ts
git commit -m "feat(sessions): add ports, Firestore repository, mapper, and module shell"
```

---

### Task 7: Billing Ports + Repository + Module

**Files:**
- Create: `backend/src/billing/application/ports/UsageQuotaRepository.port.ts`
- Create: `backend/src/billing/application/ports/index.ts`
- Create: `backend/src/billing/infrastructure/mappers/UsageQuotaMapper.ts`
- Create: `backend/src/billing/infrastructure/persistence/FirestoreUsageQuotaRepository.ts`
- Create: `backend/src/billing/billing.module.ts`

Follow the exact same patterns as Task 6 but for UsageQuota. Collection: `teams/{teamId}/usage/{period}`.

- [ ] **Step 1: Create port**

```typescript
// backend/src/billing/application/ports/UsageQuotaRepository.port.ts
import { UsageQuota } from '../../domain/UsageQuota';

export interface UsageQuotaRepository {
  getOrCreate(teamId: string, period: string): Promise<UsageQuota>;
  save(quota: UsageQuota): Promise<void>;
}

export const USAGE_QUOTA_REPOSITORY = Symbol('UsageQuotaRepository');
```

```typescript
// backend/src/billing/application/ports/index.ts
export { UsageQuotaRepository, USAGE_QUOTA_REPOSITORY } from './UsageQuotaRepository.port';
```

- [ ] **Step 2: Create UsageQuotaMapper**

```typescript
// backend/src/billing/infrastructure/mappers/UsageQuotaMapper.ts
import { UsageQuota } from '../../domain/UsageQuota';

export interface UsageQuotaDocument {
  teamId: string;
  period: string;
  limit: number;
  used: number;
}

export class UsageQuotaMapper {
  static toDomain(doc: UsageQuotaDocument): UsageQuota {
    return UsageQuota.reconstitute({
      teamId: doc.teamId,
      period: doc.period,
      limit: doc.limit,
      used: doc.used,
    });
  }

  static toFirestore(quota: UsageQuota): UsageQuotaDocument {
    return {
      teamId: quota.teamId,
      period: quota.period,
      limit: quota.limit,
      used: quota.used,
    };
  }
}
```

- [ ] **Step 3: Create FirestoreUsageQuotaRepository**

```typescript
// backend/src/billing/infrastructure/persistence/FirestoreUsageQuotaRepository.ts
import { Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { UsageQuotaRepository } from '../../application/ports/UsageQuotaRepository.port';
import { UsageQuota } from '../../domain/UsageQuota';
import { UsageQuotaMapper, UsageQuotaDocument } from '../mappers/UsageQuotaMapper';
import { FirebaseService } from '../../../shared/infrastructure/firebase/firebase.config';

@Injectable()
export class FirestoreUsageQuotaRepository implements UsageQuotaRepository {
  private firestore: Firestore | null = null;

  constructor(private readonly firebaseService: FirebaseService) {}

  private getFirestore(): Firestore {
    if (!this.firestore) {
      this.firestore = this.firebaseService.getFirestore();
    }
    return this.firestore;
  }

  async getOrCreate(teamId: string, period: string): Promise<UsageQuota> {
    const firestore = this.getFirestore();

    try {
      const snap = await firestore
        .collection('teams')
        .doc(teamId)
        .collection('usage')
        .doc(period)
        .get();

      if (snap.exists) {
        return UsageQuotaMapper.toDomain(snap.data() as UsageQuotaDocument);
      }

      const quota = UsageQuota.createDefault(teamId, period);
      await this.save(quota);
      return quota;
    } catch (error) {
      console.error(`[FirestoreUsageQuotaRepository] getOrCreate error:`, error);
      return UsageQuota.createDefault(teamId, period);
    }
  }

  async save(quota: UsageQuota): Promise<void> {
    const firestore = this.getFirestore();
    const doc = UsageQuotaMapper.toFirestore(quota);

    try {
      await firestore
        .collection('teams')
        .doc(quota.teamId)
        .collection('usage')
        .doc(quota.period)
        .set(doc as FirebaseFirestore.DocumentData, { merge: true });
    } catch (error) {
      console.error(`[FirestoreUsageQuotaRepository] save error:`, error);
      throw error;
    }
  }
}
```

- [ ] **Step 4: Create billing.module.ts**

```typescript
// backend/src/billing/billing.module.ts
import { Module } from '@nestjs/common';
import { USAGE_QUOTA_REPOSITORY } from './application/ports';
import { FirestoreUsageQuotaRepository } from './infrastructure/persistence/FirestoreUsageQuotaRepository';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: USAGE_QUOTA_REPOSITORY,
      useClass: FirestoreUsageQuotaRepository,
    },
  ],
  exports: [USAGE_QUOTA_REPOSITORY],
})
export class BillingModule {}
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/billing/
git commit -m "feat(billing): add UsageQuota port, Firestore repository, mapper, and module"
```

---

### WAVE 3 — Use Cases + Controller (depends on Wave 2)

These tasks implement the business logic and HTTP endpoints. They require Wave 2 ports and repositories.

---

### Task 8: StartSessionUseCase + CancelSessionUseCase

**Files:**
- Create: `backend/src/sessions/application/use-cases/StartSessionUseCase.ts`
- Create: `backend/src/sessions/application/use-cases/CancelSessionUseCase.ts`
- Test: `backend/src/sessions/application/use-cases/__tests__/StartSessionUseCase.spec.ts`

- [ ] **Step 1: Write failing test for StartSessionUseCase**

Test that it: validates ticket status, checks quota, checks for existing active session, creates a new session entity.

```typescript
// backend/src/sessions/application/use-cases/__tests__/StartSessionUseCase.spec.ts
import { StartSessionUseCase } from '../StartSessionUseCase';
import { Session } from '../../../domain/Session';
import { SessionStatus } from '../../../domain/SessionStatus';
import { UsageQuota } from '../../../../billing/domain/UsageQuota';

describe('StartSessionUseCase', () => {
  const mockSessionRepo = {
    save: jest.fn(),
    findById: jest.fn(),
    findActiveByTicket: jest.fn().mockResolvedValue(null),
    findActiveByUser: jest.fn().mockResolvedValue([]),
  };

  const mockQuotaRepo = {
    getOrCreate: jest.fn().mockResolvedValue(UsageQuota.createForPlan('team-1', '2026-03', 'pro')),
    save: jest.fn(),
  };

  const mockAecRepo = {
    findById: jest.fn().mockResolvedValue({
      id: 'aec-123',
      teamId: 'team-1',
      status: 'approved',
      title: 'Add webhook retry',
      projectProfile: { repoOwner: 'acme', repoName: 'api', branch: 'main' },
    }),
    save: jest.fn(),
  };

  let useCase: StartSessionUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new StartSessionUseCase(
      mockSessionRepo as any,
      mockQuotaRepo as any,
      mockAecRepo as any,
    );
  });

  it('should create a session for an approved ticket', async () => {
    const result = await useCase.execute({
      ticketId: 'aec-123',
      userId: 'user-1',
      teamId: 'team-1',
    });

    expect(result.sessionId).toMatch(/^session_/);
    expect(mockSessionRepo.save).toHaveBeenCalledTimes(1);
    const savedSession = mockSessionRepo.save.mock.calls[0][0] as Session;
    expect(savedSession.status).toBe(SessionStatus.PROVISIONING);
    expect(savedSession.ticketId).toBe('aec-123');
  });

  it('should throw if ticket is not approved', async () => {
    mockAecRepo.findById.mockResolvedValueOnce({
      ...mockAecRepo.findById(),
      status: 'draft',
    });

    await expect(useCase.execute({
      ticketId: 'aec-123',
      userId: 'user-1',
      teamId: 'team-1',
    })).rejects.toThrow(/approved/i);
  });

  it('should throw if quota is exhausted', async () => {
    const exhaustedQuota = UsageQuota.createDefault('team-1', '2026-03');
    exhaustedQuota.deduct();
    exhaustedQuota.deduct();
    mockQuotaRepo.getOrCreate.mockResolvedValueOnce(exhaustedQuota);

    await expect(useCase.execute({
      ticketId: 'aec-123',
      userId: 'user-1',
      teamId: 'team-1',
    })).rejects.toThrow(/quota/i);
  });

  it('should throw if ticket already has an active session', async () => {
    mockSessionRepo.findActiveByTicket.mockResolvedValueOnce(
      Session.createNew({
        ticketId: 'aec-123',
        teamId: 'team-1',
        userId: 'user-1',
        ticketTitle: 'Test',
        repoOwner: 'acme',
        repoName: 'api',
        branch: 'feat/test',
      }),
    );

    await expect(useCase.execute({
      ticketId: 'aec-123',
      userId: 'user-1',
      teamId: 'team-1',
    })).rejects.toThrow(/active session/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest src/sessions/application/use-cases/__tests__/StartSessionUseCase.spec.ts --no-coverage`
Expected: FAIL

- [ ] **Step 3: Implement StartSessionUseCase**

```typescript
// backend/src/sessions/application/use-cases/StartSessionUseCase.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SessionRepository, SESSION_REPOSITORY } from '../ports/SessionRepository.port';
import { USAGE_QUOTA_REPOSITORY } from '../../../billing/application/ports';
import type { UsageQuotaRepository } from '../../../billing/application/ports/UsageQuotaRepository.port';
import { AEC_REPOSITORY } from '../../../tickets/application/ports/AECRepository';
import { Session } from '../../domain/Session';

export interface StartSessionCommand {
  ticketId: string;
  userId: string;
  teamId: string;
}

@Injectable()
export class StartSessionUseCase {
  private readonly logger = new Logger(StartSessionUseCase.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: SessionRepository,
    @Inject(USAGE_QUOTA_REPOSITORY) private readonly quotaRepository: UsageQuotaRepository,
    @Inject(AEC_REPOSITORY) private readonly aecRepository: any,
  ) {}

  async execute(command: StartSessionCommand): Promise<{ sessionId: string }> {
    const { ticketId, userId, teamId } = command;

    // 1. Load and validate ticket
    const aec = await this.aecRepository.findById(ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }
    if (aec.teamId !== teamId) {
      throw new ForbiddenException('Ticket does not belong to your team');
    }
    if (aec.status !== 'approved') {
      throw new ConflictException(`Ticket must be approved, currently: ${aec.status}`);
    }

    // 2. Check quota
    const period = new Date().toISOString().slice(0, 7);
    const quota = await this.quotaRepository.getOrCreate(teamId, period);
    if (!quota.canStartSession()) {
      throw new ForbiddenException({
        message: `Development quota exhausted: ${quota.used}/${quota.limit}`,
        code: 'QUOTA_EXCEEDED',
      });
    }

    // 3. Check for existing active session on this ticket
    const existingSession = await this.sessionRepository.findActiveByTicket(ticketId, teamId);
    if (existingSession) {
      throw new ConflictException(`Ticket already has an active session: ${existingSession.id}`);
    }

    // 4. Create session
    const profile = aec.projectProfile || {};
    const session = Session.createNew({
      ticketId,
      teamId,
      userId,
      ticketTitle: aec.title,
      repoOwner: profile.repoOwner || '',
      repoName: profile.repoName || '',
      branch: `feat/${ticketId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    });

    await this.sessionRepository.save(session);

    this.logger.log(`Session ${session.id} created for ticket ${ticketId}`);

    return { sessionId: session.id };
  }
}
```

- [ ] **Step 4: Implement CancelSessionUseCase**

```typescript
// backend/src/sessions/application/use-cases/CancelSessionUseCase.ts
import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { SessionRepository, SESSION_REPOSITORY } from '../ports/SessionRepository.port';

export interface CancelSessionCommand {
  sessionId: string;
  userId: string;
  teamId: string;
}

@Injectable()
export class CancelSessionUseCase {
  private readonly logger = new Logger(CancelSessionUseCase.name);

  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(command: CancelSessionCommand): Promise<void> {
    const { sessionId, userId, teamId } = command;

    const session = await this.sessionRepository.findById(sessionId, teamId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    if (session.isTerminal()) {
      throw new ConflictException(`Session is already ${session.status}`);
    }

    session.markCancelled();
    await this.sessionRepository.save(session);

    this.logger.log(`Session ${sessionId} cancelled by ${userId}`);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && npx jest src/sessions/application/use-cases/__tests__/StartSessionUseCase.spec.ts --no-coverage`
Expected: All 4 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/sessions/application/use-cases/
git commit -m "feat(sessions): add StartSession and CancelSession use cases"
```

---

### Task 9: SSE Controller

**Files:**
- Create: `backend/src/sessions/presentation/controllers/sessions.controller.ts`
- Create: `backend/src/sessions/presentation/dto/StartSessionDto.ts`

Follows the exact SSE pattern from `tickets.controller.ts` `analyzeRepository` endpoint.

- [ ] **Step 1: Create DTO**

```typescript
// backend/src/sessions/presentation/dto/StartSessionDto.ts
import { IsString } from 'class-validator';

export class StartSessionDto {
  @IsString()
  ticketId!: string;
}
```

- [ ] **Step 2: Create sessions controller with SSE streaming**

```typescript
// backend/src/sessions/presentation/controllers/sessions.controller.ts
import {
  Controller,
  Post,
  Param,
  HttpCode,
  UseGuards,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { StartSessionUseCase } from '../../application/use-cases/StartSessionUseCase';
import { CancelSessionUseCase } from '../../application/use-cases/CancelSessionUseCase';
import { FirebaseAuthGuard } from '../../../shared/presentation/guards/FirebaseAuthGuard';
import { WorkspaceGuard } from '../../../shared/presentation/guards/WorkspaceGuard';
import { TeamId } from '../../../shared/presentation/decorators/TeamId.decorator';
import { UserId } from '../../../shared/presentation/decorators/UserId.decorator';

@Controller('sessions')
@UseGuards(FirebaseAuthGuard, WorkspaceGuard)
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(
    private readonly startSessionUseCase: StartSessionUseCase,
    private readonly cancelSessionUseCase: CancelSessionUseCase,
  ) {}

  @Post(':ticketId/start')
  async startSession(
    @Param('ticketId') ticketId: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    // 1. Create session (validates ticket, quota, etc.)
    const { sessionId } = await this.startSessionUseCase.execute({
      ticketId,
      userId,
      teamId,
    });

    // 2. Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 3. Send session created event
    send({ type: 'session.status', content: 'provisioning', toolUseId: sessionId });

    // TODO (Wave 4): SessionOrchestrator provisions sandbox and streams events
    // For now, send a placeholder complete event after a delay
    send({ type: 'session.status', content: 'running' });

    // This will be replaced by the actual sandbox orchestration
    // For MVP testing, the controller delegates to SessionOrchestrator
    // which manages the full lifecycle

    this.logger.log(`Session ${sessionId} SSE stream opened for ticket ${ticketId}`);

    // Handle client disconnect
    res.on('close', () => {
      this.logger.log(`Session ${sessionId} SSE stream closed by client`);
    });
  }

  @Post(':sessionId/cancel')
  @HttpCode(204)
  async cancelSession(
    @Param('sessionId') sessionId: string,
    @TeamId() teamId: string,
    @UserId() userId: string,
  ): Promise<void> {
    await this.cancelSessionUseCase.execute({ sessionId, userId, teamId });
  }
}
```

- [ ] **Step 3: Update sessions.module.ts with controller and use cases**

```typescript
// backend/src/sessions/sessions.module.ts
import { Module } from '@nestjs/common';
import { SessionsController } from './presentation/controllers/sessions.controller';
import { StartSessionUseCase } from './application/use-cases/StartSessionUseCase';
import { CancelSessionUseCase } from './application/use-cases/CancelSessionUseCase';
import { SESSION_REPOSITORY } from './application/ports';
import { FirestoreSessionRepository } from './infrastructure/persistence/FirestoreSessionRepository';
import { TicketsModule } from '../tickets/tickets.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [TicketsModule, BillingModule],
  controllers: [SessionsController],
  providers: [
    StartSessionUseCase,
    CancelSessionUseCase,
    {
      provide: SESSION_REPOSITORY,
      useClass: FirestoreSessionRepository,
    },
  ],
  exports: [SESSION_REPOSITORY],
})
export class SessionsModule {}
```

- [ ] **Step 4: Register SessionsModule in app.module.ts**

Modify: `backend/src/app.module.ts` — add `SessionsModule` to imports array.

```typescript
// Add import at top:
import { SessionsModule } from './sessions/sessions.module';

// Add to @Module imports array:
imports: [
  // ... existing modules
  SessionsModule,
],
```

- [ ] **Step 5: Verify the app compiles**

Run: `cd backend && npx nest build`
Expected: Build succeeds with no errors

- [ ] **Step 6: Commit**

```bash
git add backend/src/sessions/presentation/ backend/src/sessions/sessions.module.ts backend/src/app.module.ts
git commit -m "feat(sessions): add SSE controller, wire up module with use cases"
```

---

### WAVE 4 — Frontend Components (can start in parallel with Wave 2-3 using mocked data)

---

### Task 10: Frontend — DevelopButton + SessionMonitorView + Execute Tab

**Files:**
- Create: `client/src/sessions/components/DevelopButton.tsx`
- Create: `client/src/sessions/components/SessionMonitorView.tsx`
- Create: `client/src/sessions/components/SessionMessage.tsx`
- Create: `client/src/sessions/components/SessionToolCard.tsx`
- Create: `client/src/sessions/components/SessionToolGroup.tsx`
- Create: `client/src/sessions/components/SessionSummary.tsx`
- Create: `client/src/sessions/components/SessionProvisioningView.tsx`
- Modify: `client/src/tickets/components/detail/TicketDetailLayout.tsx` — add Execute tab

This is a large task. Each component follows the existing Linear-inspired design patterns (design tokens, `var(--text-primary)`, `border-[var(--border-subtle)]`, etc.) from CLAUDE.md section 4a.

**Important:** Only modify `TicketDetailLayout.tsx` to add a `<TabsTrigger>` + `<TabsContent>` pair. Do NOT refactor or change any existing tab content.

- [ ] **Step 1: Create DevelopButton**

```tsx
// client/src/sessions/components/DevelopButton.tsx
'use client';

import { Zap } from 'lucide-react';
import { useSessionStore } from '../stores/session.store';

interface DevelopButtonProps {
  ticketId: string;
  ticketStatus: string;
  onStart: () => void;
}

export function DevelopButton({ ticketId, ticketStatus, onStart }: DevelopButtonProps) {
  const { status, quota, fetchQuota } = useSessionStore();
  const isLoading = status === 'provisioning' || status === 'running';
  const isDisabled = ticketStatus !== 'approved' || isLoading;

  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center">
        <Zap className="w-6 h-6 text-violet-500" />
      </div>

      <div className="text-center">
        <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-1">
          Ready to develop
        </h3>
        <p className="text-[13px] text-[var(--text-secondary)] max-w-sm leading-relaxed">
          Claude will implement this ticket, run tests, and create a pull request for your team to review.
        </p>
      </div>

      <button
        onClick={onStart}
        disabled={isDisabled}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-[14px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Zap className="w-4 h-4" />
        Start Development
      </button>

      {quota && (
        <p className="text-[11px] text-[var(--text-tertiary)]">
          {quota.remaining} of {quota.limit} developments remaining &middot;{' '}
          <span className="text-violet-500">{quota.plan} plan</span>
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create SessionMessage**

```tsx
// client/src/sessions/components/SessionMessage.tsx
'use client';

import { Sparkles } from 'lucide-react';

interface SessionMessageProps {
  content: string;
}

export function SessionMessage({ content }: SessionMessageProps) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
      </div>
      <div className="text-[13px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create SessionToolCard**

```tsx
// client/src/sessions/components/SessionToolCard.tsx
'use client';

import { useState } from 'react';
import { FileText, Terminal, Search, Check, Loader2, ChevronRight, Wrench } from 'lucide-react';
import type { SessionEvent } from '../types/session.types';

interface SessionToolCardProps {
  event: SessionEvent;
}

const TOOL_ICONS: Record<string, typeof FileText> = {
  Read: FileText,
  Edit: FileText,
  Write: FileText,
  Bash: Terminal,
  Glob: Search,
  Grep: Search,
};

export function SessionToolCard({ event }: SessionToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const completed = !!event.completed;
  const Icon = TOOL_ICONS[event.tool ?? ''] ?? Wrench;

  const label = event.path
    ? event.path
    : event.command
      ? `$ ${event.command}`
      : event.tool ?? 'Working...';

  const detail = event.type === 'event.file_diff'
    ? (
        <span className="flex gap-1.5 text-[11px]">
          {event.newString && <span className="text-emerald-500">+{event.newString.split('\n').length}</span>}
          {event.oldString && <span className="text-red-500">-{event.oldString.split('\n').length}</span>}
        </span>
      )
    : event.type === 'event.file_create'
      ? <span className="text-[11px] text-emerald-500">new</span>
      : null;

  return (
    <div className="ml-8 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[var(--bg-active)] transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
        <span className="text-[var(--text-secondary)] truncate flex-1 text-left font-mono">
          {label}
        </span>
        {detail}
        {completed
          ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          : <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
        }
        <ChevronRight className={`w-3 h-3 text-[var(--text-tertiary)] transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && event.output && (
        <div className="border-t border-[var(--border-subtle)] p-3 max-h-48 overflow-y-auto scrollbar-thin">
          <pre className="text-[11px] font-mono text-[var(--text-tertiary)] whitespace-pre-wrap break-all">
            {event.output}
          </pre>
        </div>
      )}

      {expanded && event.type === 'event.file_diff' && event.oldString && event.newString && (
        <div className="border-t border-[var(--border-subtle)] p-3 font-mono text-[11px] leading-relaxed">
          <div className="text-red-500">- {event.oldString}</div>
          <div className="text-emerald-500">+ {event.newString}</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create SessionToolGroup**

```tsx
// client/src/sessions/components/SessionToolGroup.tsx
'use client';

import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import type { SessionEvent } from '../types/session.types';
import { SessionToolCard } from './SessionToolCard';

interface SessionToolGroupProps {
  events: SessionEvent[];
}

export function SessionToolGroup({ events }: SessionToolGroupProps) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 1) {
    return <SessionToolCard event={events[0]} />;
  }

  const allCompleted = events.every(e => e.completed);
  const fileCount = events.filter(e => e.path).length;
  const cmdCount = events.filter(e => e.command).length;

  const parts: string[] = [];
  if (fileCount > 0) parts.push(`${fileCount} file${fileCount > 1 ? 's' : ''}`);
  if (cmdCount > 0) parts.push(`${cmdCount} command${cmdCount > 1 ? 's' : ''}`);
  const label = `Explored ${parts.join(', ')}`;

  return (
    <div className="ml-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <Search className="w-3 h-3" />
        <span>{label}</span>
        {allCompleted && <span className="text-emerald-500">&#10003;</span>}
        <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="space-y-1.5 mt-1">
          {events.map(event => (
            <SessionToolCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create SessionSummary**

```tsx
// client/src/sessions/components/SessionSummary.tsx
'use client';

import { ExternalLink, GitPullRequest } from 'lucide-react';
import type { SessionSummary as SummaryType } from '../types/session.types';

interface SessionSummaryProps {
  summary: SummaryType;
}

export function SessionSummary({ summary }: SessionSummaryProps) {
  const durationMin = Math.floor((summary.durationMs || 0) / 60000);
  const durationSec = Math.floor(((summary.durationMs || 0) % 60000) / 1000);

  return (
    <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-500">
        <span>&#10003;</span>
        Development complete &middot; {durationMin}:{String(durationSec).padStart(2, '0')}
      </div>

      <div className="flex gap-5 text-[12px]">
        <div>
          <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Files</div>
          <div className="text-[var(--text-primary)] font-medium">{summary.filesChanged}</div>
        </div>
        {summary.costUsd > 0 && (
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Cost</div>
            <div className="text-[var(--text-primary)] font-medium">${summary.costUsd.toFixed(2)}</div>
          </div>
        )}
      </div>

      {summary.prUrl && (
        <a
          href={summary.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:bg-[var(--bg-active)] transition-colors"
        >
          <GitPullRequest className="w-4 h-4 text-violet-500" />
          <div className="flex-1">
            <div className="text-[13px] text-[var(--text-primary)] font-medium">
              Pull Request #{summary.prNumber}
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create SessionProvisioningView**

```tsx
// client/src/sessions/components/SessionProvisioningView.tsx
'use client';

import { Check, Loader2, Cloud, GitBranch, Sparkles } from 'lucide-react';

interface SessionProvisioningViewProps {
  onCancel: () => void;
}

const STEPS = [
  { key: 'sandbox', label: 'Creating sandbox', icon: Cloud },
  { key: 'clone', label: 'Cloning repository', icon: GitBranch },
  { key: 'claude', label: 'Starting Claude Code', icon: Sparkles },
];

export function SessionProvisioningView({ onCancel }: SessionProvisioningViewProps) {
  // For MVP, show step 1 as in-progress, rest as pending
  // Real implementation will receive phase updates via SSE
  return (
    <div className="flex flex-col items-center py-16">
      <div className="max-w-xs w-full space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Setting up environment</h3>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1">This usually takes a few seconds</p>
        </div>

        {STEPS.map((step, i) => {
          const isActive = i === 0;
          const isComplete = false;
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md ${
                isActive
                  ? 'bg-violet-500/5 border border-violet-500/10'
                  : isComplete
                    ? 'bg-emerald-500/5'
                    : ''
              }`}
            >
              {isComplete ? (
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : isActive ? (
                <Loader2 className="w-5 h-5 text-violet-500 animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[var(--bg-hover)] shrink-0" />
              )}
              <span className={`text-[13px] ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                {step.label}
              </span>
            </div>
          );
        })}

        <div className="text-center pt-4">
          <button
            onClick={onCancel}
            className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline underline-offset-2 decoration-[var(--border-subtle)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create SessionMonitorView (main orchestrator)**

```tsx
// client/src/sessions/components/SessionMonitorView.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useSessionStore } from '../stores/session.store';
import type { SessionEvent } from '../types/session.types';
import { DevelopButton } from './DevelopButton';
import { SessionProvisioningView } from './SessionProvisioningView';
import { SessionMessage } from './SessionMessage';
import { SessionToolCard } from './SessionToolCard';
import { SessionToolGroup } from './SessionToolGroup';
import { SessionSummary } from './SessionSummary';

interface SessionMonitorViewProps {
  ticketId: string;
  ticketStatus: string;
}

function isToolEvent(type: string): boolean {
  return ['event.tool_use', 'event.file_diff', 'event.file_create', 'event.bash', 'event.search', 'event.unknown_tool'].includes(type);
}

interface RenderGroup {
  type: 'single' | 'tool_group';
  events: SessionEvent[];
}

function groupEvents(events: SessionEvent[]): RenderGroup[] {
  const groups: RenderGroup[] = [];
  let currentToolGroup: SessionEvent[] = [];

  for (const event of events) {
    if (isToolEvent(event.type)) {
      currentToolGroup.push(event);
    } else {
      if (currentToolGroup.length > 0) {
        groups.push({ type: 'tool_group', events: [...currentToolGroup] });
        currentToolGroup = [];
      }
      groups.push({ type: 'single', events: [event] });
    }
  }
  if (currentToolGroup.length > 0) {
    groups.push({ type: 'tool_group', events: currentToolGroup });
  }
  return groups;
}

export function SessionMonitorView({ ticketId, ticketStatus }: SessionMonitorViewProps) {
  const { status, events, summary, error, elapsedSeconds, startSession, cancelSession, fetchQuota, reset } = useSessionStore();

  useEffect(() => {
    fetchQuota();
    return () => reset();
  }, [fetchQuota, reset]);

  const renderGroups = useMemo(() => groupEvents(events), [events]);

  const elapsed = `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  // Idle — show develop button
  if (status === 'idle') {
    return (
      <DevelopButton
        ticketId={ticketId}
        ticketStatus={ticketStatus}
        onStart={() => startSession(ticketId)}
      />
    );
  }

  // Provisioning
  if (status === 'provisioning') {
    return <SessionProvisioningView onCancel={cancelSession} />;
  }

  // Failed
  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <div className="text-[13px] text-red-500">{error || 'Session failed'}</div>
        <button
          onClick={reset}
          className="text-[12px] text-violet-500 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Running or Completed
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between py-2 mb-2">
        <div className="flex items-center gap-2">
          {status === 'running' ? (
            <>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse [animation-delay:300ms]" />
              </div>
              <span className="text-[12px] text-violet-500 font-medium">Claude is working</span>
            </>
          ) : status === 'completed' ? (
            <>
              <span className="text-emerald-500 text-[13px]">&#10003;</span>
              <span className="text-[12px] text-emerald-500 font-medium">Development complete</span>
            </>
          ) : (
            <span className="text-[12px] text-[var(--text-tertiary)]">{status}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
          <span>{elapsed}</span>
          {status === 'running' && (
            <button
              onClick={cancelSession}
              className="text-red-500 hover:text-red-400"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Event stream */}
      <div className="space-y-3">
        {renderGroups.map((group, i) => {
          if (group.type === 'tool_group') {
            return <SessionToolGroup key={`group-${i}`} events={group.events} />;
          }

          const event = group.events[0];
          if (event.type === 'event.message') {
            return <SessionMessage key={event.id} content={event.content ?? ''} />;
          }
          if (event.type === 'event.thinking') {
            return (
              <div key={event.id} className="ml-8 flex items-center gap-1.5 py-1">
                <Loader2 className="w-3 h-3 text-violet-500 animate-spin" />
                <span className="text-[11px] text-[var(--text-tertiary)]">Thinking...</span>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Summary */}
      {status === 'completed' && summary && (
        <div className="mt-4">
          <SessionSummary summary={summary} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Add Execute tab to TicketDetailLayout.tsx**

Modify: `client/src/tickets/components/detail/TicketDetailLayout.tsx`

Add import at top:
```tsx
import { Zap } from 'lucide-react';
import { SessionMonitorView } from '@/sessions/components/SessionMonitorView';
```

Add `TabsTrigger` after the existing "delivered" (Record) trigger:
```tsx
<TabsTrigger
  value="execute"
  className="text-sm font-medium text-gray-600 dark:text-gray-400 border-b-2 border-transparent data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-50 data-[state=active]:border-[var(--text)] transition-all rounded-none gap-1.5"
>
  <Zap className="h-3.5 w-3.5" />
  Execute
</TabsTrigger>
```

Add `TabsContent` after the existing tab contents:
```tsx
<TabsContent value="execute" className="mt-6">
  <div className="max-w-3xl xl:max-w-4xl mx-auto">
    <SessionMonitorView
      ticketId={ticket.id}
      ticketStatus={ticket.status}
    />
  </div>
</TabsContent>
```

**CRITICAL:** Only add these two blocks. Do NOT modify any existing tab triggers or content.

- [ ] **Step 9: Commit**

```bash
git add client/src/sessions/ client/src/tickets/components/detail/TicketDetailLayout.tsx
git commit -m "feat(sessions): add Execute tab with monitoring view and session components"
```

---

## Wave Summary

```
WAVE 1 (all parallel):
  Task 1: Session domain entity          → backend/src/sessions/domain/
  Task 2: EventTranslator (pure fn)      → backend/src/sessions/application/services/
  Task 3: UsageQuota domain entity       → backend/src/billing/domain/
  Task 4: ComplexityAnalyzer (pure fn)   → backend/src/sessions/application/services/
  Task 5: Frontend types + store         → client/src/sessions/

WAVE 2 (depends on Wave 1):
  Task 6: Session ports + repo + module  → backend/src/sessions/{application,infrastructure}/
  Task 7: Billing ports + repo + module  → backend/src/billing/{application,infrastructure}/

WAVE 3 (depends on Wave 2):
  Task 8: Use cases                      → backend/src/sessions/application/use-cases/
  Task 9: SSE Controller + app.module    → backend/src/sessions/presentation/

WAVE 4 (can start parallel with Wave 2, merged after Wave 3):
  Task 10: Frontend components + tab     → client/src/sessions/components/
```

**No existing files are modified except:**
- `backend/src/app.module.ts` — add `SessionsModule` to imports (Task 9)
- `client/src/tickets/components/detail/TicketDetailLayout.tsx` — add Execute tab trigger + content (Task 10)

Both modifications are additive only (no deletions, no refactors).
