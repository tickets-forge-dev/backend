// backend/src/sessions/application/services/__tests__/EventTranslator.spec.ts
import { translateEvent, RawCliEvent } from '../EventTranslator';

describe('EventTranslator', () => {
  describe('system events', () => {
    it('should return empty array for system events', () => {
      const raw: RawCliEvent = { type: 'system', subtype: 'init' };
      expect(translateEvent(raw)).toEqual([]);
    });
  });

  describe('assistant events', () => {
    it('should decompose text content blocks into message events', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'I will implement the webhook retry.' },
          ],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.message');
      expect(events[0].content).toBe('I will implement the webhook retry.');
    });

    it('should skip empty text blocks', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: { role: 'assistant', content: [{ type: 'text', text: '   ' }] },
      };
      expect(translateEvent(raw)).toEqual([]);
    });

    it('should convert thinking blocks to thinking events', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'Let me read the file...' },
            { type: 'text', text: 'I see the issue.' },
          ],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('event.thinking');
      expect(events[1].type).toBe('event.message');
    });

    it('should translate Edit tool_use to file_diff event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{
            type: 'tool_use', id: 'tu_01', name: 'Edit',
            input: {
              file_path: '/workspace/src/service.ts',
              old_string: 'async fire(url)',
              new_string: 'async fire(url, retries = 3)',
            },
          }],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.file_diff');
      expect(events[0].toolUseId).toBe('tu_01');
      expect(events[0].path).toBe('src/service.ts');
      expect(events[0].oldString).toBe('async fire(url)');
      expect(events[0].newString).toBe('async fire(url, retries = 3)');
    });

    it('should translate Bash tool_use to bash event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{
            type: 'tool_use', id: 'tu_02', name: 'Bash',
            input: { command: 'npm test' },
          }],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.bash');
      expect(events[0].command).toBe('npm test');
    });

    it('should translate Read tool_use to tool_use event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{
            type: 'tool_use', id: 'tu_03', name: 'Read',
            input: { file_path: '/workspace/src/service.ts' },
          }],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.tool_use');
      expect(events[0].tool).toBe('Read');
      expect(events[0].path).toBe('src/service.ts');
    });

    it('should translate Write tool_use to file_create event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{
            type: 'tool_use', id: 'tu_04', name: 'Write',
            input: { file_path: '/workspace/src/new-file.ts', content: 'export class Foo {}' },
          }],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.file_create');
      expect(events[0].path).toBe('src/new-file.ts');
    });

    it('should translate Glob to search event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{
            type: 'tool_use', id: 'tu_05', name: 'Glob',
            input: { pattern: '**/*.ts' },
          }],
        },
      };
      const events = translateEvent(raw);
      expect(events[0].type).toBe('event.search');
      expect(events[0].tool).toBe('Glob');
    });

    it('should translate Grep to search event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{
            type: 'tool_use', id: 'tu_06', name: 'Grep',
            input: { pattern: 'WebhookService' },
          }],
        },
      };
      const events = translateEvent(raw);
      expect(events[0].type).toBe('event.search');
      expect(events[0].tool).toBe('Grep');
    });

    it('should translate unknown tools to unknown_tool event', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{
            type: 'tool_use', id: 'tu_07', name: 'SomeFutureTool',
            input: { foo: 'bar' },
          }],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.unknown_tool');
      expect(events[0].tool).toBe('SomeFutureTool');
    });

    it('should handle multiple content blocks in one assistant message', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Reading file...' },
            { type: 'tool_use', id: 'tu_08', name: 'Read', input: { file_path: '/workspace/src/x.ts' } },
          ],
        },
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('event.message');
      expect(events[1].type).toBe('event.tool_use');
    });

    it('should return empty for assistant with no content', () => {
      const raw: RawCliEvent = { type: 'assistant', message: { role: 'assistant', content: [] } };
      expect(translateEvent(raw)).toEqual([]);
    });

    it('should return empty for assistant with undefined message', () => {
      const raw: RawCliEvent = { type: 'assistant' };
      expect(translateEvent(raw)).toEqual([]);
    });
  });

  describe('tool_result events', () => {
    it('should map tool_result to tool_result event with truncation', () => {
      const longOutput = 'x'.repeat(6000);
      const raw: RawCliEvent = { type: 'tool_result', tool_use_id: 'tu_01', content: longOutput };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.tool_result');
      expect(events[0].toolUseId).toBe('tu_01');
      expect(events[0].output!.length).toBe(5000);
      expect(events[0].truncated).toBe(true);
    });

    it('should not truncate short output', () => {
      const raw: RawCliEvent = { type: 'tool_result', tool_use_id: 'tu_01', content: 'short output' };
      const events = translateEvent(raw);
      expect(events[0].truncated).toBe(false);
      expect(events[0].output).toBe('short output');
    });

    it('should handle empty content', () => {
      const raw: RawCliEvent = { type: 'tool_result', tool_use_id: 'tu_01' };
      const events = translateEvent(raw);
      expect(events[0].output).toBe('');
      expect(events[0].truncated).toBe(false);
    });
  });

  describe('result events', () => {
    it('should map result to summary event', () => {
      const raw: RawCliEvent = {
        type: 'result', subtype: 'success',
        cost_usd: 0.47, duration_ms: 34000, num_turns: 5,
      };
      const events = translateEvent(raw);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('event.summary');
      expect(events[0].costUsd).toBe(0.47);
      expect(events[0].durationMs).toBe(34000);
      expect(events[0].numTurns).toBe(5);
    });
  });

  describe('path stripping', () => {
    it('should strip /workspace/ prefix from file paths', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{
            type: 'tool_use', id: 'tu_01', name: 'Read',
            input: { file_path: '/workspace/src/deep/path/file.ts' },
          }],
        },
      };
      const events = translateEvent(raw);
      expect(events[0].path).toBe('src/deep/path/file.ts');
    });

    it('should not strip paths without /workspace/ prefix', () => {
      const raw: RawCliEvent = {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: [{
            type: 'tool_use', id: 'tu_01', name: 'Read',
            input: { file_path: 'src/file.ts' },
          }],
        },
      };
      const events = translateEvent(raw);
      expect(events[0].path).toBe('src/file.ts');
    });
  });

  describe('unknown event types', () => {
    it('should return empty for unknown top-level types', () => {
      const raw = { type: 'something_new' } as any;
      expect(translateEvent(raw)).toEqual([]);
    });
  });
});
