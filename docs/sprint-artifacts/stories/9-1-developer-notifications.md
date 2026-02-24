# Story 9.1: Developer Notifications on Key Ticket Events

Status: drafted

## Story

As a developer,
I want to receive an email notification when I am assigned to a ticket or when a ticket I'm assigned to transitions to READY,
so that I know immediately when to act — without having to manually check Forge.

## Acceptance Criteria

1. When `AssignTicketUseCase` successfully assigns a ticket to a developer (userId is non-null), the backend sends an email to that developer's email address containing: the ticket title, a link to the ticket detail page (`APP_URL/tickets/:id`), and the sentence "You've been assigned a new ticket. It's ready for your review."
2. When `ApproveTicketUseCase` transitions a ticket from `WAITING_FOR_APPROVAL` → `READY`, the backend sends an email to the currently assigned developer (if any) containing: the ticket title, a link to the ticket detail page, and the sentence "Your ticket has been approved and is ready to execute. Run `forge execute :id` to get started."
3. Email is sent asynchronously (fire-and-forget): notification failure does NOT throw an error or block the HTTP response. The main operation always succeeds regardless of email outcome.
4. If the ticket has no `assignedTo` (null), no email is sent. If the user's email address cannot be resolved, the email is silently skipped and the error logged at `warn` level.
5. A new `NotificationService` in `backend/src/notifications/notification.service.ts` encapsulates all email logic. It is `@Injectable()` and registered in a `NotificationsModule`. Use cases inject `NotificationService` via NestJS DI (not direct import).
6. `NotificationService` reuses the existing email sending infrastructure (same method / transporter used by the invitation email flow in Epic 3). Do not introduce a new email library.
7. Email subject lines:
   - Assignment: `[Forge] You've been assigned: <ticket title>`
   - Approved: `[Forge] Ticket ready to execute: <ticket title>`
8. Unit tests cover: assignment email sent (happy path), approved email sent (happy path), no email when `assignedTo` is null on approve, notification failure does not propagate (fire-and-forget), user not found → silent skip.
9. `tsc --noEmit` → 0 errors in backend.

## Tasks / Subtasks

- [ ] Task 1: Infrastructure — `NotificationsModule` + `NotificationService` (AC: 5, 6)
  - [ ] Create `backend/src/notifications/notification.service.ts`
  - [ ] Create `backend/src/notifications/notifications.module.ts` — exports `NotificationService`
  - [ ] `NotificationService` has two public async methods:
    - `notifyTicketAssigned(ticketId: string, assignedUserId: string, ticketTitle: string): Promise<void>`
    - `notifyTicketReady(ticketId: string, assignedUserId: string, ticketTitle: string): Promise<void>`
  - [ ] Inject `FirestoreUserRepository` (via `SharedModule`, already global) to look up user email by userId
  - [ ] Inject the existing email service/transporter from Epic 3 (identify the correct injection token or service class)
  - [ ] Import `ConfigService` for `APP_URL` (already global)

- [ ] Task 2: Wire `NotificationsModule` into `TicketsModule` (AC: 5)
  - [ ] Import `NotificationsModule` in `backend/src/tickets/tickets.module.ts`
  - [ ] Add `NotificationService` to `providers` (or rely on module import export)

- [ ] Task 3: Assignment notification in `AssignTicketUseCase` (AC: 1, 3, 4)
  - [ ] Inject `NotificationService` into `AssignTicketUseCase`
  - [ ] After `aecRepository.save(aec)`, call `this.notificationService.notifyTicketAssigned(...)` inside a `Promise.resolve().then(...)` or `setImmediate` wrapper — fire-and-forget
  - [ ] Only call when `userId` is non-null (not unassigning)

- [ ] Task 4: Approval notification in `ApproveTicketUseCase` (AC: 2, 3, 4)
  - [ ] Inject `NotificationService` into `ApproveTicketUseCase`
  - [ ] After `aecRepository.save(aec)`, read `aec.assignedTo` — if non-null, fire-and-forget `notifyTicketReady(...)`
  - [ ] Resolve assigned developer's email via `NotificationService` (internal to service)

- [ ] Task 5: Tests — `NotificationService` unit tests (AC: 3, 4, 8)
  - [ ] Create `backend/src/notifications/notification.service.spec.ts`
  - [ ] Mock `FirestoreUserRepository.findById`, email transporter
  - [ ] Test: `notifyTicketAssigned` — happy path → `sendMail` called with correct subject + body
  - [ ] Test: `notifyTicketReady` — happy path → `sendMail` called with correct subject + body
  - [ ] Test: `notifyTicketReady` — user not found → `sendMail` NOT called, no exception thrown
  - [ ] Test: `sendMail` throws → exception is caught, not re-thrown (fire-and-forget contract)

- [ ] Task 6: Tests — Use case integration (AC: 3, 8)
  - [ ] Update `AssignTicketUseCase.spec.ts`: add mock for `NotificationService`; verify `notifyTicketAssigned` called on happy path; verify NOT called when `userId` is null
  - [ ] Update `ApproveTicketUseCase.spec.ts`: add mock for `NotificationService`; verify `notifyTicketReady` called when `assignedTo` is non-null; verify NOT called when `assignedTo` is null

- [ ] Task 7: TypeScript validation (AC: 9)
  - [ ] Run `tsc --noEmit` in `/backend` → 0 errors

## Dev Notes

### Architecture — Layers Touched

| Layer | File | Change |
|---|---|---|
| Infrastructure | `notifications/notification.service.ts` | NEW — email dispatch |
| Module | `notifications/notifications.module.ts` | NEW — exports NotificationService |
| Application | `AssignTicketUseCase.ts` | Inject NotificationService, fire-and-forget on assign |
| Application | `ApproveTicketUseCase.ts` | Inject NotificationService, fire-and-forget on approve |
| Module | `tickets.module.ts` | Import NotificationsModule |
| Tests | `notification.service.spec.ts` | NEW — 4 tests |
| Tests | `AssignTicketUseCase.spec.ts` | Updated — add 2 notification-related assertions |
| Tests | `ApproveTicketUseCase.spec.ts` | Updated — add 2 notification-related assertions |

### Finding the Existing Email Infrastructure

Forge already sends invitation emails (Epic 3 — `3-4-email-invitation-system`). Before implementing, locate the email sender:
```
grep -r "sendMail\|nodemailer\|transporter\|EmailService" backend/src --include="*.ts" -l
```
Reuse whatever service class / injection token is used there. Do **not** create a second transporter or import `nodemailer` directly in `NotificationService`.

### Fire-and-Forget Pattern

The notification must not block or fail the HTTP response:

```typescript
// In AssignTicketUseCase.execute():
await this.aecRepository.save(aec);

// Fire-and-forget — wrap in void promise, swallow all errors
void this.notificationService
  .notifyTicketAssigned(aec.id, command.userId, aec.title)
  .catch((err) => this.logger.warn('Notification failed (assign)', err));

return aec;
```

The same pattern applies in `ApproveTicketUseCase`. The `catch` lives inside `NotificationService` itself — but adding a `.catch` at the call site as a safety net is fine.

### Email Body Template (Plain Text)

**Assignment:**
```
Hi,

You've been assigned a new ticket on Forge.

Ticket: <ticket title>
Link: <APP_URL>/tickets/<ticketId>

You've been assigned a new ticket. It's ready for your review.

— The Forge Team
```

**Approved:**
```
Hi,

A ticket you're working on has been approved and is ready to execute.

Ticket: <ticket title>
Link: <APP_URL>/tickets/<ticketId>

Run `forge execute <ticketId>` to get started.

— The Forge Team
```

HTML versions are optional — plain text is sufficient for MVP.

### Resolving User Email

`NotificationService` needs to look up the assignee's email. The `FirestoreUserRepository` (already `@Global()`) should expose `findById(userId: string): Promise<User | null>`. Check the actual method signature before assuming — it may be `getById` or `findOne`.

If the user record has no `email` field (or is null), log at `warn` level and return early:
```typescript
const user = await this.userRepository.findById(userId);
if (!user?.email) {
  this.logger.warn(`Cannot send notification: user ${userId} has no email`);
  return;
}
```

### Environment Variable

`APP_URL` is already required by Epic 6 (used in device flow `verificationUri`). It is configured in `render.yaml` and `backend/.env`. No new env vars needed.

### References

- `backend/src/tickets/application/use-cases/AssignTicketUseCase.ts` — inject pattern reference
- `backend/src/tickets/application/use-cases/ApproveTicketUseCase.ts` — inject pattern reference
- Epic 3 email invitation implementation — find the email service/transporter to reuse
- `backend/src/shared/` — global services (`FirestoreUserRepository`) available via SharedModule

### Learnings from Previous Stories

**From Story 7-8 (ApproveTicketUseCase) and 7-7 (ReEnrichWithQAUseCase):**
- Use case injection: `@Inject(TOKEN) private readonly repo: IRepository` pattern
- `AEC_REPOSITORY` token imported from `'../ports/AECRepository'`
- `@TeamId()` decorator: `'../../shared/presentation/decorators/TeamId.decorator'`
- Pre-existing test failures in `CreateTeamUseCase` / `GetUserTeamsUseCase` are unrelated — don't fix them
- Use relative imports in spec files (not tsconfig aliases) — Jest doesn't resolve `@tickets/*` paths

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- to be filled in during implementation -->

### Debug Log References

### Completion Notes List

### File List

### Change Log
