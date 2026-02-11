import Link from 'next/link';

export const metadata = {
  title: 'Ticket Details | Documentation',
  description: 'Understand and manage ticket details in Forge.',
};

export default function TicketDetails() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Ticket Details
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Explore and manage all sections of a comprehensive Forge ticket.
        </p>
      </div>

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Ticket Overview</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Each Forge ticket contains several key sections:
        </p>

        <div className="space-y-3 mt-4">
          {[
            {
              section: 'Title & Type',
              description: 'Ticket name, type (Feature/Bug/Task/Refactor), priority, and status',
            },
            {
              section: 'Problem Statement',
              description: 'Why this change is needed. Context for engineers.',
            },
            {
              section: 'Solution',
              description: 'How to implement the change. Recommended approach and trade-offs.',
            },
            {
              section: 'Acceptance Criteria',
              description: 'BDD-style requirements. Given/When/Then format.',
            },
            {
              section: 'File Changes',
              description: 'Which files to modify, organized by layer (backend/frontend/shared)',
            },
            {
              section: 'API Changes',
              description: 'New endpoints, modified endpoints, DTOs, authentication requirements',
            },
            {
              section: 'Test Plan',
              description: 'Unit tests, integration tests, edge cases, and test files',
            },
            {
              section: 'Tech Stack',
              description: 'Technologies detected from your codebase relevant to this ticket',
            },
            {
              section: 'Quality Score',
              description: 'Overall completeness and detail rating (0-100)',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.section}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Editing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Editing Tickets</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          All sections of a ticket are editable. Click any section to modify it:
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-sm">Editable Sections:</h3>
          <ul className="space-y-2 list-disc list-inside text-sm text-blue-900 dark:text-blue-200">
            <li>Problem Statement - rewrite or refine the context</li>
            <li>Solution - change implementation approach</li>
            <li>Acceptance Criteria - add, remove, or modify criteria</li>
            <li>File Changes - adjust which files are affected</li>
            <li>API Changes - add new endpoints or modify existing ones</li>
            <li>Test Plan - change tests or add edge cases</li>
            <li>Metadata - title, type, priority, status, description</li>
          </ul>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">How to Edit</h3>
          <ol className="space-y-2 list-decimal list-inside text-sm text-gray-700 dark:text-gray-300">
            <li>Click the section you want to edit</li>
            <li>Make your changes in the inline editor</li>
            <li>Changes are auto-saved as you type</li>
            <li>The quality score updates as you edit</li>
          </ol>
        </div>
      </section>

      {/* Acceptance Criteria */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Acceptance Criteria (BDD Format)</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Forge uses Behavior-Driven Development (BDD) format for acceptance criteria:
        </p>

        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`Given [initial state]
When [user action]
Then [expected result]

Example:
Given the user is logged in
When they click "Export"
Then a CSV file is downloaded`}
          </p>
        </div>

        <div className="space-y-3 mt-4">
          {[
            {
              part: 'Given',
              description: 'Preconditions. What must be true before testing.',
            },
            {
              part: 'When',
              description: 'Action. What the user or system does.',
            },
            {
              part: 'Then',
              description: 'Expected outcome. What happens as a result.',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.part}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* File Changes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">File Changes by Layer</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Forge organizes file changes into logical layers:
        </p>

        <div className="space-y-3 mt-4">
          {[
            {
              layer: 'Backend',
              examples: 'API routes, business logic, database migrations, models',
            },
            {
              layer: 'Frontend',
              examples: 'React components, pages, hooks, CSS modules',
            },
            {
              layer: 'Shared',
              examples: 'Utilities, types, constants, shared components',
            },
            {
              layer: 'Infrastructure',
              examples: 'Docker configs, CI/CD, deployment files, env configs',
            },
            {
              layer: 'Documentation',
              examples: 'README updates, API docs, architecture docs',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.layer}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.examples}</p>
            </div>
          ))}
        </div>
      </section>

      {/* API Changes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">API Changes</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          For API changes, Forge documents:
        </p>

        <div className="space-y-3 mt-4">
          {[
            'HTTP method (GET, POST, PATCH, DELETE)',
            'Route path (e.g., /api/users/:id)',
            'Request body and types',
            'Response format',
            'Error codes and handling',
            'Authentication requirements',
            'Rate limiting (if applicable)',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`POST /api/users
Content-Type: application/json

Request:
{ "email": "user@example.com", "name": "John" }

Response:
{ "id": "user123", "email": "user@example.com", "createdAt": "2024-01-01" }`}
          </p>
        </div>
      </section>

      {/* Test Plan */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Test Plans</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Forge generates test plans organized by type:
        </p>

        <div className="space-y-3 mt-4">
          {[
            {
              type: 'Unit Tests',
              description: 'Test individual functions/components in isolation',
            },
            {
              type: 'Integration Tests',
              description: 'Test how components work together',
            },
            {
              type: 'Edge Cases',
              description: 'Test boundary conditions and error scenarios',
            },
            {
              type: 'E2E Tests',
              description: 'Test complete user workflows (if applicable)',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.type}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Status & Workflow */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Status & Workflow</h2>

        <div className="space-y-3 mt-4">
          {[
            {
              status: 'Draft',
              description: 'Work in progress. You can edit freely. Not shared with team by default.',
            },
            {
              status: 'Complete',
              description: 'Finished and ready to share. Still editable, but locked from further generation.',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.status}</h4>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Tip:</strong> Mark a ticket as &quot;Complete&quot; when the spec is ready to be implemented. Your team can still view and edit it.
          </p>
        </div>
      </section>

      {/* History & Versions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">History & Version Control</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Every change to a ticket is tracked:
        </p>

        <div className="space-y-3 mt-4">
          {[
            'See who made changes and when',
            'View full diffs for each edit',
            'Restore previous versions if needed',
            'Leave comments on specific sections',
            'Export version history as PDF',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">To View History:</h3>
          <ol className="space-y-1 list-decimal list-inside text-xs text-gray-700 dark:text-gray-300">
            <li>Open a ticket</li>
            <li>Click &quot;History&quot; in the header</li>
            <li>See all changes with timestamps and editors</li>
            <li>Click any version to preview or restore</li>
          </ol>
        </div>
      </section>

      {/* Sharing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Sharing Tickets</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Share completed tickets with your team:
        </p>

        <div className="space-y-3 mt-4">
          {[
            'Share directly in Forge (team members can view and comment)',
            'Export as markdown or PDF for email/Slack',
            'Copy ticket link to share in issue trackers',
            'Set permissions: view-only or can-edit',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Next Steps</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          Explore other features and workflows available in Forge.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs/features/acceptance-criteria"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Learn About Acceptance Criteria
          </Link>
          <Link
            href="/docs/features/test-plans"
            className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors"
          >
            Test Planning
          </Link>
        </div>
      </section>
    </article>
  );
}
