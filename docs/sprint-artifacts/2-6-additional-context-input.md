# Story 2.6: Additional Context Input for Ticket Creation (v1: Text + Images Only)

**Epic:** Epic 2 - Ticket Creation & AEC Engine
**Story ID:** 2.6
**Created:** 2026-02-04
**Updated:** 2026-02-04 (Scoped for v1)
**Status:** Drafted
**Priority:** P0 (Critical for v1)
**Effort Estimate:** 5-7 hours (reduced from 8-10 due to v1 scope)

---

## User Story

As a Product Manager,
I want to provide additional context (text and images) when creating a ticket,
So that the AI has all relevant information to generate a high-quality executable ticket.

---

## Context & Motivation

Users often have valuable context from Slack conversations, email threads, screenshots, or diagrams. Currently, ticket creation only accepts title + description + repository. This story adds a dedicated "Additional Context" input that:

- ✅ Accepts text (paste Slack/email conversations)
- ✅ Accepts images (screenshots, diagrams, mockups)
- ❌ ~~Audio support~~ - **Deferred to v2**
- ❌ ~~Video support~~ - **Deferred to v2**

**v1 Scope Rationale:**
- Text repositories are primary use case
- Image support covers 80% of context needs (screenshots, diagrams, wireframes)
- Audio/video adds complexity (transcription, frame extraction) without proportional value for v1
- Firebase Storage integration is simpler for static files (text + images)

**Future enhancement (v2):** 
- Audio transcription via Whisper API
- Video frame extraction + audio transcription
- Link to external tickets (Jira, Linear, GitHub Issues)

---

## Acceptance Criteria

**Given** a user is creating a new ticket
**When** they reach the ticket creation flow
**Then** they see a multi-step wizard with clear progress:
- Step 1: Basic Info (title, description)
- Step 2: Repository Selection (critical - emphasized)
- Step 3: Additional Context (optional - new)

**And** on Step 2 (Repository Selection):
- Clear messaging: "Repository context is critical for code-aware generation"
- Helper text explains why repository matters
- UI is clean and minimal

**And** on Step 3 (Additional Context):
- Section title: "Additional Context (Optional)"
- Helper text: "Paste conversations or upload screenshots/diagrams to provide more context"
- Text area for additional text input (multiline, markdown supported)
- File upload area with drag-and-drop support
- **v1 Supported file types**: Images only (PNG, JPG, JPEG, GIF, WebP)
- Max file size: 10MB per image, 50MB total
- Multiple images can be uploaded (up to 10)
- Image preview shown after upload (thumbnail grid)

**And** when user uploads an image:
- Image uploaded directly to Firebase Storage (client-side upload)
- Upload progress shown (percentage bar)
- Thumbnail shown after upload (150x150px preview)
- File name and size displayed
- Remove button available for each image
- Images displayed in grid layout (3 columns)

**And** when user submits the ticket:
- All context (repository + text + images) passed to generation workflow
- Images stored in Firebase Storage: `/workspaces/{workspaceId}/context/{aecId}/{fileName}`
- Context metadata saved in AEC entity:
  ```typescript
  contextInput: {
    additionalText?: string;
    images: Array<{
      fileName: string;
      fileSize: number;
      mimeType: string;
      storageUrl: string;
      uploadedAt: Date;
    }>;
  }
  ```

**And** during ticket generation (Step 1: Intent Extraction):
- LLM receives full context object:
  - Repository context
  - Title + description
  - Additional text (if provided)
  - Images (analyzed via vision model like GPT-4 Vision if configured)
- **v1 Limitation**: Images passed as URLs; vision analysis optional enhancement

**And** context is preserved in AEC:
- AEC entity includes `contextInput` field
- Images accessible via Firebase Storage URLs (signed URLs for security)
- Context viewable in ticket detail page
- Images displayed in gallery view

**And** if LLM cannot process a file type:
- Graceful degradation (use filename/type as metadata)
- Warning shown to user: "Video analysis not available, using filename only"

---

## Prerequisites

- ✅ Story 2.1: Ticket Creation UI (COMPLETED - will be refactored to wizard)
- ✅ Firebase Storage setup (from Epic 1)
- ✅ Story 2.3: AEC Domain Model (COMPLETED - will be extended)

---

## Tasks and Subtasks

### Task 1: Domain Model - ContextInput Value Object (v1: Images Only)
**Layer:** Domain
**Acceptance Criteria:** AC6 (Context preserved in AEC)

**1.1** Create ContextInput value object
- File: `backend/src/tickets/domain/value-objects/ContextInput.ts`
- Properties:
  ```typescript
  {
    repository: RepositoryContext;
    additionalText: string | null;
    images: ContextImage[]; // v1: images only, no audio/video
  }
  ```
- Validation: Max 10 images, max 10MB per image, max 50MB total, images only
- **v1 Scope**: Rejects audio/video files

**1.2** Create ContextImage value object
- File: `backend/src/tickets/domain/value-objects/ContextImage.ts`
- Properties:
  ```typescript
  {
    id: string; // UUID
    fileName: string;
    fileSize: number;
    mimeType: string; // image/png, image/jpeg, etc.
    storageUrl: string; // Firebase Storage URL
    uploadedAt: Date;
  }
  ```
- Validation: MIME type must be image/* only (PNG, JPG, GIF, WebP)
- **v1**: No support for audio (audio/*) or video (video/*)

**1.3** Update AEC domain entity
- File: `backend/src/tickets/domain/aec/AEC.ts` (extend existing)
- Add field: `contextInput?: ContextInput` (optional)
- Update factory method to accept optional ContextInput
- Ensure mapper handles new field (Firestore ↔ Domain)

**Testing:**
- [ ] Unit test: ContextInput validates max 10 images
- [ ] Unit test: ContextInput validates image sizes (10MB each, 50MB total)
- [ ] Unit test: ContextImage validates MIME types (images only)
- [ ] Unit test: ContextImage rejects audio/video files
- [ ] Unit test: AEC factory creates with contextInput

---

### Task 2: File Upload Backend - Storage & API (v1: Images Only)
**Layer:** Infrastructure + Application
**Acceptance Criteria:** AC4 (File upload to Firebase)

**2.1** Create image upload use case
- File: `backend/src/tickets/application/use-cases/UploadContextFileUseCase.ts`
- Validates file type and size
- Generates unique file path: `/workspaces/{workspaceId}/context/{aecId}/{fileId}-{fileName}`
- Uploads to Firebase Storage
- Returns signed URL for frontend access
- Stores metadata (fileName, size, type, URL) for later AEC creation

**2.2** Create file upload controller endpoint
- File: `backend/src/tickets/presentation/controllers/TicketsController.ts` (extend)
- `POST /api/tickets/upload-context`
- Body: Multipart form data with file
- Headers: `workspaceId` from auth token
- Returns: `{ fileId: string, fileName: string, storageUrl: string, type: string }`

**2.3** Implement Firebase Storage service
- File: `backend/src/shared/infrastructure/firebase/FirebaseStorageService.ts`
- Methods: `uploadFile()`, `getSignedUrl()`, `deleteFile()`
- Uses Firebase Admin SDK
- Security: Workspace-scoped paths, token validation

**Testing:**
- [ ] Unit test: UploadContextFileUseCase validates file types
- [ ] Integration test: Upload file to Firebase Storage
- [ ] Integration test: File accessible via signed URL
- [ ] E2E test: Upload file via API endpoint

---

### Task 3: Frontend - Multi-Step Wizard Refactor
**Layer:** Client (Presentation)
**Acceptance Criteria:** AC1 (Multi-step wizard)

**3.1** Refactor ticket creation to wizard
- File: `client/src/tickets/components/CreateTicketWizard.tsx` (NEW - replaces CreateTicketForm)
- 3-step wizard with progress indicator
- Navigation: Next, Back, Submit buttons
- State management: Form data persists across steps
- Validation per step before advancing

**3.2** Create Step 1: Basic Info component
- File: `client/src/tickets/components/wizard-steps/BasicInfoStep.tsx`
- Inputs: Title, Description
- Validation: Title required, 3-500 chars; Description optional

**3.3** Create Step 2: Repository Selection component
- File: `client/src/tickets/components/wizard-steps/RepositorySelectionStep.tsx`
- Repository selector (existing component)
- Emphasis: "Repository context is critical for code-aware ticket generation"
- Helper text: "Select the repository where this work will be implemented. The AI analyzes your codebase to generate accurate acceptance criteria and effort estimates."
- Visual emphasis: Icon, bold text, clean minimal design

**3.4** Create Step 3: Additional Context component
- File: `client/src/tickets/components/wizard-steps/AdditionalContextStep.tsx`
- Text area: "Paste Slack conversations, emails, or notes"
- File upload section (see Task 4)
- Skip button: "Skip - Create ticket now"
- Helper text: "Optional: Add extra context to help the AI understand your needs better"

**Testing:**
- [ ] Component test: Wizard renders 3 steps
- [ ] Component test: Form data persists across steps
- [ ] E2E test: Navigate through wizard and submit

---

### Task 4: Frontend - File Upload UI
**Layer:** Client (Presentation)
**Acceptance Criteria:** AC3 (File upload area), AC4 (Upload progress)

**4.1** Create file upload component
- File: `client/src/tickets/components/ContextFileUpload.tsx`
- Drag-and-drop area with file input fallback
- Accepted types: `image/*`, `audio/*`, `video/*`
- Multiple file support
- Shows supported formats: "PNG, JPG, MP3, M4A, MP4, MOV"

**4.2** Implement upload progress UI
- Upload progress bar per file (0-100%)
- Success state: Thumbnail (images) or icon (audio/video)
- Error state: Red border, error message, retry button
- File list: Name, size, type, remove button

**4.3** Integrate with backend upload endpoint
- Upload files to `POST /api/tickets/upload-context`
- Store returned `fileId` and `storageUrl` in wizard state
- Pass file metadata to CreateTicketUseCase on final submit

**4.4** Add file preview/thumbnail
- Images: Show thumbnail from storageUrl
- Audio: Show waveform icon + duration (if extractable)
- Video: Show play icon + thumbnail from first frame (if extractable)

**Testing:**
- [ ] Component test: Drag-and-drop triggers file input
- [ ] Component test: File upload shows progress
- [ ] Component test: Remove button deletes file from list
- [ ] E2E test: Upload image and see thumbnail

---

### Task 5: LLM Integration - Multimodal Context Processing
**Layer:** Application (LLM Orchestration)
**Acceptance Criteria:** AC5 (LLM receives full context)

**5.1** Update MastraContentGenerator for multimodal inputs
- File: `backend/src/shared/infrastructure/mastra/MastraContentGenerator.ts` (extend)
- Update `extractIntent()` method signature to accept `ContextInput`
- For images: Pass image URLs to GPT-4 Vision or Claude 3 Opus
- For audio: Transcribe using Whisper API, pass text to LLM
- For video: Extract frames (1 frame/5 sec) + transcribe audio, pass to LLM

**5.2** Implement audio transcription service
- File: `backend/src/shared/infrastructure/openai/WhisperTranscriptionService.ts`
- Uses OpenAI Whisper API
- Input: Audio file URL from Firebase Storage
- Output: Transcribed text
- Error handling: If transcription fails, use filename only

**5.3** Implement video processing service
- File: `backend/src/shared/infrastructure/video/VideoProcessingService.ts`
- Uses FFmpeg (or cloud service) to extract frames
- Extracts audio track for transcription
- Passes frames to vision model (sample: 1 frame per 5 seconds)
- Combines frame analysis + audio transcription

**5.4** Update intent extraction step in workflow
- File: `backend/src/tickets/workflows/ticket-generation.workflow.ts` (extend Step 1)
- Load ContextInput from AEC
- Process additional text (append to description)
- Process images (vision analysis)
- Process audio (transcribe)
- Process video (frame + audio analysis)
- Combine all context into intent extraction prompt

**Testing:**
- [ ] Unit test: Image URL passed to vision model
- [ ] Integration test: Audio transcription works end-to-end
- [ ] Integration test: Video frame extraction + transcription
- [ ] E2E test: Create ticket with image, verify intent includes image analysis

---

### Task 6: Update CreateTicketUseCase
**Layer:** Application
**Acceptance Criteria:** AC6 (Context saved in AEC)

**6.1** Update CreateTicketUseCase to accept ContextInput
- File: `backend/src/tickets/application/use-cases/CreateTicketUseCase.ts` (extend)
- Command DTO now includes: `contextInput: ContextInputDto`
- Create AEC with contextInput field
- Save to Firestore (mapper handles ContextInput serialization)

**6.2** Create DTO for ContextInput
- File: `backend/src/tickets/presentation/dto/ContextInputDto.ts`
- Mirrors domain ContextInput structure
- Validation: Zod schema for API input

**Testing:**
- [ ] Unit test: CreateTicketUseCase saves contextInput to AEC
- [ ] Integration test: AEC loaded from Firestore includes contextInput

---

### Task 7: Ticket Detail - Display Context
**Layer:** Client (Presentation)
**Acceptance Criteria:** AC6 (Context viewable in ticket detail)

**7.1** Add "Context Used" section to ticket detail page
- File: `client/src/tickets/components/TicketDetail.tsx` (extend)
- Expandable section: "Context Used for Generation"
- Shows repository info
- Shows additional text (if provided)
- Shows uploaded files (thumbnails/icons with links)

**7.2** Display file attachments
- Images: Thumbnail gallery (click to enlarge)
- Audio: Audio player or link to download
- Video: Video player or link to download

**Testing:**
- [ ] Component test: Context section renders with files
- [ ] E2E test: Ticket detail shows uploaded image

---

### Task 8: Security & Validation
**Layer:** Infrastructure + Application

**8.1** Implement file type validation
- Whitelist: `image/png`, `image/jpeg`, `audio/mpeg`, `audio/mp4`, `video/mp4`, `video/quicktime`
- Reject executable files, scripts, PDFs (for v1)
- Validate MIME type + file extension match

**8.2** Implement file size limits
- Max per file: 50MB
- Max total per ticket: 200MB
- Show error if limit exceeded

**8.3** Firebase Storage security rules
- Path: `/workspaces/{workspaceId}/context/{aecId}/*`
- Read: Authenticated users in workspace
- Write: Only via backend (not direct frontend upload for security)

**8.4** Virus scanning (future enhancement - note in tech debt)
- Use Cloud Functions + ClamAV or VirusTotal API
- Scan uploaded files before processing
- Reject infected files

**Testing:**
- [ ] Unit test: Reject executable file types
- [ ] Unit test: Reject files > 50MB
- [ ] Integration test: Security rules prevent unauthorized access

---

## Dev Notes

### Architecture Context

**Clean Architecture Layers:**
- **Domain:** ContextInput, ContextFile value objects
- **Application:** UploadContextFileUseCase, multimodal LLM processing
- **Infrastructure:** Firebase Storage, Whisper API, Video processing
- **Presentation:** Multi-step wizard, file upload UI

**Module Impact:**
- Tickets module (domain, use cases, controllers)
- Shared infrastructure (Firebase Storage, LLM services)
- Client UI (wizard refactor, file upload)

### Multimodal LLM Capabilities

**GPT-4 Vision (OpenAI):**
- Supports: Images (PNG, JPG, WEBP)
- Max resolution: 2048x2048
- Use case: Screenshot analysis, mockup review, diagram interpretation

**Claude 3 Opus/Sonnet (Anthropic):**
- Supports: Images (PNG, JPG, WEBP, GIF)
- Max size: 5MB per image
- Use case: Alternative to GPT-4V, potentially better for technical diagrams

**Whisper API (OpenAI):**
- Supports: MP3, MP4, M4A, WAV, etc.
- Max size: 25MB
- Use case: Transcribe voice memos, meeting recordings

**Video Processing:**
- No native LLM video support yet
- Workaround: Extract frames (1 per 5 sec) + transcribe audio
- FFmpeg for frame extraction
- Cloud Functions for processing (avoid blocking NestJS)

### Firebase Storage Structure

```
/workspaces/{workspaceId}/
  └── context/
      └── {aecId}/
          ├── {fileId}-screenshot.png
          ├── {fileId}-voice-memo.m4a
          └── {fileId}-demo.mp4
```

**Storage URLs:**
- Signed URLs with 7-day expiration
- Refresh URLs when viewing old tickets (if expired)

### UI/UX Design Notes

**Wizard Progress Indicator:**
- Simple horizontal stepper: 1 → 2 → 3
- Current step highlighted
- Completed steps show checkmark

**Repository Selection Emphasis:**
- Visual hierarchy: Repository selector is larger, more prominent
- Helper text is educational, not overwhelming
- Icon: GitHub/GitLab logo for visual cue

**File Upload Area:**
- Dashed border for drag-and-drop zone
- Upload icon (cloud arrow up)
- Supported formats shown below upload area
- Max size shown: "Up to 50MB per file"

**Linear-Inspired Minimalism:**
- Clean white background
- Subtle shadows for depth
- No unnecessary borders or colors
- Plenty of whitespace

### Performance Considerations

**File Upload:**
- Direct frontend → Firebase Storage (not via backend proxy)
- Use signed upload URLs from backend
- Prevents backend bottleneck

**Video Processing:**
- Offload to Cloud Functions (avoid blocking NestJS)
- Queue-based processing (Bull queue)
- Show "Processing video..." state in UI

**LLM Multimodal Calls:**
- Images: +500-1000 tokens per image
- Audio transcription: ~1 token per 0.6 seconds
- Budget: Max 3 images, 5 min audio, 2 min video per ticket (for v1)

### Future Enhancements (Tech Debt)

**v2 Features:**
- Link to external tickets (Jira, Linear, GitHub Issues) for context
- PDF support (extract text, analyze diagrams)
- Rich text editor for additional text (Markdown, formatting)
- Virus scanning for uploaded files
- Video player with timestamp annotations

**v3 Features:**
- Slack integration (fetch message thread directly)
- Email integration (forward email to create ticket)
- Screen recording directly in app (no file upload)

### Data Model (Complete)

```typescript
// Domain
class ContextInput {
  constructor(
    public readonly repository: RepositoryContext,
    public readonly additionalText: string | null,
    public readonly files: ContextFile[]
  ) {}

  validate(): void {
    if (this.files.length > 10) {
      throw new Error('Max 10 files allowed');
    }
    const totalSize = this.files.reduce((sum, f) => sum + f.fileSize, 0);
    if (totalSize > 200 * 1024 * 1024) { // 200MB
      throw new Error('Total file size exceeds 200MB');
    }
  }
}

class ContextFile {
  constructor(
    public readonly id: string,
    public readonly type: 'image' | 'audio' | 'video',
    public readonly fileName: string,
    public readonly fileSize: number,
    public readonly storageUrl: string,
    public readonly uploadedAt: Date
  ) {}

  static fromMimeType(mimeType: string): 'image' | 'audio' | 'video' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}

// AEC entity (extended)
class AEC {
  // ... existing fields
  public readonly contextInput: ContextInput;
}
```

### References

**Architecture:**
- [Source: docs/architecture.md#Mastra Workflow Architecture] - Workflow steps, LLM integration
- [Source: docs/architecture.md#Data Architecture] - Domain entities, value objects

**Epic Requirements:**
- [Source: User request 2026-02-04] - Additional context input, multimodal support

**Related Stories:**
- Story 2.1: Ticket Creation UI (will be refactored to wizard)
- Story 2.3: AEC Domain Model (will be extended with contextInput)
- Epic 7 Story 7.10: Mastra Workflow (will consume contextInput)

---

## Change Log

| Date       | Author | Change Description |
|------------|--------|--------------------|
| 2026-02-04 | BMad   | Initial story creation for additional context input feature |

---

## Functional Requirements Coverage

**FR1:** Create ticket with minimal input (title, description) → Extended with contextInput ✅
**FR2:** AI generates structured ticket with AC/assumptions/estimate → Enhanced with multimodal context ✅

---

## Dev Agent Record

### Completion Notes
- [ ] Multi-step wizard implemented and tested
- [ ] Repository selection emphasis clear and effective
- [ ] File upload works for images, audio, video
- [ ] Multimodal LLM processing (vision, audio transcription, video)
- [ ] ContextInput saved in AEC and viewable in ticket detail
- [ ] Security: File type validation, size limits, Firebase rules
- [ ] Performance: Direct Firebase upload, video processing offloaded

### Context Reference
- [To be generated after story draft approved]

### Agent Model Used
{{agent_model_name_version}}

### Debug Log References

### File List
- [To be populated by dev agent during implementation]

---

## Senior Developer Review (AI)
- [To be completed after implementation by code-review workflow]
