// MCP tool definitions for Forge sandbox server

export const TOOL_DEFINITIONS = [
  {
    name: 'forge_get_ticket_context',
    description:
      'Get the full ticket specification including problem statement, solution, acceptance criteria, and expected file changes. Always call this first before starting implementation.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [] as string[],
    },
  },
  {
    name: 'forge_get_repository_context',
    description:
      'Get the project profile including tech stack, file structure, and coding patterns. Use this to understand the codebase architecture.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [] as string[],
    },
  },
  {
    name: 'forge_record_decision',
    description:
      'Record a significant implementation decision. Call this whenever you choose between multiple approaches, so the reviewing developer understands your reasoning.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' as const, description: 'Short title of the decision' },
        description: {
          type: 'string' as const,
          description: 'Why you chose this approach over alternatives',
        },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'forge_record_risk',
    description:
      'Record an identified risk or concern. Call this when you notice something that could cause issues.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' as const, description: 'Short title of the risk' },
        description: {
          type: 'string' as const,
          description: 'What the risk is and potential impact',
        },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'forge_record_scope_change',
    description:
      'Record a deviation from the original specification. Call this when you need to do something differently than what was specified.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string' as const, description: 'What changed from the spec' },
        description: {
          type: 'string' as const,
          description: 'Why the change was necessary',
        },
      },
      required: ['title', 'description'],
    },
  },
  {
    name: 'forge_submit_settlement',
    description:
      'Submit the final implementation settlement. Call this after all changes are committed and tests pass. This completes the development session.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        executionSummary: {
          type: 'string' as const,
          description: 'High-level summary of what was implemented',
        },
        filesChanged: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              path: { type: 'string' as const },
              additions: { type: 'number' as const },
              deletions: { type: 'number' as const },
            },
            required: ['path', 'additions', 'deletions'],
          },
          description: 'List of files changed with line counts',
        },
        divergences: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              area: { type: 'string' as const },
              intended: { type: 'string' as const },
              actual: { type: 'string' as const },
              justification: { type: 'string' as const },
            },
            required: ['area', 'intended', 'actual', 'justification'],
          },
          description: 'Any deviations from the original specification',
        },
      },
      required: ['executionSummary', 'filesChanged'],
    },
  },
];
