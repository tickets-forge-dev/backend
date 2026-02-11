import Link from 'next/link';

export const metadata = {
  title: 'Common Patterns | Documentation',
  description: 'Common patterns and workflows in Forge.',
};

export default function Patterns() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Common Patterns</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Learn proven patterns for using Forge effectively.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Pattern: Feature Implementation</h2>
        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`1. Designer/PM: Create ticket with feature description
2. Forge: Analyze codebase for patterns
3. Forge: Ask clarifying questions
4. Team: Answer questions
5. Forge: Generate spec with file changes + tests
6. Engineer: Implement using spec as guide`}
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Best for: New features, user stories, design implementations
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Pattern: Bug Fixing</h2>
        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`1. QA: Report bug with reproduction steps + screenshot
2. Forge: Generate reproduction steps + analysis
3. Forge: Identify affected code
4. Forge: Generate fix spec with test plan
5. Engineer: Use spec to fix bug`}
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Best for: Bug reports, hotfixes, edge case fixes
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Pattern: Bulk Sprint Planning</h2>
        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`1. PM: Gather sprint requirements
2. Use Bulk Enrichment for all issues
3. Review generated specs together
4. Team: Estimate effort based on specs
5. Sprint: Build using specs as reference`}
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Best for: Sprint planning, backlog refinement, batch processing
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Pattern: PRD Breakdown</h2>
        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`1. PM: Write detailed PRD document
2. Paste into PRD Breakdown
3. Forge: Generate ticket list
4. Team: Review and adjust
5. Create all tickets at once`}
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Best for: Major product releases, phase planning
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Best Practices</h2>
        <div className="space-y-3 mt-4">
          {[
            'Be specific in your initial description',
            'Answer all clarification questions for better specs',
            'Review quality scores (aim for 80+)',
            'Edit specs before sharing with team',
            'Use version history to track changes',
            'Export specs as documentation',
            'Collaborate with comments on specs',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <Link href="/docs/faq/roadmap" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Next: Limitations & Roadmap
        </Link>
      </section>
    </article>
  );
}
