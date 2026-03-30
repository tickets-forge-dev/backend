import { Injectable, Logger } from '@nestjs/common';
import { Sandbox } from 'e2b';
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

    // Write environment variables file so Claude Code process can read them
    const envContent = [
      `ANTHROPIC_API_KEY=${config.anthropicApiKey}`,
      `GITHUB_TOKEN=${config.githubToken}`,
      `FORGE_API_URL=${config.forgeApiUrl}`,
      `FORGE_SESSION_JWT=${config.forgeSessionJwt}`,
      `TICKET_ID=${config.ticketId}`,
      `REPO_URL=${config.repoUrl}`,
      `BRANCH=${config.branch}`,
    ].join('\n');

    await sandbox.files.write('/root/.env', envContent);

    // Write system prompt to a file the claude process can read
    await sandbox.files.write('/root/system_prompt.txt', config.systemPrompt);

    this.logger.log(`Environment and system prompt written to sandbox ${sandbox.sandboxId}`);

    // Resolve stdout/stderr handlers after they are registered
    let stdoutHandler: ((line: string) => void) | null = null;
    let stderrHandler: ((line: string) => void) | null = null;
    let exitHandler: ((code: number) => void) | null = null;

    // Write a launcher script to avoid shell quoting issues
    const launcherScript = [
      '#!/bin/bash',
      'set -a',
      'source /root/.env',
      'set +a',
      'exec claude \\',
      '  -p "$(cat /root/system_prompt.txt)" \\',
      '  --output-format stream-json \\',
      '  --allowedTools "Read,Edit,Write,Bash,Glob,Grep,mcp__forge__*" \\',
      '  --dangerously-skip-permissions \\',
      '  --mcp-config /root/.forge-mcp.json',
    ].join('\n');

    await sandbox.files.write('/root/start-claude.sh', launcherScript);

    const commandHandle = await sandbox.commands.run('chmod +x /root/start-claude.sh && /root/start-claude.sh', {
      background: true,
      cwd: '/root',
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
