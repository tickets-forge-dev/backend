# Story 2.7: AI-Generated Steps to Reproduce & Verification Steps

**Epic:** Epic 2 - Ticket Creation & AEC Engine  
**Story ID:** 2.7  
**Created:** 2026-02-04  
**Status:** Draft  
**Priority:** P0 (Critical for v1 - QA/PM need)  
**Effort Estimate:** 6-8 hours  

---

## Executive Summary

**The Problem:** Every ticket needs clear, deterministic steps to reproduce (for bugs) or verification steps (for features). Currently, PMs write these manually, often missing edge cases or being too vague for QA.

**The Solution:** Leverage our code-aware AI + repository indexing to **auto-generate precise, code-aware reproduction/verification steps** that:
- Reference actual API endpoints, files, and functions
- Include technical details (auth tokens, request payloads, expected responses)
- Account for edge cases discovered during preflight validation
- Are **editable** by PM/QA with inline suggestions

**The Innovation:** We're not just generating generic steps—we're creating **executable verification contracts** grounded in code reality.

---

## User Story

**As a QA Engineer,**  
I want AI-generated, code-aware verification steps for every ticket,  
So that I can deterministically verify implementation without ambiguity or back-and-forth with PM/Engineering.

**As a Product Manager,**  
I want the AI to draft reproduction steps for bugs,  
So that I don't have to manually write technical details and can focus on higher-level context.

---

## Context & Motivation

### Current Pain Points

1. **Manual Labor**: PM writes "Login, click button X, see error" → wastes 5-10 mins per ticket
2. **Vague Steps**: "User should be able to do X" → QA: "How? What's the happy path? Edge cases?"
3. **Missing Technical Details**: No API endpoints, no auth requirements, no payloads
4. **Stale Steps**: Steps written before implementation, don't match final code
5. **No Code Awareness**: Steps don't reference actual files/functions that changed

### Why Our System Can Do Better

✅ **We have the repository indexed** → Know which files/functions exist  
✅ **We have API specs** → Know endpoint signatures, auth requirements  
✅ **We have validation findings** → Know edge cases, missing deps, conflicts  
✅ **We have ticket type** → Know whether to generate "Steps to Reproduce" (bug) or "Verification Steps" (feature)  
✅ **We have LLM + code context** → Can generate precise, technical steps  

---

## Examples

### Example 1: Bug Ticket - "Login fails with invalid email"

**AI-Generated Steps to Reproduce:**
```markdown
## Steps to Reproduce

### Prerequisites
- User account: test@example.com / Password123!
- Environment: Staging (https://staging.app.com)
- Auth token: Required (obtain via POST /api/auth/login)

### Reproduction Steps
1. Navigate to login page: `/login`
2. Enter email: `invalid-email@` (note: missing domain)
3. Enter password: `Password123!`
4. Click "Login" button
5. **Expected**: Error message "Invalid email format"
6. **Actual**: Form submits, 500 error from backend

### Technical Details
- Affected file: `backend/src/auth/validators/EmailValidator.ts`
- API endpoint: `POST /api/auth/login`
- Request payload:
  ```json
  {
    "email": "invalid-email@",
    "password": "Password123!"
  }
  ```
- Expected response: `400 Bad Request` with validation error
- Actual response: `500 Internal Server Error`

### Edge Cases
- Empty email: ✅ Already validated
- Valid email + wrong password: ✅ Works correctly
- SQL injection in email field: ⚠️ Needs testing
```

### Example 2: Feature Ticket - "Add user profile photo upload"

**AI-Generated Verification Steps:**
```markdown
## Verification Steps

### Prerequisites
- Authenticated user with valid token
- Test image: `test-avatar.png` (< 5MB, 512x512px)
- Environment: Staging

### Happy Path
1. Navigate to profile settings: `/settings/profile`
2. Click "Upload Photo" button
3. Select `test-avatar.png` from file picker
4. **Verify**: Upload progress bar appears (0% → 100%)
5. **Verify**: Preview shows uploaded image
6. Click "Save"
7. **Verify API**: 
   - Request: `POST /api/users/profile/photo`
   - Response: `200 OK` with `{ photoUrl: "https://storage.firebase.com/..." }`
8. **Verify Storage**: Image uploaded to Firebase Storage at `/users/{userId}/avatar.png`
9. **Verify UI**: Profile page shows new avatar immediately

### Edge Cases to Test
- ✅ File too large (> 5MB): Expect error "File size exceeds 5MB limit"
- ✅ Invalid file type (e.g., .txt): Expect error "Only image files allowed"
- ✅ Upload without authentication: Expect 401 Unauthorized
- ✅ Network interruption during upload: Expect retry mechanism or error

### Affected Files
- Frontend: `client/src/profile/components/AvatarUpload.tsx`
- Backend: `backend/src/users/infrastructure/FirebaseStorageService.ts`
- API: `POST /api/users/profile/photo`

### QA Acceptance Criteria
- [ ] Happy path works end-to-end
- [ ] All edge cases return appropriate errors
- [ ] Image accessible via signed URL after upload
- [ ] No console errors during upload
```

---

## Acceptance Criteria

### AC1: Auto-Generate Steps Based on Ticket Type

**Given** a ticket is generated via workflow  
**When** ticket type is "BUG"  
**Then** AI generates "Steps to Reproduce" section with:
- Prerequisites (auth, data setup, environment)
- Numbered reproduction steps (user actions)
- Expected vs Actual behavior
- Technical details (API endpoints, files, payloads)
- Known edge cases from validation findings

**And when** ticket type is "FEATURE", "REFACTOR", or "SPIKE"  
**Then** AI generates "Verification Steps" section with:
- Prerequisites
- Happy path verification steps
- Edge cases to test
- API verification commands (curl examples if applicable)
- Affected files/functions

### AC2: Code-Aware Step Generation

**Given** repository is indexed  
**When** generating steps  
**Then** steps must include:
- ✅ Actual file paths (e.g., `backend/src/auth/AuthService.ts`)
- ✅ Actual API endpoint paths (from API spec or indexing)
- ✅ Actual function/class names (from code index)
- ✅ Request/response examples (from API spec if available)
- ✅ Auth requirements (from API spec or security analysis)

**And** steps must avoid:
- ❌ Generic placeholders ("the login endpoint")
- ❌ Hallucinated endpoints that don't exist
- ❌ Missing technical details

### AC3: Include Validation Findings as Edge Cases

**Given** preflight validation found issues (Story 7.3)  
**When** generating verification steps  
**Then** findings are converted to edge case tests:

Example mapping:
- Finding: "Missing dependency: stripe SDK"  
  → Edge case: "Verify error handling when Stripe SDK unavailable"
  
- Finding: "Conflicting function: `processPayment` already exists"  
  → Edge case: "Test both old and new payment processing flows"

### AC4: Inline Editing with AI Suggestions

**Given** PM/QA views generated steps  
**When** they click "Edit Steps"  
**Then** they see:
- Inline markdown editor with syntax highlighting
- AI suggestions panel on the right:
  - "Add edge case: Invalid auth token"
  - "Add API verification: GET /api/users/{id}"
  - "Add file reference: frontend/src/Login.tsx"
- "Regenerate with changes" button (re-runs AI with edits as context)
- "Accept changes" / "Discard" buttons

**And** when they edit manually:
- Changes are tracked (show diff on hover)
- Original AI-generated version available as "View original"
- Changes persist to AEC entity in Firestore

### AC5: Steps Included in Export (Jira/Linear)

**Given** AEC has verification steps  
**When** exported to Jira or Linear  
**Then** steps are formatted in target platform's markdown:
- **Jira**: Uses Jira markdown (panels, code blocks)
- **Linear**: Uses Linear markdown (checkbox lists)
- Steps appear in ticket description or dedicated "QA Steps" field

### AC6: Diff Detection for Stale Steps

**Given** ticket was generated with verification steps  
**When** repository code changes (drift detected)  
**Then** system shows drift warning:
- "⚠️ Code has changed since steps were generated"
- Shows affected files that changed
- "Regenerate steps" button updates steps with latest code context

---

## Technical Design

### Architecture Layer: Application + Domain

**Domain Changes:**
- Add `verificationSteps: VerificationSteps` to AEC entity
- Create `VerificationSteps` value object:
  ```typescript
  interface VerificationSteps {
    type: 'reproduce' | 'verify'; // Bug vs Feature
    prerequisites: string[];
    steps: VerificationStep[];
    edgeCases: EdgeCase[];
    affectedFiles: string[];
    generatedAt: Date;
    editedAt?: Date;
    editedBy?: string; // userId
    version: number; // Increments on regeneration
  }
  
  interface VerificationStep {
    order: number;
    action: string; // "Navigate to /login"
    verification?: string; // "Verify: Error message appears"
    technicalDetails?: TechnicalDetail;
  }
  
  interface TechnicalDetail {
    apiEndpoint?: string; // "POST /api/auth/login"
    requestPayload?: object;
    expectedResponse?: object;
    affectedFile?: string;
    affectedFunction?: string;
  }
  
  interface EdgeCase {
    id: string;
    scenario: string; // "File too large (> 5MB)"
    expectedBehavior: string; // "Expect error: File size exceeds limit"
    tested?: boolean; // QA can check off
    source?: 'ai' | 'validation' | 'manual'; // Where it came from
  }
  ```

### Workflow Integration (Story 7.10)

**New Workflow Step: Step 8.5 (After Draft Content, Before Questions)**

**Step Name:** `generateVerificationStepsStep`

**Inputs:**
- Ticket type (bug/feature/etc)
- Acceptance criteria
- Repository context (files, APIs)
- Validation findings (from step 4)
- Index query results (relevant modules from step 5)

**Process:**
1. Determine step type: "reproduce" (bug) or "verify" (feature/refactor/chore)
2. Call LLM with structured prompt:
   ```
   You are generating QA verification steps for a ticket.
   
   Ticket Type: {type}
   Title: {title}
   Acceptance Criteria: {acceptanceCriteria}
   
   Repository Context:
   - Relevant files: {relevantFiles}
   - API endpoints: {apiEndpoints}
   - Functions: {functions}
   
   Validation Findings:
   {findings}
   
   Generate:
   1. Prerequisites (auth, data, environment)
   2. Step-by-step {reproduce|verify} instructions
   3. Technical details (API calls, files, payloads)
   4. Edge cases derived from validation findings
   5. QA acceptance checklist
   
   Format as JSON matching VerificationSteps schema.
   Include actual file paths and API endpoints from context.
   DO NOT hallucinate endpoints or files.
   ```

3. Parse LLM response into `VerificationSteps` object
4. Validate all file paths exist in index
5. Validate all API endpoints exist in API spec (if available)
6. Save to AEC entity
7. Return to workflow

**Output:**
- `verificationSteps` object saved to AEC
- Workflow continues to questions step

### Frontend Components

**Component 1: VerificationStepsDisplay**
- **File:** `client/src/tickets/components/VerificationStepsDisplay.tsx`
- Read-only view of generated steps
- Collapsible sections (Prerequisites, Steps, Edge Cases)
- Syntax highlighting for code blocks
- "Edit Steps" button

**Component 2: VerificationStepsEditor**
- **File:** `client/src/tickets/components/VerificationStepsEditor.tsx`
- Markdown editor (monaco or similar)
- AI suggestions sidebar:
  - "Add API verification"
  - "Add edge case"
  - "Add file reference"
- Diff view (original vs edited)
- "Regenerate with changes" button
- Save/Discard buttons

**Component 3: EdgeCaseChecklist**
- **File:** `client/src/tickets/components/EdgeCaseChecklist.tsx`
- Checkbox list of edge cases
- QA can mark as tested
- Shows source (AI, validation, manual)
- Add custom edge case button

### API Endpoints

**1. Regenerate Steps**
```
POST /api/tickets/:id/regenerate-steps
Body: { userEdits?: string, includeNewFindings?: boolean }
Response: { verificationSteps: VerificationSteps }
```

**2. Update Steps (Manual Edit)**
```
PATCH /api/tickets/:id/verification-steps
Body: { steps: VerificationSteps }
Response: { verificationSteps: VerificationSteps, version: number }
```

**3. Mark Edge Case Tested**
```
PATCH /api/tickets/:id/edge-cases/:edgeCaseId
Body: { tested: boolean }
Response: { success: boolean }
```

---

## Implementation Tasks

### Task 1: Domain Model
**Effort:** 2 hours

1.1. Create `VerificationSteps` value object  
1.2. Add `verificationSteps` field to AEC entity  
1.3. Update AECMapper for Firestore persistence  
1.4. Add validation rules (max 20 steps, max 10 edge cases)  

**Testing:**
- [ ] Unit test: VerificationSteps validates structure
- [ ] Unit test: AEC reconstitutes with verificationSteps

---

### Task 2: Workflow Step - Generate Steps
**Effort:** 3 hours

2.1. Create `generateVerificationStepsStep` in workflow  
2.2. Create LLM prompt template for step generation  
2.3. Implement response parsing and validation  
2.4. Integrate with IndexQueryService (get file paths)  
2.5. Integrate with API spec (get endpoint details)  
2.6. Map validation findings to edge cases  

**Testing:**
- [ ] Unit test: Step generates valid VerificationSteps
- [ ] Integration test: LLM returns valid JSON
- [ ] Integration test: File paths validated against index
- [ ] E2E test: Full workflow includes step generation

---

### Task 3: Frontend - Display Component
**Effort:** 2 hours

3.1. Create `VerificationStepsDisplay.tsx`  
3.2. Collapsible sections for prerequisites/steps/edge cases  
3.3. Syntax highlighting for code blocks  
3.4. "Edit Steps" button opens editor  

**Testing:**
- [ ] Component test: Renders all sections
- [ ] Component test: Code blocks formatted correctly

---

### Task 4: Frontend - Editor Component
**Effort:** 2 hours

4.1. Create `VerificationStepsEditor.tsx` with markdown editor  
4.2. AI suggestions sidebar  
4.3. Diff view (original vs edited)  
4.4. Regenerate button calls API  

**Testing:**
- [ ] Component test: Editor saves changes
- [ ] E2E test: Regenerate updates steps

---

### Task 5: Export Integration (Jira/Linear)
**Effort:** 1 hour

5.1. Update Jira export template to include verification steps  
5.2. Update Linear export template to include verification steps  
5.3. Format edge cases as checkbox lists  

**Testing:**
- [ ] E2E test: Exported ticket includes steps

---

## Success Metrics

### Quantitative
- **80% of generated steps** require zero manual edits from QA
- **30% reduction** in clarification questions on tickets
- **QA time to first test** ↓ 25% (less time understanding ticket)
- **Bug reproduction rate** ↑ 40% (clearer steps = easier repro)

### Qualitative
- QA reports higher confidence in ticket clarity
- PM reports time savings on step writing
- Engineers appreciate technical details in steps

---

## Dependencies

- ✅ Story 2.1: Ticket Creation (COMPLETED)
- ✅ Story 2.3: AEC Domain Model (COMPLETED)
- ✅ Story 4.2: Repository Indexing (COMPLETED - need file paths)
- ✅ Story 7.3: Preflight Validation (COMPLETED - findings → edge cases)
- ✅ Story 7.10: Mastra Workflow (COMPLETED - add new step)
- ⏳ Story 5.1: Jira Export (IN PROGRESS - update template)
- ⏳ Story 5.2: Linear Export (IN PROGRESS - update template)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **LLM hallucinates steps** | Validate all file paths/APIs against index/spec |
| **Steps too technical for PM** | Include "simple view" and "technical view" toggle |
| **Steps become stale** | Drift detection shows warning, regenerate button |
| **Too many edge cases** | Limit to top 10 by severity, allow manual add |
| **Editor UX complexity** | Start with simple markdown textarea, enhance later |

---

## Future Enhancements (v2)

1. **Video Recording Integration**: Upload screen recording, AI extracts steps
2. **Interactive Steps**: Clickable API examples with "Try it" button
3. **Step Templates**: PM can define org-wide step templates
4. **Automated Testing**: Generate Playwright/Cypress tests from steps
5. **Step Analytics**: Track which edge cases are most commonly found

---

## Open Questions

1. **Should steps be regenerated on every AEC update?**  
   → No, only on explicit "Regenerate" click or when drift detected

2. **Should steps be editable during workflow execution?**  
   → No, locked during generation. Editable after validation step.

3. **Should we support multi-language steps (for global teams)?**  
   → v2 enhancement, v1 English only

4. **How to handle API auth details (tokens, keys) in steps?**  
   → Use placeholders like `{AUTH_TOKEN}` with instructions to obtain

---

## Story Status

- [x] Requirements defined
- [x] Technical design complete
- [x] Acceptance criteria clear
- [ ] Implementation plan approved
- [ ] Ready for development

**Recommended Sprint:** Sprint 3 (after Story 7.10 complete)  
**Priority:** P0 - Critical for v1 (QA/PM blocker without it)
