import Link from 'next/link';

export const metadata = {
  title: 'Phase 4: Specification Generation | Documentation',
  description: 'Learn how Forge generates the final specification in Phase 4.',
};

export default function Phase4Spec() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Phase 4: Specification Generation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Forge generates a comprehensive, implementation-ready specification based on all gathered context.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Happens in Phase 4</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Phase 4 takes 2-3 seconds to generate:
        </p>

        <div className="space-y-3 mt-4">
          {[
            'Problem statement with full context',
            'Solution with implementation approach',
            'BDD-style acceptance criteria',
            'API changes and endpoints',
            'File changes by layer (backend/frontend/shared)',
            'Test plan (unit, integration, edge cases)',
            'Technology stack',
            'Quality score (0-100)',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How Specification Generation Works</h2>

        <div className="space-y-4 mt-6">
          {[
            {
              step: '1',
              title: 'Compile context',
              details: 'Combine Phase 1 fingerprint + Phase 2 analysis + Phase 3 answers',
            },
            {
              step: '2',
              title: 'Generate sections',
              details: 'Create problem statement, solution, and requirements',
            },
            {
              step: '3',
              title: 'Plan implementation',
              details: 'Determine which files need changes and why',
            },
            {
              step: '4',
              title: 'Design APIs',
              details: 'Define new endpoints, request/response formats',
            },
            {
              step: '5',
              title: 'Create test plan',
              details: 'Generate unit tests, integration tests, edge cases',
            },
            {
              step: '6',
              title: 'Score quality',
              details: 'Rate spec completeness (0-100)',
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

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Gets Generated</h2>

        <div className="grid gap-4 mt-4 md:grid-cols-2">
          {[
            { section: 'Problem', detail: '0-20 points in quality score' },
            { section: 'Solution', detail: '0-25 points in quality score' },
            { section: 'Acceptance Criteria', detail: '0-15 points in quality score' },
            { section: 'File Changes', detail: '0-10 points in quality score' },
            { section: 'API Changes', detail: '0-5 points in quality score' },
            { section: 'Test Plan', detail: '0-10 points in quality score' },
            { section: 'Layer Categorization', detail: '0-5 points in quality score' },
            { section: 'Ambiguity Resolution', detail: '0-10 points in quality score' },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.section}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Quality Scoring</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Quality scores help you understand spec completeness:
        </p>

        <div className="space-y-3 mt-4">
          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">80-100: Excellent</p>
            <p className="text-xs text-green-700 dark:text-green-200">Very detailed spec, ready to implement. Engineers have all context needed.</p>
          </div>

          <div className="border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">60-79: Good</p>
            <p className="text-xs text-blue-700 dark:text-blue-200">Good detail level. May need some clarification but buildable.</p>
          </div>

          <div className="border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">40-59: Fair</p>
            <p className="text-xs text-amber-700 dark:text-amber-200">Some detail, but may have gaps. Answer more questions for better spec.</p>
          </div>

          <div className="border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <p className="font-semibold text-red-900 dark:text-red-100 text-sm mb-2">0-39: Needs Work</p>
            <p className="text-xs text-red-700 dark:text-red-200">Incomplete spec. Answer questions or edit to add more detail.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Improving Your Score</h2>

        <div className="space-y-3 mt-4">
          {[
            'Answer all clarification questions (don&apos;t skip)',
            'Provide more context in your initial description',
            'Edit the generated spec to add more detail',
            'Add more acceptance criteria',
            'Include test plans and edge cases',
            'Specify API endpoints and data models',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Next: Phase 5</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          Review your spec and finalize it for sharing with your team.
        </p>
        <Link
          href="/docs/phases/phase-5-finalize"
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          Phase 5: Finalization
        </Link>
      </section>
    </article>
  );
}
