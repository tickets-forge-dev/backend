# Ticket Lifecycle

## Overview

Every ticket in Forge moves through a defined lifecycle from initial draft to delivery. The lifecycle is modeled as an explicit state machine — status transitions are enforced by the domain layer and cannot be skipped.

## Lifecycle Flow

```
Define → Dev Review → PM Review → Ready → Executing → Done
```

Tickets can also be **Archived** from any status.

## Status Descriptions

| Status | Value | Description |
|--------|-------|-------------|
| `Define` | `draft` | Initial state. PM creates and defines the ticket. |
| `Dev Review` | `defined` | Developer reviews and refines the spec with code context. Optional — skip if no developer needed. |
| `PM Review` | `refined` | PM reviews the developer's changes before approving. Only when a developer submits changes. |
| `Ready` | `approved` | PM has marked the ticket as ready. Available for a developer to begin implementation. |
| `Executing` | `executing` | Developer or AI agent is implementing. Branch is created and linked. |
| `Done` | `delivered` | Implementation is complete. PR created or work shipped. |
| `Archived` | `archived` | Ticket is no longer active. Can be set from any status. |

## Transition Rules

| From | To | Trigger |
|------|----|---------|
| `draft` | `defined` | Developer starts spec generation (`forge review`) |
| `defined` | `refined` | Review session submitted (`forge review` completes) |
| `refined` | `approved` | PM approves ticket (web UI or `update_ticket_status`) |
| `draft` | `approved` | PM approves directly (skipping Dev Review) |
| `approved` | `executing` | Developer starts implementation (`forge develop`) |
| `executing` | `delivered` | Developer marks ticket delivered |
| Any | `archived` | PM or developer archives the ticket |

## CLI Commands by Status

- `forge review <ticketId>` — requires `defined` status
- `forge develop <ticketId>` — requires `approved` status

## MCP Tool: `update_ticket_status`

Valid status values: `draft`, `defined`, `refined`, `approved`, `executing`, `delivered`, `archived`

See [MCP Integration](../cli-and-mcp/mcp-integration.md) for full tool schema.
