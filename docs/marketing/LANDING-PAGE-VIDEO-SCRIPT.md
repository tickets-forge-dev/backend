# LANDING PAGE VIDEO: "How Forge Works"
## Technical Walkthrough (2-3 minutes)

**Purpose:** Explain the technical flow to developers/engineers who want to understand the mechanics
**Audience:** CTOs, architects, technical PMs, developers
**Tone:** Clear, confident, technical but accessible
**Length:** 2-3 minutes (longer, deeper than hero)

---

## THE SCRIPT

### **SECTION 1: INTRO (20 seconds)**

**[FADE IN: Forge dashboard, clean interface]**

**VOICEOVER:**
> "Forge uses AI to generate complete engineering specifications from your actual codebase."
>
> "Here's how it works under the hood."

**[TEXT ON SCREEN]**
> FORGE: Technical Specification Generation
> Powered by Claude AI

**[VISUAL]**
- Forge logo
- Tech stack icons (React, Node.js, PostgreSQL)
- Brief code snippet visible in background

---

### **SECTION 2: THE FLOW (15 seconds)**

**[ANIMATED DIAGRAM]**

```
Your Code (GitHub)
    ↓
Forge Analysis Engine
    ↓
Claude AI (LLM)
    ↓
Complete Specification
```

**VOICEOVER:**
> "The process has three phases: fingerprinting, file selection, and AI analysis."

**[TEXT ON SCREEN]**
> Phase 1: Lightweight Fingerprinting
> Phase 2: Smart File Selection
> Phase 3: Full LLM Analysis

---

### **SECTION 3: PHASE 1 - FINGERPRINTING (30 seconds)**

**[SCREEN RECORDING: Forge "Analyzing" screen]**

**VOICEOVER:**
> "Phase 1 takes 1-2 seconds. We scan your repository structure without reading files."

**[VISUAL SEQUENCE]:**
1. GitHub tree structure appears (directories, files)
2. Forge highlights key files: `package.json`, `tsconfig.json`, `src/`, `tests/`
3. Tech stack detection overlay: "React" ✓, "Node.js" ✓, "PostgreSQL" ✓
4. Framework detection: "Next.js" ✓, "NestJS" ✓

**VOICEOVER:**
> "We detect your technology stack from filenames: package.json tells us Node.js, React imports tell us React, migrations folder tells us PostgreSQL."
>
> "Your user sees the tech stack immediately. No waiting."

**[TEXT ON SCREEN]**
> Detected Stack:
> • React + Next.js (Frontend)
> • Node.js + NestJS (Backend)
> • PostgreSQL (Database)
> • TypeScript (Type Safety)

---

### **SECTION 4: PHASE 2 - FILE SELECTION (30 seconds)**

**[SCREEN RECORDING: Repository tree, expanding]**

**VOICEOVER:**
> "Phase 2 is where AI gets smart. We send your repository structure and the feature description to Claude."

**[VISUAL SEQUENCE]:**
1. Full repo tree appears (200+ files)
2. User feature request appears: "Add user avatar to profile page"
3. Forge highlights selected files (10-15 files glow)
4. Highlighted files shown:
   - `src/components/Profile.tsx` ✓
   - `src/hooks/useUser.ts` ✓
   - `backend/src/users/user.service.ts` ✓
   - `backend/src/users/user.model.ts` ✓
   - `packages/types/user.ts` ✓

**VOICEOVER:**
> "Claude analyzes the full tree, understands your architecture, and selects the 10-15 most relevant files."
>
> "This takes 2-3 seconds. We only read the files that matter."

**[TEXT ON SCREEN]**
> AI Selects Relevant Files
> • Frontend components (React)
> • Backend services (NestJS)
> • Shared types (TypeScript)
> • Database models

---

### **SECTION 5: PHASE 3 - LLM ANALYSIS (40 seconds) — THE HERO MOMENT**

**[SCREEN RECORDING: Spec generation in progress → reveal]**

**VOICEOVER:**
> "Phase 3 is where the magic happens. Claude reads the selected files, understands your patterns, and generates a complete specification."

**[VISUAL SEQUENCE (SLOW, let each item appear):]**

1. **Spec generation starts** — "Analyzing code patterns..."
2. **Section 1 appears: Problem Statement**
   - Title: "User Avatar: Improve Profile Personalization"
   - Description (2-3 sentences explaining the "why")

3. **Section 2 appears: Solution**
   - Architecture approach
   - "Store avatar in AWS S3" ✓
   - "Update User model with avatar_url" ✓
   - "Create Avatar component in React" ✓

4. **Section 3 appears: Acceptance Criteria** (Given/When/Then format)
   - "Given: User is on profile page"
   - "When: User uploads image"
   - "Then: Avatar displays across app"

5. **Section 4 appears: Backend Changes**
   - API endpoint: `POST /api/users/:id/avatar` (color-coded: green)
   - Database migration: `add_avatar_url_to_users`
   - File: `user.service.ts` (highlighted)

6. **Section 5 appears: Frontend Changes**
   - Component: `AvatarUpload.tsx` (new)
   - Hook: `useAvatarUpload` (new)
   - Integration: `Profile.tsx` (update)

7. **Section 6 appears: Test Plan**
   - Unit tests: "Avatar component renders" ✓
   - Integration: "Upload flow validates file size" ✓
   - Edge cases: "Reject images >5MB" ✓

8. **Quality Score appears: 92/100** (with breakdown)

**VOICEOVER:**
> "In seconds, you get a complete specification. Not a vague outline—a real specification."
>
> "Every change is specific: exact files, exact methods, exact acceptance criteria in Given/When/Then format."
>
> "The quality score reflects completeness: problem clarity, solution detail, test coverage, everything."

**[TEXT ON SCREEN]**
> Complete Specification Generated
> • Problem Statement (clear "why")
> • Architectural Solution
> • Acceptance Criteria (Given/When/Then)
> • Backend Changes (specific files, APIs)
> • Frontend Changes (components, hooks)
> • Database Migrations
> • Test Plan (unit, integration, edge cases)
> • Quality Score: 92/100

---

### **SECTION 6: QUALITY IMPROVEMENT (30 seconds)**

**[SCREEN RECORDING: Quality score, then questions appear]**

**VOICEOVER:**
> "If the quality score is below 90, Forge asks clarification questions."

**[VISUAL SEQUENCE]:**
1. Spec shown with quality score: 85/100
2. "Questions Available" badge appears
3. Question modal opens: "Question 1 of 3"
4. Question: "Should users be able to change avatars after uploading?"
5. User selects: "Yes, unlimited changes"
6. Next question: "Should avatar be visible to other users on their profiles?"
7. User selects: "Yes, only their own profile"
8. Spec regenerates
9. Quality score updates: 85 → 94/100

**VOICEOVER:**
> "Better answers mean better specs. Users answer up to 5 questions, and the specification improves."
>
> "This is how we go from good to great in seconds."

**[TEXT ON SCREEN]**
> Answer Clarification Questions
> Quality: 85/100 → 94/100
> Ambiguity: Resolved
> Completeness: +9 points

---

### **SECTION 7: EXPORT & SHARE (20 seconds)**

**[SCREEN RECORDING: Export options]**

**VOICEOVER:**
> "Once you have a complete specification, you can export it directly to where your team works."

**[VISUAL SEQUENCE]:**
1. Export button appears
2. Option 1: "Export to Linear" — click, issue appears in Linear
3. Option 2: "Export to Jira" — click, issue appears in Jira with subtasks
4. Option 3: "Copy Markdown" — copy to clipboard, paste anywhere

**[Each export shows the spec formatted in target tool]**

**VOICEOVER:**
> "Whether you use Linear, Jira, or just Markdown—your specification is instantly ready for your team."
>
> "No manual copying. No formatting. Just export and go."

**[TEXT ON SCREEN]**
> Export Destinations:
> • Linear (seamless integration)
> • Jira (with subtasks + custom fields)
> • Markdown (copy-paste anywhere)

---

### **SECTION 8: THE TECH STACK (20 seconds)**

**[ANIMATED DIAGRAM of Forge architecture]**

**VOICEOVER:**
> "Here's what powers Forge behind the scenes."

**[VISUAL: Tech stack diagram]**
```
Frontend              Backend              AI
─────────────────────────────────────────────────
Next.js +             NestJS +             Claude 3.5
React                 TypeScript           Sonnet
  ↓                     ↓                     ↓
GitHub API ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ → LLM Prompts
  ↓                                         ↓
Repo Tree             Firestore         LLM Analysis
  ↓                     ↓                     ↓
  └───────────────────────────────────────┘
        Generated Specification
```

**VOICEOVER:**
> "Frontend: React and Next.js for a responsive, fast UI."
>
> "Backend: NestJS with TypeScript for type-safe API endpoints."
>
> "AI: Claude 3.5 Sonnet—Anthropic's best model for code understanding."
>
> "Data: All specifications encrypted in Firestore, GitHub tokens encrypted at rest."

**[TEXT ON SCREEN]**
> Frontend: Next.js + React + TypeScript
> Backend: NestJS + TypeScript
> Database: Firestore (encrypted)
> AI: Claude 3.5 Sonnet
> Integrations: GitHub, Linear, Jira, Stripe

---

### **SECTION 9: PERFORMANCE & SECURITY (20 seconds)**

**[VISUAL: Benchmark cards + security icons]**

**VOICEOVER:**
> "Speed: From repository to complete specification in 8-15 seconds."
>
> "Accuracy: 95% correctness on architecture-aware specs."
>
> "Security: Your code is never stored. We analyze it in-memory, then delete. GitHub tokens encrypted. All data in transit over HTTPS."

**[TEXT ON SCREEN]**
> Performance:
> ⚡ 8-15 seconds (repo to spec)
> 📊 95% accuracy
> 💰 $0.05 per specification
>
> Security:
> 🔒 Your code never stored
> 🔐 Encrypted GitHub tokens
> 🛡️ No training on your code
> ✅ HTTPS everywhere

---

### **SECTION 10: WHO BENEFITS (20 seconds)**

**[VISUAL: Three personas, icons]**

**VOICEOVER:**
> "Forge is built for three users."

**[VISUAL SEQUENCE]:**

1. **Product Manager**
   - No coding required
   - Generates specs without GitHub access
   - Fast iteration on feature ideas

2. **Engineering Lead / CTO**
   - Validates spec quality before handoff
   - Improves team alignment
   - Enforces architectural patterns

3. **Developer**
   - Receives clear, complete specs
   - No more clarifying questions
   - Can focus on implementation

**[TEXT ON SCREEN]**
> Product Managers
> Generate specs without coding
>
> Engineering Leaders
> Validate & improve quality
>
> Developers
> Clear, complete specifications

---

### **SECTION 11: THE RESULT (15 seconds)**

**[BEFORE/AFTER COMPARISON]**

**[VISUAL: Split screen]**

**LEFT: Without Forge**
- Manual ticket: "Add user avatar" (vague)
- Time: 45 minutes
- Back-and-forth: "Can you be more specific?"
- Quality: ⭐⭐ (incomplete)

**RIGHT: With Forge**
- Complete spec: All details documented
- Time: 5 minutes
- No questions: Everything is clear
- Quality: ⭐⭐⭐⭐⭐ (production-ready)

**VOICEOVER:**
> "The difference is clear. Better specifications. Faster shipping. Fewer misunderstandings."

**[TEXT ON SCREEN]**
> Without Forge: 45 min | Incomplete | Questions needed
> With Forge: 5 min | Complete | Dev-ready

---

### **SECTION 12: CLOSING (15 seconds)**

**[FADE TO: Forge dashboard, clean, modern]**

**VOICEOVER:**
> "Forge is how modern teams write specifications."
>
> "Connect your repository. Describe your feature. Get a complete specification in minutes."

**[TEXT ON SCREEN]**
> FORGE
> AI-Powered Specification Generation
> Connected to Your Code. Grounded in Reality.

**CTA:**
> Try free. 5 tickets/month.
> No credit card required.
>
> forge.dev.ai

**[FINAL VISUAL: Forge logo + GitHub/Linear/Jira icons (integrations)]**

---

## FILMING CHECKLIST

### What to Record

**Screen Recordings:**
- [ ] Forge dashboard (home screen)
- [ ] Repo analysis flow (fingerprinting → file selection → spec generation)
- [ ] Generated spec (full, scrolling through all sections)
- [ ] Quality score breakdown
- [ ] Questions modal (answering questions)
- [ ] Spec quality improving (85 → 94)
- [ ] Export to Linear (show Linear issue appear)
- [ ] Export to Jira (show Jira issue with subtasks)
- [ ] Tech stack diagram animation (can be created in post)

**Optional (For Polish):**
- [ ] You presenting (20 seconds at beginning, optional)
- [ ] Hands using keyboard (optional, adds authenticity)

### Recording Settings
- Resolution: 1920x1080 minimum
- Frame rate: 60fps (smooth motion)
- Clean desktop (professional appearance)
- Cursor visible (shows interactions)
- Multiple takes (pick best flow)

---

## EDITING NOTES

### Pacing
- Fingerprinting section: FAST (1-2 seconds)
- File selection: MEDIUM (smooth transitions)
- Spec reveal: SLOW (let each section breathe, 40+ seconds for this section)
- Export: MEDIUM (show the action, quick cuts)

### Visual Effects
- Smooth zoom on important areas (repo tree, spec sections)
- Fade in/out for section transitions
- Highlight color for detected files (green)
- Animated diagrams for architecture
- Quality score update (number animate from 85 → 94)

### Color Grading
- Clean, modern (not too dark, not too bright)
- Highlight colors: green (success), blue (info), orange (questions)
- Professional but friendly (not corporate sterile)

### Music
- Uplifting, steady pace
- No sudden drops or spikes
- Instrumental (tech-forward feel)
- Suggestions: Epidemic Sound "professional tech demos" category

### Text Overlays
- Key stats appear as voiceover mentions them
- File paths readable (don't zoom too fast)
- Keep text 1-2 seconds per slide (time for reading)

---

## AUDIO PRODUCTION

### Voiceover
- Record in quiet room
- Natural pace (not too fast, not too slow)
- Emphasis on key phrases: "complete specification", "8-15 seconds", "92/100 quality"
- No apologies or filler words ("um", "like", "you know")
- Confidence: This is how it works, not hypothetical

### Background Music
- Starts quiet (intro, ~-15dB)
- Builds during spec reveal (peak of video, ~-8dB)
- Quiets at end (closing, ~-15dB)
- No sudden silences (except intentional pauses)

### Sound Effects (Optional but Recommended)
- File scan: subtle "whoosh" sounds (Phase 2)
- Spec appearing: satisfying "ding" (Phase 3, each section)
- Quality score update: upward "bell" tone
- Export success: brief "success" notification sound
- All SFX subtle, not distracting

---

## VIDEO LENGTH

- **Total: 2-3 minutes** (most effective for landing page)
- Intro: 20s
- Flow diagram: 15s
- Phase 1: 30s
- Phase 2: 30s
- Phase 3: 40s ← Longest (hero moment)
- Quality improvement: 30s
- Export: 20s
- Tech stack: 20s
- Performance: 20s
- Who benefits: 20s
- Result: 15s
- Closing: 15s
- **Total: ~3 minutes 25 seconds**

**Can trim to 2 minutes by:**
- Shorter Phase 1 (20s → 15s)
- Shorter Phase 2 (30s → 20s)
- Shorter Phase 3 (40s → 30s)
- Remove "Who Benefits" section
- Faster transitions

---

## DISTRIBUTION

**Landing Page:**
- Autoplay, no sound (users will read or click for sound)
- Loop after 3 minutes
- Fallback text: "See how Forge works [click to play]"

**YouTube:**
- Full 3-minute version
- Description: "Technical walkthrough of how Forge analyzes your code and generates specifications"
- Tags: #AI #Engineering #Specifications #GitHub #DeveloperTools

**Twitter/X:**
- 60-second cut (just Phase 3 + export)
- Caption: "Watch Forge analyze your code and generate a complete specification in seconds"

**LinkedIn:**
- Full 3-minute version
- Caption: "How AI understands your codebase and generates specifications your team actually uses"

**Email (Welcome Sequence):**
- Embed full 3-minute version
- Subject: "See how Forge works (2:30 demo)"

---

## PRODUCTION TIMELINE

**Day 1: Preparation (2 hours)**
- Set up clean desktop
- Prepare Forge instance with test data
- Test screen recording software
- Write voiceover script

**Day 1: Filming (2 hours)**
- Record all screen sequences (multiple takes)
- Backup immediately
- Test audio levels

**Day 2: Voiceover (1 hour)**
- Record voiceover in quiet room
- Multiple takes per section (pick best)

**Day 3: Editing (4-6 hours)**
- Import footage + audio
- Rough assembly (paste clips in order)
- Add transitions + effects
- Sync voiceover to footage
- Add music + SFX
- Color grade
- Final review + adjustments

**Day 4: Export (1 hour)**
- Export for landing page (MP4, H.264, 1080p)
- Export for YouTube (4K if possible)
- Export for social (1080p + captions)

**Total: 10-12 hours over 4 days**

---

## SUCCESS METRICS

Once live, track:
- [ ] Landing page video view rate (% of users who click play)
- [ ] Video completion rate (% who watch to end)
- [ ] Click-through from video to signup
- [ ] Time on landing page (should increase with video)
- [ ] YouTube views + engagement

**Success threshold:**
- 50%+ view completion rate (most watch the whole thing)
- 5%+ CTR to signup (good video-to-signup conversion)
- 60+ second average watch time (they don't skip)

---

## THIS IS YOUR LANDING PAGE HERO

This video is the centerpiece of your landing page. It does the heavy lifting:
- Explains what Forge is (without fluff)
- Shows the workflow (step-by-step)
- Demonstrates quality (see the spec)
- Proves speed (8-15 seconds)
- Builds confidence (tech stack, security)

It's 3 minutes but FEELS short because every second has value.

No storytelling. No roleplay. Just pure technical walkthrough.

This is the video that makes engineers think: "Oh, that's actually really smart. I want to try it."

---

## READY TO FILM?

You have everything:
- ✅ Shot-by-shot script
- ✅ Voiceover copy (copy/paste ready)
- ✅ Filming checklist
- ✅ Editing notes
- ✅ Distribution plan
- ✅ Timeline

Start filming today. Have it live by end of week.
