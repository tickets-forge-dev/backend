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
      className="relative flex flex-col items-center px-4 overflow-hidden"
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
      }}
    >
      {/* Background glows with subtle drift animation */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px]"
          animate={{
            x: ['-50%', '-47%', '-53%', '-50%'],
            y: [0, -10, 5, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[600px] h-[400px]"
          animate={{
            x: [0, 15, -10, 0],
            y: [0, 10, -5, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            background:
              'radial-gradient(ellipse at 80% 100%, rgba(16,185,129,0.06) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Hero text — left-aligned, massive title like Linear */}
      <div className="relative w-full max-w-6xl self-start px-4 sm:px-8">
        {/* Headline — massive */}
        <motion.h1
          className="text-[var(--text)] font-medium tracking-[-0.04em] max-w-4xl"
          style={{ fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.05 }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ ...defaultTransition, delay: 0.1 }}
        >
          Dev-ready tickets.
          <br />
          Every single time.
        </motion.h1>

        {/* Subtitle — small, muted */}
        <motion.p
          className="text-[var(--text-tertiary)] mt-5 mb-8 max-w-lg"
          style={{ fontSize: '15px', lineHeight: 1.5 }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ ...defaultTransition, delay: 0.2 }}
        >
          Purpose-built for turning rough ideas into complete specs. Designed for the AI era.
        </motion.p>

        {/* CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ ...defaultTransition, delay: 0.3 }}
        >
          <a
            href="#how-it-works"
            className="inline-flex items-center text-sm font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById('how-it-works')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            See how it works &rarr;
          </a>
        </motion.div>
      </div>

      {/* Hero Screenshot — stretches edge-to-edge */}
      <motion.div
        className="relative w-[100vw] -mx-4 mt-16 px-2"
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
