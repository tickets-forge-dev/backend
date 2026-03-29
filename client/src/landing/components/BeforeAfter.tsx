'use client';

import { motion } from 'framer-motion';
import {
  fadeUp,
  slideFromLeft,
  slideFromRight,
  viewportConfig,
} from '@/landing/lib/motion-variants';

const slackMessages = [
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'hey can you pick up the login ticket?', time: '10:23 AM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: 'which login ticket?', time: '10:24 AM' },
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'the one for adding social login', time: '10:25 AM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: 'google only or also github?', time: '10:31 AM' },
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'both I think? check with design', time: '10:34 AM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: "where's the design?", time: '10:35 AM' },
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'not sure, ask Sarah', time: '10:41 AM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: 'also — existing auth table or new one?', time: '10:52 AM' },
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'whatever makes sense', time: '11:06 AM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: '...', time: '1:14 PM', subtle: true },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: 'built it with Google only, separate table', time: '1:15 PM' },
  { name: 'Alex', initials: 'AP', color: '#e87461', text: 'wait we needed GitHub too, and auth table already has a provider column', time: '1:16 PM' },
  { name: 'Jordan', initials: 'JR', color: '#4a9eff', text: '\u{1F643}', time: '1:16 PM' },
] satisfies { name: string; initials: string; color: string; text: string; time: string; subtle?: boolean }[];

const specSections = {
  title: 'Add Social Login (Google + GitHub)',
  criteria: [
    'Users can sign in with Google or GitHub OAuth',
    'New provider entries use existing auth_providers table',
    'Graceful fallback if OAuth provider is unavailable',
  ],
  files: ['src/auth/providers/', 'src/auth/models/User.ts', 'src/auth/auth.module.ts'],
  steps: [
    'Add Google & GitHub strategy to OAuthProviderFactory',
    'Extend auth_providers table with provider-specific metadata',
    'Add OAuth callback routes and token exchange flow',
  ],
};

export function BeforeAfter() {
  return (
    <section
      style={{
        paddingTop: 'var(--landing-section-gap)',
        paddingBottom: 'var(--landing-section-gap)',
        backgroundColor: 'var(--bg-gradient-end)',
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
            BEFORE &amp; AFTER
          </p>
          <h2
            className="font-medium tracking-[-0.025em] text-[var(--text)]"
            style={{
              fontSize: 'var(--landing-heading)',
              marginBottom: 'var(--landing-optical-tighten)',
            }}
          >
            Sound familiar?
          </h2>
          <p
            className="text-[var(--text-secondary)] max-w-xl mx-auto"
            style={{ fontSize: 'var(--landing-subtitle)' }}
          >
            Forge replaces hours of back-and-forth with a single, dev-ready spec.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left — Before: Slack Thread */}
          <motion.div
            className="flex flex-col gap-3"
            variants={slideFromLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {/* Subtle red glow */}
            <div className="relative">
              <div
                className="absolute -inset-10 pointer-events-none"
                aria-hidden="true"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.06) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                }}
              />
              <div className="relative rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                {/* Slack header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]">
                  <span className="text-sm font-medium text-[var(--text)]"># dev-backend</span>
                  <span className="ml-auto flex h-2 w-2 rounded-full bg-red-400/80" />
                </div>

                {/* Messages */}
                <div className="px-4 py-3 flex flex-col gap-2.5 max-h-[420px] overflow-y-auto">
                  {slackMessages.map((msg, i) => {
                    const prevMsg = i > 0 ? slackMessages[i - 1] : null;
                    const isTimeSeparator =
                      msg.time === '1:14 PM' && prevMsg?.time === '11:06 AM';
                    return (
                      <div key={i}>
                        {isTimeSeparator && (
                          <div className="flex items-center gap-3 my-2">
                            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                            <span className="text-[10px] text-[var(--text-tertiary)] font-medium px-2">
                              2 hours later
                            </span>
                            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                          </div>
                        )}
                        <div className="flex items-start gap-2.5">
                          <div
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium text-white shrink-0 mt-0.5"
                            style={{ backgroundColor: msg.color }}
                          >
                            {msg.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-medium text-[var(--text)]">
                                {msg.name}
                              </span>
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                {msg.time}
                              </span>
                            </div>
                            <p
                              className={`text-sm leading-relaxed ${
                                msg.subtle
                                  ? 'text-[var(--text-tertiary)]'
                                  : 'text-[var(--text-secondary)]'
                              }`}
                            >
                              {msg.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Before label */}
            <div className="flex items-center gap-2 px-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-red-500/20 text-red-400 bg-red-500/5">
                Before
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                3 hours wasted. Wrong implementation.
              </span>
            </div>
          </motion.div>

          {/* Right — After: Forge Spec */}
          <motion.div
            className="flex flex-col gap-3"
            variants={slideFromRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
          >
            {/* Subtle emerald glow */}
            <div className="relative">
              <div
                className="absolute -inset-10 pointer-events-none"
                aria-hidden="true"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.06) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                }}
              />
              <div className="relative rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                {/* Spec header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]">
                  <span className="text-sm font-medium text-[var(--text)]">
                    Forge Spec
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    95 / 100
                  </span>
                </div>

                {/* Spec content */}
                <div className="px-4 py-4 flex flex-col gap-4">
                  <div>
                    <h4 className="text-base font-medium text-[var(--text)] mb-1">
                      {specSections.title}
                    </h4>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                        feature
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                        auth
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-2">
                      Acceptance Criteria
                    </h5>
                    <ul className="flex flex-col gap-1.5">
                      {specSections.criteria.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <span className="text-emerald-400 mt-0.5 shrink-0">
                            &#10003;
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-2">
                      Relevant Files
                    </h5>
                    <div className="flex flex-col gap-1">
                      {specSections.files.map((file, i) => (
                        <code
                          key={i}
                          className="text-[10px] sm:text-xs text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-2 py-1 rounded border border-[var(--border-subtle)] font-mono w-fit max-w-full truncate"
                        >
                          {file}
                        </code>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] mb-2">
                      Implementation Plan
                    </h5>
                    <ol className="flex flex-col gap-1.5">
                      {specSections.steps.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                        >
                          <span className="text-[var(--text-tertiary)] font-mono text-xs mt-0.5 shrink-0">
                            {i + 1}.
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* After label */}
            <div className="flex items-center gap-2 px-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                After
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                15 minutes. Aligned before coding starts.
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
