# TUTORIAL VIDEO SERIES
## Feature-by-Feature Walkthroughs

**Goal:** Teach users how to use Forge, reduce support load, increase conversion
**Format:** Short, focused, fast-paced
**Total Time to Produce:** 2-3 days (all tutorials)

---

## VIDEO LINEUP

### TIER 1: Essential Onboarding (Required First)

These are the "must-watch" videos that get users from zero to first ticket.

#### **Video 1: "Connect Your GitHub Repo" (2 minutes)**
**Audience:** First-time users
**Goal:** Get users authenticated and repo connected

**Script Outline:**
1. **Intro (10s):** "Let's connect your first GitHub repo to Forge"
2. **Step 1 (20s):** Open Forge → Click "Connect Repository"
3. **Step 2 (20s):** GitHub OAuth flow (show permissions screen)
4. **Step 3 (20s):** Select repo from dropdown
5. **Step 4 (20s):** "You're connected. Now create your first ticket."
6. **Outro (10s):** CTA to next video

**What You Film:**
- Screen recording of Forge UI
- GitHub OAuth screen
- Repo selection
- Confirmation screen

**Production:** Pure screen recording, simple voiceover
**Estimated Effort:** 30 minutes to film + 45 minutes to edit

---

#### **Video 2: "Generate Your First Ticket" (3 minutes)**
**Audience:** Users ready to create
**Goal:** Show the basic workflow end-to-end

**Script Outline:**
1. **Intro (15s):** "Now let's generate your first engineering ticket"
2. **Step 1 (20s):** Click "New Ticket"
3. **Step 2 (30s):** Write feature description (example: "Add dark mode toggle to settings page")
4. **Step 3 (30s):** Click "Analyze Repository"
5. **Step 4 (30s):** Watch the analysis happen (fingerprinting → file detection)
6. **Step 5 (30s):** Review generated spec (problem statement → acceptance criteria)
7. **Step 6 (20s):** Click "Save Ticket"
8. **Outro (15s):** "Your ticket is ready to share with your team"

**What You Film:**
- Forge input form
- Feature description being typed
- Analysis animation
- Spec revealing (slow, so people see each section)
- Final save

**Production:** Screen recording + voiceover
**Estimated Effort:** 45 minutes to film + 1 hour to edit

---

#### **Video 3: "Review & Refine Your Spec" (2.5 minutes)**
**Audience:** Users who generated a ticket
**Goal:** Show how to review, edit, and improve specs

**Script Outline:**
1. **Intro (10s):** "Your spec is generated. Now let's refine it."
2. **Step 1 (30s):** Open a generated ticket, review sections (problem → solution → API → tests)
3. **Step 2 (30s):** Show quality score (explain what it means)
4. **Step 3 (40s):** Edit a section (example: API endpoint, acceptance criteria)
5. **Step 4 (30s):** Answer clarification questions (show question modal)
6. **Step 5 (20s):** Check updated quality score (higher after refinement)
7. **Outro (15s):** "Now you're ready to export or share"

**What You Film:**
- Ticket detail page (scrolling through sections)
- Quality score UI
- Clicking "Edit" on a section
- Editing modal (type changes)
- Question refinement modal (answering questions)
- Updated spec

**Production:** Screen recording + voiceover
**Estimated Effort:** 45 minutes to film + 1 hour to edit

---

### TIER 2: Feature Deep-Dives (After Users Understand Basics)

These teach specific Forge capabilities that unlock more value.

#### **Video 4: "API Endpoint Detection Explained" (2 minutes)**
**Audience:** Tech-savvy users, backend teams
**Goal:** Show how Forge detects and documents APIs

**Script Outline:**
1. **Intro (10s):** "Forge automatically detects API endpoints in your code"
2. **Explanation (30s):** What Forge looks for (route definitions, DTOs, endpoints)
3. **Example (50s):** Show a generated spec with API section highlighted
   - Method (GET/POST/PUT)
   - Route (/api/users/:id)
   - Request payload
   - Response shape
4. **Edit (20s):** Show how to add/edit APIs manually
5. **Outro (10s):** "No more guessing about API contracts"

**What You Film:**
- Generated spec with API section
- Code snippets (backend controller)
- API editor modal (add/edit API)
- Before/after comparison

**Production:** Screen recording + brief code snippets
**Estimated Effort:** 30 minutes to film + 45 minutes to edit

---

#### **Video 5: "Test Plan Generation: Auto-Generate Test Cases" (2 minutes)**
**Audience:** QA, test engineers, quality-focused teams
**Goal:** Show test plan feature and its value

**Script Outline:**
1. **Intro (10s):** "Forge generates comprehensive test plans for every ticket"
2. **Example (40s):** Show generated spec with test plan section
   - Unit tests (component level)
   - Integration tests (API + database)
   - Edge cases (input validation, error handling)
3. **Breakdown (30s):** Explain each test type + why it matters
4. **Edit (20s):** Show adding custom tests
5. **Outro (10s):** "Tests = fewer bugs, faster reviews"

**What You Film:**
- Spec detail showing test plan section
- Expanding test categories
- Test case examples
- Edit test modal

**Production:** Screen recording + voiceover
**Estimated Effort:** 30 minutes to film + 45 minutes to edit

---

#### **Video 6: "Backend vs Frontend Split: Organize Changes by Layer" (2 minutes)**
**Audience:** Full-stack teams, architects
**Goal:** Show layered file changes and how to understand architecture

**Script Outline:**
1. **Intro (10s):** "Forge organizes changes by architectural layer"
2. **Show Layers (40s):** Display spec with sections:
   - Backend Changes (NestJS, controllers, services, migrations)
   - Frontend Changes (React components, hooks, API integration)
   - Shared/Types (TypeScript interfaces, shared utilities)
   - Infrastructure (Docker, config, CI/CD)
   - Docs (API docs, architecture updates)
3. **Why It Matters (20s):** "This is how your actual codebase is organized"
4. **Example (20s):** Show a feature that touches all layers
5. **Outro (10s):** "Clear architecture → faster implementation"

**What You Film:**
- Spec showing layered file changes
- Expanding each layer section
- File paths and descriptions
- Example feature (avatar) across all layers

**Production:** Screen recording + voiceover
**Estimated Effort:** 30 minutes to film + 45 minutes to edit

---

### TIER 3: Integrations & Advanced (For Power Users)

#### **Video 7: "Export to Linear in One Click" (2.5 minutes)**
**Audience:** Linear users, teams using Linear for project management
**Goal:** Show frictionless export workflow

**Script Outline:**
1. **Intro (15s):** "Push your Forge specs directly to Linear"
2. **Setup (20s):** Connect Linear account in Forge settings
3. **Export (30s):** Click "Export to Linear" button on completed ticket
4. **Reveal (20s):** Show ticket appearing in Linear
   - Title + description auto-populated
   - Acceptance criteria preserved
   - Attachments/artifacts included
5. **Sync (20s):** Show updating ticket in Forge → reflects in Linear
6. **Outro (15s):** "Your workflow, uninterrupted"

**What You Film:**
- Forge settings → Linear connection
- Export button on ticket
- Linear workspace receiving the ticket
- Ticket detail in Linear (spec fully formatted)
- Updating spec in Forge, checking Linear update

**Production:** Screen recording (Forge + Linear side-by-side)
**Estimated Effort:** 45 minutes to film + 1 hour to edit

---

#### **Video 8: "Export to Jira: Complex Project Management" (2.5 minutes)**
**Audience:** Jira users, enterprise teams
**Goal:** Show Jira integration for teams using Jira

**Script Outline:**
1. **Intro (15s):** "Export Forge specs to your Jira workspace"
2. **Setup (20s):** OAuth connect Jira account
3. **Export (30s):** Click "Export to Jira"
4. **Reveal (30s):** Show Jira issue created with:
   - Issue type (Story or Task)
   - Custom fields mapped (story points, sprint assignment)
   - Subtasks for acceptance criteria
   - Attachments
5. **Advanced (20s):** Show assigning to sprint, updating status
6. **Outro (15s):** "Specs → Jira, seamlessly"

**What You Film:**
- Jira OAuth flow
- Forge settings Jira connection
- Export button + dialog (choose project/issue type)
- Jira issue appearing with full details
- Editing issue in Jira

**Production:** Screen recording (Forge + Jira)
**Estimated Effort:** 45 minutes to film + 1 hour to edit

---

#### **Video 9: "Answer Clarification Questions to Improve Your Spec" (2 minutes)**
**Audience:** Users creating tickets
**Goal:** Show question refinement and its value

**Script Outline:**
1. **Intro (15s):** "Forge asks clarification questions to improve your spec"
2. **Trigger (20s):** After first spec generation, "Questions available" badge appears
3. **Modal (40s):** Show question refinement modal
   - One question at a time
   - Multiple choice / text input options
   - Progress bar (Question 2 of 5)
   - Previous/Next navigation
4. **Improve (20s):** Show quality score increasing after answering
5. **Outro (15s):** "Better answers = better specs"

**What You Film:**
- Spec generation complete
- "Questions" section appears
- Opening question modal
- Answering different question types
- Closing modal and seeing updated spec

**Production:** Screen recording + voiceover
**Estimated Effort:** 30 minutes to film + 45 minutes to edit

---

### TIER 4: Use-Case Specific (Optional, High ROI)

#### **Video 10: "Forge for Product Managers" (3 minutes)**
**Audience:** Non-technical PMs
**Goal:** Show how PMs can use Forge without GitHub access

**Script Outline:**
1. **Intro (20s):** "You don't need a GitHub account to use Forge"
2. **Path 1: Repo-Connected (1 min):** Tech lead connects repo, PM invites to workspace
3. **Path 2: Manual Context (1 min):** PM describes feature + picks tech stack, AI generates
4. **Create Spec (40s):** PM creates ticket using Forge
5. **Export (20s):** Export to Linear/Jira (PM's actual workflow)
6. **Outro (10s):** "Specs in minutes, not hours"

**What You Film:**
- Workspace invite flow (PM's perspective)
- PM signing in with Google (no GitHub needed)
- Creating ticket without repo access
- Tech stack picker UI
- Exporting to PM's tool of choice

**Production:** Screen recording + voiceover
**Estimated Effort:** 45 minutes to film + 1 hour to edit

---

#### **Video 11: "Multi-Repo Support: Features Across Your Codebase" (2.5 minutes)**
**Audience:** Developers working across multiple repos
**Goal:** Show how to specify features that touch multiple repos

**Script Outline:**
1. **Intro (20s):** "Some features touch multiple repos"
2. **Example (30s):** Show a real feature (frontend + backend + shared types)
3. **Multi-Select (30s):** Show selecting multiple repos in Forge
4. **Analysis (40s):** Watch analysis happening across repos
5. **Result (30s):** Show generated spec with per-repo file changes
6. **Outro (10s):** "See the complete picture"

**What You Film:**
- Multi-repo selector UI
- GitHub repos being analyzed
- Spec with "Backend Changes" / "Frontend Changes" / "Shared Changes"
- File paths showing which files touch which repos

**Production:** Screen recording + voiceover
**Estimated Effort:** 30 minutes to film + 45 minutes to edit

---

## PRODUCTION STRATEGY

### Fastest Path (Film Everything in One Day)

**Morning Session (3 hours):**
- Film Videos 1, 2, 3 (onboarding trilogy)
- All screen recordings from one desktop session
- Do all voiceovers together (batch them)

**Afternoon Session (2 hours):**
- Film Videos 4, 5, 6 (feature deep-dives)
- Same setup, different screens

**Next Day:**
- Film Videos 7, 8, 9 (integrations + advanced)
- Edit Videos 1-3 while filming others

### Editing Batch

- Day 2: Edit Videos 1-3 (4 hours)
- Day 3: Edit Videos 4-6 (4 hours)
- Day 4: Edit Videos 7-9 (4 hours)
- Day 5: Upload all + create playlist

**Total Production Time:** 4 days

---

## TECHNICAL SETUP (Same as Hero Video)

**Equipment:**
- Screen recording software (ScreenFlow, Camtasia, OBS)
- Lapel mic or USB mic for voiceover
- Quiet room for voiceover recording
- High-resolution screen (1920x1080 minimum)

**Recording Settings:**
- Resolution: 1920x1080
- Frame Rate: 60fps
- Codec: H.264
- Audio: 48kHz, 16-bit

**Voiceover Recording:**
- Record separately in quiet room
- Normalize to -14dB LUFS
- No background noise

---

## EDITING TEMPLATE (Use for All Videos)

Keep consistency across videos:

**Intro (3-5 seconds):**
- Video title slides in
- Background: soft Forge branding
- Music: same uplifting background track

**Body (Main content):**
- Screen recording (centered)
- Optional captions for key terms
- Text overlays for emphasis
- Maintain 60fps for smooth motion

**Outro (5 seconds):**
- "Learn more at forge.dev.ai"
- Forge logo
- CTA: "Try free" or "Watch next video"
- Music fade

---

## DISTRIBUTION STRATEGY

### YouTube Playlist: "Forge Tutorial Series"
1. Create playlist with all tutorials
2. Link tutorials in video descriptions
3. Suggest next video in end screen

### Suggested Watching Order:
1. **Onboarding (everyone):** Videos 1, 2, 3
2. **Your role (pick one):** Video 10 (PM)
3. **Your integration (pick one):** Videos 7 or 8
4. **Deep-dive (optional):** Videos 4, 5, 6

### Embed on Website:
- Landing page: Hero video (60s)
- Feature section: Video 4, 5, 6 (embedded)
- Integration section: Video 7, 8
- Help docs: Link to Video 1, 2, 3

### Help Center / In-App:
- Add "?" icon → Links to relevant tutorial
- Example: "How to answer questions?" → Video 9
- Example: "How to export?" → Video 7 or 8

---

## QUICK START: WHICH VIDEOS FIRST?

**Minimum (Start Here):**
- ✅ Video 1: Connect Repo (2 min)
- ✅ Video 2: Generate Ticket (3 min)
- ✅ Video 3: Review Spec (2.5 min)

**Done in 1 day, you're set for onboarding.**

**Add After Week 1:**
- Video 4: API Detection
- Video 5: Test Plans
- Video 6: Layered Changes

**Add Later:**
- Video 7: Linear Export
- Video 8: Jira Export
- Video 9: Questions
- Video 10+: Advanced features

---

## ESTIMATED TOTAL TIME

| Phase | Time | Output |
|-------|------|--------|
| Planning (done) | 2 hours | This doc |
| Film Tier 1 (onboarding) | 3 hours | 3 videos |
| Edit Tier 1 | 4 hours | 3 polished videos |
| Film Tier 2 (features) | 2.5 hours | 3 videos |
| Edit Tier 2 | 3.5 hours | 3 polished videos |
| Film Tier 3 (integrations) | 3 hours | 3 videos |
| Edit Tier 3 | 4 hours | 3 polished videos |
| Upload + optimize | 1 hour | All platforms ready |
| **TOTAL** | **~23.5 hours** | **~9 polished tutorials** |

**Per-video average:** 2.6 hours (film + edit)

---

## CONTENT CALENDAR

Spread videos out to maintain engagement:

**Week 1:**
- Monday: Video 1 (Connect Repo)
- Wednesday: Video 2 (Generate Ticket)
- Friday: Video 3 (Review Spec)

**Week 2:**
- Monday: Video 4 (API Detection)
- Wednesday: Video 5 (Test Plans)
- Friday: Video 6 (Layered Changes)

**Week 3:**
- Monday: Video 7 (Linear Export)
- Wednesday: Video 8 (Jira Export)
- Friday: Video 9 (Questions)

**Week 4+:**
- As needed: Video 10, 11, more

---

## REPURPOSING TUTORIALS FOR SOCIAL

**Each tutorial becomes:**
- 1 full YouTube video (2-3 min)
- 3-5 TikTok/Reels clips (15-30 sec each)
- LinkedIn post (with video embed)
- Twitter thread (key points from video)

**Example - Video 2 becomes:**
- YouTube: Full 3-minute tutorial
- TikTok: "Write a feature → Get a spec in 5 min" (30 sec)
- LinkedIn: "Tired of writing tickets? Here's how fast Forge does it" (video embed)
- Twitter: "Paste your repo URL. Get a complete spec. No manual writing. 🚀 [video]"

This multiplies content reach with minimal extra effort.

---

## GO MAKE THESE

Start with **Videos 1-3** this week. That's your onboarding superpower.

Then film **4-6** as users ask questions (you'll know what to prioritize).

Need help scripting any specific video? Just ask.
