'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { CopyCommand } from '@/core/components/CopyCommand';
import {
  slideFromLeft,
  slideFromRight,
  viewportConfig,
} from '@/landing/lib/motion-variants';

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
          {/* Screenshot — left 60% */}
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
              className="relative rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
              style={{
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                transform: 'perspective(2000px) rotateY(3deg) rotateX(2deg)',
              }}
            >
              <Image
                src="/images/cli-screenshot.png"
                alt="Forge CLI integration with Claude Code showing ticket list and review commands"
                width={1920}
                height={1080}
                className="w-full h-auto"
              />
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
                <span className="text-indigo-400 mt-0.5 shrink-0">&#10003;</span>
                Browse and claim tickets from Claude Code or your terminal
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-indigo-400 mt-0.5 shrink-0">&#10003;</span>
                Full codebase context included — file paths, APIs, patterns
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-indigo-400 mt-0.5 shrink-0">&#10003;</span>
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
