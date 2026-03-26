'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  fadeUp,
  scaleUp,
  defaultTransition,
  heroTransition,
} from '@/landing/lib/motion-variants';

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Parallax: screenshot tilt flattens as user scrolls
  const rotateX = useTransform(scrollYProgress, [0, 1], [5, 0]);
  const screenshotY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center text-center px-4 overflow-hidden"
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
      }}
    >
      {/* Background glows — opacities intentionally lower than design tokens,
          these are hero-specific decorative accents at reduced intensity */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[400px]"
          style={{
            background:
              'radial-gradient(ellipse at 80% 100%, rgba(16,185,129,0.06) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Badge */}
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--border-subtle)] text-[var(--text-tertiary)] bg-[var(--bg-subtle)] font-mono text-[11px] uppercase tracking-[0.05em]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          AI-powered ticket specs
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        className="relative text-[var(--text)] font-medium tracking-[-0.03em] mb-2 max-w-3xl"
        style={{ fontSize: 'var(--landing-hero)', lineHeight: 1.1 }}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ ...defaultTransition, delay: 0.1 }}
      >
        Dev-ready tickets.
        <br />
        Every single time.
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="relative text-[var(--text-secondary)] mb-8 max-w-lg leading-relaxed mx-auto"
        style={{
          fontSize: 'var(--landing-subtitle)',
          marginTop: 'var(--landing-optical-tighten)',
        }}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ ...defaultTransition, delay: 0.2 }}
      >
        PMs miss technical context. Forge doesn&apos;t. Dev-ready tickets from
        rough ideas, in minutes.
      </motion.p>

      {/* CTAs */}
      <motion.div
        className="relative flex items-center gap-4"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ ...defaultTransition, delay: 0.3 }}
      >
        <Link
          href="/tickets"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-7 text-sm font-medium text-white transition-all hover:bg-emerald-500 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)] active:scale-[0.97]"
        >
          Get Started
        </Link>
        <a
          href="#how-it-works"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border-subtle)] px-7 text-sm font-medium text-[var(--text-secondary)] transition-all hover:text-[var(--text)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-subtle)]"
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById('how-it-works')
              ?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          See how it works
        </a>
      </motion.div>

      {/* Hero Screenshot */}
      <motion.div
        className="relative w-full max-w-5xl mt-16"
        variants={scaleUp}
        initial="hidden"
        animate="visible"
        transition={{ ...heroTransition, delay: 0.5 }}
        style={{ y: screenshotY, perspective: '2000px' }}
      >
        {/* Ambient glow behind screenshot */}
        <div
          className="absolute -inset-20 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse at 50% 60%, rgba(16,185,129,0.12) 0%, rgba(99,102,241,0.06) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <motion.div
          className="relative rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
          style={{
            rotateX,
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          }}
        >
          <Image
            src="/images/ticket-screenshot.png"
            alt="Forge ticket management interface showing AI-enriched tickets with quality scores"
            width={1920}
            height={1080}
            priority
            className="w-full h-auto"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
