import Link from 'next/link';
import { Lightbulb, Zap, Shield, BarChart3 } from 'lucide-react';

export const metadata = {
  title: 'What is Forge? | Documentation',
  description: 'Understand Forge - the AI-powered ticket generation platform for engineering teams.',
};

export default function WhatIsForge() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          What is Forge?
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Forge is an AI-powered ticket generation platform that helps product managers, designers, and
          team leads explain their ideas to engineering teams with clarity and precision.
        </p>
      </div>

      {/* The Problem */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">The Problem We Solve</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Have you ever struggled to explain a feature or bug fix to your engineering team? You might find yourself:
        </p>
        <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
          <li>Writing long emails with scattered context</li>
          <li>Creating tickets that lack implementation details</li>
          <li>Jumping between Jira, Linear, Slack, and email</li>
          <li>Answering the same questions from different engineers</li>
          <li>Having incomplete tickets bounce back for clarification</li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300 mt-4">
          <strong>Forge fixes this.</strong> Instead of writing vague requirements, you provide context — and Forge
          generates structured, implementation-ready tickets.
        </p>
      </section>

      {/* How It Works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">How Forge Works</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Forge uses AI with code context to generate comprehensive tickets in 4 phases:
        </p>

        <div className="grid gap-4 mt-6">
          {[
            {
              phase: '1',
              title: 'Context Gathering',
              description: 'Scans your codebase to understand tech stack and structure (1-2 seconds)',
            },
            {
              phase: '2',
              title: 'Deep Analysis',
              description: 'Reads relevant code files to understand patterns and dependencies (5-10 seconds)',
            },
            {
              phase: '3',
              title: 'Clarification Questions',
              description: 'Asks 3-5 smart questions to fill knowledge gaps (you answer)',
            },
            {
              phase: '4',
              title: 'Specification Generation',
              description:
                'Creates a complete spec with problem, solution, API changes, tests, and file changes (2-3 seconds)',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{item.phase}</span>
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

      {/* Key Features */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Key Features</h2>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {[
            {
              icon: <Zap className="h-6 w-6" />,
              title: 'Code-Aware Generation',
              description: 'Forge scans your actual codebase to generate contextually accurate tickets based on real patterns.',
            },
            {
              icon: <BarChart3 className="h-6 w-6" />,
              title: 'Structured Output',
              description: 'Every ticket includes Problem, Solution, Acceptance Criteria, API changes, file changes, and tests.',
            },
            {
              icon: <Shield className="h-6 w-6" />,
              title: 'Security First',
              description: 'Your code is never cloned or stored. We only analyze in real-time and delete results after generation.',
            },
            {
              icon: <Lightbulb className="h-6 w-6" />,
              title: 'Smart Questions',
              description: 'Forge asks clarifying questions to understand your intent before generating the final spec.',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-blue-600 dark:text-blue-400">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Real World Use Cases */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Real-World Use Cases</h2>

        <div className="space-y-4 mt-4">
          {[
            {
              title: 'Product Manager Creating a Feature',
              example:
                'Upload a Figma design or description → Forge analyzes your codebase → Generates implementation ticket with API endpoints, database changes, and tests',
            },
            {
              title: 'Designer Reporting a Bug',
              example:
                'Add a screenshot and describe the issue → Forge generates reproduction steps and bug report with affected components',
            },
            {
              title: 'Engineer Planning Refactoring',
              example:
                'Describe the problem → Forge analyzes code → Generates a spec with file-by-file changes and test plan',
            },
            {
              title: 'Team Lead Importing from Jira/Linear',
              example:
                'Import an existing ticket → Forge enriches it with code context and generates a comprehensive implementation plan',
            },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.example}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Getting Started */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Getting Started</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Ready to generate your first ticket? Start with one of these:
        </p>
        <div className="grid gap-3 mt-4">
          <Link
            href="/docs/getting-started/setup"
            className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Setup Guide →</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Connect GitHub, Linear, or Jira in 2 minutes</p>
          </Link>
          <Link
            href="/docs/getting-started/first-ticket"
            className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">First Ticket Walkthrough →</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Step-by-step guide to create your first ticket</p>
          </Link>
          <Link
            href="/docs/workflows/ticket-creation"
            className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white">Explore Workflows →</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Learn about imports, PRD breakdown, and more</p>
          </Link>
        </div>
      </section>

      {/* Why Forge is Better */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Why Choose Forge?</h2>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-2 font-semibold">Feature</th>
                <th className="text-center px-4 py-2 font-semibold">Forge</th>
                <th className="text-center px-4 py-2 font-semibold">Claude Workspace</th>
                <th className="text-center px-4 py-2 font-semibold">Plain Claude</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {[
                ['Code Context', '✓', '✗', '✗'],
                ['Structured Output', '✓', '✗', '✗'],
                ['Version History', '✓', '✗', '✗'],
                ['Team Workspaces', '✓', '✗', '✗'],
                ['Import from Jira/Linear', '✓', '✗', '✗'],
                ['Bulk Operations', '✓', '✗', '✗'],
                ['Quality Scoring', '✓', '✗', '✗'],
              ].map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{row[0]}</td>
                  <td className="text-center px-4 py-2 text-green-600 dark:text-green-400">{row[1]}</td>
                  <td className="text-center px-4 py-2 text-gray-500 dark:text-gray-500">{row[2]}</td>
                  <td className="text-center px-4 py-2 text-gray-500 dark:text-gray-500">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Next Steps</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          Learn how Forge compares to other tools, or jump straight to creating your first ticket.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/docs/getting-started/forge-vs-claude"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Forge vs Claude
          </Link>
          <Link
            href="/tickets/create"
            className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors"
          >
            Create a Ticket
          </Link>
        </div>
      </section>
    </article>
  );
}
