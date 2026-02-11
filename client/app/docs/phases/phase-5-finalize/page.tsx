import Link from 'next/link';

export const metadata = {
  title: 'Phase 5: Finalization | Documentation',
  description: 'Learn how to finalize and share your ticket in Phase 5.',
};

export default function Phase5Finalize() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Phase 5: Finalization
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Review your specification, make final edits, and mark it complete for your team.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Happens in Phase 5</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Phase 5 is where you review and finalize:
        </p>

        <div className="space-y-3 mt-4">
          {[
            'Review the generated specification',
            'Edit any sections that need improvement',
            'Check the quality score',
            'Test acceptance criteria',
            'Verify API changes and file changes',
            'Mark as &quot;Complete&quot; when ready',
            'Share with your team',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Review Checklist</h2>

        <div className="space-y-3 mt-4">
          {[
            {
              item: 'Problem Statement',
              question: 'Is the context clear? Would an engineer understand why this change is needed?',
            },
            {
              item: 'Solution',
              question: 'Does the proposed approach make sense? Are there better alternatives?',
            },
            {
              item: 'Acceptance Criteria',
              question: 'Are all requirements covered? Can engineers test against these criteria?',
            },
            {
              item: 'File Changes',
              question: 'Are the affected files correct? Is the organization by layer correct?',
            },
            {
              item: 'API Changes',
              question: 'Do the endpoint names and payloads match your conventions?',
            },
            {
              item: 'Test Plan',
              question: 'Are there enough tests? Do they cover edge cases?',
            },
            {
              item: 'Quality Score',
              question: 'Is the score 80+? If not, should you add more detail?',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.item}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.question}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Making Final Edits</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Don&apos;t like something? Click to edit any section:
        </p>

        <div className="space-y-3 mt-4">
          {[
            'Click the section header to expand/edit',
            'Changes are auto-saved',
            'Quality score updates as you edit',
            'You can undo changes from history',
            'Add notes or comments for your team',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Pro Tip:</strong> Don&apos;t spend too much time perfecting the spec. You can edit anytime. Just make sure the quality score is 70+.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Marking Complete</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          When you&apos;re happy with the spec:
        </p>

        <div className="space-y-4 mt-4">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Steps to Finalize</h3>
            <ol className="space-y-2 list-decimal list-inside text-sm text-gray-700 dark:text-gray-300">
              <li>Review all sections one final time</li>
              <li>Check quality score (aim for 80+)</li>
              <li>Click &quot;Mark as Complete&quot;</li>
              <li>Add any final notes for your team</li>
              <li>Confirm finalization</li>
            </ol>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 text-sm">After Marking Complete</h3>
            <ul className="space-y-1 list-disc list-inside text-xs text-green-700 dark:text-green-200">
              <li>Ticket is ready for your team to implement</li>
              <li>You can still edit it (it&apos;s not locked)</li>
              <li>Team can view, comment, and collaborate</li>
              <li>Version history is preserved</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Sharing Your Ticket</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Share your completed spec with your team:
        </p>

        <div className="space-y-3 mt-4">
          {[
            {
              method: 'Share in Forge',
              description: 'Team members can view and comment directly in Forge',
            },
            {
              method: 'Export as Markdown',
              description: 'Copy to email, Slack, or documentation wiki',
            },
            {
              method: 'Export as PDF',
              description: 'Download a formatted PDF for sharing or printing',
            },
            {
              method: 'Copy link',
              description: 'Share a link to the ticket in Forge',
            },
            {
              method: 'Import to Jira/Linear',
              description: 'Create a corresponding issue in your tracker',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.method}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">After Finalization</h2>

        <div className="space-y-3 mt-4">
          {[
            'Your team reviews the spec',
            'Engineers start implementation',
            'You can make changes anytime (edit ticket)',
            'Track progress in your project',
            'Collaborate with comments and notes',
            'Celebrate when it&apos;s shipped!',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">{i + 1}.</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">You&apos;re Done!</h2>
        <p className="text-green-900 dark:text-green-200 mb-4">
          You&apos;ve successfully created an implementation-ready ticket with Forge. Your engineering team now has everything they need to build this feature.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tickets/create"
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
          >
            Create Another Ticket
          </Link>
          <Link
            href="/docs/getting-started/what-is-forge"
            className="px-4 py-2 rounded-lg border border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium transition-colors"
          >
            Back to Docs
          </Link>
        </div>
      </section>
    </article>
  );
}
