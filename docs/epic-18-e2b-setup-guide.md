# E2B Setup Guide — Cloud Develop

## Overview

This guide walks you through setting up E2B (the sandbox provider) to run real Claude Code CLI sessions in the cloud. Once configured, clicking "Develop" on an approved ticket will provision an isolated Firecracker microVM, clone your repo, run Claude Code, and stream results to the browser.

---

## Step 1: Create E2B Account

1. Go to [e2b.dev](https://e2b.dev) and sign up
2. Choose the **Hobby plan** ($30/month, includes 1000 sandbox hours)
3. Go to Dashboard → API Keys → Create a new key
4. Copy the API key (starts with `e2b_`)

## Step 2: Add E2B API Key to Environment

Add to your Render environment (or `.env` for local dev):

```bash
# .env (backend)
E2B_API_KEY=e2b_your_api_key_here
```

On Render: Dashboard → forge-api → Environment → Add `E2B_API_KEY`.

## Step 3: Install E2B SDK

```bash
cd backend/backend
npm install e2b @e2b/code-interpreter
```

Add to `package.json` dependencies:
```json
"e2b": "^1.0.0",
"@e2b/code-interpreter": "^1.0.0"
```

## Step 4: Build the Container Template

The template is defined at `backend/src/sessions/infrastructure/container/forge-sandbox.Dockerfile`.

```bash
# Install E2B CLI
npm install -g @e2b/cli

# Login
e2b login

# Build the template (from the container directory)
cd backend/backend/src/sessions/infrastructure/container
e2b template build --name "forge-dev" --dockerfile forge-sandbox.Dockerfile
```

This creates a snapshot of the container with Node.js, Claude Code CLI, and the bootstrap script pre-installed. New sandboxes will start from this snapshot in ~150ms.

**Save the template ID** that E2B returns — you'll need it in the adapter.

## Step 5: Add Anthropic API Key

The sandbox needs an Anthropic API key to run Claude Code. This is **Forge's key**, not the user's.

```bash
# .env (backend)
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

## Step 6: Swap Stub Adapter for Real E2B Adapter

Currently, the sessions module uses `StubSandboxAdapter` (mock events for development). To use real E2B:

### 6a: Implement E2BSandboxAdapter

Update `backend/src/sessions/infrastructure/sandbox/E2BSandboxAdapter.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Sandbox } from 'e2b';
import { SandboxPort, SandboxConfig, SandboxHandle } from '../../application/ports/SandboxPort';

const E2B_TEMPLATE = process.env.E2B_TEMPLATE || 'forge-dev';

@Injectable()
export class E2BSandboxAdapter implements SandboxPort {
  private readonly logger = new Logger(E2BSandboxAdapter.name);

  async create(config: SandboxConfig): Promise<SandboxHandle> {
    const sandbox = await Sandbox.create(E2B_TEMPLATE, {
      timeoutMs: config.maxDurationMs,
      apiKey: process.env.E2B_API_KEY,
    });

    // Inject environment variables
    await sandbox.filesystem.write('/root/.env', [
      `ANTHROPIC_API_KEY=${config.anthropicApiKey}`,
      `GITHUB_TOKEN=${config.githubToken}`,
      `FORGE_API_URL=${config.forgeApiUrl}`,
      `FORGE_SESSION_JWT=${config.forgeSessionJwt}`,
      `TICKET_ID=${config.ticketId}`,
      `REPO_OWNER=${config.repoUrl.split('/')[3] || ''}`,
      `REPO_NAME=${config.repoUrl.split('/')[4] || ''}`,
      `BRANCH_NAME=${config.branch}`,
    ].join('\n'));

    // Run bootstrap
    const bootstrap = await sandbox.process.start({
      cmd: 'bash',
      args: ['/root/bootstrap.sh'],
      envs: { /* loaded from /root/.env */ },
    });
    await bootstrap.wait();

    // Start Claude Code
    const claude = await sandbox.process.start({
      cmd: 'claude',
      args: [
        '-p', config.systemPrompt,
        '--output-format', 'stream-json',
        '--allowedTools', 'Read,Edit,Write,Bash,Glob,Grep,mcp__forge__*',
        '--dangerously-skip-permissions',
        '--mcp-config', '/root/.forge-mcp.json',
      ],
      cwd: '/workspace',
    });

    let stdoutHandler: ((line: string) => void) | null = null;
    let stderrHandler: ((line: string) => void) | null = null;
    let exitHandler: ((code: number) => void) | null = null;

    claude.stdout.on('data', (data: string) => {
      if (stdoutHandler) stdoutHandler(data);
    });

    claude.stderr.on('data', (data: string) => {
      if (stderrHandler) stderrHandler(data);
    });

    claude.on('exit', (exitCode: number) => {
      if (exitHandler) exitHandler(exitCode);
    });

    return {
      id: sandbox.id,
      onStdout(handler) { stdoutHandler = handler; },
      onStderr(handler) { stderrHandler = handler; },
      onExit(handler) { exitHandler = handler; },
      async destroy() {
        await sandbox.kill();
      },
    };
  }
}
```

### 6b: Switch the Module Provider

In `backend/src/sessions/sessions.module.ts`, change the sandbox binding:

```typescript
// FROM:
import { StubSandboxAdapter } from './infrastructure/sandbox/StubSandboxAdapter';
// TO:
import { E2BSandboxAdapter } from './infrastructure/sandbox/E2BSandboxAdapter';

// Provider:
{ provide: SANDBOX_PORT, useClass: E2BSandboxAdapter },
```

Or better — use a factory that checks for the E2B API key:

```typescript
{
  provide: SANDBOX_PORT,
  useFactory: () => {
    if (process.env.E2B_API_KEY) {
      return new E2BSandboxAdapter();
    }
    return new StubSandboxAdapter();
  },
},
```

## Step 7: Set Up GitHub App (for Repo Access)

The sandbox needs a GitHub token to clone the user's repo. This uses the GitHub App from Epic 17.

1. Register a GitHub App at `github.com/organizations/{org}/settings/apps/new`
2. Permissions: `contents: write`, `pull_requests: write`, `metadata: read`
3. Store the App ID and private key in environment:

```bash
GITHUB_APP_ID=12345
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
```

The backend generates short-lived installation tokens per session via the App's private key.

## Step 8: Weekly Template Rebuild (CI)

Create `.github/workflows/rebuild-sandbox-template.yml`:

```yaml
name: Rebuild E2B Template
on:
  schedule:
    - cron: '0 3 * * 1'  # Every Monday 3am
  workflow_dispatch:

jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g @e2b/cli
      - run: |
          cd backend/backend/src/sessions/infrastructure/container
          e2b template build --name "forge-dev" --dockerfile forge-sandbox.Dockerfile
        env:
          E2B_API_KEY: ${{ secrets.E2B_API_KEY }}
```

## Step 9: Verify End-to-End

1. Start the backend locally: `cd backend/backend && npm run start:dev`
2. With StubSandboxAdapter (no E2B key): the Execute tab shows mock events
3. With E2B key configured: a real sandbox provisions and runs Claude Code

## Environment Variables Summary

| Variable | Purpose | Required |
|---|---|---|
| `E2B_API_KEY` | E2B sandbox provisioning | Yes (for real sandbox) |
| `E2B_TEMPLATE` | E2B template name (default: `forge-dev`) | No |
| `ANTHROPIC_API_KEY` | Claude API for the sandbox | Yes |
| `GITHUB_APP_ID` | GitHub App for repo access | Yes (for real repos) |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App auth | Yes (for real repos) |
| `FORGE_API_URL` | Backend URL for MCP callbacks | Yes |

## Costs

| Component | Cost |
|---|---|
| E2B Hobby plan | $30/month (1000 sandbox hours) |
| E2B overage | $0.10/hour |
| Average session | 15 min = $0.025 compute |
| Claude API (per session) | ~$1.50 avg |
