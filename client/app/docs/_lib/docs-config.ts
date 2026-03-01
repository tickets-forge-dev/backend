export interface DocPage {
  title: string;
  slug: string;
  description: string;
}

export interface DocCategory {
  title: string;
  slug: string;
  pages: DocPage[];
}

export const docsConfig: DocCategory[] = [
  {
    title: 'Getting Started',
    slug: 'getting-started',
    pages: [
      { title: 'What is Forge?', slug: 'what-is-forge', description: 'The problem Forge solves and how it works' },
      { title: 'Quickstart for PMs', slug: 'quickstart-pms', description: 'Create your first verified ticket in the web app' },
      { title: 'Quickstart for Developers', slug: 'quickstart-developers', description: 'Install the CLI and execute your first ticket' },
    ],
  },
  {
    title: 'Platform',
    slug: 'platform',
    pages: [
      { title: 'The AEC', slug: 'aec', description: 'Anatomy of a verified execution contract' },
      { title: 'Ticket Lifecycle', slug: 'ticket-lifecycle', description: 'Status flow from Draft to Complete' },
      { title: 'Web App Guide', slug: 'web-app-guide', description: 'Every feature in the Forge web app' },
    ],
  },
  {
    title: 'CLI & MCP',
    slug: 'cli-and-mcp',
    pages: [
      { title: 'Installation & Auth', slug: 'installation-and-auth', description: 'Install, authenticate, and verify your setup' },
      { title: 'Command Reference', slug: 'command-reference', description: 'Every CLI command explained — login, review, develop, execute, and more' },
      { title: 'MCP Integration', slug: 'mcp-integration', description: 'Connect Forge to Claude Code, Cursor, or Windsurf' },
    ],
  },
  {
    title: 'Security',
    slug: 'security',
    pages: [
      { title: 'Security Model', slug: 'security-model', description: 'How Forge protects your data and defends against prompt injection' },
    ],
  },
  {
    title: 'Support',
    slug: 'troubleshooting',
    pages: [
      { title: 'Common Questions', slug: 'common-issues', description: 'Quick answers to frequently asked questions' },
      { title: 'Configuration', slug: 'configuration', description: 'Config files, environment variables, and debug logging' },
    ],
  },
];

export function getPageHref(categorySlug: string, pageSlug: string): string {
  return `/docs/${categorySlug}/${pageSlug}`;
}

export function findPage(categorySlug: string, pageSlug: string): { category: DocCategory; page: DocPage } | null {
  const category = docsConfig.find((c) => c.slug === categorySlug);
  if (!category) return null;
  const page = category.pages.find((p) => p.slug === pageSlug);
  if (!page) return null;
  return { category, page };
}
