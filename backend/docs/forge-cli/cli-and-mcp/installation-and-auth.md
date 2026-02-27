---
title: "CLI Installation & Auth"
excerpt: "Install the Forge CLI, authenticate via browser, and verify your setup."
category: "CLI & MCP"
---


The Forge CLI is how developers interact with tickets from the terminal. This page covers installation, authentication, and credential management.

## Installation

Install globally via your preferred package manager:

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

> :construction: Requires Node.js 20 or later. Run `node --version` to check.

## Authentication

### `forge login`

Authenticate using a browser-based device code flow:

```bash
forge login
```

**Terminal transcript:**

```
$ forge login

  Forge CLI — Authentication

  Opening browser for authentication...

  If the browser doesn't open automatically, visit:
    https://app.forge.dev/auth/device

  Enter this code when prompted:
    ABCD-1234

  Waiting for authorization...

  Success! Authenticated as jane@example.com
  Credentials saved to ~/.forge/config.json
```

**How it works:**

1. The CLI generates a device code and opens your browser
2. You log in to Forge (Google or GitHub OAuth) in the browser
3. Enter the device code shown in the terminal
4. The CLI receives an access token and refresh token
5. Credentials are saved to `~/.forge/config.json`

> :blue_book: If the browser doesn't open automatically, copy the URL from the terminal and paste it into your browser.

### Where Credentials Live

| OS | Path | Permissions |
|----|------|-------------|
| macOS / Linux | `~/.forge/config.json` | `0600` (owner read/write only) |
| Windows | `%USERPROFILE%\.forge\config.json` | Standard user permissions |

The config file contains:

```json
{
  "apiUrl": "https://api.forge.dev",
  "appUrl": "https://app.forge.dev",
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "email": "jane@example.com",
  "teamId": "team_abc123"
}
```

> :construction: Never share or commit your config file. It contains authentication tokens.

## Verify Identity

### `forge whoami`

Check who you're authenticated as:

```bash
forge whoami
```

```
$ forge whoami
Email:  jane@example.com
Team:   Acme Corp
Token:  Valid (expires in 29d)
```

If your token is expired, the CLI automatically refreshes it on the next API call. If the refresh token is also expired, you'll need to run `forge login` again.

## Logout

### `forge logout`

Clear stored credentials:

```bash
forge logout
```

```
$ forge logout
Credentials cleared from ~/.forge/config.json
Logged out successfully.
```

This deletes the access token, refresh token, and user information from the config file. The config file itself is preserved with default settings.

## Diagnostics

### `forge doctor`

Run 6 diagnostic checks to verify your setup:

```bash
forge doctor
```

```
$ forge doctor

  Forge Doctor — Checking your setup

  1. Config file        ~/.forge/config.json       OK
  2. Authenticated      jane@example.com           OK
  3. API reachable      https://api.forge.dev      OK
  4. Token valid        Expires in 29d             OK
  5. Claude CLI         v1.2.3 installed           OK
  6. MCP registered     .mcp.json configured       OK

  All 6 checks passed. You're ready to go.
```

**What each check does:**

| Check | What It Verifies | Fix If Failed |
|-------|-----------------|---------------|
| Config file | `~/.forge/config.json` exists and is valid JSON | Run `forge login` to create it |
| Authenticated | Config contains user email and tokens | Run `forge login` |
| API reachable | HTTPS connection to API server succeeds | Check network, firewall, or `FORGE_API_URL` |
| Token valid | Access token is not expired | Automatic refresh on next call, or `forge login` |
| Claude CLI | `claude` command is available in PATH | Install Claude Code |
| MCP registered | `.mcp.json` exists with Forge server config | Run `forge mcp install` |

> :thumbsup: Run `forge doctor` first whenever something isn't working. It catches the most common issues.
