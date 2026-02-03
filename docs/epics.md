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
| Epic 6: Quick Document Generation | Enhanced FR1, FR4 |
| Epic 7: Code-Aware Validation | Enhanced FR5 (concrete validation) |

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

### Story 2.5: AEC XML Serialization Format

As a developer or AI agent,
I want the AEC available in a machine-readable XML format,
So that external systems and agents can parse, validate, and execute tickets programmatically.

**Acceptance Criteria:**

**Given** the AEC domain model exists
**When** this story is complete
**Then** an XML schema (XSD) is defined at `docs/schemas/aec-v1.xsd` with:
- Complete schema for all AEC elements (metadata, intent, requirements, implementation, validation, snapshots, tracking, export)
- Proper namespacing: `https://executable-tickets.com/schema/aec/v1`
- Validation rules for required/optional fields
- Documentation for all elements and attributes

**And** the AEC domain entity has XML serialization methods:
- `toXML(): string` - generates valid XML conforming to schema
- Handles null values, CDATA escaping, ISO timestamps
- Includes all AEC data (acceptance criteria, assumptions, estimates, validation results)
- Unit tests verify XML output validity against XSD

**And** the AEC domain entity has XML deserialization:
- Static `fromXML(xml: string): AEC` method
- Parses XML back to AEC domain entity
- Validates against XSD schema before parsing
- Handles malformed XML gracefully with clear error messages
- Unit tests verify round-trip conversion (AEC → XML → AEC)

**And** XML export is integrated into the system:
- "Download AEC.xml" button in ticket detail UI
- XML included as attachment when exporting to Jira/Linear
- Optional storage in Firebase Storage bucket: `/aec-exports/{aecId}.xml`
- Generated on-demand (not stored by default in v1)

**And** the XML format includes all critical sections:
- `<metadata>` - id, workspace, status, readiness, timestamps
- `<intent>` - title, description, type, user story
- `<requirements>` - acceptance criteria (with Given/When/Then), assumptions
- `<implementation>` - tasks, interfaces, artifacts, repoPaths
- `<validation>` - results, constraints, questions
- `<snapshots>` - repositoryContext, codeSnapshot, apiSnapshot
- `<tracking>` - generationState, estimate
- `<export>` - externalIssue, appendices (if exported)

**And** documentation exists:
- Complete XML specification in `docs/aec-xml-specification.md`
- Usage examples for export, version control, agent execution
- Migration path from v1 → v2 → v3

**Prerequisites:** Story 2.3 (AEC Domain Model)

**Technical Notes:**
- Schema file: `docs/schemas/aec-v1.xsd`
- Implementation: Add `toXML()` and `fromXML()` methods to `backend/src/tickets/domain/aec/AEC.ts`
- Use `xml2js` or `fast-xml-parser` for XML generation/parsing
- Unit tests: `backend/src/tickets/domain/aec/AEC.xml.spec.ts`
- Export integration: Update `ExportToJiraUseCase` and `ExportToLinearUseCase`
- UI: Add download button in `src/tickets/components/TicketDetail.tsx`
- Storage: Optional Firebase Storage integration via `IStorageService` port
- **Design Decision:** TypeScript AEC domain entity remains source of truth. XML is a projection/export format, not a replacement.
- **Out of Scope for v1:** XML as primary storage, real-time XML updates, XML-based API endpoints

**Covers:** FR4 (extended), foundation for external agent execution

**Priority:** P2 (Nice to have for v1, required for v2 with external agent integration)

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

All epics with functional requirements coverage:

| Epic | Stories | FRs Covered | Priority |
|------|---------|-------------|----------|
| Epic 1: Foundation | 2 | Infrastructure | P0 |
| Epic 1.5: OAuth Authentication | 2 | Auth & Multi-tenancy | P0 |
| Epic 2: Ticket Creation & AEC Engine | 5 | FR1, FR2, FR4 | P0 |
| Epic 3: Clarification & Validation | 3 | FR3, FR5 | P1 |
| Epic 4: Code Intelligence & Estimation | 5 | FR6, FR8, FR9, FR10 | P1-P2 |
| Epic 5: Export & Integrations | 3 | FR7 | P1 |
| Epic 6: Quick Document Generation | 8 | Enhanced FR1, FR4 | P0 (v1) |
| **Epic 7: Code-Aware Validation** | **7** | **Enhanced FR5** | **P0 (critical)** |
| **TOTAL** | **35 stories** | **All FRs + enhancements** | |

**Note:** Epic 7 transforms validation from abstract scoring to concrete, code-aware findings using Mastra workspace analysis

---

## Notes for Architecture Phase

- All stories use vertical slicing (end-to-end features)
- No forward dependencies (all dependencies flow backward)
- Each story is AI-agent sized (2-4 hour sessions)
- FR traceability added to every story
- Clean Architecture enforced (domain has no framework dependencies)
- AEC is single source of truth throughout
- Ready for UX Design and Architecture workflows


## Epic 6: Quick Document Generation

**Goal:** Auto-generate concise PRD and Architecture documents using AI-powered repository analysis to provide context for better AEC generation.

**Value:** Enables solo PMs without existing docs to get high-quality executable tickets. Transforms "no context" scenario from 60% AEC accuracy to 85%+ through intelligent document generation.

**Covers:** Enhanced FR1, FR4 (better AEC quality through context)

**Priority:** v1 (implements Phase 2 "Quick Generate" - fast, concise, AI-powered)

---

### Story 6.1: Document Domain Model and Firestore Storage

As a backend engineer,
I want a Document entity with Firestore persistence,
So that PRD and Architecture documents can be stored, versioned, and queried.

**Acceptance Criteria:**

**Given** the document domain is implemented
**When** this story is complete
**Then** a Document domain entity exists with:
- `id: string`
- `workspaceId: string`
- `type: 'prd' | 'architecture'`
- `content: string` (markdown)
- `version: number`
- `source: 'auto-generated' | 'uploaded' | 'edited'`
- `createdAt: Date`
- `updatedAt: Date`

**And** DocumentRepository interface defined:
- `save(doc: Document): Promise<void>`
- `findByWorkspaceAndType(workspaceId, type): Promise<Document | null>`
- `exists(workspaceId, type): Promise<boolean>`
- `listVersions(workspaceId, type): Promise<Document[]>`

**And** Firestore implementation:
- Path: `workspaces/{workspaceId}/documents/{type}`
- Version history: `workspaces/{workspaceId}/document-versions/{type}-v{n}`
- Mapper for domain ↔ Firestore

**Prerequisites:** None (new module)

**Technical Notes:**
- Domain entity: `backend/src/documents/domain/Document.ts`
- Repository: `backend/src/documents/application/ports/DocumentRepository.ts`
- Firestore impl: `backend/src/documents/infrastructure/persistence/FirestoreDocumentRepository.ts`
- Follow same Clean Architecture pattern as tickets module

---

### Story 6.2: AI-Powered Repository Analyzer

As a backend system,
I want to analyze any repository dynamically using AI to detect its tech stack,
So that PRD/Architecture generation has accurate technology context regardless of platform.

**Acceptance Criteria:**

**Given** a repository path or GitHub URL
**When** the analyzer runs
**Then** it scans the repository discovering all files without assumptions
**And** an AI agent identifies which files are relevant for tech stack analysis
**And** the system reads the identified files (max 15 for efficiency)
**And** an AI agent analyzes the files to determine:
- Platform type (web, mobile, desktop, game, backend-only, cli, embedded)
- Complete tech stack (frontend, backend, database, auth, state management)
- Architecture pattern (Clean Architecture, MVC, microservices, etc.)
- Key patterns (repository, DI, event sourcing, etc.)
- Confidence score (0-1)

**And** the analysis works for ANY tech stack:
- Web: React, Vue, Angular, Svelte, Next.js, Nuxt, etc.
- Mobile: Flutter, React Native, Swift, Kotlin, Ionic
- Backend: Node.js, Python, Go, Rust, Java, PHP, Ruby, .NET
- Game: Unity, Unreal, Godot
- Desktop: Electron, Tauri, Qt, WinForms
- Other: CLI tools, embedded systems

**And** analysis is version-aware:
- Reports specific versions (e.g., "Next.js 15.5" not just "Next.js")
- Detects from package managers (npm, pip, cargo, pub, etc.)

**And** if confidence <0.7:
- Analysis includes `uncertainties: string[]` listing unknowns
- Used to generate chip questions for user

**Prerequisites:** None

**Technical Notes:**
- Service: `backend/src/documents/application/services/RepoAnalyzer.ts`
- Uses ILLMContentGenerator (Ollama for dev, Claude for prod)
- Two LLM calls: (1) Identify relevant files, (2) Analyze tech stack
- Structured output with Zod schema validation
- Scans max depth 3, excludes node_modules/.git/build folders
- Reads max 15 files, 5000 chars each (token efficiency)

**Covers:** Foundation for Story 6.3-6.4

---

### Story 6.3: Upload Document Endpoint and UI

As a Product Manager,
I want to upload my existing PRD or Architecture document,
So that I can provide project context without using auto-generation.

**Acceptance Criteria:**

**Given** the user navigates to Settings → Project Documents
**When** the page loads
**Then** upload sections for PRD and Architecture are displayed

**And** the user can:
- Paste markdown content directly into textarea
- Upload .md file from their computer
- Preview rendered markdown before saving
- Save to workspace

**And** when the user saves a document:
- Backend validates markdown format
- Document stored in Firestore: `workspaces/{id}/documents/{type}`
- Document indexed in Mastra workspace for search
- Success message displayed

**And** uploaded documents are used:
- AEC generation uses uploaded docs for context
- Same priority as auto-generated docs
- Can be edited or regenerated later

**Prerequisites:** Story 6.1 (document storage)

**Technical Notes:**
- Backend endpoint: POST /api/documents/upload
- DTO: `{ type: 'prd' | 'architecture', content: string }`
- Frontend component: `client/src/documents/components/UploadDocument.tsx`
- Uses shadcn/ui: Textarea, Button, Tabs
- Markdown preview with react-markdown
- File upload with HTML5 File API

---

### Story 6.4: Mastra Workflow - Auto-Generate PRD

As a Product Manager,
I want the system to auto-generate a concise PRD from my project description,
So that I have project context without writing documentation manually.

**Acceptance Criteria:**

**Given** the user triggers "Auto-Generate PRD"
**When** the generation workflow runs
**Then** a Mastra workflow executes with these steps:
1. Analyze repository (Story 6.2 - AI-powered)
2. Search existing workspace for similar patterns (Mastra RAG)
3. Generate concise PRD using LLM with context
4. If confidence <0.7, suspend for chip questions
5. Resume with user answers
6. Save to Firestore
7. Index in Mastra workspace

**And** the generated PRD is concise:
- Maximum 1000 words
- 5 core sections: Vision, Users, Goals (top 3), Features (MVP, max 5), NFRs (key only)
- Markdown format
- No fluff, actionable content

**And** chip questions asked only when needed:
- Maximum 3 questions total
- Only if confidence <0.7
- Examples: "Primary user?", "Auth method?", "Deployment target?"
- Each question has 2-4 chip options

**And** generation uses context:
- Tech stack from repository analysis
- Similar tickets from workspace search (RAG)
- Existing README/docs if found
- Previous PRDs in workspace (learning from patterns)

**And** the workflow can be tracked:
- Frontend shows progress: "Analyzing repo..." → "Generating PRD..."
- Real-time status updates
- Shows chip questions when suspended
- Shows success with link to document

**Prerequisites:** Story 6.1 (storage), Story 6.2 (analyzer)

**Technical Notes:**
- Mastra workflow: `backend/src/documents/workflows/generate-prd.workflow.ts`
- Uses Mastra `createWorkflow()` with `createStep()`
- Sequential chaining: analyze → search → generate → save
- Suspend/resume for chip questions
- Integrates with Mastra workspace (RAG)
- Controller: POST /api/documents/generate-prd
- Frontend: `client/src/documents/components/GeneratePRDWizard.tsx`

**Covers:** Auto-generation path (primary focus per user requirements)

---

### Story 6.5: Mastra Workflow - Auto-Generate Architecture

As a backend engineer,
I want the system to auto-generate a concise Architecture document from PRD and tech stack,
So that architectural decisions are documented for consistent AEC generation.

**Acceptance Criteria:**

**Given** a PRD exists (auto-generated or uploaded)
**When** the user triggers "Auto-Generate Architecture"
**Then** a Mastra workflow executes:
1. Load PRD from Firestore
2. Use repository analysis from Story 6.2
3. Search workspace for architecture patterns (RAG)
4. Generate concise Architecture using LLM
5. If tech choices unclear, suspend for chip questions
6. Resume with user answers
7. Save to Firestore
8. Index in workspace

**And** the generated Architecture is concise:
- Maximum 800 words
- 4 core sections: Tech Stack, Key Decisions (5-7 only), Folder Structure, Patterns
- Focus on DECISIONS not descriptions
- Markdown format

**And** chip questions for tech choices only:
- Examples: "State management?", "API pattern?", "Deployment platform?"
- Only if ambiguous from tech stack detection
- Maximum 3 questions

**And** generation is context-aware:
- Uses PRD for business requirements
- Uses tech stack analysis for technology constraints
- Searches for similar architecture patterns (RAG)
- Follows detected folder structure

**Prerequisites:** Story 6.4 (PRD generated or uploaded)

**Technical Notes:**
- Mastra workflow: `backend/src/documents/workflows/generate-architecture.workflow.ts`
- Similar pattern to Story 6.4 (suspend/resume, chip questions)
- Uses PRD as input context
- Controller: POST /api/documents/generate-architecture
- Frontend: Same wizard component, different workflow

---

### Story 6.6: Document Generation Wizard UI

As a Product Manager,
I want a simple wizard to auto-generate PRD and Architecture,
So that I can quickly create project context with minimal effort.

**Acceptance Criteria:**

**Given** the user has no PRD or Architecture
**When** they create their first ticket
**Then** a prompt appears: "No project context found. Generate now?"
**And** options shown:
- "Auto-Generate" (primary)
- "Upload Manually" (secondary)
- "Skip" (ghost)

**And** when user clicks "Auto-Generate":
- Wizard modal opens
- Step 1: Shows "Analyzing repository..." with progress
- Step 2: If suspended, shows chip questions
- User selects chips (not text input unless "Other")
- Step 3: Shows "Generating PRD..." with progress
- Step 4: If suspended, shows PRD chip questions
- User answers
- Step 5: Shows "Generating Architecture..."
- Step 6: If suspended, shows Architecture chip questions
- Step 7: Shows "Complete! ✅ Documents generated"

**And** progress persists:
- If user closes modal, workflow continues in background
- Can reopen to see current progress
- Can navigate away and return

**And** when user clicks "Upload Manually":
- Navigates to Settings → Project Documents
- Shows upload interface

**And** when user clicks "Skip":
- Proceeds with ticket creation (degraded AEC quality)
- Can generate docs later from Settings

**Prerequisites:** Story 6.4, 6.5 (workflows ready)

**Technical Notes:**
- Component: `client/src/documents/components/GenerateDocsWizard.tsx`
- Uses Mastra workflow streaming for progress
- Chip questions with Badge components (from Epic 1)
- Progress indicator with step numbers (1/7, 2/7, etc.)
- Polls workflow status or uses webhooks for real-time updates
- Modal uses shadcn Dialog component

---

### Story 6.7: Document Viewer and Editor

As a Product Manager,
I want to view and edit generated or uploaded PRD and Architecture,
So that I can refine documents after auto-generation or upload.

**Acceptance Criteria:**

**Given** PRD or Architecture exists
**When** user navigates to Settings → Project Documents
**Then** document viewer is displayed with:
- Rendered markdown preview
- "Edit" button
- Document metadata (source, version, last updated)

**And** when user clicks "Edit":
- Textarea appears with raw markdown
- "Save" and "Cancel" buttons shown
- Can modify content

**And** when user clicks "Save":
- Document version incremented
- Previous version saved to version history
- New content saved to Firestore
- Workspace re-indexed with updated content
- Success message shown

**And** version history is accessible:
- "View History" link
- Shows list of versions with timestamps
- Can restore previous version

**Prerequisites:** Story 6.1 (storage)

**Technical Notes:**
- Component: `client/src/documents/components/DocumentViewer.tsx`
- Uses react-markdown for preview
- Inline editing with Textarea
- Version history in Accordion component
- Backend: PATCH /api/documents/:type

---

### Story 6.8: Mastra Workspace Indexing for RAG

As a backend system,
I want to index PRD, Architecture, and completed AECs in Mastra workspace,
So that future PRD/Architecture generation can search existing patterns (RAG).

**Acceptance Criteria:**

**Given** Mastra workspace is configured
**When** a document is created or updated
**Then** it is automatically indexed for search

**And** the following content is indexed:
- Generated or uploaded PRD
- Generated or uploaded Architecture
- Completed AECs (title, description, acceptance criteria)
- Repository README (if exists)

**And** indexing uses hybrid search:
- BM25 for keyword matching (free, fast)
- Vector search for semantic similarity (Ollama embeddings - free)
- Configurable fallback to BM25-only

**And** search is used during generation:
- PRD generation searches for similar projects
- Architecture generation searches for similar tech stacks
- Results feed into LLM prompts as context

**And** indexing is incremental:
- New documents indexed on creation
- Updated documents re-indexed on save
- Deleted documents removed from index

**Prerequisites:** None (can be first story in Epic 6)

**Technical Notes:**
- Mastra Workspace with BM25 + vector search
- Vector embeddings via Ollama (nomic-embed-text model - free)
- Service: `backend/src/documents/application/services/WorkspaceIndexingService.ts`
- Auto-index on document save
- Search in generatePRDStep and generateArchitectureStep
- Storage: Pinecone (cloud) or Qdrant (self-hosted) or Postgres (reuse DB)

---

## Epic 6 Summary

**Stories:** 7 total (was 5, added analyzer detail and indexing)

| Story | Title | Effort |
|---|---|---|
| 6.1 | Document Domain & Firestore Storage | Small |
| 6.2 | AI-Powered Repository Analyzer | Medium |
| 6.3 | Upload Document UI | Small |
| 6.4 | Auto-Generate PRD (Mastra Workflow) | Medium |
| 6.5 | Auto-Generate Architecture (Mastra Workflow) | Medium |
| 6.6 | Generation Wizard UI | Medium |
| 6.7 | Document Viewer/Editor | Small |
| 6.8 | Mastra Workspace Indexing (RAG) | Medium |

**Total Effort:** Similar to Epic 2 (8 stories)

**Timeline:** After Epic 2 complete (Option B confirmed)

**Key Technologies:**
- Mastra workflows (suspend/resume for chip questions)
- Mastra workspace (search & indexing for RAG)
- AI-powered analysis (no hardcoded tech stack detection)
- Firestore storage (not Firebase Storage for text docs)
- Ollama embeddings (free vector search)

**Outcome:**
- Solo PMs can auto-generate PRD + Architecture in <10 minutes
- 85%+ AEC accuracy (vs 60% without context)
- Works for ANY tech stack (Flutter, Unity, Django, Go, etc.)
- Concise outputs (<2000 words combined)

---

---

## Epic 1.5: OAuth Authentication

**Goal:** Enable users to authenticate with Google or GitHub OAuth, creating isolated workspaces for multi-tenancy.

**Value:** Provides proper user authentication and workspace isolation before ticket creation. No email/password - OAuth only for simplicity.

**Priority:** P0 (foundation - added to v1 plan)

---

### Story 1.5.1: OAuth Login UI - Google and GitHub

As a user,
I want to sign in with my Google or GitHub account,
So that I can access the application without creating passwords.

**Acceptance Criteria:**

**Given** an unauthenticated user visits the app
**When** they navigate to any protected route
**Then** they are redirected to /login

**And** the login page displays:
- App logo and title ("Forge")
- Tagline: "Transform product intent into execution-ready tickets"
- "Continue with Google" button (primary, with Google icon)
- "Continue with GitHub" button (secondary, with GitHub icon)
- No email/password fields
- No signup link (OAuth handles registration)
- Uses (auth) layout from Epic 1 (centered card)

**And** when user clicks "Continue with Google":
- Firebase Auth Google OAuth popup opens
- User authorizes with Google account
- On success: User object created in Firebase Auth (if first time)
- Redirected to /tickets
- Auth state persists across browser refresh

**And** when user clicks "Continue with GitHub":
- Firebase Auth GitHub OAuth popup opens
- Same flow as Google
- Supports GitHub organizations

**And** when OAuth fails:
- Error message displayed below buttons
- User can retry
- Common errors handled: "Popup blocked", "User cancelled"

**And** authenticated users:
- Can navigate freely in app
- See their user info in header (avatar, name)
- Can sign out from user menu

**Prerequisites:** Story 1.2 (design system with buttons, cards)

**Technical Notes:**
- Use Firebase Auth SDK: `signInWithPopup(auth, GoogleAuthProvider)`
- Auth state management: `onAuthStateChanged` listener
- Store: `client/src/stores/auth.store.ts` with Zustand
- Protected routes: Wrap (main) layout with auth check
- Icons: Use lucide-react icons (already installed)
- Firebase Console setup: Enable Google and GitHub providers
- GitHub OAuth App: Create at github.com/settings/developers

**Covers:** User authentication (OAuth-only)

---

### Story 1.5.2: Backend Auth Guards and Workspace Isolation

As a backend engineer,
I want Firebase token validation and workspace isolation,
So that only authenticated users can access their workspace's data.

**Acceptance Criteria:**

**Given** Firebase Auth is configured
**When** this story is complete
**Then** all /api/tickets endpoints require authentication:
- Request must include `Authorization: Bearer <firebase-token>` header
- FirebaseAuthGuard validates token with Firebase Admin SDK
- Returns 401 if token missing or invalid
- Returns 403 if token expired

**And** workspace isolation is enforced:
- Token decoded to extract user email/uid
- WorkspaceGuard maps user to workspaceId
- Request context includes workspaceId automatically
- Controllers use `@WorkspaceId() workspaceId: string` decorator

**And** workspace creation on first login:
- When new user authenticates (first time)
- Backend creates workspace document: `workspaces/{workspaceId}`
- workspaceId format: `ws_{hash(email)}` or `ws_{uid}`
- User document created: `workspaces/{workspaceId}/users/{uid}`
- User assigned as owner

**And** Firestore Security Rules enforce isolation:
```javascript
match /workspaces/{workspaceId}/{document=**} {
  allow read, write: if request.auth != null &&
    request.auth.token.workspaceId == workspaceId;
}
```

**And** existing tickets use real workspaces:
- Remove hardcoded `workspaceId: 'ws_dev'`
- Extract from request context
- All AECs scoped to user's workspace

**Prerequisites:** Story 1.5.1 (frontend auth)

**Technical Notes:**
- Guard: `backend/src/shared/presentation/guards/FirebaseAuthGuard.ts`
- Guard: `backend/src/shared/presentation/guards/WorkspaceGuard.ts`
- Decorator: `backend/src/shared/presentation/decorators/WorkspaceId.decorator.ts`
- Use case: `backend/src/workspaces/application/use-cases/CreateWorkspaceUseCase.ts`
- Domain: `backend/src/workspaces/domain/Workspace.ts`
- Apply guards to all controllers: `@UseGuards(FirebaseAuthGuard, WorkspaceGuard)`
- Update TicketsController to use workspaceId from context (not hardcoded)

**Covers:** Backend authentication and multi-tenancy

---

## Epic 1.5 Summary

**Stories:** 2 (OAuth-only, no email/password)
**Effort:** Small-Medium (much simpler than full auth)
**Timeline:** NOW (before continuing Epic 2)

---

## Epic 7: Code-Aware Validation & Pre-Implementation Analysis

**Goal:** Transform validation from abstract scoring to concrete, developer-ready insights by using Mastra workspace to run analysis agents on the actual cloned codebase.

**Value:** Tickets become at least as valuable as what developers get from Claude Code/Cursor. PMs receive concrete feedback like "Add helmet package for security headers" instead of "Risk score: 65". Eliminates false alarms and wasted developer time.

**Covers:** Enhanced FR5 (concrete validation with real code analysis)

**Priority:** P0 (critical for v1 quality)

**Technical Foundation:** Mastra v1 workspace with LocalFilesystem, LocalSandbox, and Skills for analyzing cloned repositories and simulating implementations.

---

### Story 7.1: Mastra Workspace Configuration for Repository Analysis

As a backend engineer,
I want to configure Mastra workspace for each indexed repository,
So that analysis agents can read files and execute commands in the codebase.

**Acceptance Criteria:**

**Given** a repository has been indexed (Epic 4)
**When** validation runs for a ticket affecting that repository
**Then** a Mastra workspace is created with:
- `LocalFilesystem` with `basePath` pointing to cloned repo directory
- `LocalSandbox` with `workingDirectory` set to repo root
- Tool configuration: Read operations enabled, write operations disabled (safety)
- Skills directory configured for analysis patterns

**And** workspace initialization:
- Creates workspace on first validation run
- Reuses existing workspace for subsequent validations
- Refreshes workspace when repository commits change (git pull)

**And** tool safety configuration:
```typescript
const workspace = new Workspace({
  filesystem: new LocalFilesystem({
    basePath: './cloned-repos/user-org-repo-name',
    readOnly: true, // Safety: agents can't modify code
  }),
  sandbox: new LocalSandbox({
    workingDirectory: './cloned-repos/user-org-repo-name',
  }),
  skills: ['/workspace/skills'], // Analysis skills
  tools: {
    [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: { enabled: false },
    [WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]: {
      requireApproval: false, // Auto-run safe commands
    },
  },
});
```

**And** workspace lifecycle:
- `init()` called before first analysis
- Workspace persists across multiple ticket validations
- Cleanup on repository deletion

**Prerequisites:** Story 4.2 (repo cloning exists)

**Technical Notes:**
- Path: `backend/src/validation/infrastructure/MastraWorkspaceFactory.ts`
- Store workspace instances in memory cache (per repository)
- Use repository `indexId` to map to workspace
- Integrate with existing `RepoIndexer` service

---

### Story 7.2: Quick Check Skills - Fast, Targeted Validation Patterns

As a validation engineer,
I want reusable skills with FAST, efficient commands,
So that agents can validate critical assumptions in seconds (not minutes).

**Acceptance Criteria:**

**Given** the Mastra workspace is configured
**When** this story is complete
**Then** the following skills exist in `/workspace/skills/`:

**Skill 1: Security Quick Check**
- File: `/workspace/skills/security-quick-check/SKILL.md`
- **FAST commands only** (1-3 seconds each):
  - `npm list helmet cors express-rate-limit` - Check security packages
  - `grep -r "process.env" --include="*.ts"` - Find hardcoded env vars
  - `grep -r "password\|secret\|api.?key" --include="*.ts"` - Find secrets
- **No deep analysis** - just verify presence/absence
- **Targeted only** - skip if ticket not security-related
- References: OWASP Top 10 checklist

**Skill 2: Architecture Quick Check**
- File: `/workspace/skills/architecture-quick-check/SKILL.md`
- **FAST commands only** (1-3 seconds each):
  - `find src -type d -name "domain"` - Verify layer structure
  - `grep -r "import.*infrastructure" src/domain/` - Check boundary violations
  - `find . -name "*.module.ts"` - Verify module structure
- **Pattern matching only** - no deep exploration
- **Targeted only** - skip if ticket not architecture-related
- References: Clean Architecture, DDD patterns

**Skill 3: Dependency Quick Check**
- File: `/workspace/skills/dependency-quick-check/SKILL.md`
- **FAST commands only** (1-3 seconds each):
  - `npm list <package-name>` - Verify specific package exists
  - `npm outdated --json` - Check outdated packages (if needed)
  - `grep -r "from '@/" package.json` - Check workspace imports
- **One package at a time** - validate what ticket needs only
- **Targeted only** - skip if dependencies not mentioned in AC
- Scripts: `scripts/check-deps.sh` (optional wrapper)

**Skill 4: Test Pattern Quick Check**
- File: `/workspace/skills/test-pattern-quick-check/SKILL.md`
- **FAST commands only** (1-3 seconds each):
  - `find . -name "*.spec.ts" -o -name "*.test.ts"` - Find test files
  - `grep -r "describe\|test\|it" src/**/*.spec.ts` - Verify test structure
  - `npm run test -- --listTests` - Verify test runner setup
- **Pattern verification only** - don't run tests
- **Targeted only** - skip if AC don't mention tests
- References: Jest/Vitest conventions

**And** each skill follows [agentskills.io spec](https://agentskills.io):
```markdown
---
name: security-quick-check
description: Fast security validation for ticket assumptions (seconds, not minutes)
version: 1.0.0
tags: [security, validation, quick-check]
performance: fast-only
---

# Security Quick Check

**CRITICAL: This is a FAST validator, not a comprehensive security audit.**

**Performance Constraints:**
- Maximum 3 commands per validation
- Each command must complete in 1-3 seconds
- Only check assumptions mentioned in ticket AC
- Skip if ticket has no security-related AC

**When to activate:**
- Ticket mentions: "security", "auth", "helmet", "cors", "secrets"
- AC include: security headers, authentication, authorization

**Quick checks to run:**

1. **Missing security packages** (if AC mentions them):
   ```bash
   npm list helmet cors express-rate-limit
   ```
   ✅ Package exists → skip, no finding
   ❌ Package missing → create finding with suggestion

2. **Hardcoded secrets** (if AC mentions auth/credentials):
   ```bash
   grep -r "process.env" --include="*.ts" src/
   ```
   ✅ Uses env vars → skip, no finding
   ❌ Hardcoded found → create finding

3. **Auth patterns** (if AC mentions authentication):
   ```bash
   grep -r "passport\|jwt\|auth" src/main.ts src/app.module.ts
   ```
   ✅ Auth setup found → skip, no finding
   ❌ No auth found → create finding

**STOP after 3 checks or first blocker found.**
```

**And** skills are discoverable:
- Agent receives list of available skills
- Agent activates relevant skills based on ticket content
- Skill instructions added to agent context

**Prerequisites:** Story 7.1 (workspace configured)

**Technical Notes:**
- Store skills in `backend/workspace/skills/` directory
- Create one skill directory per analysis type
- **CRITICAL:** All skills must be FAST (1-3 seconds per command)
- Skills should validate specific assumptions, not perform deep analysis
- Include command examples that complete quickly
- Skills auto-indexed if search enabled on workspace

**Performance Guidance:**
- ✅ GOOD: `npm list helmet`, `grep -r "pattern" src/`, `find . -name "*.spec.ts"`
- ❌ BAD: Reading 20 files, running test suites, complex analysis
- Rule of thumb: If a command takes >3 seconds, it's too slow for preflight

---

### Story 7.3: Quick Preflight Validator

As a validation system,
I want a fast preflight validator that checks critical assumptions,
So that blockers are found in seconds (not minutes) before developers see the ticket.

**Performance Requirements (CRITICAL):**
- ⏱️ **Execution time:** 10-30 seconds (hard limit: 30s)
- 💰 **Token usage:** 2k-5k tokens (hard limit: 5k)
- 🔧 **Tool calls:** 3-7 max
- 💵 **Cost:** $0.01-$0.05 per ticket

**Acceptance Criteria:**

**Given** an AEC exists and workspace is configured
**When** the preflight validator runs
**Then** the agent:
- Parses acceptance criteria to extract TOP 3 critical assumptions only
- For each assumption, runs ONE quick targeted check
- Uses fast commands only: `npm list`, `grep`, `find`, `tsc --noEmit`
- Returns findings ONLY for blockers (skip if everything looks fine)
- Completes within 30 seconds hard limit

**And** agent does NOT:
- ❌ Read more than 5 files
- ❌ Write any code or implementations
- ❌ Run full test suites
- ❌ Explore entire codebase
- ❌ Perform deep analysis

**And** agent generates findings:
```typescript
interface Finding {
  category: 'gap' | 'conflict' | 'missing-dependency' | 'architectural-mismatch';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string; // "helmet package not installed"
  codeLocation?: string; // File path
  suggestion: string; // "Install: pnpm add helmet"
  confidence: number; // 0-1
  evidence?: string; // "$ npm list helmet\n└── (empty)"
}
```

**And** example efficient checks:
- **Dependency check:** `npm list helmet` (2s, 0 tokens) → Missing ❌
- **File exists:** `find src -name main.ts` (1s, 0 tokens) → Found ✅
- **Pattern match:** `grep -n "app.use" src/main.ts` (1s, 0 tokens) → Found injection point ✅
- **Type check:** `npx tsc --noEmit src/main.ts` (3s, 0 tokens) → OK ✅

**And** example findings (blockers only):
- **Missing dependency:** "helmet package not installed (verified: npm list)"
- **File missing:** "Repo path 'src/domain/user/User.ts' does not exist"
- **Type error:** "Cannot import 'jsonwebtoken' - TypeScript compilation fails"

**And** agent output stored in AEC:
- `preImplementationFindings: Finding[]`
- Augments abstract validation scores from Epic 3
- Used by UI to show concrete blockers

**And** performance is tracked:
- Log execution time, token usage, tool calls
- Alert if exceeds constraints
- Metrics exported for monitoring

**Prerequisites:** Story 7.2 (efficient check skills)

**Technical Notes:**
- Agent: `backend/src/validation/agents/QuickPreflightValidator.ts` ✅ DONE
- Model: Claude Sonnet 4.5 (same as existing LLM)
- Max tokens: 5k hard limit
- Timeout: 30s with Promise.race
- Instructions emphasize: "BE FAST. CHECK BLOCKERS ONLY."
- Integrate into validation pipeline as optional enhancement
- Store findings in AEC via repository

---

### Story 7.4: Security-Focused Validator (Quick Check)

As a validation system,
I want a security-focused validator that checks security assumptions quickly,
So that security-related blockers are found in seconds.

**Performance Requirements (CRITICAL):**
- ⏱️ **Execution time:** 5-10 seconds max
- 💰 **Token usage:** 1k-2k tokens max
- 🔧 **Tool calls:** 2-4 max (security checks only)
- 💵 **Cost:** $0.005-$0.02 per ticket

**Acceptance Criteria:**

**Given** a ticket has security-related AC (mentions: security, auth, helmet, cors, secrets)
**When** the security validator runs
**Then** the agent:
- Activates `security-quick-check` skill
- Runs FAST targeted checks only (2-4 commands):
  - `npm list helmet cors express-rate-limit` - Check security packages
  - `grep -r "process.env" src/ --include="*.ts"` - Find env var usage
  - `grep -r "password\|secret\|key" src/ --include="*.ts"` - Find hardcoded secrets
- Returns findings ONLY if critical security assumptions fail
- Skips if everything looks fine

**And** example concrete findings (blockers only):
- **Missing package:** "AC requires helmet security headers but package not installed. Install: `pnpm add helmet`"
- **Hardcoded secret:** "API key hardcoded in auth/config.ts:12. Move to .env: `API_KEY=xxx`"
- **Missing CORS:** "AC requires CORS but not found in main.ts. Add: `app.use(cors())`"

**And** findings are actionable:
- Exact command to run (`pnpm add helmet`)
- File location (when relevant)
- What to add to AC if needed
- Evidence from command output

**And** integration:
- Only runs for security-related tickets (keyword detection)
- Uses same QuickPreflightValidator with security-focused prompt
- Findings added to `preImplementationFindings`
- Tagged with `category: 'security'`

**Prerequisites:** Story 7.3 (QuickPreflightValidator working)

**Technical Notes:**
- Option 1: Extend QuickPreflightValidator with security-specific instructions
- Option 2: Create SecurityFocusedValidator extending base validator
- Triggered by keywords: security, auth, permission, helmet, cors, secrets
- Uses security-quick-check skill
- Same performance constraints as Story 7.3

---

### Story 7.5: Architecture-Focused Validator (Quick Check)

As a validation system,
I want an architecture-focused validator that checks architectural assumptions quickly,
So that pattern violations are caught in seconds.

**Performance Requirements (CRITICAL):**
- ⏱️ **Execution time:** 5-10 seconds max
- 💰 **Token usage:** 1k-2k tokens max
- 🔧 **Tool calls:** 2-4 max (architecture checks only)
- 💵 **Cost:** $0.005-$0.02 per ticket

**Acceptance Criteria:**

**Given** a ticket specifies repo paths or mentions architectural patterns
**When** the architecture validator runs
**Then** the agent:
- Activates `architecture-quick-check` skill
- Runs FAST targeted checks only (2-4 commands):
  - `find src -type d -name "domain"` - Verify layer structure
  - `grep -r "import.*infrastructure" src/domain/` - Check boundary violations
  - `find . -name "*.module.ts"` - Verify NestJS module structure
- Returns findings ONLY if architectural assumptions fail
- Skips if everything looks fine

**And** example concrete findings (blockers only):
- **Wrong layer:** "AC places logic in controller but no use case found. Add use case: src/tickets/application/CreateTicketUseCase.ts"
- **Missing entity:** "AC assumes User entity but not found in domain/. Create: src/users/domain/User.ts"
- **Pattern violation:** "AC has controller calling repository directly. Violates clean architecture - use use case instead"
- **File not found:** "Repo path 'src/tickets/domain/Ticket.ts' specified but doesn't exist"

**And** findings are actionable:
- What file is missing or wrong
- Where it should be (correct layer/path)
- What pattern to follow
- Example from existing code (if available)

**And** integration:
- Runs for tickets with repo paths or architecture keywords
- Uses same QuickPreflightValidator with architecture-focused prompt
- Findings added to `preImplementationFindings`
- Tagged with `category: 'architecture'`

**Prerequisites:** Story 7.3 (QuickPreflightValidator working)

**Technical Notes:**
- Option 1: Extend QuickPreflightValidator with architecture-specific instructions
- Option 2: Create ArchitectureFocusedValidator extending base validator
- Triggered by: repo paths specified OR keywords (layer, module, clean architecture, DDD)
- Uses architecture-quick-check skill
- Can read Architecture.md if exists (Epic 6 integration)
- Same performance constraints as Story 7.3

---

### Story 7.6: Concrete Findings UI - Replace Abstract Scores

As a Product Manager,
I want to see concrete, actionable findings instead of abstract validation scores,
So that I know exactly what to fix in the ticket.

**Acceptance Criteria:**

**Given** pre-implementation analysis has run
**When** viewing ticket detail page
**Then** the Validation section shows:
- List of findings grouped by category (Security, Architecture, Gaps, Dependencies)
- Each finding displays:
  - Severity badge (Critical/High/Medium/Low)
  - Description (concrete problem)
  - Code location (if applicable, clickable link to GitHub)
  - Suggestion (what to add to ticket)
  - "Add to Ticket" button

**And** finding card example:
```
🔴 CRITICAL | Security Gap
Missing security headers middleware

The ticket requires "improve API security" but the helmet package
is not installed in the Express application.

📍 Code location: backend/src/main.ts
💡 Suggestion: Add acceptance criteria:
   "GIVEN the API is running
    WHEN a response is sent
    THEN security headers (X-Frame-Options, CSP) are included"

   Install: npm install helmet
   Add: app.use(helmet())

[Add to Acceptance Criteria] [Dismiss]
```

**And** "Add to Acceptance Criteria" button:
- Injects suggested AC into AEC
- Marks finding as "addressed"
- Re-runs validation (score should improve)

**And** abstract validation scores:
- Still calculated for compatibility
- Displayed as secondary info (collapsed by default)
- Concrete findings are primary UI

**And** filtering/sorting:
- Filter by category, severity
- Sort by severity, confidence
- Show/hide addressed findings

**Prerequisites:** Stories 7.3-7.5 (findings generated)

**Technical Notes:**
- Component: `client/src/tickets/components/ConcreteFindings.tsx`
- Use shadcn Card, Badge, Accordion
- Link to GitHub: `https://github.com/{owner}/{repo}/blob/{sha}/{path}`
- Store dismissed findings in AEC metadata

---

### Story 7.7: Developer Appendix Enhancement with Analysis Findings

As a developer,
I want exported tickets to include pre-implementation analysis findings,
So that I have concrete guidance when implementing.

**Acceptance Criteria:**

**Given** a ticket is exported to Jira/Linear
**When** the export use case runs
**Then** the Dev Appendix includes new section:

```markdown
## Pre-Implementation Analysis

### Security Findings
🔴 **Missing helmet package**
- Location: backend/src/main.ts
- Action: Install helmet (`npm install helmet`) and configure
- Code: `app.use(helmet())`

### Architecture Findings
🟡 **Business logic in wrong layer**
- Location: Acceptance criteria suggest logic in controller
- Action: Move logic to use case (CreateTicketUseCase)
- Pattern: Follow Clean Architecture boundaries

### Dependency Findings
🟢 **All required packages present**
- express, @nestjs/core, firebase-admin detected

### Code Locations
- Auth module: `backend/src/auth/`
- Ticket domain: `backend/src/tickets/domain/`
- Controllers: `backend/src/tickets/presentation/controllers/`
```

**And** format is LLM-friendly:
- Claude Code and Cursor can parse markdown sections
- Code snippets in proper syntax highlighting
- Links to GitHub are absolute URLs
- Findings ordered by severity

**And** export includes:
- All findings (not just critical)
- Evidence/command outputs (grep results, npm list output)
- Suggested commands to run locally

**And** when ticket has no findings:
- Show "✅ Pre-implementation analysis: No issues found"
- Still include code locations and patterns

**Prerequisites:** Story 7.6 (findings UI working), Story 5.1 or 5.2 (export exists)

**Technical Notes:**
- Update `ExportTemplateBuilder.ts` to include findings
- Format findings as markdown with emoji indicators
- Append to existing Dev Appendix section
- Include in both Jira and Linear exports

---

### Story 7.8: Replace Vercel AI SDK with Mastra Agents

As a platform architect,
I want to consolidate on Mastra agents as the single LLM interface,
So that we have consistent patterns, reduce dependencies, and leverage Mastra capabilities.

**Acceptance Criteria:**

**Given** the current codebase uses both Vercel AI SDK (`ai` package) and Mastra agents
**When** this story is complete
**Then** all LLM calls use Mastra Agent API consistently

**And** MastraContentGenerator class:
- Replaces `generateText()` from `ai` package with Mastra `Agent.generate()`
- Maintains same interface (ILLMContentGenerator)
- All 4 methods work identically: `extractIntent`, `detectType`, `generateDraft`, `generateQuestions`

**And** dependencies cleaned up:
- Remove: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai` packages
- Keep: `@mastra/core` (our single LLM interface)

**And** LLMConfigService refactored:
- Remove `getModel()` method (returns ai-sdk model)
- Add `getModelName()` method (returns string like "anthropic/claude-sonnet-4")

**And** no behavioral changes:
- Ticket generation works identically
- Same models used
- Same JSON parsing
- Same error handling

**Prerequisites:** Story 7.1 (Mastra workspace configuration)

**Technical Notes:**
- Update `MastraContentGenerator.ts` to use Mastra Agent
- Update `LLMConfigService.ts` to return model name strings
- Simplify provider files (anthropic.provider.ts, ollama.provider.ts)
- Remove ai-sdk dependencies from package.json
- All existing tests must pass

**Rationale:** Consolidate LLM interface to Mastra agents, consistent with validation agents (Story 7.1, 7.3). Reduces dependencies from 4 packages to 1.

---

## Epic 7 Summary

**Stories:** 8 total
**Effort:** Large (similar to Epic 2 or 4)
**Dependencies:** Epic 4 (repo indexing/cloning)

**Technology Stack:**
- Mastra v1 Workspace (LocalFilesystem, LocalSandbox)
- Agent Skills (agentskills.io spec)
- Analysis agents (GPT-4o or Claude Sonnet)
- Shell commands via sandbox (npm, grep, find, git)

**Key Outcomes:**
- Validation transforms from abstract scores to concrete findings
- PMs get actionable feedback: "Install helmet package" not "Risk score: 65"
- Developers receive tickets at least as good as using Claude Code/Cursor directly
- Reduces false alarms and wasted implementation time
- Analysis runs in Mastra sandbox using actual cloned codebase

**Innovation:**
This epic represents a paradigm shift in ticket validation - from static scoring to dynamic code analysis. By simulating implementation in a real environment, we catch issues that abstract validators miss.

---
