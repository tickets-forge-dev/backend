
# Executable Tickets – System Architecture
Version 1.0 | Execution-Ready

---

## 1. Purpose of This Document

This document describes the **technical architecture** of Executable Tickets.
It is intended for:
- Backend engineers
- Frontend engineers
- AI / agent engineers
- DevOps / platform

It defines **components, responsibilities, data flow, boundaries, and constraints**
so the system can be built without architectural guesswork.

---

## 2. Architectural Principles

1. **Single Source of Truth** → AEC
2. **Snapshot-Based Reality** → no live assumptions
3. **Read-Only by Default** → external systems
4. **Event-Driven Where Useful** → not everywhere
5. **MVP-Friendly** → avoid infra bloat
6. **Replaceable AI Layer** → agents are pluggable

---

## 3. High-Level System Diagram (Conceptual)

User (PM)
→ Web Client (Next.js)
→ Backend API (NestJS)
→ Firestore (AEC + tickets)
→ Mastra Agent Layer
→ GitHub App / OpenAPI
→ Jira / Linear

All arrows are **request/response**, except:
- GitHub webhooks
- Optional async revalidation jobs

---

## 4. Core Components

---

### 4.1 Web Client (React + Next.js)

**Responsibilities**
- Ticket list UI
- Ticket creation UI
- Generation progress UI
- Clarification chat
- PM view + Dev/QA appendix rendering
- Export actions

**Key Characteristics**
- Stateless UI
- All data comes from AEC
- Optimistic UI updates
- Keyboard-first interactions

**Never Does**
- Validation logic
- Code analysis
- Agent reasoning

---

### 4.2 Backend API (NestJS)

**Responsibilities**
- Auth verification (Firebase Auth)
- AEC lifecycle management
- Validation execution
- Agent orchestration
- Snapshot resolution
- Export integrations

**Modules**
- AuthModule
- TicketModule
- AecModule
- ValidationModule
- AgentModule
- SnapshotModule
- ExportModule

**Important Rule**
The backend is the **only writer** of AECs.

---

### 4.3 Firebase Auth

**Responsibilities**
- User identity
- Workspace membership
- Role signaling (PM, Admin)

**Notes**
- Auth info injected into backend via Firebase Admin SDK
- No business logic in auth

---

### 4.4 Firestore (Primary Data Store)

**Collections**
- workspaces
- repositories
- tickets
- aecs
- validations
- indexSnapshots
- apiSnapshots

**Characteristics**
- AEC stored as JSON blob (schema-validated)
- Snapshot references immutable
- Versioned writes only

---

### 4.5 Firebase Storage

**Used For**
- PRDs
- Architecture docs
- Screenshots
- Videos

Referenced by URL from AEC only.

---

## 5. Codebase Indexing (MVP-Friendly)

### 5.1 GitHub App

**Permissions**
- Read repository content
- Read PRs and commits

**Never**
- Write code
- Comment on PRs (v1)

---

### 5.2 Indexing Strategy

**Goal**
Flatten the repo into a **queryable index**, not a full graph.

**Indexed Elements**
- Controllers / routes
- Services
- Data models / schemas
- Auth guards
- Environment configs

**Stored As**
`indexSnapshots/{id}`

Each snapshot tied to:
- repo
- commit SHA
- timestamp

---

### 5.3 Why Not Clone Repos in UI

- Browser cannot access filesystem
- Security risk
- Latency
- Architecture complexity

Indexing happens server-side only.

---

## 6. API Snapshot System

### 6.1 OpenAPI Source

- Pull Swagger / OpenAPI JSON
- Normalize
- Hash content
- Store as snapshot

### 6.2 Snapshot Usage

- Generate curl commands
- Generate QA checks
- Detect drift

**Stored As**
`apiSnapshots/{id}`

---

## 7. Mastra Agent Architecture

### 7.1 Role of Mastra

Mastra is an **orchestration layer**, not a brain.

Agents are:
- Deterministic
- Schema-bound
- Auditable

---

### 7.2 Agent Types

- Intent Extraction Agent
- Validation Agent
- Clarification Question Agent
- Estimation Agent
- Appendix Generator Agent

Each agent:
- Receives structured JSON
- Returns structured JSON
- Cannot write directly to DB

---

### 7.3 Agent Execution Flow

Backend:
1. Builds agent input envelope
2. Calls agent
3. Validates agent output JSON
4. Applies patches to AEC
5. Re-runs validation

---

## 8. Validation Engine

### Characteristics
- Deterministic
- Rule-based
- No LLM logic

### Inputs
- AEC
- Ticket type
- Snapshot signals

### Outputs
- Readiness score
- Failed validators
- Question triggers

---

## 9. Clarification System

- Driven only by failed validators
- Max 3 questions
- One question per validator
- Answers patch AEC only

---

## 10. Estimation Engine

### Inputs
- Impact size
- Snapshot signals
- Similar historical tickets

### Output
- Points range
- Confidence
- Drivers

No AI hallucination allowed.

---

## 11. Export Architecture (Jira / Linear)

### Flow
1. Map AEC → external payload
2. Render PM view
3. Append Dev/QA appendix
4. Create external ticket
5. Store external ID

Exports are **write-once**.

---

## 12. Drift Detection & Revalidation

### Triggers
- Repo webhook
- API snapshot change
- Manual revalidate

### Behavior
- Mark ticket as drifted
- Notify user
- Offer one-click update

---

## 13. Error Handling Strategy

### Rules
- Fail loudly but calmly
- Preserve user input
- Retryable operations only

### Common Failures
- Repo unavailable
- Agent timeout
- Snapshot mismatch

---

## 14. Security Model

- Firebase Auth → Backend
- Backend → GitHub App (read-only)
- Agents isolated
- No secrets exposed to client

---

## 15. Scaling Considerations (Later)

- Cache index queries
- Rate-limit agent calls
- Shard Firestore by workspace
- Background revalidation jobs

---

## 16. Out of Scope (Architecture)

- IDE plugins
- Code writing agents
- Multi-repo dependency resolution
- Runtime instrumentation

---

## 17. Final Architectural Rule

If the AEC is correct,
everything else becomes simple.
