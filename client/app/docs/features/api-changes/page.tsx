import Link from 'next/link';

export const metadata = {
  title: 'API Changes | Documentation',
  description: 'How Forge detects and documents API changes.',
};

export default function APIChanges() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">API Changes Detection</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Forge automatically detects and documents new or modified API endpoints.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Gets Documented</h2>
        <div className="space-y-3 mt-4">
          {[
            'HTTP method (GET, POST, PATCH, DELETE)',
            'Route path (/api/users/:id)',
            'Request body schema',
            'Response format',
            'Error codes and handling',
            'Authentication requirements',
            'Rate limiting',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Example Endpoint Documentation</h2>
        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
{`POST /api/users
Authorization: Bearer {token}

Request:
{ "email": "user@example.com", "name": "John" }

Response: 201
{ "id": "user123", "email": "user@example.com", "createdAt": "2024-01-01" }

Error: 400
{ "error": "email_exists", "message": "User already exists" }`}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Best Practices</h2>
        <div className="space-y-3 mt-4">
          {[
            'Use clear, RESTful endpoint names',
            'Document all possible response codes',
            'Include example payloads',
            'Specify required vs optional fields',
            'Document rate limiting',
            'Show auth requirements',
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <Link href="/docs/features/file-changes" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Next: File Changes by Layer
        </Link>
      </section>
    </article>
  );
}
