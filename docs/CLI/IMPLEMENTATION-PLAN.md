# Forge Teams + CLI + MCP - Implementation Plan

**Version:** 1.0 (Final)
**Date:** 2026-02-17
**Status:** 🟢 Ready for Execution
**Duration:** 8-15 weeks (2-3 devs vs 1 dev)
**Total Scope:** 8 Epics, 64 Stories

---

## 🎯 Executive Summary

**Goal:** Transform Forge from single-user to multi-team collaborative platform with developer CLI + MCP for code execution.

**Three Phases:**
1. **Phase 1 (Weeks 1-2):** Team foundation (users, members, RBAC)
2. **Phase 2 (Weeks 3-6):** CLI + MCP infrastructure
3. **Phase 3 (Weeks 7-8):** Integration, testing, launch

**Architecture:** Team → Workspace (1-3 repos) → Tickets
**Database:** Extend existing Firestore structure
**Auth:** OAuth for web, Device Flow for CLI
**MVP Success:** PM creates ticket → Dev executes via CLI → Ticket complete

---

## 📋 Implementation Sequence (Parallel Execution)

### **Weeks 1-2: Foundation**
```
Dev 1: Epic 1 (Team Backend)       - 10 stories, ~17 days
Dev 2: Epic 2 (Workspace Mgmt)     - 8 stories, ~15 days
Dev 3: Epic 4 (Onboarding)         - 4 stories, ~5 days
```

### **Weeks 3-4: Infrastructure**
```
Dev 1: Epic 3 (Members & Roles)    - 8 stories, ~16 days
Dev 2: Epic 5 (CLI Foundation)     - 8 stories, ~14 days
Dev 3: Help with Epic 2/3 overflow
```

### **Weeks 5-6: CLI + MCP**
```
Dev 2: Epic 6 (MCP Server)         - 11 stories, ~15 days
Dev 1: Epic 7 (Ticket Lifecycle)   - 9 stories, ~15 days
Dev 3: Continue epic 5/6 support
```

### **Weeks 7-8: Integration & Launch**
```
All Devs: Epic 8 (Testing & Docs)  - 6 stories, ~11 days
Testing, bug fixes, production polish
```

**Single Developer Timeline:** Sequential execution = ~15 weeks

---

## 🏗️ Epic Breakdown

### **EPIC 1: Team Foundation (P0) - 2.5 weeks**

**Goal:** Implement Team as top-level entity with multi-team support

**Stories:**
1. **1.1** Team Domain Model (2d) - `Team` entity, validation, factory
2. **1.2** Team Repository (2d) - Firestore persistence
3. **1.3** User Domain Extension (1d) - currentTeamId, teams[]
4. **1.4** Team Use Cases (3d) - CreateTeam, UpdateTeam, GetTeams, SwitchTeam
5. **1.5** Team API Endpoints (2d) - POST/GET/PATCH/DELETE /teams
6. **1.6** Team Service (Frontend) (1d) - API client
7. **1.7** Team Store (Frontend State) (1d) - Zustand store
8. **1.8** Team Switcher UI (2d) - Dropdown component
9. **1.9** Team Settings Page (2d) - /settings/team
10. **1.10** Create Team Dialog (1d) - Modal form

**Acceptance Criteria:**
- [ ] User can create team
- [ ] User can switch between multiple teams
- [ ] Team switcher shows role badge
- [ ] Settings page allows team management
- [ ] Auto-switch to new team on creation

---

### **EPIC 2: Workspace Management (P0) - 2 weeks**

**Goal:** Workspace entity with 1-3 multi-repo support

**Stories:**
1. **2.1** Workspace Domain Model (2d) - `Workspace` entity, `Repository` value object
2. **2.2** Workspace Repository (2d) - Firestore persistence
3. **2.3** Workspace Use Cases (2d) - CRUD, AddRepository, RemoveRepository
4. **2.4** Workspace API Endpoints (2d) - REST endpoints
5. **2.5** Workspace Service (Frontend) (1d) - API client
6. **2.6** Workspace Store (Frontend) (1d) - Zustand
7. **2.7** Workspace Selector (2d) - Dropdown with repo count
8. **2.8** Workspace Management Page (3d) - Full CRUD UI

**Acceptance Criteria:**
- [ ] Create workspace with 1-3 repos
- [ ] Edit workspace name
- [ ] Add/remove repositories
- [ ] Validation: max 3 repos per workspace
- [ ] Repository manager UI

---

### **EPIC 3: Members & Roles (P0) - 2 weeks**

**Goal:** Team member management with role-based permissions

**Stories:**
1. **3.1** TeamMember Domain Model (2d) - Entity, Role enum, MemberStatus enum
2. **3.2** TeamMember Repository (1d) - Firestore persistence
3. **3.3** Member Use Cases (3d) - Invite, Accept, Remove, ChangeRole, ListMembers
4. **3.4** Email Invitation System (2d) - JWT tokens, SendGrid/Postmark
5. **3.5** Member API Endpoints (2d) - POST/DELETE/PATCH /members
6. **3.6** Role Guards (2d) - @RequireRole decorator, guards
7. **3.7** Team Members List UI (2d) - List component with badges
8. **3.8** Invite Member Dialog (2d) - Modal form

**Acceptance Criteria:**
- [ ] Invite members by email
- [ ] Accept invite via token link
- [ ] Change member role (Admin only)
- [ ] Remove members (not owner)
- [ ] Role-based API authorization
- [ ] Email template sent

---

### **EPIC 4: Enhanced Onboarding (P0) - 1 week**

**Goal:** Update signup to create team and select role

**Stories:**
1. **4.1** State Machine (1d) - Sign up → team name → role selection → GitHub (if Dev)
2. **4.2** Team Name Step (1d) - Input form, validation
3. **4.3** Role Selection Step (2d) - Radio cards (PM, Dev, QA, Other)
4. **4.4** Auth Flow Integration (1d) - Redirect to onboarding if no team

**Acceptance Criteria:**
- [ ] Sign up → team creation → role selection flow
- [ ] Conditional GitHub setup (Dev only)
- [ ] Auto-redirect to onboarding
- [ ] Progress persisted in localStorage

---

### **EPIC 5: CLI Foundation (P0) - 2 weeks**

**Goal:** Build CLI with auth, list, show commands

**Stories:**
1. **5.1** CLI Project Setup (1d) - pnpm workspace, Commander.js
2. **5.2** Login Command (2d) - Device Flow OAuth
3. **5.3** Logout Command (1d) - Clear tokens
4. **5.4** Status Command (1d) - Show auth status
5. **5.5** List Command (2d) - Interactive ticket list
6. **5.6** Show Command (1d) - Ticket details
7. **5.7** Config Management (1d) - ~/.forge/config.json storage
8. **5.8** Error Handling (1d) - Retry logic, clear error messages

**Acceptance Criteria:**
- [ ] `forge login` - Device flow works
- [ ] `forge list` - Shows assigned tickets
- [ ] `forge show ABC-123` - Displays details
- [ ] Tokens auto-refresh
- [ ] Config stored securely (chmod 600)

---

### **EPIC 6: MCP Server (P0) - 2 weeks**

**Goal:** Build MCP server with tools, prompts, agent guides

**Stories:**
1. **6.1** MCP Server Setup (2d) - SDK integration, stdio transport
2. **6.2** Ticket Context Tool (1d) - get_ticket_context()
3. **6.3** File Changes Tool (1d) - get_file_changes()
4. **6.4** Repository Context Tool (1d) - get_repository_context()
5. **6.5** Status Update Tool (1d) - update_ticket_status()
6. **6.6** Execute Prompt (2d) - forge_execute + dev-executor.md
7. **6.7** Review Prompt (2d) - forge_review + dev-reviewer.md
8. **6.8** Agent Guide: Executor (1d) - dev-executor.md
9. **6.9** Agent Guide: Reviewer (1d) - dev-reviewer.md
10. **6.10** MCP Integration Tests (1d) - Mock stdio
11. **6.11** CLI-MCP Plumbing (1d) - forge execute/review command handlers

**Acceptance Criteria:**
- [ ] MCP server starts on `forge review`
- [ ] Claude Code connects via stdio
- [ ] All 4 tools available
- [ ] forge_execute prompt loads agent guide
- [ ] Agent can write files to disk
- [ ] Status updates sync to backend

---

### **EPIC 7: Ticket Lifecycle (P1) - 2 weeks**

**Goal:** Update ticket states and collaborative workflow

**Stories:**
1. **7.1** Extend AECStatus Enum (1d) - Add 4 new states
2. **7.2** Move Tickets to Team Scope (2d) - Update path, migration
3. **7.3** Add Questions to AEC (2d) - _questions field, methods
4. **7.4** Questions API (2d) - POST/PATCH questions endpoints
5. **7.5** Update Ticket Filters (1d) - Filter UI
6. **7.6** Questions Section UI (2d) - Display + answer
7. **7.7** Approve Button (1d) - PM-only approval
8. **7.8** Status Sync (Web ↔ CLI) (2d) - Polling, real-time updates
9. **7.9** Ticket Creation Updates (2d) - Use teamId, status defaults

**Acceptance Criteria:**
- [ ] 6 ticket states working
- [ ] Dev can add questions via CLI
- [ ] PM can answer on web
- [ ] PM can approve
- [ ] Status syncs between web and CLI
- [ ] Correct role permissions enforced

---

### **EPIC 8: Testing & Documentation (P2) - 1.5 weeks**

**Goal:** Unit tests, integration tests, user docs

**Stories:**
1. **8.1** Backend Unit Tests (3d) - Domain entities, use cases, guards
2. **8.2** Frontend Component Tests (2d) - Team, Workspace, Member components
3. **8.3** CLI Integration Tests (2d) - Mock device flow, API
4. **8.4** User Documentation (2d) - CLI guide, team guide, workspace guide
5. **8.5** API Documentation (1d) - OpenAPI spec
6. **8.6** Architecture Update (1d) - Update arch doc with team hierarchy

**Acceptance Criteria:**
- [ ] All domain tests passing
- [ ] Component tests > 80% coverage
- [ ] CLI tests mocked properly
- [ ] User guides with screenshots
- [ ] OpenAPI spec complete

---

## 🔐 Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Extend Firestore** | Minimize migration risk, leverage existing structure |
| **Team at top level** | Simplifies multi-tenancy, clear ownership |
| **CLI as MCP server** | No external process, user controls agent |
| **Device Flow Auth** | Prevents token theft, improves security |
| **Single repo per ticket** | MVP simplicity, multi-repo in Phase 2 |
| **Firestore path:** `/teams/{teamId}/...` | Cleaner hierarchy, easier permissions |

---

## 📊 Firestore Collections (Final Structure)

```
/users/{userId}
  - userId, email, displayName, photoURL
  - currentTeamId, teams[] (array of teamIds)
  - createdAt, updatedAt

/teams/{teamId}
  - id, name, slug, ownerId
  - createdAt, updatedAt
  - settings { defaultWorkspaceId, allowMemberInvites }

/teams/{teamId}/members/{userId}
  - userId, email, displayName
  - role (admin|developer|pm|qa)
  - status (active|invited|removed)
  - invitedBy, invitedAt, joinedAt

/teams/{teamId}/workspaces/{workspaceId}
  - id, teamId, name
  - repositories[] (1-3 repos)
  - createdBy, createdAt, updatedAt

/teams/{teamId}/workspaces/{workspaceId}/aecs/{aecId}
  - [existing + new fields]
  - status (ready-for-dev-review|questions-generated|...)
  - questions[], questionAnswers{}
```

---

## 🚀 Critical Path (Minimum Viable Product)

**Must Complete Before Launch:**
1. ✅ Epic 1 - Teams exist, users can switch
2. ✅ Epic 2 - Workspaces with repos
3. ✅ Epic 3 - Members & roles enforced
4. ✅ Epic 5 - CLI login/list/show works
5. ✅ Epic 6 - MCP tools available
6. ✅ Epic 7 - New ticket states (partial)

**Can Follow (Post-MVP):**
- Epic 4 - Enhanced onboarding (default flow works)
- Epic 7 - Full lifecycle (approval flow)
- Epic 8 - Comprehensive testing

---

## 📈 Success Metrics

### **MVP Launch Checklist**
- [ ] PM can create team without GitHub
- [ ] PM can invite developers (email)
- [ ] Dev can run `forge login`
- [ ] Dev can `forge list` (shows tickets)
- [ ] Dev can `forge review <id>` (MCP starts)
- [ ] Claude Code connects to MCP
- [ ] Agent can access ticket context (tools)
- [ ] Agent can write files to disk
- [ ] Ticket status syncs web ↔ CLI
- [ ] All role guards enforced

### **Phase 2 Goals (3 months post-launch)**
- 100+ teams created
- 50%+ have 2+ members
- 500+ tickets executed via CLI
- 80%+ developer satisfaction

---

## 🎯 Next Actions

### **Immediate (This Week)**
1. ✅ Review & approve this plan
2. ✅ Create feature branches (feature/epic-1-*, etc.)
3. ⏳ Start **Epic 1, Story 1.1** - Team Domain Model
4. ⏳ Setup tracking (GitHub Projects / Linear)

### **Dependencies & Blockers**
- Firebase indexes (Firestore performance)
- SendGrid/Postmark setup (email invites)
- MCP SDK stability (test integration early)
- Device flow implementation (OAuth)

### **Risk Mitigation**
- ⚠️ Test MCP integration in Week 2 (don't wait until Week 5)
- ⚠️ Plan migration script early (moving tickets to team scope)
- ⚠️ Setup CI/CD for CLI package (npm publishing)
- ⚠️ Load test multi-team workspaces (Firestore queries)

---

## 📞 Questions to Resolve

1. **Auto-install CLI?** Global npm package? Or local per-project?
2. **Ollama support?** For users wanting local LLMs?
3. **Telemetry?** Track CLI usage (opt-in)?
4. **CLI package name?** `@forge/cli` or `forge-cli`?
5. **Concurrent executions?** Multiple devs on same ticket?

---

## 🟢 Status: READY FOR IMPLEMENTATION

**Next Step:** Approve plan → Create branches → Start Epic 1

*Last Updated: 2026-02-17*
