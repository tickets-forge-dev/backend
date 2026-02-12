/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Privacy & GDPR | Documentation',
  description: 'Privacy information and GDPR compliance.',
};

export default function Privacy() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Privacy & GDPR</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">We respect your privacy and comply with GDPR and other regulations.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Privacy Rights</h2>
        <div className="space-y-3 mt-4">
          {[
            'Right to access: See all your data anytime',
            'Right to delete: Delete your account and data',
            'Right to export: Export all your tickets and data',
            'Right to be forgotten: We delete your data on request',
            'No selling of data: We never sell or share your data',
            'No tracking: No user tracking or analytics',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">GDPR Compliance</h2>
        <div className="space-y-3 mt-4">
          {[
            { item: 'Data Processing Agreement', val: 'Available on request' },
            { item: 'Data Protection Officer', val: 'Available for inquiries' },
            { item: 'GDPR Clauses', val: 'Standard contractual clauses in place' },
            { item: 'Data Transfers', val: 'Compliant with GDPR Article 44-49' },
          ].map((x, i) => (
            <div key={i} className="flex justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg">
              <span className="font-semibold text-gray-900 dark:text-white text-sm">{x.item}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{x.val}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How to Exercise Your Rights</h2>
        <div className="space-y-3 mt-4">
          {[
            {
              action: 'Access Your Data',
              steps: 'Go to Settings → Data Export and download your tickets in JSON/CSV format',
            },
            {
              action: 'Delete Your Account',
              steps: 'Go to Settings → Account → Delete Account (permanent after 30 days)',
            },
            {
              action: 'Request Deletion',
              steps: 'Email privacy@forge.dev with your account email',
            },
            {
              action: 'Privacy Questions',
              steps: 'Contact privacy@forge.dev with any questions',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.action}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.steps}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <Link href="/docs/security/best-practices" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Next: Security Best Practices
        </Link>
      </section>
    </article>
  );
}
