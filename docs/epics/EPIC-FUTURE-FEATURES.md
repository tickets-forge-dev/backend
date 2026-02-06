# Future Features: 5 High-Level Epics

These are high-level epic definitions for planned features. Each will be detailed and implemented separately.

---

## Epic 1: Enhanced Ticket Context (Images + Text)

**Summary:** Allow users to provide richer context on Stage 1 of the wizard (title + repo) — freeform text and paste/upload images. Images stored in Firebase Storage. Extra context flows to LLM analysis for multimodal spec generation.

**Infrastructure ready:** Firebase Storage already configured on both backend (`getStorage()`) and frontend (`storage` export). Stage 1 has a hidden `description` field that can be repurposed.

### Stories

| # | Story | Layer |
|---|-------|-------|
| 1.1 | Add "Additional Context" section to Stage1Input — textarea + drag-and-drop/paste image zone (max 5 images, 5MB each, JPEG/PNG/WebP) | Frontend |
| 1.2 | Create `StorageService` wrapping Firebase Storage SDK — `uploadImage(workspaceId, aecId, file)` → download URL | Frontend |
| 1.3 | Wire uploads into wizard flow — upload after AEC creation, store URLs via PATCH | Frontend + Store |
| 1.4 | Extend `AEC` domain with `contextImageUrls: string[]`, update DTO + mapper | Backend (domain + infra) |
| 1.5 | Pass multimodal context to `DeepAnalysisService` and `TechSpecGenerator` — Anthropic image content parts | Backend (application) |

### Key Files
- `client/src/tickets/components/wizard/Stage1Input.tsx` — add context UI
- `client/src/services/storage.service.ts` — **new** Firebase Storage service
- `client/src/tickets/stores/generation-wizard.store.ts` — wire upload flow
- `backend/src/tickets/domain/aec/AEC.ts` — add `contextImageUrls` field
- `backend/src/tickets/application/services/DeepAnalysisServiceImpl.ts` — multimodal LLM input
- `backend/src/tickets/application/services/TechSpecGeneratorImpl.ts` — include context in prompts

### Open Questions
- Image compression on frontend before upload (reduce LLM token cost)?
- Ollama fallback for local dev (no vision) — graceful text-only degradation
- Firebase Storage security rules already scope to `workspaces/{workspaceId}/**` — should work

### Dependencies
None (standalone). Epic 3 consumes the uploaded images.

---

## Epic 2: Code Guardrails Detection

**Summary:** Auto-detect project guardrails (CLAUDE.md, .cursorrules, ESLint strict rules, tsconfig strict mode, CI constraints, test configs) during Stage 2 analysis. Store on AEC and inject into all downstream LLM prompts so specs respect project rules.

### Stories

| # | Story | Layer |
|---|-------|-------|
| 2.1 | Define `Guardrails` value object — `{ rules: GuardrailRule[], detectedAt }` with source, category, severity | Backend (domain) |
| 2.2 | Detect guardrails during deep analysis — expand config file reading, add LLM extraction phase | Backend (application) |
| 2.3 | Inject guardrails into TechSpec generation prompts — "GUARDRAILS" section in system prompt | Backend (application) |
| 2.4 | Display guardrails on Stage 2 context review — collapsible section with edit modal | Frontend |
| 2.5 | Show guardrails on ticket detail page — traceability of what rules the spec was generated against | Frontend |

### Key Files
- `backend/src/tickets/domain/value-objects/Guardrails.ts` — **new** value object
- `backend/src/tickets/domain/aec/AEC.ts` — add `guardrails` field
- `backend/src/tickets/application/services/DeepAnalysisServiceImpl.ts` — guardrails extraction phase
- `backend/src/tickets/application/services/TechSpecGeneratorImpl.ts` — inject into prompts
- `client/src/tickets/components/wizard/Stage2Context.tsx` — guardrails section
- `client/app/(main)/tickets/[id]/page.tsx` — guardrails display

### Open Questions
- Token budget: large config files need truncation/summarization
- Monorepo: detect at root only or per-package?
- Show as "suggested" with user confirmation on Stage 2?

### Dependencies
None (standalone).

---

## Epic 3: Tech Spec Document + Artifacts Section

**Summary:** Generate a formatted Markdown document from the TechSpec JSON after finalization. Save to Firebase Storage under `workspaces/{workspaceId}/tickets/{aecId}/docs/`. Show an "Artifacts" section on ticket detail with docs + photos (from Epic 1).

**Current state:** TechSpec stored as JSON inline on AEC. No artifact storage pattern exists yet.

### Stories

| # | Story | Layer |
|---|-------|-------|
| 3.1 | Create `TechSpecMarkdownGenerator` — pure function transforming TechSpec JSON → formatted Markdown | Backend (application) |
| 3.2 | Create `ArtifactStorageService` wrapping Firebase Storage — save/list/get artifacts per ticket | Backend (infrastructure) |
| 3.3 | Wire into `FinalizeSpecUseCase` — generate markdown, upload to storage, store artifact references on AEC | Backend (application) |
| 3.4 | Add "Artifacts" section to ticket detail page — list docs + images with download/preview buttons | Frontend |
| 3.5 | Include artifacts in ticket API response (extend `GET /tickets/:id`) | Backend (presentation) |

### Key Files
- `backend/src/tickets/application/services/TechSpecMarkdownGenerator.ts` — **new**
- `backend/src/tickets/application/ports/ArtifactStoragePort.ts` — **new** port
- `backend/src/tickets/infrastructure/services/ArtifactStorageService.ts` — **new** impl
- `backend/src/tickets/application/use-cases/FinalizeSpecUseCase.ts` — wire doc generation
- `backend/src/tickets/domain/aec/AEC.ts` — add `artifacts` array field
- `client/app/(main)/tickets/[id]/page.tsx` — artifacts section

### Open Questions
- Storage path: `workspaces/{wid}/tickets/{aid}/docs/` (aligns with existing rules)
- Artifact versioning on re-finalize: overwrite (v1) or version?

### Dependencies
Epic 1 (optional — for showing uploaded images), Epic 4 (optional — for preview button).

---

## Epic 4: Markdown Preview Page

**Summary:** Install a markdown rendering library and create a reusable `MarkdownRenderer` component + dedicated preview route. Supports GFM, code syntax highlighting, tables, images. Used by Artifacts section and anywhere else in the app.

**Current state:** No markdown rendering library installed.

### Stories

| # | Story | Layer |
|---|-------|-------|
| 4.1 | Install `react-markdown` + `remark-gfm` + `rehype-highlight` | Frontend (deps) |
| 4.2 | Create `MarkdownRenderer` component — atom-level, Tailwind prose classes, design system tokens | Frontend (core) |
| 4.3 | Create `/preview` route — accepts `?url=` query param, fetches .md, renders with loading/error states | Frontend (page) |
| 4.4 | Create `MarkdownPreviewDrawer` — inline preview using shadcn Sheet, for use from Artifacts section | Frontend (core) |
| 4.5 | Syntax highlighting theme — match Forge design system (github-dark/light, dynamic imports for languages) | Frontend (styling) |

### Key Files
- `client/src/core/components/MarkdownRenderer.tsx` — **new** reusable component
- `client/src/core/components/MarkdownPreviewDrawer.tsx` — **new** drawer wrapper
- `client/app/(main)/preview/page.tsx` — **new** preview route
- `client/app/globals.css` — add prose/markdown styling
- `client/package.json` — add dependencies

### Open Questions
- Package choice: `react-markdown` (recommended) vs `@mdx-js/react` (overkill) vs `marked` (less React-native)
- highlight.js bundle size: use dynamic imports, register only common languages (TS, JS, JSON, YAML, CSS, HTML, Bash, Python)
- Security: `react-markdown` is safe by default (no raw HTML). Only add `rehype-raw` for trusted content.

### Dependencies
None (standalone). Consumed by Epic 3.

---

## Epic 5: Jira & Linear Integration

**Summary:** Push finalized tickets to Jira and Linear with **full artifact bundle** — the AEC contract (.xml), generated docs (.md), and context images. The exported issue becomes a self-contained development package that an agent or developer can pick up and execute. Involves OAuth setup for both platforms, API clients, field mapping, artifact attachment, settings UI, and an export use case. The foundation already exists: `ExternalIssue` type, `AEC.export()` domain method, disabled Export button.

**Current state:** `ExternalIssue { platform: 'jira' | 'linear', issueId, issueUrl }` exists. `AEC.export()` transitions READY → CREATED. GitHub OAuth pattern in settings to follow.

### Export Artifact Bundle

When exporting a ticket, **all associated artifacts** must be attached to the Jira/Linear issue:

| Artifact | Format | Description |
|----------|--------|-------------|
| **AEC Contract** | `.xml` | The executable contract for the development agent — structured specification with acceptance criteria, implementation plan, and constraints. This is the primary deliverable. |
| **Tech Spec Document** | `.md` | Generated Markdown documentation from the TechSpec JSON (from Epic 3) |
| **Context Images** | `.jpg/.png/.webp` | User-uploaded images from Stage 1 context (from Epic 1) — screenshots, mockups, diagrams |

**Attachment strategy:**
- Jira: use `/rest/api/3/issue/{id}/attachments` multipart upload endpoint
- Linear: use `attachmentCreate` GraphQL mutation with upload URLs
- AEC XML is the **primary attachment** — always exported, even without docs/images
- Docs and images are optional (only if they exist on the ticket)

### Stories

| # | Story | Layer |
|---|-------|-------|
| 5.1 | **Linear OAuth** — backend module (`/linear/`), OAuth controller, token service, settings UI component (follow GitHub pattern) | Full-stack |
| 5.2 | **Jira OAuth** — backend module (`/jira/`), OAuth 2.0 with Atlassian, accessible-resources API for cloud ID | Full-stack |
| 5.3 | **Linear API Client + Field Mapper** — GraphQL API wrapper, TechSpec → Linear issue fields | Backend |
| 5.4 | **Jira API Client + Field Mapper** — REST API v3 wrapper, standard fields only (v1) | Backend |
| 5.5 | **AEC XML Serializer** — serialize AEC domain object to `.xml` format for export (contract format TBD) | Backend (application) |
| 5.6 | **Artifact Bundle Assembler** — collect AEC XML + docs (.md) + images, prepare for platform upload | Backend (application) |
| 5.7 | **Platform Attachment Upload** — Jira: multipart `/attachments` endpoint; Linear: `attachmentCreate` mutation with upload URLs | Backend |
| 5.8 | **Export Use Case + UI** — `ExportTicketUseCase`, `POST /tickets/:id/export`, enable Export button as dropdown (Linear / Jira) with project/team selection dialog. Attaches full artifact bundle to created issue. | Full-stack |

### Key Files
- `backend/src/linear/` — **new** entire module (OAuth, API client, mapper)
- `backend/src/jira/` — **new** entire module (OAuth, API client, mapper)
- `backend/src/tickets/application/use-cases/ExportTicketUseCase.ts` — **new**
- `backend/src/tickets/application/services/AecXmlSerializer.ts` — **new** AEC → XML serializer
- `backend/src/tickets/application/services/ArtifactBundleAssembler.ts` — **new** collects all artifacts for export
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — add export endpoint
- `client/src/settings/components/LinearIntegration.tsx` — **new** (follow `GitHubIntegration.tsx`)
- `client/src/settings/components/JiraIntegration.tsx` — **new**
- `client/app/(main)/settings/page.tsx` — add integration sections
- `client/app/(main)/tickets/[id]/page.tsx` — enable Export button with platform selection

### Open Questions
- `AEC.export()` currently requires READY status — relax to allow DRAFT/COMPLETE for usability?
- OAuth token refresh (Jira uses refresh tokens; Linear tokens are long-lived)
- Jira custom fields: v1 maps standard fields only, custom field mapping is v2
- Bidirectional sync (external issue → Forge): separate epic, not in scope
- **Recommend Linear first** (simpler API), then Jira
- AEC XML schema/format — to be defined separately (the contract format for development agents)
- Jira attachment size limits (default 10MB per file) — may need to compress images
- Linear attachment storage — uses S3 presigned URLs, different upload flow than Jira

### Dependencies
- Epic 3 (recommended — reuse `TechSpecMarkdownGenerator` for issue description + docs artifact)
- Epic 1 (optional — context images to attach)

---

## Recommended Implementation Order

```
Epic 4 (Markdown Preview)     ← smallest, zero deps, reusable foundation
  ↓
Epic 2 (Code Guardrails)      ← standalone, enhances analysis pipeline
  ↓
Epic 1 (Enhanced Context)     ← standalone, adds multimodal support
  ↓
Epic 3 (Tech Spec Doc + Artifacts) ← uses Epic 1 images + Epic 4 preview
  ↓
Epic 5 (Jira & Linear)        ← uses Epic 3 markdown generator, largest scope
```

## Cross-Feature Dependency Matrix

| Epic | Hard Deps | Soft Deps (enhanced by) |
|------|-----------|------------------------|
| 1: Enhanced Context | None | 3 (artifacts show uploads) |
| 2: Code Guardrails | None | None |
| 3: Tech Spec + Artifacts | None | 1 (images), 4 (preview) |
| 4: Markdown Preview | None | 3 (preview button target) |
| 5: Jira & Linear | None | 1 (context images), 3 (markdown generator + docs) |
