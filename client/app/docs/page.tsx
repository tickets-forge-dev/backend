import Link from 'next/link';
import { Search, BookOpen, Zap, Shield } from 'lucide-react';

export const metadata = {
  title: 'Documentation | Forge',
  description: 'Learn how to use Forge - guides, tutorials, and knowledge base for AI-powered ticket generation.',
};

export default function DocsHome() {
  return (
    <article className="space-y-12">
      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          Forge Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
          Learn how to generate implementation-ready tickets with AI-powered context from your codebase.
        </p>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href="/docs/getting-started/what-is-forge"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/tickets/create"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 font-medium transition-colors"
          >
            Create a Ticket
          </Link>
        </div>
      </div>

      {/* Main Topics */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Start Here</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              icon: <BookOpen className="h-6 w-6" />,
              title: 'What is Forge?',
              description: 'Understand how Forge helps teams create better tickets with AI and code context.',
              href: '/docs/getting-started/what-is-forge',
            },
            {
              icon: <Zap className="h-6 w-6" />,
              title: 'Ticket Creation',
              description: 'Learn how to create tickets from scratch, import from Jira/Linear, or break down PRDs.',
              href: '/docs/workflows/ticket-creation',
              disabled: true,
            },
            {
              icon: <Shield className="h-6 w-6" />,
              title: 'Security & Privacy',
              description: 'Your code is safe. Learn how we scan code without cloning or storing it.',
              href: '/docs/security/code-scanning',
              disabled: true,
            },
            {
              icon: <Search className="h-6 w-6" />,
              title: 'FAQ & Help',
              description: 'Find answers to common questions and troubleshooting tips.',
              href: '/docs/faq/general',
              disabled: true,
            },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.disabled ? '#' : item.href}
              className={`block p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all ${
                item.disabled
                  ? 'opacity-60 cursor-not-allowed pointer-events-none'
                  : 'hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md dark:hover:shadow-blue-900/20'
              }`}
            >
              <div className="text-blue-600 dark:text-blue-400 mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Workflows Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Core Workflows</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: 'Create from Scratch', href: '/docs/workflows/ticket-creation' },
            { title: 'Import from Jira', href: '/docs/workflows/import-jira' },
            { title: 'Import from Linear', href: '/docs/workflows/import-linear' },
            { title: 'PRD Breakdown', href: '/docs/workflows/prd-breakdown' },
            { title: 'Bulk Enrichment', href: '/docs/workflows/bulk-enrichment' },
            { title: 'Edit Tickets', href: '/docs/workflows/ticket-details' },
          ].map((item, i) => (
            <Link
              key={i}
              href="#"
              className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white opacity-60 cursor-not-allowed pointer-events-none"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Features</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: 'Reproduction Steps', href: '/docs/features/reproduction-steps' },
            { title: 'Acceptance Criteria', href: '/docs/features/acceptance-criteria' },
            { title: 'API Changes Detection', href: '/docs/features/api-changes' },
            { title: 'File Changes by Layer', href: '/docs/features/file-changes' },
            { title: 'Test Plan Generation', href: '/docs/features/test-plans' },
            { title: 'Quality Scoring', href: '/docs/features/quality-scoring' },
          ].map((item, i) => (
            <Link
              key={i}
              href="#"
              className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white opacity-60 cursor-not-allowed pointer-events-none"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Phases Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Understanding the Phases</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Forge generates tickets through 4 phases. Learn what happens at each step:
        </p>
        <div className="space-y-2">
          {[
            { num: 1, title: 'Context Gathering', time: '1-2s' },
            { num: 2, title: 'Deep Analysis', time: '5-10s' },
            { num: 3, title: 'Clarification Questions', time: 'Variable' },
            { num: 4, title: 'Specification Generation', time: '2-3s' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed pointer-events-none"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="font-semibold text-blue-700 dark:text-blue-300">{item.num}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
              </div>
              <span className="text-sm text-gray-500">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Ready to Get Started?</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Create your first ticket and see how Forge uses code context to generate implementation-ready specs.
        </p>
        <Link
          href="/tickets/create"
          className="inline-block px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          Create a Ticket
        </Link>
      </div>
    </article>
  );
}
