/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'Phase 1: Context Gathering | Documentation',
  description: 'Learn how Forge scans your codebase in Phase 1.',
};

export default function Phase1Context() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Phase 1: Context Gathering
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Forge&apos;s first step is to understand your codebase structure and technology stack.
        </p>
      </div>

      {/* Overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Happens in Phase 1</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Phase 1 takes 1-2 seconds and gathers:
        </p>

        <div className="space-y-3 mt-4">
          {[
            'Programming languages used (Python, JavaScript, Go, etc.)',
            'Frameworks (React, Django, Express, FastAPI, etc.)',
            'Databases (PostgreSQL, MongoDB, MySQL, Redis, etc.)',
            'Package managers (npm, pip, cargo, go mod, etc.)',
            'Build tools (Webpack, Vite, Docker, etc.)',
            'Testing frameworks (Jest, Pytest, Mocha, etc.)',
            'Key files and entry points',
            'Project structure and organization',
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-600 dark:text-blue-400">→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How Context Gathering Works</h2>

        <div className="space-y-4 mt-6">
          {[
            {
              step: '1',
              title: 'Scan repository structure',
              details: 'Forge lists directories and files without reading content',
            },
            {
              step: '2',
              title: 'Detect languages',
              details: 'Identify file extensions and package managers',
            },
            {
              step: '3',
              title: 'Identify frameworks',
              details: 'Check package.json, requirements.txt, Cargo.toml, etc.',
            },
            {
              step: '4',
              title: 'Find entry points',
              details: 'Locate main.ts, index.js, app.py, etc.',
            },
            {
              step: '5',
              title: 'Create fingerprint',
              details: 'Build a lightweight summary for Phase 2',
            },
            {
              step: '6',
              title: 'Stream results',
              details: 'Show results to you immediately (you can skip to Phase 3)',
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

      {/* Fingerprinting */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Two-Pass Fingerprinting</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Forge uses an optimized two-pass system to speed up context gathering:
        </p>

        <div className="space-y-4 mt-4">
          <div className="border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Pass 1: Quick Fingerprint (1-2 seconds)</h3>
            <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
              Forge scans file names and structure to detect:
            </p>
            <ul className="space-y-1 list-disc list-inside text-sm text-blue-900 dark:text-blue-200">
              <li>Languages and frameworks</li>
              <li>Directory organization</li>
              <li>Configuration files</li>
              <li>Entry points</li>
            </ul>
            <p className="text-xs text-blue-900 dark:text-blue-200 mt-3 italic">
              No file content is read. Results are streamed to you immediately.
            </p>
          </div>

          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Pass 2: Deep Analysis (Phase 2)</h3>
            <p className="text-sm text-green-900 dark:text-green-200 mb-3">
              Using the fingerprint, Phase 2 reads relevant files:
            </p>
            <ul className="space-y-1 list-disc list-inside text-sm text-green-900 dark:text-green-200">
              <li>Actual code content</li>
              <li>Dependencies and imports</li>
              <li>Database schemas</li>
              <li>API structures</li>
            </ul>
            <p className="text-xs text-green-900 dark:text-green-200 mt-3 italic">
              Phase 2 is smarter about which files to read because Phase 1 told it the tech stack.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            <strong>Benefit:</strong> You see results in 1-2 seconds instead of waiting 10+ seconds for full analysis. You can skip to Phase 3 immediately if needed.
          </p>
        </div>
      </section>

      {/* What Gets Detected */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">What Gets Detected</h2>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-2 font-semibold">Category</th>
                <th className="text-left px-4 py-2 font-semibold">Examples Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {[
                [
                  'Languages',
                  'JavaScript, TypeScript, Python, Go, Rust, Java, C#, PHP, Ruby',
                ],
                [
                  'Frontend Frameworks',
                  'React, Vue, Angular, Next.js, Svelte, Remix',
                ],
                [
                  'Backend Frameworks',
                  'Express, FastAPI, Django, Rails, Spring, ASP.NET',
                ],
                [
                  'Databases',
                  'PostgreSQL, MySQL, MongoDB, Redis, SQLite, DynamoDB',
                ],
                [
                  'Package Managers',
                  'npm, yarn, pnpm, pip, poetry, cargo, go mod',
                ],
                [
                  'Build Tools',
                  'Webpack, Vite, Turbo, Gradle, Maven, Make',
                ],
                [
                  'Testing',
                  'Jest, Mocha, Pytest, Vitest, Cypress, Playwright',
                ],
                [
                  'Cloud & Infra',
                  'Docker, Kubernetes, AWS, GCP, Azure, GitHub Actions, GitLab CI',
                ],
              ].map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100 font-medium">{row[0]}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Skipping Phase 1 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Can You Skip Phase 1?</h2>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
            <strong>Yes!</strong> Phase 1 is automatic and quick. But you don't have to wait for it to finish.
          </p>
          <p className="text-sm text-blue-900 dark:text-blue-200">
            As soon as Phase 1 completes and shows you the detected tech stack, you can click &quot;Continue to Phase 2&quot; or skip directly to &quot;Answer Questions&quot;.
          </p>
        </div>
      </section>

      {/* Context for Phase 2 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How Phase 1 Helps Phase 2</h2>

        <p className="text-gray-700 dark:text-gray-300 mt-2">
          The fingerprint from Phase 1 makes Phase 2 much faster and smarter:
        </p>

        <div className="space-y-3 mt-4">
          {[
            {
              benefit: 'Smart file selection',
              description: 'Phase 2 knows which files are actually relevant to your project',
            },
            {
              benefit: 'Efficient reading',
              description: 'Instead of scanning all 10,000 files, it only reads 50-100 relevant ones',
            },
            {
              benefit: 'Faster analysis',
              description: 'With smaller context, LLM analysis is faster (5-10 seconds instead of 20+)',
            },
            {
              benefit: 'Better prompts',
              description: 'Phase 2 knows your tech stack and can ask better questions',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.benefit}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Performance */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Performance Optimization</h2>

        <div className="space-y-3 mt-4">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">What Forge Skips</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">To keep Phase 1 fast, Forge skips:</p>
            <ul className="space-y-1 list-disc list-inside text-xs text-gray-700 dark:text-gray-300">
              <li>node_modules and vendor directories</li>
              <li>Build output and dist folders</li>
              <li>Image, video, and binary files</li>
              <li>Minified files</li>
              <li>.git and hidden directories</li>
            </ul>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Typical Times</h3>
            <ul className="space-y-1 list-disc list-inside text-xs text-gray-700 dark:text-gray-300">
              <li>Small repo (0-1 MB): &lt;1 second</li>
              <li>Medium repo (1-50 MB): 1-2 seconds</li>
              <li>Large repo (50-500 MB): 2-5 seconds</li>
              <li>Huge repo (500 MB+): 5-10 seconds</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Next: Phase 2</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          Learn how Forge dives deep into your code to understand patterns and dependencies.
        </p>
        <Link
          href="/docs/phases/phase-2-analysis"
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          Phase 2: Deep Analysis
        </Link>
      </section>
    </article>
  );
}
