---
title: "MCP Integration"
excerpt: "How Forge connects to AI assistants via the Model Context Protocol — tools, prompts, and setup."
category: "CLI & MCP"
---


Forge uses the **Model Context Protocol (MCP)** to give AI assistants structured access to ticket data. This means Claude Code, Cursor, or Windsurf can read your tickets, check file changes, and update statuses — all without you copying and pasting.

## What is MCP?

MCP is an open protocol that lets AI assistants call external tools. Instead of the AI guessing what a ticket says, it can call `get_ticket_context` and get the full AEC directly.

Key properties:
- **Transport:** stdio (standard input/output) — no ports, no HTTP
- **Process model:** The MCP server runs inside the CLI process
- **Security:** Uses your existing Forge credentials from `~/.forge/config.json`
- **Scope:** Project-level — configured per repository via `.mcp.json`

## Setup

### Automatic (Recommended)

```bash
forge mcp install
```

This detects your AI assistant and creates the appropriate configuration.

### Manual Configuration

If you prefer to configure manually, add the Forge server to your `.mcp.json` file in the project root:

```json
{
  "mcpServers": {
    "forge": {
      "command": "forge",
      "args": ["mcp", "serve"],
      "transport": "stdio"
    }
  }
}
```

After adding the config, restart your AI assistant.

> :blue_book: Commit `.mcp.json` to your repository so the whole team gets the same MCP tools.

## Compatible AI Assistants

| Assistant | Setup Method | Status |
|-----------|-------------|--------|
| **Claude Code** | `forge mcp install` (auto-detected) | Supported |
| **Cursor** | `forge mcp install` or manual `.mcp.json` | Supported |
| **Windsurf** | `forge mcp install` or manual `.mcp.json` | Supported |

## MCP Tools

The Forge MCP server exposes 6 tools that AI assistants can call:

### `get_ticket_context`

Fetch the full details of a ticket, including its AEC content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticketId` | string | Yes | The ticket ID (e.g., `T-001`) |

**Returns:** Complete ticket data including title, description, status, acceptance criteria, tech spec, file changes, API contracts, scope, assumptions, and readiness score.

**Use case:** The AI reads this before starting a review or execution session to understand what needs to be built.

---

### `get_file_changes`

Fetch the planned file changes for a ticket.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticketId` | string | Yes | The ticket ID |

**Returns:** Array of file change objects, each containing:
- `path` — File path relative to project root
- `action` — `create`, `modify`, or `delete`
- `notes` — Description of what changes and why

**Use case:** The AI uses this during execution to know exactly which files to create and modify.

---

### `get_repository_context`

Get information about the current Git repository.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | No | Directory path (defaults to current working directory) |

**Returns:** Repository metadata including:
- Current branch name
- Git status (modified, staged, untracked files)
- File tree (directory structure)
- Remote URL

**Use case:** The AI uses this to understand the project structure and current state before making changes.

---

### `update_ticket_status`

Transition a ticket to a new status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticketId` | string | Yes | The ticket ID |
| `status` | string | Yes | Target status (must be a valid transition) |

**Returns:** Updated ticket data.

**Use case:** The AI transitions tickets during execution — for example, moving from Forged to Executing when starting work.

> :construction: Status transitions are enforced by the domain model. Invalid transitions (e.g., Draft to Forged) will be rejected.

---

### `submit_review_session`

Submit a set of Q&A pairs from a review session.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticketId` | string | Yes | The ticket ID |
| `qaItems` | array | Yes | Array of `{ question: string, answer: string }` objects |

**Returns:** Updated ticket data with the review session attached.

**Use case:** After the AI completes a review session (asking and answering technical questions), it submits the Q&A pairs to the API. The ticket transitions to Review status.

---

### `start_implementation`

Record a developer's implementation branch and transition the ticket to Executing.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticketId` | string | Yes | The ticket ID |
| `branchName` | string | Yes | Branch name (must start with `forge/`) |
| `qaItems` | array | No | Array of `{ question, answer }` from the implementation Q&A |

**Returns:** Updated ticket data with implementation session stored.

**Use case:** Called by the developer agent (Forgy) after branch creation to persist the branch name and Q&A answers on the ticket.

---

## MCP Prompts

The Forge MCP server also provides 3 prompts — pre-built personas that configure the AI for specific workflows.

### `forge-execute`

Configures the AI as a **dev-executor** — an experienced developer who implements tickets precisely according to the AEC.

**What it does:**
1. Loads the dev-executor persona (focus on accuracy, following the spec, and clean code)
2. Fetches the full ticket context via `get_ticket_context`
3. Fetches file changes via `get_file_changes`
4. Fetches repository context via `get_repository_context`
5. Presents the AI with a complete implementation brief

**When to use:** When you want the AI to implement a Forged ticket end-to-end.

---

### `forge-review`

Configures the AI as a **dev-reviewer** — a thorough technical reviewer who asks clarifying questions about the implementation.

**What it does:**
1. Loads the dev-reviewer persona (focus on asking the right questions, identifying gaps)
2. Fetches the full ticket context
3. Guides the AI to ask targeted questions about:
   - Architectural decisions
   - Existing patterns to follow
   - Edge cases and error handling
   - Performance and security concerns
4. Collects Q&A pairs for submission

**When to use:** When you want the AI to help you review a ticket before execution — especially useful for understanding complex specs.

---

### `forge-develop`

Configures the AI as a **dev-implementer** — Forgy in build mode, who guides the developer through implementation preparation.

**What it does:**
1. Loads the dev-implementer persona (focus on asking implementation questions, never writing code)
2. Fetches the full ticket context via `get_ticket_context`
3. Fetches file changes via `get_file_changes`
4. Fetches repository context via `get_repository_context`
5. Guides the AI through a 3-phase flow: Load → Q&A → Branch Creation

**When to use:** When you want the AI to guide you through implementation prep before writing code.

---

## Architecture

```
┌──────────────────────┐     stdio     ┌──────────────┐
│  AI Assistant        │◄─────────────►│  Forge CLI   │
│  (Claude Code, etc.) │               │  MCP Server  │
└──────────────────────┘               └──────┬───────┘
                                              │
                                              │ HTTPS
                                              ▼
                                       ┌──────────────┐
                                       │  Forge API   │
                                       └──────────────┘
```

- The MCP server runs as a child process of your AI assistant
- Communication is via stdin/stdout (no network ports needed)
- The server authenticates with the Forge API using your stored credentials
- All tool calls go through the same API the web app and CLI use

## Troubleshooting MCP

| Problem | Solution |
|---------|----------|
| Tools not showing up | Run `forge mcp install`, then restart your AI assistant |
| "Not authenticated" errors | Run `forge login` first |
| Server crashes on startup | Verify Node.js 20+ with `node --version` |
| Tools work but return errors | Run `forge doctor` to check API connectivity |
| `.mcp.json` not detected | Ensure it's in the project root (same level as `.git`) |
