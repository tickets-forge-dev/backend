import Link from 'next/link';

export const metadata = {
  title: 'Security Best Practices | Documentation',
  description: 'Best practices for secure Forge usage.',
};

export default function BestPractices() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Security Best Practices</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Follow these recommendations to keep your account and data secure.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Account Security</h2>
        <div className="space-y-3 mt-4">
          {[
            'Use a strong, unique password',
            'Enable two-factor authentication (2FA)',
            'Don&apos;t share your login credentials',
            'Log out from shared computers',
            'Review active sessions regularly',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">API Token Security</h2>
        <div className="space-y-3 mt-4">
          {[
            'Revoke tokens you no longer use',
            'Never commit tokens to git',
            'Don&apos;t share tokens via email or chat',
            'Use minimal permission scopes',
            'Rotate tokens regularly (quarterly)',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Workspace Management</h2>
        <div className="space-y-3 mt-4">
          {[
            'Limit team member access to what they need',
            'Remove members who leave the team',
            'Audit team member permissions regularly',
            'Use strong workspace invitations (expire after 7 days)',
            'Keep workspace members list up-to-date',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">GitHub Integration Security</h2>
        <div className="space-y-3 mt-4">
          {[
            'Review GitHub permissions before authorizing',
            'Only grant access to necessary repositories',
            'Revoke access if Forge is no longer needed',
            'Check GitHub Apps for inactive permissions',
            'Never share GitHub tokens with Forge',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Data Protection</h2>
        <div className="space-y-3 mt-4">
          {[
            'Use HTTPS (always)',
            'Export important specs regularly',
            'Keep version history of important tickets',
            'Audit who has access to sensitive tickets',
            'Don&apos;t include secrets in ticket descriptions',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">Reporting Security Issues</h2>
        <p className="text-green-900 dark:text-green-200 mb-3">
          Found a security vulnerability? Please report it to security@forge.dev instead of public channels.
        </p>
        <p className="text-sm text-green-900 dark:text-green-200">
          We&apos;ll respond within 48 hours and work with you to resolve the issue.
        </p>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6 mt-8">
        <Link href="/docs/faq/general" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Next: FAQ
        </Link>
      </section>
    </article>
  );
}
