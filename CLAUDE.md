
# claude.md — Default Development Behavior (Executable Tickets)

This file defines non-negotiable engineering rules for this repository.
Any AI assistant or contributor must follow these rules.

---

## 0) Project Structure

- `/backend` = Backend (NestJS)
- `/client` = Frontend (Next.js)
- `/docs` = Documentation (PRD, Architecture, UX, Epics)
- `/packages` = Shared packages (shared-types, configs)

---

## 1) Architecture Rules

### Backend (NestJS)
- Clean Architecture: presentation → application → domain ← infrastructure
- Domain must not depend on NestJS, Firebase, HTTP, or external SDKs
- Use Cases are the only entry points for business operations
- Infrastructure implements ports defined in application/domain

### Client (Next.js)
- UI renders state and triggers actions only
- Business logic MUST live in Zustand store actions and/or application use-cases
- NEVER implement business logic inside React hooks or components
- Hooks are lifecycle/subscription only

---

## 2) Design Patterns (Required)

- Ports & Adapters for external dependencies
- Repository pattern for persistence
- Mappers for boundary translation (DTO ↔ Domain, Domain ↔ Persistence)
- Policies for authorization/permissions (no inline checks)
- Explicit state machine for long flows (generation progress)

---

## 3) Code Quality Rules

- Prefer small functions and explicit types
- No hidden side effects
- No large “utils” dumping grounds
- Strong typing: avoid `any`
- Error handling must be typed (no stringly-typed errors)

---

## 4) UI Rules (Atomic Design)

- Atoms: primitive UI elements
- Molecules: small composed UI units
- Organisms: feature-level UI blocks
- Templates: page layouts
- Pages: route shells, minimal logic

UI must remain minimalistic and calm (Linear-inspired).
Avoid extra visual containers.

---

## 5) Testing Expectations

- Use cases must have unit tests (where feasible)
- Validation logic must be deterministic and testable
- Store actions must be testable (mock infrastructure adapters)
- Critical flows have integration tests

---

## 6) AI Output Requirements

When generating code or changes:
- State which layer you are modifying (presentation/application/domain/infrastructure)
- Do not cross boundaries
- Update or add tests when behavior changes
- Keep changes small and reviewable
- Do not introduce new dependencies unless necessary

---

## 7) Non-Negotiables

- No business logic in UI hooks
- No bypassing use cases with direct repository calls from controllers/UI
- No agent output applied without schema validation
