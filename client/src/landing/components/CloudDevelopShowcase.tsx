'use client';

import { motion } from 'framer-motion';
import {
  fadeUp,
  slideFromLeft,
  slideFromRight,
  staggerContainer,
  viewportConfig,
} from '@/landing/lib/motion-variants';

const FLOW_STEPS = [
  {
    icon: '1',
    title: 'Connect your repos',
    description: 'Link one or multiple repositories with role assignments — backend, frontend, shared.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
  },
  {
    icon: '2',
    title: 'Choose skills',
    description: 'Pick from curated skills like TDD, Security Audit, or Clean Architecture — or let AI recommend.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  {
    icon: '3',
    title: 'Watch it work',
    description: 'Live session monitor shows file edits, test runs, and decisions in real time. Cancel anytime.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
  },
  {
    icon: '4',
    title: 'Review the PR',
    description: 'AI opens a pull request with full change record — every decision documented, every test passing.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
];

export function CloudDevelopShowcase() {
  return (
    <section
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section heading */}
        <motion.div
          className="text-center mb-16"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-4">
            CLOUD DEVELOP
          </p>
          <h2
            className="font-medium tracking-[-0.025em] text-[var(--text)]"
            style={{
              fontSize: 'var(--landing-heading)',
              marginBottom: 'var(--landing-optical-tighten)',
            }}
          >
            From approved ticket to pull request
          </h2>
          <p
            className="text-[var(--text-secondary)] max-w-xl mx-auto"
            style={{ fontSize: 'var(--landing-subtitle)' }}
          >
            AI implements your spec in a cloud sandbox. You review code, not write it.
          </p>
        </motion.div>

        {/* Two flow cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Full Flow */}
          <motion.div
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 p-6"
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-[var(--text)]">Full Flow</h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">Spec-first development</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px]">Describe</span>
              <span className="text-[var(--text-tertiary)]">&rarr;</span>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px]">AI Refines</span>
              <span className="text-[var(--text-tertiary)]">&rarr;</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px]">Approve</span>
              <span className="text-[var(--text-tertiary)]">&rarr;</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px]">Develop</span>
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-3 leading-relaxed">
              Write a detailed spec with AI assistance, review with your team, then click Develop.
              AI implements autonomously and opens a PR with full change record.
            </p>
          </motion.div>

          {/* Quick Flow */}
          <motion.div
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 p-6"
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-[var(--text)]">Quick Flow</h3>
                <p className="text-[11px] text-[var(--text-tertiary)]">Skip the spec, ship fast</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px]">Describe change</span>
              <span className="text-[var(--text-tertiary)]">&rarr;</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px]">AI Implements</span>
              <span className="text-[var(--text-tertiary)]">&rarr;</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px]">Review PR</span>
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-3 leading-relaxed">
              Select a repo, type what you want changed in plain text. AI implements immediately
              and auto-generates a ticket with full context for the record.
            </p>
          </motion.div>
        </div>

        {/* Development pipeline steps */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {FLOW_STEPS.map((step) => (
            <motion.div
              key={step.title}
              className={`rounded-lg border ${step.border} bg-[var(--bg-subtle)]/30 p-5`}
              variants={fadeUp}
            >
              <div className={`w-7 h-7 rounded-md ${step.bg} flex items-center justify-center mb-3`}>
                <span className={`text-[12px] font-semibold ${step.color}`}>{step.icon}</span>
              </div>
              <h4 className="text-[13px] font-medium text-[var(--text)] mb-1">{step.title}</h4>
              <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
