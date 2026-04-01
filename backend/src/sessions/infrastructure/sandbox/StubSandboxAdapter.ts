import { Injectable, Logger } from '@nestjs/common';
import { SandboxPort, SandboxConfig, SandboxHandle } from '../../application/ports/SandboxPort';
import { randomUUID } from 'crypto';

@Injectable()
export class StubSandboxAdapter implements SandboxPort {
  private readonly logger = new Logger(StubSandboxAdapter.name);

  async create(config: SandboxConfig): Promise<SandboxHandle> {
    const sandboxId = `stub_${randomUUID().slice(0, 8)}`;
    this.logger.log(`[STUB] Creating sandbox ${sandboxId} for ticket ${config.ticketId}`);

    let stdoutHandler: ((line: string) => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let stderrHandler: ((line: string) => void) | null = null;
    let exitHandler: ((code: number) => void) | null = null;
    let destroyed = false;

    // Simulate Claude Code session after a short delay
    setTimeout(() => {
      if (destroyed) return;

      const events = [
        { type: 'system', subtype: 'init', cwd: '/workspace', model: 'claude-sonnet-4-20250514' },
        { type: 'assistant', message: { role: 'assistant', content: [
          { type: 'text', text: `I'll implement this ticket. Let me start by reading the codebase.` },
        ]}},
        { type: 'assistant', message: { role: 'assistant', content: [
          { type: 'tool_use', id: 'tu_01', name: 'Read', input: { file_path: '/workspace/src/index.ts' } },
        ]}},
        { type: 'tool_result', tool_use_id: 'tu_01', content: 'export function main() { console.log("hello"); }' },
        { type: 'assistant', message: { role: 'assistant', content: [
          { type: 'text', text: 'I can see the current implementation. Let me make the changes.' },
          { type: 'tool_use', id: 'tu_02', name: 'Edit', input: {
            file_path: '/workspace/src/index.ts',
            old_string: 'console.log("hello")',
            new_string: 'console.log("hello world")',
          }},
        ]}},
        { type: 'tool_result', tool_use_id: 'tu_02', content: 'File edited successfully' },
        { type: 'assistant', message: { role: 'assistant', content: [
          { type: 'tool_use', id: 'tu_03', name: 'Bash', input: { command: 'npm test' } },
        ]}},
        { type: 'tool_result', tool_use_id: 'tu_03', content: 'Tests: 5 passed, 0 failed' },
        { type: 'assistant', message: { role: 'assistant', content: [
          { type: 'text', text: 'All tests pass. Implementation complete.' },
        ]}},
        { type: 'result', subtype: 'success', cost_usd: 0.42, duration_ms: 15000, num_turns: 4 },
      ];

      let eventIndex = 0;
      const emitNext = () => {
        if (destroyed || eventIndex >= events.length) {
          if (!destroyed && exitHandler) {
            exitHandler(0);
          }
          return;
        }

        const event = events[eventIndex++];
        if (stdoutHandler) {
          stdoutHandler(JSON.stringify(event) + '\n');
        }

        // Stagger events to simulate real timing
        setTimeout(emitNext, 300 + Math.random() * 500);
      };

      emitNext();
    }, 500); // Initial delay simulating sandbox startup

    const logger = this.logger;

    return {
      id: sandboxId,
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
        destroyed = true;
        logger.log(`[STUB] Sandbox ${sandboxId} destroyed`);
      },
    };
  }
}
