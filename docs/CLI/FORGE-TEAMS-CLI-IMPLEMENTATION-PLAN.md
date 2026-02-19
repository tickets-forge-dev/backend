# Forge Teams & CLI - Implementation Plan

**Version:** 1.0
**Date:** 2026-02-17
**Architecture:** [FORGE-TEAMS-CLI-ARCHITECTURE.md](./FORGE-TEAMS-CLI-ARCHITECTURE.md)

---

## Overview

This implementation plan covers two major features:
1. **Team Management** - Multi-user workspaces with role-based access
2. **CLI with MCP** - Developer CLI for ticket execution

**Total Epics:** 6
**Estimated Duration:** 10-12 weeks
**Team Size:** 1-2 developers

---

## Implementation Sequence

```
Week 1-2:  Epic 1 (Team Management Backend)
Week 2-3:  Epic 2 (Team Management Frontend)
Week 3-5:  Epic 3 (CLI Foundation)
Week 5-7:  Epic 4 (MCP Server)
Week 7-9:  Epic 5 (Ticket Lifecycle Updates)
Week 9-10: Epic 6 (Testing & Documentation)
```

---

## Epic 1: Team Management - Backend Foundation

**Goal:** Add users, workspace members, and role-based permissions to backend

**Duration:** 2 weeks
**Priority:** P0 (Blocker for multi-user access)
**Dependencies:** None

### Stories

#### Story 1.1: Users Collection Domain Model
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Create `User` domain entity (userId, email, displayName, photoURL, defaultWorkspaceId)
- [ ] Create `UserRepository` port interface
- [ ] Add `User.create()` and `reconstitute()` factory methods
- [ ] Add validation (email format, required fields)

**Files:**
- `backend/src/users/domain/User.ts`
- `backend/src/users/application/ports/UserRepository.ts`

---

#### Story 1.2: Users Firestore Repository
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Implement `FirestoreUserRepository`
- [ ] CRUD operations (save, findById, findByEmail, update)
- [ ] Store at path: `/users/{userId}`
- [ ] Add user creation on first login (extend existing auth flow)

**Files:**
- `backend/src/users/infrastructure/persistence/FirestoreUserRepository.ts`
- `backend/src/workspaces/presentation/controllers/auth.controller.ts` (extend)

---

#### Story 1.3: WorkspaceMember Domain Model
**Estimate:** 3 days
**Acceptance Criteria:**
- [ ] Create `WorkspaceMember` entity (userId, workspaceId, role, status)
- [ ] Create `Role` enum (Admin, Developer, PM, QA)
- [ ] Create `MemberStatus` enum (Invited, Active, Removed)
- [ ] Add `WorkspaceMemberRepository` port
- [ ] Add methods: `isActive()`, `hasRole()`, `canExecuteTickets()`, `canApproveTickets()`

**Files:**
- `backend/src/workspaces/domain/WorkspaceMember.ts`
- `backend/src/workspaces/domain/Role.ts`
- `backend/src/workspaces/domain/MemberStatus.ts`
- `backend/src/workspaces/application/ports/WorkspaceMemberRepository.ts`

---

#### Story 1.4: WorkspaceMember Firestore Repository
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Implement `FirestoreWorkspaceMemberRepository`
- [ ] Store at path: `/workspaces/{workspaceId}/members/{userId}`
- [ ] CRUD operations (save, findByWorkspace, findByUser, delete)
- [ ] Add indexes for queries (workspaceId, userId, status)

**Files:**
- `backend/src/workspaces/infrastructure/persistence/FirestoreWorkspaceMemberRepository.ts`

---

#### Story 1.5: Extend Workspace Domain with Members
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Add methods to `Workspace`: `addMember()`, `removeMember()`, `changeMemberRole()`
- [ ] Add `getMemberRole(userId)` query method
- [ ] Add `isMember(userId)` validation method
- [ ] Ensure owner is auto-added as Admin member on workspace creation

**Files:**
- `backend/src/workspaces/domain/Workspace.ts` (extend)
- `backend/src/workspaces/application/use-cases/CreateWorkspaceUseCase.ts` (extend)

---

#### Story 1.6: Member Management Use Cases
**Estimate:** 3 days
**Acceptance Criteria:**
- [ ] Create `InviteMemberUseCase` (validates email, creates member, sends invite)
- [ ] Create `RemoveMemberUseCase` (validates not owner, marks removed)
- [ ] Create `ChangeMemberRoleUseCase` (validates not owner, updates role)
- [ ] Create `ListWorkspaceMembersUseCase` (returns active members)
- [ ] Add authorization checks (only Admin can manage members)

**Files:**
- `backend/src/workspaces/application/use-cases/InviteMemberUseCase.ts`
- `backend/src/workspaces/application/use-cases/RemoveMemberUseCase.ts`
- `backend/src/workspaces/application/use-cases/ChangeMemberRoleUseCase.ts`
- `backend/src/workspaces/application/use-cases/ListWorkspaceMembersUseCase.ts`

---

#### Story 1.7: Member Management API Endpoints
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] POST `/workspaces/:id/members` - Invite member (body: email, role)
- [ ] DELETE `/workspaces/:id/members/:userId` - Remove member
- [ ] PATCH `/workspaces/:id/members/:userId` - Change role (body: role)
- [ ] GET `/workspaces/:id/members` - List members
- [ ] Add DTOs with validation decorators
- [ ] Add WorkspaceGuard (verify user is member)

**Files:**
- `backend/src/workspaces/presentation/controllers/workspaces.controller.ts` (extend)
- `backend/src/workspaces/presentation/dtos/InviteMemberDto.ts`
- `backend/src/workspaces/presentation/dtos/ChangeMemberRoleDto.ts`
- `backend/src/shared/presentation/guards/WorkspaceGuard.ts` (extend)

---

#### Story 1.8: Role-Based Authorization Guards
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Create `RoleGuard` decorator (checks user has required role)
- [ ] Add `@RequireRole('admin')` decorator
- [ ] Update ticket endpoints with role checks:
  - Execute: Developer or Admin only
  - Approve: PM or Admin only
  - Create: All roles
- [ ] Add unit tests for guards

**Files:**
- `backend/src/shared/presentation/guards/RoleGuard.ts`
- `backend/src/shared/presentation/decorators/RequireRole.ts`
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` (extend)

---

**Epic 1 Total:** 8 stories, ~16 days

---

## Epic 2: Team Management - Frontend UI

**Goal:** Add workspace settings page for managing team members

**Duration:** 1.5 weeks
**Priority:** P0
**Dependencies:** Epic 1 complete

### Stories

#### Story 2.1: Workspace Service
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Create `WorkspaceService` with methods:
  - `inviteMember(workspaceId, email, role)`
  - `removeMember(workspaceId, userId)`
  - `changeMemberRole(workspaceId, userId, role)`
  - `getMembers(workspaceId)`
- [ ] Add error handling (network, validation, permissions)

**Files:**
- `client/src/services/workspace.service.ts`

---

#### Story 2.2: Workspace Store
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Create `useWorkspaceStore` with Zustand
- [ ] State: `members`, `isLoadingMembers`, `memberError`
- [ ] Actions: `loadMembers()`, `inviteMember()`, `removeMember()`, `changeRole()`
- [ ] Integration with `WorkspaceService`

**Files:**
- `client/src/stores/workspace.store.ts`

---

#### Story 2.3: Workspace Settings Page
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Create settings page at `/settings/workspace`
- [ ] Show workspace name (editable)
- [ ] Show workspace ID (read-only)
- [ ] Show owner info
- [ ] Navigation tab: "Team Members"

**Files:**
- `client/app/(main)/settings/workspace/page.tsx`

---

#### Story 2.4: Team Members List Component
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Display table with columns: Name, Email, Role, Status, Actions
- [ ] Show role badges (color-coded: Admin=red, Dev=blue, PM=green, QA=purple)
- [ ] Show status badges (Active=green, Invited=yellow, Removed=gray)
- [ ] Owner row highlighted (cannot be removed/changed)
- [ ] Loading state (skeleton)
- [ ] Empty state (no members yet)

**Files:**
- `client/src/settings/components/TeamMembersList.tsx`
- `client/src/settings/components/MemberRow.tsx`

---

#### Story 2.5: Invite Member Dialog
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Modal dialog with form: email input + role dropdown
- [ ] Validate email format
- [ ] Role options: Developer, PM, QA (Admin not selectable, owner only)
- [ ] Submit → call `inviteMember()` → show success toast
- [ ] Error handling (member already exists, invalid email)

**Files:**
- `client/src/settings/components/InviteMemberDialog.tsx`

---

#### Story 2.6: Member Actions (Remove, Change Role)
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Dropdown menu on each row (3-dot menu)
- [ ] "Change Role" → opens dropdown with roles → updates on select
- [ ] "Remove Member" → confirmation dialog → removes member
- [ ] Disabled for owner row
- [ ] Success/error toasts

**Files:**
- `client/src/settings/components/MemberActionsMenu.tsx`
- `client/src/settings/components/RemoveMemberDialog.tsx`

---

**Epic 2 Total:** 6 stories, ~9 days

---

## Epic 3: CLI Foundation

**Goal:** Build CLI with authentication, ticket list, and ticket viewer

**Duration:** 2 weeks
**Priority:** P0
**Dependencies:** None (can run parallel to Epic 1-2)

### Stories

#### Story 3.1: CLI Package Setup
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Create `cli/` package in monorepo
- [ ] Setup TypeScript + tsconfig
- [ ] Add dependencies: commander, inquirer, ora, chalk, axios
- [ ] Create bin entry point: `forge`
- [ ] Add to root package.json workspaces

**Files:**
- `cli/package.json`
- `cli/tsconfig.json`
- `cli/src/index.ts`

---

#### Story 3.2: API Service (Backend Communication)
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Create `ApiService` class
- [ ] Methods: `getTickets()`, `getTicket(id)`, `updateTicket(id, data)`
- [ ] Auto-inject auth token from config
- [ ] Auto-refresh token on 401
- [ ] Error handling (network, validation, auth)

**Files:**
- `cli/src/services/api.service.ts`

---

#### Story 3.3: Auth Service (Token Management)
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Create `AuthService` class
- [ ] Load/save config from `~/.forge/config.json`
- [ ] Methods: `getToken()`, `storeToken()`, `refreshToken()`, `clearToken()`
- [ ] Create config directory if not exists
- [ ] Set file permissions (chmod 600)

**Files:**
- `cli/src/services/auth.service.ts`

---

#### Story 3.4: Device Flow Authentication Backend
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Add endpoint: POST `/auth/device/request` → returns deviceCode, userCode, verificationUri
- [ ] Add endpoint: POST `/auth/device/token` → polls for token (deviceCode → accessToken)
- [ ] Add endpoint: POST `/auth/device/refresh` → refresh access token
- [ ] Store pending device codes in memory (expire after 10 minutes)
- [ ] Generate 6-character userCode (e.g., ABCD-1234)

**Files:**
- `backend/src/auth/presentation/controllers/device-auth.controller.ts`
- `backend/src/auth/application/use-cases/RequestDeviceCodeUseCase.ts`
- `backend/src/auth/application/use-cases/PollDeviceTokenUseCase.ts`

---

#### Story 3.5: Login Command (Device Flow)
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Implement `forge login` command
- [ ] Request device code from backend
- [ ] Display verification URL + user code
- [ ] Auto-open browser to verification URL
- [ ] Poll backend every 5 seconds for token
- [ ] Show spinner "Waiting for authorization..."
- [ ] Store token on success
- [ ] Show error if timeout (10 minutes)

**Files:**
- `cli/src/commands/login.ts`

---

#### Story 3.6: List Command (Interactive Ticket List)
**Estimate:** 3 days
**Acceptance Criteria:**
- [ ] Implement `forge list` command
- [ ] Fetch tickets from backend (filter: assigned to me)
- [ ] Display interactive list with inquirer (arrow keys, enter)
- [ ] Format rows: `[status icon] ID  Title (40 chars)  Assignee`
- [ ] Status icons: ⚡=ready-for-dev, ❓=questions, 📝=draft, ⏳=in-progress, ✅=complete
- [ ] On Enter: show ticket details (call `forge show`)
- [ ] Support flags: `--all`, `--status <status>`

**Files:**
- `cli/src/commands/list.ts`
- `cli/src/ui/formatters.ts`
- `cli/src/ui/icons.ts`

---

#### Story 3.7: Show Command (Ticket Details)
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Implement `forge show <ticketId>` command
- [ ] Fetch ticket from backend
- [ ] Display full details:
  - Header: ID, Title, Status, Assigned, Priority, Quality Score
  - Problem Statement (section)
  - Solution (section)
  - Acceptance Criteria (numbered list)
  - File Changes (grouped by backend/frontend, with line counts)
  - API Changes (method + route)
  - Test Plan (grouped by type)
  - Design References (Figma/Loom links)
- [ ] Paginate if content > terminal height
- [ ] Action menu: [E]xecute, [W]eb, [B]ack, [Q]uit

**Files:**
- `cli/src/commands/show.ts`
- `cli/src/ui/pager.ts`

---

#### Story 3.8: Status Command
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Implement `forge status` command
- [ ] Show current user (email, name)
- [ ] Show workspace (ID, name)
- [ ] Show token expiry
- [ ] Show CLI version

**Files:**
- `cli/src/commands/status.ts`

---

**Epic 3 Total:** 8 stories, ~14 days

---

## Epic 4: MCP Server Implementation

**Goal:** Build MCP server with tools and prompts for ticket execution

**Duration:** 2 weeks
**Priority:** P0
**Dependencies:** Epic 3 complete

### Stories

#### Story 4.1: MCP Server Foundation
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Add dependency: `@modelcontextprotocol/sdk`
- [ ] Create `ForgeMCPServer` class
- [ ] Initialize server with stdio transport
- [ ] Register tools handler skeleton
- [ ] Register prompts handler skeleton
- [ ] Start/stop methods

**Files:**
- `cli/src/mcp/server.ts`
- `cli/package.json` (add @modelcontextprotocol/sdk)

---

#### Story 4.2: MCP Tool - get_ticket_context
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Register tool `get_ticket_context`
- [ ] Input: `{ ticketId: string }`
- [ ] Fetch ticket from backend via ApiService
- [ ] Return JSON with: id, title, description, problemStatement, solution, AC, fileChanges, apiChanges, testPlan, designRefs
- [ ] Error handling (ticket not found, unauthorized)

**Files:**
- `cli/src/mcp/tools/get-ticket-context.ts`

---

#### Story 4.3: MCP Tool - get_file_changes
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Register tool `get_file_changes`
- [ ] Input: `{ ticketId: string }`
- [ ] Return array of file changes with: path, action (create/modify), changes (line count), content (if new file)
- [ ] Error handling

**Files:**
- `cli/src/mcp/tools/get-file-changes.ts`

---

#### Story 4.4: MCP Tool - get_repository_context
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Register tool `get_repository_context`
- [ ] Input: `{ path?: string }`
- [ ] Return: current branch, file tree (ls-tree), git status, working directory
- [ ] Use `simple-git` library
- [ ] Error handling (not a git repo)

**Files:**
- `cli/src/mcp/tools/get-repository-context.ts`
- `cli/src/services/git.service.ts`

---

#### Story 4.5: MCP Tool - update_ticket_status
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Register tool `update_ticket_status`
- [ ] Input: `{ ticketId: string, status: string }`
- [ ] Call backend PATCH `/tickets/:id` with status
- [ ] Return success message
- [ ] Error handling (invalid status, unauthorized)

**Files:**
- `cli/src/mcp/tools/update-ticket-status.ts`

---

#### Story 4.6: Agent Guide - dev-executor.md
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Create markdown file with agent persona
- [ ] Sections: Persona, Principles, Process, Code Quality Rules, Examples
- [ ] Instructions: implement spec exactly, follow AC, match project style
- [ ] Good/bad examples of code
- [ ] Keep under 500 lines

**Files:**
- `cli/src/agents/dev-executor.md`

---

#### Story 4.7: Agent Guide - dev-reviewer.md
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Create markdown file with agent persona
- [ ] Sections: Persona, Principles, Question Categories, Examples
- [ ] Instructions: ask 5-10 technical questions, focus on architecture/constraints
- [ ] Good/bad examples of questions
- [ ] Keep under 300 lines

**Files:**
- `cli/src/agents/dev-reviewer.md`

---

#### Story 4.8: MCP Prompt - forge_execute
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Register prompt `forge_execute`
- [ ] Input: `{ ticketId: string }`
- [ ] Load `dev-executor.md` agent guide
- [ ] Load ticket context (problem, solution, AC, files)
- [ ] Format as XML: `<ticket_context>`, `<file_changes>`, `<acceptance_criteria>`
- [ ] Return prompt with guide + context
- [ ] Instruct: "Implement this ticket, use MCP tools for repo context, call update_ticket_status when done"

**Files:**
- `cli/src/mcp/prompts/forge-execute.ts`

---

#### Story 4.9: MCP Prompt - forge_review
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Register prompt `forge_review`
- [ ] Input: `{ ticketId: string }`
- [ ] Load `dev-reviewer.md` agent guide
- [ ] Load ticket summary (title, description, design refs)
- [ ] Return prompt with guide + context
- [ ] Instruct: "Generate 5-10 technical questions, return as JSON"

**Files:**
- `cli/src/mcp/prompts/forge-review.ts`

---

#### Story 4.10: Execute Command (Start MCP)
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Implement `forge execute <ticketId>` command
- [ ] Validate ticket status == ready-for-dev
- [ ] Auto-assign ticket to current user
- [ ] Start MCP server (stdio)
- [ ] Print instructions: "Open Claude Code and invoke forge_execute"
- [ ] Wait for Ctrl+C to stop server
- [ ] Show summary when agent completes

**Files:**
- `cli/src/commands/execute.ts`

---

#### Story 4.11: Review Command (Start MCP)
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Implement `forge review <ticketId>` command
- [ ] Validate ticket status == ready-for-dev-review
- [ ] Start MCP server
- [ ] Print instructions: "Open Claude Code and invoke forge_review"
- [ ] Wait for Ctrl+C
- [ ] On completion: save questions to backend

**Files:**
- `cli/src/commands/review.ts`

---

**Epic 4 Total:** 11 stories, ~15 days

---

## Epic 5: Ticket Lifecycle Updates

**Goal:** Update ticket domain and UI to support new lifecycle states

**Duration:** 2 weeks
**Priority:** P1
**Dependencies:** Epic 1 complete (role-based auth)

### Stories

#### Story 5.1: Extend AECStatus Enum
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Add new statuses to enum: READY_FOR_DEV_REVIEW, QUESTIONS_GENERATED, WAITING_FOR_APPROVAL, READY_FOR_DEV
- [ ] Update AEC validation to allow new states
- [ ] Add transition methods: `markReadyForDevReview()`, `markQuestionsGenerated()`, `markWaitingForApproval()`, `approve()`
- [ ] Update AECMapper to handle new statuses

**Files:**
- `backend/src/tickets/domain/aec/AECStatus.ts`
- `backend/src/tickets/domain/aec/AEC.ts`
- `backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts`

---

#### Story 5.2: Add Questions to AEC Domain
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Add `_questions: ClarificationQuestion[]` field to AEC
- [ ] Add `addQuestions(questions)` method
- [ ] Add `getUnansweredQuestions()` query
- [ ] Add `areAllQuestionsAnswered()` validation
- [ ] Update reconstitute factory

**Files:**
- `backend/src/tickets/domain/aec/AEC.ts`

---

#### Story 5.3: Add Questions Endpoints
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] POST `/tickets/:id/questions` - Add questions (dev review)
- [ ] PATCH `/tickets/:id/questions/:qid` - Answer question (PM)
- [ ] POST `/tickets/:id/approve` - Approve ticket (PM only)
- [ ] Add DTOs with validation
- [ ] Add role guards (Developer for questions, PM for approve)

**Files:**
- `backend/src/tickets/presentation/controllers/tickets.controller.ts`
- `backend/src/tickets/presentation/dtos/AddQuestionsDto.ts`
- `backend/src/tickets/application/use-cases/AddQuestionsUseCase.ts`
- `backend/src/tickets/application/use-cases/ApproveTicketUseCase.ts`

---

#### Story 5.4: Update Ticket List Filters
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Add status filters: ready-for-dev-review, questions-generated, waiting-for-approval, ready-for-dev
- [ ] Update status badges (color-coded)
- [ ] Add filter dropdown in ticket list page

**Files:**
- `client/app/(main)/tickets/page.tsx`
- `client/src/tickets/components/StatusBadge.tsx`

---

#### Story 5.5: Questions Section in Ticket Detail
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Add "Clarification Questions" section to ticket detail page
- [ ] Show question list with answered/unanswered status
- [ ] PM can answer questions (text input / radio / checkboxes based on type)
- [ ] Developer view: read-only (cannot answer)
- [ ] Show who asked question + timestamp

**Files:**
- `client/app/(main)/tickets/[id]/page.tsx`
- `client/src/tickets/components/detail/QuestionsSection.tsx`
- `client/src/tickets/components/detail/QuestionCard.tsx`

---

#### Story 5.6: Approve Button (PM Only)
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Add "Approve" button to ticket detail (only if status = waiting-for-approval)
- [ ] Only visible to PM role
- [ ] Confirmation dialog: "Approve ticket? Developer can execute after approval."
- [ ] Calls backend POST `/tickets/:id/approve`
- [ ] Updates ticket status to ready-for-dev

**Files:**
- `client/app/(main)/tickets/[id]/page.tsx`
- `client/src/tickets/components/ApproveTicketDialog.tsx`

---

**Epic 5 Total:** 6 stories, ~9 days

---

## Epic 6: Testing & Documentation

**Goal:** Write tests and documentation for teams and CLI

**Duration:** 1 week
**Priority:** P2
**Dependencies:** All epics complete

### Stories

#### Story 6.1: Backend Unit Tests
**Estimate:** 3 days
**Acceptance Criteria:**
- [ ] Test User domain entity
- [ ] Test WorkspaceMember domain entity
- [ ] Test Workspace member methods
- [ ] Test InviteMemberUseCase
- [ ] Test RemoveMemberUseCase
- [ ] Test RoleGuard
- [ ] Test Device Auth endpoints

**Files:**
- `backend/src/users/domain/__tests__/User.spec.ts`
- `backend/src/workspaces/domain/__tests__/WorkspaceMember.spec.ts`
- `backend/src/workspaces/application/use-cases/__tests__/InviteMemberUseCase.spec.ts`
- (etc.)

---

#### Story 6.2: Frontend Component Tests
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Test TeamMembersList component
- [ ] Test InviteMemberDialog
- [ ] Test MemberActionsMenu
- [ ] Test QuestionsSection

**Files:**
- `client/src/settings/components/__tests__/TeamMembersList.test.tsx`
- (etc.)

---

#### Story 6.3: CLI Integration Tests
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Test `forge login` command (mock backend)
- [ ] Test `forge list` command
- [ ] Test `forge show <id>` command
- [ ] Test MCP server tools
- [ ] Test MCP server prompts

**Files:**
- `cli/src/commands/__tests__/login.test.ts`
- `cli/src/mcp/__tests__/server.test.ts`

---

#### Story 6.4: User Documentation
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Update README with team management section
- [ ] Create CLI installation guide
- [ ] Create CLI usage guide (forge login, list, execute)
- [ ] Create team management guide (invite members, roles)
- [ ] Add screenshots/GIFs

**Files:**
- `docs/CLI-GUIDE.md`
- `docs/TEAM-MANAGEMENT.md`
- `README.md` (update)

---

#### Story 6.5: Developer Documentation
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Document new API endpoints
- [ ] Document MCP server protocol
- [ ] Document agent guide format
- [ ] Update architecture diagrams

**Files:**
- `docs/API.md` (update)
- `docs/MCP-PROTOCOL.md`
- `docs/AGENT-GUIDES.md`

---

**Epic 6 Total:** 5 stories, ~10 days

---

## Summary

| Epic | Stories | Days | Priority |
|------|---------|------|----------|
| Epic 1: Team Management Backend | 8 | 16 | P0 |
| Epic 2: Team Management Frontend | 6 | 9 | P0 |
| Epic 3: CLI Foundation | 8 | 14 | P0 |
| Epic 4: MCP Server | 11 | 15 | P0 |
| Epic 5: Ticket Lifecycle | 6 | 9 | P1 |
| Epic 6: Testing & Docs | 5 | 10 | P2 |
| **Total** | **44 stories** | **73 days** | - |

**With 1 developer:** ~15 weeks
**With 2 developers (parallel):** ~10 weeks

---

## Critical Path

```
Week 1-2:   Epic 1 (Backend)
Week 2-3:   Epic 2 (Frontend)
Week 3-5:   Epic 3 (CLI) ← Can run parallel to Epic 1-2
Week 5-7:   Epic 4 (MCP) ← Depends on Epic 3
Week 7-9:   Epic 5 (Lifecycle) ← Depends on Epic 1
Week 9-10:  Epic 6 (Testing)
```

---

## Dependencies Graph

```
        Epic 1 (Backend)
             ↓
        Epic 2 (Frontend)
             ↓
        Epic 5 (Lifecycle)
             ↓
        Epic 6 (Testing)

        Epic 3 (CLI Foundation)
             ↓
        Epic 4 (MCP Server)
             ↓
        Epic 6 (Testing)
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| MCP SDK breaking changes | High | Pin version, test thoroughly |
| Device flow UX confusing | Medium | Add clear instructions, screenshots |
| Role permissions too complex | Medium | Start simple (3 roles), expand later |
| CLI not working with all agents | High | Test with Claude Code, Cursor, Windsurf |
| Firebase Firestore limits hit | Low | Current usage << limits |

---

**Status:** Ready for Implementation
**Next Step:** Start Epic 1, Story 1.1
