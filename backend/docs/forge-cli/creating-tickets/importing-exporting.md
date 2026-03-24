---
title: "Importing & Exporting"
excerpt: "Sync tickets between Forge and your project tracker — Jira and Linear."
category: "Creating Tickets"
---


Forge integrates with Jira and Linear for two-way ticket sync.

## Importing Tickets

Pull existing work into Forge for enrichment.

### From Jira

Import a Jira issue by URL or issue key. Forge creates a Draft ticket with the Jira issue's title, description, and metadata.

### From Linear

Import a Linear issue by URL. Same behavior as Jira import.

### What Happens After Import

Imported tickets arrive as **Drafts**. You can then:
- Connect a repository for codebase context
- Run through the clarification Q&A flow
- Generate a full tech spec — turning a vague external ticket into a complete AEC

## Exporting Tickets

Push a Forged ticket to your project tracker.

### To Linear

Export directly to a Linear workspace. The AEC content is formatted as a Linear issue with:
- Title and description
- Acceptance criteria in the body
- Labels mapped from ticket type

### To Jira

Export to a Jira project. The AEC content is formatted as a Jira issue with:
- Summary and description
- Acceptance criteria as a formatted table
- Priority mapped from Forge priority levels

> Exporting transitions the ticket to **Executing** status.

## Setting Up Integrations

Configure Jira and Linear connections in **Settings → Team → Integrations**. You'll need:

| Platform | What's needed |
|----------|---------------|
| **Jira** | API token + Jira site URL |
| **Linear** | Linear API key |
