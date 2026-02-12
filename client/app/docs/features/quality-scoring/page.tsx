/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Quality Scoring | Documentation',
  description: 'Understand how Forge scores spec quality.',
};

export default function QualityScoring() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Quality Scoring</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Each spec gets a quality score (0-100) based on completeness and detail.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Score Breakdown</h2>
        <div className="space-y-3 mt-4">
          {[
            { comp: 'Problem Statement', pts: '0-20' },
            { comp: 'Solution', pts: '0-25' },
            { comp: 'Acceptance Criteria', pts: '0-15' },
            { comp: 'File Changes', pts: '0-10' },
            { comp: 'Ambiguity Resolution', pts: '0-10' },
            { comp: 'Test Plan', pts: '0-10' },
            { comp: 'API Changes', pts: '0-5' },
            { comp: 'Layer Categorization', pts: '0-5' },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{item.comp}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">{item.pts}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Score Ranges</h2>
        <div className="space-y-3 mt-4">
          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">80-100: Excellent</p>
            <p className="text-xs text-green-700 dark:text-green-200">Very detailed, ready to implement. All context provided.</p>
          </div>

          <div className="border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">60-79: Good</p>
            <p className="text-xs text-blue-700 dark:text-blue-200">Good detail, mostly implementable. Minor gaps.</p>
          </div>

          <div className="border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-2">40-59: Fair</p>
            <p className="text-xs text-amber-700 dark:text-amber-200">Some gaps. Answer more questions for better score.</p>
          </div>

          <div className="border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <p className="font-semibold text-red-900 dark:text-red-100 text-sm mb-2">0-39: Incomplete</p>
            <p className="text-xs text-red-700 dark:text-red-200">Needs more work. Add more detail.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How to Improve Your Score</h2>
        <div className="space-y-3 mt-4">
          {[
            'Answer all clarification questions (don&apos;t skip)',
            'Provide detailed problem statement',
            'Include complete acceptance criteria',
            'List all affected files with explanations',
            'Design API endpoints if applicable',
            'Create comprehensive test plan',
            'Edit the spec after generation',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <Link href="/docs/features/tech-stack" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Next: Tech Stack Detection
        </Link>
      </section>
    </article>
  );
}
