'use client';

import { motion } from 'framer-motion';
import {
  fadeUp,
  slideFromLeft,
  slideFromRight,
  staggerContainer,
  viewportConfig,
} from '@/landing/lib/motion-variants';

/**
 * CloudDevelopShowcase — the centerpiece landing section.
 *
 * Shows a big, beautiful mock of the Cloud Develop experience:
 * a session blade with live activity, PR result, and preview.
 * Demonstrates that PMs can develop, preview, and track — all from the browser.
 */

const CAPABILITIES = [
  {
    label: 'Develop',
    title: 'One click to implementation',
    description: 'Approve a ticket and hit Develop. AI clones your repo, writes code, runs tests, and opens a PR — all in a cloud sandbox.',
    color: 'emerald',
  },
  {
    label: 'Preview',
    title: 'See it running before merging',
    description: 'Launch a live preview of the generated code directly in your browser. No local setup, no environment issues.',
    color: 'blue',
  },
  {
    label: 'Track',
    title: 'Every decision documented',
    description: 'Decision Logs capture what was built, why decisions were made, and how the spec diverged. Full audit trail.',
    color: 'violet',
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
          className="text-center mb-20"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-emerald-500/70 mb-4">
            CLOUD DEVELOP
          </p>
          <h2
            className="font-medium tracking-[-0.03em] text-[var(--text)]"
            style={{
              fontSize: 'var(--landing-heading)',
              marginBottom: '12px',
            }}
          >
            Your PM just shipped a PR
          </h2>
          <p
            className="text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed"
            style={{ fontSize: 'var(--landing-subtitle)' }}
          >
            No IDE. No terminal. No developer needed for the first pass.
            <br className="hidden sm:block" />
            Describe what you want, and watch AI implement it in real time.
          </p>
        </motion.div>

        {/* ── Big mock UI ── */}
        <motion.div
          className="relative mb-24"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {/* Ambient glow behind the mock */}
          <div className="absolute -inset-8 pointer-events-none" style={{ filter: 'blur(60px)' }}>
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-emerald-500/8" />
            <div className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-violet-500/6" />
          </div>

          {/* Mock develop session blade */}
          <div className="relative rounded-2xl border border-[var(--border-subtle)] bg-[#0c0c0f] overflow-hidden shadow-2xl shadow-black/50">
            {/* Window chrome */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="ml-3 text-[11px] text-white/30 font-mono">Cloud Develop</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/20">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            {/* Session content */}
            <div className="p-6 space-y-4">
              {/* Status header */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <MockProgressDots />
                  <span className="text-[12px] text-white/50 font-medium">Working...</span>
                </div>
                <span className="text-[11px] text-white/20 ml-auto font-mono">2:47</span>
              </div>

              {/* Agent messages */}
              <div className="space-y-3">
                <MockMessage
                  content="Let me read the ticket specification and understand the codebase architecture."
                  delay={0}
                />
                <MockToolGroup tools={[
                  { icon: '📋', name: 'get_ticket_context', status: 'done' },
                  { icon: '🔍', name: 'get_repository_context', status: 'done' },
                  { icon: '📄', name: 'Read CLAUDE.md', status: 'done' },
                ]} delay={0.1} />
                <MockMessage
                  content="I'll implement the dark mode toggle using the existing theme context. Creating the ThemeToggle component first."
                  delay={0.2}
                />
                <MockToolGroup tools={[
                  { icon: '✏️', name: 'src/components/ThemeToggle.tsx', badge: 'new', status: 'done' },
                  { icon: '✏️', name: 'src/contexts/ThemeContext.tsx', badge: 'new', status: 'done' },
                  { icon: '✏️', name: 'src/App.tsx', badge: 'modified', status: 'done' },
                  { icon: '✏️', name: 'src/styles/themes.ts', badge: 'new', status: 'done' },
                ]} delay={0.3} />
                <MockMessage
                  content="All files created. Running build and tests to verify..."
                  delay={0.4}
                />
                <MockToolGroup tools={[
                  { icon: '▶', name: '$ npm run build', status: 'done' },
                  { icon: '▶', name: '$ npm test — 4 passed', status: 'done' },
                  { icon: '▶', name: '$ git push origin HEAD', status: 'active' },
                ]} delay={0.5} />
              </div>

              {/* Summary card */}
              <motion.div
                className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03] p-4 mt-2"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                viewport={viewportConfig}
              >
                <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-500 mb-3">
                  <span>&#10003;</span>
                  <span>Development complete</span>
                  <span className="text-emerald-500/40">&middot;</span>
                  <span>2:47</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* PR card */}
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-white/[0.03] border border-white/[0.04]">
                    <svg className="w-4 h-4 text-violet-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>
                    <div className="min-w-0">
                      <div className="text-[12px] text-white/80 font-medium">Pull Request #5</div>
                      <div className="text-[10px] text-white/30 truncate">feat/dark-mode-toggle</div>
                    </div>
                  </div>
                  {/* Run button */}
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-medium shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Run
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ── Three capability cards ── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {CAPABILITIES.map((cap) => (
            <motion.div
              key={cap.label}
              className="relative group"
              variants={fadeUp}
            >
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30 p-6 h-full transition-colors hover:bg-[var(--bg-subtle)]/60">
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium mb-4 ${
                  cap.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                  cap.color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-violet-500/10 text-violet-400'
                }`}>
                  {cap.label}
                </div>
                <h3 className="text-[15px] font-medium text-[var(--text)] mb-2">{cap.title}</h3>
                <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">{cap.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Two flow cards — more compact */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <motion.div
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30 px-6 py-5"
            variants={slideFromLeft}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-[var(--text)]">Full Flow</h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">Spec → Review → Develop → PR</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['Describe', 'AI Refines', 'Approve', 'Develop'].map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-[var(--text-tertiary)] text-[10px]">&rarr;</span>}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    i === 0 ? 'bg-purple-500/10 text-purple-400' :
                    i === 1 ? 'bg-violet-500/10 text-violet-400' :
                    i === 2 ? 'bg-amber-500/10 text-amber-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>{step}</span>
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30 px-6 py-5"
            variants={slideFromRight}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-[var(--text)]">Quick Flow</h3>
                <p className="text-[10px] text-[var(--text-tertiary)]">Describe → Implement → Review PR</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['Describe change', 'AI Implements', 'Review PR'].map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-[var(--text-tertiary)] text-[10px]">&rarr;</span>}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    i === 0 ? 'bg-blue-500/10 text-blue-400' :
                    i === 1 ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>{step}</span>
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Mock sub-components for the session visualization ── */

function MockProgressDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function MockMessage({ content, delay }: { content: string; delay: number }) {
  return (
    <motion.div
      className="flex gap-3"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.3, duration: 0.5 }}
      viewport={viewportConfig}
    >
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/[0.06] shrink-0 mt-0.5 flex items-center justify-center">
        <span className="text-[8px]">&#10024;</span>
      </div>
      <p className="text-[12px] text-white/60 leading-relaxed">{content}</p>
    </motion.div>
  );
}

function MockToolGroup({ tools, delay }: {
  tools: Array<{ icon: string; name: string; badge?: string; status: 'done' | 'active' }>;
  delay: number;
}) {
  return (
    <motion.div
      className="ml-8 space-y-1"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ delay: delay + 0.3, duration: 0.4 }}
      viewport={viewportConfig}
    >
      {tools.map((tool, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <span className="text-white/20">{tool.icon}</span>
          <span className="text-white/40 font-mono">{tool.name}</span>
          {tool.badge && (
            <span className={`px-1.5 py-px rounded text-[9px] font-medium ${
              tool.badge === 'new' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
            }`}>{tool.badge}</span>
          )}
          <span className="ml-auto">
            {tool.status === 'done' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 inline-block" />
            ) : (
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </span>
        </div>
      ))}
    </motion.div>
  );
}
