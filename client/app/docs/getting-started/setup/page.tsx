/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';
import { Github, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Setup Guide | Documentation',
  description: 'Get Forge up and running - connect your GitHub, Linear, or Jira account in 2 minutes.',
};

export default function Setup() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Setup Guide
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Get Forge running in 2 minutes by connecting your GitHub account.
        </p>
      </div>

      {/* Quick Start */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Quick Start</h2>

        <div className="space-y-4 mt-4">
          {[
            {
              step: '1',
              title: 'Sign in or create an account',
              description: 'Go to Forge and click &quot;Sign In.&quot; You can use Google, GitHub, or email.',
            },
            {
              step: '2',
              title: 'Connect GitHub',
              description:
                'In Settings, click &quot;Connect GitHub&quot; and authorize Forge to read your repositories (we never clone or store code).',
            },
            {
              step: '3',
              title: 'Select a repository',
              description: 'When creating your first ticket, select the repository you want Forge to analyze.',
            },
            {
              step: '4',
              title: 'Create a ticket',
              description: 'Describe your feature or bug, and Forge will generate a complete spec based on your codebase.',
            },
          ].map((item) => (
            <div key={item.step} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="font-semibold text-blue-700 dark:text-blue-300">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GitHub Connection */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Connecting GitHub</h2>

        <p className="text-gray-700 dark:text-gray-300">
          Forge needs to access your GitHub repositories to analyze code context. Here&apos;s how:
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6 mt-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">What Permissions Does Forge Need?</h3>
          <ul className="space-y-2 list-disc list-inside text-blue-900 dark:text-blue-200 text-sm">
            <li><strong>Read access to repository contents:</strong> To scan code files and understand structure</li>
            <li><strong>Read access to repository metadata:</strong> To detect languages, frameworks, and dependencies</li>
            <li><strong>NO write access:</strong> Forge never modifies your code</li>
            <li><strong>NO storage:</strong> Code is analyzed in real-time and deleted immediately after generation</li>
          </ul>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Steps to Connect GitHub</h3>
          <ol className="space-y-3 list-decimal list-inside text-sm text-gray-700 dark:text-gray-300">
            <li>Click your profile icon in the top right</li>
            <li>Select "Settings"</li>
            <li>Click "Connect GitHub" under Integrations</li>
            <li>You'll be redirected to GitHub to authorize Forge</li>
            <li>Select which repositories Forge can access (or select all)</li>
            <li>Click "Authorize"</li>
            <li>You're done! Forge can now analyze your code</li>
          </ol>
        </div>
      </section>

      {/* Linear/Jira Setup */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Optional: Connect Linear or Jira</h2>

        <p className="text-gray-700 dark:text-gray-300">
          You can optionally connect Linear or Jira to import existing tickets for enrichment.
        </p>

        <div className="grid gap-4 mt-4">
          {[
            {
              title: 'Linear Connection',
              steps: [
                'Go to Settings → Integrations → Linear',
                'Click &quot;Connect Linear&quot;',
                'Select your workspace and authorize',
                'Now you can import Linear issues into Forge',
              ],
            },
            {
              title: 'Jira Connection',
              steps: [
                'Go to Settings → Integrations → Jira',
                'Enter your Jira instance URL',
                'Create an API token in Jira (Account Settings → Security)',
                'Enter your email and API token',
                'Now you can import Jira issues into Forge',
              ],
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{item.title}</h3>
              <ol className="space-y-2 list-decimal list-inside text-sm text-gray-700 dark:text-gray-300">
                {item.steps.map((step, j) => (
                  <li key={j}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Security & Privacy</h2>

        <div className="space-y-4 mt-4">
          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Your Code is Safe</h3>
            <p className="text-sm text-green-700 dark:text-green-200">
              Forge analyzes code in real-time without storing it. Your repositories remain private and secure.
            </p>
          </div>

          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">No Code Cloning</h3>
            <p className="text-sm text-green-700 dark:text-green-200">
              Forge streams file contents on-demand during analysis. We never clone your repository to our servers.
            </p>
          </div>

          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Instant Deletion</h3>
            <p className="text-sm text-green-700 dark:text-green-200">
              Code is deleted immediately after spec generation. No backups or long-term storage.
            </p>
          </div>

          <div className="border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Audit Trail</h3>
            <p className="text-sm text-green-700 dark:text-green-200">
              See exactly when and how Forge accessed your repositories in the Activity Log.
            </p>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Troubleshooting</h2>

        <div className="space-y-4 mt-4">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">GitHub connection fails</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Make sure you&apos;re authorizing the correct GitHub organization. You can change the scope in GitHub Settings → Applications.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Repository not showing up</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Forge might not have access to that repository. Check your GitHub authorization scope and re-authorize if needed.
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Jira connection using wrong instance</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Go back to Settings and disconnect, then reconnect with the correct Jira URL.
            </p>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">You're All Set!</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          Now that Forge is connected to your repositories, you&apos;re ready to create your first ticket.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs/getting-started/first-ticket"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Create Your First Ticket
          </Link>
          <Link
            href="/tickets/create"
            className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors"
          >
            Go to Forge
          </Link>
        </div>
      </section>
    </article>
  );
}
