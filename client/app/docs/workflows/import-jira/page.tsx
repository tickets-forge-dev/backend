import Link from 'next/link';
import { RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Import from Jira | Documentation',
  description: 'Import and enrich Jira issues with code context using Forge.',
};

export default function ImportJira() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Import from Jira
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Import Jira issues into Forge and automatically enrich them with code context.
        </p>
      </div>

      {/* Why Import */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Why Import from Jira?</h2>

        <div className="grid gap-4 mt-6 md:grid-cols-2">
          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Before Importing</h3>
            <ul className="space-y-2 list-disc list-inside text-xs text-green-700 dark:text-green-200">
              <li>Issue has basic title and description</li>
              <li>No implementation details</li>
              <li>No acceptance criteria</li>
              <li>Engineers ask clarifying questions</li>
            </ul>
          </div>

          <div className="border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">After Forge Enrichment</h3>
            <ul className="space-y-2 list-disc list-inside text-xs text-blue-700 dark:text-blue-200">
              <li>Comprehensive problem statement</li>
              <li>Implementation plan with file changes</li>
              <li>BDD acceptance criteria</li>
              <li>Test plan (unit + integration)</li>
              <li>API changes (if applicable)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Setup */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Setup: Connect Your Jira Account</h2>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <strong>First time?</strong> You need to connect Jira in Settings before importing.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              step: '1',
              title: 'Go to Settings → Integrations',
              details: 'Click your profile icon → Settings',
            },
            {
              step: '2',
              title: 'Find Jira and enter your instance URL',
              details: 'e.g., https://company.atlassian.net',
            },
            {
              step: '3',
              title: 'Create a Jira API token',
              details: 'In Jira: Account Settings → Security → Create API Token',
            },
            {
              step: '4',
              title: 'Enter your email and token in Forge',
              details: 'Then click &quot;Connect&quot;',
            },
            {
              step: '5',
              title: 'You&apos;re connected!',
              details: 'Now you can import any issue from Jira',
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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Importing a Single Issue</h2>

        <div className="space-y-4 mt-6">
          {[
            {
              step: '1',
              title: 'Click &quot;Create Ticket&quot; → &quot;Import from Jira&quot;',
              details: 'You&apos;ll see the import wizard',
            },
            {
              step: '2',
              title: 'Enter the Jira issue key',
              details: 'e.g., &quot;PROJ-123&quot; (must match exactly)',
            },
            {
              step: '3',
              title: 'Review the preview',
              details: 'Forge shows the title, description, priority, and issue type from Jira',
            },
            {
              step: '4',
              title: 'Click &quot;Import&quot;',
              details: 'Forge downloads the issue and creates a draft ticket',
            },
            {
              step: '5',
              title: 'Select repository and branch',
              details: 'Choose which repo Forge should analyze for context',
            },
            {
              step: '6',
              title: 'Forge generates the spec',
              details: 'Just like creating from scratch, but with Jira data pre-filled',
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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How Forge Maps Jira Fields</h2>
        <p className="text-gray-700 dark:text-gray-300">
          When you import a Jira issue, Forge automatically converts Jira fields to Forge fields:
        </p>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-2 font-semibold">Jira Field</th>
                <th className="text-left px-4 py-2 font-semibold">Forge Field</th>
                <th className="text-left px-4 py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {[
                ['Summary', 'Title', 'Exact copy'],
                ['Description', 'Description', 'Converted from Jira markup'],
                ['Issue Type (Story)', 'Type (Feature)', 'Story → Feature'],
                ['Issue Type (Bug)', 'Type (Bug)', 'Exact match'],
                ['Issue Type (Task)', 'Type (Task)', 'Exact match'],
                ['Priority (Highest)', 'Priority (Urgent)', 'Mapped by severity'],
                ['Priority (High)', 'Priority (High)', 'Exact match'],
                ['Priority (Medium)', 'Priority (Medium)', 'Exact match'],
                ['Priority (Low/Lowest)', 'Priority (Low)', 'Mapped to Low'],
                ['Assignee', 'Not imported', 'You choose assignee in Forge'],
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

      {/* Bulk Import */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Bulk Import from Jira</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Need to import and enrich 10-100 Jira issues at once? Use Bulk Enrichment:
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Bulk Enrichment Workflow</h3>
          <ol className="space-y-2 list-decimal list-inside text-sm text-blue-900 dark:text-blue-200">
            <li>Go to Tools → Bulk Enrichment</li>
            <li>Enter Jira issue keys (one per line)</li>
            <li>Select answers to pre-set clarification questions</li>
            <li>Click &quot;Start Enrichment&quot;</li>
            <li>Forge imports and enriches all issues in parallel</li>
            <li>Download results as CSV or create all tickets at once</li>
          </ol>
        </div>

        <div className="mt-4">
          <Link
            href="/docs/workflows/bulk-enrichment"
            className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Learn about Bulk Enrichment →</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enrich 10-100 issues at once with parallel processing</p>
          </Link>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Tips & Best Practices</h2>

        <div className="space-y-3 mt-4">
          {[
            {
              title: 'Use specific issue keys',
              description: 'Make sure the issue key matches exactly (Jira is case-sensitive for projects)',
            },
            {
              title: 'Provide good description',
              description: 'The more context in the Jira issue, the better Forge&apos;s analysis',
            },
            {
              title: 'Select the right repository',
              description: 'Forge needs to analyze your codebase, so pick the repo where this feature will be built',
            },
            {
              title: 'Answer all questions',
              description: 'More context = more accurate specs. Answer clarification questions for best results',
            },
            {
              title: 'Review the generated spec',
              description: 'Check if field mappings are correct and edit if needed',
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
          Start by connecting Jira in Settings, then import your first issue.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tickets/create"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Import from Jira
          </Link>
          <Link
            href="/docs/workflows/import-linear"
            className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors"
          >
            Or Import from Linear
          </Link>
        </div>
      </section>
    </article>
  );
}
