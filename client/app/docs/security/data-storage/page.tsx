import Link from 'next/link';

export const metadata = {
  title: 'Data Storage | Documentation',
  description: 'How Forge stores your project data securely.',
};

export default function DataStorage() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Data Storage</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">We store only your tickets and project data, never your source code.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What We Store</h2>
        <div className="space-y-3 mt-4">
          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">We Store:</h3>
            <ul className="space-y-1 list-disc list-inside text-sm text-green-700 dark:text-green-200">
              <li>Your generated tickets and specifications</li>
              <li>Project metadata</li>
              <li>User accounts and authentication</li>
              <li>Integration tokens (encrypted)</li>
              <li>Workspace and team information</li>
            </ul>
          </div>

          <div className="border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">We Never Store:</h3>
            <ul className="space-y-1 list-disc list-inside text-sm text-red-700 dark:text-red-200">
              <li>Your source code</li>
              <li>API keys or secrets</li>
              <li>Private repository contents</li>
              <li>Analytics of your code</li>
              <li>Credentials (except encrypted tokens)</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Data Security</h2>
        <div className="space-y-3 mt-4">
          {[
            'Encrypted in transit (TLS 1.3)',
            'Encrypted at rest (AES-256)',
            'Isolated per workspace',
            'Regular backups',
            'Audit logs for all access',
            'No third-party access (except integrations you authorize)',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Data Retention</h2>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Your data is retained as long as your account is active:
          </p>
          <ul className="space-y-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
            <li><strong>Active accounts:</strong> Indefinite retention</li>
            <li><strong>Deleted accounts:</strong> 30-day grace period, then deletion</li>
            <li><strong>Canceled workspaces:</strong> 90-day retention, then deletion</li>
            <li><strong>Export:</strong> You can export all data anytime</li>
          </ul>
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <Link href="/docs/security/privacy" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Next: Privacy & GDPR
        </Link>
      </section>
    </article>
  );
}
