# Story 9-7: Iterative Question Refinement - Frontend Wireframes

> Visual design for the complete question refinement workflow

---

## 1. Main Ticket List (with Draft Badges)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔙 Tickets                                          🔍 Search  ⚙️     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Add User Authentication                        ✅ READY          │ │
│  │ Implement OAuth2 with Google and GitHub                          │ │
│  │ Created 2 days ago • Updated 1 hour ago                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Database Caching Layer                    📋 DRAFT • Round 2/3   │ │
│  │ Add Redis caching for frequently accessed queries                │ │
│  │ Created 1 day ago • Updated 30 minutes ago                       │ │
│  │                                                                   │ │
│  │ [Resume Draft]                                                   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ API Rate Limiting                         📋 DRAFT • Round 1/3   │ │
│  │ Implement rate limiting middleware for API protection           │ │
│  │ Created 30 minutes ago • Updated just now                       │ │
│  │                                                                   │ │
│  │ [Resume Draft]                                                   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Legend:**
- ✅ READY = Fully generated, ready for implementation
- 📋 DRAFT = In iterative refinement (paused between rounds)
- Round N/3 = Current progress in refinement loop

---

## 2. Stage 3 Draft - Question Refinement (MAIN VIEW)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Create Ticket > Review Context > Answer Questions > Review & Create   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ▶ Database Caching Layer                                            │
│    Add Redis caching for frequently accessed queries                 │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────   │
│  Progress: Round 2 of 3                                              │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ✅ Round 1: Initial Clarification        [Answered 5 min ago] │  │
│  │                                                                 │  │
│  │   Q: What's the cache strategy?                                │  │
│  │      Answer: Redis with 1hr TTL                                │  │
│  │                                                                 │  │
│  │   Q: Which endpoints should be cached?                         │  │
│  │      Answer: GET endpoints only, not POST/PUT/DELETE           │  │
│  │                                                                 │  │
│  │   Q: Fallback on cache miss?                                   │  │
│  │      Answer: Query database and repopulate cache               │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ◀ Round 2: Refinement Questions        [Answering now...]     │  │
│  │                                                                 │  │
│  │ 1. Based on your cache TTL choice (1hr), will this conflict   │  │
│  │    with user expectations for real-time data?                 │  │
│  │                                                                 │  │
│  │    ◉ Yes, need shorter TTL                                    │  │
│  │    ○ No, 1hr is acceptable                                    │  │
│  │    ○ Depends on the endpoint                                  │  │
│  │                                                                 │  │
│  │ 2. Do you need cache invalidation webhooks?                    │  │
│  │                                                                 │  │
│  │    ☑ Yes, for real-time updates                               │  │
│  │    ☐ No, TTL is sufficient                                    │  │
│  │                                                                 │  │
│  │ 3. What's your monitoring strategy for cache hit ratio?       │  │
│  │                                                                 │  │
│  │    [_________________________________]  (text input)           │  │
│  │                                                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                       │
│  [Submit & Continue to Round 3]  [Skip to Finalize]                 │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. QuestionRoundPanel Component (Expanded State)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▼ Round 1: Initial Clarification                 ✅ Answered 5m ago │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Q1: What's the primary use case?                                   │
│  ℹ️  Why: Core purpose affects architecture decisions              │
│  💡 Impact: Determines scalability requirements                    │
│                                                                      │
│  Answer: ◉ High-traffic API  ○ Internal tool  ○ Real-time app     │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Q2: Team size and expertise?                                        │
│  ℹ️  Why: Affects complexity of chosen solution                    │
│  💡 Impact: May simplify or defer advanced features                │
│                                                                      │
│  Answer:                                                             │
│     ☑ 1-2 developers                                                │
│     ☑ 3-5 developers                                                │
│     ☐ 6+ developers                                                 │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Q3: Deadline?                                                       │
│  ℹ️  Why: Time constraints affect implementation scope             │
│  💡 Impact: May cut non-critical features                          │
│                                                                      │
│  Answer: [____________________]  (date picker or text)              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. QuestionRoundPanel Component (Collapsed State)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ▶ Round 1: Initial Clarification                 ✅ Answered 5m ago │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Question Input Variations

### Radio Button (Single Select)
```
Q: What's your auth method?
ℹ️  Why: Fundamental architecture decision
💡 Impact: Affects security model and token management

  ◉ JWT tokens
  ○ Session cookies
  ○ OAuth 2.0
  ○ Custom token system
```

### Checkbox (Multiple Select)
```
Q: Which databases should we support?
ℹ️  Why: Multi-DB support affects schema design
💡 Impact: Increases complexity but enables flexibility

  ☑ PostgreSQL
  ☑ MongoDB
  ☐ Redis
  ☐ DynamoDB
```

### Text Input (Single Line)
```
Q: What's the expected QPS (queries per second)?
ℹ️  Why: Throughput target drives caching/scaling strategy
💡 Impact: Determines infrastructure and database tuning needs

  [________________]
  Example: 1000 QPS
```

### Multiline Text Input
```
Q: Describe your data model in detail.
ℹ️  Why: Understanding relationships helps optimize queries
💡 Impact: May suggest denormalization or caching strategies

  [______________________________________________]
  [______________________________________________]
  [______________________________________________]
  [Max 500 characters]
```

### Select Dropdown (with Options)
```
Q: Team's experience level?
ℹ️  Why: Affects architectural complexity
💡 Impact: May recommend simpler patterns for junior teams

  [▼ Beginner (< 1 year experience)    ]
     ├─ Beginner (< 1 year experience)
     ├─ Intermediate (1-3 years)
     ├─ Advanced (3-5 years)
     └─ Expert (5+ years)
```

---

## 6. Full Workflow - Step by Step

### Step 1: Starting a Draft
```
User clicks "Create Ticket"
    ↓
Stage 1: Input Title & Repo (already done)
    ↓
Stage 2: Review Context (already done)
    ↓
Stage 3: Question Refinement
    ├─ Backend: Load AEC in DRAFT status
    ├─ User clicks: "Start Question Round"
    ├─ Backend: Analyzes code, generates Round 1 questions
    └─ Frontend: Shows Round 1 questions
```

### Step 2: Answering Round 1
```
User answers all Round 1 questions
    ↓
User clicks: "Submit & Continue"
    ├─ Backend: Records answers
    ├─ LLM: Decides: "Need more context"
    ├─ Backend: Generates Round 2 questions
    └─ Frontend: Shows Round 2 questions (Round 1 collapses)
```

### Step 3: Answering Round 2
```
User answers all Round 2 questions
    ↓
User clicks: "Submit & Continue"
    ├─ Backend: Records answers
    ├─ LLM: Decides: "Can finalize now"
    ├─ Frontend: Shows summary + "Finalize" button
    └─ Note: Could ask Round 3, but agent decided against it
```

### Step 4: Finalize
```
User clicks: "Finalize"
    ├─ Backend: Generates final TechSpec with ALL answers
    ├─ Frontend: Shows final spec
    └─ User clicks: "Create Ticket" → Stage 4 (Review)
```

### Alternative: Skip to Finalize
```
At ANY round, user clicks: "Skip to Finalize"
    ├─ Backend: Records skip, transitions to QUESTIONS_COMPLETE
    ├─ Backend: Generates final spec with current answers
    ├─ Frontend: Shows final spec (may be less precise)
    └─ User proceeds to Stage 4
```

---

## 7. Stage 3 View - Collapsed All Rounds

```
┌──────────────────────────────────────────────────────────────────────┐
│ Create Ticket > Review Context > Answer Questions > Review & Create   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ▶ Database Caching Layer                                            │
│    Add Redis caching for frequently accessed queries                 │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────   │
│  Progress: Round 3 of 3 (Final Round)                                │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ✅ Round 1: Initial Clarification        [Answered 10m ago]   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ✅ Round 2: Refinement Questions         [Answered 5m ago]    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ ◀ Round 3: Final Clarification           [Answering now...]   │  │
│  │                                                                 │  │
│  │ Q: Any edge cases we should handle explicitly?                │  │
│  │    [_______________________________________________]           │  │
│  │                                                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                       │
│  [Submit & Finalize]  [Skip to Finalize]                             │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 8. Final Spec View (After Finalize)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Create Ticket > Review Context > Answer Questions > Review & Create   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  📋 Database Caching Layer                   Quality Score: 87/100   │
│                                                                       │
│  ✅ Question Refinement Complete (3 rounds)                          │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                       │
│  ▶ Problem Statement                                                  │
│    Implement caching layer for database queries...                   │
│                                                                       │
│  ▶ Solution (12 steps)                                               │
│    1. Set up Redis instance in Docker...                             │
│    2. Create cache key generation utility...                         │
│    3. Implement cache middleware...                                  │
│    ...                                                                │
│                                                                       │
│  ▶ Acceptance Criteria (7 criteria)                                  │
│    • Cache hits for GET endpoints within 100ms                       │
│    • Cache invalidation on data updates                              │
│    • Monitoring dashboard for cache metrics                          │
│    ...                                                                │
│                                                                       │
│  ▶ File Changes (5 files)                                            │
│    Create: src/middleware/cache.middleware.ts                        │
│    Create: src/utils/cache-keys.ts                                   │
│    Modify: src/database/connection.ts                                │
│    ...                                                                │
│                                                                       │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                       │
│                          [Create Ticket]                              │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 9. Component Structure Diagram

```
Stage3Draft.tsx (Main Container)
│
├─ SpecPreview
│  └─ Shows title, description, quality score
│
├─ QuestionRoundsSection
│  │
│  ├─ ProgressIndicator
│  │  └─ "Round 2 of 3"
│  │
│  ├─ QuestionRoundPanel (for each round)
│  │  ├─ RoundHeader (collapsible)
│  │  │  ├─ RoundBadge ("Round 1")
│  │  │  ├─ StatusBadge ("Answered 5m ago" / "Answering now...")
│  │  │  ├─ SkippedBadge (if skipped)
│  │  │  └─ ExpandToggle
│  │  │
│  │  └─ RoundContent (when expanded)
│  │     ├─ Question (repeating for each Q)
│  │     │  ├─ QuestionText
│  │     │  ├─ ContextTooltip (ℹ️)
│  │     │  ├─ ImpactBadge (💡)
│  │     │  └─ InputComponent (varies by type)
│  │     │     ├─ RadioGroup (type: radio)
│  │     │     ├─ CheckboxGroup (type: checkbox)
│  │     │     ├─ TextInput (type: text)
│  │     │     ├─ SelectDropdown (type: select)
│  │     │     └─ TextArea (type: multiline)
│  │     │
│  │     └─ Divider
│  │
│  └─ ActionButtons
│     ├─ PrimaryButton ("Submit & Continue" / "Submit & Finalize")
│     └─ SecondaryButton ("Skip to Finalize")
│
└─ LoadingOverlay (during submission)
```

---

## 10. State Machine Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                     QUESTION REFINEMENT FLOW                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ DRAFT        │
│ No questions │
└──────┬───────┘
       │ User: "Start Round 1"
       ▼
┌──────────────────────┐
│ IN_QUESTION_ROUND_1  │ ──┐
│ Q1, Q2, Q3 displayed │   │ LLM decides: Need more info
└──────┬───────────────┘   │ User: "Submit & Continue"
       │ User submits      │
       └──────────────────►
       ▼
┌──────────────────────┐
│ IN_QUESTION_ROUND_2  │ ──┐
│ Q4, Q5 displayed     │   │ LLM decides: Sufficient info
└──────┬───────────────┘   │ User: "Submit & Finalize"
       │ User submits      │ OR User: "Skip to Finalize"
       └──────────────────►
       ▼
┌────────────────────────────┐
│ QUESTIONS_COMPLETE         │
│ OR                         │
│ IN_QUESTION_ROUND_3 (alt)  │
└──────┬─────────────────────┘
       │ User: "Finalize"
       ▼
┌──────────────────────┐
│ DRAFT (with TechSpec)│
│ Ready for Stage 4    │
└──────────────────────┘
```

---

## 11. Key UI Features

### Context Tooltips (ℹ️)
Shows WHY a question is being asked
```
Q: Cache invalidation strategy?
ℹ️ Why: Different strategies have different consistency guarantees
   that impact your architecture
```

### Impact Badges (💡)
Shows HOW the answer affects the spec
```
💡 Impact: Your choice here determines whether we need
   message queues for distributed invalidation
```

### Round Status Indicators
```
✅ Round 1 - Green checkmark (complete)
◀ Round 2 - Arrow indicator (currently answering)
⏭️ Round 3 - Grayed out (not yet reached)
⏭️ Skipped - Badge indicator (user skipped)
```

### Progress Tracking
```
Progress: Round 2 of 3
[████████░░░░░░░░░░░] (visual progress bar optional)
```

---

## 12. Mobile Responsive Behavior

### Desktop (>768px)
- All UI as shown above
- Expandable/collapsible rounds side by side
- Full-width question inputs

### Tablet (500-768px)
- Stacked rounds
- Full-width buttons
- Larger touch targets for mobile

### Mobile (<500px)
```
┌─────────────────────────────┐
│ Database Caching Layer      │
├─────────────────────────────┤
│                             │
│ ▼ Round 1 ✅ 5m ago        │
│                             │
│ Q: Cache strategy?          │
│ ◉ Redis                     │
│ ○ Memcached                 │
│ ○ In-memory                 │
│                             │
│ ─────────────────────────── │
│                             │
│ ▶ Round 2 ◀ Answering...   │
│                             │
│ ─────────────────────────── │
│                             │
│ [Submit & Continue]         │
│ [Skip to Finalize]          │
│                             │
└─────────────────────────────┘
```

---

## 13. Error States

### Invalid Input
```
Q: Expected response time (ms)?

[____________] ❌ "Must be a number"

(Field highlighted in red, error message below)
```

### Network Error During Submit
```
┌─────────────────────────────────────┐
│ ⚠️ Error Submitting Answers           │
│                                      │
│ Could not reach server. Your        │
│ answers are saved locally.          │
│                                      │
│ [Retry]  [Continue Offline]         │
└─────────────────────────────────────┘
```

### LLM Generation Failure
```
⚠️ Could not generate next round of questions.

We tried 3 times to generate more questions but
encountered an error. You can:

[Skip to Finalize Now]  [Try Again]
```

---

## 14. Loading States

### During Question Generation
```
⏳ Generating questions for Round 2...

(Spinner animation)
(Takes 5-15 seconds typically)
```

### During Submission
```
📤 Submitting your answers...

(Spinner animation)
(Takes 2-5 seconds typically)
```

---

## Design System Integration

### Colors
- **Primary**: Use existing Linear-inspired colors
- **Success**: Green for ✅ completed rounds
- **Current**: Blue for ◀ actively answering
- **Inactive**: Gray for collapsed rounds
- **Warning**: Orange for ⚠️ errors

### Typography
- **Headers**: Existing h4/h5 styles
- **Questions**: Bold, 16px, high contrast
- **Context**: Secondary gray, smaller font, italic
- **Answers**: Regular weight, matching input styles

### Spacing
- **Round cards**: 16px padding, 12px border radius
- **Questions**: 12px margin between questions
- **Buttons**: 12px gap, full width on mobile

### Interactions
- **Hover**: Subtle background color change
- **Focus**: Standard focus ring for accessibility
- **Disabled**: Reduced opacity for disabled rounds
- **Loading**: Spinner + disabled state during submission

---

## Accessibility Requirements

- ✅ ARIA labels for screen readers
- ✅ Keyboard navigation (Tab, Enter, Arrow keys)
- ✅ Proper heading hierarchy
- ✅ Color not sole indicator (use icons + text)
- ✅ Touch targets min 44x44px
- ✅ Form validation messages linked to inputs
- ✅ Loading states announced to screen readers

