import { Injectable, Logger } from '@nestjs/common';
import { SandboxPort, SandboxConfig, SandboxHandle } from '../../application/ports/SandboxPort';

@Injectable()
export class E2BSandboxAdapter implements SandboxPort {
  private readonly logger = new Logger(E2BSandboxAdapter.name);

  async create(_config: SandboxConfig): Promise<SandboxHandle> {
    // TODO: Implement with E2B SDK when available
    // const { Sandbox } = await import('e2b');
    // const sandbox = await Sandbox.create('forge-dev', { timeoutMs: config.maxDurationMs });
    // await sandbox.filesystem.write('/root/.env', `ANTHROPIC_API_KEY=${config.anthropicApiKey}\n...`);
    // const process = await sandbox.process.start({ cmd: 'claude', args: [...], cwd: '/workspace' });

    throw new Error(
      'E2B sandbox adapter is not yet configured. ' +
      'Set E2B_API_KEY environment variable or use StubSandboxAdapter for development.',
    );
  }
}
