/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Limitations & Roadmap | Documentation',
  description: 'Current limitations and upcoming features.',
};

export default function Roadmap() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Limitations & Roadmap</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Understand current limitations and see what's coming next.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Current Limitations</h2>
        <div className="space-y-3 mt-4">
          {[
            'Single repository per ticket (multi-repo coming soon)',
            'Public repos only for free tier (private on paid plans)',
            'Max 100 files analyzed per ticket',
            'Max 100 issues per bulk enrichment batch',
            'API rate limiting on free tier',
            'No offline mode',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-amber-600 dark:text-amber-400">⚠</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Coming Soon (Q1 2026)</h2>
        <div className="space-y-3 mt-4">
          {[
            'Multi-repository support (analyze 2-5 repos per ticket)',
            'GitLab integration (in addition to GitHub)',
            'Bitbucket integration',
            'Custom prompt templates',
            'Advanced analytics dashboard',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Under Consideration</h2>
        <div className="space-y-3 mt-4">
          {[
            'Mobile app (iOS and Android)',
            'Slack integration (create tickets from Slack)',
            'Microsoft Teams integration',
            'Self-hosted version',
            'Custom models (BYOM)',
            'Webhook support',
            'API for programmatic ticket creation',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How to Request Features</h2>
        <div className="space-y-3 mt-4">
          {[
            {
              method: 'In-app feedback',
              desc: 'Click the feedback button in Forge (bottom right)',
            },
            {
              method: 'Email',
              desc: 'Send feature requests to product@forge.dev',
            },
            {
              method: 'Public roadmap',
              desc: 'Vote on features in our public roadmap (coming soon)',
            },
            {
              method: 'Slack community',
              desc: 'Discuss features with other Forge users',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.method}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Want to Contribute?</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-3">
          Forge is built by the community. If you have ideas or want to contribute, we&apos;d love to hear from you.
        </p>
        <p className="text-sm text-blue-900 dark:text-blue-200">
          Email: community@forge.dev
        </p>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6 mt-8">
        <Link href="/docs/getting-started/what-is-forge" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Back to Docs
        </Link>
      </section>
    </article>
  );
}
