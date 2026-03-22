'use client';

import { useState, useRef } from 'react';

export function ComingSoonTeaser() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    // TODO: POST to /api/waitlist or write to Firestore
    setSubmitted(true);
  }

  return (
    <section className="py-24 border-b border-[var(--border-subtle)]">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Teaser card with accent border */}
        <div className="relative rounded-2xl overflow-hidden">
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-amber-500/20 p-[1px]">
            <div className="w-full h-full rounded-2xl bg-[#0c0c0c]" />
          </div>

          {/* Content */}
          <div className="relative px-8 py-12 md:px-12 md:py-16 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-medium text-amber-400 mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
              </span>
              Coming Soon
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              One-click Pull Requests
            </h2>

            <p className="text-[var(--text-secondary)] text-base md:text-lg mb-2 max-w-xl mx-auto">
              Approve a ticket. Click <span className="text-amber-400 font-medium">Develop</span>. Get a PR on your repo — no terminal needed.
            </p>

            <p className="text-[var(--text-tertiary)] text-sm mb-8 max-w-md mx-auto">
              The only platform that generates code for your <em>existing</em> codebase — not a blank slate. Built for brownfield.
            </p>

            {/* Waitlist form */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 h-11 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-amber-500/40 transition-colors"
                />
                <button
                  type="submit"
                  className="h-11 rounded-lg bg-amber-500 px-6 text-sm font-medium text-black transition-all hover:bg-amber-400 hover:scale-105 active:scale-95 shrink-0"
                >
                  Notify me
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 text-amber-400 text-sm font-medium animate-fade-in">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                You&apos;re on the list. We&apos;ll let you know.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
