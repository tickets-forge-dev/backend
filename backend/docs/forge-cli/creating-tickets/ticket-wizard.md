---
title: "Ticket Wizard"
excerpt: "Create a complete, code-aware spec from a single sentence."
category: "Creating Tickets"
---


The ticket wizard walks you from a rough idea to a complete specification — no technical knowledge needed.

## Start Creating

From the dashboard, click **Create** (top right) and choose:

- **Create Feature** — New functionality
- **Create Bug Report** — Bug with reproduction steps
- **Create Task** — Task with requirements
- **Import Ticket** — Pull from Jira or Linear (see [Importing & Exporting](/docs/creating-tickets/importing-exporting))

## Step 1: Describe What You Want

Give your ticket a clear **title** — the more specific, the better spec Forge produces.

| Good title | Bad title |
|------------|-----------|
| "Add Google OAuth login with redirect to /dashboard" | "Add auth" |
| "Show warning banner when CSV has duplicate emails" | "Handle CSV uploads" |

Add a **description** if you have more context — user stories, links, background. You can also [dictate it by voice](/docs/creating-tickets/voice-dictation).

Choose a **type** (Feature, Bug, or Task) and **priority** level.

## Step 2: Connect a Repository (Optional)

Toggle on **"Include repository context"** to connect a GitHub repo. Forge reads the actual code — your framework, file structure, and patterns — so the generated spec references real files in your project.

## Step 3: Generation Options

Choose whether to generate a [wireframe and/or API spec](/docs/creating-tickets/generation-options). For features, both are on by default.

## Step 4: Answer Clarification Questions

Forge asks 5–8 targeted questions based on your description. If a repo is connected, the questions are informed by your actual code.

For each question you'll see either predefined options to pick from, checkboxes when multiple answers apply, or a free-text field. Answer naturally — like you're explaining to a colleague.

You can:
- **Skip** questions you're unsure about — the developer can fill them in later
- **Skip all remaining** to let Forge use sensible defaults
- **Go back** to change a previous answer

### Tips for Better Specs

| Do | Don't |
|----|-------|
| Be specific about expected behavior | Say "it should work normally" |
| Call out edge cases and error scenarios | Only describe the happy path |
| Mention constraints (performance, security) | Assume the AI knows your context |

## Step 5: Review the Generated Spec

Forge produces a full technical specification and shows you a summary:

- **Quality Score** — How complete the spec is (green = 75+, ready to go)
- **Files Affected** — How many files the implementation will touch
- **Acceptance Criteria** — Number of testable scenarios
- **Test Plan** — Number of test cases

Click **View Ticket** to explore the full spec, assign a developer, and continue the [review and approval](/docs/managing-tickets/review-approval) flow.
