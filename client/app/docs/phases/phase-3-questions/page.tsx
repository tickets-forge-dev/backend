/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Phase 3: Clarification Questions | Documentation',
  description: 'Learn how Forge asks clarifying questions in Phase 3.',
};

export default function Phase3Questions() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Phase 3: Clarification Questions
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Forge asks smart questions to understand your intent before generating the final spec.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Happens in Phase 3</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Phase 3 time is variable (depends on how many questions and how fast you answer). Forge asks:
        </p>

        <div className="space-y-3 mt-4">
          {[
            'Architecture and design decisions',
            'Feature scope and requirements',
            'Edge cases and error handling',
            'Performance and scalability needs',
            'Testing requirements',
            'Timeline and priority',
            'Team size and expertise',
            'Integration with existing systems',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How Questions Work</h2>

        <div className="space-y-4 mt-6">
          {[
            {
              step: '1',
              title: 'Generate questions',
              details: 'Based on Phase 1 & 2 context, Forge generates up to 5 relevant questions',
            },
            {
              step: '2',
              title: 'Show one question at a time',
              details: 'Modal-style UI, one question per screen for focus',
            },
            {
              step: '3',
              title: 'You answer',
              details: 'Provide context to guide the spec generation',
            },
            {
              step: '4',
              title: 'Skip if needed',
              details: 'Don&apos;t know the answer? Click skip and Forge will make a reasonable assumption',
            },
            {
              step: '5',
              title: 'Review all',
              details: 'See all questions and answers before final spec generation',
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
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Example Questions</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Questions vary based on your ticket type and codebase:
        </p>

        <div className="space-y-3 mt-4">
          {[
            {
              ticket: 'Adding authentication',
              questions: [
                'Should users log in with email/password or OAuth?',
                'Do we need password reset and email verification?',
                'What data should be stored in the user profile?',
              ],
            },
            {
              ticket: 'Fixing a bug',
              questions: [
                'Where does the bug occur? (frontend/backend/both)',
                'What&apos;s the expected behavior?',
                'Do we need database changes to fix this?',
              ],
            },
            {
              ticket: 'Refactoring code',
              questions: [
                'Which files are involved?',
                'Are there backward compatibility concerns?',
                'Should we write new tests or update existing ones?',
              ],
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{item.ticket}</p>
              <ul className="space-y-1 list-disc list-inside text-xs text-gray-700 dark:text-gray-300">
                {item.questions.map((q, j) => (
                  <li key={j}>{q}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Tips for Answering Questions</h2>

        <div className="space-y-3 mt-4">
          {[
            {
              title: 'Be specific',
              description: 'Say &quot;OAuth2 with GitHub&quot; instead of just &quot;OAuth&quot;',
            },
            {
              title: 'Provide context',
              description: 'Explain the why, not just the what',
            },
            {
              title: 'It&apos;s OK to skip',
              description: 'Don&apos;t know the answer? Click skip and Forge will make a reasonable default',
            },
            {
              title: 'More answers = better specs',
              description: 'The more you answer, the more detailed and accurate the spec will be',
            },
            {
              title: 'You can edit later',
              description: 'Don&apos;t like the generated spec? Edit it after Phase 4',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">No Questions?</h2>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            Sometimes Forge has enough context from Phases 1-2 and doesn&apos;t need to ask questions. In that case, you&apos;ll skip directly to Phase 4 (Specification Generation).
          </p>
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Next: Phase 4</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          With all context gathered, Forge generates your complete specification.
        </p>
        <Link
          href="/docs/phases/phase-4-spec"
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          Phase 4: Specification Generation
        </Link>
      </section>
    </article>
  );
}
