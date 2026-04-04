# Visual Annotation & Preview — Design Spec

## Context

Users currently get a preview of their app after a develop session completes, but have no way to provide precise visual feedback. Describing UI issues in text ("the button on the second card is too small") is ambiguous and error-prone. We need a visual annotation system that captures structured DOM metadata (CSS selectors, computed styles, box model, accessibility) alongside user comments, so Claude can make targeted, precise fixes.

This system is designed as a **generic visual editing primitive** that powers two workflows:
1. **Session feedback** — annotate after a session → trigger another session with annotation context
2. **Playground** (future) — select any branch → annotate → create a new PR

The annotation engine is extracted from [pi-annotate](https://github.com/nicobailon/pi-annotate), a Chrome extension with ~800 LOC of vanilla JS that captures exactly the metadata an LLM needs for UI changes.

---

## Architecture

### Approach: Upgraded Preview Tab (Approach C)

The `/preview` page is upgraded from a bare WebContainer iframe into a full Forge experience with toolbar, annotation sidebar, and branch selector. It remains a separate tab (required for WebContainer's COEP/COOP headers).

### System Diagram

```
Preview Page (/preview)
├── Toolbar: [Branch selector] [Annotate] [Refresh] [Submit Feedback] [Create PR]
├── WebContainer iframe (user's app)
│   └── forge-annotate.js (injected on demand)
│        ↓ postMessage({ type: "forge:annotation-complete", data })
├── Annotation Sidebar (slides in during annotation mode)
│   ├── Annotation cards (one per selected element)
│   ├── Comment textareas
│   └── Action buttons
└── BroadcastChannel("forge:preview") ←→ Main Forge App
                                            ↓
                                      StartSessionUseCase (with annotation context)
                                            ↓
                                      E2B Sandbox (Claude makes targeted fixes)
                                            ↓
                                      Session completes → preview:refresh
```

### Data Flow (End-to-End Loop)

1. User clicks **Annotate** → `forge-annotate.js` injected into WebContainer iframe via postMessage
2. User hovers/clicks elements → iframe sends selection data to parent via postMessage
3. Preview page renders annotation cards in sidebar with auto-captured CSS metadata
4. User types comments per element + optional general context
5. User clicks **Submit Feedback** → annotation data sent via `BroadcastChannel("forge:preview")` to main app
6. Main app starts new E2B session on **same branch** with annotation context injected into Claude's system prompt
7. Claude reads exact selectors + current styles + user comments → makes targeted fixes → pushes to branch
8. Session completes → main app sends `preview:refresh` via BroadcastChannel
9. Preview page re-fetches branch files from GitHub API → WebContainer remounts → user sees updated app
10. User can annotate again (repeat from step 1)

---

## Data Model

### AnnotationResult (sent from preview → main app)

```typescript
interface AnnotationResult {
  success: boolean;
  elements: AnnotatedElement[];
  prompt?: string;          // General context from user
  url: string;              // Preview URL
  viewport: { width: number; height: number };
}

interface AnnotatedElement {
  selector: string;         // Auto-generated CSS selector (ID, tag.class, or nth-of-type path)
  tag: string;
  id: string | null;
  classes: string[];
  text: string;             // Truncated text content (max 500 chars)
  rect: { x: number; y: number; width: number; height: number };
  comment: string;          // User's feedback for this element
  keyStyles: Record<string, string>;    // Non-default computed styles
  boxModel: {
    content: { width: number; height: number };
    padding: { top: number; right: number; bottom: number; left: number };
    border: { top: number; right: number; bottom: number; left: number };
    margin: { top: number; right: number; bottom: number; left: number };
  };
  accessibility: {
    role: string | null;
    name: string | null;
    focusable: boolean;
    disabled: boolean;
  };
}
```

### BroadcastChannel Protocol

Channel name: `"forge:preview"`

**Preview tab → Main app:**
```typescript
{ type: "annotation:submit", annotations: AnnotationResult, repo: string, branch: string }
{ type: "annotation:create-pr", annotations: AnnotationResult, repo: string, branch: string }
```

**Main app → Preview tab:**
```typescript
{ type: "preview:refresh", repo: string, branch: string }
{ type: "session:status", status: string }
```

---

## Components

### 1. forge-annotate.js (Client — injected into iframe)

**Location:** `client/public/forge-annotate.js`

Extracted from pi-annotate's `content.js`. Vanilla JS, no dependencies. Injected into the WebContainer iframe on demand.

**What it does:**
- Element picker: `document.elementFromPoint()` on mousemove, parent chain via `parentElement`
- Hover highlight: fixed-position div with accent border
- Tooltip: shows tag, id, classes, dimensions on hover
- Click to select: stores element reference + captures metadata
- Multi-select: Shift+click adds to selection
- Parent traversal: Alt+scroll cycles through ancestor chain
- Numbered badges: overlay badges (①②③) on selected elements
- Data capture: selector generation, `getComputedStyle()`, box model calc, accessibility info

**What's removed vs pi-annotate:**
- `chrome.runtime.sendMessage` → `window.parent.postMessage`
- `chrome.runtime.onMessage` → `window.addEventListener("message")`
- Screenshots (captureVisibleTab) → removed entirely; structured data is more useful to Claude
- Floating note cards → removed; comments live in sidebar (parent page)
- Bottom control panel → removed; controls live in toolbar (parent page)

**Activation protocol:**
```javascript
// Parent sends to iframe:
iframe.contentWindow.postMessage({ type: "forge:activate" }, "*");

// Iframe sends back on element selection:
window.parent.postMessage({
  type: "forge:element-selected",
  element: { selector, tag, classes, rect, keyStyles, boxModel, accessibility, text }
}, "*");

// Iframe sends back on element deselection:
window.parent.postMessage({ type: "forge:element-deselected", index: number }, "*");

// Parent sends to deactivate:
iframe.contentWindow.postMessage({ type: "forge:deactivate" }, "*");
```

### 2. Preview Page Upgrade (Client — React)

**Location:** `client/app/preview/page.tsx` (existing, upgraded)

**New UI elements:**
- **Toolbar:** Forge logo, branch selector dropdown, repo name, status indicator, Annotate button, action buttons
- **Annotation sidebar:** slides in from right when annotation mode is active, contains annotation cards, general context textarea, Submit Feedback / Create PR buttons
- **Annotation cards:** numbered badge, CSS selector (monospace), captured style summary, comment textarea, remove button

**State management:**
- `annotationMode: boolean` — whether annotation mode is active
- `annotations: AnnotatedElement[]` — current annotations with comments
- `selectedBranch: string` — branch loaded in WebContainer

**Branch selector:**
- Fetches branches from GitHub API (existing endpoint or new lightweight one)
- Changing branch re-fetches files and remounts WebContainer
- Enables the generic "load any branch" flow for playground

### 3. Annotation Store (Client — Zustand)

**Location:** `client/src/preview/stores/annotation.store.ts`

```typescript
interface AnnotationStore {
  // State
  annotations: AnnotatedElement[];
  annotationMode: boolean;
  generalPrompt: string;

  // Actions
  activateAnnotation: () => void;
  deactivateAnnotation: () => void;
  addElement: (element: AnnotatedElement) => void;
  removeElement: (index: number) => void;
  updateComment: (index: number, comment: string) => void;
  setGeneralPrompt: (prompt: string) => void;
  submitFeedback: (repo: string, branch: string) => void;
  createPlaygroundPR: (repo: string, branch: string) => void;
  reset: () => void;
}
```

Handles postMessage events from iframe, manages annotation list, broadcasts via BroadcastChannel on submit.

### 4. Annotation Formatter (Backend — NestJS)

**Location:** `backend/src/sessions/application/services/AnnotationFormatter.ts`

Converts `AnnotationResult` into structured markdown appended to Claude's system prompt:

```markdown
## VISUAL FEEDBACK FROM USER

The user previewed the app and annotated N elements with feedback.
Fix each element according to their comments. Work on the SAME branch.

### Element 1: {selector}
- Tag: {tag} | Classes: {classes}
- Current styles: {key style properties}
- Box model: content {w}×{h}, padding {values}
- Accessibility: role={role}, name={name}
- User comment: "{comment}"

### General context:
"{prompt}"
```

### 5. Session Integration (Backend — extended)

**Modified files:**
- `StartSessionUseCase` — accepts optional `annotations` parameter
- `SessionOrchestrator` — passes formatted annotation context to system prompt
- `sessions.controller.ts` — accepts annotations in request body

**New endpoint or extended existing:**
```
POST /api/sessions/{ticketId}/start
Body: { ...existing, annotations?: AnnotationResult }
```

For playground (future): new endpoint that creates a ticket + session in one step from annotations.

---

## Preview Page States

1. **Loading** — WebContainer booting, npm installing, dev server starting (existing)
2. **Running** — app preview visible, toolbar shows green status, Annotate button enabled
3. **Annotation Mode** — purple toolbar border, mode indicator, sidebar visible, element picker active in iframe
4. **Submitting** — after Submit Feedback clicked, shows "Starting session..." state, sidebar disabled
5. **Refreshing** — after session completes and preview:refresh received, re-fetching files, remounting

---

## Interaction Model

| Action | Behavior |
|--------|----------|
| Click element | Select (single mode) — replaces previous selection |
| Shift+Click | Multi-select — adds to selection |
| Alt+Scroll | Traverse parent/child chain |
| Hover | Highlight with dashed border + tooltip (tag, size, selector) |
| Esc | Deactivate annotation mode |
| Click badge on element | Scroll corresponding sidebar card into view |
| Click ✕ on sidebar card | Remove annotation, remove badge from preview |

---

## Entry Points

### From Session Completion (feedback loop)
1. Session completes → `SessionSummary` shows "Preview" button (existing)
2. Opens `/preview` with `repo` and `branch` params from session
3. User annotates → clicks "Submit Feedback"
4. BroadcastChannel sends `annotation:submit` to main app
5. Main app starts new session on same branch with annotation context

### From Playground (future)
1. User navigates to preview directly (new entry point in sidebar/nav)
2. Selects repo + branch from dropdown
3. Annotates → clicks "Create Playground PR"
4. BroadcastChannel sends `annotation:create-pr` to main app
5. Main app creates ephemeral ticket + session on new branch → PR created

---

## What's Reused (No Changes)

- WebContainer boot + file mounting (existing preview page logic)
- GitHub API file fetching — already supports any branch via `?branch=` param
- E2B sandbox + Claude Code execution (existing SessionOrchestrator)
- SSE session streaming (existing)
- PreviewPanel modal for initial launch (existing)
- Session store (existing, extended to handle BroadcastChannel)

---

## Verification

1. **forge-annotate.js unit test:** inject into a simple HTML page, verify element selection produces correct data structure with selectors, styles, box model
2. **postMessage integration:** verify iframe → parent communication works with correct origin handling
3. **BroadcastChannel integration:** open two tabs, verify messages flow correctly between preview and main app
4. **Annotation formatting:** unit test AnnotationFormatter with sample AnnotationResult, verify markdown output
5. **End-to-end:** complete a session → open preview → annotate element → submit feedback → verify new session starts with annotation context in prompt → verify Claude receives the selector/style/comment data
6. **Branch switching:** change branch in selector → verify WebContainer remounts with new files
