---
title: "Quickstart for Developers"
excerpt: "Install the Forge CLI, connect to your AI assistant, and start executing verified tickets."
category: "Getting Started"
---


This guide gets you from zero to executing tickets. You'll install the CLI, authenticate, set up MCP integration, and work through your first ticket.

> :construction: You need Node.js 20+ and a Forge account. Run `node --version` to check.

## Step 1: Install the CLI

```bash
npm install -g @anthropic/forge-cli
```
```bash
pnpm add -g @anthropic/forge-cli
```
```bash
yarn global add @anthropic/forge-cli
```

Verify the installation:

```bash
forge --version
```

## Step 2: Authenticate

```bash
forge login
```

This starts a browser-based device code flow:

```
$ forge login

  Opening browser for authentication...

  If the browser doesn't open, visit:
    https://app.forgeaec.com/auth/device

  Enter this code when prompted: ABCD-1234

  Waiting for authorization... Done!
  Authenticated as jane@example.com
  Credentials saved to ~/.forge/config.json
```

Log in with Google or GitHub in the browser, enter the code, and you're authenticated.

## Step 3: Verify Your Setup

Run diagnostics before going further:

```bash
forge doctor
```

```
$ forge doctor

  Config file        ~/.forge/config.json    OK
  Authenticated      jane@example.com        OK
  API reachable      https://api.forgeaec.com   OK
  Token valid        Expires in 29d          OK
  Claude CLI         v1.2.3 installed        OK
  MCP registered     (not configured)        WARN

  5/6 checks passed. Run 'forge mcp install' to fix MCP.
```

If anything fails, `forge doctor` tells you exactly what to fix. See [Common Issues](/docs/troubleshooting/common-issues) for details.

## Step 4: Set Up MCP

MCP (Model Context Protocol) gives your AI assistant direct access to Forge tickets. Register it:

```bash
forge mcp install
```

```
$ forge mcp install
  Detected: Claude Code
  Registered MCP server in .mcp.json
  Restart your AI assistant to load the new tools.
```

This creates a `.mcp.json` in your project root. Commit it so your team gets the same setup. After installing, restart Claude Code (or Cursor/Windsurf).

Your AI assistant now has 6 Forge tools: `get_ticket_context`, `get_file_changes`, `get_repository_context`, `update_ticket_status`, `submit_review_session`, and `start_implementation`.

## Step 5: Review a Ticket

When a PM assigns you a ticket, review it with the CLI. The ticket ID is in the URL or the dashboard (format: `aec_<uuid>`).

```bash
forge review aec_8f3a2b1c-...
```

This starts an interactive session where your AI assistant asks targeted technical questions about the implementation. You bring the context that the PM can't: which patterns to follow, existing code to reuse, edge cases to handle.

```
Starting review session...

AI: The ticket mentions adding a new API endpoint. I see the project uses
    NestJS with a controller → use-case → repository pattern. Should this
    endpoint follow the same pattern?

You: Yes, follow the pattern in src/tickets/. Use a new use case class,
     inject the repository via the port interface, and add a DTO for
     validation.

AI: What about error handling? I see InvalidStateTransitionError and
    QuotaExceededError in the codebase. Should this endpoint use those?

You: Use InvalidStateTransitionError for status conflicts. Add a new
     NotFoundError if the resource doesn't exist. Return 404, not 500.

Review session complete. 2 Q&A pairs submitted.
PM will be notified to review.
```

Your answers are submitted to the PM. They can re-bake the spec with your context and approve the AEC.

## Step 5.5: Start Implementation

Once the PM approves and the ticket is **Forged**, prepare for implementation:

```bash
forge develop aec_8f3a2b1c-...
```

This starts an interactive session where Forgy (the developer agent) guides you through implementation prep:

1. Loads the full AEC — acceptance criteria, file changes, technical context
2. Asks 5-8 targeted questions about your approach: architecture decisions, patterns to reuse, scope boundaries, edge cases, testing priority
3. On confirmation, auto-creates the branch (`forge/<aec-id>-slug`) and transitions the ticket to **Executing**

You can skip Q&A by typing `*start` to go straight to branch creation.

## Step 6: Execute a Ticket

With your branch created and the ticket in **Executing** status, implement it:

```bash
forge execute aec_8f3a2b1c-...
```

The AI reads the full AEC — acceptance criteria, file changes, API contracts, scope — and implements the ticket. It creates files, modifies existing code, and follows the spec. You stay in the loop to review and approve each change.

The ticket auto-assigns to you and transitions to **Executing** status.

## Quick Reference

| Command | What It Does |
|---------|-------------|
| `forge login` | Authenticate via browser |
| `forge whoami` | Check who you're logged in as |
| `forge doctor` | Run 6 diagnostic checks |
| `forge mcp install` | Register MCP tools for your AI assistant |
| `forge show <id>` | View a ticket's full AEC |
| `forge review <id>` | Start an interactive review session |
| `forge develop <id>` | Start guided implementation prep with AI agent |
| `forge execute <id>` | Implement a ticket with AI assistance |
| `forge logout` | Clear credentials |

## What's Next?

- [CLI Command Reference](/docs/cli-and-mcp/command-reference) — Deep dive on every command
- [MCP Integration](/docs/cli-and-mcp/mcp-integration) — How the 6 MCP tools and 3 prompts work
- [Ticket Lifecycle](/docs/platform/ticket-lifecycle) — Understand which commands work at which status
