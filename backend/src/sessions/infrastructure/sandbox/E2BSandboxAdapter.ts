import { Injectable, Logger } from '@nestjs/common';
import { Sandbox } from '@e2b/code-interpreter';
import { SandboxPort, SandboxConfig, SandboxHandle } from '../../application/ports/SandboxPort';

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

    // Write environment variables
    const envContent = [
      `ANTHROPIC_API_KEY=${config.anthropicApiKey}`,
      `ANTHROPIC_MODEL=${config.model}`,
      `GITHUB_TOKEN=${config.githubToken}`,
      `FORGE_API_URL=${config.forgeApiUrl}`,
      `FORGE_SESSION_JWT=${config.forgeSessionJwt}`,
      `TICKET_ID=${config.ticketId}`,
      `REPO_URL=${config.repoUrl}`,
      `REPO_OWNER=${repoOwner}`,
      `REPO_NAME=${repoName}`,
      `BRANCH_NAME=${config.branch}`,
    ].join('\n');

    await sandbox.files.write('/home/user/.env', envContent);
    await sandbox.files.write('/home/user/system_prompt.txt', config.systemPrompt);

    this.logger.log(`Environment and system prompt written to sandbox ${sandbox.sandboxId}`);

    // Run bootstrap script (clones repo, configures MCP, sets up git)
    this.logger.log(`Running bootstrap script in sandbox ${sandbox.sandboxId}`);
    const bootstrapResult = await sandbox.commands.run(
      'chmod +x /home/user/bootstrap.sh && source /home/user/.env && /home/user/bootstrap.sh',
      {
        cwd: '/home/user',
        timeoutMs: 120000, // 2 min timeout for clone
      },
    );

    if (bootstrapResult.exitCode !== 0) {
      this.logger.warn(`Bootstrap stderr: ${bootstrapResult.stderr}`);
      this.logger.warn(`Bootstrap stdout: ${bootstrapResult.stdout}`);
      // Don't fail — Claude can still work without a repo (e.g., for testing)
      this.logger.warn(`Bootstrap exited with code ${bootstrapResult.exitCode}, continuing anyway`);
    } else {
      this.logger.log(`Bootstrap completed successfully in sandbox ${sandbox.sandboxId}`);
    }

    // Write launcher script (runs AFTER bootstrap)
    const workDir = repoOwner && repoName ? '/home/user/workspace' : '/home/user';
    const launcherScript = [
      '#!/bin/bash',
      'set -a',
      'source /home/user/.env',
      'set +a',
      `cd ${workDir}`,
      'exec claude \\',
      '  -p "$(cat /home/user/system_prompt.txt)" \\',
      '  --output-format stream-json \\',
      '  --verbose \\',
      '  --allowedTools "Read,Edit,Write,Bash,Glob,Grep,mcp__forge__*" \\',
      '  --dangerously-skip-permissions',
    ].join('\n');

    await sandbox.files.write('/home/user/start-claude.sh', launcherScript);

    this.logger.log(`Launcher script written to sandbox ${sandbox.sandboxId}`);

    // Resolve stdout/stderr handlers after they are registered
    let stdoutHandler: ((line: string) => void) | null = null;
    let stderrHandler: ((line: string) => void) | null = null;
    let exitHandler: ((code: number) => void) | null = null;

    // Start Claude Code
    const commandHandle = await sandbox.commands.run('chmod +x /home/user/start-claude.sh && /home/user/start-claude.sh', {
      background: true,
      cwd: workDir,
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
