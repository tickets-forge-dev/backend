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
| **Status** | Draft, Defined, Refined, Approved, Executing, Delivered |
| **Priority** | Low, Medium, High, Urgent |
| **Type** | Feature, Bug, Task |
| **Assignee** | Any team member |

### Ticket Grid

The ticket grid is a responsive table that adapts to your screen size:

| Breakpoint | Columns shown |
|------------|---------------|
| Mobile (<640px) | Title, Score, Actions |
| sm (640px+) | + Status, Priority |
| md (768px+) | + Assignee, Updated |
| lg (1024px+) | + Creator, Tags, Type |

Each row shows:
- Title and ticket ID
- Current status badge
- Priority indicator
- Type label
- Assignee avatar
- Creator name
- Tags (colored labels)
- Readiness score (when available)
- Last updated timestamp
- Folder location (if filed)

### Column Management

Customize which columns are visible and their order:

- Click the **column settings** icon in the grid header
- Toggle columns on/off
- Drag columns to reorder them
- Your preferences persist across sessions

### Ticket Tags

Add colored tags to tickets for quick categorization:

- Click the **tag icon** on any ticket or use the detail view
- Create new tags with custom names and colors
- Filter the grid by tags
- Tags are team-scoped — all members see the same tag library

Tickets can be organized into **folders** for grouping related work. See [Ticket Folders](#ticket-folders) below.

Click a ticket to open the detail view.

## Ticket Folders

Organize your ticket feed with folders — collapsible inline sections that group related tickets.

### Creating Folders

Click the **"+ Folder"** button near the top of the ticket feed. Enter a name and press Enter or click the checkmark. Folder names must be unique within your team.

### Moving Tickets into Folders

Two ways to move tickets:

| Method | How |
|--------|-----|
| **Drag and drop** | Grab any ticket row and drag it onto a folder header. A blue highlight shows valid drop targets. Release to move. |
| **Context menu** | Right-click a ticket (or click the three-dot menu) → "Move to..." → select a folder or "Unfiled" |

To move a ticket back to the root feed, drag it to the **"Unfiled"** drop zone (appears during drag), or use the context menu and select "Unfiled."

### Folder Display

- Folders appear at the top of the feed, sorted alphabetically
- Each folder row shows: expand/collapse chevron, folder icon, name, ticket count
- Click the chevron to expand — tickets inside appear indented with a visual connector
- Unfiled tickets appear below all folders

### Folder Scope

Folders can be set to different visibility levels:

| Scope | Who sees it |
|-------|-------------|
| **Team** | All team members see and can use the folder |
| **Private** | Only you see the folder |

### Managing Folders

Right-click a folder (or click the three-dot icon) to:
- **Rename** — Inline edit the folder name
- **Reorder** — Drag folders up/down to change their sort order
- **Delete** — Removes the folder; all tickets inside move back to the root feed

### Expand/Collapse State

Each user's expand/collapse preferences are stored privately and persist across sessions. Other team members see the same folders but control their own expanded/collapsed view.

---

## Creating a Ticket

Navigate to **Create Ticket** from the dashboard.

### Required Fields

| Field | Rules |
|-------|-------|
| **Title** | 3–500 characters. Be specific: "Add JWT auth to /api/v1/users" is better than "Add auth" |

### Optional Fields

| Field | Description |
|-------|-------------|
| **Description** | Freeform context — user stories, background, links. Supports voice dictation (see below). |
| **Type** | `feature` (new functionality), `bug` (fix), or `task` (chore/maintenance) |
| **Priority** | `low`, `medium`, `high`, or `urgent` |
| **Assignee** | Developer responsible for execution |

The ticket is created in **Draft** status.

## Voice Dictation

Instead of typing, speak your ticket description using the built-in speech-to-text feature:

- Press **S** on your keyboard or click the **Speak** button to start recording
- A real-time **waveform visualizer** shows audio input
- **Interim results** appear as you speak, so you can see what's being transcribed
- Press **S** again or click the button to stop
- Audio feedback: a subtle beep plays on start and stop

Voice dictation uses the browser's built-in Web Speech API — no additional setup needed.

## Generation Options

During ticket creation, you can optionally enable AI-generated wireframes and API specifications. These appear as toggles in the **Generation Options** step of the wizard.

| Option | Default (Feature) | Default (Bug/Task) | What it generates |
|--------|-------------------|---------------------|-------------------|
| **Wireframes** | On | Off | HTML wireframe preview based on the ticket description |
| **API Spec** | On | Off | REST endpoint definitions with request/response schemas |

### HTML Wireframes

When wireframes are enabled, Forge generates an interactive HTML wireframe that shows the proposed UI. The wireframe:

- Uses your project's design tokens (colors, fonts, spacing) when a repository is connected
- Opens in a large dialog (90% viewport width) for detailed inspection
- Can be regenerated if the first result doesn't match your vision

The wireframe appears in the **Design** tab of the ticket detail view alongside any manually attached design references.

## AI Question Rounds

After creating a ticket, Forge's AI generates clarification questions based on your title and description. These questions are designed to fill the gaps needed for a complete spec.

### How to Answer Well

| Do | Don't |
|----|-------|
| Be specific about expected behavior | Say "it should work normally" |
| Reference existing patterns in the codebase | Leave answers blank |
| Call out edge cases and error scenarios | Only describe the happy path |
| Mention constraints (performance, security) | Assume the AI knows your context |

Questions may include **multi-select checkboxes** when multiple options apply (e.g., "Which platforms should this support?"). Select all that are relevant.

### What Happens Next

Once you answer the questions, Forge generates a **tech spec** containing:
- Acceptance criteria (Given/When/Then)
- File changes
- API contracts
- Scope boundaries
- Assumptions

You can review and edit the spec before moving forward.

## Review Session

When a developer submits a review via the CLI (`forge review`), the ticket transitions to **Refined** status. You'll see the developer's Q&A pairs in the ticket detail view.

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

When the spec looks good, click **Approve**. The ticket transitions from **Refined** to **Approved**.

> :thumbsup: Approving locks the AEC. The developer now has a verified contract to execute against.

## Assigning Tickets

Assign a team member from the ticket detail view:
- Select from the assignee dropdown
- The assigned developer receives access to the ticket via CLI
- Assignment works at any status except Delivered

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

Push an Approved ticket to your project tracker:

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

## Background Jobs & Notifications

Spec generation and codebase analysis run as background jobs. Forge keeps you informed throughout:

### Progress Tracking

- An **elapsed time counter** shows how long the analysis has been running
- You can **send a job to the background** and continue working — Forge notifies you when it's done

### Notifications

When a background job completes:
- A **completion chime** plays (audio notification)
- A **browser notification** appears if the tab is not focused (requires notification permission)

### Job Recovery

If a job gets stuck (e.g., due to a network issue):

| Indicator | What it means |
|-----------|---------------|
| **Stale warning** | Job has been running longer than expected — a yellow warning appears |
| **Recover button** | Click to manually retry the stuck job |
| **Auto-recovery** | Forge automatically detects and recovers stale jobs when possible |

You can also **cancel** a running job and start over.

---

## Team & Workspace Settings

### Team Settings
- Manage team members (invite, remove)
- Set team name and description

### Workspace Settings
- Configure connected repositories
- Manage integrations (Jira, Linear)
