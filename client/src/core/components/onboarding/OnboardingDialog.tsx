'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { useUIStore } from '@/stores/ui.store';
import { useSettingsStore } from '@/stores/settings.store';
import { GitHubIntegration } from '@/src/settings/components/GitHubIntegration';
import { Github, SearchCode, FileCheck2, ArrowRight, Rocket, Shield, ChevronDown, Trello, Video, Palette, Check } from 'lucide-react';
import { ForgeBrand } from '@/core/components/ForgeBrand';

const STEPS = [
  { id: 0, label: 'Welcome' },
  { id: 1, label: 'Why Connect' },
  { id: 2, label: 'Integrations' },
  { id: 3, label: 'Connect' },
] as const;

function PrivacyNote() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-5 max-w-[480px] mx-auto">
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        <Shield className="h-3.5 w-3.5 text-[var(--primary)] flex-shrink-0" />
        <p className="text-[12px] leading-relaxed">
          We never clone your repository. Your code stays on GitHub.
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-0.5 flex-shrink-0"
        >
          {expanded ? 'Less' : 'More'}
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {expanded && (
        <div className="mt-3 rounded-lg bg-[var(--bg-subtle)] p-4 text-[12px] text-[var(--text-tertiary)] leading-relaxed space-y-2">
          <p>
            Forge uses the GitHub API to read your repository&apos;s file tree and selected source files — the same way you browse code on github.com. We request <strong className="text-[var(--text-secondary)]">read-only</strong> access and never write, push, or clone anything.
          </p>
          <p>
            During analysis, the AI reads config files and a small set of source files (10-25) to understand your stack, patterns, and architecture. File contents are processed in-memory and never stored on disk.
          </p>
          <p>
            You can disconnect at any time from Settings and we&apos;ll revoke all access immediately.
          </p>
        </div>
      )}
    </div>
  );
}

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
      setStep(3);
      setOpen(true);
    } else if (params.get('error') && oauthOrigin === 'onboarding') {
      // OAuth failed — reopen at Connect step
      localStorage.removeItem('forge-oauth-origin');
      window.history.replaceState({}, '', window.location.pathname);
      setStep(3);
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
    if (step < 3) setStep((s) => s + 1);
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
        <div className="relative overflow-hidden max-h-[75vh] overflow-y-auto">
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
              <h2 className="text-[22px] font-bold text-[var(--text)] tracking-tight mb-3">
                Welcome to <ForgeBrand size="sm" />
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] max-w-[400px] mx-auto leading-relaxed">
                Modern ticketing for teams that ship.
                Let&apos;s get you set up in a few quick steps.
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

            {/* Step 3: Integrations Overview */}
            <div className="w-full flex-shrink-0 px-8 py-10">
              <h2 className="text-[20px] font-semibold text-[var(--text)] tracking-tight mb-2 text-center">
                Available Integrations
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] text-center mb-8 max-w-[460px] mx-auto leading-relaxed">
                Connect the tools you use. All integrations are <span className="font-medium text-[var(--text)]">optional</span> and can be set up anytime.
              </p>

              <div className="max-w-[540px] mx-auto space-y-4">
                {/* GitHub - Required for core functionality */}
                <div className="rounded-lg border-2 border-[var(--purple)]/30 bg-[var(--purple)]/5 p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Github className="h-4 w-4 text-[var(--purple)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[14px] font-semibold text-[var(--text)]">GitHub</h3>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--purple)]/20 text-[var(--purple)]">RECOMMENDED</span>
                      </div>
                      <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed mb-2">
                        Code analysis and repository context
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-start gap-1.5">
                          <Check className="h-3 w-3 text-[var(--purple)] flex-shrink-0 mt-0.5" />
                          <span className="text-[11px] text-[var(--text-secondary)]">Deep codebase analysis for accurate specs</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Check className="h-3 w-3 text-[var(--purple)] flex-shrink-0 mt-0.5" />
                          <span className="text-[11px] text-[var(--text-secondary)]">Auto-detect tech stack & patterns</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Check className="h-3 w-3 text-[var(--purple)] flex-shrink-0 mt-0.5" />
                          <span className="text-[11px] text-[var(--text-secondary)]">Identify files & APIs to change</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Jira & Linear - Export destinations */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Trello className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-[13px] font-semibold text-[var(--text)]">Jira</h3>
                          <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)]">OPTIONAL</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-tertiary)] leading-snug mb-1.5">
                          Export tickets directly
                        </p>
                        <div className="space-y-0.5">
                          <div className="flex items-start gap-1">
                            <Check className="h-2.5 w-2.5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Push complete specs</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <Check className="h-2.5 w-2.5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Track in your workflow</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="h-7 w-7 rounded-md bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="h-3.5 w-3.5 text-[var(--purple)]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-[13px] font-semibold text-[var(--text)]">Linear</h3>
                          <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)]">OPTIONAL</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-tertiary)] leading-snug mb-1.5">
                          Export & sync tickets
                        </p>
                        <div className="space-y-0.5">
                          <div className="flex items-start gap-1">
                            <Check className="h-2.5 w-2.5 text-[var(--purple)] flex-shrink-0 mt-0.5" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Two-way sync</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <Check className="h-2.5 w-2.5 text-[var(--purple)] flex-shrink-0 mt-0.5" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Auto-update status</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Figma & Loom - Asset attachments */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="h-7 w-7 rounded-md bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                        <Palette className="h-3.5 w-3.5 text-pink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-[13px] font-semibold text-[var(--text)]">Figma</h3>
                          <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)]">OPTIONAL</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-tertiary)] leading-snug mb-1.5">
                          Attach design specs
                        </p>
                        <div className="space-y-0.5">
                          <div className="flex items-start gap-1">
                            <Check className="h-2.5 w-2.5 text-pink-500 flex-shrink-0 mt-0.5" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Link design files</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <Check className="h-2.5 w-2.5 text-pink-500 flex-shrink-0 mt-0.5" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Extract tokens</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="h-7 w-7 rounded-md bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <Video className="h-3.5 w-3.5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="text-[13px] font-semibold text-[var(--text)]">Loom</h3>
                          <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-tertiary)]">OPTIONAL</span>
                        </div>
                        <p className="text-[11px] text-[var(--text-tertiary)] leading-snug mb-1.5">
                          Video walkthroughs
                        </p>
                        <div className="space-y-0.5">
                          <div className="flex items-start gap-1">
                            <Check className="h-2.5 w-2.5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Record demos</span>
                          </div>
                          <div className="flex items-start gap-1">
                            <Check className="h-2.5 w-2.5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <span className="text-[10px] text-[var(--text-secondary)]">Show expected UX</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-center text-[var(--text-tertiary)] mt-6 max-w-[480px] mx-auto">
                You can connect or disconnect any integration anytime from Settings.
              </p>
            </div>

            {/* Step 4: GitHub Integration */}
            <div className="w-full flex-shrink-0 px-8 py-10">
              <h2 className="text-[20px] font-semibold text-[var(--text)] tracking-tight mb-2 text-center">
                Connect Your Repository
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] text-center mb-6 max-w-[440px] mx-auto leading-relaxed">
                Grant read-only access so the AI can analyze your codebase. You can also do this later in Settings.
              </p>
              <GitHubIntegration onBeforeConnect={handleBeforeConnect} />
              <PrivacyNote />
            </div>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-[var(--border)]">
          <Button variant="ghost" onClick={handleSkip} className="text-[var(--text-tertiary)]">
            {step === 3 && !githubConnected ? 'Skip for now' : 'Skip'}
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && !githubConnected && (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            )}
            {step < 3 ? (
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
