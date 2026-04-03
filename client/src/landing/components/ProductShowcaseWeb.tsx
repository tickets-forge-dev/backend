'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  slideFromLeft,
  slideFromRight,
  viewportConfig,
} from '@/landing/lib/motion-variants';

const LIFECYCLE_STEPS = [
  { id: 'draft', label: 'Draft', color: '#71717a', description: 'Rough idea captured' },
  { id: 'define', label: 'Define', color: '#22c55e', description: 'AI enriches the spec' },
  { id: 'dev-review', label: 'Dev Review', color: '#22c55e', description: 'Developer reviews feasibility' },
  { id: 'pm-review', label: 'PM Review', color: '#22c55e', description: 'PM approves the final spec' },
  { id: 'ready', label: 'Ready', color: '#3b82f6', description: 'Ready for the developer to pick up' },
  { id: 'executing', label: 'Executing', color: '#f59e0b', description: 'AI is implementing in the cloud' },
  { id: 'delivered', label: 'Delivered', color: '#a855f7', description: 'PR opened, ready for code review' },
];

const STATUS_CONTENT: Record<string, { badge: string; badgeColor: string; features: string[] }> = {
  draft: {
    badge: 'Draft',
    badgeColor: 'bg-zinc-500/15 text-zinc-400',
    features: ['Title and description', 'Rough idea — no spec yet', 'Ready for AI enrichment'],
  },
  define: {
    badge: 'Defining',
    badgeColor: 'bg-emerald-500/15 text-emerald-400',
    features: ['AI generates problem statement', 'Acceptance criteria created', 'Quality score: 72/100'],
  },
  'dev-review': {
    badge: 'Dev Review',
    badgeColor: 'bg-emerald-500/15 text-emerald-400',
    features: ['Developer reviews technical feasibility', 'Q&A session with AI', 'File change estimates added'],
  },
  'pm-review': {
    badge: 'PM Review',
    badgeColor: 'bg-emerald-500/15 text-emerald-400',
    features: ['Final spec review by PM', 'Approve or request changes', 'Quality score: 94/100'],
  },
  ready: {
    badge: 'Ready',
    badgeColor: 'bg-blue-500/15 text-blue-400',
    features: ['Spec locked and approved', 'Develop button available', 'Estimate: 4 files, ~120 lines'],
  },
  executing: {
    badge: 'Executing',
    badgeColor: 'bg-amber-500/15 text-amber-400',
    features: ['AI cloning repo in cloud sandbox', 'Live session monitor active', 'Tests running automatically'],
  },
  delivered: {
    badge: 'Delivered',
    badgeColor: 'bg-violet-500/15 text-violet-400',
    features: ['Pull Request #5 opened', 'Decision Log with all decisions', 'Preview available — Run in browser'],
  },
};

export function ProductShowcaseWeb() {
  const [activeStep, setActiveStep] = useState('ready');
  const content = STATUS_CONTENT[activeStep];

  return (
    <section
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
        backgroundColor: 'var(--bg-gradient-end)',
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Text — left 40% */}
          <motion.div
            className="md:col-span-5"
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] mb-4">
              WEB APP
            </p>
            <h2
              className="font-medium tracking-[-0.025em] text-[var(--text)] mb-6"
              style={{ fontSize: 'var(--landing-heading)' }}
            >
              Create, review, and approve — all from the browser
            </h2>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span>
                AI-enriched specs with quality scores and acceptance criteria
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span>
                Full lifecycle from draft to delivered — click to explore
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span>
                Developer review and PM approval workflow built in
              </li>
            </ul>
          </motion.div>

          {/* Interactive mock — right 60% */}
          <motion.div
            className="md:col-span-7 relative"
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {/* Glow behind */}
            <div
              className="absolute -inset-16 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, var(--glow-accent) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />

            {/* Mock ticket card */}
            <div
              className="relative rounded-2xl border border-[var(--border-subtle)] overflow-hidden md:[transform:perspective(2000px)_rotateY(-3deg)_rotateX(2deg)]"
              style={{
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                background: '#0c0c0f',
                maxWidth: '520px',
              }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="ml-3 text-[11px] text-white/25 font-mono">Ticket Detail</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/20 px-2 py-0.5 rounded border border-white/[0.06]">Export</span>
                  {activeStep === 'ready' && (
                    <motion.span
                      className="text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/15 font-medium"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      &#9889; Develop
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Ticket content */}
              <div className="p-5">
                {/* Title */}
                <div className="mb-4">
                  <div className="text-[15px] font-medium text-white/90 mb-1">
                    Add SSO login with Google OAuth
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/30">
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500/30 to-emerald-500/30 inline-block" />
                      Adam Ayalon
                    </span>
                    <span>&middot;</span>
                    <span>Created by Dan</span>
                  </div>
                </div>

                {/* Status badge + lifecycle */}
                <div className="flex items-start gap-5">
                  {/* Lifecycle timeline */}
                  <div className="space-y-0">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2 font-medium">Lifecycle</div>
                    {LIFECYCLE_STEPS.map((step, i) => {
                      const isActive = step.id === activeStep;
                      const activeIdx = LIFECYCLE_STEPS.findIndex(s => s.id === activeStep);
                      const isPast = i < activeIdx;

                      return (
                        <button
                          key={step.id}
                          onClick={() => setActiveStep(step.id)}
                          className="flex items-center gap-2.5 py-1.5 w-full text-left group transition-colors"
                        >
                          {/* Dot + line */}
                          <div className="relative flex flex-col items-center">
                            <motion.div
                              className="rounded-full border-2 shrink-0"
                              style={{
                                width: isActive ? 14 : 10,
                                height: isActive ? 14 : 10,
                                borderColor: isActive ? step.color : isPast ? '#22c55e' : '#27272a',
                                background: isPast ? '#22c55e' : isActive ? step.color : 'transparent',
                              }}
                              animate={{
                                scale: isActive ? [1, 1.15, 1] : 1,
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: isActive ? Infinity : 0,
                              }}
                            />
                            {i < LIFECYCLE_STEPS.length - 1 && (
                              <div
                                className="w-px absolute top-full"
                                style={{
                                  height: 12,
                                  background: isPast ? '#22c55e44' : '#27272a',
                                }}
                              />
                            )}
                          </div>

                          {/* Label */}
                          <div className="min-w-0">
                            <div className={`text-[12px] transition-colors ${
                              isActive ? 'text-white/90 font-medium' : isPast ? 'text-white/50' : 'text-white/25 group-hover:text-white/40'
                            }`}>
                              {step.label}
                            </div>
                            {isActive && (
                              <motion.div
                                className="text-[10px] text-white/30"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                {step.description}
                              </motion.div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right side — status content */}
                  <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium mb-3 ${content.badgeColor}`}>
                          {content.badge}
                        </div>
                        <div className="space-y-2">
                          {content.features.map((f, i) => (
                            <motion.div
                              key={i}
                              className="flex items-start gap-2 text-[11px] text-white/50"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.08 }}
                            >
                              <span className="text-white/20 mt-px shrink-0">&#8226;</span>
                              <span>{f}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Spec tabs bar */}
                <div className="flex items-center gap-1 mt-5 pt-4 border-t border-white/[0.04]">
                  {['Spec', 'Design', 'Technical'].map((tab, i) => (
                    <span
                      key={tab}
                      className={`px-3 py-1 rounded-md text-[11px] ${
                        i === 0 ? 'bg-white/[0.06] text-white/60 font-medium' : 'text-white/25'
                      }`}
                    >
                      {tab}
                    </span>
                  ))}
                  <div className="ml-auto flex items-center gap-3 text-[10px] text-white/20">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">Feature</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Low</span>
                    <span className="text-emerald-400 font-mono font-medium">92</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
