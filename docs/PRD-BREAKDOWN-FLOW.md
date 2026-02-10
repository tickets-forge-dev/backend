# PRD Breakdown Feature - Complete Flow Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

Step 1: INPUT (Frontend)
    ↓
Step 2: ANALYZE (Backend LLM)
    ↓
Step 3: REVIEW & EDIT (Frontend)
    ↓
Step 4: CREATE (Backend Database)
    ↓
DONE: Tickets in Database
```

---

## Detailed Step-by-Step Flow

### **STEP 1: PRD Input (Frontend)**

**User Actions:**
```
1. Navigate to /tickets/breakdown
2. Paste PRD text (100-50,000 chars)
3. Enter repository owner & name (for tech stack context)
4. (Optional) Enter project name
5. Click "Analyze PRD"
```

**Component Stack:**
```
/tickets/breakdown/page.tsx (Step Router)
  ↓
PRDInputForm.tsx
  ├─ Input field: prdText
  ├─ Input fields: repositoryOwner, repositoryName, projectName
  └─ Button: "Analyze PRD" → triggers API call
```

**State Management:**
```
prd-breakdown.store (Zustand)
├─ setPRDText(text)
├─ setRepository(owner, name)
├─ setProjectName(name)
└─ setAnalyzing(true)
```

**API Call:**
```
POST /tickets/breakdown/prd
Headers: Authorization: Bearer {firebaseToken}
Body: {
  prdText: string,
  repositoryOwner: string,
  repositoryName: string,
  projectName?: string
}
```

---

### **STEP 2: Analyze PRD (Backend)**

**Backend Processing:**

```
POST /tickets/breakdown/prd (TicketsController)
  ↓
PRDBreakdownUseCase.execute()
  ├─ Validate PRD text (100-50k chars)
  └─ Call PRDBreakdownService.breakdown()
      ↓
      PRDBreakdownService (LLM-driven workflow)
      ├─ Step 1: Extract Functional Requirements
      │   └─ LLM prompt: "Extract all FRs from PRD"
      │   └─ Output: FR1, FR2, FR3... (flat list)
      │
      ├─ Step 2: Propose Epic Structure
      │   └─ LLM prompt: "Group FRs into epics by USER VALUE"
      │   └─ Output: Epic 1, Epic 2, Epic 3...
      │   └─ Anti-pattern check: Not technical layers!
      │
      ├─ Step 3: Generate Stories (Per Epic)
      │   └─ For each epic:
      │       └─ LLM prompt: "Break epic into vertically-sliced stories"
      │       └─ Output: Story 1.1, 1.2, 1.3... (with BDD criteria)
      │
      ├─ Step 4: Build Summary
      │   └─ Calculate FR coverage mapping
      │   └─ Epic count, story count
      │   └─ Which FRs covered by which stories
      │
      └─ Step 5: Validate Coverage
          └─ Check all FRs mapped to at least one story
          └─ Warn on unmapped FRs (best-effort)
```

**LLM Models Supported:**
- Ollama (local, for development)
- Anthropic Claude (production)
- Future: OpenAI, Gemini, etc.

**Response Structure:**
```json
{
  "breakdown": {
    "tickets": [
      {
        "id": 101,
        "epicName": "User Authentication",
        "epicIndex": 1,
        "storyIndex": 1,
        "title": "Email signup with validation",
        "description": "As a new user, I want to...",
        "type": "feature",
        "priority": "high",
        "acceptanceCriteria": [
          {
            "given": "User is on signup page",
            "when": "User enters valid email",
            "then": "Email is validated against RFC 5322"
          }
        ],
        "functionalRequirements": ["FR1", "FR2"],
        "blockedBy": [],
        "technicalNotes": "Optional implementation hints"
      }
    ],
    "summary": {
      "totalTickets": 15,
      "epicCount": 3,
      "epics": [...],
      "frCoverage": {
        "FR1": ["Epic 1: User Authentication"],
        "FR2": ["Epic 1: User Authentication", "Epic 2: Session Management"]
      },
      "frInventory": [...]
    }
  },
  "analysisTime": 2500,
  "estimatedTicketsCount": 15
}
```

---

### **STEP 3: Review & Edit Breakdown (Frontend)**

**State Management:**
```
prd-breakdown.store (Zustand)
├─ breakdown: BreakdownResult
├─ analysisTime: number
├─ estimatedTicketsCount: number
└─ currentStep: "review"
```

**User Actions Available:**

#### **3A: View Breakdown**
```
BreakdownReview.tsx
├─ Summary cards (ticket count, epic count, analysis time)
├─ FR coverage visualization
└─ Epic groups (collapsible)
    └─ For each epic:
        ├─ Epic name, goal, FR coverage tags
        └─ List of stories with:
            ├─ Title, description, type/priority badges
            ├─ Collapsible details:
            │   ├─ BDD acceptance criteria
            │   ├─ Technical notes
            │   └─ Dependencies
            └─ Drag handle (for reordering)
```

#### **3B: Edit Ticket**
```
User clicks "Edit" button on ticket card
  ↓
Card switches to edit mode
  ├─ Editable title field
  ├─ Type dropdown (feature/bug/task)
  ├─ Priority dropdown (low/medium/high/urgent)
  └─ Save/Cancel buttons
  ↓
Store action: updateTicket(ticketId, { title, type, priority })
```

#### **3C: Delete Ticket**
```
User clicks "Delete" button on ticket card
  ↓
Store action: deleteTicket(ticketId)
  ├─ Remove from tickets array
  ├─ Remove from epic stories
  ├─ Update ticket count
  └─ Update epic if empty
```

#### **3D: Reorder Tickets (Drag & Drop)**
```
User drags ticket within epic
  ↓
TicketCard.tsx triggers onDragStart
  ├─ Visual feedback: opacity-50, grab cursor
  └─ Store draggedItem state
  ↓
EpicGroup.tsx shows drop zones
  ├─ onDragOver: Highlight drop zone
  ├─ onDrop: Execute reorder
  └─ onDragEnd: Clear state
  ↓
Store action: reorderTickets(epicIndex, fromIndex, toIndex)
  └─ Reorder stories array within epic
```

#### **3E: Add New Ticket**
```
User clicks "Add Ticket" button in epic header
  ↓
AddTicketDialog.tsx opens
  ├─ Input: title (required)
  ├─ Input: description
  ├─ Select: type (feature/bug/task)
  ├─ Select: priority (low/medium/high/urgent)
  └─ Dynamic criteria adder:
      ├─ Given (precondition)
      ├─ When (action)
      ├─ Then (expected outcome)
      └─ Add/Remove buttons
  ↓
User clicks "Add Ticket"
  ↓
Store action: addTicket(epicIndex, newTicketData)
  └─ Generate new ID
  └─ Insert into epic stories
  └─ Update totals
```

**Editing State Flow:**
```
Review State
    ├─ View mode (read-only)
    ├─ Click Edit → Edit mode
    ├─ Edit fields → updateTicket()
    ├─ Click Save → Back to view mode
    └─ Click Delete → Delete from breakdown

Drag & Drop:
    └─ Drag ticket → reorderTickets()

Add Ticket:
    └─ Modal → addTicket() → Ticket appears in epic
```

---

### **STEP 4: Create Tickets (Backend)**

**Frontend Trigger:**
```
User clicks "Create {n} Tickets" button in BreakdownReview
  ↓
Store: setCreating(true)
  ↓
API Call: POST /tickets/breakdown/bulk-create
```

**API Request:**
```
POST /tickets/breakdown/bulk-create
Headers: Authorization: Bearer {firebaseToken}
Body: {
  tickets: [
    {
      epicName: string,
      title: string,
      description: string,
      type: "feature" | "bug" | "task",
      priority: "low" | "medium" | "high" | "urgent",
      acceptanceCriteria: JSON.stringify(BDDCriterion[])
    },
    ...
  ]
}
```

**Backend Processing:**
```
POST /tickets/breakdown/bulk-create (TicketsController)
  ↓
BulkCreateFromBreakdownUseCase.execute()
  ├─ Validate inputs (100 ticket limit)
  └─ For each ticket (best-effort):
      ├─ CreateTicketUseCase.execute()
      │   └─ Create draft AEC in Firestore
      │   └─ Set status = "draft"
      │   └─ No techSpec yet
      │
      ├─ Parse and set acceptance criteria
      │   └─ Convert BDD format to acceptance criteria
      │
      ├─ Add epic name to description
      │   └─ Reference for user tracking
      │
      └─ Save AEC
          └─ On error: Add to errors list, continue
```

**Response:**
```json
{
  "createdCount": 14,
  "ticketIds": [
    "uuid-1",
    "uuid-2",
    "uuid-3",
    ...
  ],
  "errors": [
    {
      "ticketTitle": "Failed ticket",
      "error": "Error message"
    }
  ]
}
```

---

### **STEP 5: Success (Frontend)**

**State Update:**
```
API succeeds
  ↓
Store:
├─ setCreatedTicketIds(ids)
├─ moveToSuccess()
└─ setCreating(false)
  ↓
currentStep = "success"
```

**SuccessView Component:**
```
Display:
├─ Success icon & message
├─ Created count (14/15)
├─ Next steps guide:
│   1. Visit /tickets page
│   2. Click ticket to refine details
│   3. Use Deep Analysis for file changes
│   4. Answer questions to finalize spec
└─ Links:
    ├─ "Analyze Another PRD" (reset store)
    └─ "Go to Tickets" (navigate to /tickets)
```

---

## Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  /tickets/breakdown/page.tsx (Step Router)                            │
│    ├─ Step 1: PRDInputForm → collects prdText, repo, project        │
│    ├─ Step 2: BreakdownReview → edits breakdown                      │
│    └─ Step 3: SuccessView → confirmation                             │
│                                                                        │
│  prd-breakdown.store (Zustand State)                                  │
│    ├─ Input data: prdText, repo, projectName                        │
│    ├─ Breakdown: tickets[], epics[], summary                         │
│    ├─ UI state: currentStep, isAnalyzing, isCreating                │
│    └─ Actions: setPRDText, updateTicket, addTicket, deleteTicket,   │
│                reorderTickets, setBreakdown, moveToReview, etc.     │
│                                                                        │
│  Services:                                                             │
│    └─ usePRDService()                                                 │
│       ├─ breakdownPRD() → POST /tickets/breakdown/prd               │
│       └─ bulkCreateFromBreakdown() → POST /tickets/breakdown/       │
│                                       bulk-create                     │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTP
┌──────────────────────────────────────────────────────────────────────┐
│                        BACKEND (NestJS)                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  TicketsController                                                     │
│    ├─ POST /tickets/breakdown/prd                                    │
│    │   └─ PRDBreakdownUseCase.execute()                             │
│    │       └─ PRDBreakdownService.breakdown()                       │
│    │           ├─ extractFunctionalRequirements()                   │
│    │           ├─ proposeEpicStructure()                            │
│    │           ├─ generateStoriesForEpic() (per epic)              │
│    │           └─ buildSummary() & validateCoverage()              │
│    │           (Uses LLM via generateText from @ai library)         │
│    │                                                                 │
│    └─ POST /tickets/breakdown/bulk-create                           │
│        └─ BulkCreateFromBreakdownUseCase.execute()                 │
│            ├─ For each ticket:                                      │
│            │   ├─ CreateTicketUseCase.execute()                   │
│            │   │   └─ Create AEC (draft status)                   │
│            │   └─ updateAcceptanceCriteria()                      │
│            │   └─ Save to Firestore                               │
│            └─ Collect created IDs & errors (best-effort)          │
│                                                                     │
│  Domain (Clean Architecture):                                       │
│    ├─ AEC.ts (Aggregate root for ticket)                          │
│    ├─ prd-breakdown.types.ts (Domain types)                       │
│    └─ Tech spec, acceptance criteria, etc.                         │
│                                                                     │
│  Infrastructure:                                                    │
│    ├─ FirestoreAECRepository (persistence)                        │
│    ├─ LLMConfigService (model selection)                          │
│    ├─ Mastra providers (Ollama, Anthropic)                        │
│    └─ @ai library (generateText function)                         │
│                                                                     │
│  External Services:                                                 │
│    └─ LLM (Claude/Ollama) for analysis                            │
│    └─ Firestore for persistence                                   │
│    └─ Firebase Auth for user context                              │
│                                                                     │
└──────────────────────────────────────────────────────────────────────┘
                                    ↕
┌──────────────────────────────────────────────────────────────────────┐
│                          DATABASE                                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Firestore                                                             │
│    └─ /workspaces/{id}/aecs/{ticketId}                              │
│       ├─ id, title, description, status: "draft"                    │
│       ├─ type, priority, acceptanceCriteria                         │
│       ├─ createdAt, updatedAt                                       │
│       └─ (No techSpec yet - added later during enrichment)          │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## State Transitions Diagram

```
              ┌─────────────────────────┐
              │   Initial State         │
              │  (Empty breakdown)      │
              └────────────┬────────────┘
                           │
                    User fills PRD
                           │
              ┌────────────▼────────────┐
              │    Input Step           │
              │  - PRD text entered     │
              │  - Repo selected        │
              │  - Ready to analyze     │
              └────────────┬────────────┘
                           │
                 Click "Analyze PRD"
                           │
              ┌────────────▼────────────┐
              │  Analyzing (Loading)    │
              │  - LLM processing       │
              │  - Break PRD down       │
              │  - Generate stories     │
              └────────────┬────────────┘
                           │
              Analysis complete
                           │
              ┌────────────▼────────────┐
              │    Review Step          │
              │  - View breakdown       │
              │  - Edit tickets         │
              │  - Add new tickets      │
              │  - Reorder (drag drop)  │
              │  - Delete unwanted      │
              └────────────┬────────────┘
                           │
         User clicks "Create N Tickets"
                           │
              ┌────────────▼────────────┐
              │  Creating (Loading)     │
              │  - Bulk insert to DB    │
              │  - Create draft AECs    │
              │  - Best-effort approach │
              └────────────┬────────────┘
                           │
              Creation complete
                           │
              ┌────────────▼────────────┐
              │    Success Step         │
              │  - Show created count   │
              │  - Display ticket IDs   │
              │  - Next steps guide     │
              │  - Link to /tickets     │
              └────────────┬────────────┘
                           │
        User clicks "Go to Tickets"
                           │
                   Navigate to /tickets
                           │
        ┌──────────────────▼──────────────────┐
        │  Tickets List Page                   │
        │  - New tickets visible as drafts    │
        │  - Can click to refine/enrich       │
        │  - Can use Deep Analysis            │
        │  - Can answer questions             │
        │  - Can finalize spec                │
        └──────────────────────────────────────┘
```

---

## Component Hierarchy

```
/tickets/breakdown/page.tsx (Page)
├─ Step Router (currentStep)
│
├─ Step = "input"
│  └─ PRDInputForm
│     ├─ textarea (prdText)
│     ├─ input (repositoryOwner)
│     ├─ input (repositoryName)
│     ├─ input (projectName)
│     └─ button ("Analyze PRD")
│
├─ Step = "review"
│  └─ BreakdownReview
│     ├─ Summary cards
│     │  ├─ Ticket count
│     │  ├─ Epic count
│     │  └─ Analysis time
│     ├─ FR coverage info
│     └─ Epic groups (map)
│        └─ EpicGroup (per epic)
│           ├─ Epic header with metadata
│           ├─ "Add Ticket" button → AddTicketDialog
│           └─ Ticket list
│              └─ TicketCard (per story)
│                 ├─ Drag handle (GripVertical icon)
│                 ├─ Title, description, badges
│                 ├─ Edit/Delete buttons
│                 └─ Collapsible details
│
├─ Step = "success"
│  └─ SuccessView
│     ├─ Success icon & message
│     ├─ Created count
│     ├─ Next steps guide
│     └─ Action buttons
│
└─ AddTicketDialog (modal, per epic)
   ├─ Title input
   ├─ Description textarea
   ├─ Type selector
   ├─ Priority selector
   ├─ BDD criteria adder
   │  └─ Given/When/Then inputs
   └─ Buttons (Cancel/Add)
```

---

## Key Features Summary

| Feature | Component | Interaction | Result |
|---------|-----------|-------------|--------|
| **Analyze** | PRDInputForm | Click "Analyze PRD" | LLM breaks down PRD → Show breakdown |
| **View** | BreakdownReview | See epics/stories | Summary + epic groups |
| **Edit** | TicketCard | Click "Edit" | Update title/priority/type |
| **Delete** | TicketCard | Click "Delete" | Remove from breakdown |
| **Add** | AddTicketDialog | Click "Add Ticket" | Modal form → insert ticket |
| **Reorder** | TicketCard+EpicGroup | Drag ticket | Move to new position |
| **Create** | BreakdownReview | Click "Create" | Bulk insert to DB |
| **Success** | SuccessView | See confirmation | Show IDs + next steps |

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Input | Output |
|----------|--------|---------|-------|--------|
| `/tickets/breakdown/prd` | POST | Analyze PRD | PRD text + repo | Breakdown result |
| `/tickets/breakdown/bulk-create` | POST | Create tickets | List of tickets | Created IDs |

---

## Edge Cases & Error Handling

```
PRD Analysis Errors:
├─ Invalid PRD (too short/long) → Show error message
├─ LLM failure (timeout, API error) → Graceful degradation
├─ No FRs found → Show warning, still return empty breakdown
└─ Empty epics → Skip in summary

Bulk Creation Errors:
├─ Ticket 1 fails → Continue with 2, 3, 4...
├─ Validation error → Add to errors list, continue
├─ All fail → Show partial error with count
└─ Quota exceeded → Return with created count + error
```

---

## Production Considerations

```
Performance:
├─ LLM response time: ~2-5 seconds for typical PRD
├─ Bulk creation: O(n) sequential, ~500ms per ticket
├─ Frontend: ~100-200ms for UI updates
└─ Recommended for: 5-30 ticket breakdowns

Limitations:
├─ Max 100 tickets per bulk request
├─ PRD text: 100-50,000 characters
├─ LLM model reliability: Best-effort
└─ Network: Requires stable connection

Future Optimizations:
├─ Parallel bulk creation (currently sequential)
├─ Caching PRD analysis results
├─ Streaming LLM responses
├─ Batch processing for large PRDs
└─ Analytics/telemetry on breakdown quality
```
