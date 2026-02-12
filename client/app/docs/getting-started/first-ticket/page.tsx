/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';
import { Lightbulb } from 'lucide-react';

export const metadata = {
  title: 'First Ticket Walkthrough | Documentation',
  description: 'Step-by-step guide to create your first ticket with Forge.',
};

export default function FirstTicket() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
          Create Your First Ticket
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Follow this step-by-step guide to create your first implementation-ready ticket with Forge.
        </p>
      </div>

      {/* Prerequisites */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Prerequisites</h2>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Make sure you&apos;ve completed the <Link href="/docs/getting-started/setup" className="font-semibold hover:underline">Setup Guide</Link> first. You need GitHub connected before you can create tickets.
          </p>
        </div>
      </section>

      {/* The 4-Step Process */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">The 4-Step Process</h2>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Forge creates tickets through a guided process:
        </p>

        <div className="space-y-6 mt-6">
          {/* Step 1 */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Describe Your Ticket</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  (Phase 1: Context Gathering - 1-2 seconds)
                </p>
              </div>
            </div>
            <div className="ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Start by telling Forge what you want to build:
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                <li><strong>Title:</strong> "Add user authentication"</li>
                <li><strong>Description:</strong> Explain the feature or bug in 1-2 sentences</li>
                <li><strong>Type:</strong> Feature, Bug, Refactor, or Task</li>
                <li><strong>Priority:</strong> Low, Medium, High, or Urgent</li>
                <li><strong>Repository:</strong> Select which repo to analyze</li>
                <li><strong>Branch:</strong> The branch to scan (usually "main" or "master")</li>
              </ul>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 mt-3">
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  <strong>Pro Tip:</strong> Be specific but concise. Say "Add OAuth2 login with GitHub" instead of just "Add login."
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Deep Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  (Phase 2: Deep Analysis - 5-10 seconds)
                </p>
              </div>
            </div>
            <div className="ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Forge scans your codebase to understand:
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                <li>Your tech stack (languages, frameworks, databases)</li>
                <li>Existing patterns and code structure</li>
                <li>Dependencies and external services</li>
                <li>Related files and modules</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-3">
                You&apos;ll see real-time updates as Forge discovers context. Feel free to skip this step if you&apos;re in a hurry.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3 mt-3">
                <p className="text-xs text-green-900 dark:text-green-200">
                  <strong>Fun Fact:</strong> Forge uses a 2-pass fingerprinting system to show results fast without analyzing every file.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Answer Clarification Questions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  (Phase 3: Clarification Questions - Variable)
                </p>
              </div>
            </div>
            <div className="ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Based on the code context, Forge asks 3-5 smart clarification questions to fill knowledge gaps and make the final spec more accurate:
              </p>
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded p-3 mt-3 space-y-2">
                <p className="text-xs text-gray-900 dark:text-gray-100 font-medium">Example Questions:</p>
                <ul className="space-y-1 list-disc list-inside text-xs text-gray-700 dark:text-gray-300">
                  <li>"Should login be required for all routes or only specific ones?"</li>
                  <li>"Do you need password reset functionality?"</li>
                  <li>"Should users be able to log out?"</li>
                </ul>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded p-3 mt-3">
                <p className="text-xs text-emerald-900 dark:text-emerald-200">
                  <strong>Why These Questions Matter:</strong> These aren't generic questions. They're generated based on your specific code, tech stack, and requirements. Your answers directly impact the accuracy and completeness of the final specification.
                </p>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-3">
                Answer these questions one by one. Each answer refines the final spec by making it more specific to your needs. You can also skip any question if you prefer.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 mt-3">
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  <strong>Note:</strong> If Forge doesn't need clarification, it will skip straight to spec generation. The better your answers, the better your spec.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">4</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Review the Spec</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  (Phase 4: Specification Generation - 2-3 seconds)
                </p>
              </div>
            </div>
            <div className="ml-16 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Forge generates a complete specification with:
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                <li><strong>Problem Statement:</strong> Why this change is needed</li>
                <li><strong>Solution:</strong> How to implement it</li>
                <li><strong>Acceptance Criteria:</strong> BDD-style requirements</li>
                <li><strong>API Changes:</strong> New endpoints and data models</li>
                <li><strong>File Changes:</strong> Which files to modify and why</li>
                <li><strong>Test Plan:</strong> Unit, integration, and edge case tests</li>
                <li><strong>Quality Score:</strong> How complete and detailed the spec is</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-3">
                Review the spec, make edits if needed, then finalize to save the ticket.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Full Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Full Example: Adding User Authentication</h2>

        <div className="space-y-4 mt-4">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/30">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Step 1: Describe</h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p><strong>Title:</strong> Add OAuth2 login with GitHub</p>
              <p><strong>Type:</strong> Feature</p>
              <p><strong>Priority:</strong> High</p>
              <p><strong>Description:</strong> Users should be able to sign in using their GitHub account. This will reduce friction for our developer audience.</p>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/30">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Step 2: Wait for Analysis</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Forge discovers:
            </p>
            <ul className="space-y-1 list-disc list-inside text-xs text-gray-700 dark:text-gray-300">
              <li>You're using Next.js with Firebase authentication</li>
              <li>You have a database schema with User and Session tables</li>
              <li>You already have Google OAuth2 configured</li>
              <li>Related files: /app/auth, /lib/firebase.ts, /pages/api/auth</li>
            </ul>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/30">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Step 3: Answer Questions</h3>
            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <p><strong>Q: Should GitHub login be the default, or should users choose?</strong></p>
              <p className="ml-4 text-gray-600 dark:text-gray-400">A: Keep Google as default, but add GitHub as an option</p>
              <p className="mt-2"><strong>Q: Do you need profile data from GitHub (avatar, bio)?</strong></p>
              <p className="ml-4 text-gray-600 dark:text-gray-400">A: Yes, use avatar and username</p>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
            <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-3">Step 4: Generated Spec</h3>
            <p className="text-xs text-green-700 dark:text-green-200 mb-3">
              Forge generates a complete spec including:
            </p>
            <ul className="space-y-1 list-disc list-inside text-xs text-green-700 dark:text-green-200">
              <li>Modified auth/github.ts file with OAuth flow</li>
              <li>Updated User schema to store GitHub ID and avatar</li>
              <li>New API route POST /api/auth/github/callback</li>
              <li>5 unit tests for GitHub OAuth flow</li>
              <li>2 integration tests for login flow</li>
              <li>Quality Score: 92/100</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tips & Tricks */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Tips & Tricks</h2>

        <div className="space-y-4 mt-4">
          <div className="flex gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Be specific in your description</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                &quot;Add email authentication with SMTP&quot; generates better specs than &quot;Add email feature&quot;
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Use the right ticket type</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                &quot;Feature&quot; for new functionality, &quot;Bug&quot; for fixes, &quot;Refactor&quot; for code cleanup
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Answer all questions</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                More context = more accurate specs. But you can skip if you don&apos;t know
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">You can edit the spec</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Don&apos;t like something? Click to edit acceptance criteria, file changes, tests, etc.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
            <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Check the quality score</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                A higher score means more complete and detailed spec. Try answering more questions for better specs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">Ready to Create?</h2>
        <p className="text-blue-900 dark:text-blue-200 mb-4">
          You now understand how Forge works. Let&apos;s create your first ticket!
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/tickets/create"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Create a Ticket
          </Link>
          <Link
            href="/docs/workflows/ticket-creation"
            className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors"
          >
            Learn More About Ticket Creation
          </Link>
        </div>
      </section>
    </article>
  );
}
