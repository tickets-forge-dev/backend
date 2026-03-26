# MCP Integration

The Forge CLI embeds an MCP (Model Context Protocol) server that exposes ticket data and actions to AI coding agents (Claude Code, Cursor, etc.).

## Starting the MCP Server

The MCP server starts automatically when you run a `forge` command that requires it:

```bash
forge review <ticketId>   # starts MCP for the review agent
forge develop <ticketId>  # starts MCP for the developer agent
```

## Available MCP Tools

### `get_ticket_context`

Returns full ticket context including spec, acceptance criteria, and file change plan.

```json
{
  "name": "get_ticket_context",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": { "type": "string" }
    },
    "required": ["ticketId"]
  }
}
```

### `get_file_changes`

Returns the list of files the ticket expects to change, with rationale.

```json
{
  "name": "get_file_changes",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": { "type": "string" }
    },
    "required": ["ticketId"]
  }
}
```

### `get_repository_context`

Returns the project profile (tech stack, file structure, key configs).

```json
{
  "name": "get_repository_context",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": { "type": "string" }
    },
    "required": ["ticketId"]
  }
}
```

### `update_ticket_status`

Updates a ticket's lifecycle status.

```json
{
  "name": "update_ticket_status",
  "description": "Update the status of a Forge ticket. Use this to advance or revert a ticket through its lifecycle.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": {
        "type": "string",
        "description": "The ticket ID to update"
      },
      "status": {
        "type": "string",
        "description": "New status value",
        "enum": ["draft", "defined", "refined", "approved", "executing", "delivered", "archived"]
      }
    },
    "required": ["ticketId", "status"]
  }
}
```

**Valid status values:**
- `draft` — initial state
- `defined` — spec generation started
- `refined` — review session complete, awaiting approval
- `approved` — PM approved, ready for implementation
- `executing` — implementation in progress
- `delivered` — implementation complete
- `archived` — ticket archived

### `submit_review_session`

Submits a completed review session for a ticket. Transitions ticket from `defined` to `refined`.

```json
{
  "name": "submit_review_session",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": { "type": "string" },
      "qaItems": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "question": { "type": "string" },
            "answer": { "type": "string" }
          },
          "required": ["question", "answer"]
        }
      }
    },
    "required": ["ticketId", "qaItems"]
  }
}
```

### `start_implementation`

Records that implementation has started on a ticket. Transitions ticket from `approved` to `executing`. Called by the developer agent after branch creation.

```json
{
  "name": "start_implementation",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": { "type": "string" },
      "branchName": {
        "type": "string",
        "description": "Branch name in format forge/<aec-id>-<slug>"
      },
      "qaItems": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "question": { "type": "string" },
            "answer": { "type": "string" }
          }
        }
      }
    },
    "required": ["ticketId", "branchName"]
  }
}
```

## Available MCP Prompts

### `forge-execute`

Loads the review agent persona with full ticket context. Invoked by `forge review`.

### `forge-develop`

Loads the developer agent persona with full ticket context, file changes, and repository context. Invoked by `forge develop`.

## Configuration

The MCP server binds to a local port and uses your stored auth token (set via `forge login`). All API calls are authenticated against the Forge backend.

See [Command Reference](./command-reference.md) for all available CLI commands.
