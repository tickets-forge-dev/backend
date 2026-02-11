/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Test Plans | Documentation',
  description: 'How Forge generates comprehensive test plans.',
};

export default function TestPlans() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Test Plan Generation</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Forge generates detailed test plans with unit, integration, and edge case tests.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Test Types</h2>
        <div className="space-y-3 mt-4">
          {[
            { type: 'Unit Tests', desc: 'Test individual functions/components in isolation' },
            { type: 'Integration Tests', desc: 'Test how modules work together' },
            { type: 'Edge Cases', desc: 'Test boundaries and error conditions' },
            { type: 'E2E Tests', desc: 'Test complete user workflows' },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.type}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Example Test Plan</h2>
        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`Unit Tests:
- validateEmail() returns true for valid emails
- validateEmail() returns false for invalid emails
- createUser() hashes password correctly

Integration Tests:
- User can create account and log in
- Login fails with wrong password
- Password reset sends email

Edge Cases:
- What if email already exists?
- What if password is too short?
- What if user tries to reset twice?`}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Test Coverage Goals</h2>
        <div className="space-y-3 mt-4">
          {[
            'Happy path (normal flow)',
            'Error paths (what goes wrong?)',
            'Edge cases (boundaries)',
            'Security (malicious input)',
            'Performance (scale)',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <Link href="/docs/features/quality-scoring" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Next: Quality Scoring
        </Link>
      </section>
    </article>
  );
}
