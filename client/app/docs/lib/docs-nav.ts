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
      },
      {
        title: 'Setup Guide',
        href: '/docs/getting-started/setup',
      },
      {
        title: 'First Ticket',
        href: '/docs/getting-started/first-ticket',
      },
    ],
  },
  {
    title: 'Core Workflows',
    items: [
      {
        title: 'Ticket Creation',
        href: '/docs/workflows/ticket-creation',
      },
      {
        title: 'Import from Jira',
        href: '/docs/workflows/import-jira',
      },
      {
        title: 'Import from Linear',
        href: '/docs/workflows/import-linear',
      },
      {
        title: 'PRD Breakdown',
        href: '/docs/workflows/prd-breakdown',
      },
      {
        title: 'Bulk Enrichment',
        href: '/docs/workflows/bulk-enrichment',
      },
      {
        title: 'Ticket Details',
        href: '/docs/workflows/ticket-details',
      },
    ],
  },
  {
    title: 'Understanding Phases',
    items: [
      {
        title: 'Phase 1: Context Gathering',
        href: '/docs/phases/phase-1-context',
      },
      {
        title: 'Phase 2: Deep Analysis',
        href: '/docs/phases/phase-2-analysis',
      },
      {
        title: 'Phase 3: Questions',
        href: '/docs/phases/phase-3-questions',
      },
      {
        title: 'Phase 4: Specification',
        href: '/docs/phases/phase-4-spec',
      },
      {
        title: 'Phase 5: Finalization',
        href: '/docs/phases/phase-5-finalize',
      },
    ],
  },
  {
    title: 'Features',
    items: [
      {
        title: 'Reproduction Steps',
        href: '/docs/features/reproduction-steps',
      },
      {
        title: 'Acceptance Criteria',
        href: '/docs/features/acceptance-criteria',
      },
      {
        title: 'API Changes Detection',
        href: '/docs/features/api-changes',
      },
      {
        title: 'File Changes by Layer',
        href: '/docs/features/file-changes',
      },
      {
        title: 'Test Plan Generation',
        href: '/docs/features/test-plans',
      },
      {
        title: 'Quality Scoring',
        href: '/docs/features/quality-scoring',
      },
      {
        title: 'Tech Stack Detection',
        href: '/docs/features/tech-stack',
      },
    ],
  },
  {
    title: 'Security & Privacy',
    items: [
      {
        title: 'How We Scan Code',
        href: '/docs/security/code-scanning',
      },
      {
        title: 'Data Storage',
        href: '/docs/security/data-storage',
      },
      {
        title: 'Privacy & GDPR',
        href: '/docs/security/privacy',
      },
      {
        title: 'Security Best Practices',
        href: '/docs/security/best-practices',
      },
    ],
  },
  {
    title: 'FAQ & Help',
    items: [
      {
        title: 'FAQ',
        href: '/docs/faq/general',
      },
      {
        title: 'Common Objections',
        href: '/docs/faq/common-objections',
      },
      {
        title: 'Troubleshooting',
        href: '/docs/faq/troubleshooting',
      },
      {
        title: 'Common Patterns',
        href: '/docs/faq/patterns',
      },
      {
        title: 'Limitations & Roadmap',
        href: '/docs/faq/roadmap',
      },
    ],
  },
];
