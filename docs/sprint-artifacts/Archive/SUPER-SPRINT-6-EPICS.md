# 🔥 SUPER-SPRINT: 6-EPIC IMPLEMENTATION ROADMAP

**Duration:** 32 days | **Capacity:** 1-3 epics/day | **Target:** Production-Ready v1
**Start Date:** 2026-02-07 | **Target Launch:** 2026-03-11

---

## 📋 TABLE OF CONTENTS
1. [Sprint Overview](#sprint-overview)
2. [Epic-by-Epic Breakdown](#epic-by-epic-breakdown)
3. [Technical Specifications](#technical-specifications)
4. [Dependencies & Blockers](#dependencies--blockers)
5. [Daily Checklist Template](#daily-checklist-template)
6. [Success Metrics](#success-metrics)
7. [Git Workflow](#git-workflow)

---

# 🚀 SPRINT OVERVIEW

## Sprint Goals
- ✅ Complete 6 critical epics
- ✅ Ship exportable specs (`.md` + `.xml`)
- ✅ Enable Linear/Jira integration
- ✅ Production-ready by Day 32

## Team Capacity
- **Days 1-32:** Full focus on these 6 epics only
- **Daily pace:** 1-3 epics per day (stories/features)
- **No context switching**

## Definition of "Done"
- Code written + tested
- TypeScript errors = 0
- Build passes
- Git committed (with co-author tag)
- Story documented in sprint-artifacts

---

# 📊 EPIC BREAKDOWN

## EPIC 1: Interactive API Editor with Smart Detection ✅ COMPLETE

**Days:** 1-5 | **Effort:** 5-7 days | **Priority:** 🔴 CRITICAL | **Completed:** 2026-02-07 (Session 6)

### Stories
```yaml
1-3b-01: Backend - API Detection Service
1-3b-02: Backend - Controller Scanner
1-3b-03: Backend - DeepAnalysisService Enhancement
1-3b-04: Frontend - API Review Section
1-3b-05: Frontend - API Card Component
1-3b-06: Frontend - cURL Generator
1-3b-07: Integration - End-to-end testing
```

### Technical Details

#### Files to Create

**Backend:**
```
backend/src/tickets/application/services/
  ├── ApiDetectionService.ts          (NEW)
  └── ControllerScanner.ts            (NEW)

backend/src/tickets/utils/
  └── curl-generator.ts               (NEW)
```

**Frontend:**
```
client/src/tickets/components/
  ├── ApiReviewSection.tsx            (NEW)
  ├── ApiCard.tsx                     (NEW)
  └── index.ts                        (UPDATE - export ApiReviewSection)

client/src/tickets/utils/
  └── curl-generator.ts               (NEW)
```

#### Files to Modify

**Backend:**
```
backend/src/tickets/application/services/DeepAnalysisServiceImpl.ts
  - Add API detection to Phase 3 LLM prompt
  - Inject detected APIs into response

backend/src/tickets/presentation/controllers/tickets.controller.ts
  - Add GET /tickets/:id/detect-apis endpoint
  - Add POST /tickets/:id/confirm-apis endpoint

backend/src/tickets/domain/aec/AEC.ts
  - Ensure apiEndpoints field exists
  - Add confirmApis() method

backend/src/tickets/presentation/dto/
  - Ensure UpdateAECDto has apiEndpoints field
```

**Frontend:**
```
client/app/(main)/tickets/[id]/page.tsx
  - Import ApiReviewSection
  - Add to page: <ApiReviewSection ticket={ticket} />

client/src/tickets/stores/tickets.store.ts
  - Add action: confirmApis(aecId, apis)
  - Update ticket state on confirmation

client/src/tickets/services/ticket.service.ts
  - Add: detectApis(aecId)
  - Add: confirmApis(aecId, apis)
```

#### Database Schema Changes
```typescript
// AEC domain (already has this, verify it exists)
apiEndpoints: {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  request: { shape: string; example?: object };
  response: { shape: string; example?: object };
  description: string;
  status: 'detected' | 'confirmed' | 'rejected';
  sourceFile?: string;
  confidence?: 'high' | 'medium' | 'low';
  curlCommand: string;
  createdAt: Date;
  confirmedAt?: Date;
}[]
```

#### API Endpoints
```
GET /tickets/:id/detect-apis
  Response: {
    apis: DetectedApi[]
  }

POST /tickets/:id/confirm-apis
  Body: { apiIds: string[] }
  Response: { confirmed: number }
```

#### LLM Prompt Changes

Add to DeepAnalysisService Phase 3:
```
Analyze the ticket specification and identify:

1. NEW API endpoints that must be created
   - HTTP method (GET, POST, PUT, PATCH, DELETE)
   - URL path (e.g., /api/tickets/123/approve)
   - Request payload shape (JSON schema style)
   - Response shape (JSON schema style)
   - Description of what it does

2. EXISTING API endpoints that will be modified
   - Which ones change and how
   - What fields are added/removed
   - Breaking changes?

3. API endpoints that should be DELETED
   - If this feature removes old functionality

For each API endpoint, provide:
- Confidence level (high/medium/low)
- Example request/response JSON
- Any error codes or edge cases

Format output as JSON:
{
  "apis": [
    {
      "method": "POST",
      "path": "/api/feature",
      "status": "new|modified|delete",
      "request": { "example": {...} },
      "response": { "example": {...} },
      "description": "...",
      "confidence": "high|medium|low"
    }
  ]
}
```

#### Component Props

```typescript
// ApiReviewSection.tsx
interface ApiReviewSectionProps {
  ticket: Ticket;
  onConfirm?: (apis: ApiEndpoint[]) => void;
}

// ApiCard.tsx
interface ApiCardProps {
  api: DetectedApi;
  onAccept: () => void;
  onEdit: () => void;
  onReject: () => void;
}

// DetectedApi type
interface DetectedApi {
  id: string;
  status: 'existing' | 'new' | 'modified' | 'delete';
  method: HttpMethod;
  path: string;
  request: { shape: string; example?: object };
  response: { shape: string; example?: object };
  description: string;
  sourceFile?: string;
  curlCommand: string;
  confidence: 'high' | 'medium' | 'low';
}
```

#### Success Criteria
- ✅ Detects NEW/MODIFIED/DELETE APIs with 80%+ accuracy
- ✅ Controller scanner finds all @Get/@Post endpoints
- ✅ No false positives
- ✅ User can Accept/Edit/Reject each API
- ✅ cURL copy works (paste into Terminal)
- ✅ APIs persist on ticket
- ✅ Confirmed APIs appear in exports (later epics)
- ✅ Build passes, 0 TS errors

---

## EPIC 2: Rich Input with Markdown + PDF 🟡 PARTIAL

**Days:** 5-11 | **Effort:** 6 days | **Priority:** 🔴 HIGH | **Status:** Markdown rendering done, PDF extraction not started

### Stories
```yaml
1-6b-01: Frontend - MarkdownEditor Component
1-6b-02: Frontend - FileUploadZone Component
1-6b-03: Backend - PdfExtractorService
1-6b-04: Backend - PDF Extraction Endpoint
1-6b-05: Frontend - Wire uploads to wizard
1-6b-06: Integration - End-to-end testing
```

### Technical Details

#### Files to Create

**Frontend:**
```
client/src/core/components/editors/
  ├── MarkdownEditor.tsx             (NEW)
  └── FileUploadZone.tsx             (NEW)

client/src/core/components/ui/
  └── index.ts                       (UPDATE - export editors)

client/src/core/utils/
  └── file-helpers.ts                (NEW)
```

**Backend:**
```
backend/src/tickets/application/services/
  └── PdfExtractorService.ts         (NEW)

backend/src/tickets/presentation/dto/
  └── ExtractPdfDto.ts               (NEW)
```

#### Dependencies

**NPM Packages:**
```json
{
  "dependencies": {
    "react-markdown": "^8.0.0",
    "remark": "^14.0.0",
    "remark-gfm": "^3.0.0",
    "highlight.js": "^11.7.0"
  },
  "devDependencies": {
    "@types/highlight.js": "^10.4.0"
  }
}
```

**Backend:**
```
pdf-parse (or pdfjs-dist)
```

#### Component Props

```typescript
// MarkdownEditor.tsx
interface MarkdownEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  maxHeight?: string;
  readOnly?: boolean;
}

// FileUploadZone.tsx
interface FileUploadZoneProps {
  onFileSelected: (content: string, filename: string) => void;
  onError: (error: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // bytes
}
```

#### API Endpoint

```typescript
// POST /tickets/extract-pdf
// Content-Type: multipart/form-data
// Body: { file: File }
// Response:
{
  success: boolean;
  extractedText: string;
  filename: string;
  pageCount: number;
}
```

#### Markdown Editor Features

```typescript
// Keyboard shortcuts
Ctrl+B    → **bold**
Ctrl+I    → *italic*
Ctrl+⇧K   → [link](url)
Ctrl+⇧C   → ```code```
Ctrl+⇧ +  → # Heading

// Preview pane shows:
- Rendered markdown (HTML)
- Code syntax highlighting
- Tables
- Lists (ordered + unordered)
- Blockquotes
- Inline code
```

#### Success Criteria
- ✅ Markdown editor renders with syntax highlighting
- ✅ Live preview pane shows formatted markdown
- ✅ File upload works (drag-drop + file picker)
- ✅ Supports `.md`, `.txt`, `.pdf` files
- ✅ PDF extraction in <10 seconds
- ✅ Extracted text is editable
- ✅ Mobile friendly (tabs for editor/preview)
- ✅ Keyboard shortcuts work (Ctrl+B, etc.)
- ✅ Build passes, 0 TS errors

---

## EPIC 3: Tech Spec Document + AEC XML Contract ✅ COMPLETE

**Days:** 11-21 | **Effort:** 10 days | **Priority:** 🔴 CRITICAL | **Completed:** 2026-02-09 (Session 10)

### Stories
```yaml
1-epic3-01: Backend - TechSpecMarkdownGenerator (5 files)
1-epic3-02: Backend - AecXmlSerializer
1-epic3-03: Backend - ArtifactStorageService
1-epic3-04: Backend - FinalizeSpecUseCase Enhancement
1-epic3-05: Backend - Artifacts API Endpoint
1-epic3-06: Frontend - AssetsSection Component
1-epic3-07: Frontend - DocumentCard Component
1-epic3-08: Frontend - XmlPreviewModal Component
1-epic3-09: Frontend - Download/Preview Integration
1-epic3-10: Integration - End-to-end testing
```

### Technical Details

#### Files to Create

**Backend:**
```
backend/src/tickets/application/services/
  ├── TechSpecMarkdownGenerator.ts   (NEW)
  ├── AecXmlSerializer.ts            (NEW)
  └── ArtifactStorageService.ts      (NEW - or rename existing)

backend/src/tickets/domain/
  └── artifacts/Artifact.ts          (NEW - value object)
```

**Frontend:**
```
client/src/tickets/components/
  ├── AssetsSection.tsx              (NEW)
  ├── DocumentCard.tsx               (NEW)
  ├── XmlPreviewModal.tsx            (NEW)
  └── DesignAssetsGallery.tsx        (NEW)

client/src/tickets/utils/
  └── artifact-helpers.ts            (NEW)
```

#### Database Schema

```typescript
// AEC.artifacts
interface Artifacts {
  // Developer markdown files
  problemStatementUrl: string;       // workspaces/.../problem-statement.md
  techSpecUrl: string;               // workspaces/.../tech-spec.md
  apiEndpointsUrl: string;           // workspaces/.../api-endpoints.md
  testPlanUrl: string;               // workspaces/.../test-plan.md

  // Agent contract
  aecXmlUrl: string;                 // workspaces/.../aec.xml
  aecXmlContent?: string;            // For copy-to-clipboard

  // Metadata
  generatedAt: Date;
  specVersion: string;               // "1.0", "1.1", etc.
}
```

#### Assets Section UI

```
┌─────────────────────────────────────────────────────┐
│ 📎 ASSETS                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 👨‍💻 FOR THE DEVELOPER                              │
│ ────────────────────────────────────────────────── │
│                                                     │
│ 📄 Problem Statement                               │
│    └─ problem-statement.md (2 KB)                 │
│       [📥 Download] [👁 Preview]                  │
│                                                     │
│ 📋 Tech Specification                              │
│    └─ tech-spec.md (12 KB)                        │
│       [📥 Download] [👁 Preview]                  │
│                                                     │
│ 🔌 API Endpoints                                   │
│    └─ api-endpoints.md (4 KB)                     │
│       [📥 Download] [👁 Preview]                  │
│                                                     │
│ ✅ Test Plan                                       │
│    └─ test-plan.md (6 KB)                         │
│       [📥 Download] [👁 Preview]                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🤖 FOR THE AGENT                                   │
│ ────────────────────────────────────────────────── │
│                                                     │
│ 📜 AEC Contract (Machine-Readable)                │
│    └─ aec.xml (18 KB)                            │
│                                                     │
│    [📥 Download]  [📋 Copy to Clipboard]         │
│                                                     │
│    💡 How to use:                                  │
│    1. Copy the XML to your clipboard              │
│    2. Paste into your AI agent prompt             │
│    3. Agent parses and executes per spec          │
│                                                     │
│    ⚙️  Content:                                    │
│    ├─ Implementation steps (ordered)              │
│    ├─ Files to create/modify                      │
│    ├─ API endpoint definitions                    │
│    ├─ Test plan with step-by-step tests          │
│    ├─ Constraints & guardrails                    │
│    └─ Acceptance criteria (machine-parseable)    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### AEC XML Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ticket>
  <metadata>
    <id>AEC-123</id>
    <title>Feature X</title>
    <createdAt>2026-02-07T15:32:00Z</createdAt>
    <priority>high</priority>
    <estimatedHours>8</estimatedHours>
    <specVersion>1.0</specVersion>
  </metadata>

  <specification>
    <problemStatement>...</problemStatement>
    <whyItMatters>...</whyItMatters>
  </specification>

  <implementation>
    <steps>
      <step order="1">Step 1 description</step>
      <step order="2">Step 2 description</step>
    </steps>

    <files>
      <file>
        <action>create|modify</action>
        <path>backend/src/api.ts</path>
        <layer>presentation</layer>
        <reason>Create API endpoint</reason>
      </file>
    </files>

    <apis>
      <endpoint>
        <method>POST</method>
        <path>/api/feature</path>
        <request>{"example":{}}</request>
        <response>{"example":{}}</response>
      </endpoint>
    </apis>

    <testPlan>
      <testSuite type="unit">
        <test name="...">...</test>
      </testSuite>
    </testPlan>
  </implementation>

  <constraints>
    <constraint>Use TypeScript strict mode</constraint>
    <constraint>Follow clean architecture</constraint>
  </constraints>

  <acceptanceCriteria>
    <criterion id="ac-1">...</criterion>
  </acceptanceCriteria>
</ticket>
```

#### Firebase Storage Structure

```
workspaces/{workspaceId}/tickets/{aecId}/
  ├── docs/
  │   ├── problem-statement.md
  │   ├── tech-spec.md
  │   ├── api-endpoints.md
  │   └── test-plan.md
  └── aec.xml
```

#### API Endpoints

```typescript
// GET /tickets/:id/artifacts
{
  developer: {
    problemStatement: { filename, size, url, downloadUrl },
    techSpec: { ... },
    apiEndpoints: { ... },
    testPlan: { ... }
  },
  agent: {
    aecContract: { filename, size, url, downloadUrl, content }
  },
  generatedAt: "2026-02-07T15:32:00Z",
  specVersion: "1.0"
}

// GET /tickets/:id/download/:file
// Returns file binary data
```

#### Success Criteria
- ✅ Generates 4 separate markdown files + 1 XML file
- ✅ All files valid (markdown + XML parseable)
- ✅ File sizes and timestamps displayed
- ✅ Assets section shows clear Developer/Agent subsections
- ✅ Download buttons work
- ✅ Copy-to-clipboard button copies XML
- ✅ Preview shows formatted markdown
- ✅ XML includes all required fields for agents
- ✅ Build passes, 0 TS errors

---

## EPIC 4: Linear Integration ⬜ NOT STARTED

**Days:** 21-27 | **Effort:** 6 days | **Priority:** 🟡 MUST-HAVE

### Stories
```yaml
1-4-01: Backend - Linear OAuth Setup
1-4-02: Backend - LinearApiClient
1-4-03: Backend - Field Mapping
1-4-04: Backend - ExportToLinearUseCase
1-4-05: Frontend - LinearIntegration (Settings)
1-4-06: Frontend - ExportDialog + Integration
```

### Technical Details

#### Files to Create

**Backend:**
```
backend/src/integrations/linear/
  ├── LinearOAuthController.ts
  ├── LinearApiClient.ts
  ├── LinearFieldMapper.ts
  └── linear.module.ts

backend/src/tickets/application/use-cases/
  └── ExportToLinearUseCase.ts
```

**Frontend:**
```
client/src/settings/components/
  └── LinearIntegration.tsx

client/src/tickets/components/
  └── ExportDialog.tsx
```

#### Environment Variables

```bash
LINEAR_CLIENT_ID=xxx
LINEAR_CLIENT_SECRET=xxx
LINEAR_API_KEY=xxx
LINEAR_REDIRECT_URI=http://localhost:3001/api/linear/callback
```

#### API Endpoints

```
GET /api/settings/linear/status
POST /api/settings/linear/authorize
GET /api/linear/callback?code=xxx&state=xxx
POST /tickets/:id/export-linear
```

#### Success Criteria
- ✅ Linear OAuth flow works
- ✅ Can export ticket to Linear
- ✅ Issue title, description, labels correct
- ✅ Tech spec attached
- ✅ Linear issue URL stored on ticket
- ✅ Re-export updates existing issue
- ✅ Build passes, 0 TS errors

---

## EPIC 5: Jira Integration ⬜ NOT STARTED

**Days:** 27-32 | **Effort:** 5 days | **Priority:** 🟡 ENTERPRISE

### Stories
```yaml
1-5-01: Backend - Jira OAuth Setup
1-5-02: Backend - JiraApiClient
1-5-03: Backend - Field Mapping
1-5-04: Backend - ExportToJiraUseCase
1-5-05: Frontend - JiraIntegration + Export
```

### Technical Details

#### Files to Create

**Backend:**
```
backend/src/integrations/jira/
  ├── JiraOAuthController.ts
  ├── JiraApiClient.ts
  ├── JiraFieldMapper.ts
  └── jira.module.ts

backend/src/tickets/application/use-cases/
  └── ExportToJiraUseCase.ts
```

**Frontend:**
```
client/src/settings/components/
  └── JiraIntegration.tsx
```

#### Success Criteria
- ✅ Jira OAuth flow works
- ✅ Can export ticket to Jira
- ✅ Issue summary, description, labels correct
- ✅ Tech spec attached
- ✅ Jira issue URL stored on ticket
- ✅ Re-export updates existing issue
- ✅ Build passes, 0 TS errors

---

## EPIC 6: Design & Asset Attachments ✅ COMPLETE

**Days:** 32-38 | **Effort:** 6 days | **Priority:** 🟢 POLISH | **Completed:** 2026-02-09 (Session 10)

### Stories
```yaml
1-6-01: Frontend - AssetUploadZone
1-6-02: Frontend - AssetGallery
1-6-03: Backend - AssetStorageService
1-6-04: Frontend - Upload Integration to Stage1
1-6-05: Backend - Export Assets to Linear/Jira
1-6-06: Integration - End-to-end testing
```

### Technical Details

#### Firebase Storage Structure

```
workspaces/{workspaceId}/tickets/{aecId}/
  └── assets/
      ├── wireframe-123.png
      ├── mockups-456.pdf
      └── figma-link.txt
```

#### Success Criteria
- ✅ Upload images/PDFs (max 5MB each, max 5 files)
- ✅ Store in Firebase Storage
- ✅ Preview images inline
- ✅ Delete assets
- ✅ Attach to Linear/Jira exports
- ✅ Mobile responsive gallery
- ✅ Build passes, 0 TS errors

---

# 📊 DEPENDENCIES & BLOCKERS

## Critical Path
```
EPIC 1 (APIs)
    ↓ (needed by EPIC 3 to export APIs)
EPIC 3 (Tech Spec)
    ↓ (needed by EPIC 4/5 for export)
EPIC 4 (Linear)  ← Parallel with EPIC 2 & 6
EPIC 5 (Jira)    ← Parallel with EPIC 2 & 6

EPIC 2 (Rich Input)  ← Can start Day 5 independently
EPIC 6 (Assets)      ← Can start Day 32 independently
```

## Known Blockers
- None identified yet

## Assumptions
- Firebase Storage already configured
- Anthropic API key available for LLM calls
- GitHub OAuth already set up (existing pattern)

---

# ✅ DAILY CHECKLIST TEMPLATE

```markdown
# Super-Sprint Daily Standup - Day X

## Yesterday's Accomplishments
- [ ] Story completed
- [ ] Tests passing
- [ ] Commit pushed

## Today's Goals
- [ ] Story X-Y-Z
- [ ] Unit tests
- [ ] Build passing

## Blockers
- None

## Notes
- [Any observations]
```

---

# 🎯 SUCCESS METRICS

## Definition of Done (per story)
- ✅ Code written (TypeScript)
- ✅ Unit tests passing (>80% coverage)
- ✅ Integration tests passing
- ✅ Build passing (0 TS errors)
- ✅ Git commit with co-author tag
- ✅ Story documented

## Sprint Success Criteria
- ✅ All 6 epics completed on schedule
- ✅ Zero production bugs (tested e2e)
- ✅ All APIs documented
- ✅ Spec files generated correctly
- ✅ Exports work (Linear + Jira)
- ✅ Build passes

## Quality Gates
- **Code Coverage:** >80% on new code
- **TypeScript Errors:** 0
- **Build Time:** <5 minutes
- **Bundle Size:** <+5% from baseline

---

# 🔥 GIT WORKFLOW

## Branch Strategy
```
main (production)
├── epic-1-api-editor
├── epic-2-rich-input
├── epic-3-tech-spec
├── epic-4-linear
├── epic-5-jira
└── epic-6-assets
```

## Commit Message Format
```
feat(epic-1): Add API detection service

- Scan codebase for existing APIs
- Detect new/modified/deleted endpoints
- Generate cURL commands

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

## PR Requirements
- Title: `feat(epic-X): Short description`
- Description: List changes + acceptance criteria
- All tests passing
- Zero TS errors
- Ready to merge immediately (no blocking)

---

# 🚀 READY TO START?

**Next Steps:**
1. ✅ Print this super-sprint document
2. ✅ Create feature branches for each epic
3. ✅ Start Day 1: EPIC 1 (Interactive API Editor)
4. ✅ Daily standup using checklist template
5. ✅ Commit after each story (not at end of epic)

**Day 1 Kickoff:**
- [ ] Clone latest `main`
- [ ] Create `epic-1-api-editor` branch
- [ ] Start Story 1-3b-01: `ApiDetectionService.ts`
- [ ] First commit by EOD

---

**Document Generated:** 2026-02-07
**Last Updated:** 2026-02-09
**Status:** 3/6 Epics Complete | 1 Partial | 2 Not Started
