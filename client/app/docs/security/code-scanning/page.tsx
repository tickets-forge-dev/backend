/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Code Scanning | Documentation',
  description: 'How Forge securely scans your code without cloning or storing it.',
};

export default function CodeScanning() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">How We Scan Code</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Forge never clones, stores, or keeps copies of your code. We analyze in real-time and delete immediately.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Our Approach</h2>
        <div className="space-y-3 mt-4">
          {[
            'Real-time streaming from GitHub API',
            'In-memory analysis only',
            'Immediate deletion after generation',
            'No backups or caching',
            'No database storage of your code',
            'Single-use temporary access tokens',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-green-700 dark:text-green-200">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Process Overview</h2>
        <div className="space-y-4 mt-6">
          {[
            { step: '1', title: 'Request access', desc: 'You authorize Forge to read your repository' },
            { step: '2', title: 'Stream files', desc: 'We fetch selected files from GitHub API (never clone)' },
            { step: '3', title: 'Analyze', desc: 'LLM analyzes content in memory' },
            { step: '4', title: 'Delete', desc: 'All code is deleted immediately after analysis' },
            { step: '5', title: 'Return spec', desc: 'You get the generated ticket, nothing is stored' },
          ].map((item) => (
            <div key={item.step} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Security Guarantees</h2>
        <div className="space-y-3 mt-4">
          {[
            'No code is cloned to our servers',
            'No code is stored in our database',
            'No backups of your code',
            'No secondary access or replay',
            'API tokens are temporary and single-use',
            'You can revoke access anytime',
            'Compliance: GDPR, SOC 2 (coming soon)',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <Link href="/docs/security/data-storage" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Next: Data Storage
        </Link>
      </section>
    </article>
  );
}
