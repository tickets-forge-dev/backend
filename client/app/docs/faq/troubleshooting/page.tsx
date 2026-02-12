/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Troubleshooting | Documentation',
  description: 'Troubleshoot common Forge issues.',
};

export default function Troubleshooting() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Troubleshooting Guide</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Solve common problems and get your Forge workflow running smoothly.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">GitHub Connection Issues</h2>
        <div className="space-y-4 mt-4">
          {[
            {
              problem: 'GitHub connection fails',
              solution: 'Check your GitHub app permissions in Settings. You may need to re-authorize.',
            },
            {
              problem: 'Repository not appearing',
              solution: 'The repo may not be in your GitHub authorization scope. Update permissions and try again.',
            },
            {
              problem: 'Permission denied error',
              solution: 'You need push access to the repo. Check your GitHub permissions.',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{item.problem}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.solution}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Analysis Issues</h2>
        <div className="space-y-4 mt-4">
          {[
            {
              problem: 'Analysis timeout (takes too long)',
              solution: 'Large repos take longer. Try analyzing a smaller branch or wait for completion. Progress is saved automatically.',
            },
            {
              problem: 'Low quality score',
              solution: 'Answer more clarification questions or provide more detail in your description.',
            },
            {
              problem: 'Incorrect file suggestions',
              solution: 'Edit the file changes section directly. The AI makes its best guess but you know your codebase best.',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{item.problem}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.solution}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Account & Access</h2>
        <div className="space-y-4 mt-4">
          {[
            {
              problem: 'Can&apos;t log in',
              solution: 'Check your email for login link. If using password, make sure caps lock is off. Try password reset.',
            },
            {
              problem: 'Can&apos;t see team tickets',
              solution: 'Check you have access to the workspace. Ask your workspace admin to grant access.',
            },
            {
              problem: 'Workspace not showing up',
              solution: 'You may not have access. The workspace owner needs to invite you.',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{item.problem}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.solution}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <p className="text-blue-900 dark:text-blue-200 mb-3">
          Still stuck? Contact us at support@forge.dev and we&apos;ll help within 24 hours.
        </p>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <Link href="/docs/faq/patterns" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Common Patterns
        </Link>
      </section>
    </article>
  );
}
