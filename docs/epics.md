# forge - Epic Breakdown

**Author:** BMad
**Date:** 2026-01-30
**Project Level:** expert
**Target Scale:** Enterprise SaaS Platform

---

## Overview

This document provides the complete epic and story breakdown for forge, decomposing the requirements from the [PRD](./Executable_Tickets_PRD_FULL.md) into implementable stories.

**Living Document Notice:** This is the initial version. It will be updated after UX Design and Architecture workflows add interaction and technical details to stories.

---

## Functional Requirements Inventory

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Users can create executable tickets with title and optional description | P0 |
| FR2 | System shows real-time progress through 8 generation steps | P0 |
| FR3 | System asks max 3 questions with chips UI when readiness is low | P1 |
| FR4 | System maintains AEC as single source of truth | P0 |
| FR5 | System validates tickets against structural, behavioral, testability, risk, permission criteria | P1 |
| FR6 | System estimates effort based on modules, APIs, DB changes, auth impact | P2 |
| FR7 | System exports ready tickets to Jira/Linear with dev/QA appendix | P1 |
| FR8 | System detects when code/API snapshots change and flags drift | P2 |
| FR9 | System indexes GitHub repos for code-aware ticket generation | P2 |
| FR10 | System pulls and validates OpenAPI specs for API-aware tickets | P2 |

---

## FR Coverage Map

| Epic | Covered FRs |
|------|-------------|
| Epic 1: Foundation | Infrastructure for all FRs |
| Epic 2: Ticket Creation & AEC Engine | FR1, FR2, FR4 |
| Epic 3: Clarification & Validation | FR3, FR5 |
| Epic 4: Code Intelligence & Estimation | FR6, FR8, FR9, FR10 |
| Epic 5: Export & Integrations | FR7 |

---

## Epic 1: Foundation

**Goal:** Establish project infrastructure, core dependencies, deployment pipeline, and design system that enables all subsequent development.

**Value:** Creates the technical foundation for the entire system. Without this, nothing else can be built.

---

### Story 1.1: Project Setup and Repository Initialization

As a development team,
I want the project scaffolded with proper structure and tooling,
So that we have a consistent, maintainable codebase from day one.

**Acceptance Criteria:**

**Given** a greenfield project start
**When** the foundation story is complete
**Then** the repository contains:
- Next.js app with TypeScript configured
- NestJS backend with Clean Architecture folder structure
- Firebase project connected (Auth, Firestore, Storage)
- Linting (ESLint), formatting (Prettier), and type checking enabled
- Git repository with main branch protected

**And** CI/CD pipeline is configured for:
- Automated testing on PR
- Build verification
- Deployment to staging environment

**And** documentation exists for:
- Local development setup
- Environment variable requirements
- Deployment procedures

**Prerequisites:** None (first story)

**Technical Notes:**
- Follow folder structure from Architecture doc (presentation/application/domain/infrastructure)
- Set up Zustand store structure for client state management
- Configure Firebase Admin SDK for backend
- Include claude.md in repo root with project standards
- Use feature-by-structure for all new TypeScript files

---

### Story 1.2: Design System - shadcn/ui Setup with Linear-Inspired Minimalism

As a frontend developer,
I want a design system built on shadcn/ui with Linear-inspired minimalism,
So that the UI is consistent, calm, and professional across all screens.

**Acceptance Criteria:**

**Given** the Next.js project is set up
**When** this story is complete
**Then** shadcn/ui is initialized and configured with:
- Base color: neutral (grayscale-focused)
- Component aliases configured (`@/core/components/ui/*`)
- All required base components installed (button, input, textarea, badge, card, dialog, dropdown-menu, etc.)

**And** a Design Tokens system exists in `globals.css`:
- **Colors:** Neutral scale (50-950), Semantic: Green (ready), Amber (needs input), Red (blocked)
- **Typography:** Single font family, Scale: 12px metadata, 13-14px body, 14-16px section, 20-22px title
- **Spacing:** 4px base grid (4, 8, 12, 16, 24, 32, 48, 64)
- **Radii:** Small (4px) inputs, Medium (8px) cards, Large (12px) modals
- **Shadows:** Minimal only (0 1px 2px, 0 4px 6px)

**And** Global Styles follow Linear discipline:
- No cards inside cards - flat surfaces
- Max content width ~720-840px, left-aligned text
- Whitespace over dividers - no borders unless necessary
- Generous spacing between sections

**And** Dark mode support is fully configured:
- Light and dark color palettes defined in `globals.css` using `data-theme` attribute
- All components use design tokens (no hardcoded colors, automatic theme adaptation)
- Theme toggle component in user profile menu (cycles System/Light/Dark with sun/moon/auto icons)
- Theme preference stored in localStorage for immediate access (no flash on load)
- Theme preference synced to Firestore for cross-device consistency
- System theme detection (follows OS preference when mode = "system", default)
- OS theme change listener (updates in real-time when OS theme changes)
- Smooth transition animations between themes (200ms ease-in-out)
- WCAG 2.1 AA contrast ratios verified for both light and dark modes
- No flash of wrong theme on page load (theme applied before first render using preload pattern)

**And** Theme switcher UI exists in:
- User profile menu: Icon button (sun/moon/auto) with tooltip showing current mode
- Settings → Appearance: Radio buttons with live preview panel showing theme

**And** Dark mode component adaptations:
- Primary button: White background with black text (inverted from light mode)
- Readiness badges: Higher opacity backgrounds (0.2 vs 0.1) for visibility
- Code blocks: Dark background with light text and syntax highlighting
- Semantic colors brightened for dark background visibility (amber, red, blue, purple)
- All components automatically adapt via design tokens

**And** Page Templates exist:
- **Default Layout:** Minimal header, centered max-width main content, no sidebar
- **Tickets List Template:** Table/cards layout with filter bar and empty state
- **Ticket Detail Template:** Full-width sections with inline editing areas
- **Create Ticket Template:** Minimal centered form
- **Settings Template:** Sectioned layout with clear hierarchy

**And** component patterns are minimal:
- Rounded chips for selections (no checkmarks, subtle background change)
- Badges are text-based, not colorful pills
- Buttons: minimal padding, clear hierarchy (primary/secondary/ghost)
- Form inputs: clean, minimal borders, visible focus states
- No spinners - use text or subtle animations

**And** accessibility requirements met (WCAG 2.1 Level AA):
- All components meet color contrast requirements (≥4.5:1 for normal text, ≥3:1 for large text)
- Keyboard navigation works for all interactive elements (tab order, focus indicators)
- Focus indicators visible (2px blue outline with offset)
- Screen reader compatibility verified (ARIA labels, semantic HTML, live regions)
- Touch targets ≥44px for mobile interactions
- No time-pressure interactions

**Prerequisites:** Story 1.1 (project setup)

**Technical Notes:**
- Use shadcn/ui CLI for component installation
- Extend shadcn components in `ui/atoms/` and `ui/molecules/` folders
- Atomic Design: atoms (buttons, inputs), molecules (readiness badge, chips), organisms (ticket list, forms)
- Override shadcn defaults in globals.css to match Linear minimalism
- All components use design tokens (no hardcoded values)
- Keep UI calm - "if it feels slightly boring, you're doing it right"

---

## Epic 2: Ticket Creation & AEC Engine

**Goal:** Enable users to create executable tickets with transparent generation, maintaining AEC as the single source of truth.

**Value:** Delivers the core product experience—PM inputs minimal intent, system generates validated ticket. Users see transparency into generation process and trust the output.

**Covers:** FR1, FR2, FR4

---

### Story 2.1: Ticket Creation UI - Minimal Input Form

As a Product Manager,
I want to create a new ticket by entering title and optional description,
So that I can start the ticket generation process with minimal effort.

**Acceptance Criteria:**

**Given** the user is authenticated and on the tickets list page
**When** they click "New Ticket" button
**Then** a minimal centered form appears with:
- Title field (required, text input)
- Description field (optional, textarea with placeholder "Add context...")
- "Generate Ticket" primary button (disabled until title is filled)
- "Cancel" ghost button

**And** when the title field has at least 3 characters:
- "Generate Ticket" button becomes enabled

**And** when the user clicks "Generate Ticket":
- Form is replaced with generation progress UI (Story 2.2)
- Backend receives ticket creation request with title and description

**And** when the user clicks "Cancel":
- Form closes, returns to tickets list

**And** the UI follows Linear minimalism:
- No unnecessary borders or containers
- Clean, focused form with generous whitespace
- Subtle focus states on inputs

**Prerequisites:** Story 1.2 (design system)

**Technical Notes:**
- UI component: `src/tickets/components/CreateTicketForm.tsx`
- Use Zustand store action: `createTicket(title, description)`
- Store action calls use case: `CreateTicketUseCase`
- Use case creates AEC in domain, persists via repository
- AEC initial state: `status: 'draft'`, `readinessScore: 0`
- Repository saves to Firestore `/workspaces/{workspaceId}/aecs/{aecId}`

**Covers:** FR1

---

### Story 2.2: Generation Progress - Transparent 8-Step UI

As a Product Manager,
I want to see real-time progress through ticket generation steps,
So that I trust the system and understand what's happening.

**Acceptance Criteria:**

**Given** the user has submitted a ticket creation request
**When** generation begins
**Then** the UI displays 8 steps vertically with:
- Step number and title
- Status indicator (pending/in-progress/complete)
- Expandable details section (collapsed by default)
- Retry button (if step fails)

**And** the 8 steps shown are:
1. "Intent extraction" - Parse user input
2. "Type detection" - Classify ticket type (feature/bug/task)
3. "Repo index query" - Find relevant code modules
4. "API snapshot resolution" - Resolve OpenAPI spec version
5. "Ticket drafting" - Generate AEC content
6. "Validation" - Run validators and calculate score
7. "Question prep" - Identify clarification questions
8. "Estimation" - Calculate effort estimate

**And** as each step completes:
- Step status changes from pending → in-progress → complete
- Next step automatically starts
- Details section populates with human-readable summary

**And** when all steps complete:
- UI transitions to ticket detail view with readiness badge
- AEC status updated to 'validated'

**And** if any step fails:
- Step shows error status
- Error message displayed in expandable details
- Retry button appears for that step only
- User can retry or cancel

**And** progress persists:
- If user navigates away, they can return and see progress
- AEC stores `generationState` field tracking step completion

**And** step timeouts are enforced:
- Each step completes in <10 seconds typically
- Step timeout after 30 seconds triggers [failed] state with retry option
- Total generation target: <60 seconds (aligns with UX North Star)
- Timeout errors are user-friendly, not technical

**Prerequisites:** Story 2.1 (ticket creation form)

**Technical Notes:**
- UI component: `src/tickets/components/GenerationProgress.tsx`
- Subscribe to AEC updates via Firestore listener for real-time progress
- **Backend orchestration:** CreateTicketUseCase orchestrates all 8 steps sequentially:
  - Steps 1, 2, 5, 7: Call Mastra agents via ILLMContentGenerator interface (LLM-powered content generation)
  - Steps 3, 4, 6, 8: Call NestJS services directly (deterministic operations, no LLM)
- Backend updates AEC `generationState` object in Firestore after each step completes
- Frontend renders based on `generationState.currentStep` and `generationState.steps[]`
- Expandable details use shadcn Accordion component
- Step retry calls the same use case, starting from the failed step index

**Covers:** FR2

---

### Story 2.3: AEC Domain Model - Schema and Persistence

As a backend engineer,
I want the AEC (Agent Executable Contract) as a strongly-typed domain entity,
So that all ticket data is consistent and validated at the domain layer.

**Acceptance Criteria:**

**Given** the domain layer is implemented
**When** this story is complete
**Then** an AEC domain entity exists with:
- `id: string` (UUID)
- `workspaceId: string`
- `title: string`
- `description: string | null`
- `type: 'feature' | 'bug' | 'task' | null`
- `status: 'draft' | 'validated' | 'ready' | 'created' | 'drifted'`
- `readinessScore: number` (0-100)
- `generationState: GenerationState` (tracks 8 steps)
- `acceptanceCriteria: string[]`
- `assumptions: string[]`
- `repoPaths: string[]` (code modules touched)
- `apiSnapshot: { specUrl: string, hash: string } | null`
- `codeSnapshot: { commitSha: string, indexId: string } | null`
- `questions: Question[]` (max 3)
- `estimate: Estimate | null`
- `validationResults: ValidationResult[]`
- `createdAt: Date`
- `updatedAt: Date`

**And** domain validation rules enforced:
- Title must be 3-500 characters
- Status transitions validated (draft → validated → ready → created)
- Readiness score 0-100 only
- Max 3 questions
- Snapshots mandatory when status = 'ready'

**And** AEC repository interface defined:
- `save(aec: AEC): Promise<void>`
- `findById(id: string): Promise<AEC | null>`
- `findByWorkspace(workspaceId: string): Promise<AEC[]>`
- `update(aec: AEC): Promise<void>`

**And** Firestore repository implementation:
- Implements repository interface
- Maps domain AEC ↔ Firestore document
- Uses Firestore subcollection: `/workspaces/{workspaceId}/aecs/{aecId}`
- Handles timestamps and serialization

**And** AEC is the write source:
- UI never writes directly to Firestore
- All mutations go through use cases → domain → repository
- UI subscribes to AEC changes via Firestore listeners

**Prerequisites:** Story 1.1 (backend setup)

**Technical Notes:**
- Domain entity: `backend/src/domain/aec/AEC.ts`
- Repository interface: `backend/src/application/ports/AECRepository.ts`
- Firestore implementation: `backend/src/infrastructure/persistence/FirestoreAECRepository.ts`
- Mappers: `backend/src/infrastructure/persistence/mappers/AECMapper.ts`
- Domain validation: Use value objects for complex types (Estimate, ValidationResult)
- Follow Clean Architecture: domain has no Firebase imports
- Use NestJS dependency injection for repository

**Covers:** FR4

---

### Story 2.4: Ticket Detail View - AEC Rendering

As a Product Manager,
I want to view a generated ticket with all its details,
So that I can review acceptance criteria, assumptions, and readiness before exporting.

**Acceptance Criteria:**

**Given** an AEC exists with status 'validated' or 'ready'
**When** the user navigates to the ticket detail page
**Then** the UI displays:
- **Header:** Title, readiness badge (Green ≥75 / Amber 50-74 / Red <50)
- **Section: Acceptance Criteria:** Numbered list, editable inline
- **Section: Assumptions:** Bulleted list, editable inline
- **Section: Affected Code:** List of repo paths/modules
- **Section: Estimate:** Effort range, confidence, drivers (if available)
- **Section: Questions:** Max 3 questions with chip options (if readiness < 75)
- **Footer:** Export button (enabled when readiness ≥ 75)

**And** all sections use:
- Full-width layout with generous vertical spacing
- Section headers (14-16px) with subtle dividers
- Body text (13-14px) for content
- Inline editing with click-to-edit fields

**And** readiness badge shows:
- Green "Ready 85" if score ≥ 75
- Amber "Needs Input 62" if score 50-74
- Red "Blocked 32" if score < 50

**And** when the user edits acceptance criteria or assumptions:
- Changes debounced (500ms)
- Backend use case updates AEC
- Readiness score recalculated
- Badge updates live

**And** the UI follows Linear minimalism:
- No cards inside cards - flat surfaces
- Left-aligned text, max 840px width
- Whitespace over dividers

**Prerequisites:** Story 2.3 (AEC domain model), Story 2.2 (generation complete)

**Technical Notes:**
- UI component: `src/tickets/components/TicketDetail.tsx`
- Subscribe to AEC via Firestore listener (real-time updates)
- Use Zustand store for local editing state
- Inline editing: `src/tickets/components/InlineEditableList.tsx`
- Store actions: `updateAcceptanceCriteria()`, `updateAssumptions()`
- Use cases: `UpdateAECUseCase`
- Readiness badge: `src/core/components/ReadinessBadge.tsx` (molecule)

**Covers:** FR4

---

## Epic 3: Clarification & Validation

**Goal:** Improve ticket quality through intelligent questioning and comprehensive validation.

**Value:** Shifts validation left to creation time. Reduces ambiguity and increases engineering confidence in tickets.

**Covers:** FR3, FR5

---

### Story 3.1: Validation Engine - Multi-Criteria Scoring

As a backend engineer,
I want a validation engine that scores tickets across multiple criteria,
So that readiness is deterministic and explainable.

**Acceptance Criteria:**

**Given** an AEC exists in 'validated' state
**When** the validation engine runs
**Then** five validator types execute:
1. **Structural Validator** - Checks title length, acceptance criteria count, assumptions present
2. **Behavioral Validator** - Verifies acceptance criteria are testable (Given/When/Then format)
3. **Testability Validator** - Ensures repro steps (bugs) or success criteria (features) are deterministic
4. **Risk Validator** - Flags auth changes, DB migrations, breaking API changes
5. **Permissions Validator** - Checks if user has access to affected repos/modules

**And** each validator returns:
- `passed: boolean`
- `score: number` (0-100)
- `weight: number` (importance multiplier)
- `issues: Issue[]` (array of problems found)
- `blockers: Issue[]` (subset of issues that prevent export)

**And** weighted scoring calculates overall readiness:
- Structural: weight 1.0
- Behavioral: weight 1.5
- Testability: weight 2.0
- Risk: weight 1.0
- Permissions: weight 3.0 (blocking)

**And** formula: `readinessScore = Σ(validator.score × validator.weight) / Σ(validator.weight)`

**And** validation results stored in AEC:
- `validationResults: ValidationResult[]`
- `readinessScore: number`
- `blockingIssues: Issue[]`

**And** blocking validators prevent export:
- Permissions failures block export (score forced to < 75)
- Missing repro steps for bugs block export

**And** validation is deterministic:
- Same input always produces same score
- No LLM calls for scoring (only for question generation)

**Prerequisites:** Story 2.3 (AEC domain model)

**Technical Notes:**
- Validation engine: `backend/src/application/services/ValidationEngine.ts`
- Each validator: `backend/src/domain/validation/validators/{ValidatorType}.ts`
- Validators implement `Validator` interface
- Use case: `ValidateAECUseCase` (called after generation step 6)
- Results stored in AEC via repository
- Frontend renders validation results in ticket detail view

**Covers:** FR5

---

### Story 3.2: Question Generation - Intelligent Clarification

As a Product Manager,
I want the system to ask me targeted questions when readiness is low,
So that I can provide missing context and improve ticket quality.

**Acceptance Criteria:**

**Given** an AEC has readiness score < 75
**When** the question generation step runs (step 7 of generation)
**Then** the system generates max 3 questions based on validation issues:
- Questions prioritized by impact (blocking issues first)
- Each question has 2-4 chip options (binary or multi-choice)
- Each question includes "Type your own" fallback

**And** question generation rules:
- Ask only when answer changes execution (no subjective questions)
- Prefer binary questions ("Yes" / "No")
- Never repeat questions already answered
- Default assumptions documented if question skipped

**And** question types mapped to validation issues:
- **Missing repro steps (bug):** "Can you reproduce this consistently?" (Yes/No)
- **Unclear auth impact:** "Does this change permissions logic?" (Yes/No/Unsure)
- **Database change detected:** "Should this use a migration?" (Yes/No/Not applicable)
- **Multiple code paths possible:** "Which module should handle this?" (Chip options: module names)

**And** questions stored in AEC:
- `questions: Question[]` (max 3)
- Each question: `{ id, text, type, options, answer, defaultAssumption }`

**And** when user answers a question:
- Answer stored in AEC
- Validation re-runs
- Readiness score updated
- New questions may appear (if score still < 75, total max 3)

**And** question UI appears in ticket detail view:
- Questions section below assumptions
- Chip UI for options (rounded, minimal)
- Text input for "Type your own"
- Submit button updates AEC

**Prerequisites:** Story 3.1 (validation engine), Story 2.4 (ticket detail view)

**Technical Notes:**
- Question generator: `backend/src/application/services/QuestionGenerator.ts`
- Uses LLM to generate context-aware questions from validation issues
- Prompt template ensures questions are actionable
- Frontend component: `src/tickets/components/QuestionChips.tsx`
- Store action: `answerQuestion(aecId, questionId, answer)`
- Use case: `AnswerQuestionUseCase` → triggers re-validation

**Covers:** FR3

---

### Story 3.3: Validation Results UI - Explainable Scores

As a Product Manager,
I want to see why my ticket has a specific readiness score,
So that I understand what needs improvement.

**Acceptance Criteria:**

**Given** an AEC has been validated
**When** the user views the ticket detail page
**Then** a "Validation" expandable section appears showing:
- Overall readiness score badge (Green/Amber/Red)
- Breakdown by validator type (5 validators)
- Each validator shows: score, weight, pass/fail, issues

**And** the breakdown displays:
- Validator name (e.g., "Structural Validator")
- Individual score (0-100)
- Weight multiplier (e.g., "×2.0")
- Pass/fail indicator
- List of issues (if any)

**And** issues are categorized:
- 🔴 **Blockers:** Prevent export, must fix
- 🟡 **Warnings:** Lower score, should fix
- 🟢 **Suggestions:** Minor improvements

**And** each issue shows:
- Description (e.g., "Acceptance criteria not in Given/When/Then format")
- Suggested fix (e.g., "Rewrite as: Given X, When Y, Then Z")

**And** when the user fixes an issue (edits acceptance criteria, answers question):
- Validation automatically re-runs
- Score updates live
- Issues list refreshes

**And** the section is collapsed by default:
- User can expand to see details
- Badge always visible (doesn't require expansion)

**Prerequisites:** Story 3.1 (validation engine), Story 2.4 (ticket detail view)

**Technical Notes:**
- UI component: `src/tickets/components/ValidationResults.tsx`
- Use shadcn Accordion for expandable section
- Subscribe to AEC `validationResults` field
- Color coding: use semantic design tokens (green/amber/red)
- Issue icons: simple emoji or minimal icons

**Covers:** FR5

---

## Epic 4: Code Intelligence & Estimation

**Goal:** Make tickets code-aware and provide accurate effort estimates by indexing repos and analyzing API contracts.

**Value:** Tickets reference actual code reality, not assumptions. Engineers get realistic estimates based on similar work.

**Covers:** FR6, FR8, FR9, FR10

---

### Story 4.1: GitHub App Integration - Read-Only Repo Access

As a Product Manager,
I want to connect my GitHub organization to Executable Tickets,
So that the system can read my codebase and generate code-aware tickets.

**Acceptance Criteria:**

**Given** the user is a workspace admin
**When** they navigate to Settings → Integrations → GitHub
**Then** they see:
- "Connect GitHub" button
- OAuth flow explanation ("Read-only access, no code writes")

**And** when they click "Connect GitHub":
- GitHub OAuth flow launches
- User authorizes GitHub App
- App requests permissions: `read:repo`, `read:org`, `read:user`
- User redirected back to app with authorization code

**And** after successful authorization:
- Backend exchanges code for access token
- Token stored securely in Firestore (encrypted)
- Backend fetches user's accessible repositories
- Repository list displayed in UI with checkboxes

**And** the user can select repositories to index:
- Checkbox list of repos
- "Index Selected Repos" button
- Triggers indexing workflow (Story 4.2)

**And** GitHub App webhook configured:
- Backend registers webhook URL
- Listens for `push` and `pull_request` events
- Updates index when code changes (Story 4.4)

**Prerequisites:** Story 1.1 (backend setup)

**Technical Notes:**
- GitHub App setup in GitHub Developer Settings (manual step)
- Backend controller: `backend/src/presentation/controllers/GitHubController.ts`
- Use case: `ConnectGitHubUseCase`
- Token storage: Firestore `/workspaces/{workspaceId}/integrations/github`
- Encrypt tokens using Firebase KMS or env secret
- Use `@octokit/rest` SDK for GitHub API
- Webhook handler: `backend/src/infrastructure/webhooks/GitHubWebhookHandler.ts`

**Covers:** FR9 (prerequisite)

---

### Story 4.2: Code Indexing - Build Repo Index for Query

As a backend system,
I want to index GitHub repositories into a queryable structure,
So that ticket generation can find relevant code modules quickly.

**Acceptance Criteria:**

**Given** a repository has been selected for indexing
**When** the indexing job runs
**Then** the system:
- Clones repo (shallow clone, latest commit)
- Parses file structure (ignore node_modules, .git, etc.)
- Extracts metadata for each file: path, language, exports, imports, top-level functions/classes
- Builds searchable index of modules and dependencies

**And** index stored in Firestore:
- Collection: `/workspaces/{workspaceId}/indexes/{indexId}`
- Fields: `repoName`, `commitSha`, `files[]`, `createdAt`
- Each file: `{ path, language, exports, imports, summary }`

**And** indexing progress tracked:
- UI shows "Indexing..." status in Settings
- Progress percentage (files processed / total files)
- Completes in background (async job)

**And** index cache invalidated on code changes:
- GitHub webhook triggers re-index (incremental if possible)
- New `indexId` created per commit
- Old indexes retained for drift detection

**And** index query interface exists:
- `findModulesByIntent(intent: string, indexId: string): Promise<Module[]>`
- Uses keyword search or embeddings (TBD by architecture)

**Prerequisites:** Story 4.1 (GitHub integration)

**Technical Notes:**
- Indexing job: `backend/src/application/services/RepoIndexer.ts`
- Use tree-sitter or static analysis for parsing (language-specific)
- For MVP: simple file path + export/import extraction (no full AST)
- Store index in Firestore (consider Cloud Storage for large repos)
- Async job: Use NestJS queue (Bull) or Firebase Functions
- Query uses keyword matching initially (can upgrade to vector embeddings post-MVP)

**Covers:** FR9

---

### Story 4.3: OpenAPI Spec Sync - API Contract Awareness

As a backend system,
I want to pull and validate OpenAPI specs from repositories,
So that tickets reference actual API contracts and detect drift.

**Acceptance Criteria:**

**Given** a repository contains an OpenAPI spec file (e.g., `openapi.yaml`)
**When** the indexing job runs
**Then** the system:
- Detects OpenAPI spec file(s) in repo
- Parses and validates spec (OpenAPI 3.0/3.1)
- Extracts endpoints, methods, request/response schemas
- Computes spec hash (SHA-256 of spec content)
- Stores spec metadata in Firestore

**And** spec stored in Firestore:
- Collection: `/workspaces/{workspaceId}/apiSpecs/{specId}`
- Fields: `repoName`, `specUrl`, `hash`, `endpoints[]`, `version`, `commitSha`, `createdAt`

**And** when ticket generation references an API:
- Ticket includes `apiSnapshot: { specUrl, hash }`
- Snapshot locks ticket to specific API version

**And** spec validation enforced:
- Invalid OpenAPI files logged but don't block indexing
- UI shows warning if spec validation fails

**And** query interface exists:
- `findEndpointsByIntent(intent: string, specId: string): Promise<Endpoint[]>`
- Returns relevant API endpoints for ticket type

**Prerequisites:** Story 4.2 (code indexing)

**Technical Notes:**
- OpenAPI parser: Use `@apidevtools/swagger-parser` or `openapi-typescript`
- Spec detection: Search for `openapi.yaml`, `openapi.json`, `swagger.yaml` in repo root or `/docs`
- Store full spec in Firestore or Cloud Storage (if large)
- Hash computation: Use Node.js `crypto` module
- Validation errors logged to Firestore `/logs` for debugging

**Covers:** FR10

---

### Story 4.4: Drift Detection - Snapshot Change Flagging

As a Product Manager,
I want to be notified when code or API snapshots change after ticket creation,
So that I know when a ticket may be outdated.

**Acceptance Criteria:**

**Given** an AEC exists with `status: 'ready'` or `'created'`
**And** the AEC has `codeSnapshot` and/or `apiSnapshot`
**When** a GitHub webhook event arrives (push to main)
**Then** the system:
- Checks if any open AECs reference the affected repo
- Compares current commit SHA / API spec hash to snapshot values
- If changed, updates AEC `status: 'drifted'`

**And** drift detection logged:
- AEC gains `driftDetectedAt: Date` field
- `driftReason: string` (e.g., "Code snapshot changed: abc123 → def456")

**And** UI shows drift indicator:
- Ticket detail page displays amber banner: "⚠️ Code has changed since this ticket was created"
- Banner includes: "Snapshot: abc123 (old) → def456 (current)"
- "Refresh Ticket" button to regenerate with new snapshot

**And** when user clicks "Refresh Ticket":
- Regenerates ticket using current code/API snapshot
- Keeps user edits (acceptance criteria, assumptions)
- Updates snapshots
- Status changes from 'drifted' → 'validated'

**And** drift detection runs:
- On every GitHub webhook push event
- Async job checks all open tickets
- Batch processing (don't block webhook response)

**Prerequisites:** Story 4.2 (code indexing), Story 4.3 (API sync), Story 2.3 (AEC model)

**Technical Notes:**
- Webhook handler: `backend/src/infrastructure/webhooks/GitHubWebhookHandler.ts`
- Drift checker: `backend/src/application/services/DriftDetector.ts`
- Use case: `DetectDriftUseCase`
- Query Firestore for AECs with `status in ['ready', 'created']` and matching repo
- Update AEC status via repository
- Frontend banner: `src/tickets/components/DriftBanner.tsx`

**Covers:** FR8

---

### Story 4.5: Effort Estimation - Multi-Factor Calculation

As a Product Manager,
I want accurate effort estimates based on code complexity and similar tickets,
So that I can plan sprints realistically.

**Acceptance Criteria:**

**Given** an AEC has been validated and code/API snapshots resolved
**When** the estimation step runs (step 8 of generation)
**Then** the system calculates effort based on:
- **Modules touched:** Count of files/modules affected
- **API changes:** New endpoints, modified schemas, breaking changes
- **DB changes:** Migrations detected (schema changes in code)
- **Auth impact:** Changes to permissions, roles, or auth flows
- **Similar tickets:** Historical data from past tickets with similar scope

**And** estimation output includes:
- **Range:** Min-max hours (e.g., "4-8 hours")
- **Confidence:** Low/Medium/High based on data availability
- **Drivers:** Top 3 factors influencing estimate (e.g., "3 modules touched", "New API endpoint", "Auth logic change")

**And** estimation stored in AEC:
- `estimate: { min: number, max: number, confidence: string, drivers: string[] }`

**And** estimation logic:
- Base effort: 2 hours (minimum ticket size)
- +1-2 hours per module touched
- +2-4 hours for API changes
- +3-6 hours for DB migrations
- +2-3 hours for auth changes
- Adjusted by confidence (reduce range if high confidence)

**And** when insufficient data available:
- Confidence = "Low"
- Range = "4-12 hours" (wide)
- Drivers include "Limited historical data"

**And** UI displays estimate in ticket detail:
- "Estimate: 4-8 hours (Medium confidence)" badge
- Expandable section showing drivers

**Prerequisites:** Story 4.2 (code indexing), Story 4.3 (API sync), Story 3.1 (validation)

**Technical Notes:**
- Estimation engine: `backend/src/application/services/EstimationEngine.ts`
- Use case: `EstimateEffortUseCase` (called at generation step 8)
- Similar tickets query: Firestore query for AECs with similar `repoPaths` or `type`
- Initial MVP: Rule-based estimation (no ML)
- Post-MVP: Train model on historical ticket data
- Frontend component: `src/tickets/components/EstimateBadge.tsx`

**Covers:** FR6

---

## Epic 5: Export & Integrations

**Goal:** Export validated tickets to Jira/Linear with dev and QA appendices for seamless handoff.

**Value:** Tickets created in Executable Tickets integrate with existing workflows. Engineers and QA get structured context.

**Covers:** FR7

---

### Story 5.1: Jira Integration - OAuth & Export

As a Product Manager,
I want to export ready tickets to Jira,
So that my team can work in their existing workflow tool.

**Acceptance Criteria:**

**Given** the user is a workspace admin
**When** they navigate to Settings → Integrations → Jira
**Then** they see:
- "Connect Jira" button
- OAuth flow explanation

**And** when they click "Connect Jira":
- Jira OAuth 2.0 flow launches
- User authorizes app access
- Backend exchanges code for access token
- Token stored securely in Firestore (encrypted)

**And** after successful authorization:
- Backend fetches user's Jira projects
- Project list displayed in UI with default project selector

**And** when a ticket has `readinessScore ≥ 75`:
- "Export to Jira" button appears in ticket detail footer
- User clicks button
- Modal opens: Select Jira project, issue type (Story/Task/Bug)
- "Export" button in modal

**And** when user clicks "Export" in modal:
- Backend creates Jira issue via REST API
- Issue contains:
  - **Summary:** AEC title
  - **Description:** AEC description + auto-generated sections
  - **Acceptance Criteria:** Formatted list
  - **Dev Appendix:** Code modules, API snapshot, estimate
  - **QA Appendix:** Validation results, assumptions, repro steps (if bug)
- AEC `status` updated to 'created'
- AEC gains `externalIssue: { platform: 'jira', issueId, issueUrl }`

**And** export success shown in UI:
- Success toast: "Ticket exported to Jira"
- Ticket detail shows link to Jira issue

**And** if export fails:
- Error message displayed
- User can retry

**Prerequisites:** Story 2.4 (ticket detail), Story 3.1 (validation)

**Technical Notes:**
- Jira OAuth 2.0 setup in Atlassian Developer Console (manual step)
- Backend controller: `backend/src/presentation/controllers/JiraController.ts`
- Use case: `ExportToJiraUseCase`
- Use `jira-client` or REST API directly
- Token storage: Firestore `/workspaces/{workspaceId}/integrations/jira`
- Export format: Markdown for Jira description (Jira supports Markdown in some fields, fallback to plain text)
- Modal component: `src/tickets/components/ExportModal.tsx`

**Covers:** FR7

---

### Story 5.2: Linear Integration - GraphQL Export

As a Product Manager,
I want to export ready tickets to Linear,
So that my team can work in their existing workflow tool.

**Acceptance Criteria:**

**Given** the user is a workspace admin
**When** they navigate to Settings → Integrations → Linear
**Then** they see:
- "Connect Linear" button
- OAuth flow explanation

**And** when they click "Connect Linear":
- Linear OAuth 2.0 flow launches
- User authorizes app access
- Backend exchanges code for access token
- Token stored securely in Firestore (encrypted)

**And** after successful authorization:
- Backend fetches user's Linear teams
- Team list displayed in UI with default team selector

**And** when a ticket has `readinessScore ≥ 75`:
- "Export to Linear" button appears in ticket detail footer
- User clicks button
- Modal opens: Select Linear team, project (optional), priority
- "Export" button in modal

**And** when user clicks "Export" in modal:
- Backend creates Linear issue via GraphQL API
- Issue contains:
  - **Title:** AEC title
  - **Description:** AEC description + auto-generated sections (Markdown)
  - **Acceptance Criteria:** Formatted checklist
  - **Dev Notes:** Code modules, API snapshot, estimate
  - **QA Notes:** Validation results, assumptions
- AEC `status` updated to 'created'
- AEC gains `externalIssue: { platform: 'linear', issueId, issueUrl }`

**And** export success shown in UI:
- Success toast: "Ticket exported to Linear"
- Ticket detail shows link to Linear issue

**And** if export fails:
- Error message displayed
- User can retry

**And** Linear's markdown format supported:
- Checklists for acceptance criteria
- Code blocks for technical details
- Links to code files (GitHub URLs)

**Prerequisites:** Story 2.4 (ticket detail), Story 3.1 (validation)

**Technical Notes:**
- Linear OAuth 2.0 setup in Linear Developer Settings (manual step)
- Backend controller: `backend/src/presentation/controllers/LinearController.ts`
- Use case: `ExportToLinearUseCase`
- Use `@linear/sdk` or GraphQL API directly
- Token storage: Firestore `/workspaces/{workspaceId}/integrations/linear`
- Linear supports full Markdown in descriptions
- Modal component: Reuse `ExportModal.tsx` with platform prop

**Covers:** FR7

---

### Story 5.3: Export Appendices - Dev & QA Context

As an engineer or QA,
I want exported tickets to include structured context,
So that I have all necessary information to implement and verify.

**Acceptance Criteria:**

**Given** an AEC is being exported to Jira or Linear
**When** the export use case runs
**Then** the issue description includes auto-generated sections:

**Dev Appendix:**
```
## Dev Context
- **Affected Modules:** [list of file paths from repoPaths]
- **Code Snapshot:** Commit SHA with GitHub link
- **API Snapshot:** OpenAPI spec version and hash (if applicable)
- **Estimate:** 4-8 hours (Medium confidence)
- **Drivers:** 3 modules touched, New API endpoint
```

**QA Appendix:**
```
## QA Verification
- **Readiness Score:** 85/100 (Ready)
- **Validation Results:** [pass/fail by validator type]
- **Assumptions:** [list of assumptions from AEC]
- **Repro Steps:** [if bug, include deterministic repro]
- **Acceptance Criteria:** [formatted checklist for QA to verify]
```

**And** formatting is platform-appropriate:
- Jira: Use Jira markdown or plain text with formatting
- Linear: Use Linear markdown (checklists, code blocks)

**And** GitHub links are clickable:
- Code snapshot links to GitHub commit
- Affected modules link to files at specific commit

**And** if data is missing:
- Sections gracefully omit missing fields
- E.g., if no API snapshot, omit "API Snapshot" line

**Prerequisites:** Story 5.1 (Jira export) OR Story 5.2 (Linear export)

**Technical Notes:**
- Template builder: `backend/src/application/services/ExportTemplateBuilder.ts`
- Generates markdown string from AEC fields
- Platform-specific formatters: `JiraFormatter.ts`, `LinearFormatter.ts`
- GitHub commit URL: `https://github.com/{owner}/{repo}/commit/{sha}`
- File URL: `https://github.com/{owner}/{repo}/blob/{sha}/{filePath}`

**Covers:** FR7

---

## Epic Summary

All epics complete! Here's the coverage:

| Epic | Stories | FRs Covered |
|------|---------|-------------|
| Epic 1: Foundation | 2 | Infrastructure |
| Epic 2: Ticket Creation & AEC Engine | 4 | FR1, FR2, FR4 |
| Epic 3: Clarification & Validation | 3 | FR3, FR5 |
| Epic 4: Code Intelligence & Estimation | 5 | FR6, FR8, FR9, FR10 |
| Epic 5: Export & Integrations | 3 | FR7 |
| **TOTAL** | **17 stories** | **All FRs covered** |

---

## Notes for Architecture Phase

- All stories use vertical slicing (end-to-end features)
- No forward dependencies (all dependencies flow backward)
- Each story is AI-agent sized (2-4 hour sessions)
- FR traceability added to every story
- Clean Architecture enforced (domain has no framework dependencies)
- AEC is single source of truth throughout
- Ready for UX Design and Architecture workflows

