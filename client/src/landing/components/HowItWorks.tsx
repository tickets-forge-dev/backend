'use client';

import { motion } from 'framer-motion';
import {
  fadeUp,
  slideFromLeft,
  staggerContainer,
  viewportConfig,
} from '@/landing/lib/motion-variants';

const STEPS = [
  {
    number: '1',
    title: 'Describe',
    subtitle: 'What you want built — rough idea, Slack message, anything.',
    dotColor: 'bg-purple-400',
    borderColor: 'border-purple-400/30',
  },
  {
    number: '2',
    title: 'AI Refines',
    subtitle:
      'Forge asks smart questions, fills in technical gaps, and structures the spec.',
    dotColor: 'bg-violet-400',
    borderColor: 'border-violet-400/30',
  },
  {
    number: '3',
    title: 'Approve',
    subtitle:
      'Review the complete spec. Assigns developer automatically. Tracks SLA.',
    dotColor: 'bg-amber-400',
    borderColor: 'border-amber-400/30',
  },
  {
    number: '4',
    title: 'Develop',
    subtitle:
      'Click Develop — AI implements in a cloud sandbox, runs tests, and opens a PR. You review the code, not write it.',
    dotColor: 'bg-emerald-400',
    borderColor: 'border-emerald-400/30',
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
          <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-4">
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

        {/* Vertical timeline */}
        <motion.div
          className="relative max-w-xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {/* Timeline line */}
          <div
            className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--border-subtle)]"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-10">
            {STEPS.map((step) => (
              <motion.div
                key={step.number}
                className="relative flex items-start gap-6 pl-1"
                variants={slideFromLeft}
              >
                {/* Dot on timeline */}
                <div className="relative z-10 flex items-center justify-center w-[30px] h-[30px] shrink-0">
                  <div
                    className={`w-3 h-3 rounded-full ${step.dotColor}`}
                  />
                </div>

                {/* Content */}
                <div className={`pb-0 border-l-2 ${step.borderColor} pl-5`}>
                  <h3 className="font-medium text-[var(--text)] text-lg mb-1">
                    {step.title}
                  </h3>
                  <p
                    className="text-[var(--text-secondary)] leading-relaxed"
                    style={{ fontSize: 'var(--landing-body)' }}
                  >
                    {step.subtitle}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
