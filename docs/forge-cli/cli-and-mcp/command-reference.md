# CLI Command Reference

## Installation

```bash
npm install -g @forge/cli
forge login
```

## Commands

### `forge login`

Authenticate with the Forge backend.

```bash
forge login
```

### `forge list`

List tickets for your team.

```bash
forge list [--status <status>] [--limit <n>]
```

Options:
- `--status` — filter by status (e.g., `approved`, `defined`)
- `--limit` — number of tickets to show (default: 20)

### `forge show <ticketId>`

Display full details for a ticket.

```bash
forge show <ticketId>
```

### `forge review <ticketId>`

Start the AI-assisted review session for a ticket. Launches the MCP server and loads the forge-execute review agent.

```bash
forge review <ticketId>
```

**Requirements:**
- Ticket must be in `defined` status

The review agent guides you through structured Q&A to validate and enrich the tech spec. On completion, submits the review session and transitions the ticket to `refined`.

### `forge develop <ticketId>`

Start the AI-assisted developer briefing for a ticket. Launches the MCP server and loads the forge-develop developer agent.

```bash
forge develop <ticketId>
```

**Requirements:**
- Ticket must be in `approved` status

The developer agent loads full ticket context, asks implementation questions, creates the correct branch (`forge/<aec-id>-<slug>`), and transitions the ticket to `executing`.

### `forge execute <ticketId>`

Alias for `forge develop`. Kept for backward compatibility.

```bash
forge execute <ticketId>
```

### `forge profile`

Upload a local codebase profile (Tier 2) to Forge for use in code generation.

```bash
forge profile [--repo <path>]
```

### `forge logout`

Clear stored authentication credentials.

```bash
forge logout
```

## Status Values

| Status | Value | CLI Visible |
|--------|-------|-------------|
| Draft | `draft` | Yes |
| Defined | `defined` | Yes |
| Refined | `refined` | Yes |
| Approved | `approved` | Yes |
| Executing | `executing` | Yes |
| Delivered | `delivered` | Yes |
| Archived | `archived` | Yes |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `FORGE_API_URL` | Override the default API endpoint |
| `FORGE_TOKEN` | Use a specific auth token (bypasses stored credentials) |

## MCP Server

The CLI embeds an MCP server that starts automatically with `forge review` and `forge develop`. See [MCP Integration](./mcp-integration.md) for tool schemas and configuration.
