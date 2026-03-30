#!/usr/bin/env node

// Forge MCP Server — runs inside E2B sandbox
// Provides Forge-specific tools to Claude Code via stdio transport (JSON-RPC 2.0)

import { TOOL_DEFINITIONS } from './tools';
import * as forgeClient from './forge-client';
import * as readline from 'readline';

const SERVER_INFO = {
  name: 'forge-mcp-server',
  version: '1.0.0',
};

interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

async function handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  const { method, params, id } = request;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: SERVER_INFO,
          capabilities: {
            tools: {},
          },
        },
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          tools: TOOL_DEFINITIONS,
        },
      };

    case 'tools/call': {
      const toolName = (params?.name as string) || '';
      const args = (params?.arguments as Record<string, unknown>) || {};

      try {
        const result = await callTool(toolName, args);
        return {
          jsonrpc: '2.0',
          id: id ?? null,
          result: {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          jsonrpc: '2.0',
          id: id ?? null,
          result: {
            content: [{ type: 'text', text: `Error: ${message}` }],
            isError: true,
          },
        };
      }
    }

    case 'notifications/initialized':
      // Client notification — no response needed
      return null;

    default:
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
  }
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'forge_get_ticket_context':
      return forgeClient.getTicketContext();

    case 'forge_get_repository_context':
      return forgeClient.getRepositoryContext();

    case 'forge_record_decision':
      await forgeClient.recordExecutionEvent(
        'decision',
        args.title as string,
        args.description as string,
      );
      return `Decision recorded: ${args.title}`;

    case 'forge_record_risk':
      await forgeClient.recordExecutionEvent(
        'risk',
        args.title as string,
        args.description as string,
      );
      return `Risk recorded: ${args.title}`;

    case 'forge_record_scope_change':
      await forgeClient.recordExecutionEvent(
        'scope_change',
        args.title as string,
        args.description as string,
      );
      return `Scope change recorded: ${args.title}`;

    case 'forge_submit_settlement':
      await forgeClient.submitSettlement({
        executionSummary: args.executionSummary as string,
        filesChanged:
          (args.filesChanged as Array<{ path: string; additions: number; deletions: number }>) ||
          [],
        divergences:
          (args.divergences as Array<{
            area: string;
            intended: string;
            actual: string;
            justification: string;
          }>) || [],
      });
      return 'Settlement submitted successfully. Development session complete.';

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// stdio transport — read JSON-RPC from stdin, write to stdout
const rl = readline.createInterface({ input: process.stdin });

rl.on('line', async (line: string) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const request = JSON.parse(trimmed) as JsonRpcRequest;
    const response = await handleRequest(request);
    if (response) {
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const errorResponse: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: `Parse error: ${message}`,
      },
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

// Log to stderr (stdout is reserved for MCP protocol)
console.error('[forge-mcp-server] Started. Waiting for requests on stdin...');
