'use client';

import { motion } from 'framer-motion';
import { CopyCommand } from '@/core/components/CopyCommand';
import {
  slideFromLeft,
  slideFromRight,
  viewportConfig,
} from '@/landing/lib/motion-variants';

function MockTerminal() {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden bg-[#0a0a0a] font-mono text-[11px] sm:text-[13px] leading-relaxed">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)]">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]/80" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]/80" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]/80" />
        <span className="ml-3 text-[11px] text-[var(--text-tertiary)]">Terminal</span>
      </div>

      {/* Terminal content */}
      <div className="px-3 py-3 sm:px-5 sm:py-5 space-y-4 sm:space-y-5">
        {/* Install */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)]">$</span>
            <span className="text-[var(--text-secondary)]">npm i forge-aec</span>
          </div>
        </div>

        {/* Login */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)]">$</span>
            <span className="text-[var(--text-secondary)]">forge login</span>
          </div>
          <div className="flex items-center gap-2 mt-1 pl-4">
            <span className="text-emerald-500/70">&#10003;</span>
            <span className="text-[var(--text-tertiary)]">Logged in as dan@forge.dev</span>
          </div>
        </div>

        {/* List */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)]">$</span>
            <span className="text-[var(--text-secondary)]">forge tickets</span>
          </div>
          <div className="mt-2 space-y-1.5 pl-2 sm:pl-4 overflow-x-auto">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="text-[var(--text-tertiary)] w-6 sm:w-8 text-right shrink-0">#12</span>
              <span className="text-[var(--text-secondary)] flex-1 truncate">Add SSO login with Google OAuth</span>
              <span className="text-[var(--text-tertiary)] text-[10px] sm:text-[11px] shrink-0">Ready</span>
              <span className="text-[var(--text-tertiary)] text-[10px] sm:text-[11px] w-6 sm:w-8 text-right shrink-0">92%</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="text-[var(--text-tertiary)] w-6 sm:w-8 text-right shrink-0">#11</span>
              <span className="text-[var(--text-secondary)] flex-1 truncate">Fix session expiry not redirecting</span>
              <span className="text-[var(--text-tertiary)] text-[10px] sm:text-[11px] shrink-0">Ready</span>
              <span className="text-[var(--text-tertiary)] text-[10px] sm:text-[11px] w-6 sm:w-8 text-right shrink-0">95%</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <span className="text-[var(--text-tertiary)] w-6 sm:w-8 text-right shrink-0">#8</span>
              <span className="text-[var(--text-secondary)] flex-1 truncate">Add webhook events for status changes</span>
              <span className="text-[var(--text-tertiary)] text-[10px] sm:text-[11px] shrink-0">Define</span>
              <span className="text-[var(--text-tertiary)] text-[10px] sm:text-[11px] w-6 sm:w-8 text-right shrink-0">0%</span>
            </div>
          </div>
        </div>

        {/* Develop */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)]">$</span>
            <span className="text-[var(--text-secondary)]">forge develop #12</span>
          </div>
          <div className="mt-1 pl-4 space-y-0.5">
            <p className="text-[var(--text-tertiary)]">&#8594; Pulling spec&hellip; creating branch feat/sso-login&hellip;</p>
            <p className="text-[var(--text-tertiary)]">&#8594; 6 files affected &middot; 3 endpoints &middot; 6 acceptance criteria</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="emerald-500/70">&#10003;</span>
              <span className="text-[var(--text-tertiary)]">Ready to implement. Run your AI coding agent.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductShowcaseCLI() {
  return (
    <section
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          {/* Mock terminal — left 60% */}
          <motion.div
            className="md:col-span-7 relative order-2 md:order-1"
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {/* Indigo glow behind */}
            <div
              className="absolute -inset-16 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, var(--glow-primary) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            <motion.div
              className="relative md:[transform:perspective(2000px)_rotateY(3deg)_rotateX(2deg)]"
              style={{
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              }}
            >
              <MockTerminal />
            </motion.div>
          </motion.div>

          {/* Text — right 40% */}
          <motion.div
            className="md:col-span-5 order-1 md:order-2"
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-4">
              DEVELOPER TOOLS
            </p>
            <h2
              className="font-medium tracking-[-0.025em] text-[var(--text)] mb-6"
              style={{ fontSize: 'var(--landing-heading)' }}
            >
              Pick up tickets without leaving your IDE
            </h2>
            <ul className="flex flex-col gap-3 mb-6">
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-[var(--text-tertiary)] mt-0.5 shrink-0">&#10003;</span>
                Browse and claim tickets from Claude Code or your terminal
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-[var(--text-tertiary)] mt-0.5 shrink-0">&#10003;</span>
                Full codebase context included — file paths, APIs, patterns
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-[var(--text-tertiary)] mt-0.5 shrink-0">&#10003;</span>
                MCP bridge for two-way sync between IDE and Forge
              </li>
            </ul>
            <CopyCommand command="npm i forge-aec" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
