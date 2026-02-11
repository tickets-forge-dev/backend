import Link from 'next/link';

export const metadata = {
  title: 'Bulk Enrichment | Documentation',
  description: 'Enrich multiple Jira or Linear issues with code context at once.',
};

export default function BulkEnrichment() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Bulk Enrichment
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Import and enrich 10-100 Jira or Linear issues at once with parallel processing.
        </p>
      </div>

      {/* When to Use */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">When to Use Bulk Enrichment</h2>

        <div className="space-y-4 mt-4">
          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Perfect For:</h3>
            <ul className="space-y-2 list-disc list-inside text-sm text-green-700 dark:text-green-200">
              <li>Enriching an entire sprint&apos;s worth of issues</li>
              <li>Migrating from Jira/Linear to Forge specs</li>
              <li>Batch generating specs for a team or project</li>
              <li>Creating implementation specs for backlog items</li>
              <li>Standardizing spec format across many tickets</li>
            </ul>
          </div>

          <div className="border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Limits:</h3>
            <ul className="space-y-2 list-disc list-inside text-sm text-amber-700 dark:text-amber-200">
              <li>Maximum 100 issues per batch</li>
              <li>Maximum 500 clarification questions across all issues</li>
              <li>Processing time: ~2-5 minutes for 100 issues</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How Bulk Enrichment Works</h2>

        <div className="space-y-4 mt-6">
          {[
            {
              step: '1',
              title: 'Paste issue keys/IDs',
              description: 'Enter Jira (PROJ-123) or Linear (FOR-456) issue identifiers, one per line',
            },
            {
              step: '2',
              title: 'Set parameters',
              description: 'Choose repository, branch, and pre-fill clarification question answers',
            },
            {
              step: '3',
              title: 'Parallel processing',
              description: 'Forge imports all issues simultaneously and generates specs in parallel',
            },
            {
              step: '4',
              title: 'Review results',
              description: 'See a preview of all generated specs with quality scores',
            },
            {
              step: '5',
              title: 'Selective creation',
              description: 'Choose which tickets to create (you can deselect any that don&apos;t look right)',
            },
            {
              step: '6',
              title: 'Batch create',
              description: 'All selected tickets are created at once in your workspace',
            },
          ].map((item) => (
            <div key={item.step} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Input Format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Input Format</h2>

        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Jira Issues:</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap mb-4">
{`PROJ-123
PROJ-124
PROJ-125
PROJ-126`}
          </p>

          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Linear Issues:</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">
{`FOR-1
FOR-2
FOR-3
FOR-4`}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Pro Tip:</strong> Copy issue keys directly from your Jira/Linear board or export as CSV
          </p>
        </div>
      </section>

      {/* Pre-fill Answers */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Pre-filling Clarification Answers</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Save time by pre-filling answers to common clarification questions:
        </p>

        <div className="space-y-3 mt-4">
          {[
            {
              question: 'Should this be implemented in the backend, frontend, or both?',
              answer_example: 'Backend',
            },
            {
              question: 'Do you need database schema changes?',
              answer_example: 'Yes',
            },
            {
              question: 'What&apos;s the priority?',
              answer_example: 'High',
            },
            {
              question: 'Do you need tests?',
              answer_example: 'Unit tests + integration tests',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">{item.question}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Pre-filled with:</strong> {item.answer_example}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            All 100 issues will use the same pre-filled answers. You can override for individual tickets after review.
          </p>
        </div>
      </section>

      {/* Review & Selection */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Review & Selection</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          After enrichment completes, you can:
        </p>

        <div className="space-y-3 mt-4">
          {[
            'Select or deselect individual tickets to create',
            'View quality scores for each spec',
            'See a preview of the generated spec',
            'Edit any spec before final creation',
            'Sort by quality score, title, or status',
            'Filter by type (Feature, Bug, Task, Refactor)',
            'Export results as CSV if you want to review offline',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Performance */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Performance & Reliability</h2>

        <div className="space-y-3 mt-4">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Parallel Processing</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              All 100 issues are processed simultaneously, not sequentially. Expected time: 2-5 minutes total.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Fault Tolerance</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              If one issue fails, others continue processing. You can retry failed issues individually.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Auto-Save Progress</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Your bulk enrichment job is auto-saved. If you close the browser, you can resume where you left off.
            </p>
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Example: Enriching a Sprint</h2>

        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Your team has 15 Jira issues in the next sprint. Instead of creating specs one by one (15 minutes each), you:
          </p>
          <ol className="space-y-2 list-decimal list-inside text-sm text-gray-700 dark:text-gray-300">
            <li>Copy all 15 issue keys from Jira</li>
            <li>Paste them into Forge&apos;s bulk enrichment</li>
            <li>Set repository to your main project</li>
            <li>Set pre-filled answers (backend + tests needed)</li>
            <li>Wait 5 minutes for all 15 specs to generate</li>
            <li>Review, deselect any you don&apos;t like</li>
            <li>Create all 15 tickets at once</li>
          </ol>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 font-semibold">
            Result: 15 implementation-ready specs generated in 5 minutes instead of 3+ hours manually
          </p>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Tips for Success</h2>

        <div className="space-y-3 mt-4">
          {[
            {
              title: 'Start small',
              description: 'Try with 5-10 issues first to test the process',
            },
            {
              title: 'Use same repository',
              description: 'All issues in one batch should use the same repository for consistency',
            },
            {
              title: 'Review first',
              description: 'Check quality scores before bulk creating - you can still edit individual specs',
            },
            {
              title: 'Keep descriptions clean',
              description: 'Better Jira/Linear descriptions = better generated specs',
            },
            {
              title: 'Batch by team',
              description: 'Enrich one team&apos;s backlog at a time for better context',
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
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Ready to Bulk Enrich?</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          Gather your issue keys and start enriching your entire backlog.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tickets/create"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Start Bulk Enrichment
          </Link>
          <Link
            href="/docs/workflows/prd-breakdown"
            className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors"
          >
            Or Try PRD Breakdown
          </Link>
        </div>
      </section>
    </article>
  );
}
