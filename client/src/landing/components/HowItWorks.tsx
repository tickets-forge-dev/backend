'use client';

import { motion } from 'framer-motion';
import {
  fadeUp,
  slideFromLeft,
  staggerContainer,
  viewportConfig,
} from '@/landing/lib/motion-variants';

const LINEAR_STEPS = [
  {
    title: 'Describe',
    subtitle: 'What you want built — rough idea, Slack message, anything.',
    dotColor: 'bg-purple-400',
    borderColor: 'border-purple-400/30',
  },
  {
    title: 'AI Refines',
    subtitle: 'Forge asks smart questions, fills in technical gaps, and structures the spec.',
    dotColor: 'bg-violet-400',
    borderColor: 'border-violet-400/30',
  },
  {
    title: 'Approve',
    subtitle: 'Review the complete spec. Assigns developer automatically. Tracks SLA.',
    dotColor: 'bg-amber-400',
    borderColor: 'border-amber-400/30',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
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
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-4">
            HOW IT WORKS
          </p>
          <h2
            className="font-medium tracking-[-0.025em] text-[var(--text)]"
            style={{
              fontSize: 'var(--landing-heading)',
              marginBottom: 'var(--landing-optical-tighten)',
            }}
          >
            From idea to dev-ready spec in minutes
          </h2>
          <p
            className="text-[var(--text-secondary)] max-w-lg mx-auto"
            style={{ fontSize: 'var(--landing-subtitle)' }}
          >
            Not days. Not hours. Minutes.
          </p>
        </motion.div>

        {/* Linear steps: Describe → AI Refines → Approve */}
        <motion.div
          className="relative max-w-xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {/* Timeline line */}
          <div
            className="absolute left-[15px] top-2 bottom-0 w-px bg-[var(--border-subtle)]"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-10">
            {LINEAR_STEPS.map((step) => (
              <motion.div
                key={step.title}
                className="relative flex items-start gap-6 pl-1"
                variants={slideFromLeft}
              >
                <div className="relative z-10 flex items-center justify-center w-[30px] h-[30px] shrink-0">
                  <div className={`w-3 h-3 rounded-full ${step.dotColor}`} />
                </div>
                <div className={`pb-0 border-l-2 ${step.borderColor} pl-5`}>
                  <h3 className="font-medium text-[var(--text)] text-lg mb-1">{step.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed" style={{ fontSize: 'var(--landing-body)' }}>
                    {step.subtitle}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Fork — two paths after Approve */}
        <motion.div
          className="max-w-xl mx-auto mt-4"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {/* Fork connector lines */}
          <div className="relative flex justify-center mb-6">
            <div className="absolute left-[15px] top-0 w-px h-6 bg-[var(--border-subtle)]" />
            {/* Horizontal split line */}
            <svg className="w-full h-10 overflow-visible" viewBox="0 0 500 40" fill="none" preserveAspectRatio="xMidYMid meet">
              {/* Center vertical line down from Approve */}
              <line x1="32" y1="0" x2="32" y2="20" stroke="var(--border-subtle)" strokeWidth="1" />
              {/* Split left */}
              <path d="M32 20 Q32 30 120 30 L120 40" stroke="var(--border-subtle)" strokeWidth="1" fill="none" />
              {/* Split right */}
              <path d="M32 20 Q32 30 380 30 L380 40" stroke="var(--border-subtle)" strokeWidth="1" fill="none" />
            </svg>
          </div>

          {/* Two path cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cloud Develop — PM path */}
            <motion.div
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 relative overflow-hidden"
              variants={slideFromLeft}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
            >
              {/* Subtle glow */}
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <h3 className="font-medium text-[var(--text)] text-[15px]">Cloud Develop</h3>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">From the web</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">No IDE needed</span>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                Click Develop — AI implements in a cloud sandbox, runs tests, and opens a PR. Preview the result in your browser before merging.
              </p>
              <div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                  Auto PR
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                  Live preview
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                  Change Record
                </span>
              </div>
            </motion.div>

            {/* CLI/MCP — Developer path */}
            <motion.div
              className="rounded-xl border border-blue-500/20 bg-blue-500/[0.03] p-5 relative overflow-hidden"
              variants={slideFromLeft}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
            >
              {/* Subtle glow */}
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <h3 className="font-medium text-[var(--text)] text-[15px]">Developer CLI</h3>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium">From the terminal</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">Full control</span>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                Developer picks up the ticket via CLI or MCP bridge. Claude Code implements locally with full access to the codebase, tools, and tests.
              </p>
              <div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                  Local dev
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                  MCP bridge
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                  Full toolkit
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
