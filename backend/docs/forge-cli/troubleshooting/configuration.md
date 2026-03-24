---
title: "Configuration"
excerpt: "Config files, MCP setup, and debug logging for the Forge CLI."
category: "Troubleshooting"
---


The Forge CLI stores credentials in a local config file and uses a project-level MCP config for AI assistant integration.

## Credentials

### Location

| OS | Path |
|----|------|
| macOS / Linux | `~/.forge/config.json` |
| Windows | `%USERPROFILE%\.forge\config.json` |

The config file is created automatically when you run `forge login`. File permissions are set to owner-only (read/write) on macOS and Linux.

> :construction: Never commit this file to version control. It contains authentication tokens.

### Token Refresh

Tokens refresh automatically in the background. If your session expires completely, the CLI will prompt you to run `forge login` again.

## MCP Configuration

### File: `.mcp.json`

The MCP config lives in your project root (same level as `.git`). It tells AI assistants how to connect to the Forge MCP server.

### Setup

```bash
forge mcp install
```

This creates `.mcp.json` if it doesn't exist, or adds the Forge entry if the file already has other MCP servers configured.

> :blue_book: `forge login` does this automatically. You only need `forge mcp install` if auto-registration didn't work.

### Team Sharing

Commit `.mcp.json` to your repository so the whole team gets the same MCP configuration:

```bash
git add .mcp.json
git commit -m "Add Forge MCP configuration"
```

Each developer still needs to:
1. Have the Forge CLI installed (`npm install -g @anthropic-forge/cli`)
2. Be authenticated (`forge login`)

The `.mcp.json` file contains no secrets — just the command to start the MCP server.

## Debug Logging

For verbose output when troubleshooting:

```bash
NODE_ENV=development forge show T-001
```

In development mode, errors include full stack traces and request details.

### MCP Server Logs

MCP server logs go to stderr. To capture them:

```bash
forge mcp serve 2>forge-mcp.log
```

> :blue_book: When reporting issues, include the output of `forge doctor` and any error messages.
