---
title: "CLI Installation & Auth"
excerpt: "Install the Forge CLI, authenticate via browser, and verify your setup."
category: "CLI & MCP"
---


The Forge CLI is how developers interact with tickets from the terminal. This page covers installation, authentication, and credential management.

## Installation

Install globally via npm:

```bash
npm install -g forge-aec
```

Verify the installation:

```bash
forge --version
```

> :construction: Requires Node.js 20 or later. Run `node --version` to check.

## Updating

Update to the latest version:

```bash
npm update -g forge-aec
```

Verify the update:

```bash
forge --version
```

> :blue_book: We recommend updating regularly — new features and bug fixes ship frequently.

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

  Enter this code when prompted:
    ABCD-1234

  Waiting for authorization...

  Success! Authenticated as jane@example.com
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

Credentials are stored securely with restricted file permissions. Tokens refresh automatically in the background.

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
Logged out successfully.
```

This clears all stored credentials.

## Diagnostics

### `forge doctor`

Run 6 diagnostic checks to verify your setup:

```bash
forge doctor
```

```
$ forge doctor

  Forge Doctor — Checking your setup

  1. Config file        OK
  2. Authenticated      jane@example.com           OK
  3. API reachable      OK
  4. Token valid        Expires in 29d             OK
  5. Claude CLI         Installed                  OK
  6. MCP registered     Configured                 OK

  All 6 checks passed. You're ready to go.
```

**What each check does:**

| Check | What It Verifies | Fix If Failed |
|-------|-----------------|---------------|
| Config file | Credentials file exists and is valid | Run `forge login` |
| Authenticated | You're signed in | Run `forge login` |
| API reachable | Connection to Forge servers succeeds | Check your network |
| Token valid | Auth token is not expired | Automatic refresh, or `forge login` |
| Claude CLI | Claude Code is installed | Install Claude Code |
| MCP registered | MCP server is configured for your AI assistant | Run `forge mcp install` |

> :thumbsup: Run `forge doctor` first whenever something isn't working. It catches the most common issues.
