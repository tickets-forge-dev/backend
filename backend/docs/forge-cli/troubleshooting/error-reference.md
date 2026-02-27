---
title: "Error Reference"
excerpt: "Complete reference of error codes, messages, and fixes for the Forge CLI and API."
category: "Troubleshooting"
---


This page lists every error you might encounter from the Forge CLI, organized by category.

## HTTP Errors

These errors come from the Forge API and are translated into user-friendly messages by the CLI.

| HTTP Code | Error | Cause | Fix |
|-----------|-------|-------|-----|
| **401** | `Session expired` | Access token is invalid or expired | The CLI auto-refreshes on 401. If it persists, run `forge login` |
| **403** | `No permission` | You don't have access to this resource | Verify team membership with `forge whoami`. Ask the team admin if needed |
| **404** | `Not found` | The ticket ID doesn't exist or belongs to a different team | Double-check the ID. Verify your team with `forge whoami` |
| **409** | `Conflict` | A concurrent modification was detected | Retry the operation. If it persists, check the ticket in the web app |
| **422** | `Validation error` | The request data failed validation | Check the error message for details (e.g., "Title must be 3–500 characters") |
| **429** | `Rate limited` | Too many requests in a short period | Wait a moment and retry. The CLI respects rate limit headers |
| **500** | `Server error` | Something went wrong on the server | Retry after a few seconds. If persistent, check the Forge status page |
| **502** | `Bad gateway` | Server is temporarily unavailable | Wait and retry |
| **503** | `Service unavailable` | Server is under maintenance or overloaded | Wait and retry |

## Domain Errors

These errors come from the domain model and indicate invalid operations.

### InvalidStateTransitionError

```
Cannot start dev-refine from <status>
Cannot forge from <status>
Cannot export from <status>
Cannot mark complete from <status>. Only draft or executing tickets can be marked complete.
Cannot revert to draft from <status>. Only complete tickets can be reverted.
Cannot assign a completed ticket. Revert to draft first.
Cannot send back from <status> to <target>
Cannot send back to <target> — it is not before <status>
```

**Cause:** You're trying to transition a ticket to a status that isn't valid from its current status.

**Fix:** Check the ticket's current status with `forge show <id>` and refer to the [Ticket Lifecycle](/docs/platform/ticket-lifecycle) for valid transitions.

### InsufficientReadinessError

```
Score <score> < 75
```

**Cause:** The ticket's readiness score is below the minimum threshold (75) required to forge.

**Fix:** The spec needs more detail. Answer more clarification questions or submit a developer review to increase the readiness score.

### QuotaExceededError

```
Ticket limit reached
```

**Cause:** Your team has reached the maximum number of tickets for your plan.

**Fix:** Contact your team admin about upgrading the plan, or archive completed tickets.

### Validation Errors

```
Title must be 3-500 characters
Title cannot be empty
Maximum of 5 attachments per ticket
Maximum of 10 design links per ticket
Cannot set external issue without a tech spec
```

**Cause:** Input data doesn't meet domain constraints.

**Fix:** Adjust the input to meet the specified constraints.

## Config Errors

### Malformed Config File

```
Failed to parse config file: ~/.forge/config.json
```

**Cause:** The config file contains invalid JSON.

**Fix:**
```bash
forge logout
forge login
```

This recreates the config file with valid credentials.

### Missing Config File

```
Config file not found: ~/.forge/config.json
```

**Cause:** The config file doesn't exist.

**Fix:**
```bash
forge login
```

## `forge doctor` Failures

Each diagnostic check has a specific fix when it fails:

| Check | Failure Message | Fix |
|-------|----------------|-----|
| **Config file** | `NOT FOUND — ~/.forge/config.json missing` | Run `forge login` |
| **Config file** | `INVALID — config.json is not valid JSON` | Run `forge logout` then `forge login` |
| **Authenticated** | `NOT SET — no email in config` | Run `forge login` |
| **API reachable** | `UNREACHABLE — cannot connect to <url>` | Check network/firewall. Verify `FORGE_API_URL` if set |
| **Token valid** | `EXPIRED — access token has expired` | Run `forge login` (auto-refresh failed) |
| **Claude CLI** | `NOT FOUND — 'claude' command not in PATH` | Install [Claude Code](https://claude.com/claude-code) |
| **MCP registered** | `NOT FOUND — .mcp.json missing or no forge entry` | Run `forge mcp install` |

## MCP Tool Errors

Errors returned when AI assistants call MCP tools:

| Tool | Error | Cause | Fix |
|------|-------|-------|-----|
| `get_ticket_context` | `Ticket not found` | Invalid ticket ID | Verify the ID with `forge show` |
| `update_ticket_status` | `Invalid status transition` | The transition isn't allowed | Check current status and valid transitions |
| `submit_review_session` | `Empty Q&A items` | No questions/answers provided | Ensure the review session produced Q&A pairs |
| Any tool | `Not authenticated` | Missing or expired credentials | Run `forge login` |
| Any tool | `Network error` | Can't reach the API | Check connectivity with `forge doctor` |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error — check stderr for the message |

> :blue_book: All error messages are printed to stderr. Redirect stdout for clean scripting: `forge show T-001 2>/dev/null`
