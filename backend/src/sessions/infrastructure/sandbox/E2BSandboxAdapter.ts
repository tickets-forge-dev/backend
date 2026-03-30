import { Injectable, Logger } from '@nestjs/common';
import { Sandbox } from '@e2b/code-interpreter';
import { SandboxPort, SandboxConfig, SandboxHandle } from '../../application/ports/SandboxPort';

/** Map full API model IDs to Claude Code CLI aliases */
function toClaudeCodeModel(apiModel: string): string {
  if (apiModel.includes('opus')) return 'opus';
  if (apiModel.includes('haiku')) return 'haiku';
  return 'sonnet'; // default
}

@Injectable()
export class E2BSandboxAdapter implements SandboxPort {
  private readonly logger = new Logger(E2BSandboxAdapter.name);

  async create(config: SandboxConfig): Promise<SandboxHandle> {
    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey) {
      throw new Error('E2B_API_KEY environment variable is not set');
    }

    const templateName = process.env.E2B_TEMPLATE || 'base';

    this.logger.log(
      `Creating E2B sandbox (template: ${templateName}) for ticket ${config.ticketId}`,
    );

    const sandbox = await Sandbox.create(templateName, {
      timeoutMs: config.maxDurationMs,
      apiKey,
      metadata: {
        ticketId: config.ticketId,
      },
    });

    this.logger.log(`Sandbox ${sandbox.sandboxId} created`);

    // Parse repo owner/name from URL (https://github.com/owner/name.git)
    let repoOwner = '';
    let repoName = '';
    if (config.repoUrl) {
      const match = config.repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
      if (match) {
        repoOwner = match[1];
        repoName = match[2];
      }
    }

    // Write environment variables (single-quoted to prevent bash expansion of special chars in tokens)
    const envContent = [
      `ANTHROPIC_API_KEY='${config.anthropicApiKey}'`,
      `ANTHROPIC_MODEL='${config.model}'`,
      `GITHUB_TOKEN='${config.githubToken}'`,
      `FORGE_API_URL='${config.forgeApiUrl}'`,
      `FORGE_SESSION_JWT='${config.forgeSessionJwt}'`,
      `TICKET_ID='${config.ticketId}'`,
      `REPO_URL='${config.repoUrl}'`,
      `REPO_OWNER='${repoOwner}'`,
      `REPO_NAME='${repoName}'`,
      `BRANCH_NAME='${config.branch}'`,
    ].join('\n');

    // Log token presence (not values) for debugging
    this.logger.log(`Sandbox ${sandbox.sandboxId} env: GITHUB_TOKEN=${config.githubToken ? `set (${config.githubToken.length} chars)` : 'EMPTY'}, REPO_URL=${config.repoUrl || 'EMPTY'}`);

    await sandbox.files.write('/home/user/.env', envContent);
    await sandbox.files.write('/home/user/system_prompt.txt', config.systemPrompt);

    this.logger.log(`Environment and system prompt written to sandbox ${sandbox.sandboxId}`);

    // Run bootstrap: clone repo + configure environment
    this.logger.log(`Running bootstrap in sandbox ${sandbox.sandboxId}`);
    const cloneCmd = config.repoUrl && config.githubToken
      ? [
          `git config --global credential.helper '!f() { echo "username=x-access-token"; echo "password=${config.githubToken}"; }; f'`,
          `git config --global user.name "Forge Cloud Develop"`,
          `git config --global user.email "cloud-develop@forge-ai.dev"`,
          `git clone "https://x-access-token:${config.githubToken}@github.com/${repoOwner}/${repoName}.git" /home/user/workspace`,
          `cd /home/user/workspace && git checkout -b "${config.branch}"`,
        ].join(' && ')
      : 'mkdir -p /home/user/workspace';

    // Also run the template bootstrap if it exists (for MCP config, etc.)
    const bootstrapCmd = `${cloneCmd} && ([ -f /home/user/bootstrap.sh ] && chmod +x /home/user/bootstrap.sh && source /home/user/.env && /home/user/bootstrap.sh || true)`;

    const bootstrapResult = await sandbox.commands.run(bootstrapCmd, {
      cwd: '/home/user',
      timeoutMs: 120000,
    });

    if (bootstrapResult.exitCode !== 0) {
      this.logger.error(`Bootstrap failed (exit ${bootstrapResult.exitCode}) in sandbox ${sandbox.sandboxId}`);
      if (bootstrapResult.stderr) this.logger.error(`Bootstrap stderr: ${bootstrapResult.stderr}`);
      if (bootstrapResult.stdout) this.logger.warn(`Bootstrap stdout: ${bootstrapResult.stdout}`);
      // Fail fast — if bootstrap fails, Claude won't have the repo or MCP configured
      throw new Error(
        `Sandbox bootstrap failed (exit ${bootstrapResult.exitCode}): ${bootstrapResult.stderr || bootstrapResult.stdout || 'unknown error'}`,
      );
    } else {
      this.logger.log(`Bootstrap completed successfully in sandbox ${sandbox.sandboxId}`);
    }

    // Write MCP config AFTER bootstrap (bootstrap's sed overwrites the template file)
    // Skip MCP if API URL is localhost — sandbox can't reach the host machine
    const isLocalApi = config.forgeApiUrl.includes('localhost') || config.forgeApiUrl.includes('127.0.0.1');
    this.logger.log(`Sandbox ${sandbox.sandboxId} FORGE_API_URL="${config.forgeApiUrl}" isLocal=${isLocalApi}`);
    if (isLocalApi) {
      this.logger.warn(`Sandbox ${sandbox.sandboxId}: Skipping MCP config — FORGE_API_URL is localhost (unreachable from sandbox)`);
    } else {
      const mcpConfig = {
        mcpServers: {
          forge: {
            command: 'node',
            args: ['/home/user/forge-mcp-server/dist/index.js'],
            env: {
              FORGE_API_URL: config.forgeApiUrl,
              FORGE_SESSION_JWT: config.forgeSessionJwt,
              TICKET_ID: config.ticketId,
            },
          },
        },
      };
      await sandbox.files.write('/home/user/.forge-mcp.json', JSON.stringify(mcpConfig, null, 2));
      this.logger.log(`MCP config written to sandbox ${sandbox.sandboxId}`);
    }

    // Pre-flight diagnostics
    const workDir = repoOwner && repoName ? '/home/user/workspace' : '/home/user';

    this.logger.log(`Starting Claude Code in sandbox ${sandbox.sandboxId}`);

    this.logger.log(`Sandbox ${sandbox.sandboxId} using model alias: ${toClaudeCodeModel(config.model)} (from ${config.model})`);
    // Resolve stdout/stderr handlers after they are registered
    let stdoutHandler: ((line: string) => void) | null = null;
    let stderrHandler: ((line: string) => void) | null = null;
    let exitHandler: ((code: number) => void) | null = null;

    const mcpFlag = isLocalApi ? '' : ' --mcp-config /home/user/.forge-mcp.json';
    const commandHandle = await sandbox.commands.run(
      `claude -p "Implement the ticket according to the system prompt instructions." --append-system-prompt-file /home/user/system_prompt.txt --output-format stream-json --verbose --model ${toClaudeCodeModel(config.model)} --max-turns 30 --dangerously-skip-permissions${mcpFlag}`,
      {
        background: true,
        cwd: workDir,
        envs: {
          ANTHROPIC_API_KEY: config.anthropicApiKey,
        },
      onStdout: (data: string) => {
        if (stdoutHandler) {
          stdoutHandler(data);
        }
      },
      onStderr: (data: string) => {
        if (stderrHandler) {
          stderrHandler(data);
        }
      },
      timeoutMs: config.maxDurationMs,
    });

    this.logger.log(`Claude Code process started in sandbox ${sandbox.sandboxId} (pid: ${commandHandle.pid})`);

    // Wait for the command to exit and call exitHandler
    commandHandle.wait().then((result) => {
      this.logger.log(
        `Sandbox ${sandbox.sandboxId} process exited with code ${result.exitCode}`,
      );
      if (exitHandler) {
        exitHandler(result.exitCode ?? 0);
      }
    }).catch((err: Error) => {
      this.logger.error(`Sandbox ${sandbox.sandboxId} process error: ${err.message}`);
      if (exitHandler) {
        exitHandler(1);
      }
    });

    const logger = this.logger;

    return {
      id: sandbox.sandboxId,
      onStdout(handler: (line: string) => void): void {
        stdoutHandler = handler;
      },
      onStderr(handler: (line: string) => void): void {
        stderrHandler = handler;
      },
      onExit(handler: (code: number) => void): void {
        exitHandler = handler;
      },
      async destroy(): Promise<void> {
        logger.log(`Killing sandbox ${sandbox.sandboxId}`);
        await sandbox.kill();
      },
    };
  }
}
