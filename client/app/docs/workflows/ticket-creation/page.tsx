import Link from 'next/link';
import { Plus, Copy, Upload, Zap } from 'lucide-react';

export const metadata = {
  title: 'Ticket Creation | Documentation',
  description: 'Learn how to create implementation-ready tickets with Forge.',
};

export default function TicketCreation() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Ticket Creation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Master the art of creating comprehensive, implementation-ready tickets with Forge.
        </p>
      </div>

      {/* Three Ways to Create */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Three Ways to Create Tickets</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Forge offers multiple ways to create tickets based on your starting point:
        </p>

        <div className="grid gap-4 mt-6 md:grid-cols-3">
          {[
            {
              icon: <Plus className="h-6 w-6" />,
              title: 'Create from Scratch',
              description: 'Describe a feature or bug → Forge analyzes your code → Generates spec',
              href: '/tickets/create',
            },
            {
              icon: <Copy className="h-6 w-6" />,
              title: 'Import from Jira/Linear',
              description: 'Import an existing issue → Forge enriches it with code context',
              href: '/docs/workflows/import-jira',
            },
            {
              icon: <Upload className="h-6 w-6" />,
              title: 'PRD Breakdown',
              description: 'Paste a PRD or requirements → Forge breaks it down into tickets',
              href: '/docs/workflows/prd-breakdown',
            },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
            >
              <div className="text-blue-600 dark:text-blue-400 mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Step-by-Step */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Step-by-Step: Create from Scratch</h2>

        <div className="space-y-4 mt-6">
          {[
            {
              num: 1,
              title: 'Go to Tickets → Create New',
              details: 'Click the &quot;Create Ticket&quot; button in the top right',
            },
            {
              num: 2,
              title: 'Fill in the basics',
              details: 'Title, description, type (Feature/Bug/Refactor), priority, and select repository',
            },
            {
              num: 3,
              title: 'Choose a branch',
              details: 'Select the branch Forge should analyze (usually &quot;main&quot; or &quot;master&quot;)',
            },
            {
              num: 4,
              title: 'Click &quot;Analyze&quot;',
              details: 'Forge starts Phase 1 context gathering and Phase 2 deep analysis',
            },
            {
              num: 5,
              title: 'Answer clarification questions',
              details: 'Forge asks 3-5 questions based on your codebase context',
            },
            {
              num: 6,
              title: 'Review and finalize',
              details: 'Check the generated spec, make edits if needed, then save',
            },
          ].map((item) => (
            <div key={item.num} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{item.num}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What Makes a Good Ticket */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Makes a Good Ticket Description</h2>

        <div className="grid gap-4 mt-6 md:grid-cols-2">
          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Good Examples</h3>
            <ul className="space-y-2 list-disc list-inside text-sm text-green-700 dark:text-green-200">
              <li>&quot;Add email authentication with Magic Links&quot;</li>
              <li>&quot;Fix bug: users can&apos;t upload files larger than 5MB&quot;</li>
              <li>&quot;Refactor database queries to use connection pooling&quot;</li>
              <li>&quot;Add two-factor authentication via SMS&quot;</li>
            </ul>
          </div>

          <div className="border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-3">Vague Examples (Avoid)</h3>
            <ul className="space-y-2 list-disc list-inside text-sm text-red-700 dark:text-red-200">
              <li>&quot;Add authentication&quot; (which kind?)</li>
              <li>&quot;Fix file upload issue&quot; (what issue?)</li>
              <li>&quot;Improve database&quot; (how?)</li>
              <li>&quot;Add security&quot; (what security measure?)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Editing Specs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Editing Generated Specs</h2>
        <p className="text-gray-700 dark:text-gray-300">
          You can edit any part of the generated spec to fit your needs:
        </p>

        <div className="space-y-3 mt-4">
          {[
            {
              section: 'Problem Statement',
              can_edit: 'Rewrite the problem description',
            },
            {
              section: 'Solution',
              can_edit: 'Change the proposed implementation approach',
            },
            {
              section: 'Acceptance Criteria',
              can_edit: 'Add, remove, or modify BDD criteria (Given/When/Then)',
            },
            {
              section: 'API Changes',
              can_edit: 'Add new endpoints, modify existing ones',
            },
            {
              section: 'File Changes',
              can_edit: 'Add/remove files, change implementation details',
            },
            {
              section: 'Test Plan',
              can_edit: 'Add unit tests, integration tests, edge cases',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.section}</h4>
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  Editable
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{item.can_edit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quality Score */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Understanding Quality Scores</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Each ticket gets a quality score (0-100) based on:
        </p>

        <div className="space-y-3 mt-4">
          {[
            { factor: 'Problem Statement Clarity', weight: '0-20' },
            { factor: 'Solution Completeness', weight: '0-25' },
            { factor: 'Acceptance Criteria', weight: '0-15' },
            { factor: 'File Changes Detail', weight: '0-10' },
            { factor: 'Ambiguity Resolution', weight: '0-10' },
            { factor: 'Test Plan Coverage', weight: '0-10' },
            { factor: 'API Changes Detail', weight: '0-5' },
            { factor: 'Layer Categorization', weight: '0-5' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{item.factor}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                {item.weight} pts
              </span>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Aim for 80+:</strong> A score of 80+ means your spec is detailed enough for engineers to start building. Below 80? Answer more questions or add more detail.
          </p>
        </div>
      </section>

      {/* Bulk Creation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Creating Multiple Tickets at Once</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Need to create dozens of tickets? Use bulk creation:
        </p>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Two Bulk Options:</h3>
          <ul className="space-y-2 list-disc list-inside text-sm text-amber-900 dark:text-amber-200">
            <li><strong>PRD Breakdown:</strong> Upload a product requirements document → Forge breaks it into individual tickets</li>
            <li><strong>Bulk Enrichment:</strong> Import 10-100 issues from Jira/Linear → Forge enriches them all at once</li>
          </ul>
        </div>

        <div className="mt-4">
          <Link
            href="/docs/workflows/prd-breakdown"
            className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors mb-3"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Learn about PRD Breakdown →</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Break down requirements into implementation tickets</p>
          </Link>
          <Link
            href="/docs/workflows/bulk-enrichment"
            className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Learn about Bulk Enrichment →</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enrich multiple Jira/Linear issues at once</p>
          </Link>
        </div>
      </section>

      {/* Drafts & Saves */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Drafts & Saving</h2>

        <div className="space-y-4 mt-4">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Auto-Save Drafts</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Forge auto-saves your work as you type. If you leave mid-creation, you can resume where you left off.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Version History</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Every change is saved. Click &quot;History&quot; to see who changed what and when. Restore old versions if needed.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Marking Complete</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              When ready, mark the ticket as &quot;Complete&quot; to lock it and share with your team. You can still edit completed tickets later.
            </p>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Next Steps</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          Now that you understand ticket creation, try other workflows:
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tickets/create"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Create a Ticket
          </Link>
          <Link
            href="/docs/workflows/import-jira"
            className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors"
          >
            Import from Jira
          </Link>
        </div>
      </section>
    </article>
  );
}
