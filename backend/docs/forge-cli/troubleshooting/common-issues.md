---
title: "Common Issues"
excerpt: "Solutions for the most common problems you'll encounter with Forge."
category: "Troubleshooting"
---


When something isn't working, start here. Most problems are solved by one of the fixes below.

## First Step: Run `forge doctor`

Before debugging manually, run diagnostics:

```bash
forge doctor
```

This checks your config file, authentication, API connectivity, token validity, Claude CLI installation, and MCP registration. If any check fails, the output tells you exactly what to fix.

---

## Authentication Issues

### "Not logged in" or "No credentials found"

**Cause:** You haven't authenticated yet, or the config file was deleted.

**Fix:**
```bash
forge login
```

---

### Login hangs after opening browser

**Cause:** The browser opened but the CLI can't detect the completed auth flow.

**Fix:**
1. Copy the URL from the terminal output
2. Paste it into your browser manually
3. Complete the login and enter the device code
4. Return to the terminal — it should detect the authorization

If it still hangs, press `Ctrl+C` and try again.

---

### "Token expired" or 401 errors

**Cause:** Your access token has expired.

**Fix:** The CLI auto-refreshes tokens on 401 responses. If auto-refresh fails (e.g., refresh token is also expired):

```bash
forge login
```

---

### Wrong team or user

**Cause:** You're authenticated as a different user than expected.

**Fix:**
```bash
forge whoami
```

If the user is wrong:
```bash
forge logout
forge login
```

---

## CLI Command Issues

### "Ticket not found" (404)

**Cause:** The ticket ID doesn't exist or belongs to a different team.

**Fix:**
- Double-check the ticket ID (format: `aec_...` or shorthand like `T-001`)
- Verify you're on the correct team with `forge whoami`
- Check the ticket exists in the web app

---

### "Invalid status transition" or "Cannot X from Y"

**Cause:** The command you're running isn't valid for the ticket's current status.

**Fix:**
```bash
forge show <id>
```

Check the current status, then refer to the [Ticket Lifecycle](/docs/platform/ticket-lifecycle) to see which commands work at which status.

Common examples:
- `forge review` only works on **Dev-Refining** tickets
- `forge execute` only works on **Forged** or **Executing** tickets

---

### "Not a git repository"

**Cause:** You're running a command that needs git context (like `forge execute`) from outside a git repository.

**Fix:**
```bash
cd /path/to/your/project
```

Ensure you're in the root of a git repository (the directory containing `.git`).

---

### Command not found: `forge`

**Cause:** The CLI isn't installed globally, or it's not in your PATH.

**Fix:**
```bash
npm install -g @anthropic/forge-cli
```

If already installed, check your PATH:
```bash
which forge
```

---

## MCP Issues

### Tools not showing up in Claude Code

**Cause:** MCP server isn't registered, or the AI assistant needs a restart.

**Fix:**
```bash
forge mcp install
```

Then restart Claude Code (or your AI assistant) completely.

---

### MCP server crashes on startup

**Cause:** Usually a Node.js version issue.

**Fix:**
```bash
node --version
```

Ensure you're on Node.js 20+. If not:
```bash
nvm install 20
nvm use 20
```

---

### MCP tools return "Not authenticated"

**Cause:** The MCP server can't find your credentials.

**Fix:**
```bash
forge login
forge doctor
```

The MCP server reads credentials from `~/.forge/config.json`. If the file is missing or empty, re-authenticate.

---

### `.mcp.json` not detected

**Cause:** The config file isn't in the project root.

**Fix:** Ensure `.mcp.json` is at the same level as your `.git` directory:

```
your-project/
├── .git/
├── .mcp.json    ← here
├── src/
└── package.json
```

---

## Web App Issues

### Can't approve a ticket

**Cause:** Only the PM who created the ticket (or a team admin) can approve it. The ticket must also be in **Review** status.

**Fix:**
- Check the ticket status — it must be in **Review**
- Verify you're the ticket creator
- If the ticket needs re-baking first, click **Re-bake** before approving

---

### Re-bake fails or produces the same spec

**Cause:** No developer Q&A was submitted, so there's no new context to incorporate.

**Fix:**
- Ensure the developer has submitted a review session (check for Q&A pairs in the ticket detail)
- If Q&A is present but the spec didn't change meaningfully, the original spec may already be comprehensive

---

### Attachments fail to upload

**Cause:** File size or format issue.

**Fix:**
- Check file format: PNG, JPG, GIF, WebP, PDF, DOC, DOCX
- Maximum 5 attachments per ticket
- Ensure file isn't corrupted

---

## Platform Issues

### Windows permission warnings on config file

**Cause:** Windows doesn't support Unix-style file permissions (0600). The CLI warns about this but continues working.

**Fix:** This is expected and harmless on Windows. The warning is informational only.

---

### Slow API responses

**Cause:** Network latency or AI generation in progress.

**Fix:**
- Check your network connection
- AI-powered operations (spec generation, question generation) take longer — this is normal
- If the API is consistently slow, check `forge doctor` for connectivity issues
