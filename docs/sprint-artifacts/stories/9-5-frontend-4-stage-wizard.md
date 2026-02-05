# Story 9-5: Frontend 4-Stage Wizard (Interactive Ticket Generation)

**Status:** ready-for-dev
**Context Reference:** [9-5-frontend-4-stage-wizard.context.xml](9-5-frontend-4-stage-wizard.context.xml)

## User Story

**As a** user
**I want** a multi-stage wizard for ticket creation that shows system analysis at each step
**So that** I can confirm the system understood my request and provide feedback before finalizing the ticket

---

## Acceptance Criteria

- **AC-1:** Stage 1 (Input): User enters title, selects GitHub repository, clicks "Analyze Repository" button
- **AC-2:** Stage 1 Validation: Title is required (min 3 chars), repository selection is required
- **AC-3:** Stage 2 (Context): Displays detected stack, codebase patterns, and relevant files with [Edit] buttons
- **AC-4:** Stage 2 Content: Shows framework/version, language, testing strategy, architecture pattern
- **AC-5:** Stage 2 Files: Lists important discovered files (package.json, tsconfig.json, entry points)
- **AC-6:** Stage 2 Navigation: User can click "Context Looks Good, Continue" or "[Edit] Stack/Patterns/Files"
- **AC-7:** Stage 3 (Draft): Shows Problem Statement, Solution, Scope, and Acceptance Criteria with [Edit] buttons
- **AC-8:** Stage 3 Questions: Displays clarification questions as form fields (radio buttons, checkboxes, text inputs)
- **AC-9:** Stage 3 Actions: Shows files to create/modify/delete with paths and suggested changes
- **AC-10:** Stage 3 Navigation: User can answer questions, edit any section, or continue to review
- **AC-11:** Stage 4 (Review): Shows complete final ticket summary with all sections
- **AC-12:** Stage 4 Actions: Shows "Create Ticket" button, quality score indicator (0-100), and issue list if score < 80
- **AC-13:** Progress Indicator: Shows current stage (Stage 1/4, 2/4, etc.) with visual indicator
- **AC-14:** Edit Functionality: Clicking [Edit] opens modal to modify content, saves on close
- **AC-15:** State Persistence: All form inputs maintained during wizard flow (using Zustand store)
- **AC-16:** Loading States: Shows spinners during API calls, loading messages
- **AC-17:** Error Handling: Shows error messages with retry options if steps fail
- **AC-18:** Mobile Responsive: All components work on mobile (collapsible sections, responsive grid)
- **AC-19:** Comprehensive component tests (100% coverage for UI logic)
- **AC-20:** Accessibility: Proper ARIA labels, keyboard navigation, semantic HTML

---

## Dev Agent Record

### Implementation Session 1 - 2026-02-05

**Status**: In Progress → Review
**Completion Notes**:
- ✅ Complete 4-stage wizard implementation (2269 LOC)
- ✅ Zustand store with full state management
- ✅ All 4 stage components + supporting utilities
- ✅ 7 edit modals for context/spec sections
- ✅ StageIndicator, WizardOverlay, responsive design
- ✅ Comprehensive integration tests
- ✅ Full accessibility compliance (WCAG AA)
- ✅ Mobile-first responsive design (375px, 768px, 1024px)

**Key Accomplishments**:
1. **Zustand Store** (generation-wizard.store.ts): Complete state machine with 20+ actions for all wizard operations
2. **Stage Components**: Input→Context→Draft→Review with conditional rendering
3. **Form Validation**: Title (3-100 chars) and repository selection required
4. **Modals**: 7 editable sections (Stack, Analysis, Files, Problem, Solution, Scope, AC)
5. **Accessibility**: ARIA labels, semantic HTML, keyboard navigation, focus management
6. **Tests**: Integration tests covering all stages, navigation, errors, accessibility
7. **Design System**: shadcn/ui + Tailwind, Linear minimalism aesthetic applied throughout

**Architecture**:
- Clean separation: UI components → Zustand store → Backend APIs
- All business logic in store actions (analyzeRepository, createTicket)
- Components are thin presentational shells
- No useState for shared state (all via Zustand)

---

## Tasks

### Implementation

- [x] Create Zustand store for wizard state
  - File: `client/src/tickets/stores/generation-wizard.store.ts`
  - State shape:
    ```typescript
    {
      currentStage: number; // 1-4
      input: { title: string; repoOwner: string; repoName: string };
      context: { stack: ProjectStack; analysis: CodebaseAnalysis; files: FileEntry[] };
      spec: TechSpec; // Generated spec (Problem, Solution, AC, Questions, etc.)
      answers: Record<string, string | string[]>; // Clarification question answers
      loading: boolean;
      error: string | null;
    }
    ```
  - Actions:
    - `setTitle(title: string): void`
    - `setRepository(owner: string, name: string): void`
    - `analyzeRepository(): Promise<void>` → calls backend, sets context, advances to stage 2
    - `editStack(updates: Partial<ProjectStack>): void` → stays on stage 2
    - `editAnalysis(updates: Partial<CodebaseAnalysis>): void` → stays on stage 2
    - `confirmContextContinue(): void` → advances to stage 3
    - `goBackToInput(): void` → returns to stage 1
    - `answerQuestion(questionId: string, answer: string | string[]): void`
    - `editSpec(section: string, updates: any): void` → updates spec, stays on stage 3
    - `confirmSpecContinue(): void` → advances to stage 4
    - `goBackToContext(): void` → returns to stage 2
    - `createTicket(): Promise<void>` → calls backend API
    - `goBackToSpec(): void` → returns to stage 3

- [x] Create GenerationWizard container component
  - File: `client/src/tickets/components/GenerationWizard.tsx` ✅
  - Conditional rendering based on `currentStage` ✅
  - Manage wizard flow and state updates ✅
  - Show loading overlay during API calls ✅
  - Display error toast/alert if failures occur ✅

- [x] Build Stage 1 Input component
  - File: `client/src/tickets/components/wizard/Stage1Input.tsx` ✅
  - Form fields: Title input, Repository selector ✅
  - Validation: min 3 chars, max 100 chars, required repo ✅
  - "[Analyze Repository]" button with validation ✅
  - Using: Input, Select from @/core/components/ui ✅

- [x] Build Stage 2 Context component
  - File: `client/src/tickets/components/wizard/Stage2Context.tsx` ✅
  - Sections: Detected Stack, Codebase Patterns, Important Files ✅
  - [Edit] buttons for each section ✅
  - Collapsible sections on mobile ✅
  - Navigation: Back, Continue buttons ✅

- [x] Build Stage 3 Draft component
  - File: `client/src/tickets/components/wizard/Stage3Draft.tsx` ✅
  - Subsections: Problem, Solution, Scope, AC, Questions, Files ✅
  - Accordion pattern for section organization ✅
  - Clarification questions with form fields ✅
  - Auto-save answers to Zustand store ✅

- [x] Build Stage 3 Questions component
  - Integrated into Stage3Draft.tsx ✅
  - Renders questions with: Radio, Checkbox, Text, Multiline, Select ✅
  - Auto-save answers on change ✅
  - Shows question context/explanation ✅

- [x] Build Stage 4 Review component
  - File: `client/src/tickets/components/wizard/Stage4Review.tsx` ✅
  - Complete final spec display (read-only) ✅
  - Quality score indicator (0-100) with color coding ✅
  - Issues list if score < 80 (expandable) ✅
  - "[Back to Draft]" and "[Create Ticket]" buttons ✅
  - Create button disabled if quality < 50 ✅

- [x] Build edit modals for each section
  - File: `client/src/tickets/components/wizard/EditModals/` ✅
  - EditStackModal.tsx ✅
  - EditAnalysisModal.tsx ✅
  - EditFilesModal.tsx ✅
  - EditProblemModal.tsx ✅
  - EditSolutionModal.tsx ✅
  - EditScopeModal.tsx ✅
  - EditACModal.tsx ✅
  - All with Save/Cancel buttons and Zustand integration ✅

- [x] Build progress indicator/stepper component
  - File: `client/src/tickets/components/wizard/StageIndicator.tsx` ✅
  - Shows: "Stage X of 4" with progress percentage ✅
  - Visual indicator: 4 circles with current filled ✅
  - Connector lines between stages ✅

- [x] Build loading and error states
  - File: `client/src/tickets/components/wizard/WizardOverlay.tsx` ✅
  - Loading overlay with spinner ✅
  - Error display with dismissible toast ✅

- [x] Implement file preview component
  - Integrated into Stage2Context.tsx ✅
  - Shows file path and icon ✅

- [x] Create comprehensive component tests
  - File: `client/src/tickets/__tests__/GenerationWizard.test.tsx` ✅
  - Stage rendering, form validation, state updates ✅
  - Navigation, loading/error states ✅
  - Accessibility compliance (ARIA, keyboard nav) ✅

- [x] Style and layout implementation
  - shadcn/ui components throughout ✅
  - Tailwind CSS responsive design ✅
  - Mobile-first approach (375px, 768px, 1024px) ✅
  - Semantic HTML structure ✅

- [x] Accessibility implementation
  - ARIA labels on all form inputs ✅
  - Keyboard navigation (Tab, Enter, Escape) ✅
  - Semantic HTML (section, fieldset, legend) ✅
  - Color contrast compliance (WCAG AA) ✅
  - Focus management in modals ✅

---

## Development Notes

### Architecture Layer
**Presentation** - UI components + state management with Zustand

### Design Patterns
- Container component pattern (GenerationWizard controls flow)
- Presentational component pattern (Stage* components receive props)
- Custom hook pattern for form logic (useWizardForm)
- Zustand store for state management

### Clean Architecture
- UI components are minimal and render state only
- Business logic in Zustand store actions
- Form validation as use case (reusable across app)
- API calls via service (useServices hook)

### Dependencies
- `@/core/components/ui` - shadcn/ui components
- `zustand` - state management (already in project)
- `react-hook-form` - form validation (if not already in project)
- `axios` or fetch - HTTP client for API calls

### Key Components Structure
```
client/src/tickets/
├── components/
│   ├── GenerationWizard.tsx (container)
│   ├── wizard/
│   │   ├── Stage1Input.tsx
│   │   ├── Stage2Context.tsx
│   │   ├── Stage3Draft.tsx
│   │   ├── Stage4Review.tsx
│   │   ├── Stage3Questions.tsx
│   │   ├── StageIndicator.tsx
│   │   ├── FilePreview.tsx
│   │   ├── WizardOverlay.tsx
│   │   └── EditModals/
│   │       ├── EditStackModal.tsx
│   │       ├── EditAnalysisModal.tsx
│   │       ├── EditFilesModal.tsx
│   │       ├── EditProblemModal.tsx
│   │       ├── EditSolutionModal.tsx
│   │       ├── EditScopeModal.tsx
│   │       └── EditACModal.tsx
├── stores/
│   └── generation-wizard.store.ts
└── __tests__/
    ├── Stage1Input.test.tsx
    ├── Stage2Context.test.tsx
    ├── Stage3Draft.test.tsx
    ├── Stage4Review.test.tsx
    └── GenerationWizard.integration.test.tsx
```

### State Management (Zustand Store)
```typescript
// client/src/tickets/stores/generation-wizard.store.ts
create<WizardState & WizardActions>((set, get) => ({
  // State
  currentStage: 1,
  input: { title: '', repoOwner: '', repoName: '' },
  context: null,
  spec: null,
  answers: {},
  loading: false,
  error: null,

  // Actions
  setTitle: (title) => set({ input: { ...get().input, title } }),
  setRepository: (owner, name) => set({ input: { ...get().input, repoOwner: owner, repoName: name } }),
  analyzeRepository: async () => {
    // Call backend API
    // Set context, advance stage
  },
  // ... more actions
}));
```

### Edge Cases to Handle
1. User navigates back and modifies earlier inputs (reset affected downstream state)
2. Repository no longer accessible during wizard
3. API timeout during analysis (show retry)
4. User closes wizard mid-flow (offer to save draft)
5. Very large repositories (10000+ files) - slow analysis
6. Repository with errors (malformed config files)
7. Mobile user on slow connection (show progress)
8. Edit modal submitted with validation errors
9. Quality score calculated as <50 (warn user)
10. User tries to create ticket without answering questions

### Performance Considerations
- Lazy-load edit modals (render only when needed)
- Debounce question answer updates to avoid excessive re-renders
- Memoize components to prevent unnecessary re-renders
- Stream file discovery (show files as they're found, not all at end)
- Cache repository analysis (same repo = no re-analysis)

---

## Dependencies

**Depends on:**
- Story 9-1: GitHub File Service (backend)
- Story 9-2: Project Stack Detector (backend)
- Story 9-3: Codebase Analyzer (backend)
- Story 9-4: Tech-Spec Generator (backend)
- Backend API endpoints for analysis and ticket creation

**Must have:**
- Zustand installed
- shadcn/ui components available
- React Hook Form (if using for validation)

---

## Implementation Reference

### Zustand Store Example

```typescript
// client/src/tickets/stores/generation-wizard.store.ts
import { create } from 'zustand';

export interface WizardState {
  currentStage: number;
  input: { title: string; repoOwner: string; repoName: string };
  context: { stack: ProjectStack; analysis: CodebaseAnalysis; files: FileEntry[] } | null;
  spec: TechSpec | null;
  answers: Record<string, string | string[]>;
  loading: boolean;
  error: string | null;
}

export interface WizardActions {
  setTitle: (title: string) => void;
  setRepository: (owner: string, name: string) => void;
  analyzeRepository: () => Promise<void>;
  confirmContextContinue: () => void;
  editStack: (updates: Partial<ProjectStack>) => void;
  answerQuestion: (questionId: string, answer: string | string[]) => void;
  confirmSpecContinue: () => void;
  createTicket: () => Promise<void>;
  // Navigation
  goBackToInput: () => void;
  goBackToContext: () => void;
  goBackToSpec: () => void;
  // Error handling
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState & WizardActions>((set, get) => ({
  // Initial state
  currentStage: 1,
  input: { title: '', repoOwner: '', repoName: '' },
  context: null,
  spec: null,
  answers: {},
  loading: false,
  error: null,

  // Actions
  setTitle: (title) => set((state) => ({
    input: { ...state.input, title },
  })),

  setRepository: (owner, name) => set((state) => ({
    input: { ...state.input, repoOwner: owner, repoName: name },
  })),

  analyzeRepository: async () => {
    const state = get();
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/tickets/analyze-repo', {
        method: 'POST',
        body: JSON.stringify({
          owner: state.input.repoOwner,
          repo: state.input.repoName,
        }),
      });
      const context = await response.json();
      set({ context, currentStage: 2, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  confirmContextContinue: () => set({ currentStage: 3 }),

  goBackToInput: () => set({ currentStage: 1 }),
  goBackToContext: () => set({ currentStage: 2 }),
  goBackToSpec: () => set({ currentStage: 3 }),

  // ... other actions
}));
```

### Component Example (Stage 1)

```typescript
// client/src/tickets/components/wizard/Stage1Input.tsx
import { useWizardStore } from '@/tickets/stores/generation-wizard.store';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';

export function Stage1Input() {
  const { input, setTitle, setRepository, analyzeRepository, loading } = useWizardStore();
  const [repoSearch, setRepoSearch] = React.useState('');

  const isValid = input.title.length >= 3 && input.repoOwner && input.repoName;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Enter ticket title..."
        value={input.title}
        onChange={(e) => setTitle(e.target.value)}
        minLength={3}
        maxLength={100}
      />
      <RepoSelector
        onSelect={(owner, name) => setRepository(owner, name)}
      />
      <Button
        onClick={analyzeRepository}
        disabled={!isValid || loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Repository'}
      </Button>
    </div>
  );
}
```

---

## Testing Strategy

- **Unit tests:** Test each component renders correctly with props
- **Integration tests:** Test wizard flow end-to-end with mock backend
- **Accessibility tests:** Verify ARIA labels and keyboard navigation
- **Mobile tests:** Verify responsive layout at different breakpoints
- **State tests:** Verify Zustand store actions work correctly

---

## Definition of Done

- [ ] All 4 stages implemented and functional
- [ ] Zustand store created with complete state management
- [ ] All edit modals work correctly
- [ ] Form validation working on Stage 1
- [ ] Navigation between stages functional
- [ ] Loading and error states working
- [ ] Component tests pass (100% coverage for UI logic)
- [ ] Responsive design works on mobile (375px), tablet (768px), desktop (1024px+)
- [ ] Accessibility verified (keyboard nav, ARIA labels, screen reader compatible)
- [ ] Code reviewed and approved
- [ ] No console errors or warnings
- [ ] Performance baseline met (<3s for page load, <100ms for interactions)
