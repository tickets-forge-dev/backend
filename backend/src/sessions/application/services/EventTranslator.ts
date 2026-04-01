// backend/src/sessions/application/services/EventTranslator.ts

// --- Input: Raw CLI stream-json event ---
export interface RawCliEvent {
  type: 'system' | 'assistant' | 'tool_use' | 'tool_result' | 'result';
  subtype?: string;
  message?: {
    role: string;
    content: Array<{
      type: 'thinking' | 'text' | 'tool_use';
      text?: string;
      thinking?: string;
      id?: string;
      name?: string;
      input?: Record<string, unknown>;
    }>;
  };
  tool_use_id?: string;
  content?: string;
  cost_usd?: number;
  duration_ms?: number;
  num_turns?: number;
  session_id?: string;
}

// --- Output: UI events sent to browser ---
export type UiEventType =
  | 'session.status'
  | 'event.message'
  | 'event.thinking'
  | 'event.tool_use'
  | 'event.file_diff'
  | 'event.file_create'
  | 'event.bash'
  | 'event.search'
  | 'event.tool_result'
  | 'event.summary'
  | 'event.unknown_tool';

export interface UiEvent {
  type: UiEventType;
  toolUseId?: string;
  content?: string;
  tool?: string;
  path?: string;
  command?: string;
  oldString?: string;
  newString?: string;
  output?: string;
  truncated?: boolean;
  costUsd?: number;
  durationMs?: number;
  numTurns?: number;
  params?: Record<string, unknown>;
}

const MAX_OUTPUT_LENGTH = 5000;

function stripWorkspacePath(filePath: string): string {
  return filePath.replace(/^\/workspace\//, '');
}

function translateToolUse(block: { id?: string; name?: string; input?: Record<string, unknown> }): UiEvent {
  const toolUseId = block.id;
  const toolName = block.name ?? 'unknown';
  const input = block.input ?? {};

  switch (toolName) {
    case 'Edit':
      return {
        type: 'event.file_diff',
        toolUseId,
        tool: 'Edit',
        path: stripWorkspacePath((input.file_path as string) ?? ''),
        oldString: (input.old_string as string) ?? '',
        newString: (input.new_string as string) ?? '',
      };

    case 'Write':
      return {
        type: 'event.file_create',
        toolUseId,
        tool: 'Write',
        path: stripWorkspacePath((input.file_path as string) ?? ''),
        content: (input.content as string) ?? '',
      };

    case 'Bash':
      return {
        type: 'event.bash',
        toolUseId,
        tool: 'Bash',
        command: (input.command as string) ?? '',
      };

    case 'Read':
      return {
        type: 'event.tool_use',
        toolUseId,
        tool: 'Read',
        path: stripWorkspacePath((input.file_path as string) ?? ''),
      };

    case 'Glob':
    case 'Grep':
      return {
        type: 'event.search',
        toolUseId,
        tool: toolName,
        params: input,
      };

    default:
      return {
        type: 'event.unknown_tool',
        toolUseId,
        tool: toolName,
        params: input,
      };
  }
}

export function translateEvent(raw: RawCliEvent): UiEvent[] {
  switch (raw.type) {
    case 'system':
      return [];

    case 'assistant': {
      if (!raw.message?.content) return [];
      return raw.message.content.flatMap((block): UiEvent[] => {
        switch (block.type) {
          case 'thinking':
            return [{ type: 'event.thinking' }];
          case 'text':
            if (!block.text?.trim()) return [];
            return [{ type: 'event.message', content: block.text }];
          case 'tool_use':
            return [translateToolUse(block)];
          default:
            return [];
        }
      });
    }

    case 'tool_result': {
      const output = raw.content ?? '';
      const truncated = output.length > MAX_OUTPUT_LENGTH;
      return [{
        type: 'event.tool_result',
        toolUseId: raw.tool_use_id,
        output: truncated ? output.slice(0, MAX_OUTPUT_LENGTH) : output,
        truncated,
      }];
    }

    case 'result':
      return [{
        type: 'event.summary',
        costUsd: raw.cost_usd,
        durationMs: raw.duration_ms,
        numTurns: raw.num_turns,
      }];

    default:
      return [];
  }
}
