# SUPER SPRINT: Forge Teams + CLI + MCP - Complete Implementation

**Version:** 2.0 (Reconciled)
**Date:** 2026-02-17
**Status:** 📋 Ready for Implementation

---

## 🎯 Executive Summary

This super-sprint implements the complete Team-based architecture from the brainstorming session, including:
- ✅ **Team as top-level entity** (not workspace)
- ✅ **Multiple teams per user** (with team switcher)
- ✅ **Multi-workspace per team** (up to 3 repos each)
- ✅ **CLI + MCP server** (developer execution layer)
- ✅ **Ticket lifecycle** (PM → Dev → PM → Dev workflow)
- ✅ **Role-based permissions** (Admin, Developer, PM, QA)

**Timeline:** 12-14 weeks
**Team Size:** 2-3 developers

---

## 📚 Reference Documents

1. **[Brainstorming Session](./brainstorming-session-teams-roles-2026-02-16.md)** - Original vision
2. **[Architecture Doc](./FORGE-TEAMS-CLI-ARCHITECTURE.md)** - System design (needs update)
3. **[Implementation Plan](./FORGE-TEAMS-CLI-IMPLEMENTATION-PLAN.md)** - Original plan (superseded by this)

---

## 🏗️ Correct Architecture Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                          Team                               │
│                    (Sarah's Team)                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Members:                                                   │
│    • Sarah (Admin) 👑                                       │
│    • John (Developer) 💻                                    │
│    • Alice (PM) 📝                                          │
│                                                             │
│  Workspaces:                                                │
│    • Forge Workspace                                        │
│      ├─ forge-client (repo)                                 │
│      ├─ forge-backend (repo)                                │
│      └─ forge-shared (repo)                                 │
│    • Internal Tools Workspace                               │
│      └─ internal-api (repo)                                 │
│                                                             │
│  Tickets:                                                   │
│    • ABC-123: Add user authentication (Forge Workspace)    │
│    • ABC-124: Fix login bug (Internal Tools Workspace)     │
│                                                             │
│  Settings:                                                  │
│    • GitHub integration (team-level)                        │
│    • Jira integration (team-level)                          │
│    • Linear integration (team-level)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Epic Overview

| Epic | Duration | Stories | Priority | Description |
|------|----------|---------|----------|-------------|
| **Epic 1: Team Foundation** | 2.5 weeks | 10 | P0 | Team CRUD, multi-team, switcher |
| **Epic 2: Workspace Management** | 2 weeks | 8 | P0 | Workspace CRUD, multi-repo |
| **Epic 3: Members & Roles** | 2 weeks | 8 | P0 | Invitations, RBAC, permissions |
| **Epic 4: Enhanced Onboarding** | 1 week | 4 | P0 | Team name, role selection |
| **Epic 5: CLI Foundation** | 2 weeks | 8 | P0 | Auth, list, show commands |
| **Epic 6: MCP Server** | 2 weeks | 11 | P0 | Tools, prompts, agent guides |
| **Epic 7: Ticket Lifecycle** | 2 weeks | 9 | P1 | New states, questions, approval |
| **Epic 8: Testing & Docs** | 1.5 weeks | 6 | P2 | Tests, documentation |

**Total:** 8 Epics, 64 Stories, ~15 weeks (with 2-3 devs)

---

## Epic 1: Team Foundation (P0)

**Goal:** Implement Team as top-level organizational entity with multi-team support

**Duration:** 2.5 weeks (12 days)
**Dependencies:** None

### Architecture

**Firestore Collections:**
```
/teams/{teamId}
  - id: string (auto-generated)
  - name: string (user-provided, e.g., "Sarah's Team")
  - slug: string (unique, e.g., "sarahs-team-abc123")
  - ownerId: string (creator, always Admin)
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - settings: {
      defaultWorkspaceId?: string
      allowMemberInvites: boolean (default: true)
    }

/teams/{teamId}/members/{userId}
  - userId: string
  - email: string
  - displayName: string
  - role: 'admin' | 'developer' | 'pm' | 'qa'
  - status: 'active' | 'invited' | 'removed'
  - invitedBy: string (userId)
  - invitedAt: Timestamp
  - joinedAt?: Timestamp

/users/{userId}
  - userId: string (Firebase UID)
  - email: string
  - displayName: string
  - photoURL?: string
  - currentTeamId: string (last selected team)
  - teams: string[] (array of teamIds user belongs to)
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

### Stories

#### Story 1.1: Team Domain Model
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Create `Team` domain entity
- [ ] Fields: id, name, slug, ownerId, createdAt, updatedAt, settings
- [ ] Methods: `create()`, `reconstitute()`, `updateName()`, `updateSettings()`
- [ ] Validation: name required (3-50 chars), slug unique

**Files:**
- `backend/src/teams/domain/Team.ts`

---

#### Story 1.2: Team Repository
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Create `TeamRepository` port interface
- [ ] Implement `FirestoreTeamRepository`
- [ ] Methods: save, findById, findBySlug, findByOwnerId, update, delete
- [ ] Store at path: `/teams/{teamId}`

**Files:**
- `backend/src/teams/application/ports/TeamRepository.ts`
- `backend/src/teams/infrastructure/persistence/FirestoreTeamRepository.ts`

---

#### Story 1.3: User Domain Model Extension
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Extend `User` entity with: currentTeamId, teams[] array
- [ ] Add methods: `addTeam(teamId)`, `removeTeam(teamId)`, `setCurrentTeam(teamId)`
- [ ] Add `getTeams()` query method

**Files:**
- `backend/src/users/domain/User.ts`

---

#### Story 1.4: Team Use Cases (CRUD)
**Estimate:** 3 days

**Acceptance Criteria:**
- [ ] Create `CreateTeamUseCase` (validates name, generates slug, auto-adds owner as Admin member)
- [ ] Create `UpdateTeamUseCase` (validates ownership, updates name/settings)
- [ ] Create `DeleteTeamUseCase` (validates ownership, soft-delete, removes all members)
- [ ] Create `GetUserTeamsUseCase` (returns all teams user belongs to)
- [ ] Create `SwitchTeamUseCase` (updates user's currentTeamId)

**Files:**
- `backend/src/teams/application/use-cases/CreateTeamUseCase.ts`
- `backend/src/teams/application/use-cases/UpdateTeamUseCase.ts`
- `backend/src/teams/application/use-cases/DeleteTeamUseCase.ts`
- `backend/src/teams/application/use-cases/GetUserTeamsUseCase.ts`
- `backend/src/teams/application/use-cases/SwitchTeamUseCase.ts`

---

#### Story 1.5: Team API Endpoints
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] POST `/teams` - Create team (body: name)
- [ ] GET `/teams` - List user's teams
- [ ] GET `/teams/:id` - Get team details
- [ ] PATCH `/teams/:id` - Update team (body: name, settings)
- [ ] DELETE `/teams/:id` - Delete team (owner only)
- [ ] POST `/teams/:id/switch` - Switch current team
- [ ] Add DTOs with validation

**Files:**
- `backend/src/teams/presentation/controllers/teams.controller.ts`
- `backend/src/teams/presentation/dtos/CreateTeamDto.ts`
- `backend/src/teams/presentation/dtos/UpdateTeamDto.ts`

---

#### Story 1.6: Team Service (Frontend)
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Create `TeamService` with methods: createTeam, getTeams, updateTeam, deleteTeam, switchTeam
- [ ] Error handling (network, validation, permissions)

**Files:**
- `client/src/services/team.service.ts`

---

#### Story 1.7: Team Store (Frontend State)
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Create `useTeamStore` with Zustand
- [ ] State: teams[], currentTeam, isLoadingTeams
- [ ] Actions: loadTeams(), createTeam(), switchTeam(), updateTeam(), deleteTeam()
- [ ] Persist currentTeamId to localStorage

**Files:**
- `client/src/stores/team.store.ts`

---

#### Story 1.8: Team Switcher UI Component
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Dropdown in top navigation (right side, next to user profile)
- [ ] List all teams user belongs to
- [ ] Show role badge next to each team (👑 Admin, 💻 Dev, 📝 PM, 🧪 QA)
- [ ] Highlight current team
- [ ] Click team → switch context (calls switchTeam API)
- [ ] Show "+ Create Team" button at bottom
- [ ] Loading/error states

**Files:**
- `client/src/core/components/team/TeamSwitcher.tsx`
- `client/src/core/components/team/TeamSwitcherItem.tsx`

---

#### Story 1.9: Team Settings Page
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Create `/settings/team` page
- [ ] Show current team name (editable for Admin)
- [ ] Show team ID (read-only, copyable)
- [ ] Show owner info
- [ ] Show member count
- [ ] Delete team button (Admin only, confirmation dialog)
- [ ] Form validation

**Files:**
- `client/app/(main)/settings/team/page.tsx`
- `client/src/settings/components/TeamSettingsForm.tsx`

---

#### Story 1.10: Create Team Dialog
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Modal dialog with form: team name input
- [ ] Validate name (3-50 chars, required)
- [ ] Submit → call createTeam() → auto-switch to new team
- [ ] Success toast: "Team created! You are the Admin."
- [ ] Error handling

**Files:**
- `client/src/teams/components/CreateTeamDialog.tsx`

---

**Epic 1 Total:** 10 stories, ~17 days (with parallelization: 12 days)

---

## Epic 2: Workspace Management (P0)

**Goal:** Implement Workspace entity (belongs to Team) with multi-repo support

**Duration:** 2 weeks (10 days)
**Dependencies:** Epic 1 complete

### Architecture

**Firestore Collections:**
```
/teams/{teamId}/workspaces/{workspaceId}
  - id: string
  - teamId: string
  - name: string (e.g., "Forge Workspace")
  - repositories: Repository[] (1-3 repos)
    - owner: string (GitHub org/user)
    - name: string (repo name)
    - branch: string (default branch)
    - url: string (GitHub URL)
  - createdBy: string (userId)
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

### Stories

#### Story 2.1: Workspace Domain Model
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Create `Workspace` domain entity
- [ ] Create `Repository` value object (owner, name, branch, url)
- [ ] Workspace fields: id, teamId, name, repositories[] (max 3)
- [ ] Methods: `create()`, `addRepository()`, `removeRepository()`, `updateRepository()`
- [ ] Validation: 1-3 repos required, unique repo names

**Files:**
- `backend/src/workspaces/domain/Workspace.ts`
- `backend/src/workspaces/domain/Repository.ts`

---

#### Story 2.2: Workspace Repository
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Create `WorkspaceRepository` port
- [ ] Implement `FirestoreWorkspaceRepository`
- [ ] Store at: `/teams/{teamId}/workspaces/{workspaceId}`
- [ ] Methods: save, findById, findByTeam, update, delete

**Files:**
- `backend/src/workspaces/application/ports/WorkspaceRepository.ts`
- `backend/src/workspaces/infrastructure/persistence/FirestoreWorkspaceRepository.ts`

---

#### Story 2.3: Workspace Use Cases
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Create `CreateWorkspaceUseCase` (validates team membership, creates workspace)
- [ ] Create `UpdateWorkspaceUseCase` (validates permissions)
- [ ] Create `DeleteWorkspaceUseCase` (validates no active tickets)
- [ ] Create `AddRepositoryUseCase` (validates max 3 repos, GitHub access)
- [ ] Create `RemoveRepositoryUseCase`

**Files:**
- `backend/src/workspaces/application/use-cases/CreateWorkspaceUseCase.ts`
- `backend/src/workspaces/application/use-cases/UpdateWorkspaceUseCase.ts`
- `backend/src/workspaces/application/use-cases/DeleteWorkspaceUseCase.ts`
- `backend/src/workspaces/application/use-cases/AddRepositoryUseCase.ts`
- `backend/src/workspaces/application/use-cases/RemoveRepositoryUseCase.ts`

---

#### Story 2.4: Workspace API Endpoints
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] POST `/teams/:teamId/workspaces` - Create workspace
- [ ] GET `/teams/:teamId/workspaces` - List workspaces
- [ ] GET `/teams/:teamId/workspaces/:id` - Get workspace details
- [ ] PATCH `/teams/:teamId/workspaces/:id` - Update workspace
- [ ] DELETE `/teams/:teamId/workspaces/:id` - Delete workspace
- [ ] POST `/teams/:teamId/workspaces/:id/repositories` - Add repo
- [ ] DELETE `/teams/:teamId/workspaces/:id/repositories/:index` - Remove repo

**Files:**
- `backend/src/workspaces/presentation/controllers/workspaces.controller.ts`
- `backend/src/workspaces/presentation/dtos/CreateWorkspaceDto.ts`
- `backend/src/workspaces/presentation/dtos/AddRepositoryDto.ts`

---

#### Story 2.5: Workspace Service (Frontend)
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Create `WorkspaceService` with CRUD methods
- [ ] Methods: createWorkspace, getWorkspaces, updateWorkspace, deleteWorkspace, addRepository, removeRepository

**Files:**
- `client/src/services/workspace.service.ts`

---

#### Story 2.6: Workspace Store (Frontend State)
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Create `useWorkspaceStore`
- [ ] State: workspaces[], currentWorkspace, isLoadingWorkspaces
- [ ] Actions: loadWorkspaces(), createWorkspace(), selectWorkspace()

**Files:**
- `client/src/stores/workspace.store.ts`

---

#### Story 2.7: Workspace Selector Component
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Dropdown component for workspace selection
- [ ] Show workspace name + repo count
- [ ] Used in ticket creation flow (Stage 1)
- [ ] Show "+ Create Workspace" button

**Files:**
- `client/src/workspaces/components/WorkspaceSelector.tsx`

---

#### Story 2.8: Workspace Management Page
**Estimate:** 3 days

**Acceptance Criteria:**
- [ ] Create `/settings/workspaces` page
- [ ] List all workspaces in current team
- [ ] Show: name, repos (list), created by, created date
- [ ] CRUD actions: create, edit name, delete
- [ ] Repository management: add (GitHub selector), remove
- [ ] Validation: max 3 repos per workspace

**Files:**
- `client/app/(main)/settings/workspaces/page.tsx`
- `client/src/workspaces/components/WorkspaceList.tsx`
- `client/src/workspaces/components/WorkspaceForm.tsx`
- `client/src/workspaces/components/RepositoryManager.tsx`

---

**Epic 2 Total:** 8 stories, ~15 days (with parallelization: 10 days)

---

## Epic 3: Members & Roles (P0)

**Goal:** Team member management with role-based permissions

**Duration:** 2 weeks (10 days)
**Dependencies:** Epic 1 complete

### Stories

#### Story 3.1: TeamMember Domain Model
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Create `TeamMember` entity (userId, teamId, role, status)
- [ ] Create `Role` enum (Admin, Developer, PM, QA)
- [ ] Create `MemberStatus` enum (Invited, Active, Removed)
- [ ] Methods: `isActive()`, `hasRole()`, `canExecuteTickets()`, `canApproveTickets()`

**Files:**
- `backend/src/teams/domain/TeamMember.ts`
- `backend/src/teams/domain/Role.ts`
- `backend/src/teams/domain/MemberStatus.ts`

---

#### Story 3.2: TeamMember Repository
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Create `TeamMemberRepository` port
- [ ] Implement `FirestoreTeamMemberRepository`
- [ ] Store at: `/teams/{teamId}/members/{userId}`
- [ ] Methods: save, findByTeam, findByUser, findByUserAndTeam, delete

**Files:**
- `backend/src/teams/application/ports/TeamMemberRepository.ts`
- `backend/src/teams/infrastructure/persistence/FirestoreTeamMemberRepository.ts`

---

#### Story 3.3: Member Management Use Cases
**Estimate:** 3 days

**Acceptance Criteria:**
- [ ] Create `InviteMemberUseCase` (validates email, role, creates invite)
- [ ] Create `AcceptInviteUseCase` (validates token, adds member to team)
- [ ] Create `RemoveMemberUseCase` (validates not owner, marks removed)
- [ ] Create `ChangeMemberRoleUseCase` (validates permissions)
- [ ] Create `ListTeamMembersUseCase` (returns active members)

**Files:**
- `backend/src/teams/application/use-cases/InviteMemberUseCase.ts`
- `backend/src/teams/application/use-cases/AcceptInviteUseCase.ts`
- `backend/src/teams/application/use-cases/RemoveMemberUseCase.ts`
- `backend/src/teams/application/use-cases/ChangeMemberRoleUseCase.ts`
- `backend/src/teams/application/use-cases/ListTeamMembersUseCase.ts`

---

#### Story 3.4: Email Invitation System
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Generate invite tokens (JWT, 7-day expiry)
- [ ] Send invite emails (SendGrid/Postmark)
- [ ] Email template: "You've been invited to join {teamName}"
- [ ] Invite link: `https://forge.app/invite/{token}`
- [ ] Store pending invites in Firestore

**Files:**
- `backend/src/teams/infrastructure/email/invitation-email.service.ts`
- `backend/src/teams/infrastructure/email/templates/invite.html`

---

#### Story 3.5: Member Management API Endpoints
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] POST `/teams/:id/members` - Invite member (body: email, role)
- [ ] GET `/teams/:id/members` - List members
- [ ] DELETE `/teams/:id/members/:userId` - Remove member
- [ ] PATCH `/teams/:id/members/:userId/role` - Change role
- [ ] POST `/invites/:token/accept` - Accept invite

**Files:**
- `backend/src/teams/presentation/controllers/members.controller.ts`
- `backend/src/teams/presentation/dtos/InviteMemberDto.ts`

---

#### Story 3.6: Role-Based Authorization Guards
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Create `TeamGuard` (verifies user is team member)
- [ ] Create `RoleGuard` (verifies user has required role)
- [ ] Decorator: `@RequireRole('admin')`, `@RequireRole('developer')`
- [ ] Apply guards to endpoints (workspace CRUD, ticket execution)

**Files:**
- `backend/src/shared/presentation/guards/TeamGuard.ts`
- `backend/src/shared/presentation/guards/RoleGuard.ts`
- `backend/src/shared/presentation/decorators/RequireRole.ts`

---

#### Story 3.7: Team Members List UI
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] List component showing all members
- [ ] Columns: Name, Email, Role, Status, Actions
- [ ] Role badges (color-coded)
- [ ] Status badges (Active/Invited/Removed)
- [ ] Owner row highlighted (cannot be removed)

**Files:**
- `client/src/teams/components/TeamMembersList.tsx`
- `client/src/teams/components/MemberRow.tsx`

---

#### Story 3.8: Invite Member Dialog
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Modal with form: email + role dropdown
- [ ] Validate email format
- [ ] Role options: Developer, PM, QA (Admin not selectable)
- [ ] Submit → send invite → success toast
- [ ] Show pending invites (status: Invited)

**Files:**
- `client/src/teams/components/InviteMemberDialog.tsx`

---

**Epic 3 Total:** 8 stories, ~16 days (with parallelization: 10 days)

---

## Epic 4: Enhanced Onboarding (P0)

**Goal:** Update onboarding flow to create team and select role

**Duration:** 1 week (5 days)
**Dependencies:** Epic 1 complete

### Stories

#### Story 4.1: Onboarding Flow State Machine
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Create onboarding state machine:
  1. Sign up (OAuth)
  2. Create team (ask team name)
  3. Select role (PM, Developer, QA, Other)
  4. Optional GitHub connection (if Developer role)
  5. Complete
- [ ] Store progress in localStorage

**Files:**
- `client/src/onboarding/onboarding.store.ts`

---

#### Story 4.2: Step 2 - Team Name Input
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Screen with heading: "Name your team"
- [ ] Text input (placeholder: "Acme Corp", "Sarah's Team")
- [ ] Validation: 3-50 chars, required
- [ ] Submit → create team → move to step 3

**Files:**
- `client/src/onboarding/components/TeamNameStep.tsx`

---

#### Story 4.3: Step 3 - Role Selection
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Screen with heading: "What's your role?"
- [ ] Radio cards: PM, Developer, QA, Other
- [ ] Each card has description
- [ ] Submit → save role → conditional next step:
  - Developer → GitHub connection
  - PM/QA → Skip GitHub, go to complete
  - Other → Ask if they have GitHub access

**Files:**
- `client/src/onboarding/components/RoleSelectionStep.tsx`

---

#### Story 4.4: Update Auth Flow Integration
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] After OAuth success, check if user has team
- [ ] If no team → redirect to `/onboarding/team-name`
- [ ] If has team → redirect to `/tickets`
- [ ] Update POST `/auth/init` to skip auto-team-creation

**Files:**
- `client/src/auth/application/sign-in.use-case.ts`
- `backend/src/workspaces/presentation/controllers/auth.controller.ts`

---

**Epic 4 Total:** 4 stories, ~5 days

---

## Epic 5: CLI Foundation (P0)

**Goal:** Build CLI with auth, list, show commands

**Duration:** 2 weeks (10 days)
**Dependencies:** Epic 1, 2, 3 complete (needs team/workspace APIs)

### Stories

#### Story 5.1-5.8: Same as original Epic 3 stories

(Reuse stories from original implementation plan - no changes needed)

**Epic 5 Total:** 8 stories, ~14 days (with parallelization: 10 days)

---

## Epic 6: MCP Server (P0)

**Goal:** Build MCP server with tools, prompts, agent guides

**Duration:** 2 weeks (10 days)
**Dependencies:** Epic 5 complete

### Stories

#### Story 6.1-6.11: Same as original Epic 4 stories

(Reuse stories from original implementation plan - no changes needed)

**Epic 6 Total:** 11 stories, ~15 days (with parallelization: 10 days)

---

## Epic 7: Ticket Lifecycle Updates (P1)

**Goal:** Update ticket lifecycle with new states and collaborative workflow

**Duration:** 2 weeks (10 days)
**Dependencies:** Epic 3 complete (needs roles)

### Architecture

**New Ticket States:**
```
ready-for-dev-review  ← PM creates
questions-generated   ← Dev generates questions (CLI)
waiting-for-approval  ← PM answers questions
ready-for-dev         ← PM approves
in-progress           ← Dev executes (CLI)
complete              ← Dev completes
```

### Stories

#### Story 7.1: Extend AECStatus Enum
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Add 4 new statuses to enum
- [ ] Update domain validation to allow transitions
- [ ] Add methods: `markReadyForDevReview()`, `markQuestionsGenerated()`, `markWaitingForApproval()`, `approve()`

**Files:**
- `backend/src/tickets/domain/aec/AECStatus.ts`
- `backend/src/tickets/domain/aec/AEC.ts`

---

#### Story 7.2: Move Tickets to Team Scope
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Update AEC domain: add teamId field
- [ ] Update Firestore path: `/teams/{teamId}/tickets/{ticketId}`
- [ ] Migrate existing tickets (move from `/workspaces/{wsId}/aecs/{id}` to `/teams/{teamId}/tickets/{id}`)
- [ ] Update AECRepository queries to filter by teamId

**Files:**
- `backend/src/tickets/domain/aec/AEC.ts`
- `backend/src/tickets/infrastructure/persistence/FirestoreAECRepository.ts`
- `backend/scripts/migrate-tickets-to-teams.ts`

---

#### Story 7.3: Add Questions to AEC
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Add `_questions: ClarificationQuestion[]` field
- [ ] Add `addQuestions(questions)` method
- [ ] Add `answerQuestion(id, answer)` method
- [ ] Add `areAllQuestionsAnswered()` validation

**Files:**
- `backend/src/tickets/domain/aec/AEC.ts`

---

#### Story 7.4: Questions API Endpoints
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] POST `/teams/:teamId/tickets/:id/questions` - Add questions
- [ ] PATCH `/teams/:teamId/tickets/:id/questions/:qid` - Answer question
- [ ] POST `/teams/:teamId/tickets/:id/approve` - Approve ticket (PM only)
- [ ] Role guards: Developer for questions, PM for approve

**Files:**
- `backend/src/tickets/presentation/controllers/tickets.controller.ts`
- `backend/src/tickets/application/use-cases/AddQuestionsUseCase.ts`
- `backend/src/tickets/application/use-cases/ApproveTicketUseCase.ts`

---

#### Story 7.5: Update Ticket List Filters
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Add status filters for new states
- [ ] Update status badges (color-coded icons)
- [ ] Filter by: assigned to me, status, workspace

**Files:**
- `client/app/(main)/tickets/page.tsx`
- `client/src/tickets/components/StatusBadge.tsx`

---

#### Story 7.6: Questions Section in Ticket Detail
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Add "Clarification Questions" section
- [ ] Show question list (answered/unanswered)
- [ ] PM can answer (text/radio/checkbox based on type)
- [ ] Developer view: read-only

**Files:**
- `client/app/(main)/tickets/[id]/page.tsx`
- `client/src/tickets/components/detail/QuestionsSection.tsx`

---

#### Story 7.7: Approve Button (PM Only)
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Add "Approve" button (only if status = waiting-for-approval)
- [ ] Only visible to PM role
- [ ] Confirmation dialog
- [ ] Updates status to ready-for-dev

**Files:**
- `client/app/(main)/tickets/[id]/page.tsx`
- `client/src/tickets/components/ApproveTicketDialog.tsx`

---

#### Story 7.8: Status Sync (Web ↔ CLI)
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] CLI updates ticket status via API (POST /tickets/:id/status)
- [ ] Web polls for status updates (every 5 seconds when viewing ticket)
- [ ] Real-time indicator: "Status updated by {user} 2 seconds ago"

**Files:**
- `client/app/(main)/tickets/[id]/page.tsx` (polling)
- `cli/src/services/api.service.ts` (updateStatus method)

---

#### Story 7.9: Ticket Creation Updates
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Update ticket creation to use teamId + workspaceId
- [ ] Select workspace from team's workspaces
- [ ] Default status: ready-for-dev-review (PM created)
- [ ] Validation: workspace must belong to team

**Files:**
- `client/app/(main)/tickets/create/page.tsx`
- `backend/src/tickets/application/use-cases/CreateTicketUseCase.ts`

---

**Epic 7 Total:** 9 stories, ~15 days (with parallelization: 10 days)

---

## Epic 8: Testing & Documentation (P2)

**Goal:** Write tests and documentation

**Duration:** 1.5 weeks (7 days)
**Dependencies:** All epics complete

### Stories

#### Story 8.1: Backend Unit Tests
**Estimate:** 3 days

**Acceptance Criteria:**
- [ ] Test Team domain entity
- [ ] Test Workspace domain entity
- [ ] Test TeamMember domain entity
- [ ] Test use cases (Create/Update/Delete)
- [ ] Test role guards

**Files:**
- `backend/src/teams/domain/__tests__/Team.spec.ts`
- `backend/src/workspaces/domain/__tests__/Workspace.spec.ts`
- (etc.)

---

#### Story 8.2: Frontend Component Tests
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Test TeamSwitcher component
- [ ] Test WorkspaceSelector component
- [ ] Test TeamMembersList component
- [ ] Test onboarding steps

**Files:**
- `client/src/core/components/team/__tests__/TeamSwitcher.test.tsx`
- (etc.)

---

#### Story 8.3: CLI Integration Tests
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] Test forge login (mock device flow)
- [ ] Test forge list (mock API)
- [ ] Test MCP server (mock stdio)

**Files:**
- `cli/src/commands/__tests__/login.test.ts`
- `cli/src/mcp/__tests__/server.test.ts`

---

#### Story 8.4: User Documentation
**Estimate:** 2 days

**Acceptance Criteria:**
- [ ] CLI installation guide
- [ ] Team management guide
- [ ] Workspace management guide
- [ ] Ticket lifecycle guide
- [ ] Screenshots/GIFs

**Files:**
- `docs/CLI-GUIDE.md`
- `docs/TEAM-MANAGEMENT.md`
- `docs/WORKSPACE-GUIDE.md`

---

#### Story 8.5: API Documentation
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Document all team endpoints
- [ ] Document all workspace endpoints
- [ ] Document ticket lifecycle endpoints
- [ ] OpenAPI spec

**Files:**
- `docs/API.md`
- `backend/openapi.yaml`

---

#### Story 8.6: Architecture Update
**Estimate:** 1 day

**Acceptance Criteria:**
- [ ] Update architecture doc with Team-based hierarchy
- [ ] Update diagrams
- [ ] Document Firestore collections

**Files:**
- `docs/FORGE-TEAMS-CLI-ARCHITECTURE.md` (update)

---

**Epic 8 Total:** 6 stories, ~11 days (with parallelization: 7 days)

---

## 📅 Implementation Timeline

### Parallel Execution Plan (2-3 Developers)

**Weeks 1-2: Foundation**
- Epic 1 (Team Foundation) - Dev 1
- Epic 2 (Workspace Management) - Dev 2
- Epic 4 (Enhanced Onboarding) - Dev 3

**Weeks 3-4: Backend Infrastructure**
- Epic 3 (Members & Roles) - Dev 1
- Epic 5 (CLI Foundation) - Dev 2 + Dev 3

**Weeks 5-6: CLI & MCP**
- Epic 6 (MCP Server) - Dev 2 + Dev 3
- Epic 7 (Ticket Lifecycle) - Dev 1

**Weeks 7-8: Integration & Testing**
- Epic 8 (Testing & Docs) - All devs
- Bug fixes, polish

**Total Duration:** 8 weeks (with 2-3 devs working in parallel)
**Single Developer:** 15 weeks

---

## 🎯 Success Metrics

### MVP Launch Criteria
- [ ] User can create team and invite members
- [ ] User can create workspace with 3 repos
- [ ] User can switch between multiple teams
- [ ] PM can create ticket (status: ready-for-dev-review)
- [ ] Developer can run `forge review` (generate questions)
- [ ] PM can answer questions and approve
- [ ] Developer can run `forge execute` (MCP + Claude Code)
- [ ] Ticket status syncs between web and CLI

### Phase 2 Goals (3 months post-launch)
- 100+ teams created
- 50%+ teams have 2+ members
- 500+ tickets executed via CLI
- 80%+ developer satisfaction (CLI UX)

---

## 🚧 Known Gaps & Future Work

### Deferred to Phase 2
- Real-time collaboration (WebSockets)
- Team hierarchies (sub-teams)
- Custom roles (beyond 4 default)
- Advanced analytics (velocity, bottlenecks)
- Slack/Discord notifications
- GitHub Actions integration

### Open Questions
1. Should workspaces be shared across teams? (No for MVP)
2. Max members per team? (Unlimited for MVP)
3. Should CLI support multiple teams simultaneously? (No, one team per CLI session)

---

## ✅ Ready to Build!

**Next Steps:**
1. Review and approve this super-sprint plan
2. Setup project tracking (GitHub Projects, Linear, or Jira)
3. Create feature branches: `feature/epic-1-team-foundation`, etc.
4. Start with **Epic 1, Story 1.1** - Team Domain Model

**Questions?**
- Architecture clarifications?
- Story priority adjustments?
- Resource allocation needs?

---

*Last Updated: 2026-02-17*
*Status: 📋 Ready for Implementation*
