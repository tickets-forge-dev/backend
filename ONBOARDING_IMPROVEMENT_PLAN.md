# Onboarding Improvement Plan - Phase 2

## Current State vs Full Feature Set

### ✅ What Current Onboarding Covers (3 steps)

**Step 1: Welcome**
- Brief intro: "Transform product intent into execution-ready engineering tickets"

**Step 2: How It Works (4 phases)**
1. Connect & Describe - GitHub connection
2. Deep Analysis - AI analyzes code
3. Developer-Ready Output - Outputs include: tech spec, AC, files/APIs, backend/client split, test plan, designs
4. Deploy & Stay in Sync - Linear/Jira integration, auto-updates

**Step 3: Connect GitHub**
- OAuth flow + privacy note

---

### ❌ What's Missing from Onboarding

#### **Major Features NOT Mentioned:**
1. **PRD Breakdown** - Upload entire PRD, auto-extract requirements, bulk create tickets
2. **Bulk Enrichment** - Enrich multiple tickets at once with code analysis
3. **Import Workflows** - Import existing Jira/Linear issues
4. **Reproduction Steps** (for bugs) - Add curl commands, API calls, screenshots
5. **Quality Scoring** - Real-time quality metric for each ticket
6. **Workspace & Team Features** - Shared workspaces, role-based access
7. **Rich Markdown Titles** - Support for formatting (bold, italic, code)
8. **Reference Materials** - Upload wireframes, screenshots, documentation
9. **Edit Tickets Post-Generation** - Can modify and re-generate sections
10. **Tech Stack Detection** - Auto-detect languages, frameworks, package managers

#### **Workflow Improvements NOT Mentioned:**
- The 4-phase generation process (Phase 1: context gathering, Phase 2: deep analysis, Phase 3: questions, Phase 4: spec)
- Clarification questions step where users answer questions
- Multiple attachment types supported
- Revision history / versioning
- Export to multiple formats (Markdown, AEC XML, etc.)

#### **User Types NOT Represented:**
- Product managers uploading PRDs
- Engineering leads importing existing tickets
- Designers adding wireframes
- QA engineers adding reproduction steps
- Team leads managing workspaces

---

## Proposed New Onboarding Structure (7-10 Steps)

### **Step 1: Welcome** (Current - 1 slide)
- Keep as-is: Brief intro to value prop

### **Step 2: Use Cases** (NEW - 1 slide)
Show 4 main user journeys:
- 👨‍💼 **Product Manager**: "I have an idea → Forge generates implementation spec"
- 🐛 **QA/Bug Reporter**: "I found a bug → Upload screenshot & steps → Forge creates ticket"
- 👨‍💻 **Engineering Lead**: "I have Jira issues → Import & enrich with code context"
- 📋 **Product Owner**: "I have a PRD → Upload & bulk create tickets from requirements"

### **Step 3: Core Workflow - Single Ticket** (ENHANCED - 1 slide)
- Current content (Connect, Analyze, Output, Deploy)
- ADD: Show all output types:
  - ✨ Problem statement
  - ✨ Solution design
  - ✨ Acceptance criteria (BDD)
  - ✨ API endpoints & changes
  - ✨ File changes by layer
  - ✨ Test plan (unit, integration, edge cases)
  - ✨ Quality score (0-100)

### **Step 4: PRD Breakdown Workflow** (NEW - 1 slide)
- "Have a PRD? Upload it in one step"
- Shows: Upload → Extract → Bulk create with checkboxes
- Benefit: "50 requirements → 50 tickets in 10 minutes"

### **Step 5: Bulk Enrichment** (NEW - 1 slide)
- "Already have 10 tickets in Jira?"
- Shows: Paste list → Answer common questions once → All 10 enriched
- Benefit: "Consistency + code context at scale"

### **Step 6: Import from Jira/Linear** (NEW - 1 slide)
- "Bring your existing issues"
- Shows: Jira/Linear icon → Import → Enrich
- Benefit: "Keep where you work, enrich with AI"

### **Step 7: Rich Features** (NEW - 1 slide)
Show the details users can add:
- 📎 **Reference Materials**: Upload designs, wireframes, PDFs, screenshots
- 🐛 **Reproduction Steps**: Add curl commands, API calls, console logs
- 📝 **Markdown Support**: Bold, italic, code in titles and descriptions
- 📊 **Quality Scoring**: Know how complete your spec is (0-100)

### **Step 8: Team & Collaboration** (NEW - 1 slide)
- Shared workspaces
- Role-based access control
- Team members working together
- Auto-synced with Linear/Jira

### **Step 9: Security & Privacy** (ENHANCED - 1 slide)
- Emphasize: "Your code never leaves GitHub"
- Expand on current PrivacyNote:
  - Read-only GitHub access
  - No code cloning or storage
  - Real-time analysis, results deleted after
  - Can disconnect anytime
  - GDPR compliant

### **Step 10: Connect GitHub** (Current - kept as final step)
- Only final action needed

---

## UI Changes Required

### **Layout Updates**
- **From:** 3 steps (Welcome, How It Works, GitHub)
- **To:** 7-10 steps with navigation
- Keep same carousel animation but with step counter "Step 4 of 10"

### **Visual Enhancements**
Add small icons/badges for each feature:
- 🎯 Problem Statement
- 💡 Solution Design
- ✅ Acceptance Criteria
- 🔌 API Endpoints
- 📁 File Changes
- ✅ Test Plan
- 📊 Quality Score
- 📎 Attachments
- 🐛 Reproduction Steps
- 🟦 Bulk Operations
- 👥 Team Features

### **Feature Matrix** (Optional - Visual Grid)
Create a 2x2 matrix:
```
┌────────────────┬─────────────────┐
│ Single Ticket  │ Bulk Tickets    │
├────────────────┼─────────────────┤
│ ✓ From scratch │ ✓ From PRD      │
│ ✓ From Jira    │ ✓ Bulk Enrich   │
│ ✓ From Linear  │ ✓ Batch import  │
│ ✓ Add details  │ ✓ Batch answers │
└────────────────┴─────────────────┘
```

---

## Content by Step

### **Step 2: Use Cases**
```
"Forge adapts to how you work"

👨‍💼 Product Manager
"I have a feature idea"
→ Describe + upload designs
→ Forge generates spec

🐛 QA Engineer
"I found a bug"
→ Screenshot + reproduce steps
→ Forge creates ticket

👨‍💻 Engineering Lead
"I have Jira issues"
→ Import + enrich
→ Tickets now code-aware

📋 Product Owner
"I have a PRD"
→ Upload document
→ Bulk create 50 tickets
```

### **Step 3: Core Features** (Enhance "How It Works")
```
"What you get — execution-ready engineering specs"

Problem Statement
"Clear description of what needs solving"

Solution Design
"Recommended approach, architecture, trade-offs"

Acceptance Criteria
"BDD format: Given/When/Then for test engineers"

API Endpoints
"New routes, DTOs, authentication changes"

File Changes
"What to modify, by layer: backend, frontend, shared"

Test Plan
"Unit, integration, and edge case coverage"

Quality Score
"0-100 score showing spec completeness and clarity"
```

### **Step 4: PRD Breakdown**
```
"Upload your PRD — generate 50 tickets in one go"

1. Upload PDF or paste PRD
2. Forge extracts requirements
3. Selective create: Choose which tickets to make
4. Auto-answer questions for consistency
5. All tickets enriched with code context

Perfect for: Product launches, feature rollouts, documentation import
```

### **Step 5: Bulk Enrichment**
```
"Already have 10 Jira tickets? Enrich them all at once"

1. Paste ticket list (titles or keys)
2. Answer clarification questions once
3. All 10 tickets enriched with:
   - Code analysis
   - Detected APIs
   - Test recommendations
   - Implementation details

Time saved: 2x faster than one-by-one
```

### **Step 6: Import Workflows**
```
"Bring your issues from Jira or Linear"

Jira Import
- Issue key → Preserved with mapping
- Priority, type → Auto-mapped
- Enrich with code context

Linear Import
- Team key → Preserved
- Status → Synced
- Enrich with code context

One-way or two-way sync options
```

### **Step 7: Rich Details**
```
"Everything a developer needs"

📎 Reference Materials
Upload designs, wireframes, PDFs, screenshots
→ Forge reads them during analysis

🐛 Reproduction Steps
- Add curl commands → Auto-parsed
- Add screenshots
- Add console logs
- Add request/response examples

📝 Markdown
Bold, italic, code in titles
→ Rich formatting support

📊 Quality Score
Live feedback on spec completeness
→ Improve score → Better tickets
```

### **Step 8: Team & Workspace**
```
"Built for teams, not individuals"

Shared Workspaces
- Multiple team members
- Role-based access
- Audit trail

Auto-Sync
- Jira/Linear bidirectional
- Status updates
- Progress tracking
- Notifications
```

### **Step 9: Security**
```
"Your code stays yours"

Read-Only Access
✓ Only GitHub API (read files, list dirs)
✗ Never clone repository
✗ Never write commits
✗ Never push code

Data Privacy
✓ Analyze in-memory (10-25 files)
✓ Results deleted after generation
✓ Never store full source
✗ Snippets used only for context

You Control
✓ Disconnect anytime
✓ Revoke access immediately
✓ Export your data
✓ GDPR compliant
```

---

## Implementation Strategy

### **Phase 1: Add Missing Steps** (Week 1)
1. Add "Use Cases" step (4 user journeys)
2. Expand "How It Works" with all output types
3. Add "PRD Breakdown" step
4. Update footer navigation to show "Step X of 10"

### **Phase 2: Add Advanced Workflows** (Week 2)
1. Add "Bulk Enrichment" step
2. Add "Import Workflows" step
3. Add "Rich Details" step

### **Phase 3: Add Context Steps** (Week 3)
1. Add "Team & Collaboration" step
2. Enhance "Security" step with privacy details
3. Polish transitions and animations

### **Phase 4: Polish & Iterate** (Week 4)
1. A/B test with new users
2. Gather feedback on understanding
3. Refine messaging based on metrics
4. Add video tutorials (future)

---

## Success Metrics

After onboarding, users should understand:
✅ What Forge can do (single, bulk, import, PRD)
✅ What outputs they get (complete specs)
✅ That their code is secure
✅ That it works with their tools (Jira, Linear)
✅ That they can import and enrich existing issues
✅ That they can add rich details (designs, steps, etc.)

Measure by:
1. **Completion Rate**: % who finish onboarding
2. **Feature Discovery**: % who try each workflow within 7 days
3. **Security Confidence**: Survey response "I trust Forge with my code"
4. **Value Realization**: "I understood the value" (onboarding exit survey)

---

## Content Checklist

- [ ] Step 1: Welcome (keep current)
- [ ] Step 2: Use Cases (4 personas)
- [ ] Step 3: Core Features (expanded outputs)
- [ ] Step 4: PRD Breakdown (new)
- [ ] Step 5: Bulk Enrichment (new)
- [ ] Step 6: Import Workflows (new)
- [ ] Step 7: Rich Details (new)
- [ ] Step 8: Team Features (new)
- [ ] Step 9: Security (enhanced)
- [ ] Step 10: GitHub Connect (keep current)
- [ ] Navigation: Step counter "X of 10"
- [ ] Progress bar: Visual indication
- [ ] Animations: Smooth transitions
- [ ] Mobile: Responsive design
- [ ] Dark mode: Full support

---

## Why This Matters

Current onboarding shows Forge as:
**"GitHub → AI Analysis → Ticket"**

Improved onboarding shows Forge as:
**"GitHub/Jira/Linear/PRD → AI Analysis → Rich Specs → Sync → Teams"**

The difference:
- **Current**: Single-ticket workflow only
- **Improved**: Multiple entry points (create, import, bulk, PRD)
- **Current**: "Here's a tech spec"
- **Improved**: "Here's problem, solution, AC, APIs, files, tests, quality score"
- **Current**: "Connect GitHub"
- **Improved**: "Your code is safe. Here's how."
- **Current**: 3 steps
- **Improved**: 10 steps showing 80% of platform capability

This transforms onboarding from "Here's one workflow" to "Here's what's possible with Forge"
