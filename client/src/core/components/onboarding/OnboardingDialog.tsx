'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { useUIStore } from '@/stores/ui.store';
import { useSettingsStore } from '@/stores/settings.store';
import { GitHubIntegration } from '@/src/settings/components/GitHubIntegration';
import { Github, SearchCode, FileCheck2, ArrowRight, Rocket } from 'lucide-react';

const STEPS = [
  { id: 0, label: 'Welcome' },
  { id: 1, label: 'Why Connect' },
  { id: 2, label: 'Connect' },
] as const;

export function OnboardingDialog() {
  const { onboardingCompleted, completeOnboarding } = useUIStore();
  const githubConnected = useSettingsStore((s) => s.githubConnected);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  // On mount: check if returning from OAuth redirect during onboarding
  useEffect(() => {
    if (onboardingCompleted) return;

    const params = new URLSearchParams(window.location.search);
    const oauthOrigin = localStorage.getItem('forge-oauth-origin');

    if (params.get('connected') === 'true' && oauthOrigin === 'onboarding') {
      // Returning from GitHub OAuth — jump to Connect step
      localStorage.removeItem('forge-oauth-origin');
      window.history.replaceState({}, '', window.location.pathname);
      setStep(2);
      setOpen(true);
    } else if (params.get('error') && oauthOrigin === 'onboarding') {
      // OAuth failed — reopen at Connect step
      localStorage.removeItem('forge-oauth-origin');
      window.history.replaceState({}, '', window.location.pathname);
      setStep(2);
      setOpen(true);
    } else {
      // Normal onboarding open
      const timer = setTimeout(() => setOpen(true), 300);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
    setOpen(false);
  }, [completeOnboarding]);

  const handleComplete = useCallback(() => {
    completeOnboarding();
    setOpen(false);
  }, [completeOnboarding]);

  // Called right before GitHub OAuth redirect starts
  const handleBeforeConnect = useCallback(() => {
    localStorage.setItem('forge-oauth-origin', 'onboarding');
  }, []);

  const handleNext = useCallback(() => {
    if (step < 2) setStep((s) => s + 1);
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  if (onboardingCompleted) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl p-0 gap-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Onboarding</DialogTitle>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-6">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: s.id === step ? 24 : 8,
                backgroundColor: s.id === step ? 'var(--purple)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {/* Step 1: Welcome */}
            <div className="w-full flex-shrink-0 px-8 py-10 text-center">
              <div className="flex justify-center mb-6">
                <img
                  src="/forge-icon.png"
                  alt="Forge"
                  width={64}
                  height={64}
                  className="rounded-2xl"
                />
              </div>
              <h2 className="text-[20px] font-semibold text-[var(--text)] tracking-tight mb-3">
                Welcome to Forge
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] max-w-[400px] mx-auto leading-relaxed">
                Transform product intent into execution-ready engineering tickets.
                Let's get you set up in a few quick steps.
              </p>
            </div>

            {/* Step 2: How it works — vertical steps */}
            <div className="w-full flex-shrink-0 px-8 py-10">
              <h2 className="text-[20px] font-semibold text-[var(--text)] tracking-tight mb-2 text-center">
                How It Works
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] text-center mb-8 max-w-[400px] mx-auto leading-relaxed">
                From idea to tracked ticket in minutes
              </p>

              <div className="max-w-[480px] mx-auto space-y-0">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-9 w-9 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
                      <Github className="h-[18px] w-[18px] text-[var(--purple)]" />
                    </div>
                    <div className="w-px flex-1 bg-[var(--border)] my-2" />
                  </div>
                  <div className="pb-6">
                    <p className="text-[13px] font-medium text-[var(--text)] mb-1">Connect & Describe</p>
                    <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                      Link your GitHub repo and describe what you need. Forge reads your codebase — stack, patterns, architecture — so the AI starts with full context.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-9 w-9 rounded-lg bg-[var(--blue)]/10 flex items-center justify-center flex-shrink-0">
                      <SearchCode className="h-[18px] w-[18px] text-[var(--blue)]" />
                    </div>
                    <div className="w-px flex-1 bg-[var(--border)] my-2" />
                  </div>
                  <div className="pb-6">
                    <p className="text-[13px] font-medium text-[var(--text)] mb-1">Deep Analysis</p>
                    <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                      AI analyzes your task against the actual code. It detects which files and APIs will be involved, understands backend vs. client boundaries, and identifies existing patterns to follow.
                    </p>
                  </div>
                </div>

                {/* Step 3 — the big one */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-9 w-9 rounded-lg bg-[var(--green)]/10 flex items-center justify-center flex-shrink-0">
                      <FileCheck2 className="h-[18px] w-[18px] text-[var(--green)]" />
                    </div>
                    <div className="w-px flex-1 bg-[var(--border)] my-2" />
                  </div>
                  <div className="pb-6">
                    <p className="text-[13px] font-medium text-[var(--text)] mb-1">Developer-Ready Output</p>
                    <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed mb-3">
                      You get a complete engineering contract, not a vague ticket:
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {[
                        'Tech spec (Markdown)',
                        'Acceptance criteria',
                        'Files & APIs to change',
                        'Backend / client split',
                        'Test plan',
                        'Attach designs & assets',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-1.5">
                          <ArrowRight className="h-3 w-3 text-[var(--green)] flex-shrink-0" />
                          <span className="text-[12px] text-[var(--text-secondary)]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 4 — Deploy & Track */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-9 w-9 rounded-lg bg-[var(--amber)]/10 flex items-center justify-center flex-shrink-0">
                      <Rocket className="h-[18px] w-[18px] text-[var(--amber)]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[var(--text)] mb-1">Deploy & Stay in Sync</p>
                    <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                      Push tickets straight to Linear or Jira. As commits land, Forge updates the ticket automatically and notifies you — progress, status, and remaining work stay current without manual effort.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: GitHub Integration */}
            <div className="w-full flex-shrink-0 px-8 py-10">
              <h2 className="text-[20px] font-semibold text-[var(--text)] tracking-tight mb-2 text-center">
                Connect Your Repository
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] text-center mb-6 max-w-[440px] mx-auto leading-relaxed">
                Grant read-only access so the AI can analyze your codebase. You can also do this later in Settings.
              </p>
              <GitHubIntegration onBeforeConnect={handleBeforeConnect} />
            </div>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-[var(--border)]">
          <Button variant="ghost" onClick={handleSkip} className="text-[var(--text-tertiary)]">
            {step === 2 && !githubConnected ? 'Skip for now' : 'Skip'}
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && !githubConnected && (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                {githubConnected ? "Let's begin" : 'Skip & Start'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
