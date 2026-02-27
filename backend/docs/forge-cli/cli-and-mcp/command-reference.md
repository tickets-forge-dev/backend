---
title: "CLI Command Reference"
excerpt: "Complete reference for every Forge CLI command — usage, flags, and examples."
category: "CLI & MCP"
---

# CLI Command Reference

## Two Ways to Use Forge

Forge gives developers two ways to interact with tickets:

### CLI (Direct Commands)

Run commands directly in your terminal. Good for quick lookups and scripting.

```bash
forge login
forge list
forge show T-001
forge review T-001
```

### MCP Integration (Recommended)

Connect Forge to your AI assistant (Claude Code, Cursor, Windsurf) via MCP. Your AI gets direct access to tickets — it can list, review, and execute without you running CLI commands manually.

```bash
forge mcp install   # one-time setup
```

Then use slash commands or natural language in your AI assistant:

```
/forge:review aec_2437e940...
/forge:exec aec_2437e940...
```

![Claude Code with Forge MCP — listing tickets and starting a review session](/images/cli-screenshot.png)

> 📘 MCP is the recommended workflow. Your AI assistant reads the full AEC context, asks the right questions, and submits answers — all within the conversation. See [MCP Integration](/docs/cli-and-mcp/mcp-integration) for setup details.

---

## Command Overview

| Command | Description |
|---------|-------------|
| `forge login` | Authenticate via browser device code flow |
| `forge logout` | Clear stored credentials |
| `forge whoami` | Show current user and token status |
| `forge show <id>` | View full ticket details |
| `forge review <id>` | Start an AI-assisted review session |
| `forge develop <id>` | Start guided implementation prep |
| `forge execute <id>` | Start an AI-assisted execution session |
| `forge mcp install` | Register MCP server for Claude Code |
| `forge doctor` | Run 6 diagnostic checks |

---

## `forge login`

Authenticate with the Forge API using a browser-based device code flow.

```bash
forge login
```

**Behavior:**
1. Generates a one-time device code
2. Opens your browser to the auth page
3. Waits for you to complete login and enter the code
4. Saves credentials to `~/.forge/config.json`

**Exit codes:**
| Code | Meaning |
|------|---------|
| `0` | Login successful |
| `1` | Login failed or timed out |

---

## `forge logout`

Clear all stored credentials.

```bash
forge logout
```

Removes access token, refresh token, and user info from the config file. Does not delete the config file itself.

---

## `forge whoami`

Display the currently authenticated user and token status.

```bash
forge whoami
```

**Output:**
```
Email:  jane@example.com
Team:   Acme Corp
Token:  Valid (expires in 29d)
```

**Exit codes:**
| Code | Meaning |
|------|---------|
| `0` | Authenticated and token is valid |
| `1` | Not authenticated |

---

## `forge show <id>`

View the full details of a ticket, including its AEC content.

```bash
forge show T-001
```

**Output includes:**
- Title, status, type, priority
- Readiness score
- Acceptance criteria
- File changes
- API contracts
- Scope and assumptions
- Assignment info

Works at any ticket status.

---

## `forge review <id>`

Start an interactive, AI-assisted review session for a ticket. The AI reads the ticket's AEC and asks the developer targeted technical questions.

```bash
forge review T-001
```

### Valid Statuses

The ticket must be in **Dev-Refining** status. If it's in another status, the command exits with an error.

### How It Works

1. The CLI fetches the ticket's full AEC
2. Claude (or your configured AI assistant) reads the spec
3. The AI asks technical questions about the implementation:
   - "Does the project use a specific ORM for database access?"
   - "Should this endpoint follow the existing middleware chain?"
   - "Are there rate limiting requirements?"
4. You answer each question with specific, contextual information
5. When the session is complete, all Q&A pairs are submitted to the API
6. The ticket transitions to **Review** status
7. The PM is notified to review your Q&A

### What the AI Does

The AI operates as a **dev-reviewer persona** — it knows the ticket spec and asks questions that a thorough code reviewer would ask before implementation. It focuses on:

- Architectural decisions not covered in the spec
- Existing patterns that should be followed
- Edge cases and error scenarios
- Performance and security considerations

### What Happens After

The PM sees your Q&A in the web app and can:
- **Re-bake** the spec with your context
- **Approve** the ticket (transitions to Forged)
- **Send back** for more context

**Exit codes:**
| Code | Meaning |
|------|---------|
| `0` | Review session submitted |
| `1` | Error (wrong status, network failure, etc.) |

---

## `forge execute <id>`

Start an AI-assisted execution session. The AI reads the AEC and implements the ticket.

```bash
forge execute T-001
```

### Valid Statuses

The ticket must be in **Forged** or **Executing** status.

### How It Works

1. The CLI fetches the full AEC (spec, file changes, API contracts, acceptance criteria)
2. Claude reads the AEC and begins implementation
3. The AI creates and modifies files according to the spec
4. You review and approve each change
5. The ticket is auto-assigned to you if not already assigned
6. The ticket transitions to **Executing** status

### What the AI Does

The AI operates as a **dev-executor persona** — it follows the AEC precisely:

- Creates files listed in the file changes
- Modifies existing files as specified
- Follows the API contracts for endpoint implementations
- Writes code that satisfies the acceptance criteria
- Follows the codebase conventions from the technical context

### Auto-Assignment

If the ticket isn't assigned to anyone when you run `forge execute`, it's automatically assigned to your account.

**Exit codes:**
| Code | Meaning |
|------|---------|
| `0` | Execution session complete |
| `1` | Error (wrong status, not assigned, etc.) |

---

## `forge develop <id>`

Start a guided implementation preparation session. An AI agent (Forgy) loads the ticket, asks targeted questions about your approach, and auto-creates the implementation branch.

```bash
forge develop aec_8f3a2b1c-...
```

### Valid Statuses

The ticket must be in **Forged** status.

### How It Works

1. The CLI fetches the full AEC
2. Forgy (the developer agent) loads the spec summary — file count, AC count, title
3. Forgy asks 5-8 implementation questions (one at a time):
   - Approach & architecture — viable paths, module placement
   - Existing patterns — reuse vs create new
   - Scope boundaries — what to include vs defer
   - Edge cases & error handling — failure modes not in spec
   - Testing priority — which tests matter most
4. On confirmation, auto-creates branch: `forge/<aec-id>-<slug>`
5. Calls the backend to transition the ticket to **Executing**
6. You're ready to implement — run `forge execute` next

### Skipping Q&A

Type `*start` during the session to skip questions and go straight to branch creation.

### Auto-Assignment

The ticket is auto-assigned to you when you run `forge develop`.

### Branch Naming

Branches follow the pattern: `forge/<aec-id>-<slug>`
- `<aec-id>` = the full AEC UUID
- `<slug>` = kebab-case of first 4 words of the title, max 30 chars

Example: `forge/aec_a1b2c3d4-e5f6-7890-abcd-ef1234567890-add-user-auth`

### Exit codes
| Code | Meaning |
|------|---------|
| `0` | Branch created, ticket transitioned |
| `1` | Error (wrong status, MCP failure, etc.) |

---

## `forge mcp install`

Register the Forge MCP server with your AI assistant.

```bash
forge mcp install
```

**Behavior:**
1. Detects your AI assistant (Claude Code, Cursor, Windsurf)
2. Creates or updates `.mcp.json` in your project root
3. Registers the Forge MCP server with stdio transport

After installation, restart your AI assistant to load the new tools.

See [MCP Integration](/docs/cli-and-mcp/mcp-integration) for details on available tools and prompts.

---

## `forge doctor`

Run diagnostic checks to verify your setup. See [Installation & Auth](/docs/cli-and-mcp/installation-and-auth#diagnostics) for full details.

```bash
forge doctor
```

---

## Environment Variables

Override default configuration with environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `FORGE_API_URL` | `https://api.forge.dev` | Backend API base URL |
| `FORGE_APP_URL` | `https://app.forge.dev` | Web app base URL (used for auth flow) |

These override values in `~/.forge/config.json`. Useful for development or self-hosted deployments.

```bash
FORGE_API_URL=http://localhost:3000 forge login
```

---

## Exit Codes

All commands follow a consistent exit code scheme:

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error (see stderr for details) |

The CLI prints user-friendly error messages to stderr. For programmatic use, check the exit code.
