# MCP Integration

The Forge CLI embeds an MCP (Model Context Protocol) server that exposes ticket data and actions to AI coding agents (Claude Code, Cursor, etc.).

## Starting the MCP Server

The MCP server starts automatically when you run a `forge` command that requires it:

```bash
forge review <ticketId>   # starts MCP for the refine agent
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

### `report_decision`

Records a key decision made during implementation. Posts an execution event of type `decision` to the ticket.

```json
{
  "name": "report_decision",
  "description": "Record a key decision made during implementation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": { "type": "string" },
      "summary": {
        "type": "string",
        "description": "Short description of the decision made"
      },
      "rationale": {
        "type": "string",
        "description": "Why this decision was made"
      }
    },
    "required": ["ticketId", "summary"]
  }
}
```

**Backend endpoint:** `POST /tickets/:id/execution-events` with `{ "type": "decision", ... }`

### `report_risk`

Records a risk or blocker identified during implementation. Posts an execution event of type `risk` to the ticket.

```json
{
  "name": "report_risk",
  "description": "Record a risk or blocker identified during implementation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": { "type": "string" },
      "summary": {
        "type": "string",
        "description": "Short description of the risk"
      },
      "severity": {
        "type": "string",
        "enum": ["low", "medium", "high"],
        "description": "Risk severity level"
      }
    },
    "required": ["ticketId", "summary"]
  }
}
```

**Backend endpoint:** `POST /tickets/:id/execution-events` with `{ "type": "risk", ... }`

### `report_scope_change`

Records a scope deviation from the original AEC. Posts an execution event of type `scope_change` to the ticket.

```json
{
  "name": "report_scope_change",
  "description": "Record a scope change or deviation from the original spec.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": { "type": "string" },
      "summary": {
        "type": "string",
        "description": "What changed from the original scope"
      },
      "reason": {
        "type": "string",
        "description": "Why the scope change was necessary"
      }
    },
    "required": ["ticketId", "summary"]
  }
}
```

**Backend endpoint:** `POST /tickets/:id/execution-events` with `{ "type": "scope_change", ... }`

### `submit_settlement`

Submits the final implementation summary, creates a Change Record, and transitions the ticket from `executing` to `delivered`.

```json
{
  "name": "submit_settlement",
  "description": "Submit implementation summary and transition ticket to DELIVERED. Creates a Change Record.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticketId": { "type": "string" },
      "summary": {
        "type": "string",
        "description": "High-level summary of what was implemented"
      },
      "filesChanged": {
        "type": "array",
        "items": { "type": "string" },
        "description": "List of files that were modified"
      },
      "prUrl": {
        "type": "string",
        "description": "URL of the pull request (optional)"
      }
    },
    "required": ["ticketId", "summary"]
  }
}
```

**Backend endpoint:** `POST /tickets/:id/settle` — creates a Change Record and transitions the ticket to `delivered`.

## Available MCP Prompts

### `forge-execute`

Loads the review agent persona with full ticket context. Invoked by `forge review`.

### `forge-develop`

Loads the developer agent persona with full ticket context, file changes, and repository context. Invoked by `forge develop`.

## Configuration

The MCP server binds to a local port and uses your stored auth token (set via `forge login`). All API calls are authenticated against the Forge backend.

See [Command Reference](./command-reference.md) for all available CLI commands.
