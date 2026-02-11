import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';

export const metadata = {
  title: 'Forge vs Claude | Documentation',
  description: 'Compare Forge to Claude Workspace and understand when to use each tool.',
};

export default function ForgeVsClaude() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Forge vs Claude
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Understand the differences between Forge and Claude Workspace to choose the right tool for your team.
        </p>
      </div>

      {/* Quick Comparison */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Quick Comparison</h2>

        <div className="overflow-x-auto mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 font-semibold">Feature</th>
                <th className="text-center px-4 py-3 font-semibold">Forge</th>
                <th className="text-center px-4 py-3 font-semibold">Claude Workspace</th>
                <th className="text-center px-4 py-3 font-semibold">Plain Claude</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {[
                { feature: 'Code Context Scanning', forge: true, workspace: false, plain: false },
                { feature: 'Structured Ticket Output', forge: true, workspace: false, plain: false },
                { feature: 'Quality Scoring', forge: true, workspace: false, plain: false },
                { feature: 'Acceptance Criteria', forge: true, workspace: false, plain: false },
                { feature: 'API Changes Detection', forge: true, workspace: false, plain: false },
                { feature: 'File Changes by Layer', forge: true, workspace: false, plain: false },
                { feature: 'Test Plan Generation', forge: true, workspace: false, plain: false },
                { feature: 'Team Workspaces', forge: true, workspace: true, plain: false },
                { feature: 'Ticket History & Versions', forge: true, workspace: false, plain: false },
                { feature: 'Import from Jira/Linear', forge: true, workspace: false, plain: false },
                { feature: 'Bulk Enrichment', forge: true, workspace: false, plain: false },
                { feature: 'PRD Breakdown', forge: true, workspace: false, plain: false },
                { feature: 'Real-time Chat', forge: false, workspace: true, plain: true },
                { feature: 'Document Collaboration', forge: false, workspace: true, plain: false },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{row.feature}</td>
                  <td className="text-center px-4 py-3">
                    {row.forge ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-600 mx-auto" />
                    )}
                  </td>
                  <td className="text-center px-4 py-3">
                    {row.workspace ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-600 mx-auto" />
                    )}
                  </td>
                  <td className="text-center px-4 py-3">
                    {row.plain ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* When to Use Forge */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">When to Use Forge</h2>

        <div className="space-y-4 mt-4">
          {[
            {
              title: 'Creating structured engineering tickets',
              description: 'You need implementation-ready specs with file changes, API endpoints, test plans, and acceptance criteria.',
            },
            {
              title: 'Importing existing issues for enrichment',
              description: 'You want to import tickets from Jira or Linear and enhance them with code context and comprehensive specs.',
            },
            {
              title: 'Breaking down PRDs into implementation',
              description: 'You have a product requirements document and need to convert it into specific implementation tickets.',
            },
            {
              title: 'Bulk enriching multiple tickets',
              description: 'You need to generate specs for dozens of tickets at once with consistent quality and structure.',
            },
            {
              title: 'Team collaboration on tickets',
              description: 'Your team needs to collaborate on ticket specs with version history, comments, and structured workflows.',
            },
            {
              title: 'Code-aware ticket generation',
              description: 'You want AI that actually understands your codebase structure and generates context-aware specifications.',
            },
          ].map((item, i) => (
            <div key={i} className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-100">{item.title}</h3>
              <p className="text-sm text-green-700 dark:text-green-200 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* When to Use Claude Workspace */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">When to Use Claude Workspace</h2>

        <div className="space-y-4 mt-4">
          {[
            {
              title: 'General AI research and analysis',
              description: 'You need a conversational AI to research topics, brainstorm ideas, or analyze documents.',
            },
            {
              title: 'Real-time collaborative discussions',
              description: 'Your team wants to chat with AI in real-time to debug issues, discuss architecture, or design features.',
            },
            {
              title: 'Document collaboration',
              description: 'You need to write and edit documents (design docs, RFCs, etc.) collaboratively with AI assistance.',
            },
            {
              title: 'Ad-hoc AI conversations',
              description: 'You want to ask Claude questions without structured output requirements.',
            },
          ].map((item, i) => (
            <div key={i} className="border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">{item.title}</h3>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Differences */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Key Differences</h2>

        <div className="space-y-6 mt-4">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Purpose</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Forge</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Specialized tool for generating implementation-ready tickets with code context</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Claude Workspace</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">General-purpose AI workspace for collaboration and document work</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Code Integration</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Forge</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Automatically scans and analyzes your entire codebase via GitHub integration</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Claude Workspace</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">You manually paste code snippets or upload files</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Output Format</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Forge</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Structured, machine-readable specs with quality scores and version history</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Claude Workspace</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Free-form text and documents without structured templates</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Workflow</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Forge</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Guided wizard: Context → Analysis → Questions → Spec → Finalize</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Claude Workspace</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Open-ended conversation with real-time chat</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Case Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Use Case Examples</h2>

        <div className="space-y-4 mt-4">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Scenario: Product manager has a feature idea</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              <strong>Use Forge:</strong> Upload your design mockup and description → Forge scans the codebase → Generates implementation spec with file changes, API endpoints, and tests
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Use Claude:</strong> Paste code snippets and ask Claude to brainstorm architecture
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Scenario: Team discovers a bug in production</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              <strong>Use Forge:</strong> Create a bug ticket with steps to reproduce → Forge generates comprehensive reproduction steps and affected code analysis
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Use Claude:</strong> Chat with Claude to debug the issue and understand root cause</p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Scenario: Engineering team planning a refactor</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              <strong>Use Forge:</strong> Describe the refactoring goal → Forge analyzes code → Generates detailed spec with file-by-file changes and test plan
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Use Claude:</strong> Write a design doc collaboratively and discuss implementation strategy in real-time
            </p>
          </div>
        </div>
      </section>

      {/* Should I Use Both? */}
      <section className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-3">Should I Use Both?</h2>
        <p className="text-amber-900 dark:text-amber-200 mb-4">
          Yes! Many teams use both tools together:
        </p>
        <ul className="space-y-2 list-disc list-inside text-amber-900 dark:text-amber-200">
          <li>Use Claude Workspace to brainstorm and design features</li>
          <li>Use Forge to convert the design into implementation tickets</li>
          <li>Use Claude Workspace for real-time debugging during development</li>
          <li>Use Forge to refine and finalize tickets based on development feedback</li>
        </ul>
      </section>

      {/* Next Steps */}
      <section className="space-y-4 mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Ready to Get Started?</h2>
        <div className="grid gap-3 md:grid-cols-2 mt-4">
          <Link
            href="/docs/getting-started/setup"
            className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Setup Guide →</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get Forge running in 2 minutes</p>
          </Link>
          <Link
            href="/docs/getting-started/first-ticket"
            className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Create Your First Ticket →</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">See Forge in action</p>
          </Link>
        </div>
      </section>
    </article>
  );
}
