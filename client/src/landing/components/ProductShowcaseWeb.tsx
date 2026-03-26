'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  slideFromLeft,
  slideFromRight,
  viewportConfig,
} from '@/landing/lib/motion-variants';

export function ProductShowcaseWeb() {
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
            <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-4">
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
                Drag-and-drop ticket management with status tracking
              </li>
              <li className="flex items-start gap-3 text-[var(--text-secondary)]" style={{ fontSize: 'var(--landing-body)' }}>
                <span className="text-emerald-400 mt-0.5 shrink-0">&#10003;</span>
                Developer review and PM approval workflow built in
              </li>
            </ul>
          </motion.div>

          {/* Screenshot — right 60% */}
          <motion.div
            className="md:col-span-7 relative"
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {/* Emerald glow behind */}
            <div
              className="absolute -inset-16 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, var(--glow-accent) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            <motion.div
              className="relative rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
              style={{
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                transform: 'perspective(2000px) rotateY(-3deg) rotateX(2deg)',
              }}
            >
              <Image
                src="/images/aec-screenshot.png"
                alt="Forge web app showing an AI-enriched ticket spec with problem statement, acceptance criteria, and quality score"
                width={1920}
                height={1080}
                className="w-full h-auto"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
