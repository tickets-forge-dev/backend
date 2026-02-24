
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

### 4a) Design System Governance (CRITICAL)

**The design system is the source of truth for app cohesion. Protecting it prevents regressions.**

- `client/app/globals.css` defines all design tokens (colors, spacing, typography, scrollbars)
- **NEVER remove or downgrade design tokens** without explicit justification in PR description
- **If reverting a commit**, verify it doesn't remove modern scrollbars, soft text colors, or design refinements
- **Theme colors must stay comfortable**: dark mode text is soft white (#e8e8e8), not harsh (#fafafa)
- **Scrollbars are 8px thin rounded**, not default browser ugly scrollbars
- **Sidebar is structural**: if navigation changes, sidebar state MUST be persisted in `useUIStore`
- **Border token rule**: ALL card/grid/container borders MUST use `border border-[var(--border-subtle)]` — never use hardcoded `border-white/[0.XX]` or `border-[var(--border)]/30`. The `--border-subtle` token is `rgba(255,255,255,0.06)` in dark mode and `rgba(0,0,0,0.08)` in light mode — a consistent hairline that works across themes.

**Design System Components (Protected):**
- `client/src/core/components/sidebar/Sidebar.tsx` - Main navigation
- `client/src/core/components/sidebar/SidebarHeader.tsx` - User profile dropdown
- `client/src/core/components/sidebar/SidebarNav.tsx` - Navigation links with active states
- `client/src/core/components/sidebar/SidebarFooter.tsx` - Theme toggle + collapse button
- `client/src/stores/ui.store.ts` - Sidebar state (collapsed/expanded, persisted to localStorage)

**Violation Indicators (Red Flags):**
- ❌ Visible borders on every card (`border border-[var(--border)]/30`)
- ❌ Harsh text colors in dark mode (`#fafafa` instead of `#e8e8e8`)
- ❌ Sidebar missing or replaced with minimal header-only layout
- ❌ Default browser scrollbars instead of custom styled ones
- ❌ "Remove Card component" commits without replacing with consistent styling

**If Sidebar Gets Removed:**
- Always check git diff against Feb 3 modernization commit (3ce28b6)
- Sidebar should collapse to icon-only (64px) on desktop, slide out on mobile
- User preferences persist across sessions via Zustand + localStorage

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
