# Ticket Lifecycle on Develop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up ticket lifecycle so that `forge develop` transitions the ticket to EXECUTING with notification, the UI refreshes automatically, and the developer agent can deliver work and record execution events via MCP tools.

**Architecture:** Backend notification injection into existing use cases (application layer only). Two new MCP tool wrappers in forge-cli calling existing backend REST endpoints. Frontend adds a 15s polling interval using existing store method.

**Tech Stack:** NestJS (backend), TypeScript MCP SDK (forge-cli), Next.js/React (frontend)

---

### Task 1: Email templates for "Implementation Started"

**Files:**
- Modify: `backend/src/notifications/templates/notification-email.template.ts`

- [ ] **Step 1: Add the ImplementationStartedEmailData interface and templates**

Add after the `ReviewEmailData` interface (line 23) and after the review template functions (after line 176):

```typescript
// In the interfaces section (after line 23):
export interface ImplementationStartedEmailData {
  ticketTitle: string;
  ticketUrl: string;
}
```

```typescript
// After the review templates (after line 176):

// ─── Implementation Started ─────────────────────────────────

export function generateImplementationStartedEmailHtml(data: ImplementationStartedEmailData): string {
  return emailShell('Development Started', `
    <h1 style="font-size:22px;font-weight:600;color:#111;margin:0 0 16px 0;letter-spacing:-0.3px;">Development has started</h1>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 8px 0;">
      A developer has started working on <strong style="color:#111;">${escapeHtml(data.ticketTitle)}</strong>.
    </p>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0;">
      You'll be notified again when the work is ready for review.
    </p>
    ${emailButton(data.ticketUrl, 'View Ticket', '#3b82f6')}
  `);
}

export function generateImplementationStartedEmailText(data: ImplementationStartedEmailData): string {
  return `
Development has started

A developer has started working on: ${data.ticketTitle}

You'll be notified again when the work is ready for review.

View the ticket:
${data.ticketUrl}

This is an automated notification from Forge.
  `.trim();
}
```

- [ ] **Step 2: Verify the templates compile**

Run: `cd backend && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to notification-email.template.ts

- [ ] **Step 3: Commit**

```bash
git add backend/src/notifications/templates/notification-email.template.ts
git commit -m "feat: add email templates for implementation-started notification"
```

---

### Task 2: Add `notifyImplementationStarted` to NotificationService

**Files:**
- Modify: `backend/src/notifications/notification.service.ts`

- [ ] **Step 1: Add the import for new templates**

At the top of the file, add the new template imports to the existing import block (line 6-11):

```typescript
import {
  generateAssignmentEmailHtml,
  generateAssignmentEmailText,
  generateApprovalEmailHtml,
  generateApprovalEmailText,
  generateReviewEmailHtml,
  generateReviewEmailText,
  generateImplementationStartedEmailHtml,
  generateImplementationStartedEmailText,
} from './templates/notification-email.template';
```

- [ ] **Step 2: Add the notifyImplementationStarted method**

Add after `notifyTicketReadyForReview` (after line 113):

```typescript
  async notifyImplementationStarted(
    ticketId: string,
    creatorUserId: string,
    ticketTitle: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.getById(creatorUserId);
      if (!user) {
        this.logger.warn(`Cannot send implementation-started notification: user ${creatorUserId} not found`);
        return;
      }

      const email = user.getEmail();
      if (!email) {
        this.logger.warn(`Cannot send implementation-started notification: user ${creatorUserId} has no email`);
        return;
      }

      const ticketUrl = `${this.appUrl}/tickets/${ticketId}`;
      const subject = `[Forge] Development started: ${ticketTitle}`;
      const textBody = generateImplementationStartedEmailText({ ticketTitle, ticketUrl });
      const htmlBody = generateImplementationStartedEmailHtml({ ticketTitle, ticketUrl });

      await this.emailService.sendEmail(email, subject, textBody, htmlBody);
      this.logger.log(`Implementation-started notification sent to ${email} for ticket ${ticketId}`);
    } catch (error) {
      this.logger.warn(`Failed to send implementation-started notification for ticket ${ticketId}`, error);
    }
  }
```

- [ ] **Step 3: Verify it compiles**

Run: `cd backend && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add backend/src/notifications/notification.service.ts
git commit -m "feat: add notifyImplementationStarted to NotificationService"
```

---

### Task 3: Wire notification into StartImplementationUseCase

**Files:**
- Modify: `backend/src/tickets/application/use-cases/StartImplementationUseCase.ts`
- Create: `backend/src/tickets/application/use-cases/StartImplementationUseCase.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/src/tickets/application/use-cases/StartImplementationUseCase.spec.ts`:

```typescript
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { StartImplementationUseCase } from './StartImplementationUseCase';
import { AECStatus } from '../../domain/value-objects/AECStatus';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';
import { NotificationService } from '../../../notifications/notification.service';

const TEAM_ID = 'team_abc';
const TICKET_ID = 'aec_001';

function makeMockAEC(overrides: {
  status?: AECStatus;
  teamId?: string;
  createdBy?: string;
} = {}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.APPROVED,
    title: 'Add welcome screen',
    createdBy: overrides.createdBy ?? 'creator-user-1',
    startImplementation: jest.fn(),
  };
}

describe('StartImplementationUseCase', () => {
  let aecRepository: { findById: jest.Mock; save: jest.Mock };
  let mockNotificationService: jest.Mocked<NotificationService>;
  let useCase: StartImplementationUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockNotificationService = {
      notifyTicketAssigned: jest.fn().mockResolvedValue(undefined),
      notifyTicketReady: jest.fn().mockResolvedValue(undefined),
      notifyTicketReadyForReview: jest.fn().mockResolvedValue(undefined),
      notifyImplementationStarted: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new StartImplementationUseCase(aecRepository as any, mockNotificationService);
  });

  it('calls startImplementation on AEC and saves', async () => {
    const mockAEC = makeMockAEC();
    aecRepository.findById.mockResolvedValue(mockAEC);

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      branchName: 'forge/welcome-screen',
    });

    expect(mockAEC.startImplementation).toHaveBeenCalledWith('forge/welcome-screen', undefined);
    expect(aecRepository.save).toHaveBeenCalledWith(mockAEC);
    expect(result.success).toBe(true);
    expect(result.branchName).toBe('forge/welcome-screen');
  });

  it('sends notification to ticket creator', async () => {
    const mockAEC = makeMockAEC({ createdBy: 'pm-user-42' });
    aecRepository.findById.mockResolvedValue(mockAEC);

    await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      branchName: 'forge/welcome-screen',
    });

    expect(mockNotificationService.notifyImplementationStarted).toHaveBeenCalledWith(
      TICKET_ID,
      'pm-user-42',
      'Add welcome screen',
    );
  });

  it('throws NotFoundException when ticket not found', async () => {
    aecRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ ticketId: 'nope', teamId: TEAM_ID, branchName: 'forge/x' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException on team mismatch', async () => {
    aecRepository.findById.mockResolvedValue(makeMockAEC({ teamId: 'other' }));

    await expect(
      useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID, branchName: 'forge/x' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws BadRequestException when domain rejects transition', async () => {
    const mockAEC = makeMockAEC();
    mockAEC.startImplementation.mockImplementation(() => {
      throw new InvalidStateTransitionError('Cannot start implementation from draft');
    });
    aecRepository.findById.mockResolvedValue(mockAEC);

    await expect(
      useCase.execute({ ticketId: TICKET_ID, teamId: TEAM_ID, branchName: 'forge/x' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('still succeeds if notification fails', async () => {
    const mockAEC = makeMockAEC();
    aecRepository.findById.mockResolvedValue(mockAEC);
    mockNotificationService.notifyImplementationStarted.mockRejectedValue(new Error('email down'));

    const result = await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      branchName: 'forge/welcome-screen',
    });

    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && npx jest --testPathPattern=StartImplementationUseCase.spec --no-coverage 2>&1 | tail -20`
Expected: FAIL — constructor expects 1 argument but test passes 2

- [ ] **Step 3: Update StartImplementationUseCase to inject NotificationService**

Replace the full content of `backend/src/tickets/application/use-cases/StartImplementationUseCase.ts`:

```typescript
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import {
  InvalidStateTransitionError,
} from '../../../shared/domain/exceptions/DomainExceptions';
import { NotificationService } from '../../../notifications/notification.service';
import type { ReviewQAItem } from '../../domain/aec/AEC';

export interface StartImplementationCommand {
  ticketId: string;
  teamId: string;
  branchName: string;
  qaItems?: ReviewQAItem[];
}

export interface StartImplementationResult {
  success: true;
  ticketId: string;
  branchName: string;
  status: string;
}

/**
 * StartImplementationUseCase (Story 10-2)
 *
 * Records the implementation branch and optional Q&A from the
 * forge Developer Agent, then transitions the ticket APPROVED → EXECUTING.
 * Notifies the ticket creator that development has started.
 */
@Injectable()
export class StartImplementationUseCase {
  private readonly logger = new Logger(StartImplementationUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(command: StartImplementationCommand): Promise<StartImplementationResult> {
    // 1. Load ticket
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    // 2. Verify team ownership
    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    // 3. Start implementation (transitions APPROVED → EXECUTING)
    try {
      aec.startImplementation(command.branchName, command.qaItems);
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    // 4. Persist
    await this.aecRepository.save(aec);

    // 5. Notify ticket creator (fire-and-forget)
    if (aec.createdBy) {
      void this.notificationService
        .notifyImplementationStarted(command.ticketId, aec.createdBy, aec.title)
        .catch((err) => this.logger.warn('Notification failed (start-implementation)', err));
    }

    return {
      success: true,
      ticketId: aec.id,
      branchName: command.branchName,
      status: aec.status,
    };
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend && npx jest --testPathPattern=StartImplementationUseCase.spec --no-coverage 2>&1 | tail -20`
Expected: All 6 tests PASS

- [ ] **Step 5: Run full TypeScript check**

Run: `cd backend && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add backend/src/tickets/application/use-cases/StartImplementationUseCase.ts backend/src/tickets/application/use-cases/StartImplementationUseCase.spec.ts
git commit -m "feat: notify ticket creator when implementation starts"
```

---

### Task 4: Wire notification into SubmitSettlementUseCase

**Files:**
- Modify: `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.ts`
- Modify: `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.spec.ts`

- [ ] **Step 1: Add notification test to existing spec**

Add to `SubmitSettlementUseCase.spec.ts`. Update imports and the `beforeEach` to inject `NotificationService`, then add notification tests:

At the top, add import:
```typescript
import { NotificationService } from '../../../notifications/notification.service';
```

Update `makeMockAEC` to include `createdBy` and `title`:
```typescript
function makeMockAEC(overrides: { status?: AECStatus; teamId?: string; createdBy?: string } = {}) {
  return {
    id: TICKET_ID,
    teamId: overrides.teamId ?? TEAM_ID,
    status: overrides.status ?? AECStatus.EXECUTING,
    title: 'Add rate limiting',
    createdBy: overrides.createdBy ?? 'creator-user-1',
    deliver: jest.fn(),
  };
}
```

Update `beforeEach` to add notification mock:
```typescript
describe('SubmitSettlementUseCase', () => {
  let aecRepository: { findById: jest.Mock; save: jest.Mock };
  let mockNotificationService: jest.Mocked<NotificationService>;
  let useCase: SubmitSettlementUseCase;

  beforeEach(() => {
    aecRepository = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockNotificationService = {
      notifyTicketAssigned: jest.fn().mockResolvedValue(undefined),
      notifyTicketReady: jest.fn().mockResolvedValue(undefined),
      notifyTicketReadyForReview: jest.fn().mockResolvedValue(undefined),
      notifyImplementationStarted: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new SubmitSettlementUseCase(aecRepository as any, mockNotificationService);
  });
```

Add notification tests after the existing tests:
```typescript
  it('notifies ticket creator that delivery is ready for review', async () => {
    const mockAEC = makeMockAEC({ createdBy: 'pm-user-1' });
    aecRepository.findById.mockResolvedValue(mockAEC);

    await useCase.execute({
      ticketId: TICKET_ID,
      teamId: TEAM_ID,
      executionSummary: 'Added rate limiting',
      filesChanged: [{ path: 'src/rate-limit.ts', additions: 100, deletions: 0 }],
      divergences: [],
    });

    expect(mockNotificationService.notifyTicketReadyForReview).toHaveBeenCalledWith(
      TICKET_ID,
      'creator-user-1',
      'Add rate limiting',
    );
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && npx jest --testPathPattern=SubmitSettlementUseCase.spec --no-coverage 2>&1 | tail -20`
Expected: FAIL — constructor call doesn't match (1 arg vs 2), or notification not called

- [ ] **Step 3: Update SubmitSettlementUseCase to inject NotificationService**

Replace the full content of `backend/src/tickets/application/use-cases/SubmitSettlementUseCase.ts`:

```typescript
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { AECRepository, AEC_REPOSITORY } from '../ports/AECRepository';
import { InvalidStateTransitionError } from '../../../shared/domain/exceptions/DomainExceptions';
import { FileChange, Divergence } from '../../domain/value-objects/ChangeRecord';
import { NotificationService } from '../../../notifications/notification.service';

export interface SubmitSettlementCommand {
  ticketId: string;
  teamId: string;
  executionSummary: string;
  filesChanged: FileChange[];
  divergences: Divergence[];
}

@Injectable()
export class SubmitSettlementUseCase {
  private readonly logger = new Logger(SubmitSettlementUseCase.name);

  constructor(
    @Inject(AEC_REPOSITORY)
    private readonly aecRepository: AECRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(command: SubmitSettlementCommand) {
    const aec = await this.aecRepository.findById(command.ticketId);
    if (!aec) {
      throw new NotFoundException(`Ticket ${command.ticketId} not found`);
    }

    if (aec.teamId !== command.teamId) {
      throw new ForbiddenException('Ticket does not belong to your workspace');
    }

    try {
      aec.deliver({
        executionSummary: command.executionSummary,
        filesChanged: command.filesChanged,
        divergences: command.divergences,
      });

      await this.aecRepository.save(aec);

      // Notify ticket creator that delivery is ready for review (fire-and-forget)
      if (aec.createdBy) {
        void this.notificationService
          .notifyTicketReadyForReview(command.ticketId, aec.createdBy, aec.title)
          .catch((err) => this.logger.warn('Notification failed (settlement)', err));
      }

      return { success: true, ticketId: aec.id, status: aec.status };
    } catch (error) {
      if (error instanceof InvalidStateTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend && npx jest --testPathPattern=SubmitSettlementUseCase.spec --no-coverage 2>&1 | tail -20`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/tickets/application/use-cases/SubmitSettlementUseCase.ts backend/src/tickets/application/use-cases/SubmitSettlementUseCase.spec.ts
git commit -m "feat: notify ticket creator when settlement is delivered"
```

---

### Task 5: Frontend — Add 15s polling to ticket detail page

**Files:**
- Modify: `client/app/(main)/tickets/[id]/page.tsx`

- [ ] **Step 1: Add `refreshTicket` to the destructured store values**

In `client/app/(main)/tickets/[id]/page.tsx`, find the store destructuring (line 87):

```typescript
const { currentTicket, isLoading, fetchError, isUpdating, isDeleting, isUploadingAttachment, fetchTicket, updateTicket, deleteTicket, assignTicket, uploadAttachment, deleteAttachment, exportToLinear, exportToJira } = useTicketsStore();
```

Add `refreshTicket` to the destructuring:

```typescript
const { currentTicket, isLoading, fetchError, isUpdating, isDeleting, isUploadingAttachment, fetchTicket, refreshTicket, updateTicket, deleteTicket, assignTicket, uploadAttachment, deleteAttachment, exportToLinear, exportToJira } = useTicketsStore();
```

- [ ] **Step 2: Add the polling useEffect**

Add after the "Fetch ticket when ID is available" useEffect (after line 124):

```typescript
  // Silent poll every 15s so external status changes (e.g. MCP start_implementation) are reflected
  useEffect(() => {
    if (!ticketId) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshTicket(ticketId);
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [ticketId, refreshTicket]);
```

- [ ] **Step 3: Verify frontend compiles**

Run: `cd client && npx next build 2>&1 | tail -20` (or `npx tsc --noEmit` if faster)
Expected: No errors related to the detail page

- [ ] **Step 4: Commit**

```bash
git add client/app/(main)/tickets/[id]/page.tsx
git commit -m "feat: add 15s silent polling to ticket detail page"
```

---

### Task 6: MCP tool — `submit_settlement`

**Files:**
- Create: `forge-cli/src/mcp/tools/submit-settlement.ts`

- [ ] **Step 1: Create the submit-settlement MCP tool**

Create `forge-cli/src/mcp/tools/submit-settlement.ts`:

```typescript
import * as ApiService from '../../services/api.service.js';
import type { ForgeConfig } from '../../services/config.service.js';
import type { ToolResult } from '../types.js';

// MCP tool definition — returned by ListTools so Claude Code can discover it
export const submitSettlementToolDefinition = {
  name: 'submit_settlement',
  description:
    'Submit the final settlement when implementation is complete. This transitions the ticket from EXECUTING to DELIVERED, creating a Change Record for PM review. Call this after the developer agent has finished all coding work. Include a summary of what was built, the files changed, and any divergences from the original spec.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      ticketId: {
        type: 'string',
        description: 'The ticket ID (e.g., "forge-42")',
      },
      executionSummary: {
        type: 'string',
        description: 'A summary of what was implemented, key decisions made, and how it differs from the spec (if at all)',
      },
      filesChanged: {
        type: 'array',
        description: 'List of files that were created or modified during implementation',
        items: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to the repository root',
            },
            additions: {
              type: 'number',
              description: 'Number of lines added',
            },
            deletions: {
              type: 'number',
              description: 'Number of lines deleted',
            },
          },
          required: ['path', 'additions', 'deletions'],
        },
      },
      divergences: {
        type: 'array',
        description: 'Optional list of divergences from the original spec. Include when the implementation differs meaningfully from what was specified.',
        items: {
          type: 'object',
          properties: {
            area: {
              type: 'string',
              description: 'The area or component that diverged',
            },
            intended: {
              type: 'string',
              description: 'What the spec originally intended',
            },
            actual: {
              type: 'string',
              description: 'What was actually built',
            },
            justification: {
              type: 'string',
              description: 'Why the divergence was necessary',
            },
          },
          required: ['area', 'intended', 'actual', 'justification'],
        },
      },
    },
    required: ['ticketId', 'executionSummary', 'filesChanged'],
  },
};

interface SubmitSettlementResponse {
  success: boolean;
  ticketId: string;
  status: string;
}

/**
 * Handles the submit_settlement MCP tool call.
 * Posts settlement payload to POST /tickets/:id/settle.
 * The backend transitions the ticket EXECUTING → DELIVERED and creates a ChangeRecord.
 * Never throws — all errors are returned as isError content.
 */
export async function handleSubmitSettlement(
  args: Record<string, unknown>,
  config: ForgeConfig
): Promise<ToolResult> {
  const ticketId = args['ticketId'];
  const executionSummary = args['executionSummary'];
  const filesChanged = args['filesChanged'];
  const divergences = args['divergences'];

  // Validate ticketId
  if (!ticketId || typeof ticketId !== 'string' || ticketId.trim() === '') {
    return {
      content: [{ type: 'text', text: 'Missing required argument: ticketId' }],
      isError: true,
    };
  }

  // Validate executionSummary
  if (!executionSummary || typeof executionSummary !== 'string' || executionSummary.trim() === '') {
    return {
      content: [{ type: 'text', text: 'Missing required argument: executionSummary' }],
      isError: true,
    };
  }

  // Validate filesChanged
  if (!filesChanged || !Array.isArray(filesChanged)) {
    return {
      content: [{ type: 'text', text: 'filesChanged must be an array of {path, additions, deletions} objects' }],
      isError: true,
    };
  }

  for (const file of filesChanged) {
    if (
      typeof file !== 'object' ||
      file === null ||
      typeof (file as any).path !== 'string' ||
      typeof (file as any).additions !== 'number' ||
      typeof (file as any).deletions !== 'number'
    ) {
      return {
        content: [{ type: 'text', text: 'Each filesChanged item must have: path (string), additions (number), deletions (number)' }],
        isError: true,
      };
    }
  }

  // Validate divergences if provided
  const validatedDivergences: Array<{ area: string; intended: string; actual: string; justification: string }> = [];
  if (divergences && Array.isArray(divergences)) {
    for (const div of divergences) {
      if (
        typeof div !== 'object' ||
        div === null ||
        typeof (div as any).area !== 'string' ||
        typeof (div as any).intended !== 'string' ||
        typeof (div as any).actual !== 'string' ||
        typeof (div as any).justification !== 'string'
      ) {
        return {
          content: [{ type: 'text', text: 'Each divergence must have: area, intended, actual, justification (all strings)' }],
          isError: true,
        };
      }
      validatedDivergences.push({
        area: (div as any).area,
        intended: (div as any).intended,
        actual: (div as any).actual,
        justification: (div as any).justification,
      });
    }
  }

  const validatedFiles = (filesChanged as any[]).map((f) => ({
    path: f.path,
    additions: f.additions,
    deletions: f.deletions,
  }));

  try {
    const result = await ApiService.post<SubmitSettlementResponse>(
      `/tickets/${ticketId.trim()}/settle`,
      {
        executionSummary: executionSummary.trim(),
        filesChanged: validatedFiles,
        divergences: validatedDivergences,
      },
      config
    );

    return {
      content: [
        {
          type: 'text',
          text: `Settlement submitted for ${result.ticketId}. Status is now "${result.status}". A Change Record has been created and the PM will be notified to review.`,
        },
      ],
    };
  } catch (err) {
    const message = (err as Error).message ?? String(err);

    if (message.includes('404')) {
      return {
        content: [{ type: 'text', text: `Ticket not found: ${ticketId}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: message }],
      isError: true,
    };
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd forge-cli && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add forge-cli/src/mcp/tools/submit-settlement.ts
git commit -m "feat: add submit_settlement MCP tool for delivering completed work"
```

---

### Task 7: MCP tool — `record_execution_event`

**Files:**
- Create: `forge-cli/src/mcp/tools/record-execution-event.ts`

- [ ] **Step 1: Create the record-execution-event MCP tool**

Create `forge-cli/src/mcp/tools/record-execution-event.ts`:

```typescript
import * as ApiService from '../../services/api.service.js';
import type { ForgeConfig } from '../../services/config.service.js';
import type { ToolResult } from '../types.js';

const VALID_EVENT_TYPES = ['decision', 'risk', 'scope_change'] as const;

// MCP tool definition — returned by ListTools so Claude Code can discover it
export const recordExecutionEventToolDefinition = {
  name: 'record_execution_event',
  description:
    'Record a decision, risk, or scope change during ticket implementation. These events accumulate and are bundled into the Change Record when the settlement is submitted. Use "decision" for architectural or implementation choices, "risk" for potential issues identified, and "scope_change" for deviations from the original spec.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      ticketId: {
        type: 'string',
        description: 'The ticket ID (e.g., "forge-42")',
      },
      type: {
        type: 'string',
        enum: ['decision', 'risk', 'scope_change'],
        description: 'The type of execution event: "decision" for implementation choices, "risk" for identified risks, "scope_change" for spec deviations',
      },
      title: {
        type: 'string',
        description: 'Short title for the event (e.g., "Used token bucket algorithm for rate limiting")',
      },
      description: {
        type: 'string',
        description: 'Detailed description of the event, including rationale and context',
      },
    },
    required: ['ticketId', 'type', 'title', 'description'],
  },
};

interface RecordExecutionEventResponse {
  success: boolean;
  eventId: string;
}

/**
 * Handles the record_execution_event MCP tool call.
 * Posts an execution event to POST /tickets/:id/execution-events.
 * The backend appends the event to the ticket's execution events list.
 * Never throws — all errors are returned as isError content.
 */
export async function handleRecordExecutionEvent(
  args: Record<string, unknown>,
  config: ForgeConfig
): Promise<ToolResult> {
  const ticketId = args['ticketId'];
  const type = args['type'];
  const title = args['title'];
  const description = args['description'];

  // Validate ticketId
  if (!ticketId || typeof ticketId !== 'string' || ticketId.trim() === '') {
    return {
      content: [{ type: 'text', text: 'Missing required argument: ticketId' }],
      isError: true,
    };
  }

  // Validate type
  if (!type || typeof type !== 'string' || !VALID_EVENT_TYPES.includes(type as any)) {
    return {
      content: [{ type: 'text', text: `type must be one of: ${VALID_EVENT_TYPES.join(', ')}` }],
      isError: true,
    };
  }

  // Validate title
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return {
      content: [{ type: 'text', text: 'Missing required argument: title' }],
      isError: true,
    };
  }

  // Validate description
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return {
      content: [{ type: 'text', text: 'Missing required argument: description' }],
      isError: true,
    };
  }

  try {
    const result = await ApiService.post<RecordExecutionEventResponse>(
      `/tickets/${ticketId.trim()}/execution-events`,
      {
        type,
        title: title.trim(),
        description: description.trim(),
      },
      config
    );

    const typeLabel = type === 'scope_change' ? 'scope change' : type;
    return {
      content: [
        {
          type: 'text',
          text: `Recorded ${typeLabel}: "${title.trim()}" (event ${result.eventId}). This will appear in the Change Record when the settlement is submitted.`,
        },
      ],
    };
  } catch (err) {
    const message = (err as Error).message ?? String(err);

    if (message.includes('404')) {
      return {
        content: [{ type: 'text', text: `Ticket not found: ${ticketId}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: message }],
      isError: true,
    };
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd forge-cli && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add forge-cli/src/mcp/tools/record-execution-event.ts
git commit -m "feat: add record_execution_event MCP tool for logging decisions/risks/scope changes"
```

---

### Task 8: Register new MCP tools in server

**Files:**
- Modify: `forge-cli/src/mcp/server.ts`

- [ ] **Step 1: Add imports for new tools**

Add after the `startImplementationToolDefinition` import (after line 51):

```typescript
import {
  submitSettlementToolDefinition,
  handleSubmitSettlement,
} from './tools/submit-settlement.js';
import {
  recordExecutionEventToolDefinition,
  handleRecordExecutionEvent,
} from './tools/record-execution-event.js';
```

- [ ] **Step 2: Add tools to ListTools handler**

Update line 64 to include the new tools in the array:

```typescript
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [getTicketContextToolDefinition, getFileChangesToolDefinition, getRepositoryContextToolDefinition, updateTicketStatusToolDefinition, submitReviewSessionToolDefinition, listTicketsToolDefinition, startImplementationToolDefinition, submitSettlementToolDefinition, recordExecutionEventToolDefinition],
    }));
```

- [ ] **Step 3: Add cases to CallTool handler**

Add before the `default:` case (before line 130):

```typescript
        case 'submit_settlement':
          return handleSubmitSettlement(
            args as Record<string, unknown>,
            config
          );
        case 'record_execution_event':
          return handleRecordExecutionEvent(
            args as Record<string, unknown>,
            config
          );
```

- [ ] **Step 4: Verify it compiles**

Run: `cd forge-cli && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add forge-cli/src/mcp/server.ts
git commit -m "feat: register submit_settlement and record_execution_event MCP tools"
```

---

### Task 9: Run all backend tests and verify

**Files:** None (verification only)

- [ ] **Step 1: Run all use case tests**

Run: `cd backend && npx jest --testPathPattern='use-cases/' --no-coverage 2>&1 | tail -30`
Expected: All tests PASS

- [ ] **Step 2: Run full backend TypeScript check**

Run: `cd backend && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Run forge-cli TypeScript check**

Run: `cd forge-cli && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors
