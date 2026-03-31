'use client';

import { useState, useEffect } from 'react';
import { Zap, GitPullRequest, ArrowRight, X } from 'lucide-react';

const STORAGE_KEY = 'forge:flow-onboarding-seen';

export function FlowOnboardingDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show once per user
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] animate-fade-in"
        onClick={dismiss}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-md bg-[var(--bg)] border border-[var(--border-subtle)] rounded-xl pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="px-6 pt-6 pb-2">
            <p className="text-[13px] font-semibold text-[var(--text)]">
              Two ways to work
            </p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
              Choose the flow that fits your task.
            </p>
          </div>

          <div className="px-6 pb-2 space-y-3">
            {/* Quick flow */}
            <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 shrink-0">
                  <Zap className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[var(--text)]">
                    Quick flow
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                    Hit Develop and go. Best for bug fixes, small features, and when you know exactly what you want.
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-2">
                    Develop → Review → Done
                  </p>
                </div>
              </div>
            </div>

            {/* Full flow */}
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-hover)] shrink-0">
                  <GitPullRequest className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[var(--text)]">
                    Full flow
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                    Best for complex features where your team needs to align before code is written.
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-2">
                    Review → Assign → Refine → Approve → Develop → Done
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4">
            <button
              onClick={dismiss}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text)] text-[12px] font-medium transition-colors"
            >
              Got it
              <ArrowRight className="w-3.5 h-3.5 opacity-50" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
