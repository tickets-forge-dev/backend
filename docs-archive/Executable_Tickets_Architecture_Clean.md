
# Executable Tickets – System Architecture (Clean Architecture + Design Patterns)
Version 1.1 | Execution-Ready

---

## 1. Purpose

This document defines the technical architecture for Executable Tickets with strict emphasis on:
- Clean Architecture on the backend (NestJS)
- Clean Architecture + Zustand store on the client (Next.js)
- Atomic Design for UI composition
- Small, smart code with consistent design patterns
- Zero business logic in React hooks (hooks are lifecycle only)
- A “claude.md” default behavior contract for AI-assisted development

---

## 2. Architectural Principles

1. **Single Source of Truth**: AEC is canonical
2. **Clean Architecture everywhere**: clear boundaries and dependency direction
3. **Business logic lives in the Store / Use-Cases** (never in UI hooks)
4. **Determinism over cleverness**: predictable, testable code
5. **Patterns over improvisation**: factories, adapters, ports, repositories, mappers
6. **Snapshot-based reality**: no “live assumptions” without references
7. **Pluggable agent layer**: agents cannot mutate state directly
8. **Minimal surface area**: prefer fewer abstractions, but make them correct

---

## 3. High-Level System Diagram (Conceptual)

User (PM)
→ Web Client (Next.js + Zustand Store)
→ Backend API (NestJS, Clean Architecture)
→ Firestore (AEC + tickets + index cache)
→ Mastra Agent Layer
→ GitHub App / OpenAPI
→ Jira / Linear

Event sources:
- GitHub webhooks (push/PR)
- Optional async jobs (Cloud Tasks)

---

## 4. Technology Stack (Final)

### Client
- React + Next.js (App Router)
- Zustand store
- TypeScript
- Atomic Design component architecture

### Backend
- NestJS (REST)
- Firebase Admin SDK
- Clean Architecture layers (presentation/application/domain/infrastructure)

### Firebase
- Auth (identity)
- Firestore (primary DB: tickets, AEC, index snapshots, validation)
- Storage (attachments)

### SCM
- GitHub App (read-only)
- Webhooks (push, PR)

### Agents
- Mastra orchestrator
- LLM provider is pluggable

---

## 5. Backend Architecture (NestJS + Clean Architecture)

### 5.1 Layering (Dependency Direction)
**Presentation → Application → Domain ← Infrastructure**
- Presentation depends on Application
- Application depends on Domain
- Infrastructure implements ports defined by Application/Domain
- Domain has no dependencies on framework or DB

### 5.2 Suggested Folder Structure
```
src/
  presentation/
    http/
      controllers/
      dtos/
      guards/
      interceptors/
      filters/
    modules/
  application/
    use-cases/
    services/            # application services orchestration
    ports/               # interfaces for infra (repositories, gateways)
    mappers/
  domain/
    entities/
    value-objects/
    domain-services/
    errors/
    events/
  infrastructure/
    persistence/
      firestore/
        repositories/
        mappers/
    integrations/
      github/
      openapi/
      jira/
      linear/
      agents/
    config/
  shared/
    utils/
    types/
    constants/
```
Notes:
- Nest modules live in `presentation/modules` but wire providers from application/infra.
- Domain never imports NestJS, Firebase, HTTP, or external SDKs.

### 5.3 Backend Patterns (Required)
- **Use Case pattern**: each user action is a use-case class
- **Ports & Adapters**: infra implements ports declared in application
- **Repository pattern**: Firestore repositories behind interfaces
- **DTO ↔ Domain mapping**: explicit mappers (no leaking persistence models)
- **Policy / Authorization pattern**: policy classes, not inline checks
- **Result / Error pattern**: typed errors, no throwing random strings

### 5.4 Example Use-Cases (Application Layer)
- `GenerateTicketUseCase`
- `RevalidateTicketUseCase`
- `ApplyClarificationAnswerUseCase`
- `ExportTicketToJiraUseCase`
- `RefreshApiSnapshotUseCase`
- `BuildRepoIndexSnapshotUseCase`

### 5.5 Invariants (Backend)
- Only backend can write AEC
- Every AEC write is schema-validated
- Every agent output is validated before patching AEC
- Snapshots are immutable references (commit SHA + snapshot IDs)

---

## 6. Client Architecture (Next.js + Zustand + Clean Architecture + Atomic Design)

### 6.1 Core Rule: No Business Logic in React Hooks
Hooks are allowed only for:
- lifecycle (mount/unmount, effects to call store actions)
- subscriptions/selectors
- UI-only concerns (focus, layout)

**Business logic must live in:**
- Store actions (or store services)
- Use-case layer (client-side application layer) called by the store

### 6.2 Client Clean Architecture Layers
**UI → Store/Application → Domain → Infrastructure**
- UI renders state + triggers store actions
- Store orchestrates use-cases and holds state
- Domain holds entities/value objects and rules
- Infra provides API clients/adapters

### 6.3 Suggested Folder Structure
```
src/
  ui/
    atoms/
    molecules/
    organisms/
    templates/
    pages/                # Next route handlers / page shells (UI only)
  store/
    slices/
    actions/
    selectors/
    middlewares/
  application/
    use-cases/
    services/
  domain/
    entities/
    value-objects/
    errors/
  infrastructure/
    api/
      httpClient.ts
      ticketApi.ts
      repoApi.ts
    storage/
      attachmentStorage.ts
    mappers/
  shared/
    utils/
    types/
    constants/
```
Atomic Design:
- Atoms: buttons, inputs, badges, chips
- Molecules: readiness badge, progress step item, ticket row
- Organisms: ticket list, ticket editor, clarification chat
- Templates: full page layouts, split panes
- Pages: thin shells connecting route to template

### 6.4 Zustand Store Design (Required)
- Store is the business logic boundary for the UI
- Store actions call use-cases (application layer)
- Store maintains derived state (readiness display state, progress stage, etc.)
- Prefer small slices (ticketSlice, repoSlice, exportSlice, uiSlice)

Example action naming:
- `generateTicket(title, description)`
- `answerClarification(questionId, answer)`
- `revalidate(ticketId)`
- `exportToJira(ticketId)`

### 6.5 Client Patterns (Required)
- **Command/Action pattern** in store actions
- **Selector pattern** for derived UI state
- **Adapter pattern** for API integration
- **State machine** for generation progress stages (explicit enum)
- **Immutable updates** and predictable state transitions

---

## 7. Cross-Cutting: Design for Small, Smart Code

### 7.1 Rules
- Prefer explicit over implicit
- Keep functions small and single-purpose
- Avoid “helper soup” and generic utils
- Strong typing everywhere (DTOs, domain, store)
- Use factories for constructing domain entities
- Use mappers for IO boundaries
- No “smart components” doing logic

### 7.2 Naming Conventions
- UseCases: `VerbNounUseCase`
- Ports: `ITicketRepository`, `IApiSnapshotProvider`
- Adapters: `FirestoreTicketRepository`, `GithubApiClient`
- Store actions: `verbNoun`

---

## 8. Agent Layer & Trust (Unchanged Principles)

- Agents return structured JSON only
- Backend validates agent output and applies patches
- Agents never write to Firestore directly
- Max 3 questions, max 4 chips, always “Type your own” option

---

## 9. Deliverables: claude.md (Default Behavior Contract)

Include a `claude.md` in the repo root to enforce consistent AI-assisted development behavior:
- Architecture boundaries
- No business logic in UI hooks
- Use-case and store rules
- Code style and pattern rules
- Output requirements (tests, types, docs)

A starter `claude.md` is provided in a separate file.

---

## 10. Final Rule

If boundaries are clean and the store/use-cases own business logic,
the UI stays minimal and the system stays maintainable.
