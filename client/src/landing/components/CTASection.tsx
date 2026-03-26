'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeUp, viewportConfig } from '@/landing/lib/motion-variants';

export function CTASection() {
  return (
    <section
      className="relative"
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.10) 0%, rgba(99,102,241,0.06) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <motion.div
        className="relative container mx-auto px-4 max-w-3xl text-center"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        <h2
          className="font-medium tracking-[-0.025em] text-[var(--text)] mb-4"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}
        >
          Stop wasting time on bad tickets
        </h2>
        <p
          className="text-[var(--text-secondary)] mb-8"
          style={{ fontSize: 'var(--landing-subtitle)' }}
        >
          Forge your first ticket in minutes. Free forever for individuals.
        </p>
        <Link
          href="/tickets"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-emerald-600 px-8 text-base font-medium text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] active:scale-[0.97]"
        >
          Try Forge Free
        </Link>
      </motion.div>
    </section>
  );
}
