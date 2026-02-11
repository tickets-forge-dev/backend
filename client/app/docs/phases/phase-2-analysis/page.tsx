/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Phase 2: Deep Analysis | Documentation',
  description: 'Learn how Forge analyzes your code in Phase 2.',
};

export default function Phase2Analysis() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Phase 2: Deep Analysis
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Forge reads relevant code files and understands your architecture, patterns, and dependencies.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Happens in Phase 2</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Phase 2 takes 5-10 seconds and analyzes:
        </p>

        <div className="space-y-3 mt-4">
          {[
            'Code patterns and conventions',
            'API structure and endpoints',
            'Database schema and relationships',
            'Authentication and authorization patterns',
            'Error handling approaches',
            'Testing conventions',
            'Dependencies and external services',
            'Code organization and layer separation',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How Deep Analysis Works</h2>

        <div className="space-y-4 mt-6">
          {[
            {
              step: '1',
              title: 'Use Phase 1 fingerprint',
              details: 'Know the tech stack to select relevant files',
            },
            {
              step: '2',
              title: 'Select important files',
              details: 'Read routes, models, components, utilities (not tests or node_modules)',
            },
            {
              step: '3',
              title: 'Understand connections',
              details: 'See how files import from each other',
            },
            {
              step: '4',
              title: 'Analyze patterns',
              details: 'LLM identifies coding patterns and conventions',
            },
            {
              step: '5',
              title: 'Extract context',
              details: 'Build a mental model of your codebase',
            },
            {
              step: '6',
              title: 'Prepare for questions',
              details: 'Use context to ask smarter clarification questions',
            },
          ].map((item) => (
            <div key={item.step} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Files Are Analyzed</h2>

        <div className="space-y-3 mt-4">
          {[
            { type: 'API Routes/Controllers', examples: 'routes.js, controllers/, api/' },
            { type: 'Data Models', examples: 'models/, schema.prisma, database.ts' },
            { type: 'React Components', examples: 'components/, pages/' },
            { type: 'Utilities & Helpers', examples: 'utils/, lib/, helpers/' },
            { type: 'Middleware', examples: 'middleware/, interceptors/' },
            { type: 'Config Files', examples: 'tsconfig.json, package.json, Dockerfile' },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.type}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.examples}</p>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <strong>What's NOT read:</strong> node_modules, test files, build output, large data files, minified code, binary files
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Code Security in Phase 2</h2>

        <div className="space-y-3 mt-4">
          {[
            'Code is read in memory only (never stored)',
            'Analysis happens real-time on your selected branch',
            'No backups or caching of your code',
            'Deleted immediately after spec generation',
            'Your API keys and secrets are never exposed',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-green-700 dark:text-green-200">
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Performance Factors</h2>

        <div className="space-y-3 mt-4">
          {[
            {
              factor: 'Repository size',
              impact: 'Larger repos take longer to analyze',
            },
            {
              factor: 'File complexity',
              impact: 'Complex code takes more time to understand',
            },
            {
              factor: 'Dependencies',
              impact: 'Many imports = more context to process',
            },
            {
              factor: 'Your branch',
              description: 'Analyzing main vs a feature branch',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.factor}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.impact || item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Next: Phase 3</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          After analysis, Forge asks clarifying questions to fill knowledge gaps.
        </p>
        <Link
          href="/docs/phases/phase-3-questions"
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          Phase 3: Clarification Questions
        </Link>
      </section>
    </article>
  );
}
