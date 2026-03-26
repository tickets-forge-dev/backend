# Ticket Lifecycle

## Overview

Every ticket in Forge moves through a defined lifecycle from initial draft to delivery. The lifecycle is modeled as an explicit state machine — status transitions are enforced by the domain layer and cannot be skipped.

## Lifecycle Flow

```
Draft → Defined → Refined → Approved → Executing → Delivered
```

Tickets can also be **Archived** from any status.

## Status Descriptions

| Status | Value | Description |
|--------|-------|-------------|
| `Draft` | `draft` | Initial state. Ticket has been created but not yet worked on. |
| `Defined` | `defined` | A developer has begun refining the ticket. Spec generation may be in progress. |
| `Refined` | `refined` | The spec is complete. The ticket has been reviewed and is awaiting PM approval. |
| `Approved` | `approved` | PM has approved the ticket. Ready for a developer to begin implementation. |
| `Executing` | `executing` | A developer has started implementation. Branch is created and linked. |
| `Delivered` | `delivered` | Implementation is complete. PR created or work shipped. |
| `Archived` | `archived` | Ticket is no longer active. Can be set from any status. |

## Transition Rules

| From | To | Trigger |
|------|----|---------|
| `draft` | `defined` | Developer starts spec generation (`forge review`) |
| `defined` | `refined` | Review session submitted (`forge review` completes) |
| `refined` | `approved` | PM approves ticket (web UI or `update_ticket_status`) |
| `approved` | `executing` | Developer starts implementation (`forge develop`) |
| `executing` | `delivered` | Developer marks ticket delivered |
| Any | `archived` | PM or developer archives the ticket |

## CLI Commands by Status

- `forge review <ticketId>` — requires `defined` status
- `forge develop <ticketId>` — requires `approved` status

## MCP Tool: `update_ticket_status`

Valid status values: `draft`, `defined`, `refined`, `approved`, `executing`, `delivered`, `archived`

See [MCP Integration](../cli-and-mcp/mcp-integration.md) for full tool schema.
