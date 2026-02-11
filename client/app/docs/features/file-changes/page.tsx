/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'File Changes by Layer | Documentation',
  description: 'How Forge organizes file changes by architectural layer.',
};

export default function FileChanges() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">File Changes by Layer</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Forge organizes code changes into logical layers to show the full impact of a feature.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">The Five Layers</h2>
        <div className="space-y-3 mt-4">
          {[
            { layer: 'Backend', desc: 'API routes, business logic, database migrations' },
            { layer: 'Frontend', desc: 'React components, pages, hooks, state management' },
            { layer: 'Shared', desc: 'Types, constants, utilities, shared components' },
            { layer: 'Infrastructure', desc: 'Docker, CI/CD, deployment, environment configs' },
            { layer: 'Documentation', desc: 'README, API docs, architecture guides' },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.layer}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Example: Adding User Authentication</h2>
        <div className="space-y-3 mt-4">
          <div className="border-l-4 border-blue-600 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-r">
            <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">Backend Changes</p>
            <ul className="space-y-1 list-disc list-inside text-xs text-blue-700 dark:text-blue-200">
              <li>src/routes/auth.ts - OAuth routes</li>
              <li>src/models/user.ts - User schema</li>
              <li>migrations/001_add_auth.sql - Database</li>
            </ul>
          </div>

          <div className="border-l-4 border-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-r">
            <p className="font-semibold text-green-900 dark:text-green-100 text-sm mb-2">Frontend Changes</p>
            <ul className="space-y-1 list-disc list-inside text-xs text-green-700 dark:text-green-200">
              <li>app/login/page.tsx - Login page</li>
              <li>components/auth-provider.tsx - OAuth provider</li>
              <li>hooks/use-auth.ts - Auth hook</li>
            </ul>
          </div>

          <div className="border-l-4 border-purple-600 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-r">
            <p className="font-semibold text-purple-900 dark:text-purple-100 text-sm mb-2">Shared Changes</p>
            <ul className="space-y-1 list-disc list-inside text-xs text-purple-700 dark:text-purple-200">
              <li>types/auth.ts - Auth types</li>
              <li>lib/github-oauth.ts - OAuth utility</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Why This Matters</h2>
        <div className="space-y-3 mt-4">
          {[
            'Engineers see the full scope of changes upfront',
            'Helps estimate effort more accurately',
            'Identifies dependencies between layers',
            'Makes review and testing easier',
            'Prevents missed files or changes',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <Link href="/docs/features/test-plans" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Next: Test Plans
        </Link>
      </section>
    </article>
  );
}
