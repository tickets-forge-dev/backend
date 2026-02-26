'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { useUIStore } from '@/stores/ui.store';
import { useSettingsStore } from '@/stores/settings.store';
import { GitHubIntegration } from '@/src/settings/components/GitHubIntegration';
import { CopyCommand } from '@/core/components/CopyCommand';
import { Pencil, MessageCircle, ShieldCheck, FileCode, Globe, Terminal, Shield, ChevronDown } from 'lucide-react';
import { ForgeBrand } from '@/core/components/ForgeBrand';

const STEPS = [
  { id: 0, label: 'Welcome' },
  { id: 1, label: 'Create' },
  { id: 2, label: 'Connect' },
] as const;

function PrivacyNote() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-4 max-w-[480px] mx-auto">
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
        className="max-w-lg max-h-[80vh] p-0 gap-0 overflow-hidden border-none shadow-2xl [&>button]:hidden !top-[50%] !-translate-y-1/2 !flex !flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Onboarding</DialogTitle>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-4">
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

        {/* Step content — only active step is rendered so height fits naturally */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          {step === 0 && (
            <div className="text-center animate-in fade-in duration-200">
              <div className="flex justify-center mb-3">
                <img
                  src="/forge-icon.png"
                  alt="Forge"
                  width={44}
                  height={44}
                  className="rounded-xl"
                />
              </div>
              <h2 className="text-[20px] font-bold text-[var(--text)] tracking-tight mb-1.5">
                Welcome to <ForgeBrand size="sm" />
              </h2>
              <p className="text-[14px] font-medium text-[var(--text-secondary)] mb-1">
                Stop shipping half-baked tickets.
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)] max-w-[380px] mx-auto leading-relaxed mb-5">
                Forge turns ideas into verified execution contracts — specs that developers and AI can execute.
              </p>

              <div className="max-w-[360px] mx-auto text-left space-y-1">
                <div className="flex items-center gap-2.5 rounded-md bg-[var(--bg-subtle)] px-3 py-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--green)] flex-shrink-0" />
                  <span className="text-[12px] font-medium text-[var(--text)]">Acceptance Criteria</span>
                  <span className="text-[11px] text-[var(--text-tertiary)] ml-auto">Given / When / Then</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-md bg-[var(--bg-subtle)] px-3 py-1.5">
                  <FileCode className="h-3.5 w-3.5 text-[var(--blue)] flex-shrink-0" />
                  <span className="text-[12px] font-medium text-[var(--text)]">File Changes</span>
                  <span className="text-[11px] text-[var(--text-tertiary)] ml-auto">Files to create / modify</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-md bg-[var(--bg-subtle)] px-3 py-1.5">
                  <Globe className="h-3.5 w-3.5 text-[var(--purple)] flex-shrink-0" />
                  <span className="text-[12px] font-medium text-[var(--text)]">API Contracts</span>
                  <span className="text-[11px] text-[var(--text-tertiary)] ml-auto">Endpoints, payloads, errors</span>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-in fade-in duration-200">
              <h2 className="text-[18px] font-semibold text-[var(--text)] tracking-tight mb-1 text-center">
                Create Your First Ticket
              </h2>
              <p className="text-[13px] text-[var(--text-secondary)] text-center mb-4 max-w-[360px] mx-auto">
                Describe what you need. AI handles the rest.
              </p>

              <div className="max-w-[360px] mx-auto space-y-0">
                <div className="flex gap-2.5 items-start">
                  <div className="flex flex-col items-center">
                    <div className="h-7 w-7 rounded-md bg-[var(--purple)]/10 flex items-center justify-center flex-shrink-0">
                      <Pencil className="h-3.5 w-3.5 text-[var(--purple)]" />
                    </div>
                    <div className="w-px flex-1 bg-[var(--border)] my-1" />
                  </div>
                  <div className="pb-2 pt-0.5">
                    <p className="text-[12px] font-medium text-[var(--text)]">Describe</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">Write what you need in plain language</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="flex flex-col items-center">
                    <div className="h-7 w-7 rounded-md bg-[var(--blue)]/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-3.5 w-3.5 text-[var(--blue)]" />
                    </div>
                    <div className="w-px flex-1 bg-[var(--border)] my-1" />
                  </div>
                  <div className="pb-2 pt-0.5">
                    <p className="text-[12px] font-medium text-[var(--text)]">Answer</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">AI asks a few targeted questions</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="flex flex-col items-center">
                    <div className="h-7 w-7 rounded-md bg-[var(--green)]/10 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5 text-[var(--green)]" />
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <p className="text-[12px] font-medium text-[var(--text)]">Get your AEC</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">Acceptance criteria, file changes, and API contracts — generated</p>
                  </div>
                </div>
              </div>

              <div className="max-w-[360px] mx-auto mt-4">
                <div className="border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Terminal className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    <p className="text-[12px] font-medium text-[var(--text)]">
                      Then share it with your developer
                    </p>
                  </div>
                  <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                    They install the Forge CLI to review and execute specs with AI assistance.
                  </p>
                  <CopyCommand command="npm install -g @anthropic/forge-cli" />
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5">
                    Developers run <code className="text-[var(--text-secondary)] bg-[var(--bg-subtle)] px-1 py-0.5 rounded text-[10px]">forge review</code> to add code context before you approve.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in duration-200">
              <h2 className="text-[18px] font-semibold text-[var(--text)] tracking-tight mb-1 text-center">
                Connect Your Repository
              </h2>
              <p className="text-[13px] text-[var(--text-secondary)] text-center mb-4 max-w-[380px] mx-auto leading-relaxed">
                Forge reads your codebase for deeper, more accurate specs. Read-only — your code stays on GitHub.
              </p>
              <GitHubIntegration onBeforeConnect={handleBeforeConnect} />
              <PrivacyNote />
              <p className="text-[10px] text-center text-[var(--text-tertiary)] mt-3 max-w-[380px] mx-auto">
                You can also connect Jira, Linear, Figma, and Loom anytime from Settings.
              </p>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-3">
          <Button variant="ghost" onClick={handleSkip} className="text-[var(--text-tertiary)]">
            {step === 2 && !githubConnected ? 'Skip for now' : 'Skip'}
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
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
