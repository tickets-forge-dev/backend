/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Import from Linear | Documentation',
  description: 'Import and enrich Linear issues with code context using Forge.',
};

export default function ImportLinear() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Import from Linear
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Import Linear issues into Forge and automatically enrich them with code context and implementation details.
        </p>
      </div>

      {/* Why Import */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Why Import from Linear?</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Linear issues often lack implementation details. Forge analyzes your codebase and generates:
        </p>

        <div className="grid gap-4 mt-4 md:grid-cols-2">
          {[
            'Complete problem statements',
            'Implementation plans with file changes',
            'BDD acceptance criteria',
            'API changes and endpoints',
            'Test plans (unit + integration)',
            'Quality scores for completeness',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
              <span className="text-green-600 dark:text-green-400 flex-shrink-0">✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Setup */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Setup: Connect Linear</h2>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            You need to connect Linear in Settings before you can import issues.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              step: '1',
              title: 'Go to Settings → Integrations → Linear',
              details: 'Click your profile icon in the top right',
            },
            {
              step: '2',
              title: 'Click &quot;Connect Linear&quot;',
              details: 'You&apos;ll be redirected to Linear',
            },
            {
              step: '3',
              title: 'Select your workspace',
              details: 'Choose which Linear workspace Forge can access',
            },
            {
              step: '4',
              title: 'Click &quot;Authorize&quot;',
              details: 'Confirm the permissions and you&apos;re done',
            },
            {
              step: '5',
              title: 'Start importing!',
              details: 'You can now import any Linear issue by its ID or identifier',
            },
          ].map((item) => (
            <div key={item.step} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{item.step}</span>
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

      {/* Import Process */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Importing an Issue</h2>

        <div className="space-y-4 mt-6">
          {[
            {
              step: '1',
              title: 'Click &quot;Create Ticket&quot; → &quot;Import from Linear&quot;',
              details: 'You&apos;ll see the import wizard',
            },
            {
              step: '2',
              title: 'Enter the Linear issue identifier',
              details: 'Format: &quot;FOR-123&quot; (project-number) or paste the full UUID',
            },
            {
              step: '3',
              title: 'Review the preview',
              details: 'Forge shows the title, description, priority, and status from Linear',
            },
            {
              step: '4',
              title: 'Click &quot;Import&quot;',
              details: 'Forge downloads the issue and creates a draft',
            },
            {
              step: '5',
              title: 'Select repository and branch',
              details: 'Pick which repo Forge should analyze for context',
            },
            {
              step: '6',
              title: 'Forge generates the spec',
              details: 'Just like creating new, but with Linear data pre-filled',
            },
          ].map((item) => (
            <div key={item.step} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{item.step}</span>
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

      {/* Field Mapping */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How Forge Maps Linear Fields</h2>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-2 font-semibold">Linear Field</th>
                <th className="text-left px-4 py-2 font-semibold">Forge Field</th>
                <th className="text-left px-4 py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {[
                ['Title', 'Title', 'Exact copy'],
                ['Description', 'Description', 'Markdown preserved'],
                ['Priority (Urgent)', 'Priority (Urgent)', 'Exact match'],
                ['Priority (High)', 'Priority (High)', 'Exact match'],
                ['Priority (Medium)', 'Priority (Medium)', 'Exact match'],
                ['Priority (Low/No Priority)', 'Priority (Low)', 'Mapped to Low'],
                ['State', 'Status', 'Draft (can be changed)'],
                ['Team', 'Not imported', 'You choose in Forge'],
                ['Assignees', 'Not imported', 'Assign in Forge later'],
              ].map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{row[0]}</td>
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{row[1]}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Finding Issues */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Finding Your Issue ID</h2>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">In Linear:</h3>
          <ol className="space-y-2 list-decimal list-inside text-sm text-blue-900 dark:text-blue-200">
            <li>Open the issue you want to import</li>
            <li>Look at the URL: "linear.app/issue/FOR-123"</li>
            <li>The identifier is "FOR-123" (project code + number)</li>
            <li>Or click the issue ID in the top left to copy the UUID</li>
          </ol>
        </div>
      </section>

      {/* Bulk Import */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Bulk Import Multiple Issues</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Import and enrich 10-100 Linear issues at once with Bulk Enrichment:
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <ol className="space-y-2 list-decimal list-inside text-sm text-blue-900 dark:text-blue-200">
            <li>Go to Tools → Bulk Enrichment</li>
            <li>Paste Linear issue IDs (FOR-123 format, one per line)</li>
            <li>Set repository and answers to pre-fill questions</li>
            <li>Click "Start Enrichment"</li>
            <li>Forge imports all issues and generates specs in parallel</li>
            <li>Review results and create all tickets at once</li>
          </ol>
        </div>

        <div className="mt-4">
          <Link
            href="/docs/workflows/bulk-enrichment"
            className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Learn about Bulk Enrichment →</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Import and enrich dozens of issues at once</p>
          </Link>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Tips</h2>

        <div className="space-y-3 mt-4">
          {[
            {
              title: 'Use the identifier format',
              description: 'FOR-123 is easier to type than copying the UUID',
            },
            {
              title: 'Pick the right repository',
              description: 'Forge needs to analyze the repo where the feature will be built',
            },
            {
              title: 'Enrich with context',
              description: 'Add details to the Linear description before importing for better specs',
            },
            {
              title: 'Answer questions',
              description: 'Clarification questions help Forge understand your intent',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Ready to Import?</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          Connect Linear in Settings, then start importing your first issue.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tickets/create"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Import from Linear
          </Link>
          <Link
            href="/docs/workflows/import-jira"
            className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors"
          >
            Or Import from Jira
          </Link>
        </div>
      </section>
    </article>
  );
}
