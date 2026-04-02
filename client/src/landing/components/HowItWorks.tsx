'use client';

import { motion } from 'framer-motion';
import {
  fadeUp,
  slideFromLeft,
  slideFromRight,
  staggerContainer,
  viewportConfig,
} from '@/landing/lib/motion-variants';

const LINEAR_STEPS = [
  {
    title: 'Describe',
    subtitle: 'What you want built — rough idea, Slack message, anything.',
    dotColor: '#a78bfa', // purple
    borderColor: 'border-purple-400/30',
  },
  {
    title: 'AI Refines',
    subtitle: 'Forge asks smart questions, fills in technical gaps, and structures the spec.',
    dotColor: '#8b5cf6', // violet
    borderColor: 'border-violet-400/30',
  },
  {
    title: 'Approve',
    subtitle: 'Review the complete spec. Assigns developer automatically. Tracks SLA.',
    dotColor: '#fbbf24', // amber
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

        <div className="max-w-2xl mx-auto">
          {/* Linear steps: Describe → AI Refines → Approve */}
          <motion.div
            className="relative"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <div className="flex flex-col gap-8">
              {LINEAR_STEPS.map((step, i) => (
                <motion.div
                  key={step.title}
                  className="relative flex items-start gap-5"
                  variants={slideFromLeft}
                >
                  {/* Dot + connecting line */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-4 h-4 rounded-full border-2 z-10"
                      style={{ borderColor: step.dotColor, background: `${step.dotColor}33` }}
                    />
                    {i < LINEAR_STEPS.length - 1 && (
                      <div className="w-px flex-1 min-h-[40px] bg-white/[0.06]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`pb-0 border-l-2 ${step.borderColor} pl-5 -mt-0.5`}>
                    <h3 className="font-medium text-[var(--text)] text-[17px] mb-1">{step.title}</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed text-[14px]">
                      {step.subtitle}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Fork visual — simple CSS lines */}
          <motion.div
            className="relative mt-2 mb-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {/* Vertical stem from last dot */}
            <div className="flex justify-start">
              <div className="w-px h-8 bg-white/[0.06] ml-[7px]" />
            </div>
            {/* Horizontal bar + two vertical drops */}
            <div className="relative ml-[7px]" style={{ width: 'calc(100% - 7px)' }}>
              <div className="h-px bg-white/[0.06] w-full" />
              {/* Left drop */}
              <div className="absolute left-[25%] top-0 w-px h-6 bg-white/[0.06]" />
              {/* Right drop */}
              <div className="absolute left-[75%] top-0 w-px h-6 bg-white/[0.06]" />
              {/* Left dot */}
              <div className="absolute left-[25%] top-6 -translate-x-1/2">
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              </div>
              {/* Right dot */}
              <div className="absolute left-[75%] top-6 -translate-x-1/2">
                <div className="w-3 h-3 rounded-full bg-blue-400/80" />
              </div>
            </div>
          </motion.div>

          {/* Two path cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {/* Cloud Develop — PM path */}
            <motion.div
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 relative overflow-hidden"
              variants={slideFromLeft}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
            >
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
              variants={slideFromRight}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
            >
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
        </div>
      </div>
    </section>
  );
}
