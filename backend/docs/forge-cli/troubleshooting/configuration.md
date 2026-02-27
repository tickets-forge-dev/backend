---
title: "Configuration"
excerpt: "Config files, environment variables, and advanced settings for the Forge CLI."
category: "Troubleshooting"
---


The Forge CLI is configured through a combination of a config file, environment variables, and a project-level MCP config. This page covers all of them.

## Config File

### Location

| OS | Path |
|----|------|
| macOS / Linux | `~/.forge/config.json` |
| Windows | `%USERPROFILE%\.forge\config.json` |

### File Permissions

| OS | Permissions | Notes |
|----|-------------|-------|
| macOS / Linux | `0600` (owner read/write only) | Set automatically on `forge login` |
| Windows | Standard user permissions | Unix-style permissions not supported; a harmless warning may appear |

### Schema

```json
{
  "apiUrl": "https://api.forge.dev",
  "appUrl": "https://app.forge.dev",
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
  "email": "jane@example.com",
  "teamId": "team_abc123"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `apiUrl` | string | Base URL for the Forge API |
| `appUrl` | string | Base URL for the Forge web app (used in auth flow) |
| `accessToken` | string | JWT access token (auto-refreshed on 401) |
| `refreshToken` | string | JWT refresh token (long-lived) |
| `email` | string | Authenticated user's email |
| `teamId` | string | Current team identifier |

> :construction: Never commit `config.json` to version control. It contains authentication tokens.

### Token Refresh

The CLI automatically refreshes expired access tokens:

1. A CLI command makes an API call
2. The API returns `401 Unauthorized`
3. The CLI sends the refresh token to get a new access token
4. The new access token is saved to `config.json`
5. The original request is retried

If the refresh token is also expired, the CLI prompts you to run `forge login`.

## Environment Variables

Environment variables override config file values. They take precedence.

| Variable | Default | Description |
|----------|---------|-------------|
| `FORGE_API_URL` | `https://api.forge.dev` | Backend API base URL |
| `FORGE_APP_URL` | `https://app.forge.dev` | Web app base URL |
| `NODE_ENV` | `production` | Node.js environment (affects logging and error detail) |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `1` | Set to `0` to skip TLS verification (development only) |

### Usage Examples

**Point to a local development server:**
```bash
FORGE_API_URL=http://localhost:3000 FORGE_APP_URL=http://localhost:4000 forge login
```

**Point to a staging environment:**
```bash
export FORGE_API_URL=https://staging-api.forge.dev
export FORGE_APP_URL=https://staging.forge.dev
forge login
```

> :construction: Setting `NODE_TLS_REJECT_UNAUTHORIZED=0` disables TLS certificate verification. Only use this for local development with self-signed certificates.

## MCP Configuration

### File: `.mcp.json`

The MCP config lives in your project root (same level as `.git`). It tells AI assistants how to connect to the Forge MCP server.

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

| Field | Description |
|-------|-------------|
| `command` | The executable to run (`forge`) |
| `args` | Arguments passed to the command (`mcp serve` starts the MCP server) |
| `transport` | Communication protocol (`stdio` — standard input/output) |

### Auto-Generation

```bash
forge mcp install
```

This creates `.mcp.json` if it doesn't exist, or adds the Forge entry if the file already has other MCP servers configured.

### Team Sharing

Commit `.mcp.json` to your repository so the whole team gets the same MCP configuration:

```bash
git add .mcp.json
git commit -m "Add Forge MCP configuration"
```

Each developer still needs to:
1. Have the Forge CLI installed (`npm install -g @anthropic/forge-cli`)
2. Be authenticated (`forge login`)

The `.mcp.json` file contains no secrets — just the command to start the MCP server.

## Debug Logging

For verbose output when troubleshooting:

### CLI Debug Output

Set the `NODE_ENV` to `development` for more detailed error messages:

```bash
NODE_ENV=development forge show T-001
```

In development mode, errors include:
- Full stack traces
- Request/response details
- Token refresh attempts

### MCP Server Logs

MCP server logs go to stderr (since stdout is used for stdio transport). To capture them:

```bash
forge mcp serve 2>forge-mcp.log
```

> :blue_book: When reporting issues, include the output of `forge doctor` and any error messages from stderr.

## Configuration Precedence

When the same setting is available in multiple places, the order of precedence is:

1. **Environment variables** (highest priority)
2. **Config file** (`~/.forge/config.json`)
3. **Defaults** (lowest priority)

For example, if `FORGE_API_URL` is set as an environment variable and `apiUrl` is set in the config file, the environment variable wins.
