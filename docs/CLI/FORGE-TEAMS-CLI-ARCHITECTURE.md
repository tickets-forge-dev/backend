# Forge Teams & CLI Architecture

**Version:** 1.0
**Date:** 2026-02-17
**Status:** Approved for Implementation

---

## Executive Summary

This document defines the architecture for two major Forge enhancements:
1. **Team Management:** Multi-user workspaces with role-based access control
2. **CLI with MCP:** Developer CLI that acts as an MCP server for code execution

**Key Decisions:**
- ✅ Web UI = Universal planning layer (PMs + Developers)
- ✅ CLI = Developer execution layer (Developers only)
- ✅ MCP runs locally in CLI (embedded, not separate server)
- ✅ Firebase Firestore = Single database (extend existing structure)
- ✅ Team-based multi-tenancy with role permissions
- ✅ Ticket lifecycle supports PM → Dev → PM → Dev workflow

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Ticket Lifecycle](#ticket-lifecycle)
3. [Team Management Architecture](#team-management-architecture)
4. [CLI Architecture](#cli-architecture)
5. [MCP Server Architecture](#mcp-server-architecture)
6. [Authentication](#authentication)
7. [Data Model](#data-model)
8. [Component Interactions](#component-interactions)
9. [Security Considerations](#security-considerations)
10. [Future Enhancements](#future-enhancements)

---

## 1. System Overview

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Forge Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                              ┌──────────────┐ │
│  │   Web UI    │────────────────────────────▶│   Backend    │ │
│  │  (Next.js)  │  REST API                   │   (NestJS)   │ │
│  │             │  HTTPS                       │              │ │
│  │  - PMs      │                              │  - Use Cases │ │
│  │  - Devs     │                              │  - Domain    │ │
│  └─────────────┘                              │  - Repos     │ │
│                                                └──────┬───────┘ │
│                                                       │         │
│  ┌─────────────┐                                     │         │
│  │     CLI     │────────────────────────────────────┘         │
│  │ (forge-cli) │  REST API                                    │
│  │             │  HTTPS                                       │
│  │  - Devs     │                                              │
│  │  - MCP      │                                              │
│  └──────┬──────┘                                              │
│         │                                                     │
│         │ stdio                                               │
│         │ MCP Protocol                                        │
│         ▼                                                     │
│  ┌─────────────┐                                              │
│  │ User's Agent│                                              │
│  │ (Claude Code│                                              │
│  │  Cursor,    │                                              │
│  │  Windsurf)  │                                              │
│  └─────────────┘                                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     Firebase Services                           │
├─────────────────────────────────────────────────────────────────┤
│  • Firestore (Database)                                         │
│  • Authentication (OAuth, Device Flow)                          │
│  • Storage (File attachments)                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Web UI | Next.js 15 | Universal interface for PMs and Developers |
| Backend API | NestJS | Business logic, domain layer, API |
| CLI | Node.js + Commander | Developer tool for ticket execution |
| MCP Server | MCP SDK | Embedded in CLI, exposes ticket context |
| Database | Firebase Firestore | NoSQL database, team/workspace storage |
| Auth | Firebase Auth | OAuth (web), Device Flow (CLI) |

---

## 2. Ticket Lifecycle

### 2.1 State Machine

```
┌──────────────────────┐
│  ready-for-dev-      │  ← PM creates (description + design refs)
│  review              │     NO GitHub context yet
└──────────┬───────────┘
           │ Dev runs: forge review <ticketId>
           │ (MCP agent generates questions)
           ▼
┌──────────────────────┐
│  questions-          │  ← Questions sent back to PM
│  generated           │
└──────────┬───────────┘
           │ PM answers questions (web UI)
           ▼
┌──────────────────────┐
│  waiting-for-        │  ← Full context filled
│  approval            │
└──────────┬───────────┘
           │ PM approves (web UI)
           ▼
┌──────────────────────┐
│  ready-for-dev       │  ← EXECUTABLE (dev can run forge execute)
└──────────┬───────────┘
           │ Dev runs: forge execute <ticketId>
           │ (MCP agent writes code)
           ▼
┌──────────────────────┐
│  in-progress         │  ← Agent actively writing files
└──────────┬───────────┘
           │ Dev marks complete
           ▼
┌──────────────────────┐
│  complete            │  ← Done
└──────────────────────┘
```

### 2.2 State Definitions

| State | Description | Who Can Transition | Next States |
|-------|-------------|-------------------|-------------|
| `ready-for-dev-review` | PM created ticket, waiting for dev questions | PM (create) | `questions-generated` |
| `questions-generated` | Dev generated questions via CLI | Dev (forge review) | `waiting-for-approval` |
| `waiting-for-approval` | PM answered questions, waiting for approval | PM (answer) | `ready-for-dev`, `questions-generated` |
| `ready-for-dev` | Approved, ready for implementation | PM (approve) | `in-progress` |
| `in-progress` | Dev executing via CLI | Dev (forge execute) | `complete` |
| `complete` | Implementation done | Dev (forge complete) | - |

---

## 3. Team Management Architecture

### 3.1 Design Principles

**"Extend, Don't Replace"** - Surgeon approach to existing codebase:
- ✅ Keep existing workspace structure
- ✅ Add members as subcollection (follows integration pattern)
- ✅ Add users collection for cross-workspace lookup
- ✅ Extend workspace domain with member methods
- ❌ Don't rebuild workspace system
- ❌ Don't change existing AEC/integration storage

### 3.2 Firestore Collections

#### Current Structure (Existing)
```
/workspaces/{workspaceId}
  - id: string
  - ownerId: string
  - name: string
  - createdAt: Timestamp
  - updatedAt: Timestamp

/workspaces/{workspaceId}/aecs/{aecId}
  - [existing ticket structure]

/workspaces/{workspaceId}/integrations/{type}
  - [existing integration structure]
```

#### New Structure (Extensions)
```
/users/{userId}  ← NEW COLLECTION
  - userId: string (Firebase UID)
  - email: string
  - displayName: string
  - photoURL?: string
  - defaultWorkspaceId: string
  - createdAt: Timestamp
  - updatedAt: Timestamp

/workspaces/{workspaceId}/members/{userId}  ← NEW SUBCOLLECTION
  - userId: string
  - email: string
  - displayName: string
  - role: 'admin' | 'developer' | 'pm' | 'qa'
  - status: 'active' | 'invited' | 'removed'
  - invitedBy: string (userId)
  - invitedAt: Timestamp
  - joinedAt?: Timestamp
```

### 3.3 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full access (owner role). Manage members, integrations, settings. Create/edit/delete tickets. |
| **Developer** | Execute tickets via CLI. Generate questions. Mark tickets complete. |
| **PM** | Create tickets. Answer questions. Approve tickets. Cannot access CLI execution. |
| **QA** | View tickets. Add comments. Cannot execute or approve. (Future) |

### 3.4 Member Management APIs

```typescript
// Backend endpoints
POST   /workspaces/:id/members        // Invite member
DELETE /workspaces/:id/members/:userId // Remove member
PATCH  /workspaces/:id/members/:userId // Change role
GET    /workspaces/:id/members        // List members
```

---

## 4. CLI Architecture

### 4.1 Package Structure

```
@forge/cli/
├── src/
│   ├── index.ts                    # Entry point (forge command)
│   ├── commands/
│   │   ├── login.ts                # OAuth device flow
│   │   ├── logout.ts               # Clear token
│   │   ├── list.ts                 # Interactive ticket list
│   │   ├── show.ts                 # Show ticket details
│   │   ├── review.ts               # Start MCP for review
│   │   ├── execute.ts              # Start MCP for execution
│   │   └── complete.ts             # Mark ticket complete
│   ├── services/
│   │   ├── api.service.ts          # Backend REST API
│   │   ├── auth.service.ts         # Token management
│   │   ├── git.service.ts          # Git operations
│   │   └── mcp-server.service.ts   # MCP server lifecycle
│   ├── mcp/
│   │   ├── server.ts               # MCP server implementation
│   │   ├── tools/                  # MCP tool handlers
│   │   │   ├── get-ticket-context.ts
│   │   │   ├── get-file-changes.ts
│   │   │   ├── get-repository-context.ts
│   │   │   └── update-ticket-status.ts
│   │   └── prompts/                # MCP prompt handlers
│   │       ├── forge-execute.ts
│   │       └── forge-review.ts
│   ├── ui/
│   │   ├── formatters.ts           # Ticket formatting
│   │   ├── icons.ts                # Status icons
│   │   └── pager.ts                # Long content pagination
│   └── agents/
│       ├── dev-reviewer.md         # Agent guide for review
│       └── dev-executor.md         # Agent guide for execution
├── package.json
└── tsconfig.json
```

### 4.2 CLI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `forge login` | OAuth device flow | `forge login` |
| `forge logout` | Clear stored token | `forge logout` |
| `forge list` | Interactive ticket list | `forge list --all` |
| `forge show <id>` | Show ticket details | `forge show ABC-123` |
| `forge review <id>` | Start MCP for review | `forge review ABC-123` |
| `forge execute <id>` | Start MCP for execution | `forge execute ABC-123` |
| `forge complete <id>` | Mark ticket complete | `forge complete ABC-123` |
| `forge status` | Show auth status | `forge status` |

### 4.3 Configuration Storage

**Location:** `~/.forge/config.json`

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "workspaceId": "ws_abc123",
  "userId": "uid_xyz789",
  "user": {
    "email": "john@example.com",
    "displayName": "John Doe"
  },
  "expiresAt": "2026-02-18T12:00:00Z"
}
```

---

## 5. MCP Server Architecture

### 5.1 Design Principles

1. **Embedded in CLI** - No separate process, runs in same Node.js instance
2. **Stdio transport** - Communicates via stdin/stdout
3. **Agent-agnostic** - Works with Claude Code, Cursor, Windsurf, etc.
4. **Stateless** - Each command starts fresh MCP server
5. **User's LLM** - Agent uses user's preferred AI provider

### 5.2 MCP Protocol Flow

```
┌─────────────────────┐
│ Developer Terminal  │
├─────────────────────┤
│                     │
│ $ forge execute     │
│   ABC-123           │
│                     │
│ 🚀 Starting MCP...  │
│ 📡 Server ready     │
│                     │
│ [Waiting for agent] │
│                     │
└──────────┬──────────┘
           │
           │ stdio (MCP Protocol)
           │
           ▼
┌─────────────────────┐
│ Claude Code         │
│ (or Cursor, etc.)   │
├─────────────────────┤
│                     │
│ 🔌 Connected to     │
│    forge-cli MCP    │
│                     │
│ 📖 Loading prompt:  │
│    forge_execute    │
│                     │
│ 🔧 Using tools:     │
│    get_ticket_ctx   │
│    get_file_changes │
│                     │
│ 📝 Writing files... │
│                     │
└─────────────────────┘
```

### 5.3 MCP Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `get_ticket_context` | Get full ticket (problem, solution, AC) | `{ ticketId }` | JSON with full context |
| `get_file_changes` | Get list of files to create/modify | `{ ticketId }` | Array of file changes |
| `get_repository_context` | Get current repo state | `{ path? }` | File tree + git status |
| `update_ticket_status` | Update ticket status | `{ ticketId, status }` | Success message |

### 5.4 MCP Prompts

| Prompt | Description | Arguments | Output |
|--------|-------------|-----------|--------|
| `forge_execute` | Implement ticket | `ticketId` | Agent guide + ticket context |
| `forge_review` | Generate questions | `ticketId` | Agent guide + ticket summary |

### 5.5 Agent Guide Markdown

**Purpose:** Markdown files that define agent behavior (loaded into MCP prompts)

**Files:**
- `agents/dev-reviewer.md` - Guide for generating technical questions
- `agents/dev-executor.md` - Guide for implementing code

**Structure:**
```markdown
# Agent Guide Title

## Persona
- Role, identity, communication style

## Principles
- Core guidelines

## Process
- Step-by-step instructions

## Examples
- Good/bad examples
```

---

## 6. Authentication

### 6.1 Web Authentication (Existing)

**Flow:** OAuth via Firebase Auth (Google, GitHub)

```
User → Google OAuth → Firebase Auth → Web UI
  ↓
POST /auth/init
  ↓
Backend creates workspace (if first login)
  ↓
Returns { workspaceId, workspaceName }
```

### 6.2 CLI Authentication (New)

**Flow:** OAuth Device Flow

```
$ forge login
  ↓
CLI: POST /auth/device/request
  ← { deviceCode, userCode, verificationUri }
  ↓
CLI: Opens browser to verificationUri
  ↓
User enters userCode and authorizes
  ↓
CLI: Polls POST /auth/device/token (every 5s)
  ← { accessToken, refreshToken, workspaceId, user }
  ↓
CLI: Stores tokens in ~/.forge/config.json
  ↓
✅ Logged in
```

### 6.3 Token Management

**Access Token:** JWT, 15-minute expiry
**Refresh Token:** JWT, 7-day expiry
**Storage:** `~/.forge/config.json` (user home directory)
**Refresh:** Auto-refresh on 401 responses

---

## 7. Data Model

### 7.1 Domain Extensions

#### WorkspaceMember (New Entity)

```typescript
class WorkspaceMember {
  userId: string;
  workspaceId: string;
  email: string;
  displayName: string;
  role: Role;  // Admin | Developer | PM | QA
  status: MemberStatus;  // Invited | Active | Removed
  invitedBy: string;
  invitedAt: Date;
  joinedAt?: Date;

  isActive(): boolean;
  hasRole(role: Role): boolean;
  canExecuteTickets(): boolean;  // Developer or Admin
  canApproveTickets(): boolean;  // PM or Admin
}
```

#### Workspace (Extended)

```typescript
class Workspace {
  // Existing fields
  id: string;
  ownerId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  // New methods
  addMember(userId: string, role: Role, invitedBy: string): void;
  removeMember(userId: string): void;
  changeMemberRole(userId: string, newRole: Role): void;
  getMemberRole(userId: string): Role | null;
  isMember(userId: string): boolean;
}
```

#### AEC (Extended)

```typescript
class AEC {
  // Existing fields
  id: string;
  workspaceId: string;
  status: AECStatus;
  // ... other fields

  // New status values
  enum AECStatus {
    READY_FOR_DEV_REVIEW = 'ready-for-dev-review',
    QUESTIONS_GENERATED = 'questions-generated',
    WAITING_FOR_APPROVAL = 'waiting-for-approval',
    READY_FOR_DEV = 'ready-for-dev',
    IN_PROGRESS = 'in-progress',
    COMPLETE = 'complete'
  }

  // New methods
  markReadyForDevReview(): void;
  addQuestions(questions: ClarificationQuestion[]): void;
  markWaitingForApproval(): void;
  approve(): void;
}
```

---

## 8. Component Interactions

### 8.1 Ticket Creation Flow

```
PM (Web UI)
  ↓
  1. Create ticket (title, description, design refs)
  ↓
POST /tickets
  ↓
Backend: CreateTicketUseCase
  ↓
  - Validate input
  - Create AEC entity (status: ready-for-dev-review)
  - Save to Firestore
  ↓
Firestore: /workspaces/{wsId}/aecs/{aecId}
  ↓
✅ Ticket created
```

### 8.2 Developer Review Flow

```
Developer (CLI)
  ↓
$ forge review ABC-123
  ↓
CLI: GET /tickets/ABC-123
  ↓
CLI: Start MCP server (stdio)
  ↓
MCP: Expose prompt "forge_review"
  ↓
Developer opens Claude Code
  ↓
Claude Code: Connect to MCP server
  ↓
Claude Code: Invoke forge_review prompt
  ↓
  - Load agents/dev-reviewer.md
  - Load ticket context
  - Generate 5-10 questions
  ↓
Claude Code: Return questions JSON
  ↓
CLI: POST /tickets/ABC-123/questions
  ↓
Backend: AddQuestionsUseCase
  ↓
  - Validate questions
  - Update AEC (status: questions-generated)
  - Save to Firestore
  ↓
✅ Questions saved
```

### 8.3 Developer Execution Flow

```
Developer (CLI)
  ↓
$ forge execute ABC-123
  ↓
CLI: GET /tickets/ABC-123
  ↓
CLI: Validate status == ready-for-dev
  ↓
CLI: Start MCP server (stdio)
  ↓
MCP: Expose tools + prompts
  ↓
Developer opens Claude Code
  ↓
Claude Code: Invoke forge_execute prompt
  ↓
  - Load agents/dev-executor.md
  - Call get_ticket_context()
  - Call get_file_changes()
  - Call get_repository_context()
  ↓
Claude Code: Write files to disk
  ↓
Claude Code: Call update_ticket_status('in-progress')
  ↓
CLI: PATCH /tickets/ABC-123
  ↓
Backend: UpdateTicketUseCase
  ↓
✅ Files written, ticket updated
```

---

## 9. Security Considerations

### 9.1 Authentication
- ✅ All API calls require valid JWT token
- ✅ Tokens stored securely in user home directory
- ✅ Tokens expire (15-min access, 7-day refresh)
- ✅ Device flow prevents token theft (user authorizes in browser)

### 9.2 Authorization
- ✅ Workspace isolation (users only access their workspace tickets)
- ✅ Role-based permissions (PM can't execute, Dev can't approve)
- ✅ Member verification (check user is active member before actions)

### 9.3 CLI Security
- ✅ Config file permissions (chmod 600)
- ✅ No hardcoded secrets
- ✅ MCP server only listens on stdio (not network)
- ✅ Git operations read-only (no force push, no destructive commands)

### 9.4 Data Privacy
- ✅ Tickets only visible to workspace members
- ✅ Design references (Figma/Loom) use user's OAuth tokens
- ✅ No ticket data sent to third parties (MCP runs locally)

---

## 10. Future Enhancements

### Phase 2 (Post-MVP)
- **Multiple workspaces per user** - User can be member of 5+ workspaces
- **Team chat** - In-ticket comments and @mentions
- **Notifications** - Email/Slack when ticket assigned/approved
- **CLI auto-update** - Check for new version on startup
- **Bulk operations** - Execute multiple tickets in sequence
- **Workspace settings** - Configure repos, default branches

### Phase 3 (Advanced)
- **VS Code extension** - Execute tickets without leaving editor
- **GitHub Actions integration** - Auto-execute tickets on PR
- **Quality gates** - Run tests before marking complete
- **Analytics dashboard** - Team velocity, completion rates
- **AI suggestions** - Suggest tickets based on codebase changes

---

## Appendix A: Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 15.5.x |
| Backend | NestJS | 10.x |
| Database | Firebase Firestore | Admin SDK |
| Auth | Firebase Auth | Admin SDK |
| CLI | Node.js + Commander | 20.x + 11.x |
| MCP | @modelcontextprotocol/sdk | 1.0.x |
| Package Manager | pnpm | 8.x |

## Appendix B: API Endpoints Summary

### Team Management
```
POST   /workspaces/:id/members        # Invite member
DELETE /workspaces/:id/members/:uid   # Remove member
PATCH  /workspaces/:id/members/:uid   # Change role
GET    /workspaces/:id/members        # List members
```

### CLI Authentication
```
POST /auth/device/request             # Request device code
POST /auth/device/token               # Exchange for tokens
POST /auth/device/refresh             # Refresh access token
```

### CLI Ticket Operations
```
GET    /tickets                       # List tickets (filter by assigned)
GET    /tickets/:id                   # Get ticket details
POST   /tickets/:id/questions         # Add questions (dev review)
PATCH  /tickets/:id                   # Update status
POST   /tickets/:id/complete          # Mark complete
```

---

**Document Status:** Ready for Epic Breakdown
**Next Step:** Create implementation epics and stories
