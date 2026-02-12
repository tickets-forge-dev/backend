/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Reproduction Steps | Documentation',
  description: 'Understand how Forge handles reproduction steps for bug tickets.',
};

export default function ReproductionSteps() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Reproduction Steps
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Clear reproduction steps are essential for bug tickets. Forge helps you generate them automatically.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Why Reproduction Steps Matter</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Good reproduction steps help engineers:
        </p>

        <div className="space-y-2 mt-4 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
          <div className="flex gap-3"><span className="text-blue-600 dark:text-blue-400">✓</span> <span>Quickly understand the bug</span></div>
          <div className="flex gap-3"><span className="text-blue-600 dark:text-blue-400">✓</span> <span>Reproduce it locally</span></div>
          <div className="flex gap-3"><span className="text-blue-600 dark:text-blue-400">✓</span> <span>Verify the fix</span></div>
          <div className="flex gap-3"><span className="text-blue-600 dark:text-blue-400">✓</span> <span>Prevent regression</span></div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Forge Generates</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          For bug tickets, Forge automatically generates:
        </p>

        <div className="space-y-3 mt-4">
          {[
            'Numbered step-by-step instructions',
            'Expected vs actual behavior',
            'Environment details (browser, OS, version)',
            'Preconditions (logged in? specific user role?)',
            'Screenshots or error messages needed',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How to Provide Good Information</h2>

        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Good Bug Reports</h3>
            <ul className="space-y-1 list-disc list-inside text-xs text-green-700 dark:text-green-200">
              <li>"File upload fails with 413 error"</li>
              <li>"Dashboard is blank for admin users"</li>
              <li>"Search returns wrong results"</li>
              <li>Include screenshot</li>
            </ul>
          </div>

          <div className="border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Vague Bug Reports</h3>
            <ul className="space-y-1 list-disc list-inside text-xs text-red-700 dark:text-red-200">
              <li>"Stuff doesn't work"</li>
              <li>"It's broken"</li>
              <li>"Fix the UI"</li>
              <li>No context or screenshots</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Best Practices</h2>

        <div className="space-y-3 mt-4">
          {[
            'Be specific about the action: &quot;Click the Export button in the top right&quot;',
            'Include exact error messages or behavior observed',
            'Mention when the bug started (always? specific conditions?)',
            'Provide screenshots if it&apos;s a UI issue',
            'Test the reproduction steps yourself first',
            'Include browser/OS info for frontend bugs',
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Next Steps</h2>
        <Link
          href="/docs/features/acceptance-criteria"
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          Learn About Acceptance Criteria
        </Link>
      </section>
    </article>
  );
}
