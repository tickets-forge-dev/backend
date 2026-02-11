/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Tech Stack Detection | Documentation',
  description: 'How Forge detects and documents your technology stack.',
};

export default function TechStack() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Tech Stack Detection</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Forge automatically detects your tech stack and includes it in every ticket.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Gets Detected</h2>
        <div className="space-y-3 mt-4">
          {[
            'Languages (JavaScript, Python, Go, Rust, etc.)',
            'Frameworks (React, Django, Express, FastAPI, etc.)',
            'Databases (PostgreSQL, MongoDB, MySQL, Redis, etc.)',
            'Package managers (npm, pip, cargo, go mod, etc.)',
            'Build tools (Webpack, Vite, Docker, etc.)',
            'Testing frameworks (Jest, Pytest, etc.)',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Why It Matters</h2>
        <div className="space-y-3 mt-4">
          {[
            'Engineers know what tools they&apos;ll be using',
            'Forge can ask tech-specific questions',
            'Specs include framework-appropriate solutions',
            'Code patterns match your actual stack',
            'Test plans use your testing framework',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-600 dark:text-green-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Example Detection</h2>
        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <p className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Detected Stack:</p>
          <div className="space-y-2">
            {[
              { cat: 'Frontend', val: 'React 18 + Next.js 14' },
              { cat: 'Backend', val: 'Node.js + Express' },
              { cat: 'Database', val: 'PostgreSQL 15' },
              { cat: 'Cache', val: 'Redis' },
              { cat: 'Testing', val: 'Jest + React Testing Library' },
              { cat: 'Build', val: 'Webpack + Turbo' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                <span className="font-medium">{item.cat}:</span>
                <span>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Benefits for Specs</h2>
        <div className="border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-sm">Because we know your stack:</h3>
          <ul className="space-y-2 list-disc list-inside text-sm text-blue-900 dark:text-blue-200">
            <li>API suggestions follow REST + Express conventions</li>
            <li>React component structure matches your patterns</li>
            <li>Tests use Jest and React Testing Library</li>
            <li>File changes show correct imports and module paths</li>
            <li>Database changes use correct SQL syntax for PostgreSQL</li>
          </ul>
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Next Steps</h2>
        <Link href="/docs/security/code-scanning" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Learn About Code Scanning
        </Link>
      </section>
    </article>
  );
}
