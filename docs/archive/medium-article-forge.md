# I Built Forge Because I Was Tired of Bad Tickets

## A Developer's Journey from Frustration to Solution—And Why Your AI Coding Tools Aren't Solving This Problem

---

![Image suggestion: A split screen showing a frustrated developer on one side with a messy Slack thread, and a calm developer on the other side with a clean, complete spec]

---

## "Can You Add User Authentication?"

That was the entire ticket. Five words. No context. No acceptance criteria. No mention of which endpoints needed protection, what user roles existed, or whether we were talking about OAuth, JWT, or magic links.

I stared at my screen, already knowing what came next: **the ping-pong.**

*"Hey PM, quick question about the auth ticket..."*
*"Which APIs need to be secured?"*
*"What about the existing user table?"*
*"Should this work with our current session system?"*

Three days and **seventeen Slack messages later**, I finally understood what they actually wanted. By then, I'd already built half the wrong solution.

**Sound familiar?**

---

## 💸 The Real Cost of Bad Tickets

Here's what nobody talks about: **bad tickets don't just waste time—they destroy momentum.**

In my last project, I tracked it. On average:

- **2-3 days** per ticket spent in clarification ping-pong
- **40% of my "coding time"** was actually spec archaeology—digging through old tickets, Slack threads, and Figma comments trying to understand *what* to build
- **Every third ticket** required complete rework because the backend API I needed *didn't actually exist yet* (nowhere in the spec, nowhere in the roadmap)

The breaking point? A PM asked me, *"Why is this taking so long? It's just a simple form."*

That "simple form" required:
- 3 new API endpoints (not mentioned in the ticket)
- Changes to 7 existing files (which I had to discover myself)
- Edge case handling for 12 different validation scenarios (completely missing from the spec)
- Integration with a third-party service that wasn't documented anywhere

**I wasn't slow. The ticket was incomplete.**

---

> "The best product teams don't move fast because they code faster—they move fast because they waste less time on confusion."

---

## 🤝 Why PMs Can't Write Perfect Tickets (And That's OK)

Look, I get it. Product Managers aren't developers. You shouldn't have to know:

- Which files need to be modified
- What API endpoints exist or need to be created
- How the backend architecture is structured
- What edge cases might break the system

**That's not your job.** Your job is vision, strategy, and user needs.

But here's the problem: when the gap between *"what you describe"* and *"what developers need"* is too wide, everyone suffers.

- Developers waste time asking questions
- PMs get frustrated repeating themselves
- Projects miss deadlines
- Quality suffers because nobody caught the edge cases

**There had to be a better way.**

---

## 🔥 Building Forge: Turning "Add Auth" Into an Execution Plan

So I built [Forge](https://forge-ai.dev).

The idea was simple: **What if we could analyze your actual codebase and turn a PM's idea into a complete developer-ready spec—automatically?**

Not a vague ticket. Not a feature description. A **complete execution contract** with everything a developer needs to start coding immediately.

### Here's How It Works (The Non-Technical Version):

---

### **1. You Describe What You Want**

Just like you always do: "Add user authentication" or "Fix the bug where the form doesn't submit."

No technical jargon required. Write it the way you'd explain it to your team.

---

### **2. Forge Reads Your Codebase (Securely)**

Here's the magic: Forge analyzes your GitHub repository *without cloning anything*.

It scans your code the same way you browse files on GitHub—**read-only, secure, no data stored on disk**. Your code never leaves GitHub.

---

### **3. It Understands Your Tech Stack**

Forge auto-detects:
- Your languages and frameworks
- Your existing APIs and patterns
- Which files handle what functionality
- How your backend and frontend connect

---

### **4. But Here's Where Forge Gets Really Smart: It Asks Questions**

Most AI tools just take your input and spit out an answer. You say "add password reset" and they generate generic code.

**Forge doesn't do that.**

Instead, it asks you clarifying questions—**in plain English, specifically designed for non-technical PMs**:

**Example Questions Forge Might Ask:**

For a "password reset" feature:
- *"Should users receive a time-limited reset link via email, or a verification code?"*
- *"What should happen if someone requests multiple password resets in a row?"*
- *"Should the old password be required to set a new one, or just the reset link?"*
- *"Do we need to notify the user's email that a password reset was requested (security alert)?"*

For a "user profile" feature:
- *"Which fields should be editable by users vs. admin-only?"*
- *"Should profile changes require email re-verification?"*
- *"What happens if two users try to claim the same username?"*

**These aren't technical questions.** You don't need to know what a REST endpoint is or how JWT tokens work. Forge is asking about **product behavior**—the stuff you already understand.

And here's the magic: **by answering 5-7 simple questions, you improve the final spec by 10x.**

Why? Because Forge now knows:
- Edge cases you might have missed
- User flows that need to be handled
- Security considerations that matter
- Integration points with existing features

**ChatGPT can't do this.** It doesn't know what questions to ask about YOUR product.

**BMAD Method and other technical frameworks?** They're designed for engineers. You need to understand system architecture, API design, and data flow to use them effectively.

**Forge is built for PMs who think in user stories, not system diagrams.**

---

### **5. It Generates a Complete Spec**

Every ticket includes:

- **Problem Statement** - What and why
- **Solution Steps** - How to implement it
- **Acceptance Criteria** - What "done" looks like (BDD format: Given/When/Then)
- **File Changes** - Exactly which files to modify, create, or delete
- **API Endpoints** - New endpoints to create + existing ones to modify
- **Test Plan** - Unit tests, integration tests, edge cases
- **Tech Context** - Stack, dependencies, architecture notes

---

### **6. For Bug Tickets? Even Better.**

When you report a bug, Forge:
- Asks for **reproduction steps** (structured, not freeform)
- Fetches **design metadata** from Figma (if you've attached designs)
- Analyzes the code to find **likely causes**
- Suggests **related files** where the bug might be

**No more "it works on my machine" mysteries.**

---

## 📊 Real-World Example

### Before Forge:

> **Ticket:** "Add user authentication"
>
> **Developer Response:** *(3 days of questions)*
> - What type of auth?
> - Which pages?
> - What about existing sessions?
> - Do we have a users table?
> - Should this work with SSO?

---

### After Forge:

> **Ticket:** "Add user authentication"
>
> **Forge Output:**
>
> - **Problem:** Users can access protected routes without logging in
> - **Solution:** Implement JWT-based authentication with refresh tokens
> - **Files to Modify:** `auth.service.ts`, `user.controller.ts`, `auth.middleware.ts`
> - **Files to Create:** `jwt.strategy.ts`, `refresh-token.repository.ts`
> - **API Endpoints:**
>   - `POST /auth/login`
>   - `POST /auth/refresh`
>   - `POST /auth/logout`
> - **Acceptance Criteria:** 8 specific scenarios (Given/When/Then format)
> - **Edge Cases:** Token expiry, concurrent sessions, invalid credentials
> - **Test Plan:** 12 unit tests, 5 integration tests

**Developer starts coding immediately. No questions asked.**

---

## 🔗 Forge Doesn't Replace Jira—It Makes Your Jira Tickets Actually Useful

Let me be clear about something important:

**Forge is NOT a project management tool.**

You're not abandoning Jira or Linear. You're not learning a new workflow. You're not migrating your team to yet another platform.

**Forge does ONE thing really well: it creates complete, developer-ready specs.**

Then it hands them off to the tools you already use.

### Here's The Workflow:

**1. You Create a Ticket in Forge**
- Describe what you want (in plain English)
- Answer 5-7 clarifying questions
- Forge analyzes your codebase and generates the complete spec

**2. You Review & Customize**
- See the full technical spec with all details
- Edit any sections you want to change
- Choose which sections to include in the export

**3. You Export to Jira (or Linear)**

With one click, Forge creates a Jira ticket that includes:

**📋 Everything a Developer Needs:**
- **Tech Spec (Markdown)** - Human-readable specification
- **AEC XML File** - Agent Execution Contract that AI coding tools can parse
- **Structured JSON** - Machine-readable data for tracking
- **🔗 Link back to Forge** - One-click access to full context

### Your Jira Ticket Looks Like This:

```
Title: Add password reset functionality

Description:
🔗 View in Forge: https://forge-ai.dev/tickets/aec_abc-123

Problem Statement:
Users cannot recover their accounts if they forget their password...

Solution:
Implement JWT-based password reset flow with time-limited tokens...

Acceptance Criteria:
✓ Given a user forgot their password
  When they click "Forgot Password" and enter their email
  Then they receive a reset link valid for 24 hours...

File Changes:
- Create: auth/password-reset.service.ts
- Modify: auth/auth.controller.ts
- Modify: user/user.repository.ts

API Endpoints:
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /auth/verify-reset-token

Test Plan:
- Unit: password-reset.service.spec.ts (8 tests)
- Integration: password-reset.e2e.spec.ts (5 scenarios)

Attachments:
📄 aec_abc-123_tech-spec.md
📄 aec_abc-123_aec.xml (agent execution contract)
📄 aec_abc-123_tech-spec.json
```

**Your developer opens Jira, sees this ticket, and can start coding immediately.**

### Why This Matters:

**Jira is where developers TRACK work.**
**Forge is where PMs CREATE work.**

Think of it like:
- **Google Docs** = Where you write the content
- **Email** = Where you send it to people

Similarly:
- **Forge** = Where you generate the complete spec
- **Jira** = Where developers track and execute it

**You don't replace email just because you use Google Docs. They work together.**

Same with Forge and Jira.

---

> "Instead of asking 'Why is this taking so long?', PMs can now ask 'What can we build next?'"

---

## 🤔 "But We Already Have AI Tools—Why Do We Need Forge?"

I hear this all the time. And honestly? It's a fair question.

**"We have Cursor AI."**
**"We have GitHub Copilot."**
**"We have Claude in VS Code."**
**"Why can't I just paste the ticket into ChatGPT?"**

Here's the thing: **those tools are amazing—for developers who already know what to build.**

Let me be blunt about who Forge is *not* for:

### Forge Is NOT For:

- Senior developers who live in VS Code and can read the entire codebase in their sleep
- Technical PMs who know Git, can review pull requests, and understand API contracts
- Teams where PMs pair-program with developers and speak fluent "backend"

**If that's you, you probably don't need Forge. Keep using Cursor. It's incredible.**

### But Here's Who DOES Need Forge:

**90% of Product Managers.**

Why? Because **most PMs are not technical.** They don't use VS Code. They don't clone repos. They don't know what a REST endpoint is, and *that's completely fine*—**it's not their job.**

But here's the problem those AI coding tools don't solve:

---

## 🚫 The Problem AI Coding Assistants DON'T Fix

Let's say you're a PM and you write this ticket:

> "Users should be able to reset their password via email."

You paste it into ChatGPT. Great! It gives you some generic code.

**Now what?**

- Which files in *your* codebase need to change?
- What if your auth system uses JWT tokens instead of sessions?
- What if you already have a password reset flow that's half-implemented?
- What if your email service is SendGrid, not AWS SES?
- What about rate limiting? Security tokens? Expiration times?

**ChatGPT doesn't know your codebase.** It can't read your GitHub repo. It gives you generic answers that *might* work—or might conflict with everything you've already built.

**And even if you describe your codebase to ChatGPT?** It still makes assumptions. It generates a generic solution and hopes it fits.

**Forge doesn't guess—it asks questions first**, then generates a spec tailored to your exact requirements.

Want password reset with email verification? Forge asks: *"Time-limited link or verification code?" "Should it expire after one use or multiple attempts?"*

**ChatGPT assumes the default. Forge clarifies, then builds.**

That's the difference between a 70% accurate spec (close enough?) and a 95% accurate spec (developer starts coding immediately, no questions).

---

**Cursor/Copilot?** Amazing for developers who already know:
- Which files to open
- What the existing patterns are
- How the architecture works
- What APIs already exist

But they require you to:
1. Open VS Code (most PMs don't use it)
2. Clone the repo (most PMs don't have Git set up)
3. Navigate the codebase (most PMs can't read TypeScript)
4. Write code (definitely not the PM's job)

**Forge solves the problem BEFORE the developer even opens VS Code.**

---

## 🎯 Why Forge Is Still Critical in 2026

Here's what makes Forge different—and necessary—even in a world full of AI coding tools:

### 1. **Forge Reads YOUR Codebase (Securely, No Cloning)**

AI coding assistants are generic. Forge is *context-aware*.

When a PM says "add password reset," Forge:
- Scans your actual GitHub repo (read-only, secure)
- Detects your tech stack (Next.js + NestJS + PostgreSQL)
- Finds your existing auth patterns (`auth.service.ts`, `user.repository.ts`)
- Identifies which APIs already exist and which need to be created
- Sees that you're using SendGrid for emails (not AWS SES)

**Result:** The spec is tailored to YOUR codebase, not a generic tutorial.

ChatGPT can't do this. Cursor can't do this without a developer driving it.

---

### 2. **Forge Is Built For Non-Technical PMs**

You don't need:
- VS Code installed
- Git knowledge
- Terminal access
- Coding experience

You just describe what you want in plain English. Forge handles the technical translation.

**This is the key difference:** AI coding tools help *developers code faster*. Forge helps *PMs communicate clearly*.

---

### 3. **Forge Prevents Bad Tickets (AI Assistants Don't)**

AI coding tools are reactive—they help you write code *after* you know what to build.

Forge is proactive—it creates the complete spec *before* coding starts.

**The ticket quality problem doesn't go away just because developers have better coding assistants.** In fact, it gets worse:

- Developer opens Cursor
- Asks Copilot to "implement the ticket"
- Copilot generates code based on incomplete spec
- Code works... but doesn't match what the PM actually wanted
- Now you have rework, not just questions

**Forge ensures the spec is complete FIRST.** Then developers can use their AI tools effectively because they know exactly what to build.

---

### 4. **Forge Bridges Teams, Not Just Code**

Claude in VS Code is a 1:1 developer tool. It helps one developer code faster.

Forge is a **team collaboration tool**. It:
- Translates PM language into developer specs
- Exports to Jira/Linear so PMs can track progress
- Generates structured tickets that AI agents can execute
- Creates a shared understanding between PMs and developers

**You can't copy-paste a Jira ticket into Cursor and expect it to work.** But you *can* export a Forge ticket to Jira, and then developers can use Cursor/Copilot to implement it—because the spec is complete.

---

### 5. **Forge Refines Through Questions (Not Guesswork)**

Here's a dirty secret about AI tools: **they guess a lot.**

You paste "add user authentication" into ChatGPT. It assumes:
- You want JWT tokens (maybe you use sessions?)
- You want OAuth (maybe you need magic links?)
- You have a users table (maybe you use Firebase Auth?)

**Every assumption is a potential mismatch with what you actually need.**

Forge eliminates guesswork with targeted questions:

**Instead of assuming, Forge asks:**
- "Should users log in with email/password, OAuth (Google/GitHub), or magic links?"
- "Do you need role-based permissions (admin/user/guest)?"
- "Should sessions persist across devices or expire after closing the browser?"

**You answer in plain English. Forge translates to technical specs.**

This is why Forge's output quality is **exponentially better** than generic AI responses:

| **Generic AI Tool** | **Forge with Questions** |
|----------------|---------------------|
| Makes assumptions | Clarifies uncertainties |
| Generates one version | Refines iteratively |
| Generic best practices | Tailored to your product |
| Misses edge cases | Proactively asks about edge cases |
| Developer has to guess context | Developer gets complete context |

**BMAD Method and other engineering frameworks?** They're powerful—but they require you to understand system design, architecture patterns, and technical tradeoffs. They're built for developers who can read UML diagrams and data flow charts.

**Forge is built for the average PM** who thinks in user stories like:
- "As a user, I want to reset my password so I can regain access to my account"
- "As an admin, I want to see all users who signed up this month"

**No technical knowledge required. Just answer questions about your product, and Forge handles the technical translation.**

---

## 📐 The Real Question Isn't "Why Forge?"—It's "Why Are We Still Writing Bad Tickets?"

In 2026, we have:
- AI that writes code
- AI that reviews pull requests
- AI that generates tests
- AI that debugs issues

**But we still have the same problem we had in 2016:** PMs and developers speaking different languages.

**Forge doesn't replace AI coding tools. It makes them BETTER by giving developers complete specs to feed into those tools.**

Think of it this way:

- **ChatGPT** = Generic AI tutor (doesn't know your project)
- **Cursor/Copilot** = Developer productivity tool (requires technical knowledge)
- **Forge** = PM-to-Developer translator (bridges the communication gap)

**You need all three.** But only Forge solves the "bad ticket" problem at the source.

---

## 🏗️ Final Analogy: The Architect and the Contractor

Imagine you want to build a house.

- **ChatGPT** is like asking Google "how to build a house." You get generic advice.
- **Cursor/Copilot** is like giving a contractor a power drill. Great tool—but they still need a blueprint.
- **Forge** is the architect. It takes your vision ("I want a two-story house") and creates a complete blueprint with electrical plans, plumbing specs, and material lists.

**Then the contractor (developer) can use their power tools (AI coding assistants) to build it correctly.**

Without the blueprint? The contractor builds something... but it might not be what you wanted.

**That's why Forge matters in 2026.**

---

## 🎬 Why I Built This

I didn't build Forge because I wanted to replace PMs. I built it because I was tired of:

- Wasting time on preventable communication gaps
- Watching good ideas get lost in translation
- Seeing deadlines slip because of incomplete specs
- Feeling like I was always playing detective instead of developer

**Forge doesn't replace your judgment.** It amplifies it. You bring the vision—Forge handles the technical translation.

---

## ✨ Ready to Stop the Ping-Pong?

If you've ever:
- Sent a ticket and immediately gotten 5 questions back
- Discovered mid-sprint that a "simple feature" requires backend work nobody knew about
- Watched developers spend more time asking questions than writing code

**Forge might be exactly what your team needs.**

Because great product managers shouldn't need to be great developers. They just need great tools.

---

**Try Forge:** [forge-ai.dev](https://forge-ai.dev)
**Questions? Connect with me:** [Your LinkedIn/Twitter]

---

> *"The best product is one where the PM and developer speak the same language. Forge is the translator."*

---

**Tags:** #ProductManagement #SoftwareDevelopment #AI #Productivity #Engineering #Jira #AgileWorkflow #TechSpecs #DeveloperTools
