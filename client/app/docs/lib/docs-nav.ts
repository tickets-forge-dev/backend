export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const docsNav: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        title: 'What is Forge?',
        href: '/docs/getting-started/what-is-forge',
      },
      {
        title: 'Forge vs Claude',
        href: '/docs/getting-started/forge-vs-claude',
        disabled: true,
      },
      {
        title: 'Setup Guide',
        href: '/docs/getting-started/setup',
        disabled: true,
      },
      {
        title: 'First Ticket',
        href: '/docs/getting-started/first-ticket',
        disabled: true,
      },
    ],
  },
  {
    title: 'Core Workflows',
    items: [
      {
        title: 'Ticket Creation',
        href: '/docs/workflows/ticket-creation',
        disabled: true,
      },
      {
        title: 'Import from Jira',
        href: '/docs/workflows/import-jira',
        disabled: true,
      },
      {
        title: 'Import from Linear',
        href: '/docs/workflows/import-linear',
        disabled: true,
      },
      {
        title: 'PRD Breakdown',
        href: '/docs/workflows/prd-breakdown',
        disabled: true,
      },
      {
        title: 'Bulk Enrichment',
        href: '/docs/workflows/bulk-enrichment',
        disabled: true,
      },
      {
        title: 'Ticket Details',
        href: '/docs/workflows/ticket-details',
        disabled: true,
      },
    ],
  },
  {
    title: 'Understanding Phases',
    items: [
      {
        title: 'Phase 1: Context Gathering',
        href: '/docs/phases/phase-1-context',
        disabled: true,
      },
      {
        title: 'Phase 2: Deep Analysis',
        href: '/docs/phases/phase-2-analysis',
        disabled: true,
      },
      {
        title: 'Phase 3: Questions',
        href: '/docs/phases/phase-3-questions',
        disabled: true,
      },
      {
        title: 'Phase 4: Specification',
        href: '/docs/phases/phase-4-spec',
        disabled: true,
      },
      {
        title: 'Phase 5: Finalization',
        href: '/docs/phases/phase-5-finalize',
        disabled: true,
      },
    ],
  },
  {
    title: 'Features',
    items: [
      {
        title: 'Reproduction Steps',
        href: '/docs/features/reproduction-steps',
        disabled: true,
      },
      {
        title: 'Acceptance Criteria',
        href: '/docs/features/acceptance-criteria',
        disabled: true,
      },
      {
        title: 'API Changes Detection',
        href: '/docs/features/api-changes',
        disabled: true,
      },
      {
        title: 'File Changes by Layer',
        href: '/docs/features/file-changes',
        disabled: true,
      },
      {
        title: 'Test Plan Generation',
        href: '/docs/features/test-plans',
        disabled: true,
      },
      {
        title: 'Quality Scoring',
        href: '/docs/features/quality-scoring',
        disabled: true,
      },
      {
        title: 'Tech Stack Detection',
        href: '/docs/features/tech-stack',
        disabled: true,
      },
    ],
  },
  {
    title: 'Security & Privacy',
    items: [
      {
        title: 'How We Scan Code',
        href: '/docs/security/code-scanning',
        disabled: true,
      },
      {
        title: 'Data Storage',
        href: '/docs/security/data-storage',
        disabled: true,
      },
      {
        title: 'Privacy & GDPR',
        href: '/docs/security/privacy',
        disabled: true,
      },
      {
        title: 'Security Best Practices',
        href: '/docs/security/best-practices',
        disabled: true,
      },
    ],
  },
  {
    title: 'FAQ & Help',
    items: [
      {
        title: 'FAQ',
        href: '/docs/faq/general',
        disabled: true,
      },
      {
        title: 'Troubleshooting',
        href: '/docs/faq/troubleshooting',
        disabled: true,
      },
      {
        title: 'Common Patterns',
        href: '/docs/faq/patterns',
        disabled: true,
      },
      {
        title: 'Limitations & Roadmap',
        href: '/docs/faq/roadmap',
        disabled: true,
      },
    ],
  },
];
