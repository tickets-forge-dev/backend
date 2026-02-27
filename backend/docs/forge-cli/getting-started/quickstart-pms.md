---
title: "Quickstart for PMs"
excerpt: "Create your first verified ticket in under 5 minutes using the Forge web app."
category: "Getting Started"
---


This guide walks you through the real creation flow — from a blank ticket to a forged AEC. Everything happens in the web app.

## Prerequisites

- A Forge account (sign up with Google or GitHub)
- A team (created automatically on first login)

## Step 1: Start the Creation Wizard

From the ticket dashboard, click the **Create** button (top right). You'll see three options:

- **New ticket** — Start from scratch
- **Import** — Pull an existing issue from Jira or Linear
- **Breakdown** — Paste a PRD and let AI split it into multiple tickets

Choose **New ticket** to start the guided wizard.

## Step 2: Describe What You Need

The wizard opens with a clean input screen. Fill in:

**Type and Priority** — Select from the top bar:
- Type: Feature, Bug, or Task
- Priority: Low, Medium, High, or Urgent

**Ticket Description** — The main input. Describe what you want built in plain language. Be specific about the outcome, not the implementation.

| Good | Bad |
|------|-----|
| "Add Google OAuth login. Users should land on /dashboard after signing in. Show an error if auth fails." | "Add auth" |
| "When a user uploads a CSV with duplicate emails, show a warning banner listing the duplicates and let them choose to skip or overwrite." | "Handle CSV uploads" |

Minimum 2 words, maximum 500 characters. The AI uses this to generate clarification questions and the final spec.

**Repository Context** (optional but powerful) — Toggle on **"Include repository context"** to connect a GitHub repo. Select the repository and branch. Forge's AI will scan the codebase to understand your tech stack, patterns, and file structure before generating the spec.

**Reference Materials** (optional) — Upload images, PDFs, or docs as additional context. Useful for mockups, PRDs, or design references.

Click **Next** to proceed. If you included a repository, Forge analyzes it first (you'll see a progress indicator).

## Step 3: Answer Clarification Questions

Forge's AI generates targeted questions based on your description. These fill the gaps needed for a complete spec.

Questions appear **one at a time**. For each question, you'll see either:

- **Pre-defined options** — Radio buttons with common answers. Pick one, or choose "Type your own answer" for a custom response.
- **Free text** — Type your answer directly.

After you answer, the wizard auto-advances to the next question. You can also:

- **Skip** a question you can't answer yet
- **Skip all remaining** if you want the AI to use defaults
- **Go back** to change a previous answer

> :blue_book: Better answers produce better specs. If you're unsure about a technical question, skip it — the developer can fill it in later during their review.

## Step 4: Review the Generated Spec

After all questions are answered, Forge generates the full technical specification. You'll see a **"Ticket Ready"** summary with:

- **Quality Score** — A percentage (0–100) showing how complete the spec is. Color-coded: green (75+), amber (50–74), red (below 50).
- **Files Affected** — How many files the implementation will touch
- **Acceptance Criteria** — Number of Given/When/Then scenarios
- **Test Plan** — Number of test cases generated

Below the stats, you'll see collapsible sections: Problem, Solution, File Changes, API Endpoints, Acceptance Criteria, and Test Plan. Expand any section to review the details.

Click **View Ticket** to go to the full ticket detail page. From there you can edit, assign, and manage the ticket through its lifecycle.

## Step 5: Explore the Ticket Detail

The ticket detail page shows everything about your AEC in three tabs:

| Tab | What's Inside |
|-----|--------------|
| **Spec** | Problem statement, acceptance criteria, scope (in/out), solution approach, visual QA expectations |
| **Design** | Figma and Loom links — add design references here |
| **Technical** | File changes, API endpoints, dependencies, test plan, tech stack |

The **AEC Crown Card** at the top shows the full contract in XML format (click "Show" to expand). This is what AI agents and developers execute against.

## Step 6: Assign and Wait for Developer Review

Use the **assignee selector** in the overview bar to assign a developer. They'll use the Forge CLI to:

1. Review the spec with additional code context
2. Submit a Q&A session with their technical questions and answers

When they submit, the ticket moves to **Review** status and you'll see their Q&A in the ticket detail.

## Step 7: Review, Re-bake, Approve

In the **Developer Review Q&A** section, read through the developer's questions and answers. This is where they add real-world context — which patterns to follow, edge cases from experience, existing code to reuse.

Click **"Approve & Forge AEC"** to:
1. Re-enrich the spec with the developer's Q&A context
2. Lock the AEC as verified

The ticket transitions to **Forged** status. The AEC is now a verified contract — the developer knows exactly what to build.

> :thumbsup: After forging, the AEC is locked. The quality score is 75+ and every section has been validated.

## Alternative: Import from Jira or Linear

Instead of creating from scratch, you can import existing issues:

1. Click **Create → Import**
2. Select **Jira** or **Linear**
3. Enter the issue ID (e.g., `PROJ-123`)
4. Preview the imported content
5. Select a repository for context
6. Forge enriches the imported issue into a full AEC

This lets you take vague tickets from your existing backlog and run them through Forge's enrichment flow.

## What's Next?

- [The AEC](/docs/platform/aec) — Understand every section of the Agent Execution Contract
- [Ticket Lifecycle](/docs/platform/ticket-lifecycle) — See how tickets move through statuses
- [Web App Guide](/docs/platform/web-app-guide) — Detailed walkthrough of every feature
