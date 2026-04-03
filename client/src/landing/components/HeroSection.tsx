'use client';

import { motion } from 'framer-motion';
import {
  fadeUp,
  scaleUp,
  defaultTransition,
  heroTransition,
} from '@/landing/lib/motion-variants';
import { InteractiveDemo } from './demo/InteractiveDemo';

export function HeroSection() {
  return (
    <section
      className="relative flex flex-col items-center px-4 overflow-x-hidden overflow-hidden pt-12 sm:pt-16 pb-10 sm:pb-14"
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

      {/* Hero text — centered */}
      <div className="relative w-full max-w-4xl text-center px-4 sm:px-8">
        {/* Headline */}
        <motion.h1
          className="text-[var(--text)] font-medium tracking-[-0.03em]"
          style={{ fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.1 }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ ...defaultTransition, delay: 0.1 }}
        >
          Tickets PMs love.
          <br />
          That devs actually understand.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-[var(--text-tertiary)] mt-4 mb-6 mx-auto max-w-lg"
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

      {/* Interactive Demo */}
      <div className="relative w-full max-w-[1180px] mt-8 sm:mt-10 px-4 sm:px-8">
        <motion.div
          variants={scaleUp}
          initial="hidden"
          animate="visible"
          transition={{ ...heroTransition, delay: 0.5 }}
        >
          <InteractiveDemo />
        </motion.div>
      </div>
    </section>
  );
}
