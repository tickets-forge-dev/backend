import Link from 'next/link';

export const metadata = {
  title: 'PRD Breakdown | Documentation',
  description: 'Break down product requirements into implementation-ready tickets with Forge.',
};

export default function PRDBreakdown() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          PRD Breakdown
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Paste a PRD or requirements document and let Forge automatically break it down into implementation-ready tickets.
        </p>
      </div>

      {/* When to Use */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">When to Use PRD Breakdown</h2>

        <div className="space-y-4 mt-4">
          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Perfect For:</h3>
            <ul className="space-y-2 list-disc list-inside text-sm text-green-700 dark:text-green-200">
              <li>Product managers with a detailed specification document</li>
              <li>Designers with a complete design specification</li>
              <li>Teams planning a major feature release</li>
              <li>Breaking down large epics into smaller tasks</li>
              <li>Creating multiple tickets at once from a single document</li>
            </ul>
          </div>

          <div className="border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Example Use Cases:</h3>
            <ul className="space-y-2 list-disc list-inside text-sm text-blue-700 dark:text-blue-200">
              <li>&quot;Build a payment system&quot; → Breaks into: stripe integration, payment modal, order confirmation, etc.</li>
              <li>&quot;Redesign dashboard&quot; → Breaks into: new layout, analytics widgets, export feature, etc.</li>
              <li>&quot;Add reporting features&quot; → Breaks into: report generation, PDF export, scheduling, etc.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Step by Step */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Step-by-Step Guide</h2>

        <div className="space-y-4 mt-6">
          {[
            {
              step: '1',
              title: 'Go to Tools → PRD Breakdown',
              details: 'Click the PRD Breakdown option in the tools menu',
            },
            {
              step: '2',
              title: 'Paste your PRD or requirements',
              details: 'Copy and paste your product requirements document (Google Docs, Notion, Markdown, plain text all work)',
            },
            {
              step: '3',
              title: 'Provide context',
              details: 'Tell Forge about your tech stack, team size, and timeline (optional but recommended)',
            },
            {
              step: '4',
              title: 'Click &quot;Break Down PRD&quot;',
              details: 'Forge analyzes the PRD and generates a list of implementation tickets',
            },
            {
              step: '5',
              title: 'Review the breakdown',
              details: 'See all generated tickets: title, description, type, priority, estimated effort',
            },
            {
              step: '6',
              title: 'Select tickets to create',
              details: 'Choose which tickets you want to add to your project',
            },
            {
              step: '7',
              title: 'Set repository for each ticket',
              details: 'Forge will enrich each ticket with code context from your repos',
            },
            {
              step: '8',
              title: 'Click &quot;Create All Tickets&quot;',
              details: 'Forge generates comprehensive specs for all selected tickets',
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

      {/* What Forge Looks For */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Makes a Good PRD</h2>

        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Good PRDs Have:</h3>
            <ul className="space-y-2 list-disc list-inside text-xs text-green-700 dark:text-green-200">
              <li>Clear user stories (&quot;As a..., I want..., So that...&quot;)</li>
              <li>Acceptance criteria for each feature</li>
              <li>Wireframes or design mockups</li>
              <li>Success metrics or KPIs</li>
              <li>Technical requirements</li>
              <li>Constraints or limitations</li>
            </ul>
          </div>

          <div className="border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Avoid:</h3>
            <ul className="space-y-2 list-disc list-inside text-xs text-red-700 dark:text-red-200">
              <li>Single vague paragraph</li>
              <li>No clear separation of features</li>
              <li>Missing acceptance criteria</li>
              <li>Contradictory requirements</li>
              <li>No timeline or priorities</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Example PRD Breakdown</h2>

        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Input PRD:</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap mb-4">
{`"Build a user notification system. Users should receive in-app
notifications, email notifications, and SMS alerts. Notifications
should be customizable (user can choose what they want to receive).
Admin should be able to send broadcast notifications. Must work on
mobile and desktop. API-first architecture. Need notification center
with read/unread status. Should expire old notifications after 30 days."`}
          </p>

          <h3 className="font-semibold text-gray-900 dark:text-white mt-4 mb-3 text-sm">Generated Tickets:</h3>
          <div className="space-y-2">
            {[
              'Create Notification model and database schema',
              'Build notification center UI (web)',
              'Build notification center UI (mobile)',
              'Implement in-app notification system',
              'Integrate email notification provider',
              'Integrate SMS notification provider',
              'Create notification preferences UI',
              'Build admin broadcast notification page',
              'Implement notification expiration logic',
              'Add notification API endpoints',
            ].map((ticket, i) => (
              <div key={i} className="flex gap-2 text-xs text-gray-700 dark:text-gray-300">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>{ticket}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Tips for Best Results</h2>

        <div className="space-y-3 mt-4">
          {[
            {
              title: 'Use clear sections',
              description: 'Organize your PRD with headers: Features, Technical Requirements, Constraints, etc.',
            },
            {
              title: 'Include acceptance criteria',
              description: 'Forge breaks down better when criteria are explicit',
            },
            {
              title: 'Specify dependencies',
              description: 'If Feature B depends on Feature A, Forge will figure it out',
            },
            {
              title: 'Set priorities',
              description: 'Tell Forge which features are MVP and which are nice-to-have',
            },
            {
              title: 'Include wireframes or mockups',
              description: 'Forge can read attached images to understand UI requirements',
            },
            {
              title: 'Be specific',
              description: 'Say &quot;add Stripe payment&quot; instead of &quot;add payment&quot;',
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
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Ready to Break Down Your PRD?</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          Gather your requirements document and start breaking it down into implementation tickets.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tickets/create"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Start PRD Breakdown
          </Link>
          <Link
            href="/docs/workflows/bulk-enrichment"
            className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors"
          >
            Bulk Enrichment
          </Link>
        </div>
      </section>
    </article>
  );
}
