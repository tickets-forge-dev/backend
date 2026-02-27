---
title: "Web App Guide"
excerpt: "A complete walkthrough of the Forge web app — from dashboard to ticket approval."
category: "Platform"
---


The Forge web app is the primary interface for PMs and the dashboard for everyone on the team. This guide covers every feature.

## Dashboard

The dashboard shows all tickets for your team, with filtering and sorting options.

### Filters

| Filter | Options |
|--------|---------|
| **Status** | Draft, Dev-Refining, Review, Forged, Executing, Complete |
| **Priority** | Low, Medium, High, Urgent |
| **Type** | Feature, Bug, Task |
| **Assignee** | Any team member |

### Ticket List

Each ticket card shows:
- Title and ticket ID
- Current status badge
- Priority indicator
- Type label
- Assignee avatar
- Readiness score (when available)
- Last updated timestamp

Click a ticket to open the detail view.

## Creating a Ticket

Navigate to **Create Ticket** from the dashboard.

### Required Fields

| Field | Rules |
|-------|-------|
| **Title** | 3–500 characters. Be specific: "Add JWT auth to /api/v1/users" is better than "Add auth" |

### Optional Fields

| Field | Description |
|-------|-------------|
| **Description** | Freeform context — user stories, background, links |
| **Type** | `feature` (new functionality), `bug` (fix), or `task` (chore/maintenance) |
| **Priority** | `low`, `medium`, `high`, or `urgent` |
| **Assignee** | Developer responsible for execution |

The ticket is created in **Draft** status.

## AI Question Rounds

After creating a ticket, Forge's AI generates clarification questions based on your title and description. These questions are designed to fill the gaps needed for a complete spec.

### How to Answer Well

| Do | Don't |
|----|-------|
| Be specific about expected behavior | Say "it should work normally" |
| Reference existing patterns in the codebase | Leave answers blank |
| Call out edge cases and error scenarios | Only describe the happy path |
| Mention constraints (performance, security) | Assume the AI knows your context |

### What Happens Next

Once you answer the questions, Forge generates a **tech spec** containing:
- Acceptance criteria (Given/When/Then)
- File changes
- API contracts
- Scope boundaries
- Assumptions

You can review and edit the spec before moving forward.

## Review Session

When a developer submits a review via the CLI (`forge review`), the ticket transitions to **Review** status. You'll see the developer's Q&A pairs in the ticket detail view.

### Reading Developer Q&A

Each Q&A pair shows:
- The question the AI asked the developer
- The developer's answer (with code context and technical details)

This is where developers add real-world context: which patterns to follow, existing code to reuse, edge cases from experience.

### Re-baking the Spec

After reading the developer Q&A, you can **Re-bake** the spec. This tells Forge to regenerate the tech spec incorporating the developer's answers.

The AI updates:
- Acceptance criteria with developer-informed conditions
- File changes based on actual codebase structure
- API contracts refined with implementation details
- Scope adjusted based on developer feedback

You can re-bake multiple times until the spec is right.

### Approving

When the spec looks good, click **Approve**. The ticket transitions from **Review** to **Forged**.

> :thumbsup: Approving locks the AEC. The developer now has a verified contract to execute against.

## Assigning Tickets

Assign a team member from the ticket detail view:
- Select from the assignee dropdown
- The assigned developer receives access to the ticket via CLI
- Assignment works at any status except Complete

To unassign, clear the assignee field.

## Design References

Attach design links to provide visual context for developers:

| Platform | Example URL |
|----------|-------------|
| **Figma** | `https://figma.com/file/abc123/...` |
| **Loom** | `https://loom.com/share/abc123` |
| **Other** | Any HTTPS URL |

Forge auto-detects the platform and fetches metadata (title, thumbnail) when available.

Limits:
- Maximum 10 design links per ticket
- URLs must be HTTPS

## Attachments

Upload files to provide additional context:

| Supported | Details |
|-----------|---------|
| **Images** | PNG, JPG, GIF, WebP |
| **Documents** | PDF, DOC, DOCX |
| **Limit** | 5 files per ticket |

Attachments are available to both the web app and CLI users.

## Exporting Tickets

Push a Forged ticket to your project tracker:

### Linear
Export directly to a Linear workspace. The AEC content is formatted as a Linear issue with:
- Title and description
- Acceptance criteria in the body
- Labels mapped from ticket type

### Jira
Export to a Jira project. The AEC content is formatted as a Jira issue with:
- Summary and description
- Acceptance criteria as a formatted table
- Priority mapped from Forge priority levels

> :blue_book: Exporting transitions the ticket to **Executing** status.

## Importing Tickets

Pull existing work into Forge for enrichment:

### From Jira
Import a Jira issue by URL or issue key. Forge creates a Draft ticket with the Jira issue's title, description, and metadata.

### From Linear
Import a Linear issue by URL. Same behavior as Jira import.

### From GitHub PRD
Paste a link to a GitHub document or PRD to import as a Draft ticket.

## PRD Breakdown

For larger documents, use the **Breakdown** feature:

1. Paste or upload a PRD (Product Requirements Document)
2. Forge's AI splits it into multiple tickets
3. Each ticket captures a discrete unit of work
4. Review and edit the generated tickets
5. Each becomes an independent AEC that goes through the standard lifecycle

This is useful for turning a product brief into an actionable backlog.

## Team & Workspace Settings

### Team Settings
- Manage team members (invite, remove)
- Set team name and description

### Workspace Settings
- Configure connected repositories
- Manage integrations (Jira, Linear)
