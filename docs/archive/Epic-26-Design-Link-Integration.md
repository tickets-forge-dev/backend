# EPIC 26: Design Link Integration with LLM Leverage

**Days:** TBD | **Effort:** 30-35 hours | **Priority:** 🟡 HIGH | **Status:** 📝 PLANNED

## Context

**Problem:**
- PMs/QA have no structured way to add design links (Figma, Loom, etc.) to tickets
- Design context is manually pasted in description fields as plain text
- LLM spec generation doesn't leverage visual design information
- Engineers lack clear visual references when implementing features

**What This Feature Does (IMPORTANT CLARIFICATION):**
- ✅ **Users manually paste links** to existing Figma designs, Loom videos, or other design tools
- ✅ System validates URLs, detects platform (Figma/Loom), stores in structured format
- ✅ System fetches metadata (thumbnail, title, last modified) via API for rich previews
- ✅ LLM uses design context to generate better specs with design tokens
- ❌ **Does NOT auto-generate Figma designs** (users bring their own designs)

**User Workflow:**
1. PM creates Figma mockup in Figma (outside Forge)
2. PM pastes Figma link into Forge ticket wizard
3. Forge validates link, shows platform icon, stores reference
4. Forge fetches Figma metadata (thumbnail, file name) in background
5. Engineer sees rich Figma preview in ticket detail
6. LLM generates spec with pixel-perfect requirements from Figma design

**User Requirements:**
- Add design links (Figma mockups, Loom videos) during ticket creation
- Focus on Figma and Loom platforms (most important for team)
- Design links should always be optional (not required)
- Leverage design information to enhance LLM spec generation with pixel-perfect specs

---

## UI Wireframes

### 1. Stage 1 Wizard - Design Link Input (Phase 1)

```
┌────────────────────────────────────────────────────────────────────┐
│ Create Ticket                                              [✕ Close] │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Title: [Implement user dashboard                              ]    │
│                                                                      │
│  ┌──────────────────────┬─────────────────────┐                    │
│  │ Codebase to Scan     │ Reference Materials │  <- Active Tab     │
│  └──────────────────────┴─────────────────────┘                    │
│                                                                      │
│  Design Links (Optional)                                            │
│  Paste Figma, Loom, or Miro links to provide visual context       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 🎨  Dashboard Mockups                                  [✕] │    │
│  │     https://figma.com/file/abc123/Dashboard-Redesign       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ 📹  User Flow Demo                                      [✕] │    │
│  │     https://loom.com/share/xyz789                          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  [+ Add Another Link]                                               │
│                                                                      │
│  ────────────────────────────────────────────────────────────       │
│                                                                      │
│  Attachments (Optional)                                             │
│  Drop files here or browse                                          │
│  [📄 screenshot-1.png (1.2MB)]                              [✕]    │
│  [📄 requirements.pdf (3.5MB)]                              [✕]    │
│                                                                      │
│                                                                      │
│                                        [Back]  [Continue →]         │
└────────────────────────────────────────────────────────────────────┘
```

### 2. Ticket Detail - Design Tab (Phase 1)

```
┌────────────────────────────────────────────────────────────────────┐
│ Ticket #FOR-123: Implement user dashboard                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┬──────────────┬──────────────┐                │
│  │ Specification    │ Design       │ Implementation│  <- New Tab    │
│  └──────────────────┴──────────────┴──────────────┘                │
│                                                                      │
│  ▼ Design References (2)                                            │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                                                                  │
│  │  🎨  Dashboard Mockups                              [↗] [✕]    │
│  │      figma.com/file/abc123...                                   │
│  │      Added 2 hours ago by alice@company.com                    │
│  │                                                                  │
│  │  📹  User Flow Demo                                  [↗] [✕]    │
│  │      loom.com/share/xyz789                                      │
│  │      Added 1 hour ago by bob@company.com                       │
│  │                                                                  │
│  │  [+ Add Design Link]                                            │
│  └────────────────────────────────────────────────────────────────┘
│                                                                      │
│  ✨ (Rich preview cards come in Phase 2)                            │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 3. Ticket Detail - Design Tab with Rich Preview Cards (Phase 2)

```
┌────────────────────────────────────────────────────────────────────┐
│ Ticket #FOR-123: Implement user dashboard                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┬──────────────┬──────────────┐                │
│  │ Specification    │ Design       │ Implementation│  <- Active Tab │
│  └──────────────────┴──────────────┴──────────────┘                │
│                                                                      │
│  ▼ Design References (2)                                            │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                                                                  │
│  │  ┌──────────┐  🎨  Dashboard Mockups v2            [↗] [✕]    │
│  │  │ [Figma ] │      figma.com/file/abc123...                     │
│  │  │ Preview  │      Last modified: 2 hours ago                  │
│  │  │  Image   │      File key: abc123                            │
│  │  └──────────┘      Added by alice@company.com                  │
│  │                                                                  │
│  │  ┌──────────┐  📹  Dashboard User Flow Demo        [↗] [✕]    │
│  │  │ [Video ] │      loom.com/share/xyz789                       │
│  │  │ Thumb-   │      Duration: 3:45 • 2.1k views                │
│  │  │  nail    │      Transcript available ✓                     │
│  │  └──────────┘      Added by bob@company.com                    │
│  │                                                                  │
│  │  [+ Add Design Link]                                            │
│  └────────────────────────────────────────────────────────────────┘
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 4. Settings - Figma Integration (Phase 2)

```
┌────────────────────────────────────────────────────────────────────┐
│ Settings › Integrations                                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Design Tools                                                       │
│  ─────────────────────────────────────────────────────────────     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  🎨 Figma                                        ✓ Connected │    │
│  │                                                                  │
│  │  Access design files and extract metadata from Figma           │
│  │  to enhance ticket specifications.                             │
│  │                                                                  │
│  │  Status: Connected as alice@company.com                        │
│  │  Workspace: Design Team                                        │
│  │  Last synced: 5 minutes ago                                    │
│  │                                                                  │
│  │  [Reconnect]  [Disconnect]                                     │
│  └────────────────────────────────────────────────────────────────┘
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  📹 Loom                                        ✗ Not Connected │ │
│  │                                                                  │
│  │  Connect Loom to fetch video metadata, thumbnails, and        │
│  │  transcripts for richer design context.                        │
│  │                                                                  │
│  │  [Connect Loom]                                                │
│  └────────────────────────────────────────────────────────────────┘
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 5. Generated Spec - Design-Driven Badge (Phase 3)

```
┌────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────┬──────────────┐                               │
│  │ Specification    │ Implementation │  <- Active Tab              │
│  └──────────────────┴──────────────┘                               │
│                                                                      │
│  Quality Score: 92/100  [🎨 Design-Driven]  <- New Badge           │
│                                                                      │
│  ▼ Problem Statement                                                │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Users need a centralized dashboard to view their activity     │
│  │  metrics and recent updates. This feature addresses the need   │
│  │  for quick access to key information.                          │
│  │                                                                  │
│  │  📐 Design Reference: Dashboard Mockups v2                     │
│  │     The Figma design shows a 3-column layout with cards for   │
│  │     metrics, activity feed, and quick actions.                 │
│  │                                                                  │
│  │  [View Design →]                                               │
│  └────────────────────────────────────────────────────────────────┘
│                                                                      │
│  ▼ Acceptance Criteria                                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  1. Dashboard layout matches Figma design (3 columns)          │
│  │     - Column widths: 2fr, 3fr, 2fr                            │
│  │     - Gap between columns: 24px                                │
│  │                                                                  │
│  │  2. Design tokens applied from Figma:                          │
│  │     - Primary color: #6366f1                                   │
│  │     - Font family: Inter                                       │
│  │     - Border radius: 8px                                       │
│  │     - Card shadow: 0 1px 3px rgba(0,0,0,0.1)                  │
│  │                                                                  │
│  │  3. Responsive breakpoints match design specs:                 │
│  │     - Desktop: 1024px+                                         │
│  │     - Tablet: 768px-1023px (2 columns)                        │
│  │     - Mobile: <768px (1 column, stack)                        │
│  └────────────────────────────────────────────────────────────────┘
│                                                                      │
│  ▼ Visual Expectations                                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Screen: Dashboard (Default State)                             │
│  │  Reference: figma.com/file/abc123/frame/dashboard-default     │
│  │                                                                  │
│  │  The dashboard displays metrics cards with:                    │
│  │  - Header with metric name + icon                             │
│  │  - Large number display (48px font)                           │
│  │  - Percentage change badge (+12%, green)                      │
│  │  - Sparkline chart showing 7-day trend                        │
│  └────────────────────────────────────────────────────────────────┘
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### 6. Add Design Link Dialog (Post-Creation)

```
┌────────────────────────────────────────────────────────────────────┐
│ Add Design Link                                            [✕ Close] │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Paste a link to Figma, Loom, Miro, or another design tool         │
│                                                                      │
│  URL *                                                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ https://figma.com/file/abc123/Dashboard-Redesign          │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  🎨 Figma link detected                                            │
│                                                                      │
│  Title (Optional)                                                   │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Dashboard Mockups v2                                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Auto-generated from URL if left blank                             │
│                                                                      │
│                                                                      │
│                                        [Cancel]  [Add Link]         │
└────────────────────────────────────────────────────────────────────┘
```

### 7. Mobile View - Design References (Responsive)

```
┌──────────────────────────────────┐
│ Ticket #FOR-123                  │
├──────────────────────────────────┤
│                                  │
│  [Specification] [Implementation] │
│       ^Active                    │
│                                  │
│  ▼ Design References (2)         │
│  ┌──────────────────────────┐   │
│  │ 🎨 Dashboard Mockups     │   │
│  │    figma.com/...     [↗] │   │
│  │    2 hours ago       [✕] │   │
│  ├──────────────────────────┤   │
│  │ 📹 User Flow Demo        │   │
│  │    loom.com/...      [↗] │   │
│  │    1 hour ago        [✕] │   │
│  └──────────────────────────┘   │
│  [+ Add Link]                    │
│                                  │
└──────────────────────────────────┘
```

---

## Stories

```yaml
# Phase 1: Store & Display (10-12 hours)
26-01: Backend - DesignReference Value Object & Domain Model
26-02: Backend - Add/Remove Design Reference Use Cases
26-03: Backend - API Endpoints & DTOs
26-04: Backend - AECMapper Persistence Layer
26-05: Frontend - DesignLinkInput Component for Wizard
26-06: Frontend - Wizard Store & Service Integration
26-07: Frontend - DesignReferencesSection Display Component
26-08: Frontend - Ticket Detail Design Tab Integration (NEW TAB)

# Phase 2: Metadata Enrichment (10-12 hours)
26-09: Backend - Figma OAuth Integration
26-10: Backend - Figma API Service & Metadata Fetcher
26-11: Backend - Loom OAuth Integration
26-12: Backend - Loom API Service & Metadata Fetcher
26-13: Frontend - Rich Preview Cards (Figma/Loom)
26-14: Frontend - Settings Page Integrations

# Phase 3: LLM Integration (10-12 hours)
26-15: Backend - Design Context Prompt Builder
26-16: Backend - Deep Analysis Design Phase
26-17: Backend - TechSpec Generator Design Injection
26-18: Backend - Figma Design Tokens Extraction (Optional)
26-19: Frontend - Design-Aware Spec Display

# Testing & Polish
26-20: End-to-End Testing & Verification
```

---

## Technical Details

### Architecture Overview

**Design Decision: New DesignReference Value Object (Separate from Attachments)**

**Why not extend Attachment model?**
- Attachments = uploaded files in Firebase Storage
- DesignReferences = external URLs with platform-specific metadata
- Separate concerns, cleaner domain model, enables platform APIs

**Domain Model:**
```typescript
// backend/src/tickets/domain/value-objects/DesignReference.ts
export interface DesignReference {
  id: string;                      // UUID
  url: string;                     // Validated HTTPS URL
  platform: DesignPlatform;        // Auto-detected from URL
  title?: string;                  // User-provided or fetched from API
  metadata?: DesignMetadata;       // Platform-specific (Phase 2)
  addedAt: Date;
  addedBy: string;                 // User email
}

export type DesignPlatform = 'figma' | 'loom' | 'miro' | 'sketch' | 'whimsical' | 'other';

export interface DesignMetadata {
  // Figma
  figma?: {
    fileName: string;
    thumbnailUrl: string;
    lastModified: Date;
    fileKey: string;              // Extracted from URL
  };
  // Loom
  loom?: {
    videoTitle: string;
    duration: number;             // Seconds
    thumbnailUrl: string;
    transcript?: string;          // For LLM context
    sharedId: string;             // Extracted from URL
  };
}

export const MAX_DESIGN_LINKS = 5;
```

---

### Files to Create

**Backend - Phase 1:**
```
backend/src/tickets/domain/value-objects/
  └── DesignReference.ts                           (NEW - Value object, interfaces, constants)

backend/src/tickets/application/use-cases/
  ├── AddDesignReferenceUseCase.ts                 (NEW - Add design link to ticket)
  └── RemoveDesignReferenceUseCase.ts              (NEW - Remove design link from ticket)

backend/src/tickets/presentation/dto/
  └── AddDesignReferenceDto.ts                     (NEW - DTO with URL validation)
```

**Backend - Phase 2:**
```
backend/src/integrations/figma/
  ├── figma.service.ts                             (NEW - Figma API client)
  ├── figma-oauth.controller.ts                    (NEW - OAuth flow)
  ├── figma-integration.repository.ts              (NEW - Token storage)
  └── figma-token.service.ts                       (NEW - Encrypt/decrypt tokens)

backend/src/integrations/loom/
  ├── loom.service.ts                              (NEW - Loom API client)
  ├── loom-oauth.controller.ts                     (NEW - OAuth flow)
  ├── loom-integration.repository.ts               (NEW - Token storage)
  └── loom-token.service.ts                        (NEW - Encrypt/decrypt tokens)
```

**Backend - Phase 3:**
```
backend/src/tickets/application/services/
  ├── DesignContextPromptBuilder.ts                (NEW - Build LLM prompts with design context)
  └── FigmaTokensService.ts                        (NEW - Extract design tokens from Figma)
```

**Frontend - Phase 1:**
```
client/src/tickets/components/wizard/
  └── DesignLinkInput.tsx                          (NEW - Input component for Stage 1)

client/src/tickets/components/detail/
  ├── DesignReferencesSection.tsx                  (NEW - Display section)
  └── DesignReferenceCard.tsx                      (NEW - Individual card with preview)

client/src/tickets/utils/
  └── platformIcons.ts                             (NEW - Icon mapping helper)
```

**Frontend - Phase 2:**
```
client/src/settings/components/
  ├── FigmaIntegration.tsx                         (NEW - Settings page)
  └── LoomIntegration.tsx                          (NEW - Settings page)
```

---

### Files to Modify

**Backend - Phase 1:**
```
backend/src/tickets/domain/aec/AEC.ts (line 48)
  - Add _designReferences: DesignReference[] = []
  - Add designReferences getter
  - Add addDesignReference() method (with max 5 limit)
  - Add removeDesignReference() method
  - Update reconstitute() factory to accept designReferences

backend/src/tickets/infrastructure/persistence/mappers/AECMapper.ts
  - Add designReferences field to AECDocument interface
  - Map designReferences in toDomain() method
  - Map designReferences in toPersistence() method

backend/src/tickets/presentation/controllers/tickets.controller.ts
  - Add POST /tickets/:id/design-references endpoint
  - Add DELETE /tickets/:id/design-references/:referenceId endpoint
  - Inject AddDesignReferenceUseCase and RemoveDesignReferenceUseCase

backend/src/tickets/tickets.module.ts
  - Register AddDesignReferenceUseCase provider
  - Register RemoveDesignReferenceUseCase provider
  - Register FigmaService and LoomService (Phase 2)
```

**Backend - Phase 2:**
```
backend/src/tickets/application/use-cases/AddDesignReferenceUseCase.ts
  - After adding design reference, check if platform is 'figma'
  - If yes, fetch metadata via FigmaService
  - Update reference.metadata.figma with fetched data
  - Handle gracefully if Figma not connected (metadata remains null)
  - Same logic for Loom
```

**Backend - Phase 3:**
```
backend/src/tickets/application/services/DeepAnalysisServiceImpl.ts
  - Add 'design_analysis' phase after 'file_tree_loading'
  - Fetch design references from AEC
  - Extract Figma file keys and Loom shared IDs
  - Fetch metadata via services
  - Store in taskAnalysis.designContext

backend/src/tickets/application/services/TechSpecGeneratorImpl.ts
  - In buildSystemPrompt(), append design context using DesignContextPromptBuilder
  - In buildGenerationPrompt(), reference design links in instructions
  - Inject design tokens if available from Figma
```

**Frontend - Phase 1:**
```
client/src/tickets/components/wizard/Stage1Input.tsx (line 282)
  - Add DesignLinkInput component in "Reference Materials" tab
  - Position above file upload section
  - Header: "Design Links (Optional)"

client/src/tickets/stores/generation-wizard.store.ts (line 157)
  - Add pendingDesignLinks: DesignReference[] to state
  - Add addPendingDesignLink() action
  - Add removePendingDesignLink() action
  - Upload pending design links after draft creation (parallel to file uploads)

client/src/services/ticket.service.ts (line 162)
  - Add addDesignReference(ticketId: string, dto: AddDesignReferenceDto)
  - Add removeDesignReference(ticketId: string, referenceId: string)

client/src/tickets/components/detail/TicketDetailLayout.tsx
  - Add new DesignTab (third tab) between Specification & Implementation
  - Move DesignReferencesSection to new Design tab
  - Pass onAddDesignReference and onRemoveDesignReference handlers
  - Update tab routing to include 'design' in query params
```

**Frontend - Phase 2:**
```
client/src/tickets/components/detail/DesignReferenceCard.tsx
  - Enhance with rich previews:
    - Figma: Show thumbnail image + file name + last modified
    - Loom: Show video thumbnail + duration + play icon
  - Fallback: Simple link card with platform icon

client/src/settings/components/Settings.tsx
  - Add FigmaIntegration and LoomIntegration components
  - Similar pattern to existing JiraIntegration and LinearIntegration
```

---

### API Endpoints

**Phase 1:**
```typescript
POST   /tickets/:id/design-references
  Body: { url: string, title?: string }
  Response: { designReference: DesignReference }
  Purpose: Add design link to ticket

DELETE /tickets/:id/design-references/:referenceId
  Response: { success: boolean }
  Purpose: Remove design link from ticket

GET    /tickets/:id
  Response: { ticket: AEC, designReferences: DesignReference[] }
  Purpose: Get ticket with design references (existing endpoint, add designReferences to response)
```

**Phase 2:**
```typescript
GET    /figma/oauth/start
  Query: { workspaceId: string, returnUrl: string }
  Response: Redirect to Figma OAuth
  Purpose: Initiate Figma OAuth flow

GET    /figma/oauth/callback
  Query: { code: string, state: string }
  Response: Redirect to returnUrl
  Purpose: Complete Figma OAuth, store token

GET    /loom/oauth/start
  Query: { workspaceId: string, returnUrl: string }
  Response: Redirect to Loom OAuth
  Purpose: Initiate Loom OAuth flow

GET    /loom/oauth/callback
  Query: { code: string, state: string }
  Response: Redirect to returnUrl
  Purpose: Complete Loom OAuth, store token
```

---

### Component Props

**DesignLinkInput.tsx:**
```typescript
interface DesignLinkInputProps {
  onAdd: (link: { url: string; title?: string }) => void;
  onRemove: (index: number) => void;
  links: { url: string; title?: string; platform: string }[];
  maxLinks?: number; // Default 5
}
```

**DesignReferencesSection.tsx:**
```typescript
interface DesignReferencesSectionProps {
  references: DesignReference[];
  onAdd?: () => void;
  onRemove: (referenceId: string) => void;
  readOnly?: boolean;
}
```

**DesignReferenceCard.tsx:**
```typescript
interface DesignReferenceCardProps {
  reference: DesignReference;
  onRemove: (referenceId: string) => void;
  showPreview?: boolean; // Default true
}

interface DesignReference {
  id: string;
  url: string;
  platform: DesignPlatform;
  title?: string;
  metadata?: DesignMetadata;
  addedAt: Date;
  addedBy: string;
}
```

---

## Implementation Steps

### Phase 1: Store & Display Design Links (~10-12 hours)

**Backend Tasks:**
1. Create DesignReference value object with platform detection
2. Update AEC domain model with designReferences array
3. Create Add/Remove use cases
4. Create AddDesignReferenceDto with URL validation
5. Add API endpoints to TicketsController
6. Update AECMapper for persistence

**Frontend Tasks:**
7. Create DesignLinkInput component for wizard
8. Integrate into Stage1Input "Reference Materials" tab
9. Update generation-wizard.store with pending design links
10. Add service methods to ticket.service
11. Create DesignReferencesSection display component
12. Integrate into TicketDetailLayout Implementation tab
13. Add platform icon mapping helper

---

### Phase 2: Metadata Enrichment (~10-12 hours)

**Backend Tasks:**
14. Create FigmaService with getFileMetadata() method (Figma REST API)
15. Create Figma OAuth controller (start/callback endpoints)
16. Create FigmaIntegrationRepository (workspace-level token storage, encrypted)
17. Enhance AddDesignReferenceUseCase to fetch Figma metadata after add
18. Create LoomService with getVideoMetadata() method (Loom API)
19. Create Loom OAuth controller (start/callback endpoints)
20. Enhance AddDesignReferenceUseCase to fetch Loom metadata after add

**Frontend Tasks:**
21. Enhance DesignReferenceCard with rich previews (thumbnail, title, last modified)
22. Create FigmaIntegration settings component (connect/disconnect button)
23. Create LoomIntegration settings component (connect/disconnect button)

---

### Phase 3: LLM Integration (~10-12 hours)

#### Why Do We Need LLM Integration? (Simple Explanation)

**Without LLM Integration (Phase 1 & 2 Only):**
- PM adds Figma link → Engineer sees pretty preview card
- But: LLM generates spec without knowing Figma exists
- Result: Spec says "Create a dashboard with metrics" (generic, vague)
- Engineer must manually check Figma to see layout, colors, spacing
- Disconnect between spec and design

**With LLM Integration (Phase 3):**
- PM adds Figma link → Forge passes link to LLM during spec generation
- LLM sees: "User provided Figma with 3-column layout, #6366f1 primary color, 8px spacing"
- Result: Spec says "Create dashboard with 3 columns (2fr, 3fr, 2fr), use Inter font, #6366f1 buttons"
- Engineer gets pixel-perfect acceptance criteria matching the design
- Spec and design are connected

**Real Example:**

```
❌ WITHOUT Phase 3:
Acceptance Criteria:
1. User can view dashboard
2. Dashboard shows metrics
3. Dashboard is responsive

(Engineer asks: "What layout? What colors? What breakpoints?")

✅ WITH Phase 3:
Acceptance Criteria:
1. Dashboard uses 3-column layout (widths: 2fr, 3fr, 2fr, gap: 24px)
2. Metrics cards use design tokens:
   - Primary color: #6366f1
   - Font family: Inter
   - Border radius: 8px
   - Card shadow: 0 1px 3px rgba(0,0,0,0.1)
3. Responsive breakpoints match Figma:
   - Desktop (1024px+): 3 columns
   - Tablet (768-1023px): 2 columns
   - Mobile (<768px): 1 column stacked

(Engineer has exact specs, no guessing)
```

**Value Proposition:**
- **For Engineers:** Clear, pixel-perfect requirements (no back-and-forth)
- **For PMs:** Specs automatically match design (no manual translation)
- **For QA:** Testable acceptance criteria with exact values
- **Result:** 10-15% higher spec quality, faster implementation, fewer bugs

---

**Backend Tasks:**
24. Create DesignContextPromptBuilder helper (build LLM prompts with design references)
25. Enhance DeepAnalysisService with 'design_analysis' phase (fetch metadata, store in taskAnalysis)
26. Inject design context into TechSpecGenerator prompts (buildSystemPrompt + buildGenerationPrompt)
27. Create FigmaTokensService to extract design tokens (colors, typography, spacing) - OPTIONAL

**Frontend Tasks:**
28. Enhance SpecificationTab to show "Design-Driven" badge when design refs exist
29. Add "View Design" button next to relevant spec sections (links to Figma/Loom)

---

## Validation & Business Rules

- URL validation: HTTPS only, max 2048 characters
- Platform detection via regex: Figma `/figma\.com\/(file|proto|design)/`, Loom `/loom\.com\/(share|embed)/`
- Max 5 design links per ticket (enforced in domain)
- Design links always optional (never required)
- OAuth tokens encrypted in database
- Workspace-level integrations (similar to Jira/Linear pattern)

---

## Key Files

**Backend Critical:**
- `domain/value-objects/DesignReference.ts` (NEW) - Core value object
- `domain/aec/AEC.ts` (line 48) - Add designReferences array
- `use-cases/AddDesignReferenceUseCase.ts` (NEW)
- `use-cases/RemoveDesignReferenceUseCase.ts` (NEW)
- `integrations/figma/figma.service.ts` (NEW)
- `integrations/loom/loom.service.ts` (NEW)
- `services/DesignContextPromptBuilder.ts` (NEW)
- `services/TechSpecGeneratorImpl.ts` - Inject design context

**Frontend Critical:**
- `components/wizard/DesignLinkInput.tsx` (NEW)
- `components/wizard/Stage1Input.tsx` (line 282) - Add input
- `components/detail/DesignReferencesSection.tsx` (NEW)
- `stores/generation-wizard.store.ts` (line 157) - Add state
- `services/ticket.service.ts` (line 162) - Add methods
- `settings/components/FigmaIntegration.tsx` (NEW)
- `settings/components/LoomIntegration.tsx` (NEW)

---

## Success Criteria

**Phase 1 (Store & Display):**
- ✅ Add 0-5 design links during ticket creation (Figma/Loom URLs)
- ✅ Platform auto-detection works (icon changes based on URL)
- ✅ Links display in Implementation tab with external link icon
- ✅ Links open in new tab, can be removed post-creation
- ✅ TypeScript errors = 0, build passes

**Phase 2 (Metadata Enrichment):**
- ✅ OAuth flows work for Figma and Loom
- ✅ Figma previews show thumbnail, file name, last modified
- ✅ Loom previews show video thumbnail, title, duration
- ✅ Metadata fetches in background (non-blocking)
- ✅ Graceful fallback if platform not connected

**Phase 3 (LLM Integration):**
- ✅ Tech specs reference Figma designs in problem statement
- ✅ Visual expectations link to Figma screens
- ✅ Acceptance criteria include pixel-perfect design checks
- ✅ Loom transcripts enhance user story context
- ✅ Design-driven tickets score 10-15% higher quality

**Testing:**
- Unit tests: Platform detection, add/remove methods, max limit
- Integration tests: POST/DELETE design references endpoints
- E2E tests: Add link in wizard, display in detail, remove link
- Performance: Metadata fetch <3s, ticket detail load <500ms

**Edge Cases Handled:**
- Invalid URLs → validation error
- Max 5 links → 6th link rejected
- Platform not connected → link saved, metadata null
- API rate limits → log error, don't block

---

## Effort & Dependencies

**Total: 30-35 hours**
- Phase 1: 10-12 hours (backend domain + frontend UI)
- Phase 2: 10-12 hours (OAuth + API integrations)
- Phase 3: 10-12 hours (LLM prompt engineering)

**Setup Required:**
- Figma OAuth app registration (1 hour)
- Loom OAuth app registration (1 hour)

**Phases can be implemented sequentially:** Phase 1 → Phase 2 → Phase 3
**No blocking dependencies** (can start immediately)

---

## Technical Deep-Dive: Metadata Caching Strategy

### Problem: API Rate Limits

**Figma API Limits:**
- 200 requests per minute per access token
- If workspace has 100 tickets with Figma links, loading ticket list could hit rate limit

**Loom API Limits:**
- 100 requests per minute per access token
- Fetching video transcripts is slow (3-5 seconds per video)

### Solution: Smart Caching with Fallbacks

#### Architecture
```typescript
interface CachedMetadata {
  referenceId: string;           // Design reference ID
  metadata: DesignMetadata;      // Fetched metadata (thumbnail, title, etc.)
  cachedAt: Date;                // When it was cached
  expiresAt: Date;               // When cache expires (24h)
  fetchAttempts: number;         // Retry count
  lastError?: string;            // Last API error (for debugging)
}
```

#### Cache Flow

**When User Adds Design Link:**
```
1. User pastes Figma URL → POST /tickets/:id/design-references
2. Backend validates URL, saves design reference to database
3. Backend immediately returns response (non-blocking)
4. Background job triggers: FetchMetadataJob
   - Checks if metadata already cached (by URL)
   - If cached and not expired → Skip API call
   - If not cached or expired → Call Figma/Loom API
   - Store metadata in cache (Redis or Firestore subcollection)
   - Update design reference with metadata
5. Frontend polls or listens to SSE for metadata updates
```

**When User Views Ticket:**
```
1. Frontend requests ticket: GET /tickets/:id
2. Backend returns ticket with design references
3. For each design reference:
   - If metadata exists in cache → Include in response
   - If metadata missing → Include reference without metadata
4. Frontend renders:
   - If metadata present → Show rich preview card
   - If metadata missing → Show simple link card
   - If API failed → Show link with "Preview unavailable" message
```

#### Implementation Details

**Cache Storage (Firestore Subcollection):**
```
workspaces/{workspaceId}/design-metadata/{referenceUrl-hash}/
  - metadata: { figma: {...}, loom: {...} }
  - cachedAt: Timestamp
  - expiresAt: Timestamp (cachedAt + 24 hours)
  - fetchAttempts: number
  - lastError: string | null
```

**Why Firestore instead of Redis?**
- Already using Firestore for persistence
- No additional infrastructure needed
- TTL can be implemented with Cloud Functions scheduled job
- Survives server restarts

**Cache Expiration:**
- **Default TTL:** 24 hours (metadata rarely changes daily)
- **Manual Refresh:** User can click "Refresh Preview" button (resets cache)
- **Auto-Refresh:** Background job runs nightly to refresh stale caches

**Rate Limit Handling:**
```typescript
// backend/src/integrations/figma/figma.service.ts
async getFileMetadata(fileKey: string, accessToken: string): Promise<FigmaMetadata> {
  try {
    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 'X-Figma-Token': accessToken },
    });

    if (response.status === 429) {
      // Rate limit hit
      const retryAfter = response.headers.get('Retry-After'); // Seconds
      this.logger.warn(`Figma rate limit hit, retry after ${retryAfter}s`);

      // Store error in cache
      await this.cacheService.saveMetadataError(fileKey, 'Rate limit exceeded');

      // Return null (frontend shows simple link)
      return null;
    }

    if (response.status === 403) {
      // Token expired or invalid
      this.logger.error(`Figma token invalid for fileKey ${fileKey}`);
      await this.cacheService.saveMetadataError(fileKey, 'Invalid token');
      return null;
    }

    const data = await response.json();
    return {
      fileName: data.name,
      thumbnailUrl: data.thumbnailUrl,
      lastModified: new Date(data.lastModified),
      fileKey,
    };
  } catch (error) {
    this.logger.error(`Figma API error: ${error.message}`);
    return null; // Graceful fallback
  }
}
```

**Frontend Fallback UI:**
```tsx
// client/src/tickets/components/detail/DesignReferenceCard.tsx
export function DesignReferenceCard({ reference }: Props) {
  if (reference.metadata?.figma) {
    // Rich preview with thumbnail
    return (
      <div className="preview-card">
        <img src={reference.metadata.figma.thumbnailUrl} />
        <h4>{reference.metadata.figma.fileName}</h4>
        <p>Last modified: {formatDate(reference.metadata.figma.lastModified)}</p>
      </div>
    );
  }

  // Simple link fallback (no metadata available)
  return (
    <div className="simple-card">
      <FigmaIcon />
      <span>{reference.title || getTruncatedUrl(reference.url)}</span>
      <ExternalLink href={reference.url} />
      {reference.lastError && (
        <Tooltip content={reference.lastError}>
          <AlertCircle className="error-icon" />
        </Tooltip>
      )}
    </div>
  );
}
```

#### Benefits

1. **Non-Blocking:** Users can add design links immediately, metadata loads in background
2. **Resilient:** If API fails, users still see links (just without previews)
3. **Cost-Efficient:** 24h cache means 1 API call per reference per day (instead of per page load)
4. **Better UX:** Fast page loads (no waiting for API responses)
5. **Rate Limit Safe:** Won't hit Figma/Loom rate limits even with hundreds of tickets

#### Cache Invalidation Strategy

**When to Invalidate Cache:**
- User clicks "Refresh Preview" button → Force API call, ignore cache
- Design reference deleted → Delete cached metadata
- OAuth token refreshed → Keep cache (token doesn't affect metadata)
- Nightly job → Refresh metadata older than 7 days (optional)

**When NOT to Invalidate:**
- User views ticket (read-only action) → Serve from cache
- Ticket updated (unrelated to design links) → Keep cache

---

## Risks & Future Enhancements

**Risks:**
- **Figma/Loom API rate limits** → Mitigated with 24h caching, graceful fallbacks to simple links
- **OAuth token expiry** → Implement refresh flow, show "Reconnect" message in settings
- **LLM context too long** → Truncate Loom transcripts to first 1000 words
- **Cache storage growth** → Implement TTL cleanup (delete metadata older than 30 days)

**Out of Scope (Future):**
- Visual regression testing (Figma vs implementation screenshot comparison)
- Extract design tokens from Figma styles API
- Additional platforms: Sketch, InVision, Zeplin, Framer
- Generate React/Vue code snippets from Figma components
- Two-way sync: Push screenshots back to Figma comments
