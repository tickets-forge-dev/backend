# Ticket Quality Roadmap — Most Value Per Feature

**Goal:** Maximize the quality and completeness of generated technical specifications with minimum effort.

---

## Tier 1: High Impact, Low Effort (Do First!)

### **Epic 20: Spec Quality (API Detection, BE/FE Split, Test Plan)**
**Status:** Backlog (from EPIC-ONBOARDING-GAPS.md, Stories 1-3)
**Estimated Effort:** 1-2 weeks
**Impact:** ⭐⭐⭐⭐⭐ Directly improves spec completeness

**What it does:**
- 20-1: **API Endpoint Detection** — Auto-detect which API routes/controllers/DTOs will change
- 20-2: **Backend/Client Split** — Group changes into explicit "Backend Changes" vs "Client Changes" sections
- 20-3: **Test Plan Generation** — Generate test cases (unit, integration, edge cases) for each spec
- 20-4: **Interactive API Editor (Mini Postman)** — Users manually add/edit API endpoints. Choose "from detected" or "create new". Form includes: method (GET/POST/etc.), URL, request payload, response shape. Detected APIs from 20-1 pre-populate the selection list.

**Why it matters:**
- These are the **#1 gaps users mention** when looking at generated specs
- Fills promises made in onboarding (Connect → Analyze → **Developer-Ready Output**)
- 20-1/20-2/20-3 require only LLM prompt enhancements, no infrastructure changes
- 20-4 gives users control over API specs (auto-detect isn't always perfect)
- Immediately noticeable in every ticket generated

**Implementation path:**
1. Extend `DeepAnalysisService` prompt to extract API changes
2. Enhance `TechSpecGenerator` to organize by layer and add test plan
3. Update frontend to display these sections
4. Build API editor UI (mini Postman) with "from detected" / "create new" flow

**Stories:** 20-1, 20-2, 20-3, 20-4 (20-1/20-2/20-3 can parallelize; 20-4 depends on 20-1)

---

### **Epic 2: Code Guardrails Detection**
**Status:** Backlog (from EPIC-FUTURE-FEATURES.md)
**Estimated Effort:** 1 week
**Impact:** ⭐⭐⭐⭐ Prevents specs from ignoring project rules

**What it does:**
- Auto-detect `CLAUDE.md`, `.cursorrules`, ESLint rules, tsconfig strict mode, CI constraints
- Store guardrails on AEC and inject into all LLM prompts
- Show guardrails on ticket detail page

**Why it matters:**
- Specs that ignore `CLAUDE.md` are worthless to you
- Fixes major pain point: "The spec generated code that violates our project rules"
- Most projects have guardrails files already (you definitely do!)

**Implementation path:**
1. Extend config file reading in `DeepAnalysisService`
2. Create `Guardrails` value object
3. Inject into `TechSpecGenerator` prompts
4. Display on ticket detail

**Stories:** 2-1, 2-2, 2-3, 2-4, 2-5 (can parallelize)

---

## Tier 2: High Impact, Medium Effort (After Tier 1)

### **Epic 20 + Epic 2 Combo**
**Combined Impact:** Your specs will now include **correct architecture**, **real test plans**, **API changes**, and **respect your guardrails**. This is ~80% of spec quality.

---

### **Epic 1: Enhanced Ticket Context (Images + Text)**
**Status:** Backlog (from EPIC-FUTURE-FEATURES.md)
**Estimated Effort:** 1-2 weeks
**Impact:** ⭐⭐⭐⭐ Enables richer context for better specs

**What it does:**
- Add textarea + drag-and-drop for images in Stage 1
- Upload to Firebase Storage
- Pass images to LLM (multimodal analysis)

**Why it matters:**
- Mockups, diagrams, screenshots dramatically improve spec quality
- Infrastructure mostly ready (Firebase Storage already configured)
- High ceiling on quality improvement if users upload good context

**Implementation path:**
1. Create `StorageService` wrapper (Firebase Storage)
2. Add upload UI to Stage1Input
3. Pass image URLs to `DeepAnalysisService` and `TechSpecGenerator`

**Stories:** 1-1, 1-2, 1-3, 1-4, 1-5 (1-2 can parallelize)

---

## Tier 3: Medium Impact, Low Effort (Quick Wins)

### **Epic 4: Markdown Preview Page**
**Status:** Backlog (from EPIC-FUTURE-FEATURES.md)
**Estimated Effort:** 3-5 days
**Impact:** ⭐⭐⭐ Polish — makes specs look/read better

**What it does:**
- Install `react-markdown` + syntax highlighting
- Create reusable `MarkdownRenderer` component
- Add `/preview` route for rendered specs

**Why it matters:**
- Specs are Markdown — showing them properly rendered matters for UX
- Reusable foundation for other features
- Zero backend work

**Implementation path:**
1. Install dependencies
2. Create `MarkdownRenderer` component
3. Create `/preview` route

**Stories:** 4-1, 4-2, 4-3, 4-4, 4-5 (can parallelize)

---

## Tier 4: Spec Output Infrastructure (Enables Export)

### **Epic 3: Tech Spec Document + Artifacts**
**Status:** Backlog (from EPIC-FUTURE-FEATURES.md)
**Estimated Effort:** 1-2 weeks
**Impact:** ⭐⭐⭐⭐ Prepares specs for export to Linear/Jira

**What it does:**
- Generate Markdown from TechSpec JSON
- Save artifacts (markdown + images) to Firebase Storage
- Show "Artifacts" section on ticket detail

**Why it matters:**
- Foundation for exporting specs (Epic 5)
- Gives users a downloadable deliverable
- Clean separation of concerns

**Implementation path:**
1. Create `TechSpecMarkdownGenerator` (pure function)
2. Create `ArtifactStorageService` (Firebase wrapper)
3. Wire into `FinalizeSpecUseCase`
4. Add "Artifacts" section to ticket detail

**Stories:** 3-1, 3-2, 3-3, 3-4, 3-5 (1-3 can parallelize)

---

## Tier 5: Export Integrations (Unlocks "Deploy" Promise)

### **Epic 5: Linear + Jira Export**
**Status:** Backlog (from EPIC-FUTURE-FEATURES.md)
**Estimated Effort:** 3-4 weeks
**Impact:** ⭐⭐⭐⭐⭐ Fulfills "Deploy" promise — tickets flow to the platform they use

**What it does:**
- OAuth for Linear and Jira
- Export button on ticket → creates issue in Linear/Jira
- Attaches full artifact bundle (XML contract, Markdown docs, images)

**Why it matters:**
- **Most important for user workflow**: they live in Linear/Jira
- Completes the promised loop: Connect → Analyze → Output → **Deploy** → Track
- Massive quality perception boost (even if specs aren't perfect yet, they're in the right place)

**Implementation path:**
1. Linear OAuth + API client (easier, do first)
2. Jira OAuth + API client (more complex)
3. Export use case + endpoint
4. Artifact bundling

**Stories:** 5-1, 5-2, 5-3, 5-4, 5-5, 5-6, 5-7, 5-8

---

## Recommended Execution Order

```
Phase 1: Spec Quality (2 weeks)
├─ Epic 20: API Detection, BE/FE Split, Test Plan ........... 1.5 weeks
└─ Epic 2:  Code Guardrails Detection ...................... 1 week
   Result: Specs are complete, correct, and respect your rules

Phase 2: Context + Output (2 weeks)
├─ Epic 1:  Enhanced Context (images + text) ............... 1.5 weeks
└─ Epic 4:  Markdown Preview (quick win) ................... 3-5 days
   Result: Richer input → better specs, prettier output

Phase 3: Storage (1 week)
└─ Epic 3:  Tech Spec Artifacts ........................... 1 week
   Result: Specs are downloadable, ready for export

Phase 4: Deploy (3-4 weeks)
└─ Epic 5:  Linear + Jira Export .......................... 3-4 weeks
   Result: Specs flow directly to where teams work

Total: ~8 weeks to "complete ticket quality + export loop"
```

---

## Value Timeline

| Phase | Timeframe | What Changes | User Impact |
|-------|-----------|--------------|------------|
| Phase 1 | Weeks 1-2 | API detection, test plans, guardrails | **Specs are actually useful** |
| Phase 2 | Weeks 3-4 | Image context, markdown preview | **Specs are beautiful AND useful** |
| Phase 3 | Weeks 5-6 | Downloadable artifacts | **Users can archive specs** |
| Phase 4 | Weeks 7-10 | Linear/Jira export | **The "Deploy" promise works** |

---

## Alternative: Faster Path (Export Only)

If you want to ship **export integrations first** (Epic 5) without waiting for spec quality improvements:

```
Week 1-2: Epic 5 (Linear + Jira export)
Result: Users can send specs to Linear/Jira immediately
Risk: Specs may still be incomplete (no test plan, no API changes)
Upside: Users are unblocked, iterate based on feedback
```

**Not recommended** — specs need to be good before export (garbage → Linear = bad UX).

---

## My Recommendation

**Start with Epic 20 + Epic 2** (Spec Quality).

Why:
- They're the highest impact for minimal effort
- They're the biggest user complaints
- They unblock everything else
- No infrastructure work needed

Then iterate based on user feedback. If users keep saying "can you add test plans?", you know Epic 20 is right. If "I need to attach screenshots", that's Epic 1.

Which phase interests you most?
