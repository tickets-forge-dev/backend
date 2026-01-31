
# Product Requirements Document (PRD)
# Executable Tickets

---
## 0. Document Metadata
- Version: 1.0
- Status: Final (Execution-ready)
- Audience: Product, Engineering, Design, AI/Agents
- Last Updated: 2026-01-30

---
## 1. Executive Summary

Executable Tickets is a system that transforms minimal product intent into validated, code-aware, execution-ready tickets for Jira and Linear.  
The system introduces a new primitive: the **Agent Executable Contract (AEC)** — a machine-verifiable contract that binds product intent, code reality, API contracts, validation rules, QA verification, and estimation into a single source of truth.

This PRD defines **UX, system behavior, agent rules, schemas, validation logic, and delivery epics** in sufficient detail to begin implementation immediately.

---
## 2. Problem Statement (Expanded)

### 2.1 Current Reality
- PMs write tickets based on assumptions, not code reality
- Engineers must reinterpret tickets into executable tasks
- QA reconstructs intent late in the process
- API contracts drift from tickets
- Estimation is guesswork

### 2.2 Cost of the Problem
- 20–40% of engineering time lost to clarification
- Low trust in PM-authored tickets
- Inconsistent delivery quality
- Delayed feedback loops

### 2.3 Why Existing Tools Fail
| Tool | Limitation |
|----|----|
| Jira / Linear | Storage only |
| Notion AI | Text generation, no validation |
| Copilot / Cursor | Code-centric, not PM-centric |
| Docs | Drift, not enforced |

---
## 3. Product Principles

1. **Minimal input, maximal output**
2. **Transparency over magic**
3. **Determinism over creativity**
4. **PM-first, never PM-only**
5. **Agents must be auditable**
6. **Assumptions must be explicit**

---
## 4. Users & Personas

### 4.1 Primary: Product Manager
- Wants speed
- Avoids technical depth
- Needs trust from engineering

### 4.2 Secondary: Engineer
- Wants clarity
- Wants testability
- Wants fewer meetings

### 4.3 QA
- Wants deterministic verification steps
- Wants reproducible APIs

---
## 5. Goals, KPIs, Success Metrics

### 5.1 Product Goals
- Reduce ambiguity at creation time
- Shift left validation
- Improve estimation accuracy

### 5.2 KPIs
- Clarification comments per ticket ↓ 30%
- Time to first commit ↓ 25%
- Ticket readiness ≥ 75 before creation (80% of tickets)
- User-reported confidence score ≥ 4/5

---
## 6. Non-Goals (Hard Boundaries)

- Automatic code generation
- Autonomous PR creation
- Replacing human judgment
- Full static dependency graphs
- IDE replacement

---
## 7. Technology Stack (Final)

### Client
- React
- Next.js (App Router)

### Backend
- NestJS (REST)
- Firebase Admin SDK

### Firebase
- Auth (identity, roles)
- Firestore (AECs, tickets, index cache)
- Storage (attachments)

### Source Control
- GitHub App (read-only)
- Webhooks (push, PR)

### AI / Agents
- Mastra (orchestrator)
- LLM provider abstracted

---
## 8. System Architecture (Detailed)

### 8.1 Data Stores
| Store | Purpose |
|----|----|
| Firestore | AECs, tickets, validation state |
| Storage | PRDs, diagrams, screenshots |
| GitHub | Code truth |
| OpenAPI | API truth |

### 8.2 Snapshot Model
- Code snapshot = commit SHA + index ID
- API snapshot = OpenAPI hash
- Every ticket references snapshots explicitly

---
## 9. UX Flow (Full)

### 9.1 Ticket Creation
User enters:
- Title (required)
- Description (optional)

### 9.2 Generation Transparency
UI shows:
1. Intent extraction
2. Type detection
3. Repo index query
4. API snapshot resolution
5. Ticket drafting
6. Validation
7. Question prep
8. Estimation

Each step:
- Human-readable
- Expandable details
- Retryable

### 9.3 Clarification
- Max 3 questions
- Chips first
- “Type your own” fallback
- Live readiness updates

### 9.4 Ready State
- Green readiness
- Locked estimate
- Export enabled

---
## 10. Agent Executable Contract (AEC)

### 10.1 Purpose
AEC is:
- Executable
- Validatable
- Renderable
- Versioned

### 10.2 Lifecycle
Draft → Validated → Ready → Created → Drifted → Updated

### 10.3 Canonical Ownership
AEC is the only write source.
UI, agents, exports are projections.

---
## 11. Validation System (Deep)

### 11.1 Validator Types
- Structural
- Behavioral
- Testability
- Risk
- Permissions

### 11.2 Blocking Validators
- Permissions
- Repro determinism (bugs)
- Acceptance criteria

### 11.3 Scoring
- Weighted
- Explainable
- Deterministic

---
## 12. Clarification Question Engine

### Rules
- Ask only when execution changes
- Prefer binary
- Never repeat
- Default assumptions documented

---
## 13. Estimation Engine

### Inputs
- Modules touched
- API changes
- DB changes
- Auth impact
- Similar tickets

### Output
- Range
- Confidence
- Drivers

---
## 14. Security & Trust

- Firebase Auth
- Workspace isolation
- Read-only GitHub
- Snapshot citations mandatory
- No hallucinated data allowed

---
## 15. Epics & Delivery Plan

### EPIC 1: Core UX
### EPIC 2: AEC Engine
### EPIC 3: Indexing
### EPIC 4: API Sync
### EPIC 5: Validation & Questions
### EPIC 6: Estimation
### EPIC 7: Integrations

---
## 16. Risks & Mitigations

| Risk | Mitigation |
|----|----|
| Over-questioning | Hard caps |
| Agent hallucination | Schema + citations |
| PM overload | Progressive disclosure |
| Drift | Snapshot banners |

---
## 17. Final Statement

Executable Tickets is not a productivity tool.  
It is a **contract system between intent and execution**.

