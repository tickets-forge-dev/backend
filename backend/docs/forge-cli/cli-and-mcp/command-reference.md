---
title: "CLI Command Reference"
excerpt: "Complete reference for every Forge CLI command — usage, flags, and examples."
category: "CLI & MCP"
---

## Installation

```bash
npm install -g forge-aec
```

Verify it's working:

```bash
forge --version
```

---

## Two Ways to Use Forge

### CLI (Direct Commands)

Run commands directly in your terminal:

```bash
forge login
forge list
forge show T-001
forge review T-001
forge develop T-001
```

### MCP Integration (Recommended)

Connect Forge to your AI assistant (Claude Code, Cursor, Windsurf) via MCP. Your AI gets direct access to tickets without you running CLI commands.

```bash
forge mcp install   # one-time setup (or automatic via forge login)
```

Then use slash commands in your AI assistant:

```
/forge:review aec_2437e940...
/forge:develop aec_2437e940...
```

> :blue_book: MCP is the recommended workflow. Your AI reads the full AEC, asks the right questions, and submits answers — all within the conversation. See [MCP Integration](/docs/cli-and-mcp/mcp-integration) for details.

---

## Commands

| Command | Description |
|---------|-------------|
| `forge login` | Authenticate via browser |
| `forge logout` | Clear stored credentials |
| `forge whoami` | Show current user and token status |
| `forge list` | Browse your team's tickets |
| `forge show <id>` | View full ticket details |
| `forge review <id>` | Review a spec — add your codebase knowledge |
| `forge develop <id>` | Start AI-assisted implementation |
| `forge mcp install` | Register MCP server with your AI assistant |
| `forge doctor` | Run diagnostic checks |

---

## `forge login`

Authenticate with Forge using a browser-based device code flow.

```bash
forge login
```

1. Opens your browser to sign in
2. Saves credentials securely
3. Auto-registers the MCP server with Claude Code

---

## `forge logout`

Clear all stored credentials.

```bash
forge logout
```

---

## `forge whoami`

Check who you're authenticated as:

```bash
forge whoami
```

```
Email:  jane@example.com
Team:   Acme Corp
Token:  Valid (expires in 29d)
```

---

## `forge list`

Browse your team's tickets with status and priority:

```bash
forge list
```

---

## `forge show <id>`

View a ticket's full details — title, status, acceptance criteria, file changes, API contracts, scope, and assignment.

```bash
forge show T-001
```

Works at any ticket status.

---

## `forge review <id>`

Review a ticket and add your codebase knowledge. The AI asks targeted technical questions — you answer with specifics about your project.

```bash
forge review T-001
```

**Requires:** Ticket in **Dev-Refining** status.

**What happens:**
1. The AI reads the spec and asks questions:
   - "Does the project use a specific ORM for database access?"
   - "Should this endpoint follow the existing middleware chain?"
   - "Are there rate limiting requirements?"
2. You answer with your real codebase context
3. Your Q&A is submitted to the PM for review
4. The PM re-bakes the spec with your input and approves

---

## `forge develop <id>`

Start AI-assisted implementation. The AI loads the full contract, asks implementation questions, creates a branch, and builds.

```bash
forge develop T-001
```

**Requires:** Ticket in **Forged** status.

**What happens:**
1. The AI asks 5-8 implementation questions:
   - Approach & architecture
   - Existing patterns to reuse
   - Scope boundaries
   - Edge cases & error handling
   - Testing priority
2. Creates branch: `forge/<aec-id>-<slug>`
3. Transitions ticket to **Executing**
4. Implements following the AEC — creates files, follows API contracts, satisfies acceptance criteria

Type `*start` to skip Q&A and go straight to implementation.

The ticket is auto-assigned to you.

---

## `forge mcp install`

Register the Forge MCP server with your AI assistant.

```bash
forge mcp install
```

Creates or updates `.mcp.json` in your project root. Restart your AI assistant afterward. See [MCP Integration](/docs/cli-and-mcp/mcp-integration) for details.

> :blue_book: `forge login` does this automatically — you only need `forge mcp install` if auto-registration didn't work.

---

## `forge doctor`

Run diagnostic checks to verify your setup — config file, auth, API connectivity, token, Claude CLI, and MCP registration.

```bash
forge doctor
```

See [Installation & Auth](/docs/cli-and-mcp/installation-and-auth#diagnostics) for details on each check.

---

All commands exit with `0` on success and `1` on error. Error messages are printed to stderr.

For advanced configuration (self-hosted deployments, environment overrides), see [Configuration](/docs/troubleshooting/configuration).
