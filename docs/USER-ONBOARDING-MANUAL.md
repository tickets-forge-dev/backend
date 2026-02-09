# FORGE USER ONBOARDING MANUAL
## Getting Started & Understanding the System

**For:** New Forge users (PMs, product managers, engineering leads, founders)
**Goal:** Understand how Forge works, what to expect, and how to get maximum value
**Tone:** Friendly, clear, jargon-free

---

## PART 1: WELCOME TO FORGE

### What You're About to Do

You're about to turn your product ideas into complete, detailed engineering specifications in minutes instead of hours.

No more:
- ❌ Vague ticket descriptions that confuse your team
- ❌ Back-and-forth with engineers clarifying what you meant
- ❌ Incomplete specs that miss important details
- ❌ Spending hours writing technical details you don't understand

Instead:
- ✅ Complete specifications your engineers actually want
- ✅ Clear acceptance criteria (no ambiguity)
- ✅ Specific details about APIs, file changes, and tests
- ✅ Done in 5-10 minutes

---

### The Big Picture: How Forge Works (30-Second Version)

```
You describe a feature
        ↓
Forge reads your code
        ↓
AI generates a complete spec
        ↓
You refine it (optional)
        ↓
Export to Linear/Jira/Markdown
        ↓
Share with your team
```

That's it. Let's go deeper.

---

## PART 2: THE 5-STEP WORKFLOW

### Step 1: Connect Your GitHub Repository (5 minutes)

**What this is:** Forge needs to read your codebase to understand your tech stack and architecture.

**How it works:**
1. Click "Connect Repository" in Forge
2. Authorize GitHub (you'll see a popup)
3. Select which repository you want to connect
4. Done!

**What Forge does with your code:**
- ✅ Reads files (one time, understanding only)
- ✅ Never modifies your code
- ✅ Doesn't store your code
- ✅ Encrypts your GitHub token
- ❌ Doesn't train on your code
- ❌ Doesn't share with anyone

**What you need:**
- GitHub account (GitHub.com)
- Admin or write access to the repo (we only need to read, but GitHub requires write access)
- Internet connection (duh)

**After this step:**
You'll see your repository connected in Forge. You're ready to create your first specification.

---

### Step 2: Describe Your Feature (5 minutes)

**What this is:** You explain what you want to build.

**How it works:**
1. Click "New Ticket" in Forge
2. Type your feature description in plain English
3. Add any context (mockups, designs, screenshots if you have them)
4. Click "Analyze Repository"

**What to include in your description:**
- **What:** What feature are you building? ("Add dark mode toggle")
- **Why:** Why is this important? ("Users work at night, need dark mode for comfort")
- **Who:** Who benefits? ("All users, especially night users")
- **Constraints:** Any limits? ("Must be available on mobile and desktop")

**Example (Good):**
> "Add a dark mode toggle to the settings page. Users requested this for comfortable night usage. Should be available on all screens (mobile, tablet, desktop). User preference should be saved and remembered across sessions."

**Example (Bad):**
> "Dark mode"

(Too vague. Give Forge more to work with.)

**What you can add:**
- 📸 Upload screenshots or mockups (Forge will analyze them)
- 📝 Paste requirements
- 🎨 Describe design intent
- ⚙️ Mention technical constraints

**Time to expect:**
- Simple feature: 2 minutes to write
- Complex feature: 5 minutes

---

### Step 3: Forge Analyzes Your Codebase (10-15 seconds)

**What's happening behind the scenes:**

1. **Fingerprinting (1-2 seconds):** Forge scans your repository structure
   - Detects tech stack (React? Node? PostgreSQL?)
   - Finds relevant files
   - Understands architecture

2. **File Selection (2-3 seconds):** AI picks the most relevant files
   - "Which files will this feature touch?"
   - Selects 10-15 key files
   - Ignores node_modules, tests, build artifacts

3. **Specification Generation (5-10 seconds):** Claude AI generates the full spec
   - Reads the selected files
   - Understands your patterns
   - Creates a complete specification

**What you'll see:**
- Progress bar: "Analyzing..." → "Selecting Files..." → "Generating Spec..."
- Tech stack detected (React, Node.js, PostgreSQL, etc.) appears
- Spec appears on screen

**What to expect:**
- ✅ Fast (usually 8-15 seconds total)
- ✅ Accurate (understands your architecture)
- ❌ Might miss some details (you can add them next)

---

### Step 4: Review Your Specification (5-10 minutes)

**What you'll see:**

A complete specification with these sections:

**Problem Statement**
- Clear explanation of what you're building and why
- This is the "context" your engineers need

**Solution**
- How to build it
- Architectural approach
- File organization

**Acceptance Criteria**
- Specific conditions that define "done"
- Format: "Given this state, When this happens, Then this result"
- No ambiguity

**Backend Changes (if applicable)**
- Exact files that will change
- New database fields
- API endpoints (routes, methods, parameters)

**Frontend Changes (if applicable)**
- React components that will be created/updated
- Hooks you'll need
- UI changes

**Test Plan**
- What your QA team should test
- Unit tests, integration tests, edge cases
- "What if someone uploads a 100MB image?" type thinking

**Quality Score**
- 0-100 rating of how complete the spec is
- 90+ is excellent
- Below 90? Answer clarification questions (next step)

---

### Step 5: Answer Clarification Questions (Optional, 5 minutes)

**When this appears:**

If your spec scores below 90, Forge asks up to 5 questions to improve it.

**Example questions:**
- "Should dark mode also apply to modals and popovers?"
- "What should happen if the user has auto-dark-mode enabled on their device?"
- "Should theme preference be synced across devices?"

**How it works:**
1. Question appears (one at a time, friendly format)
2. You select an answer or type your response
3. Click "Next"
4. Repeat for all questions
5. Forge regenerates the spec with your clarifications

**Time:**
- Usually 2-3 questions
- 1-2 minutes per question
- Total: 5-10 minutes

**What happens:**
- Quality score goes up (usually 85 → 94)
- Spec becomes more complete
- Ambiguity disappears

**Why this matters:**
- Better clarifications = better specs
- Better specs = faster engineering
- Faster engineering = ship sooner

---

## PART 3: UNDERSTANDING YOUR SPECIFICATION

### The Quality Score: What It Means

**0-40:** Incomplete. Missing major sections.
**40-70:** Okay. Has content but ambiguous. Needs work.
**70-90:** Good. Most details present. Could be clearer.
**90-100:** Excellent. Complete, specific, ready to ship.

**What boosts the score:**
- ✅ Clear problem statement (why are we building this?)
- ✅ Specific acceptance criteria (how do we know it's done?)
- ✅ Detailed file changes (which exact files change?)
- ✅ Test plan (what should QA verify?)
- ✅ API documentation (endpoints, methods, payloads)

**What lowers the score:**
- ❌ Vague acceptance criteria ("make it work")
- ❌ Missing API details
- ❌ No test plan
- ❌ Unclear problem statement

---

### How to Read Each Section

**Problem Statement**
- Read this to understand the "why"
- Share this with your team to align on vision
- If it doesn't sound right, click "Edit" to fix it

**Solution**
- This is the "how"
- Shows architectural decisions
- You probably don't need to change this (engineers will)
- Read to verify it matches your intent

**Acceptance Criteria (Given/When/Then)**
- These define what "done" means
- **Given:** Starting state
- **When:** Action taken
- **Then:** Expected result
- Example:
  ```
  Given: User is on settings page
  When: User clicks dark mode toggle
  Then: App switches to dark mode and saves preference
  ```
- These are for your engineers AND your QA team
- Very important for clarity

**Backend Changes**
- List of files and APIs that will change
- You probably don't understand all of it (that's okay)
- Just verify "does this look reasonable?"

**Frontend Changes**
- Components and screens that will change
- More accessible to PMs
- Verify: "Does this cover what I described?"

**Test Plan**
- What should your QA team test?
- Types of tests: unit tests, integration tests, edge cases
- Share this with QA before starting
- Important for quality assurance

---

## PART 4: EDITING YOUR SPECIFICATION

### When to Edit

**Edit the spec if:**
- ✅ The problem statement doesn't match your intent
- ✅ A file listed is incorrect
- ✅ An acceptance criterion is wrong
- ✅ The API endpoint design doesn't match your vision

**Don't edit if:**
- ❌ You don't understand a technical detail (that's normal, ask an engineer)
- ❌ You want to make small formatting changes (not necessary)
- ❌ You're unsure (answer clarification questions instead)

### How to Edit

**Option 1: Click "Edit" on any section**
- Section opens in edit mode
- You can rewrite it
- Quality score may go down (Forge doesn't re-analyze)
- Your changes take priority

**Option 2: Answer clarification questions**
- Forge asks smart questions
- You answer
- Spec regenerates automatically
- Quality score usually goes UP
- Preferred way to improve specs

---

## PART 5: EXPORTING YOUR SPECIFICATION

### Where Your Spec Goes

Once you're happy, export it to where your team works.

**Option 1: Export to Linear**
- If your team uses Linear
- Specification becomes a Linear issue
- All acceptance criteria, APIs, tests included
- Can assign to team member
- Click: "Export to Linear"

**Option 2: Export to Jira**
- If your team uses Jira
- Specification becomes a Jira issue
- Acceptance criteria become subtasks
- Test plan becomes linked epic
- Click: "Export to Jira"

**Option 3: Copy Markdown**
- If you use Slack, Notion, Google Docs, GitHub Issues, or anything else
- Click: "Copy Markdown"
- Paste anywhere
- Specification formatted as readable markdown

### What Happens Next

Once exported:
- Your team gets a clear specification
- Engineers can start estimating
- QA can start planning tests
- You can move on to the next feature

---

## PART 6: COMMON QUESTIONS

### Q: "How accurate is Forge?"

**A:** About 95% correct for most features.

What Forge gets right:
- ✅ File locations (which files change)
- ✅ Component names (which React components)
- ✅ API patterns (REST endpoints, methods)
- ✅ Testing approach (what to test)

What Forge sometimes misses:
- ❌ Edge cases (answer clarification questions to improve)
- ❌ Performance details
- ❌ Advanced use cases

**Solution:** Answer clarification questions to fill gaps.

---

### Q: "Do I need to be technical?"

**A:** No. You can use Forge without understanding code.

Forge handles the technical details. Your job is:
- Describe what you want
- Verify it makes sense
- Answer questions if asked

An engineer on your team should review the spec (for validation), but you don't need to understand every technical detail.

---

### Q: "How much does it cost?"

**A:** Free for starters.

- **Free tier:** 5 specifications per month (enough to try it out)
- **Pro:** $19/month unlimited specifications
- **Team:** $49/month per person (team workspace, collaborate, multi-repo)

No credit card required for free tier. Try it first.

---

### Q: "Can I use Forge for our existing features?"

**A:** Yes!

- Create a specification for a feature you already built
- Forge will understand your code
- Useful for documentation, refactoring specs, handoff docs

---

### Q: "What if I don't like the first spec?"

**A:** Edit it or regenerate it.

**Option 1:** Click "Regenerate"
- Forge creates a new spec from scratch
- Might be different (better? worse? depends)

**Option 2:** Edit manually
- Keep what you like
- Change what you don't
- Merge both approaches

---

### Q: "How long does it take?"

**A:** 5-10 minutes per specification.

Breakdown:
- Describe feature: 2-3 minutes
- Forge analysis: 10-15 seconds
- Review spec: 2-3 minutes
- Answer questions (optional): 5 minutes
- Export: 30 seconds

Total: 5-10 minutes. Way faster than writing manually.

---

### Q: "What if my team uses a tool Forge doesn't export to?"

**A:** Use Markdown export.

Click "Copy Markdown" and paste the spec into:
- Slack (thread)
- Notion (database or page)
- Google Docs
- GitHub Issues
- Email
- Confluence
- Anything that accepts text

Specification is portable everywhere.

---

### Q: "Do you store my code?"

**A:** No.

- Your code is read once during analysis
- It's not stored in our system
- It's not used to train AI
- Your GitHub token is encrypted
- Your specs are stored (in Firestore, encrypted)

Privacy guaranteed.

---

### Q: "Can I use this for multiple projects?"

**A:** Yes! Create multiple repositories.

- Each repo = separate connection
- You can generate specs for any repo
- Free tier: 5 specs total (any repos)
- Pro tier: unlimited specs (any repos)

---

## PART 7: TIPS FOR BETTER SPECIFICATIONS

### Write Better Feature Descriptions

**Include these 4 things:**

1. **WHAT**
   > "Add user avatars to the profile page"

2. **WHY**
   > "Users want to personalize their profiles. Avatars make the app feel more personal and friendly."

3. **WHO**
   > "All users, but especially returning users who want to build identity."

4. **CONSTRAINTS** (if any)
   > "Must work on mobile. Max file size 5MB. Supported formats: JPG, PNG."

**Example (Full):**
> "Add user avatars to the profile page. Users have requested the ability to upload a profile picture to personalize their accounts. This makes the app feel more social and friendly. All users should be able to upload an avatar (JPG or PNG, max 5MB). The avatar should display on their profile page, in comment threads, and in the team members list. Mobile support required."

**The more context you give, the better the spec.**

---

### Add Mockups (Optional But Powerful)

If you have:
- 🎨 Wireframes
- 📸 Screenshots
- 🖼️ Design mockups
- 📋 Figma links

Upload them! Forge will analyze them and generate even better specs.

---

### Answer Clarification Questions Fully

When Forge asks questions, don't skip them.

**Bad:** Click "Skip" to get the spec
**Good:** Take 5 minutes to answer

Each answer makes your spec 5-10% better. Quality compound.

---

### Review Before Exporting

Always review your spec before sending to your team.

Ask yourself:
- ✅ Does this describe what I wanted?
- ✅ Are the acceptance criteria clear?
- ✅ Did Forge miss anything important?
- ✅ Would my team understand this?

If yes to all: Export. If no: Edit or regenerate.

---

## PART 8: WORKFLOW EXAMPLES

### Example 1: Simple UI Feature

**Feature:** Dark mode toggle

**Your input:**
> "Add a dark mode toggle to the settings page. Users work at night and want a comfortable dark interface. Should remember their preference."

**Forge generates (45 seconds):** Complete spec
- Problem: Clear why dark mode matters
- Solution: Where to store preference, how to update UI
- Acceptance criteria: Toggle works, preference saved, applies on reload
- Components: DarkModeToggle component
- API: POST /api/user/theme endpoint
- Tests: Toggle works, preference persists, works on dark OS preference
- Quality: 89/100

**You:** Answer 2 questions
- "Should theme apply to tooltips and popovers?" → "Yes"
- "System dark mode preference detection?" → "Prefer user choice, ignore system"

**Quality improves to:** 94/100

**Time:** 8 minutes total

**Export:** Linear → Engineers start building

---

### Example 2: Complex API Feature

**Feature:** Payment subscriptions

**Your input:**
> "Implement subscription billing using Stripe. Users should be able to choose monthly or yearly plans. Show active subscription status on dashboard. Admins can view subscription analytics. Include automatic renewal and cancellation flow."

**Forge generates (12 seconds):** Complete spec
- Problem: Clear why subscriptions matter
- Solution: Stripe integration approach, database schema
- Acceptance criteria: Sign up for plan, manage subscription, receive receipts
- Backend changes: Stripe webhook handlers, subscription endpoints
- Frontend: Subscription chooser, dashboard status, management UI
- Migrations: Add subscription table, add fields to users
- APIs: POST /subscriptions, GET /subscriptions/:id, DELETE /subscriptions/:id
- Tests: Payment flow, renewal, cancellation, edge cases
- Quality: 87/100

**You:** Answer 4 questions
- Plan options? → "Monthly $19, Yearly $180"
- Free trial? → "7-day free trial"
- Cancellation: Refund? → "No refunds, immediate cancellation"
- Failed payment retry? → "3 retry attempts over 3 days"

**Quality improves to:** 96/100

**Time:** 15 minutes total

**Export:** Linear → Engineering sprint planned

---

## PART 9: WORKFLOW FOR TEAMS

### If You're a Product Manager

1. Describe the feature
2. Review the spec
3. Answer clarification questions
4. Export to Linear
5. Share with engineering lead
6. Discuss any questions
7. Greenlight for engineering

---

### If You're a CTO / Engineering Lead

1. Review specs from PM
2. Check accuracy (does it match our architecture?)
3. Validate acceptance criteria (are they testable?)
4. Assign to team member
5. Engineer builds from spec

---

### If You're a Startup Founder

1. Brainstorm feature ideas
2. Create specs for top 3 ideas
3. Share with team
4. Discuss trade-offs
5. Build highest-priority features first

---

## PART 10: WHAT TO EXPECT AT EACH STAGE

### Stage 1: Signup (Immediate)
- You get access to Forge
- Free tier: 5 specs/month
- You can start immediately

### Stage 2: First Connection (5 minutes)
- Connect GitHub repo
- See your tech stack detected
- Ready to create first spec

### Stage 3: First Specification (10 minutes)
- Create your first spec
- See the "magic moment" (spec generates)
- Review output
- Might feel incomplete (answer questions to improve)

### Stage 4: Improvement (5 minutes)
- Answer clarification questions
- Watch quality score improve
- Spec becomes more complete

### Stage 5: Export (1 minute)
- Export to Linear/Jira/Markdown
- Share with team
- Wow moment (engineers see the quality)

### Stage 6: Iteration (Ongoing)
- Create more specs
- Get faster at describing features
- Your specs improve naturally
- Team alignment improves

### Stage 7: Scale (When you're ready)
- Free tier feeling limited? Upgrade to Pro
- Team wanting to collaborate? Upgrade to Team tier
- Pro tip: Team tier is game-changing for multi-person teams

---

## PART 11: SUCCESS METRICS

**How do you know Forge is working?**

Track these:

**Speed:**
- Before: How long to write one ticket? (typically 45 min)
- After: How long with Forge? (typically 5-10 min)
- **Savings:** 30-40 minutes per ticket

**Quality:**
- Before: Acceptance criteria clarity? (often vague)
- After: Acceptance criteria clarity? (specific, Given/When/Then)
- **Improvement:** Less back-and-forth

**Team Alignment:**
- Before: Back-and-forth clarifications? (typical: 3-5 messages)
- After: Clarifications needed? (typical: 0-1 message)
- **Improvement:** Engineers understand first time

**Time to Ship:**
- Before: Days from "idea" to "shipped"
- After: Same or faster (clear specs accelerate building)

---

## PART 12: TROUBLESHOOTING

### Issue: "Spec is missing important details"

**Cause:** Your feature description was too vague
**Solution:** Edit the description, click "Regenerate", or answer clarification questions

---

### Issue: "Forge picked the wrong files"

**Cause:** Your repository structure is non-standard OR your description was unclear
**Solution:** Edit the "Backend Changes" section manually, add specific files

---

### Issue: "Quality score is low (below 70)"

**Cause:** Feature description wasn't detailed enough
**Solution:**
1. Answer clarification questions (fastest)
2. Edit the feature description, regenerate
3. Manually improve weak sections

---

### Issue: "I don't understand a section"

**Cause:** That's normal! You don't need to understand everything
**Solution:** Share with an engineer, have them explain

---

### Issue: "Export to Linear failed"

**Cause:**
- Linear connection expired
- Workspace doesn't exist
- Project is archived
**Solution:** Disconnect/reconnect Linear, verify workspace/project exists, try again

---

### Issue: "Can I edit my spec after exporting?"

**Answer:** Yes!
- Edit in Forge
- Can re-export (updates Linear/Jira issue)
- Your team gets the updated spec

---

## PART 13: NEXT STEPS

### After Your First Spec

1. ✅ Create it
2. ✅ Review it
3. ✅ Export to Linear/Jira
4. ✅ Share with your engineering team
5. ✅ Watch them build from your spec

### Feedback Loop

1. Engineers build from your spec
2. Ask them: "Was the spec clear?"
3. Did they have clarifying questions?
4. Use that feedback for next spec
5. Get better over time

### Scale Up

- **Week 1:** Create 1-2 specs, learn the process
- **Week 2:** Create 3-5 specs, get comfortable
- **Week 3+:** Create as many specs as you need
- **After 1 month:** You're probably wondering how you lived without Forge

---

## PART 14: THE BIG PICTURE

**What Forge Does:**
- ✅ Turns your ideas into specifications
- ✅ Saves you 30-40 minutes per feature
- ✅ Eliminates ambiguity
- ✅ Aligns your team
- ✅ Speeds up shipping

**What Forge Doesn't Do:**
- ❌ Replace your engineering team
- ❌ Guarantee bugs-free code
- ❌ Do the actual building
- ❌ Make decisions for you

**The Real Benefit:**
You spend less time writing specs and more time thinking strategically about what to build next.

---

## FINAL THOUGHTS

Forge is a tool to make your job easier.

- It's not magic (though it might feel like it)
- It's not a replacement for communication
- It IS a massive time-saver
- It IS a force multiplier for your team

**Your first spec might feel weird.** That's normal. By the third one, it'll be obvious.

**Questions?**
- Check the FAQ in the app
- Email support@forge.dev.ai
- We're here to help

---

## QUICK REFERENCE

**Time breakdown:**
- Describe feature: 2-3 min
- Forge analysis: 10-15 sec
- Review: 2-3 min
- Questions (optional): 5 min
- Export: 30 sec
- **Total: 5-10 min**

**Quality score:**
- 90+: Excellent, ready to ship
- 70-89: Good, ready with notes
- <70: Needs work, answer questions

**Tech stack:** Any GitHub repo
**Cost:** Free (5/month) → Pro ($19/mo) → Team ($49/mo per person)

**Support:** Email support@forge.dev.ai

---

**Welcome to Forge. You're about to build a lot faster. 🚀**
