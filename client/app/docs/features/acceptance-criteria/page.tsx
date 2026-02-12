/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Acceptance Criteria | Documentation',
  description: 'Learn how Forge generates BDD acceptance criteria.',
};

export default function AcceptanceCriteria() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Acceptance Criteria
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Forge uses BDD (Behavior-Driven Development) format to generate clear, testable requirements.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">BDD Format: Given/When/Then</h2>

        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`Given [initial state]
When [user action]
Then [expected result]

Example:
Given the user is logged in
When they click "Export"
Then a CSV file is downloaded`}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Why BDD Matters</h2>

        <div className="space-y-3 mt-4">
          {[
            'Clear and testable requirements',
            'Non-technical stakeholders can understand them',
            'QA can write tests directly from them',
            'Reduces ambiguity and miscommunication',
            'Easy to automate with tools like Cypress or Playwright',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Examples</h2>

        <div className="space-y-3 mt-4">
          {[
            {
              feature: 'Payment feature',
              criteria: `Given user has items in cart\nWhen they click "Pay Now"\nThen Stripe payment modal opens`,
            },
            {
              feature: 'Search functionality',
              criteria: `Given the user enters "python"\nWhen they press Enter\nThen results are filtered to Python docs`,
            },
            {
              feature: 'Error handling',
              criteria: `Given the API is down\nWhen user tries to save\nThen an error message appears`,
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{item.feature}</p>
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.criteria}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How to Write Better AC</h2>

        <div className="space-y-3 mt-4">
          {[
            'Use simple, clear language',
            'One scenario per criteria (unless related)',
            'Include edge cases (what if user X?)',
            'Avoid technical jargon',
            'Be specific (dates, numbers, names)',
            'Make it testable and verifiable',
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Editing Acceptance Criteria</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          You can edit criteria in Forge:
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <ol className="space-y-2 list-decimal list-inside text-sm text-blue-900 dark:text-blue-200">
            <li>Click the "Acceptance Criteria" section</li>
            <li>Click edit to modify existing criteria</li>
            <li>Click "Add" to add new criteria</li>
            <li>Use Given/When/Then format</li>
            <li>Changes auto-save</li>
          </ol>
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Next Steps</h2>
        <Link
          href="/docs/features/api-changes"
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          Learn About API Changes
        </Link>
      </section>
    </article>
  );
}
