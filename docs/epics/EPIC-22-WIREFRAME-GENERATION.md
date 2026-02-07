# Epic 22: AI Wireframe Generation from Tickets

**Status:** Backlog
**Priority:** P2 (High perceived value — visual output from text input)
**Planned Start:** Phase 5
**Dependencies:** None (standalone, enhanced by Epic 1 for image context)

## Summary

Add a "Generate Wireframe" button to tickets that produces UX wireframes in Excalidraw format (`.excalidraw` JSON) based on the ticket description, tech spec, and detected UI components. Uses LLM to plan screen layouts and generate structured wireframe elements following the BMAD frame-expert pattern.

**Output:** `.excalidraw` file stored as a ticket artifact — viewable in Excalidraw (desktop app or excalidraw.com), downloadable, and attachable to Linear/Jira exports.

## How It Works

### Inspiration: BMAD create-wireframe Workflow

The BMAD `create-wireframe` workflow (`.bmad/bmm/workflows/frame-expert/create-wireframe/`) demonstrates:

1. **Structured Excalidraw generation** — Uses templates (`.yaml`), helpers (`.md`), and a component library (`.json`) to produce valid Excalidraw JSON
2. **Fidelity levels** — Low (basic shapes), Medium (defined elements), High (detailed, realistic sizing)
3. **Device awareness** — Desktop, Mobile, Tablet, Responsive
4. **Element system** — Containers, headers, content areas, navigation, buttons, inputs, labels, annotations
5. **Grid alignment** — 20px grid, consistent spacing
6. **Validation** — JSON syntax check + content quality checklist

### Forge Adaptation

Instead of interactive Q&A (BMAD style), Forge auto-derives wireframe requirements from:
- **Ticket description** → What the feature does
- **Tech spec** → What components are needed (UI sections, forms, lists, modals)
- **Detected file paths** → Which pages/components will be created/modified
- **API endpoints** → What data the UI will display (from Epic 20)
- **Project stack** → React/Next.js patterns, existing component library

The LLM generates the wireframe plan, then produces Excalidraw JSON using the BMAD helpers/templates.

## Stories

### 22-1: Wireframe Generation Service (Backend)
**Layer:** Backend (application + infrastructure)
**Effort:** 1 week

Create the backend service that takes a ticket's context and generates Excalidraw JSON.

**Acceptance Criteria:**
- `WireframeGeneratorService` accepts ticket description, tech spec, and UI component list
- Service uses LLM to plan wireframe screens (what screens, what elements per screen)
- LLM output is transformed into valid Excalidraw JSON using BMAD templates/helpers
- Supports fidelity levels: low (default), medium, high
- Supports device types: desktop (default), mobile, responsive
- Generated JSON validates as proper Excalidraw format
- Wireframe includes: screen containers, headers, content areas, navigation, buttons, inputs, labels

**Files:**
- `backend/src/tickets/application/services/WireframeGeneratorImpl.ts` — **new** service
- `backend/src/tickets/application/ports/WireframeGeneratorPort.ts` — **new** port
- `backend/src/tickets/domain/wireframe/ExcalidrawSchema.ts` — **new** Excalidraw type definitions
- Reuse BMAD templates: `.bmad/bmm/workflows/frame-expert/_shared/excalidraw-templates.yaml`
- Reuse BMAD helpers: `.bmad/bmm/workflows/frame-expert/_shared/excalidraw-helpers.md`

### 22-2: Wireframe API Endpoint (Backend)
**Layer:** Backend (presentation)
**Effort:** 2-3 days

Expose wireframe generation as an API endpoint with SSE streaming for progress.

**Acceptance Criteria:**
- `POST /tickets/:id/generate-wireframe` endpoint
- Request body: `{ fidelity?: 'low' | 'medium' | 'high', deviceType?: 'desktop' | 'mobile' | 'responsive' }`
- SSE streaming for progress (planning → generating → validating → complete)
- Returns Excalidraw JSON on completion
- Stores generated wireframe as ticket artifact (Firebase Storage)
- Saves artifact reference on AEC domain (`wireframeArtifacts: ArtifactRef[]`)

**Files:**
- `backend/src/tickets/presentation/controllers/tickets.controller.ts` — add endpoint
- `backend/src/tickets/presentation/dto/GenerateWireframeDto.ts` — **new** DTO

### 22-3: Wireframe Viewer & Download (Frontend)
**Layer:** Frontend (presentation + stores)
**Effort:** 1 week

Add wireframe section to ticket detail page with generation trigger, progress display, and download.

**Acceptance Criteria:**
- Ticket detail page has "Wireframes" section
- "Generate Wireframe" button with options (fidelity, device type)
- Real-time progress display during generation (SSE)
- Generated wireframe shown as preview (render Excalidraw elements as simple SVG)
- Download button → saves `.excalidraw` file
- **In-app Excalidraw viewer** using `@excalidraw/excalidraw` React component (interactive, zoomable, pannable)
- "Open in Excalidraw" link → opens excalidraw.com with the file (fallback)
- Multiple wireframes per ticket (different fidelity/device combos)
- Delete wireframe option

**Dependencies:**
- `npm install @excalidraw/excalidraw` — official React component for rendering/editing Excalidraw files in-app

**Files:**
- `client/app/(main)/tickets/[id]/page.tsx` — add wireframes section
- `client/src/tickets/components/WireframeSection.tsx` — **new** wireframe section component
- `client/src/tickets/components/WireframeViewer.tsx` — **new** wrapper around `@excalidraw/excalidraw` component
- `client/src/services/ticket.service.ts` — add `generateWireframe()` method
- `client/src/stores/tickets.store.ts` — add wireframe generation state

### 22-4: Smart Screen Detection from Specs
**Layer:** Backend (application)
**Effort:** 3-5 days

Enhance the wireframe generator to intelligently detect what screens/pages the ticket requires based on the tech spec and file paths.

**Acceptance Criteria:**
- Auto-detect screens from tech spec (e.g., "Create pricing page" → pricing screen)
- Detect UI patterns from file paths (e.g., `app/(main)/settings/page.tsx` → settings screen)
- Detect form fields from API request payloads (from Epic 20-4 API editor data)
- Detect list/table views from API response arrays
- Detect modals/dialogs from acceptance criteria mentions
- Present detected screens to user for confirmation before generating

**Files:**
- `backend/src/tickets/application/services/WireframeGeneratorImpl.ts` — screen detection logic
- Prompt engineering to extract UI structure from tech specs

## Implementation Order

```
22-1: Wireframe Generation Service  ← Foundation (LLM → Excalidraw JSON)
  ↓
22-2: API Endpoint                  ← Expose as SSE endpoint
  ↓
22-3: Frontend Viewer & Download    ← Button, progress, preview, download
  ↓
22-4: Smart Screen Detection        ← Auto-detect screens from spec context
```

## Technical Architecture

### Generation Pipeline

```
Ticket Context (description + tech spec + API endpoints + file paths)
  ↓
LLM Planning Phase
  → Identify screens needed
  → List UI elements per screen
  → Map navigation flow
  ↓
LLM Generation Phase (using BMAD helpers as prompt context)
  → Generate Excalidraw element definitions
  → Apply grid alignment (20px)
  → Apply theme/fidelity settings
  ↓
JSON Assembly
  → Combine elements into valid Excalidraw format
  → Validate JSON syntax
  ↓
Storage
  → Upload to Firebase Storage (workspaces/{wid}/tickets/{aid}/wireframes/)
  → Save artifact reference on AEC
```

### In-App Viewer

Use `@excalidraw/excalidraw` (official React component) for in-app rendering:

```tsx
import { Excalidraw } from '@excalidraw/excalidraw';

<Excalidraw
  initialData={{ elements: wireframeElements, appState: { viewBackgroundColor: '#ffffff' } }}
  viewModeEnabled={true}  // read-only by default
  zenModeEnabled={true}   // clean UI
/>
```

Benefits:
- Full interactive viewer (zoom, pan, select) inside Forge
- No need to leave the app to view wireframes
- Can toggle between view-only and edit mode
- Same rendering as excalidraw.com

### Excalidraw Output Structure

```json
{
  "type": "excalidraw",
  "version": 2,
  "elements": [
    // Screen containers (rectangles)
    // Headers (text + rectangles)
    // Content areas (grouped elements)
    // Buttons (rounded rectangles + text)
    // Input fields (rectangles + placeholder text)
    // Navigation (arrows between screens)
    // Annotations (text labels)
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  }
}
```

### LLM Prompt Strategy

**System prompt includes:**
- BMAD `excalidraw-helpers.md` (how to create valid elements)
- BMAD `excalidraw-templates.yaml` (element dimensions/spacing)
- Fidelity guidelines (low/medium/high detail levels)
- Device dimensions (desktop: 1440x900, mobile: 375x812, etc.)

**User prompt includes:**
- Ticket title and description
- Tech spec summary (if available)
- Detected UI components/screens
- API endpoint shapes (request/response → form fields, data tables)

## Cross-Epic Synergies

| Epic | Enhancement |
|------|------------|
| Epic 1 (Images) | User-uploaded mockups → LLM uses as reference for wireframe style |
| Epic 3 (Artifacts) | Wireframes stored as artifacts alongside tech spec docs |
| Epic 5 (Export) | Wireframes attached to Linear/Jira issues |
| Epic 20 (API Editor) | API request/response shapes → auto-generate form fields and data displays |

## Success Metrics

- Users can generate a wireframe from any ticket in < 30 seconds
- Generated wireframes are valid Excalidraw JSON (opens without errors)
- Wireframes show correct screens based on ticket description
- At least 70% of wireframe elements are relevant (not random)
