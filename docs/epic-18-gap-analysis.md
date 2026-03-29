# Epic 18 — Gap Analysis

## What's Built vs What's Needed for Production

### Built (Ready to Test) ✅

| Component | Status | Tests |
|---|---|---|
| Session domain entity (state machine) | ✅ Complete | 11 tests |
| EventTranslator (stream-json → UI events) | ✅ Complete | 21 tests |
| UsageQuota entity (plan limits) | ✅ Complete | 11 tests |
| ComplexityAnalyzer (cloud eligibility) | ✅ Complete | 10 tests |
| Session ports + Firestore repository | ✅ Complete | — |
| Billing ports + Firestore repository | ✅ Complete | — |
| StartSession + CancelSession use cases | ✅ Complete | 6 tests |
| SSE controller with orchestrator | ✅ Complete | — |
| SessionOrchestrator (lifecycle mgmt) | ✅ Complete | — |
| StubSandboxAdapter (dev/testing) | ✅ Complete | — |
| E2BSandboxAdapter (placeholder) | ✅ Shell only | — |
| Container config (Dockerfile, bootstrap, MCP, prompt) | ✅ Complete | — |
| Developer notification on completion | ✅ Complete | — |
| Billing quota endpoint (GET /billing/quota) | ✅ Complete | — |
| Frontend session store (SSE consumer) | ✅ Complete | — |
| Frontend components (7 components) | ✅ Complete | — |
| Execute tab on ticket detail | ✅ Complete | — |

**Total: 59 tests, 0 regressions, build clean**

---

### Gaps (Required Before First Real Session) 🔴

| Gap | Priority | Effort | Description |
|---|---|---|---|
| **Real E2B adapter** | P0 | 1 day | `E2BSandboxAdapter` is a shell. Need to install E2B SDK, implement `create()` with real sandbox provisioning, process.start(), stdout/stderr streaming. See setup guide. |
| **GitHub App token generation** | P0 | 1 day | Controller currently passes empty `githubToken`. Need `GitHubAppService.generateInstallationToken(teamId)` to create short-lived repo-scoped tokens for the sandbox. Epic 17 spec has the design. |
| **System prompt injection** | P0 | 0.5 day | Controller passes empty `systemPrompt`. Need to load the template from `system-prompt.txt`, inject ticket context (from `get_ticket_context` MCP result or inline from AEC entity). |
| **AEC status transition** | P0 | 0.5 day | Clicking "Develop" should call `aec.startImplementation(branchName)` to move ticket APPROVED → EXECUTING. Currently only creates Session, doesn't update AEC. |
| **Quota deduction on success** | P0 | 0.5 day | After session completes successfully, deduct 1 from UsageQuota. Currently quota is checked but not deducted. |
| **Forge MCP server in sandbox** | P1 | 2-3 days | The MCP config points to `/root/forge-mcp-server/index.js` which doesn't exist in the container. Need to bundle the Forge MCP server (ticket context, execution events, settlement) into the container image. |

### Gaps (Required Before Launch) 🟡

| Gap | Priority | Effort | Description |
|---|---|---|---|
| **PR creation on completion** | P1 | 1 day | After Claude commits and pushes, backend should create a PR via GitHub App API. Currently `prUrl` and `prNumber` are null on completed sessions. |
| **Complexity gating in UI** | P1 | 0.5 day | `ComplexityAnalyzer` exists but isn't called from the frontend or the DevelopButton. Need to show recommendation and block complex tickets. |
| **Session failure → ticket rollback** | P1 | 0.5 day | If session fails, ticket should return to APPROVED (not stay in EXECUTING). Need `aec.rollbackToApproved()` or similar. |
| **Request Changes → re-run with feedback** | P2 | 1 day | When developer requests changes, next session should include the review feedback in the system prompt. |
| **Session history on Execute tab** | P2 | 1 day | After session completes, if user navigates away and comes back, they should see the completed session summary. Currently resets to idle. |
| **JobsPanel integration** | P2 | 0.5 day | Active Cloud Develop sessions should appear in the JobsPanel alongside spec generation jobs. |
| **Error boundary in frontend** | P2 | 0.5 day | SSE parsing errors, network disconnects, and component errors should be caught gracefully. |

### Gaps (Nice to Have / Phase 2) 🟢

| Gap | Priority | Effort | Description |
|---|---|---|---|
| Quick Change page (reverse flow) | Phase 2 | 2-3 days | Sidebar entry, repo selector, text input, auto-generate ticket. |
| Stripe billing integration | Phase 2 | 3-5 days | Replace manual quota with real subscription management. |
| BYOK settings UI | Phase 2 | 1 day | Settings page for users to enter their own API key. |
| Session reconnection/persistence | Phase 2 | 2 days | Firestore event log + replay on reconnect. |
| Container pooling / pre-warm | Phase 3 | 2 days | Pre-warmed sandboxes for instant startup. |
| Collaborative viewing | Phase 3 | 2 days | Multiple team members watch same session. |

---

## Integration Test Checklist

### With StubSandboxAdapter (no E2B needed)

- [ ] Navigate to an APPROVED ticket → see Execute tab
- [ ] Click "Start Development" → see provisioning view
- [ ] Provisioning transitions to running → see event stream
- [ ] Events render: messages as bubbles, tools as cards, bash as command cards
- [ ] Tool groups collapse multiple consecutive tools
- [ ] Session completes → see summary card
- [ ] Cancel during session → session stops
- [ ] Non-approved ticket → Develop button disabled
- [ ] GET /billing/quota returns quota info
- [ ] DevelopButton shows quota from API

### With E2B (requires setup)

- [ ] E2B sandbox provisions in <5 seconds
- [ ] Repo clones via GitHub installation token
- [ ] Claude Code starts with system prompt
- [ ] stream-json events flow through SSE to browser
- [ ] Events render correctly in real-time
- [ ] Session completes, PR is created on GitHub
- [ ] Developer notification email sent
- [ ] Sandbox destroyed after session
- [ ] Failed session → ticket returns to APPROVED

---

## Architecture Risks

| Risk | Impact | Current State | Mitigation |
|---|---|---|---|
| SSE connection dropped by proxy/LB | Session appears stuck | No reconnection | Add session persistence + reconnect (Phase 2) |
| Sandbox timeout (30 min) | Session fails | Handled by orchestrator | Error shown to user, ticket returns to APPROVED |
| Claude Code CLI update breaks stream-json | Events stop parsing | Version pinned in Dockerfile | Weekly CI rebuild with testing |
| Render deploy kills active SSE | Active sessions terminated | No protection | Upgrade to Render paid for zero-downtime deploys |
| Concurrent sessions on same ticket | Duplicate work | Guarded by `findActiveByTicket` | ConflictException thrown |

---

## File Inventory

```
NEW FILES (backend):
  backend/src/sessions/domain/Session.ts
  backend/src/sessions/domain/SessionStatus.ts
  backend/src/sessions/domain/InvalidSessionTransitionError.ts
  backend/src/sessions/domain/__tests__/Session.spec.ts
  backend/src/sessions/application/ports/SessionRepository.port.ts
  backend/src/sessions/application/ports/SandboxPort.ts
  backend/src/sessions/application/ports/index.ts
  backend/src/sessions/application/services/EventTranslator.ts
  backend/src/sessions/application/services/__tests__/EventTranslator.spec.ts
  backend/src/sessions/application/services/ComplexityAnalyzer.ts
  backend/src/sessions/application/services/__tests__/ComplexityAnalyzer.spec.ts
  backend/src/sessions/application/services/SessionOrchestrator.ts
  backend/src/sessions/application/use-cases/StartSessionUseCase.ts
  backend/src/sessions/application/use-cases/CancelSessionUseCase.ts
  backend/src/sessions/application/use-cases/__tests__/StartSessionUseCase.spec.ts
  backend/src/sessions/infrastructure/persistence/FirestoreSessionRepository.ts
  backend/src/sessions/infrastructure/mappers/SessionMapper.ts
  backend/src/sessions/infrastructure/sandbox/StubSandboxAdapter.ts
  backend/src/sessions/infrastructure/sandbox/E2BSandboxAdapter.ts
  backend/src/sessions/infrastructure/container/forge-sandbox.Dockerfile
  backend/src/sessions/infrastructure/container/bootstrap.sh
  backend/src/sessions/infrastructure/container/forge-mcp-config.json
  backend/src/sessions/infrastructure/container/system-prompt.txt
  backend/src/sessions/presentation/controllers/sessions.controller.ts
  backend/src/sessions/presentation/dto/StartSessionDto.ts
  backend/src/sessions/sessions.module.ts
  backend/src/billing/domain/UsageQuota.ts
  backend/src/billing/domain/__tests__/UsageQuota.spec.ts
  backend/src/billing/application/ports/UsageQuotaRepository.port.ts
  backend/src/billing/application/ports/index.ts
  backend/src/billing/application/use-cases/GetQuotaUseCase.ts
  backend/src/billing/infrastructure/persistence/FirestoreUsageQuotaRepository.ts
  backend/src/billing/infrastructure/mappers/UsageQuotaMapper.ts
  backend/src/billing/presentation/controllers/billing.controller.ts
  backend/src/billing/billing.module.ts

NEW FILES (frontend):
  client/src/sessions/types/session.types.ts
  client/src/sessions/stores/session.store.ts
  client/src/sessions/components/DevelopButton.tsx
  client/src/sessions/components/SessionMonitorView.tsx
  client/src/sessions/components/SessionMessage.tsx
  client/src/sessions/components/SessionToolCard.tsx
  client/src/sessions/components/SessionToolGroup.tsx
  client/src/sessions/components/SessionSummary.tsx
  client/src/sessions/components/SessionProvisioningView.tsx

MODIFIED FILES (additive only):
  backend/src/app.module.ts — added SessionsModule import
  client/src/tickets/components/detail/TicketDetailLayout.tsx — added Execute tab

DOCS:
  docs/epic-18-cloud-develop-unified.md — full spec
  docs/epic-18-e2b-setup-guide.md — E2B setup instructions
  docs/epic-18-gap-analysis.md — this file
  docs/superpowers/plans/2026-03-29-cloud-develop-epic-18.md — implementation plan
  docs/marketing/Forge-Product-Vision.pdf — marketing teaser
```
