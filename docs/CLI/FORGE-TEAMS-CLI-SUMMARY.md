# Forge Teams & CLI - Project Summary

**Date:** 2026-02-17
**Status:** 📋 Planning Complete, Ready for Implementation

---

## 📚 Documentation Index

1. **[Architecture Document](./FORGE-TEAMS-CLI-ARCHITECTURE.md)** - Complete system design
2. **[Implementation Plan](./FORGE-TEAMS-CLI-IMPLEMENTATION-PLAN.md)** - Epics and stories
3. **[Brainstorming Session](./brainstorming-session-teams-roles-2026-02-16.md)** - Original ideation

---

## 🎯 Project Goals

### Problem Statement
**Current State:**
- Forge is single-user only (one workspace per user)
- PMs cannot use Forge (requires GitHub access)
- Developers must implement tickets manually (no execution automation)

**Desired State:**
- Multi-user workspaces with role-based access (PM, Developer, QA, Admin)
- PMs create tickets without GitHub (description + design refs)
- Developers execute tickets via CLI (MCP server + user's AI agent)

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Forge Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Web UI (Next.js)          CLI (forge-cli)                 │
│  ├─ PM: Create tickets     ├─ Dev: Execute tickets         │
│  ├─ PM: Answer questions   ├─ Dev: Generate questions      │
│  ├─ PM: Approve tickets    └─ MCP Server (embedded)        │
│  ├─ Dev: View tickets              │                       │
│  └─ Admin: Manage team             │ stdio                 │
│                                    │                       │
│                                    ▼                       │
│                            User's AI Agent                 │
│                            (Claude Code, Cursor, etc.)     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   Firebase Services                         │
│  • Firestore (Database)  • Auth (OAuth + Device Flow)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Ticket Lifecycle

```
PM Creates Ticket (Web)
  ↓ ready-for-dev-review
Developer Generates Questions (CLI)
  ↓ questions-generated
PM Answers Questions (Web)
  ↓ waiting-for-approval
PM Approves (Web)
  ↓ ready-for-dev
Developer Executes (CLI + MCP + AI Agent)
  ↓ in-progress
Developer Completes (CLI)
  ↓ complete
```

---

## 🗄️ Data Model Extensions

### New Collections/Subcollections

```
/users/{userId}  ← NEW
  - userId, email, displayName, photoURL, defaultWorkspaceId

/workspaces/{workspaceId}/members/{userId}  ← NEW
  - userId, role (admin/developer/pm/qa), status (active/invited)

/workspaces/{workspaceId}/aecs/{aecId}  ← EXTENDED
  - NEW status values: ready-for-dev-review, questions-generated, etc.
  - NEW field: questions (array of clarification questions)
```

**Key Point:** We're **extending** existing structure, not rebuilding!

---

## 🔧 CLI Commands

```bash
# Authentication
forge login              # OAuth device flow
forge logout             # Clear token

# Ticket Management
forge list               # Interactive list (assigned to me)
forge list --all         # All tickets
forge show <ticketId>    # Show details

# MCP Operations
forge review <ticketId>  # Generate questions (MCP server)
forge execute <ticketId> # Implement ticket (MCP server)
forge complete <ticketId> # Mark complete

# Utilities
forge status             # Show auth status
```

---

## 🤖 MCP Server

### Tools (What the AI agent can call)
- `get_ticket_context(ticketId)` - Fetch full ticket
- `get_file_changes(ticketId)` - Get files to create/modify
- `get_repository_context()` - Get git status, file tree
- `update_ticket_status(ticketId, status)` - Update ticket

### Prompts (How to invoke the agent)
- `forge_execute` - Implement ticket (loads dev-executor.md guide)
- `forge_review` - Generate questions (loads dev-reviewer.md guide)

### Agent Guides (Markdown files)
- `agents/dev-executor.md` - Instructions for code implementation
- `agents/dev-reviewer.md` - Instructions for question generation

**Key Innovation:** CLI is an MCP server, user's AI agent (Claude Code, Cursor, etc.) connects and implements the code!

---

## 📋 Implementation Plan

### 6 Epics, 44 Stories, ~10-12 weeks

| Epic | Duration | Priority | Description |
|------|----------|----------|-------------|
| **Epic 1: Team Backend** | 2 weeks | P0 | Users, members, roles, permissions |
| **Epic 2: Team Frontend** | 1.5 weeks | P0 | Workspace settings, member management UI |
| **Epic 3: CLI Foundation** | 2 weeks | P0 | Auth, list, show commands |
| **Epic 4: MCP Server** | 2 weeks | P0 | Tools, prompts, agent guides |
| **Epic 5: Lifecycle Updates** | 2 weeks | P1 | New ticket states, questions flow |
| **Epic 6: Testing & Docs** | 1 week | P2 | Tests, documentation |

**Critical Path:** Epic 1 → Epic 2 → Epic 5 → Epic 6
**Parallel Track:** Epic 3 → Epic 4 → Epic 6

---

## 🎯 Key Decisions

### ✅ Approved Decisions

1. **Single Database:** Firebase Firestore (extend existing structure)
2. **Team Model:** Workspace-based multi-tenancy (not multi-workspace per user)
3. **Roles:** Admin, Developer, PM, QA (4 roles)
4. **CLI as MCP Server:** Not an LLM client, user's agent does the work
5. **Agent Guides:** Markdown files (not hardcoded logic)
6. **Lifecycle States:** 6 states (ready-for-dev-review → complete)
7. **Authentication:** OAuth device flow for CLI
8. **Repository:** Single repo per ticket (MVP, multi-repo is Phase 2)

### ❌ Deferred to Future

- Multiple workspaces per user (Phase 2)
- Multi-repository tickets (Phase 2)
- GitHub Actions integration (Phase 3)
- VS Code extension (Phase 3)
- Team chat/comments (Phase 2)
- Notifications (Phase 2)

---

## 🔐 Security Considerations

✅ **Implemented:**
- Role-based access control (RBAC)
- Workspace isolation (users only see their workspace)
- Token expiry (15-min access, 7-day refresh)
- Device flow (prevents token theft)
- MCP runs locally (no data sent to third parties)

✅ **To Implement:**
- Config file permissions (chmod 600)
- Member invitation validation
- Workspace guard on all endpoints

---

## 📊 Success Metrics

### MVP Launch Criteria
- [ ] PM can create ticket without GitHub
- [ ] PM can invite developers to workspace
- [ ] Developer can generate questions via CLI
- [ ] PM can answer questions on web
- [ ] PM can approve ticket
- [ ] Developer can execute ticket via CLI + Claude Code
- [ ] All files written to disk correctly
- [ ] Ticket status updates automatically

### Phase 2 Goals (3 months post-launch)
- 50+ workspaces with 2+ members
- 500+ tickets executed via CLI
- 80%+ developer satisfaction (CLI UX)
- <5% error rate (MCP execution)

---

## 🚀 Next Steps

### Immediate Actions
1. ✅ Architecture document complete
2. ✅ Implementation plan complete
3. ⏳ **Start Epic 1, Story 1.1** - Users Collection Domain Model
4. ⏳ Setup CI/CD for CLI package
5. ⏳ Test MCP integration with Claude Code (validate architecture)

### Questions to Resolve
1. Should CLI auto-install as global package? Or local per-project?
2. Should we support Ollama for local LLMs? (privacy-conscious users)
3. Should we add telemetry to CLI? (opt-in, track command usage)
4. Should we publish CLI to npm as `@forge/cli` or `forge-cli`?

---

## 📞 Contact & Resources

**Architecture Doc:** [FORGE-TEAMS-CLI-ARCHITECTURE.md](./FORGE-TEAMS-CLI-ARCHITECTURE.md)
**Implementation Plan:** [FORGE-TEAMS-CLI-IMPLEMENTATION-PLAN.md](./FORGE-TEAMS-CLI-IMPLEMENTATION-PLAN.md)
**Brainstorming Session:** [brainstorming-session-teams-roles-2026-02-16.md](./brainstorming-session-teams-roles-2026-02-16.md)

**Project Status:** 🟢 Ready to build!

---

*Last Updated: 2026-02-17*
