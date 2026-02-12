/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';

export const metadata = {
  title: 'FAQ | Documentation',
  description: 'Frequently asked questions about Forge.',
};

export default function FAQ() {
  return (
    <article className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Find answers to common questions about Forge.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">General</h2>

        <div className="space-y-4 mt-4">
          {[
            { q: 'What is Forge?', a: 'Forge is an AI-powered platform that generates implementation-ready tickets by analyzing your codebase.' },
            { q: 'Does it clone my code?', a: 'No. Forge streams files from GitHub without cloning or storing anything.' },
            { q: 'How long does it take?', a: '2-5 minutes per ticket depending on your codebase size and responses.' },
            { q: 'Can I use it for non-code projects?', a: 'Yes. Use PRD Breakdown to generate tickets from requirements documents.' },
            { q: 'Does it support private repos?', a: 'Yes, with proper GitHub authorization.' },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{item.q}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Pricing & Plans</h2>

        <div className="space-y-4 mt-4">
          {[
            { q: 'Is Forge free?', a: 'We offer a free trial with limited tickets. Paid plans start at $12/month.' },
            { q: "What's included in each plan?", a: "Check our pricing page for details on tickets per month, team size, and features." },
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel your subscription anytime with no penalties.' },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{item.q}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Technical</h2>

        <div className="space-y-4 mt-4">
          {[
            { q: 'What languages does Forge support?', a: 'JavaScript, Python, Go, Rust, Java, C#, PHP, Ruby, and more.' },
            { q: 'Which frameworks are supported?', a: 'React, Vue, Django, Express, FastAPI, Rails, Spring, and more.' },
            { q: 'Do you support monorepos?', a: 'Yes. You can select specific packages or analyze the entire repo.' },
          ].map((item, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{item.q}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Still Have Questions?</h2>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Can&apos;t find the answer you&apos;re looking for? Email us at support@forge.dev or join our Slack community.
        </p>
      </section>

      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-6">
        <Link href="/docs/faq/troubleshooting" className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          Troubleshooting Guide
        </Link>
      </section>
    </article>
  );
}
